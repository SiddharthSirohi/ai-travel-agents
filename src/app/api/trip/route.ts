import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generatePrePlan } from '@/lib/pre-plan';
import { Mastra } from '@mastra/core';
import { orchestratorAgent } from '@/mastra/agents/orchestrator-agent';
import { diningWorkflow } from '@/mastra/workflows/dining-workflow';

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

    // 3. Initialize the Mastra instance, registering agents and their dependent workflows.
    const mastra = new Mastra({
      agents: {
        orchestrator: orchestratorAgent,
      },
      workflows: {
        'dining-workflow': diningWorkflow,
      }
    });

    console.log("mastra", mastra);

    // 4. Get the configured orchestrator agent from the Mastra instance.
    const agent = mastra.getAgent('orchestrator');
    if (!agent) {
      throw new Error('Could not find the orchestrator agent in the Mastra instance.');
    }

    console.log("agent", agent);

    // 5. Construct the detailed prompt for the agent, providing full context.
    const agentPrompt = `
      You have been tasked with creating a detailed travel itinerary.

      First, here is the high-level, day-by-day plan you must follow:
      \`\`\`json
      ${JSON.stringify(prePlanResult.waypoints, null, 2)}
      \`\`\`

      Next, here are the user's detailed preferences which you must adhere to for all recommendations:
      \`\`\`json
      ${JSON.stringify(preferences, null, 2)}
      \`\`\`

      Your job is to use your available tools to flesh out this itinerary. 
      For each day in the plan, find suitable dining options that match the user's preferences (budget, cuisine, etc.).
      When you are done, present the final, enriched itinerary as a comprehensive, day-by-day plan.
    `;

    // 6. Invoke the agent with the prompt and get the streaming response object.
    console.log('API Route: Invoking orchestrator agent...');
    const responseStream = await agent.stream(
      [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: 'Please generate a detailed itinerary for the user\'s trip.' }
      ],
      { 
        // We pass runtime options here, not in the agent definition.
        maxSteps: 10 
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