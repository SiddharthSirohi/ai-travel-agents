import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Client, Place } from "@googlemaps/google-maps-services-js";
import { generateStructured } from "../../lib/llm-utils";

const googleMapsClient = new Client({});

// Schema for the tool's primary input
export const editRestaurantToolInputSchema = z.object({
  message: z.string().describe("The user's raw text feedback."),
  currentItinerary: z.any().describe('The complete current itinerary object'),
});

// This is the schema we'll ask the LLM to populate by analyzing the user's message.
const analysisSchema = z.object({
  searchQuery: z.string().describe("An optimized Google Maps search query based on the user's request."),
  dayIndex: z.number().describe("The zero-based index of the day to modify in the itinerary's 'days' or 'meals' array."),
  mealType: z.enum(['lunch', 'dinner']).describe("The meal to replace."),
  action: z.enum(['REPLACE']).describe("The action to perform. Currently, only 'REPLACE' is supported."),
});

// --- Helper Functions (inspired by dining-workflow.ts) ---

function mapPriceLevel(priceLevel?: number): string {
  switch (priceLevel) {
    case 0: case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return '$$';
  }
}

async function enhanceRestaurantWithLLM(restaurantData: Place): Promise<{
  cuisine: string;
  description: string;
  specialties: string[];
}> {
  const schema = z.object({
    cuisine: z.string(),
    description: z.string(),
    specialties: z.array(z.string()).optional(),
  });

  const prompt = `You are a culinary expert. Summarise the following restaurant information into a short JSON object with fields cuisine, description and specialties (3-4 dishes). Return JSON only.

Name: ${restaurantData.name}
Types: ${Array.isArray(restaurantData.types) ? restaurantData.types.join(', ') : 'N/A'}
Rating: ${restaurantData.rating || 'N/A'}`;
  
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
  
  // Fallback
  return {
    cuisine: 'Various',
    description: 'A popular restaurant with good reviews.',
    specialties: ['Chef recommendations'],
  };
}

export const editRestaurantTool = createTool({
  id: "edit_restaurant_tool",
  description: "Analyzes a user's feedback to replace a restaurant in an existing itinerary using Google Maps.",
  inputSchema: editRestaurantToolInputSchema,

  execute: async ({ context: input }) => {
    const { message, currentItinerary } = input;
    console.log("currentItinerary", currentItinerary);
    // Step 1: Use LLM to understand the user's request
    const analysisPrompt = `Analyze the user's request to modify their travel itinerary. Based on their message, determine the search query, the day to modify, the meal type, and the action to perform.
    
    User Message: "${message}"
    
    Current Itinerary (for context):
    ${JSON.stringify(currentItinerary, null, 2)}

    Return a JSON object with your analysis. 

    IMPORTANT: You need to find the restaurant in the current itinerary that the user wants to replace. Look for:
    1. Restaurant names mentioned in the user's message that match restaurants in the itinerary
    2. Day references (e.g., "day 2", "second day", "Tuesday")
    3. Meal references (e.g., "dinner", "lunch")
    4. Location references that match restaurant locations in the itinerary

    To determine the dayIndex:
    - Look at the "days" array in the itinerary
    - Find the day that contains the restaurant the user wants to replace
    - The dayIndex is the 0-based index of that day in the array
    - If the user mentions a specific day number, convert it to 0-based index (day 1 = index 0, day 2 = index 1, etc.)

    `;

    const analysis = await generateStructured(analysisSchema, analysisPrompt);
    if (!analysis) {
      console.error("Failed to analyze user's request.");
      return currentItinerary; // Return original itinerary if analysis fails
    }


    // Step 2: Search Google Maps using the generated query
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found. Skipping search.');
      return currentItinerary;
    }

    let places: Place[] = [];
    try {
      const response = await googleMapsClient.textSearch({
        params: { query: analysis.searchQuery, key: apiKey },
      });
      if (response.data.status === 'OK') {
        places = response.data.results;
      }
    } catch (e) {
      console.error('Google Maps API error:', e);
      return currentItinerary; // Return original on error
    }

    if (places.length === 0) {
      console.warn(`No Google Maps results for query: "${analysis.searchQuery}"`);
      return currentItinerary;
    }

    const newPlace = places[0]; // Take the top result


    // Step 3: Enhance the new place data
    const enhancedData = await enhanceRestaurantWithLLM(newPlace);

    // Step 4: Create the new restaurant object
    const newRestaurant = {
        name: newPlace.name,
        cuisine: enhancedData.cuisine,
        rating: newPlace.rating || 0,
        priceRange: mapPriceLevel(newPlace.price_level),
        address: newPlace.formatted_address || 'Address not available',
        description: enhancedData.description,
        specialties: enhancedData.specialties,
        placeId: newPlace.place_id || '',
        // Assuming a default time for now
        timeFrom: analysis.mealType === 'lunch' ? '12PM' : '8PM',
        timeTo: analysis.mealType === 'lunch' ? '2PM' : '10PM',
    };

    console.log("newRestaurant", newRestaurant);

    // Step 5: Modify the itinerary robustly
    const updatedItinerary = JSON.parse(JSON.stringify(currentItinerary)); // Deep copy to prevent side effects

    console.log("updatedItinerary", updatedItinerary);
    console.log("dayIndex", analysis.dayIndex);
    console.log("mealType", analysis.mealType);

    // Filter meals and calculate the target index
    if (Array.isArray(updatedItinerary)) {
      const meals = updatedItinerary.filter(item => item.type === "meal");
      const targetIndex = (analysis.dayIndex * 2) + (analysis.mealType === "dinner" ? 1 : 0);

      if (targetIndex >= 0 && targetIndex < meals.length) {
        // Create the new meal item
        const mealDate = currentItinerary[targetIndex]?.date || new Date().toISOString().split('T')[0];
        const mealTime = analysis.mealType === 'lunch' ? '12:00' : '20:00';
        
        const newMeal = {
          id: `${mealDate}-${analysis.mealType}-${newPlace.place_id}`,
          type: "meal",
          title: newPlace.name,
          description: enhancedData.description,
          date: mealDate,
          time: mealTime,
          duration: 120, // 2 hours for meals
          location: newPlace.formatted_address,
          price: 0,
          currency: "USD",
          status: "confirmed",
          rating: newPlace.rating || 0,
          details: {
            cuisine: enhancedData.cuisine,
            priceRange: mapPriceLevel(newPlace.price_level),
            specialties: enhancedData.specialties,
            placeId: newPlace.place_id
          }
        };

        // Find the index in the original array that corresponds to our target meal
        const originalIndex = updatedItinerary.findIndex((item, idx) => {
          if (item.type !== "meal") return false;
          const mealIndex = updatedItinerary.slice(0, idx).filter(i => i.type === "meal").length;
          return mealIndex === targetIndex;
        });

        if (originalIndex !== -1) {
          updatedItinerary[originalIndex] = newMeal;
          console.log(`Successfully replaced ${analysis.mealType} on day index ${analysis.dayIndex} with '${newRestaurant.name}'`);
        } else {
          console.error(`Cannot update: Could not find the meal at calculated index ${targetIndex}`);
          return currentItinerary;
        }
      } else {
        console.error(`Cannot update: Invalid target index ${targetIndex} for meals array of length ${meals.length}`);
        return currentItinerary;
      }
    } else {
      console.error("Cannot update: Itinerary is not an array");
      return currentItinerary;
    }
    
    return updatedItinerary;
  },
});
