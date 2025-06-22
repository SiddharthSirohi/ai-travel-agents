/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { Client } from '@googlemaps/google-maps-services-js';
import { generateStructured } from '../../lib/llm-utils';
import { waypointSchema } from '../../lib/pre-plan';

const googleMapsClient = new Client({});

// --- Input and Output Schemas ---

const diningWorkflowInputSchema = z.object({
  waypoints: z.array(waypointSchema).describe('Array of waypoints with location, date, and objective'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., Italian, Chinese, Mexican, etc.)'),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Price range from $ (cheap) to $$$$ (expensive)'),
  dietary: z.string().optional().describe('Dietary preference (e.g., vegetarian, vegan, gluten-free)'),
  rating: z.number().min(1).max(5).optional().describe('Minimum rating (1-5 stars)'),
  limit: z.number().min(1).max(10).default(6).describe('Max restaurants to sample per location (internally we pick 2)')
});

export const restaurantSchema = z.object({
  name: z.string(),
  cuisine: z.string(),
  rating: z.number(),
  priceRange: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  placeId: z.string()
});

// ---- New Meal-per-Day Output ----
const mealSchema = restaurantSchema.extend({
  timeFrom: z.string(),
  timeTo: z.string(),
});

export const dayMealsSchema = z.object({
  date: z.string(),
  lunch: mealSchema,
  dinner: mealSchema,
});

export const diningWorkflowOutputSchema = z.object({
  meals: z.array(dayMealsSchema),
  totalFound: z.number(),
});

// --- Workflow Steps ---

// -- Single step: iterate over waypoints and pick 2 meals (lunch & dinner) per day --
const generateMealsStep = createStep({
  id: 'generate-meals',
  inputSchema: diningWorkflowInputSchema,
  outputSchema: diningWorkflowOutputSchema,
  execute: async ({ inputData }: any) => {
    const { waypoints, cuisine, priceRange, dietary, rating, limit } = inputData;
    const meals = [] as z.infer<typeof dayMealsSchema>[];

    for (const waypoint of waypoints) {
      const location = waypoint.location;
      const queryParts: string[] = [];
      if (dietary) queryParts.push(dietary);
      if (cuisine) queryParts.push(cuisine);
      queryParts.push('restaurants in', location);
      const query = queryParts.join(' ');

      // Fetch candidate places (Google Maps or mock)
      let places: any[] = [];
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        try {
          const response = await googleMapsClient.textSearch({ params: { query, key: apiKey } });
          if (response.data.status === 'OK') {
            places = response.data.results.map(place => ({
              name: place.name,
              place_id: place.place_id,
              rating: place.rating,
              price_level: place.price_level,
              formatted_address: place.formatted_address,
              formatted_phone_number: place.formatted_phone_number,
              types: place.types,
              reviews: place.reviews?.slice(0, 2)
            }));
          }
        } catch (e) {
          console.error('Google Maps error', e);
        }
      }

      // Fallback to mock if none found or API key missing
      if (places.length === 0) {
        places = getMockRestaurantsForLocation(location, cuisine, priceRange, rating, limit);
      }

      // Apply filters
      const filtered: any[] = [];
      for (const place of places) {
        const pRange = mapPriceLevel((place as any).price_level);
        if (priceRange && pRange !== priceRange) continue;
        if (rating && place.rating && place.rating < rating) continue;
        filtered.push(place);
        if (filtered.length >= limit) break;
      }

      // Need at least 2 restaurants
      const [first, second] = filtered.length >= 2 ? filtered : [...filtered, ...filtered].slice(0,2);

      const lunchEnhanced = await enhanceRestaurantWithLLM(first);
      const dinnerEnhanced = await enhanceRestaurantWithLLM(second);

      const lunch = {
        name: first.name,
        cuisine: lunchEnhanced.cuisine,
        rating: first.rating || 0,
        priceRange: mapPriceLevel(first.price_level),
        address: first.formatted_address || 'Address not available',
        phone: first.formatted_phone_number || undefined,
        description: lunchEnhanced.description,
        specialties: lunchEnhanced.specialties,
        placeId: first.place_id || '',
        timeFrom: '12PM',
        timeTo: '2PM',
      } as const;

      const dinner = {
        name: second.name,
        cuisine: dinnerEnhanced.cuisine,
        rating: second.rating || 0,
        priceRange: mapPriceLevel(second.price_level),
        address: second.formatted_address || 'Address not available',
        phone: second.formatted_phone_number || undefined,
        description: dinnerEnhanced.description,
        specialties: dinnerEnhanced.specialties,
        placeId: second.place_id || '',
        timeFrom: '8PM',
        timeTo: '10PM',
      } as const;

      meals.push({ date: waypoint.date, lunch, dinner });
    }

    return {
      meals,
      totalFound: meals.length * 2,
    };
  },
});

// --- Workflow Definition ---

export const diningWorkflow = createWorkflow({
  id: 'dining-workflow',
  inputSchema: diningWorkflowInputSchema,
  outputSchema: diningWorkflowOutputSchema,
})
  .then(generateMealsStep)
  .commit();

// --- Helper Functions (moved from dining-tool.ts) ---

function mapPriceLevel(priceLevel?: number): string {
  switch (priceLevel) {
    case 0: case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return '$$';
  }
}

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
  
  try {
    const result = await generateStructured(schema, prompt, { temperature: 0.25 });
    if (result) {
      return {
        cuisine: result.cuisine,
        description: result.description,
        specialties: result.specialties || [],
      };
    }
  } catch(e) {
    console.error("Failed to generate structured enhancement", e);
  }
  
  console.warn('Failed to generate structured enhancement; falling back.');
  return getDefaultEnhancement(restaurantData);
}

function getDefaultEnhancement(restaurantData: any): { 
  cuisine: string; 
  description: string; 
  specialties: string[] 
} {
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

function getMockRestaurantsForLocation(location: string, cuisine?: string, priceRange?: string, rating?: number, limit = 6) {
  const mockRestaurants = [
    {
      name: "Bella Vista Italian", cuisine: "Italian", rating: 4.5, priceRange: "$$$",
      address: `123 Main St, ${location}`, phone: "(555) 123-4567",
      description: "Authentic Italian cuisine with fresh pasta made daily",
      specialties: ["Carbonara", "Osso Buco", "Tiramisu"], placeId: "mock-place-id-1"
    },
    {
      name: "Dragon Palace", cuisine: "Chinese", rating: 4.2, priceRange: "$$",
      address: `456 Oak Ave, ${location}`, phone: "(555) 234-5678",
      description: "Traditional Chinese dishes with modern presentation",
      specialties: ["Peking Duck", "Dim Sum", "Kung Pao Chicken"], placeId: "mock-place-id-2"
    },
    {
      name: "Taco Libre", cuisine: "Mexican", rating: 4.0, priceRange: "$",
      address: `789 Pine St, ${location}`, phone: "(555) 345-6789",
      description: "Fresh Mexican street food and traditional favorites",
      specialties: ["Fish Tacos", "Carnitas", "Guacamole"], placeId: "mock-place-id-3"
    },
  ];

  let filteredRestaurants = mockRestaurants;
  if (cuisine) {
    filteredRestaurants = filteredRestaurants.filter(r => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
  }
  if (priceRange) {
    filteredRestaurants = filteredRestaurants.filter(r => r.priceRange === priceRange);
  }
  if (rating) {
    filteredRestaurants = filteredRestaurants.filter(r => r.rating >= rating);
  }

  return filteredRestaurants.slice(0, limit);
} 