import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@/mastra';
// import { Itinerary } from '@/lib/types'; // Assuming types are defined here

/**
 * Cleans the agent's text response by removing markdown JSON formatting.
 * @param text The raw text response from the agent.
 * @returns A clean JSON string.
 */
function cleanAgentResponse(text: string): string {
  // Removes ```json ... ``` and any leading/trailing whitespace.
  const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
  return cleanedText;
}

const feedbackRequestSchema = z.object({
  message: z.string(),
  currentItinerary: z.any(), // Using z.any() for now, will be replaced with Itinerary schema
});

export async function POST(req: NextRequest) {
  try {
    // 1. Get and validate the user's message and current itinerary
    const body = await req.json();
    const { message, currentItinerary } = feedbackRequestSchema.parse(body);

    console.log('Feedback API: Received message:', message);
    console.log('Feedback API: Current Itinerary:', currentItinerary);

    // 2. Get the feedback orchestrator agent
    const agent = mastra.getAgent('feedbackOrchestrator');
    if (!agent) {
      throw new Error('Could not find the feedbackOrchestrator agent in the Mastra instance.');
    }

    console.log("agent", agent);

    // 3. Invoke the agent with the user's message and the current itinerary
    // The agent will be responsible for understanding the message and using tools to modify the itinerary
    console.log('Feedback API: Invoking feedback orchestrator agent...');
    const agentResponse = await agent.generate(
      [
        {
          role: 'user',
          content: JSON.stringify({
            message,
            currentItinerary,
          }),
        },
      ],
      {
        maxSteps: 5, // Limit steps for feedback modification
      }
    );

    console.log("agentResponse", agentResponse);

    // 4. The agent's response should be the updated itinerary
    // The agent is instructed to return the raw JSON from the tool.
    // The result is in the 'text' property of the response.
    if (!agentResponse.text) {
      throw new Error('Agent did not return a text response.');
    }
    const cleanedResponse = cleanAgentResponse(agentResponse.text);
    const updatedItinerary = JSON.parse(cleanedResponse);

    console.log("updatedItinerary", updatedItinerary);

    // 5. Return the updated itinerary
    return NextResponse.json({ updatedItinerary });

  } catch (error) {
    console.error('[FEEDBACK_API_ERROR]', error);

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