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

const accommodationSchema = z.object({
  name: z.string(),
  type: z.string(),
  rating: z.number(),
  priceRange: z.string(),
  location: z.string().describe('GPS coordinate or detailed address'),
  from: z.string().describe('Start of stay (ISO date)'),
  to: z.string().describe('End of stay (ISO date)'),
  summary: z.string().optional().describe('A brief, AI-generated summary of the accommodation.'),
  placeId: z.string().optional()
});

export const accommodationWorkflowOutputSchema = z.object({
  accommodations: z.array(accommodationSchema),
  mergedWaypoints: z.array(z.object({
    location: z.string(),
    from: z.string(),
    to: z.string(),
    objectives: z.array(z.string())
  })),
  query: z.string(),
  totalFound: z.number()
});

// --- Workflow Steps ---

const mergeWaypointsStep = createStep({
  id: 'merge-waypoints',
  inputSchema: accommodationWorkflowInputSchema,
  outputSchema: z.object({
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  execute: async ({ inputData }: any) => {
    const { waypoints } = inputData;
    const locationGroups: Record<string, {
      location: string;
      dates: string[];
      objectives: string[];
    }> = {};

    // Group waypoints by location
    waypoints.forEach((waypoint: { location: string; date: string; objective: string }) => {
      const location = waypoint.location.toLowerCase().trim();
      if (!locationGroups[location]) {
        locationGroups[location] = {
          location: waypoint.location,
          dates: [],
          objectives: []
        };
      }
      locationGroups[location].dates.push(waypoint.date);
      locationGroups[location].objectives.push(waypoint.objective);
    });

    // Merge consecutive dates for same location
    const mergedWaypoints = Object.values(locationGroups).map((group) => {
      const sortedDates = group.dates.sort();
      return {
        location: group.location,
        from: sortedDates[0],
        to: sortedDates[sortedDates.length - 1],
        objectives: [...new Set(group.objectives)] // Remove duplicates
      };
    });

    return { mergedWaypoints };
  }
});

const formulateQueryStep = createStep({
  id: 'formulate-query',
  inputSchema: z.object({
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  outputSchema: z.object({ 
    query: z.string(),
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  execute: async ({ inputData, getInitData }: any) => {
    const { mergedWaypoints } = inputData;
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
 - Locations with stays: ${mergedWaypoints.map((w: { location: string; from: string; to: string }) => `${w.location} (${w.from} to ${w.to})`).join(', ')}

Create a single, effective search query that will find ${accommodationType} accommodations in ${city}. Focus on the accommodation type and location. Include relevant keywords for ${budgetTier} properties.

Return only a JSON object with the "query" field.`;

    const result = await generateStructured(reformulateSchema, prompt, { temperature: 0.3 });
    
    const query = result?.query || `${accommodationType} in ${city}`;
    
    return { query, mergedWaypoints };
  }
});

const searchGoogleMapsStep = createStep({
  id: 'search-google-maps',
  inputSchema: z.object({ 
    query: z.string(),
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  outputSchema: z.object({
    places: z.array(z.any()),
    query: z.string(),
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  execute: async ({ inputData }: any) => {
    const { query, mergedWaypoints } = inputData;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not found. Mocking search results.');
      return { places: [], query, mergedWaypoints };
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
        mergedWaypoints
      };
    } catch (error) {
      console.error('Google Maps API error:', error);
      return { places: [], query, mergedWaypoints };
    }
  }
});

const processResultsStep = createStep({
  id: 'process-results',
  inputSchema: z.object({
    places: z.array(z.any()),
    query: z.string(),
    mergedWaypoints: z.array(z.object({
      location: z.string(),
      from: z.string(),
      to: z.string(),
      objectives: z.array(z.string())
    }))
  }),
  outputSchema: accommodationWorkflowOutputSchema,
  execute: async ({ inputData, getInitData }: any) => {
    const { places, query, mergedWaypoints } = inputData;
    const originalInput = getInitData() as z.infer<typeof accommodationWorkflowInputSchema>;
    const { budgetTier, accommodationType, limit } = originalInput;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || places.length === 0) {
      console.warn('Using mock data for accommodations.');
      return getMockAccommodations(originalInput, mergedWaypoints);
    }
    
    const allPlaces = places.slice(0, originalInput.limit * 4);
    const enhancedForAllPlaces = await enhanceAccommodationsWithLLM(allPlaces, budgetTier, accommodationType);

    const placeMap = new Map(allPlaces.map((p: any, i: number) => [p.place_id, { ...p, ...enhancedForAllPlaces[i] }]));

    const accommodations: z.infer<typeof accommodationSchema>[] = [];
    
    // Process each merged waypoint to create accommodation entries
    for (const waypoint of mergedWaypoints) {
      const waypointAccommodations = [];
      
      // Get places near this specific waypoint location
      for (const place of allPlaces) {
        const enhancedPlace: any = placeMap.get(place.place_id);
        if (!enhancedPlace) continue;
        
        // Filter by budget tier and type
        if (!matchesBudgetTier(enhancedPlace.priceRange, budgetTier)) continue;
        if (!matchesAccommodationType(enhancedPlace.type, accommodationType)) continue;

        const accommodation = {
          name: place.name || 'Unknown Accommodation',
          type: enhancedPlace.type,
          rating: place.rating || 0,
          priceRange: enhancedPlace.priceRange,
          location: place.geometry?.location ? 
            `${place.geometry.location.lat},${place.geometry.location.lng}` : 
            place.formatted_address || 'Location not available',
          from: waypoint.from,
          to: waypoint.to,
          summary: enhancedPlace.summary,
          placeId: place.place_id || ''
        };

        waypointAccommodations.push(accommodation);
        
        if (waypointAccommodations.length >= Math.ceil(limit / mergedWaypoints.length)) break;
      }
      
      accommodations.push(...waypointAccommodations);
    }

    return {
      accommodations: accommodations.slice(0, limit),
      mergedWaypoints,
      query,
      totalFound: accommodations.length
    };
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

function matchesBudgetTier(priceRange: string, budgetTier: string): boolean {
  const tierMap: Record<string, string[]> = {
    'budget': ['$', '$$'],
    'mid-range': ['$$', '$$$'],
    'luxury': ['$$$', '$$$$'],
    'ultra-luxury': ['$$$$']
  };
  
  return tierMap[budgetTier]?.includes(priceRange) || false;
}

function matchesAccommodationType(type: string, targetType: string): boolean {
  const typeNormalized = type.toLowerCase();
  const targetNormalized = targetType.toLowerCase();
  
  // Flexible matching
  if (typeNormalized.includes(targetNormalized) || targetNormalized.includes(typeNormalized)) {
    return true;
  }
  
  // Special cases
  const synonyms: Record<string, string[]> = {
    'hotel': ['hotel', 'inn', 'lodge'],
    'hostel': ['hostel', 'backpacker'],
    'resort': ['resort', 'spa'],
    'apartment': ['apartment', 'flat', 'condo'],
    'guesthouse': ['guesthouse', 'b&b', 'bnb', 'bed and breakfast'],
    'bnb': ['bnb', 'b&b', 'bed and breakfast', 'guesthouse']
  };
  
  return synonyms[targetNormalized]?.some(syn => typeNormalized.includes(syn)) || 
         synonyms[typeNormalized]?.includes(targetNormalized) || false;
}

function getMockAccommodations(context: any, mergedWaypoints: any[]) {
  const { city, accommodationType, budgetTier, limit } = context;
  
  const mockAccommodations = mergedWaypoints.flatMap(waypoint => [
    {
      name: `Grand ${accommodationType} ${waypoint.location}`,
      type: accommodationType,
      rating: 4.5,
      priceRange: budgetTier === 'budget' ? '$' : budgetTier === 'mid-range' ? '$$' : '$$$',
      location: `${waypoint.location}, ${city}`,
      from: waypoint.from,
      to: waypoint.to,
      summary: `Excellent ${accommodationType} in the heart of ${waypoint.location} with great amenities.`,
      placeId: `mock-place-id-${waypoint.location}`
    },
    {
      name: `Comfort ${accommodationType} ${waypoint.location}`,
      type: accommodationType,
      rating: 4.2,
      priceRange: budgetTier === 'budget' ? '$' : '$$',
      location: `${waypoint.location}, ${city}`,
      from: waypoint.from,
      to: waypoint.to,
      summary: `Comfortable and affordable ${accommodationType} option, perfect for your stay.`,
      placeId: `mock-place-id-2-${waypoint.location}`
    }
  ]);

  return {
    accommodations: mockAccommodations.slice(0, limit),
    mergedWaypoints,
    query: `${accommodationType} in ${city}`,
    totalFound: mockAccommodations.length
  };
} 