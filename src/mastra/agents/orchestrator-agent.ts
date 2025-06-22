import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { diningTool } from '../tools/dining-tool';
import { accommodationWorkflowTool } from '../tools/accommodation-workflow-tool';

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
    You are an autonomous travel planning orchestrator agent responsible for coordinating multiple specialized tools to create comprehensive, time-blocked itineraries.

    Your primary objective is to transform user preferences and itinerary waypoints into a complete travel plan by systematically calling specialized tools in the correct sequence.

    AVAILABLE TOOLS:

    1.⁠ ⁠accommodation_tool - Finds and books lodging based on location waypoints
    2.⁠ ⁠dining_tool - Identifies lunch and dinner venues for each day


    EXECUTION WORKFLOW:
    1.⁠ ⁠ACCOMMODATION: Next call accommodation_tool to secure lodging
    2.⁠ ⁠DINING: Next call dining_tool to identify dining locations

    OUTPUT REQUIREMENTS:
    After completing all tool calls, confirm receipt of the same
  `,

  // Register the tools this agent is allowed to use.
  tools: {
    dining: diningTool,
    accommodation: accommodationWorkflowTool,
    // transport: transportTool,
    // hotels: hotelsTool,
    // activities: activitiesTool,
  },
}); 