import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';

// Schema for a single waypoint in the itinerary
export const waypointSchema = z.object({
  location: z.string().describe('The city or specific area for the day\'s activities.'),
  date: z.string().describe('The date for this waypoint in ISO 8601 format (YYYY-MM-DD).'),
  objective: z.string().describe('A concise, compelling summary of the main goal or theme for the day. e.g., "Explore historical landmarks" or "Relax on the beach and enjoy local seafood".'),
});

// Schema for the entire pre-plan output
export const prePlanOutputSchema = z.object({
  waypoints: z.array(waypointSchema).describe('The structured, day-by-day itinerary skeleton.'),
});

// Define the structure of the preferences object we expect to receive
// This should align with what the frontend collects and stores in zustand.
export const tripPreferencesSchema = z.object({
  destinationCity: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  profile: z.object({
    budgetTier: z.string(),
    travellerCount: z.number(),
    travelStyle: z.string(),
    groupType: z.string(),
    preferredTransport: z.string(),
    accommodationType: z.string(),
    dietaryPreference: z.string(),
    foodExperiences: z.array(z.string()),
    activityTypes: z.array(z.string()),
  }),
});


/**
 * Generates a structured pre-plan itinerary skeleton by calling an LLM.
 * @param preferences - The user's collected travel preferences (unvalidated).
 * @returns A promise that resolves to the structured waypoint list.
 */
export async function generatePrePlan(preferences: unknown) {
  // Validate the input against our schema
  const parsedPreferences = tripPreferencesSchema.parse(preferences);

  // Ensure that the OPENAI_API_KEY is set in your environment variables
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Master prompt template that injects user preferences
  const prompt = `
**SYSTEM**

You are an expert trip-planner.

Your ONLY task is to take a user's trip profile (destination, dates, preferences, etc.) and return a day-by-day itinerary skeleton as **valid JSON**.

**User Message**

1. Read the trip profile provided in the "USER INPUT" block.

2. Produce one \`Waypoint\` object for every calendar day from \`startDate\` (inclusive) to \`endDate\` (inclusive) with these keys:
• \`date\` – ISO 8601 date string \`YYYY-MM-DD\`
• \`objective\` – broad aim for the day (e.g. "cultural exploration", "food exploration", "leisure", "hiking/countryside", "nightlife", "shopping", "adventure", "beach day").
• \`location\` – the main neighbourhood/area where most time will be spent.
– Be *conservative*: it is perfectly valid for consecutive days to share the **same** location if the user is likely to stay in one base.
– Only switch locations when it clearly improves the itinerary (e.g. multi-city trip, far-flung hike, etc.).
– If a location is repeated, the repeats MUST be in **consecutive days** (never break the stay and then return to it).
    
3. Return **only** the JSON array named \`waypoints\`, nothing else—no markdown or commentary.

## JSON SCHEMA OF RESPONSE:

\`\`\`json
{
  "type": "array",
  "title": "Waypoints",
  "items": {
    "type": "object",
    "required": ["date", "objective", "location"],
    "properties": {
      "date": { "type": "string", "format": "date" },
      "objective": { "type": "string" },
      "location": { "type": "string" }
    }
  }
}
\`\`\`

## EXAMPLE RESPONSE:

\`\`\`json
[
  { "date": "2025-04-12", "objective": "cultural exploration", "location": "Central Kyoto" },
  { "date": "2025-04-13", "objective": "leisure", "location": "Central Kyoto" },
  { "date": "2025-04-14", "objective": "food exploration", "location": "Central Kyoto" },
  { "date": "2025-04-15", "objective": "hiking/countryside", "location": "Arashiyama" }
]
\`\`\`

## USER INPUT:

\`\`\`json
${JSON.stringify(parsedPreferences, null, 2)}
\`\`\`
  `;

  console.log('Generating pre-plan with the following prompt:', prompt);

  const { object } = await generateObject({
    model: openai('gpt-4o'), // Using a powerful model for better structure and reasoning
    schema: prePlanOutputSchema,
    prompt,
    schemaName: 'waypoints',
    schemaDescription: 'The structured, day-by-day itinerary skeleton.',
  });

  return object;
} 