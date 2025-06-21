/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { Client } from '@googlemaps/google-maps-services-js';
import { generateStructured } from '../../lib/llm-utils';

const googleMapsClient = new Client({});

// --- Input and Output Schemas ---

const diningWorkflowInputSchema = z.object({
  location: z.string().describe('The city or area to search for restaurants'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., Italian, Chinese, Mexican, etc.)'),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Price range from $ (cheap) to $$$$ (expensive)'),
  dietary: z.string().optional().describe('Dietary preference (e.g., vegetarian, vegan, gluten-free)'),
  rating: z.number().min(1).max(5).optional().describe('Minimum rating (1-5 stars)'),
  limit: z.number().min(1).max(20).default(10).describe('Number of restaurants to return (max 20)')
});

const restaurantSchema = z.object({
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

export const diningWorkflowOutputSchema = z.object({
  restaurants: z.array(restaurantSchema),
  location: z.string(),
  query: z.string(),
  totalFound: z.number()
});

// --- Workflow Steps ---

const formulateQueryStep = createStep({
  id: 'formulate-query',
  inputSchema: diningWorkflowInputSchema,
  outputSchema: z.object({ query: z.string() }),
  execute: async ({ inputData }: any) => {
    const { cuisine, dietary, location } = inputData;
    const queryParts: string[] = [];
    if (dietary) queryParts.push(dietary);
    if (cuisine) queryParts.push(cuisine);
    queryParts.push('restaurants in', location);
    return { query: queryParts.join(' ') };
  },
});

const searchGoogleMapsStep = createStep({
  id: 'search-google-maps',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    places: z.array(z.any()), // Using z.any() for raw Google Maps results
    query: z.string(),
  }),
  execute: async ({ inputData }: any) => {
    const { query } = inputData;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not found. Mocking search results.');
      return { places: [], query };
    }

    try {
      const response = await googleMapsClient.textSearch({
        params: { query, key: apiKey },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }
      return { places: response.data.results || [], query };
    } catch (error) {
      console.error('Google Maps API error:', error);
      return { places: [], query };
    }
  },
});

const processResultsStep = createStep({
  id: 'process-results',
  inputSchema: z.object({
    places: z.array(z.any()),
    query: z.string(),
  }),
  outputSchema: diningWorkflowOutputSchema,
  execute: async ({ inputData, getInitData }: any) => {
    const { places, query } = inputData;
    const originalInput = getInitData() as z.infer<typeof diningWorkflowInputSchema>;
    const { location, priceRange, rating, limit } = originalInput;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || places.length === 0) {
      console.warn('Using mock data for restaurants.');
      return getMockRestaurants(originalInput);
    }
    
    const restaurants = [];
    // Get more results to allow for filtering
    for (const place of places.slice(0, limit * 2)) {
      const placePriceRange = mapPriceLevel(place.price_level);
      
      if (priceRange && placePriceRange !== priceRange) continue;
      if (rating && place.rating && place.rating < rating) continue;

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

      if (restaurants.length >= limit) break;
    }

    return {
      restaurants,
      location,
      query,
      totalFound: restaurants.length,
    };
  },
});

// --- Workflow Definition ---

export const diningWorkflow = createWorkflow({
  id: 'dining-workflow',
  inputSchema: diningWorkflowInputSchema,
  outputSchema: diningWorkflowOutputSchema,
})
  .then(formulateQueryStep)
  .then(searchGoogleMapsStep)
  .then(processResultsStep)
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

function getMockRestaurants(context: any) {
  const { location, cuisine, priceRange, rating, limit, dietary } = context;
  
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