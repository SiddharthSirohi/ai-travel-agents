/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { waypointSchema } from '../../lib/pre-plan';
import { experiencesTool } from '../tools/experiences-tool';

// Initialize OpenAI client with API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Input and Output Schemas ---

const experiencesWorkflowInputSchema = z.object({
  waypoints: z.array(waypointSchema).describe('Array of waypoints with location, date, and objective'),
  budgetRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Budget range from $ (cheap) to $$$$ (expensive)'),
  travellerCount: z.number().min(1).max(20).default(2).describe('Number of people traveling'),
  travelStyle: z.string().optional().describe('Travel style preference (e.g., adventure, cultural, relaxation, luxury)'),
});

const experienceSchema = z.object({
  name: z.string(),
  imageUrl: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  urlLink: z.string().optional(),
});

const dayExperiencesSchema = z.object({
  date: z.string(),
  morningExperience: experienceSchema,
  afternoonExperience: experienceSchema,
});

export const experiencesWorkflowOutputSchema = z.object({
  experiences: z.array(dayExperiencesSchema),
  totalFound: z.number(),
});

// --- Workflow Steps ---

const generateExperiencesStep = createStep({
  id: 'generate-experiences',
  inputSchema: experiencesWorkflowInputSchema,
  outputSchema: experiencesWorkflowOutputSchema,
  execute: async ({ inputData }: any) => {
    const { waypoints, budgetRange, travellerCount, travelStyle } = inputData;
    const experiences = [] as z.infer<typeof dayExperiencesSchema>[];

    for (const waypoint of waypoints) {
      const location = waypoint.location;
      const date = waypoint.date;
      const objective = waypoint.objective;

      // Use GPT-4o to determine appropriate experience types for the day's objective
      const experienceTypesPrompt = `Based on the travel objective "${objective}" for ${location}, suggest 2-3 relevant experience types from this list:
      architecture, art, beauty, cooking, cultural-tours, dining, flying, food-tours, galleries, landmarks, museums, outdoors, performances, shopping-fashion, tastings, water-sports, wellness, wildlife, workouts

      Consider the objective and return only the most relevant types as a JSON array of strings.`;

      let experienceTypes: string[] = [];
      try {
        const { object } = await generateObject({
          model: openai('gpt-4o'),
          schema: z.object({
            types: z.array(z.string())
          }),
          prompt: experienceTypesPrompt,
        });
        experienceTypes = object.types;
      } catch (error) {
        console.error('Error generating experience types:', error);
        // Fallback to default types based on objective keywords
        if (objective.toLowerCase().includes('cultural')) {
          experienceTypes = ['cultural-tours', 'museums', 'landmarks'];
        } else if (objective.toLowerCase().includes('food')) {
          experienceTypes = ['cooking', 'food-tours', 'tastings'];
        } else if (objective.toLowerCase().includes('outdoor')) {
          experienceTypes = ['outdoors', 'wildlife', 'water-sports'];
        } else {
          experienceTypes = ['cultural-tours', 'outdoors', 'art'];
        }
      }

      // Get morning and afternoon experiences simultaneously
      const [morningExperiences, afternoonExperiences] = await Promise.all([
        experiencesTool.execute({
          context: {
            location,
            checkin: date,
            checkout: date,
            adults: travellerCount,
            timeOfDay: 'morning' as const,
            experienceTypes: experienceTypes as any
          },
          runtimeContext: undefined as any
        }),
        experiencesTool.execute({
          context: {
            location,
            checkin: date,
            checkout: date,
            adults: travellerCount,
            timeOfDay: 'afternoon' as const,
            experienceTypes: experienceTypes as any
          },
          runtimeContext: undefined as any
        })
      ]);

      console.log('Morning experiences:', JSON.stringify(morningExperiences.experiences.map(e => ({
        name: e.name,
        lat: e.latitude,
        lng: e.longitude
      })), null, 2));
      
      console.log('Afternoon experiences:', JSON.stringify(afternoonExperiences.experiences.map(e => ({
        name: e.name,
        lat: e.latitude,
        lng: e.longitude
      })), null, 2));

      // Use GPT-4o to select the best experience for each time slot
      const selectionPrompt = `You are a travel expert. Based on the travel objective "${objective}" for ${location} on ${date}, and considering a ${budgetRange || '$$'} budget for ${travellerCount} people with ${travelStyle || 'balanced'} travel style, select the BEST experience for morning and afternoon from the following options:

MORNING OPTIONS:
${JSON.stringify(morningExperiences.experiences, null, 2)}

AFTERNOON OPTIONS:
${JSON.stringify(afternoonExperiences.experiences, null, 2)}

Select one experience for morning and one for afternoon that best fit the objective and preferences. CRITICAL REQUIREMENTS: 
- You MUST include the exact latitude and longitude from the selected experience if they exist (not null/undefined)
- If coordinates are missing from the scraped data, use these fallback coordinates for Paris: latitude: 48.8566, longitude: 2.3522
- Use realistic start/end times (morning: 9:00-12:00, afternoon: 14:00-17:00)
- Return the response in the exact format specified by the schema.`;

      try {
        const { object } = await generateObject({
          model: openai('gpt-4o'),
          schema: z.object({
            morningExperience: z.object({
              name: z.string(),
              imageUrl: z.string().optional(),
              startTime: z.string(),
              endTime: z.string(),
              locationLatitude: z.number(),
              locationLongitude: z.number(),
              urlLink: z.string().optional(),
            }),
            afternoonExperience: z.object({
              name: z.string(),
              imageUrl: z.string().optional(),
              startTime: z.string(),
              endTime: z.string(),
              locationLatitude: z.number(),
              locationLongitude: z.number(),
              urlLink: z.string().optional(),
            }),
          }),
          prompt: selectionPrompt,
        });

        experiences.push({
          date,
          morningExperience: object.morningExperience,
          afternoonExperience: object.afternoonExperience,
        });

      } catch (error) {
        console.error('Error selecting experiences:', error);
        
        // Fallback: select first available experience from each time slot
        const morningExp = morningExperiences.experiences[0];
        const afternoonExp = afternoonExperiences.experiences[0];

        // Use extracted coordinates or fallback to Paris center
        const defaultLat = 48.8566; // Paris center
        const defaultLng = 2.3522;

        const fallbackMorning = {
          name: morningExp?.name || 'Morning Activity',
          imageUrl: morningExp?.imageUrl,
          startTime: '9:00 AM',
          endTime: '12:00 PM',
          locationLatitude: morningExp?.latitude || defaultLat,
          locationLongitude: morningExp?.longitude || defaultLng,
          urlLink: morningExp?.experiencePageUrl,
        };

        const fallbackAfternoon = {
          name: afternoonExp?.name || 'Afternoon Activity',
          imageUrl: afternoonExp?.imageUrl,
          startTime: '2:00 PM',
          endTime: '5:00 PM',
          locationLatitude: afternoonExp?.latitude || defaultLat,
          locationLongitude: afternoonExp?.longitude || defaultLng,
          urlLink: afternoonExp?.experiencePageUrl,
        };

        experiences.push({
          date,
          morningExperience: fallbackMorning,
          afternoonExperience: fallbackAfternoon,
        });
      }
    }

    return {
      experiences,
      totalFound: experiences.length * 2,
    };
  },
});

// --- Workflow Definition ---

export const experiencesWorkflow = createWorkflow({
  id: 'experiences-workflow',
  inputSchema: experiencesWorkflowInputSchema,
  outputSchema: experiencesWorkflowOutputSchema,
})
  .then(generateExperiencesStep)
  .commit(); 