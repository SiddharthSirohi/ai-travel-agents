/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { Client } from '@googlemaps/google-maps-services-js';
import { generateStructured } from '../../lib/llm-utils';
import { waypointSchema } from '../../lib/pre-plan';

const googleMapsClient = new Client({});

// --- Input and Output Schemas ---

const accommodationWorkflowInputSchema = z.object({
  city: z.string().describe('The city to search for accommodations'),
  waypoints: z.array(waypointSchema).describe('Array of waypoints with location, date, and objective'),
  budgetTier: z.enum(['budget', 'mid-range', 'luxury', 'ultra-luxury']).describe('Budget tier for accommodations'),
  accommodationType: z.enum(['hotel', 'hostel', 'resort', 'apartment', 'guesthouse', 'bnb']).describe('Type of accommodation'),
  limit: z.number().min(1).max(20).default(10).describe('Number of accommodations to return (max 20)')
});

const hotelInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  rating: z.number(),
  priceRange: z.string(),
  location: z.string().describe('GPS coordinate or detailed address'),
  summary: z.string().optional().describe('A brief, AI-generated summary of the accommodation.'),
  placeId: z.string().optional()
});

const daySchema = z.object({
  date: z.string(),
  hotel_info: hotelInfoSchema
});

export const accommodationWorkflowOutputSchema = z.object({
  days: z.array(daySchema)
});

// --- Workflow Steps ---

const mergeWaypointsStep = createStep({
  id: 'merge-waypoints',
  inputSchema: accommodationWorkflowInputSchema,
  outputSchema: z.object({
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  execute: async ({ inputData }: any) => {
    const { waypoints } = inputData as z.infer<typeof accommodationWorkflowInputSchema>;
    
    // Get all unique dates
    const allDates = [...new Set(waypoints.map(w => w.date))].sort();
    
    // Select a random waypoint
    const selectedWaypoint = waypoints[Math.floor(Math.random() * waypoints.length)];
    
    return { 
      selectedWaypoint: {
        location: selectedWaypoint.location,
        date: selectedWaypoint.date,
        objective: selectedWaypoint.objective
      },
      allDates 
    };
  }
});

const formulateQueryStep = createStep({
  id: 'formulate-query',
  inputSchema: z.object({
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  outputSchema: z.object({ 
    query: z.string(),
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  execute: async ({ inputData, getInitData }: any) => {
    const { selectedWaypoint, allDates } = inputData;
    const originalInput = getInitData() as z.infer<typeof accommodationWorkflowInputSchema>;
    const { city, accommodationType, budgetTier } = originalInput;

    // Use LLM to reformulate query for Google Maps
    const reformulateSchema = z.object({
      query: z.string().describe('Optimized search query for Google Maps API')
    });

    const prompt = `You are a travel search expert. Create an optimized Google Maps search query for finding accommodations.

Input Details:
- City: ${city}
- Accommodation Type: ${accommodationType}
- Budget Tier: ${budgetTier}
- Location: ${selectedWaypoint.location}
- Stay Date: ${selectedWaypoint.date}
- Travel Objective: ${selectedWaypoint.objective}

Create a single, effective search query that will find ${accommodationType} accommodations in ${selectedWaypoint.location}, ${city}. Focus on the accommodation type and location. Include relevant keywords for ${budgetTier} properties that would suit a traveler whose objective is: "${selectedWaypoint.objective}".

Return only a JSON object with the "query" field.`;

    const result = await generateStructured(reformulateSchema, prompt, { temperature: 0.3 });
    
    const query = result?.query || `${accommodationType} in ${selectedWaypoint.location}, ${city}`;
    
    return { query, selectedWaypoint, allDates };
  }
});

const searchGoogleMapsStep = createStep({
  id: 'search-google-maps',
  inputSchema: z.object({ 
    query: z.string(),
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  outputSchema: z.object({
    places: z.array(z.any()),
    query: z.string(),
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  execute: async ({ inputData }: any) => {
    const { query, selectedWaypoint, allDates } = inputData;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not found. Mocking search results.');
      return { places: [], query, selectedWaypoint, allDates };
    }

    try {
      const response = await googleMapsClient.textSearch({
        params: { 
          query, 
          key: apiKey
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      // Filter down the response data to only what we need
      const filteredPlaces = response.data.results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        types: place.types,
        rating: place.rating,
        price_level: place.price_level,
        formatted_address: place.formatted_address,
        geometry: {
          location: place.geometry?.location
        }
      }));
      
      return { 
        places: filteredPlaces, 
        query,
        selectedWaypoint,
        allDates
      };
    } catch (error) {
      console.error('Google Maps API error:', error);
      return { places: [], query, selectedWaypoint, allDates };
    }
  }
});

interface GooglePlace {
  name: string;
  type: string;
  rating: number;
  priceRange: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  summary?: string;
  place_id: string;
}

const processResultsStep = createStep({
  id: 'process-results',
  inputSchema: z.object({
    places: z.array(z.any()),
    query: z.string(),
    selectedWaypoint: z.object({
      location: z.string(),
      date: z.string(),
      objective: z.string()
    }),
    allDates: z.array(z.string())
  }),
  outputSchema: accommodationWorkflowOutputSchema,
  execute: async ({ inputData, getInitData }: any) => {
    const { places, selectedWaypoint, allDates } = inputData;
    const originalInput = getInitData() as z.infer<typeof accommodationWorkflowInputSchema>;
    const { budgetTier, accommodationType } = originalInput;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || places.length === 0) {
      console.warn('Using mock data for accommodations.');
      return getMockAccommodations(originalInput, allDates);
    }
    
    // Get enhanced info for all places
    const enhancedPlaces = await enhanceAccommodationsWithLLM(places, budgetTier, accommodationType);
    const placeMap = new Map(places.map((p: any, i: number) => [p.place_id, { ...p, ...enhancedPlaces[i] }]));

    // Use LLM to pick the best hotel based on the objective
    const bestHotelSchema = z.object({
      placeId: z.string().describe('The place_id of the best hotel that matches the objective')
    });

    const pickBestHotelPrompt = `You are a travel expert. Pick the best hotel from the list that matches this traveler's objective.

Objective: ${selectedWaypoint.objective}
Budget Tier: ${budgetTier}
Accommodation Type: ${accommodationType}

Available Hotels:
${places.map((p: any, i: number) => `
${i + 1}. ${p.name}
   - Rating: ${p.rating || 'N/A'}
   - Price Level: ${mapPriceLevel(p.price_level)}
   - Address: ${p.formatted_address}
   - Summary: ${enhancedPlaces[i]?.summary || 'No summary available'}
   - Place ID: ${p.place_id}
`).join('\n')}

Return a JSON object with the "placeId" field containing the place_id of the best matching hotel.`;

    const bestHotelResult = await generateStructured(bestHotelSchema, pickBestHotelPrompt, { temperature: 0.3 });
    const bestPlace = placeMap.get(bestHotelResult?.placeId) as GooglePlace | undefined;

    if (!bestPlace) {
      console.warn('Failed to select best hotel, using first available.');
      return getMockAccommodations(originalInput, allDates);
    }

    const bestHotelInfo = {
      name: bestPlace.name || 'Unknown Accommodation',
      type: bestPlace.type || accommodationType,
      rating: bestPlace.rating || 0,
      priceRange: bestPlace.priceRange || mapPriceLevel(0),
      location: bestPlace.geometry?.location ? 
        `${bestPlace.geometry.location.lat},${bestPlace.geometry.location.lng}` : 
        bestPlace.formatted_address || 'Location not available',
      summary: bestPlace.summary || `A ${accommodationType} in a convenient location.`,
      placeId: bestPlace.place_id
    };

    // Create a day entry for each date, all using the same best hotel
    const days = allDates.map((date: string) => ({
      date,
      hotel_info: bestHotelInfo
    }));

    return { days };
  }
});

// --- Workflow Definition ---

export const accommodationWorkflow = createWorkflow({
  id: 'accommodation-workflow',
  inputSchema: accommodationWorkflowInputSchema,
  outputSchema: accommodationWorkflowOutputSchema,
})
  .then(mergeWaypointsStep)
  .then(formulateQueryStep)
  .then(searchGoogleMapsStep)
  .then(processResultsStep)
  .commit();

// --- Helper Functions ---

async function enhanceAccommodationsWithLLM(
  places: any[],
  budgetTier: string,
  accommodationType: string
): Promise<Array<{
  name: string;
  type: string;
  priceRange: string;
  summary: string;
}>> {
  if (places.length === 0) {
    return [];
  }

  const enhancementSchema = z.object({
    enhancements: z.array(
      z.object({
        name: z.string().describe('The original name of the accommodation.'),
        type: z.string().describe('Categorized type (e.g., Hotel, Hostel, Resort).'),
        priceRange: z.enum(['$', '$$', '$$$', '$$$$']).describe('Estimated price range.'),
        summary: z.string().describe('A 1-2 sentence compelling summary for a traveler.'),
      })
    ),
  });

  const prompt = `You are a travel expert. Analyze the following list of potential accommodations and provide a structured, concise summary for each.
The user's preferences are:
- Budget: "${budgetTier}"
- Desired type: "${accommodationType}"

For each place in the list, generate a summary. The list of places is:
\`\`\`json
${JSON.stringify(
  places.map(p => ({
    name: p.name,
    types: p.types,
    rating: p.rating,
    price_level: p.price_level,
  })),
  null,
  2
)}
\`\`\`

Return a single JSON object with an "enhancements" array. Each item in the array must correspond to an accommodation in the input list, in the same order.`;

  try {
    const result = await generateStructured(enhancementSchema, prompt, { temperature: 0.3 });
    if (result && result.enhancements.length === places.length) {
      return result.enhancements;
    }
  } catch (e) {
    console.error("Failed to generate structured enhancement for batch", e);
  }

  console.warn('Failed to generate structured enhancements for batch; falling back to default.');
  // Fallback for each place
  return places.map(place => {
    const defaultData = getDefaultEnhancement(place, accommodationType);
    return {
      name: place.name || 'Unknown Accommodation',
      type: defaultData.type,
      priceRange: defaultData.priceRange,
      summary: defaultData.description, // use description as summary
    };
  });
}

function getDefaultEnhancement(accommodationData: any, accommodationType: string): { 
  type: string; 
  priceRange: string;
  description: string; 
  amenities: string[] 
} {
  const priceLevel = accommodationData.price_level;
  const priceRange = mapPriceLevel(priceLevel);
  
  return {
    type: accommodationType,
    priceRange,
    description: `A well-rated ${accommodationType} with good amenities and service`,
    amenities: ['WiFi', 'Air Conditioning', '24/7 Reception', 'Room Service', 'Parking']
  };
}

function mapPriceLevel(priceLevel?: number): string {
  switch (priceLevel) {
    case 0: case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return '$$';
  }
}

function getMockAccommodations(context: any, allDates: string[]) {
  const { accommodationType, budgetTier } = context;
  
  const mockHotelInfo = {
    name: `Grand ${accommodationType} Central`,
    type: accommodationType,
    rating: 4.5,
    priceRange: budgetTier === 'budget' ? '$' : budgetTier === 'mid-range' ? '$$' : '$$$',
    location: 'City Center',
    summary: `Excellent ${accommodationType} in a prime location with great amenities.`,
    placeId: 'mock-place-id-1'
  };

  return {
    days: allDates.map(date => ({
      date,
      hotel_info: mockHotelInfo
    }))
  };
} 