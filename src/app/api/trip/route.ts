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
         // 5. Invoke the agent with the preferences and waypoints
     console.log('API Route: Invoking orchestrator agent...');
     const responseStream = await agent.stream(
       [
         { 
           role: 'user', 
           content: JSON.stringify({
             preferences,
             waypoints: prePlanResult.waypoints
           })
         }
       ],
       { 
         maxSteps: 8,
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