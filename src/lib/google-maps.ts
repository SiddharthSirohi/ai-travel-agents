import { Client, PlaceType1 } from '@googlemaps/google-maps-services-js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface RestaurantSearchParams {
  location: string;
  cuisine?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  rating?: number;
  limit?: number;
}

export interface RestaurantResult {
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  address: string;
  phone?: string;
  description?: string;
  specialties?: string[];
  placeId: string;
}

export interface DetailedRestaurant extends RestaurantResult {
  website?: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  menuHighlights: string[];
  reviews: Array<{
    rating: number;
    comment: string;
    author: string;
  }>;
  reservations: {
    available: boolean;
    phone?: string;
    website?: string;
  };
  features: string[];
}

class GoogleMapsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Using mock data.');
    }
  }

  private mapPriceLevel(priceLevel?: number): string {
    switch (priceLevel) {
      case 0:
      case 1:
        return '$';
      case 2:
        return '$$';
      case 3:
        return '$$$';
      case 4:
        return '$$$$';
      default:
        return '$$';
    }
  }

  private filterByPriceRange(priceLevel: string, targetPriceRange?: string): boolean {
    if (!targetPriceRange) return true;
    return priceLevel === targetPriceRange;
  }

  private async enhanceWithLLM(restaurantData: Record<string, unknown>): Promise<{ cuisine: string; description: string; specialties: string[] }> {
    try {
      const prompt = `Based on the following restaurant information, provide:
1. The cuisine type (e.g., Italian, Chinese, Mexican, etc.)
2. A brief description (1-2 sentences)
3. 3-4 likely menu specialties

Restaurant info:
- Name: ${restaurantData.name}
- Types: ${Array.isArray(restaurantData.types) ? restaurantData.types.join(', ') : 'N/A'}
- Reviews: ${Array.isArray(restaurantData.reviews) ? restaurantData.reviews.slice(0, 3).map((r: Record<string, unknown>) => r.text).join('. ') : 'N/A'}

Please respond in JSON format:
{
  "cuisine": "cuisine type",
  "description": "brief description",
  "specialties": ["specialty1", "specialty2", "specialty3", "specialty4"]
}`;

      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.3,
      });

      try {
        const parsed = JSON.parse(text);
        return {
          cuisine: parsed.cuisine || 'International',
          description: parsed.description || 'A great dining experience',
          specialties: parsed.specialties || []
        };
      } catch (parseError) {
        console.warn('Failed to parse LLM response:', parseError);
        return {
          cuisine: 'International',
          description: 'A great dining experience',
          specialties: []
        };
      }
    } catch (error) {
      console.warn('LLM enhancement failed:', error);
      return {
        cuisine: 'International',
        description: 'A great dining experience',
        specialties: []
      };
    }
  }

  async searchRestaurants(params: RestaurantSearchParams): Promise<{
    restaurants: RestaurantResult[];
    location: string;
    totalFound: number;
  }> {
    if (!this.apiKey) {
      // Return mock data when API key is not available
      return this.getMockRestaurants(params);
    }

    try {
      // Build search query
      let query = `restaurants in ${params.location}`;
      if (params.cuisine) {
        query = `${params.cuisine} ${query}`;
      }

             // Search for places
       const response = await this.client.textSearch({
         params: {
           query,
           key: this.apiKey,
         },
       });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const places = response.data.results || [];
             const restaurants: RestaurantResult[] = [];

      // Process each place
      for (const place of places.slice(0, params.limit || 10)) {
        const priceRange = this.mapPriceLevel(place.price_level);
        
        // Filter by price range
        if (!this.filterByPriceRange(priceRange, params.priceRange)) {
          continue;
        }

        // Filter by rating
        if (params.rating && place.rating && place.rating < params.rating) {
          continue;
        }

        // Enhance with LLM
        const enhanced = await this.enhanceWithLLM(place);

        restaurants.push({
          name: place.name || 'Unknown Restaurant',
          cuisine: enhanced.cuisine,
          rating: place.rating || 0,
          priceRange,
          address: place.formatted_address || 'Address not available',
          phone: place.formatted_phone_number,
          description: enhanced.description,
          specialties: enhanced.specialties,
          placeId: place.place_id || '',
        });

        // Respect the limit
        if (restaurants.length >= (params.limit || 10)) {
          break;
        }
      }

      return {
        restaurants,
        location: params.location,
        totalFound: restaurants.length,
      };
    } catch (error) {
      console.error('Google Maps API error:', error);
      // Fallback to mock data on error
      return this.getMockRestaurants(params);
    }
  }

  async getRestaurantDetails(restaurantName: string, location: string): Promise<DetailedRestaurant> {
    if (!this.apiKey) {
      return this.getMockRestaurantDetails(restaurantName, location);
    }

    try {
      // First, search for the restaurant to get its place_id
      const searchResponse = await this.client.textSearch({
        params: {
          query: `${restaurantName} ${location}`,
          key: this.apiKey,
          type: 'restaurant' as PlaceType1,
        },
      });

      if (searchResponse.data.status !== 'OK' || !searchResponse.data.results?.[0]) {
        throw new Error('Restaurant not found');
      }

      const place = searchResponse.data.results[0];
      const placeId = place.place_id;

      // Get detailed information
      const detailsResponse = await this.client.placeDetails({
        params: {
          place_id: placeId || '', // Add fallback empty string to handle undefined
          key: this.apiKey,
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'rating',
            'price_level',
            'opening_hours',
            'reviews',
            'types',
          ],
        },
      });

      if (detailsResponse.data.status !== 'OK') {
        throw new Error(`Failed to get place details: ${detailsResponse.data.status}`);
      }

      const details = detailsResponse.data.result;
      
      // Enhance with LLM
      const enhanced = await this.enhanceWithLLM(details);

      // Process opening hours
      const hours = this.processOpeningHours(details.opening_hours?.weekday_text);

      // Process reviews
      const reviews = await this.processReviews(details.reviews || []);

      return {
        name: details.name || restaurantName,
        cuisine: enhanced.cuisine,
        rating: details.rating || 0,
        priceRange: this.mapPriceLevel(details.price_level),
        address: details.formatted_address || 'Address not available',
        phone: details.formatted_phone_number,
        website: details.website,
        description: enhanced.description,
        specialties: enhanced.specialties,
        placeId: placeId || '',
        hours,
        menuHighlights: enhanced.specialties,
        reviews,
        reservations: {
          available: !!details.formatted_phone_number,
          phone: details.formatted_phone_number,
          website: details.website,
        },
        features: this.extractFeatures(details.types || []),
      };
    } catch (error) {
      console.error('Failed to get restaurant details:', error);
      return this.getMockRestaurantDetails(restaurantName, location);
    }
  }

  private processOpeningHours(weekdayText?: string[]): DetailedRestaurant['hours'] {
    const defaultHours = {
      monday: 'Hours not available',
      tuesday: 'Hours not available',
      wednesday: 'Hours not available',
      thursday: 'Hours not available',
      friday: 'Hours not available',
      saturday: 'Hours not available',
      sunday: 'Hours not available',
    };

    if (!weekdayText) return defaultHours;

    const daysMap: { [key: string]: keyof DetailedRestaurant['hours'] } = {
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday',
    };

    const hours = { ...defaultHours };

    weekdayText.forEach(dayText => {
      const colonIndex = dayText.indexOf(':');
      if (colonIndex !== -1) {
        const day = dayText.substring(0, colonIndex);
        const time = dayText.substring(colonIndex + 1).trim();
        const mappedDay = daysMap[day];
        if (mappedDay) {
          hours[mappedDay] = time;
        }
      }
    });

    return hours;
  }

  private async processReviews(reviews: any[]): Promise<DetailedRestaurant['reviews']> {
    return reviews.slice(0, 3).map(review => ({
      rating: review.rating || 0,
      comment: review.text || 'No comment available',
      author: review.author_name || 'Anonymous',
    }));
  }

  private extractFeatures(types: string[]): string[] {
    const featureMap: { [key: string]: string } = {
      'meal_takeaway': 'Takeaway available',
      'meal_delivery': 'Delivery available',
      'bar': 'Bar available',
      'night_club': 'Nightlife',
      'lodging': 'Hotel restaurant',
      'tourist_attraction': 'Tourist attraction',
    };

    return types
      .map(type => featureMap[type])
      .filter(Boolean);
  }

  // Mock data fallback methods
  private getMockRestaurants(params: RestaurantSearchParams): {
    restaurants: RestaurantResult[];
    location: string;
    totalFound: number;
  } {
    const mockRestaurants: RestaurantResult[] = [
      {
        name: "Bella Vista Italian",
        cuisine: "Italian",
        rating: 4.5,
        priceRange: "$$$",
        address: `123 Main St, ${params.location}`,
        phone: "(555) 123-4567",
        description: "Authentic Italian cuisine with fresh pasta made daily",
        specialties: ["Carbonara", "Osso Buco", "Tiramisu"],
        placeId: "mock-place-id-1"
      },
      {
        name: "Dragon Palace",
        cuisine: "Chinese",
        rating: 4.2,
        priceRange: "$$",
        address: `456 Oak Ave, ${params.location}`,
        phone: "(555) 234-5678",
        description: "Traditional Chinese dishes with modern presentation",
        specialties: ["Peking Duck", "Dim Sum", "Kung Pao Chicken"],
        placeId: "mock-place-id-2"
      },
      {
        name: "Taco Libre",
        cuisine: "Mexican",
        rating: 4.0,
        priceRange: "$",
        address: `789 Pine St, ${params.location}`,
        phone: "(555) 345-6789",
        description: "Fresh Mexican street food and traditional favorites",
        specialties: ["Fish Tacos", "Carnitas", "Guacamole"],
        placeId: "mock-place-id-3"
      }
    ];

    // Apply filters
    let filteredRestaurants = mockRestaurants;

    if (params.cuisine) {
      filteredRestaurants = filteredRestaurants.filter(
        restaurant => restaurant.cuisine.toLowerCase().includes(params.cuisine!.toLowerCase())
      );
    }

    if (params.priceRange) {
      filteredRestaurants = filteredRestaurants.filter(
        restaurant => restaurant.priceRange === params.priceRange
      );
    }

    if (params.rating) {
      filteredRestaurants = filteredRestaurants.filter(
        restaurant => restaurant.rating >= params.rating!
      );
    }

    const limitedRestaurants = filteredRestaurants.slice(0, params.limit || 10);

    return {
      restaurants: limitedRestaurants,
      location: params.location,
      totalFound: filteredRestaurants.length
    };
  }

  private getMockRestaurantDetails(restaurantName: string, location: string): DetailedRestaurant {
    return {
      name: restaurantName,
      cuisine: "Italian",
      rating: 4.5,
      priceRange: "$$$",
      address: `123 Main Street, ${location}`,
      phone: "(555) 123-4567",
      website: "https://example-restaurant.com",
      description: "Authentic cuisine with fresh ingredients",
      specialties: ["Signature Dish", "Chef's Special", "House Favorite"],
      placeId: "mock-place-id",
      hours: {
        monday: "5:00 PM - 10:00 PM",
        tuesday: "5:00 PM - 10:00 PM",
        wednesday: "5:00 PM - 10:00 PM",
        thursday: "5:00 PM - 10:00 PM",
        friday: "5:00 PM - 11:00 PM",
        saturday: "4:00 PM - 11:00 PM",
        sunday: "4:00 PM - 9:00 PM"
      },
      menuHighlights: ["Signature Dish", "Chef's Special", "House Favorite"],
      reviews: [
        {
          rating: 5,
          comment: "Exceptional food and service!",
          author: "Sarah M."
        },
        {
          rating: 4,
          comment: "Great atmosphere and excellent food.",
          author: "Mike R."
        }
      ],
      reservations: {
        available: true,
        phone: "(555) 123-4567",
        website: "https://example-restaurant.com/reservations"
      },
      features: ["Outdoor seating", "Wine bar", "Parking available"]
    };
  }
}

export const googleMapsService = new GoogleMapsService(); 