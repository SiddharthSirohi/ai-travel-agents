/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Client } from '@googlemaps/google-maps-services-js';
import { generateStructured } from '../../lib/llm-utils';

const googleMapsClient = new Client({});

export const diningTool = createTool({
  id: 'dining-search',
  description: 'Search for restaurants and dining options in a specific location with filters for cuisine type, price range, and ratings',
  inputSchema: z.object({
    location: z.string().describe('The city or area to search for restaurants'),
    cuisine: z.string().optional().describe('Type of cuisine (e.g., Italian, Chinese, Mexican, etc.)'),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Price range from $ (cheap) to $$$$ (expensive)'),
    dietary: z.string().optional().describe('Dietary preference (e.g., vegetarian, vegan, gluten-free)'),
    rating: z.number().min(1).max(5).optional().describe('Minimum rating (1-5 stars)'),
    limit: z.number().min(1).max(20).default(10).describe('Number of restaurants to return (max 20)')
  }),
  outputSchema: z.object({
    restaurants: z.array(z.object({
      name: z.string(),
      cuisine: z.string(),
      rating: z.number(),
      priceRange: z.string(),
      address: z.string(),
      phone: z.string().optional(),
      description: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      placeId: z.string()
    })),
    location: z.string(),
    query: z.string(),
    totalFound: z.number()
  }),
  execute: async ({ context }) => {
    const { location, cuisine, priceRange, rating, limit, dietary } = context;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log(`Searching for restaurants in ${location}...`);
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Using mock data.');
      return getMockRestaurants(context);
    }

    try {
      // Build search query
      const queryParts: string[] = [];
      if (dietary) queryParts.push(dietary);
      if (cuisine) queryParts.push(cuisine);
      queryParts.push('restaurants in', location);
      const query = queryParts.join(' ');

      // Search for places using Google Maps API
      const response = await googleMapsClient.textSearch({
        params: {
          query,
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        console.warn(`Google Maps API error: ${response.data.status}. Using mock data.`);
        return getMockRestaurants(context);
      }

      const places = response.data.results || [];
      const restaurants = [];

      // Process each place
      for (const place of places.slice(0, limit * 2)) { // Get more results to allow for filtering
        const placePriceRange = mapPriceLevel(place.price_level);
        
        // Filter by price range
        if (priceRange && placePriceRange !== priceRange) {
          continue;
        }

        // Filter by rating
        if (rating && place.rating && place.rating < rating) {
          continue;
        }

        // Enhance restaurant data with LLM
        const enhanced = await enhanceRestaurantWithLLM(place);

        restaurants.push({
          name: place.name || 'Unknown Restaurant',
          cuisine: enhanced.cuisine,
          rating: place.rating || 0,
          priceRange: placePriceRange,
          address: place.formatted_address || 'Address not available',
          phone: place.formatted_phone_number || undefined,
          description: enhanced.description,
          specialties: enhanced.specialties,
          placeId: place.place_id || '',
        });

        // Stop when we have enough results
        if (restaurants.length >= limit) {
          break;
        }
      }

      return {
        restaurants,
        location,
        query,
        totalFound: restaurants.length,
      };

    } catch (error) {
      console.error('Google Maps API error:', error);
      return getMockRestaurants(context);
    }
  },
});

// Helper function to map Google Maps price level to our format
function mapPriceLevel(priceLevel?: number): string {
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

// LLM enhancement function using structured generation
async function enhanceRestaurantWithLLM(restaurantData: Record<string, unknown>): Promise<{
  cuisine: string;
  description: string;
  specialties: string[];
}> {
  const schema = z.object({
    cuisine: z.string(),
    description: z.string(),
    specialties: z.array(z.string()).optional(),
  });

  const prompt = `You are a culinary expert. Summarise the following restaurant information into a short JSON object with fields cuisine, description and specialties (3-4 dishes). Return JSON only – no markdown or extra text.

Name: ${(restaurantData as any).name}
Types: ${Array.isArray((restaurantData as any).types) ? (restaurantData as any).types.join(', ') : 'N/A'}
Rating: ${(restaurantData as any).rating || 'N/A'}
Reviews: ${Array.isArray((restaurantData as any).reviews) ? (restaurantData as any).reviews.slice(0, 2).map((r: any) => r.text).join(' | ') : 'N/A'}`;

  const result = await generateStructured(schema, prompt, { temperature: 0.25 });

  if (result) {
    return {
      cuisine: result.cuisine,
      description: result.description,
      specialties: result.specialties || [],
    };
  }

  console.warn('Failed to generate structured enhancement; falling back.');
  return getDefaultEnhancement(restaurantData);
}

// Default enhancement fallback
function getDefaultEnhancement(restaurantData: any): { 
  cuisine: string; 
  description: string; 
  specialties: string[] 
} {
  // Try to extract cuisine from types
  const types = restaurantData.types as string[] || [];
  let cuisine = 'International';
  
  if (types.includes('italian_restaurant')) cuisine = 'Italian';
  else if (types.includes('chinese_restaurant')) cuisine = 'Chinese';
  else if (types.includes('mexican_restaurant')) cuisine = 'Mexican';
  else if (types.includes('japanese_restaurant')) cuisine = 'Japanese';
  else if (types.includes('french_restaurant')) cuisine = 'French';
  else if (types.includes('indian_restaurant')) cuisine = 'Indian';
  
  return {
    cuisine,
    description: `A popular ${cuisine.toLowerCase()} restaurant with great reviews`,
    specialties: [`${cuisine} specialties`, 'Popular dishes', 'Chef recommendations']
  };
}

// Mock data fallback
function getMockRestaurants(context: any) {
  const { location, cuisine, priceRange, rating, limit, dietary } = context;
  
  const mockRestaurants = [
    {
      name: "Bella Vista Italian",
      cuisine: "Italian",
      rating: 4.5,
      priceRange: "$$$",
      address: `123 Main St, ${location}`,
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
      address: `456 Oak Ave, ${location}`,
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
      address: `789 Pine St, ${location}`,
      phone: "(555) 345-6789",
      description: "Fresh Mexican street food and traditional favorites",
      specialties: ["Fish Tacos", "Carnitas", "Guacamole"],
      placeId: "mock-place-id-3"
    },
    {
      name: "Le Petit Bistro",
      cuisine: "French",
      rating: 4.8,
      priceRange: "$$$$",
      address: `321 Elm St, ${location}`,
      phone: "(555) 456-7890",
      description: "Fine French dining with seasonal ingredients",
      specialties: ["Coq au Vin", "Bouillabaisse", "Crème Brûlée"],
      placeId: "mock-place-id-4"
    },
    {
      name: "Sakura Sushi",
      cuisine: "Japanese",
      rating: 4.3,
      priceRange: "$$$",
      address: `654 Maple Dr, ${location}`,
      phone: "(555) 567-8901",
      description: "Fresh sushi and traditional Japanese dishes",
      specialties: ["Omakase", "Ramen", "Tempura"],
      placeId: "mock-place-id-5"
    },
    {
      name: "The Local Grill",
      cuisine: "American",
      rating: 4.1,
      priceRange: "$$",
      address: `987 Cedar Ln, ${location}`,
      phone: "(555) 678-9012",
      description: "Farm-to-table American cuisine with local ingredients",
      specialties: ["Ribeye Steak", "Burger", "Mac and Cheese"],
      placeId: "mock-place-id-6"
    }
  ];

  // Apply filters
  let filteredRestaurants = mockRestaurants;

  if (cuisine) {
    filteredRestaurants = filteredRestaurants.filter(
      restaurant => restaurant.cuisine.toLowerCase().includes(cuisine.toLowerCase())
    );
  }

  if (priceRange) {
    filteredRestaurants = filteredRestaurants.filter(
      restaurant => restaurant.priceRange === priceRange
    );
  }

  if (rating) {
    filteredRestaurants = filteredRestaurants.filter(
      restaurant => restaurant.rating >= rating
    );
  }

  const limitedRestaurants = filteredRestaurants.slice(0, limit);

  const queryParts: string[] = [];
  if (dietary) queryParts.push(dietary);
  if (cuisine) queryParts.push(cuisine);
  queryParts.push('restaurants in', location);
  const query = queryParts.join(' ');

  return {
    restaurants: limitedRestaurants,
    location,
    query,
    totalFound: filteredRestaurants.length
  };
} 