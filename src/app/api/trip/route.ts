import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generatePrePlan } from '@/lib/pre-plan';
import { mastra } from '@/mastra';

// The Edge runtime is recommended for streaming responses - BUT causes issues with mastra
// export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // 1. Get and validate the user's full preferences from the request body.
    const preferences = await req.json();
    console.log('API Route: Preferences received:', preferences);
    // 2. Execute the deterministic pre-processing step to get the itinerary skeleton.
    console.log('API Route: Starting pre-plan generation...');
    const prePlanResult = await generatePrePlan(preferences);
    console.log("prePlanResult", prePlanResult);
    console.log('API Route: Pre-plan generated successfully.');


    // 3. Use the global Mastra instance that's already configured with all agents and workflows.
    console.log("mastra", mastra);

    // 4. Get the configured orchestrator agent from the Mastra instance.
    const agent = mastra.getAgent('orchestrator');
    if (!agent) {
      throw new Error('Could not find the orchestrator agent in the Mastra instance.');
    }

    console.log("agent", agent);
         // 5. Construct the detailed prompt for the agent, providing full context.
     const agentPrompt = `
       You have been tasked with creating a detailed travel itinerary including accommodations.

       First, here is the high-level, day-by-day plan you must follow:
       \`\`\`json
       ${JSON.stringify(prePlanResult.waypoints, null, 2)}
       \`\`\`

       Next, here are the user's detailed preferences which you must adhere to for all recommendations:
       \`\`\`json
       ${JSON.stringify(preferences, null, 2)}
       \`\`\`

       Your job is to use your available tools to flesh out this itinerary.
       For each location in the plan:
       1. Use the accommodation-workflow-tool to find suitable accommodations that match:
          - The user's budget tier (budget/mid-range/luxury/ultra-luxury)
          - Preferred accommodation type (hotel/hostel/resort/apartment/guesthouse/bnb)
          - Location requirements from the waypoints
       2. Find suitable dining and activity options that match the user's preferences
       
       When you are done, present the final, enriched itinerary as a comprehensive, day-by-day plan including:
       - Accommodation details with check-in/check-out dates
       - Daily activities and dining recommendations
       - Local transportation options between locations
     `;

         // 6. Invoke the agent with the prompt and get the streaming response object.
     console.log('API Route: Invoking orchestrator agent...');
     const responseStream = await agent.stream(
       [
         { role: 'system', content: agentPrompt },
         { 
           role: 'user', 
           content: 'Please generate a detailed itinerary including accommodations, dining, and activities that match the provided preferences and waypoints.'
         }
       ],
       { 
         maxSteps: 15, // Increased to allow for accommodation workflow
       }
     );

     // 7. Use the Mastra/AI SDK utility to stream the response back to the client.
     return responseStream.toDataStreamResponse();

  } catch (error) {
    console.error('[TRIP_API_ERROR]', error);

    // Provide specific feedback for validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body provided.', 
          details: error.flatten().fieldErrors 
        }), 
        { status: 400 }
      );
    }

    // Generic error for all other cases
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred on the server.' }), 
      { status: 500 }
    );
  }
} 