import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { diningTool } from '../tools/dining-tool';

// TODO: Import other child agent tools as they are created
// import { transportTool } from '../tools/transport-tool';
// import { hotelsTool } from '../tools/hotels-tool';
// import { activitiesTool } from '../tools/activities-tool';

export const orchestratorAgent = new Agent({
  name: 'orchestrator-agent',
  
  // Use a powerful model capable of complex instructions and tool use.
  model: openai('gpt-4o'), 

  // The system prompt defines the agent's core role and instructions.
  instructions: `
    You are a highly capable travel coordinator AI. 
    Your primary function is to take a structured itinerary skeleton (a list of waypoints with dates and objectives) 
    and enrich it with specific, actionable details using your available tools.

    **Your Process:**
    1. You will be given the user's original preferences AND a pre-defined list of waypoints.
    2. For each waypoint, analyze the 'objective' and the user's preferences (like budget, food style, etc.).
    3. Invoke the appropriate tool to find relevant details. For example, use the 'dining-tool' to find restaurants that match the user's cuisine and price preferences for a specific location.
    4. Synthesize the tool results into a clear, coherent, and helpful response for the user.
    5. Present the final, enriched itinerary in a well-formatted, day-by-day list.
  `,

  // Register the tools this agent is allowed to use.
  tools: {
    dining: diningTool,
    // transport: transportTool,
    // hotels: hotelsTool,
    // activities: activitiesTool,
  },
}); 