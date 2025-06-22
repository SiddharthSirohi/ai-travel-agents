import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { diningTool } from '../tools/dining-tool';
import { accommodationWorkflowTool } from '../tools/accommodation-workflow-tool';
import { experiencesWorkflowTool } from '../tools/experiences-workflow-tool';

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

    1. flight_tool - Finds best round-trip flights for given dates and cities
    2. accommodation_tool - Finds and books lodging based on location waypoints
    3. dining_tool - Identifies lunch and dinner venues for each day
    4. experiences_tool - Identifies morning and afternoon experiences for each day using waypoints and objectives

    EXECUTION WORKFLOW:
    1. FLIGHT: First call flight_tool to get best round-trip flights
    2. ACCOMMODATION: Next call accommodation_tool to secure lodging
    3. DINING: Next call dining_tool to identify dining locations
    4. EXPERIENCES: Next call experiences_tool with the full waypoints array to identify experiences for each day

    OUTPUT REQUIREMENTS:
    After completing all tool calls, synthesize the results into a cohesive travel itinerary with:
    - Flight details (with booking link)
    - Accommodation details
    - Daily schedule with morning experience, lunch, afternoon experience, and dinner
    - Include all coordinates for mapping
    - Include all links and booking information
  `,

  // Register the tools this agent is allowed to use.
  tools: {
    dining: diningTool,
    accommodation: accommodationWorkflowTool,
    experiences: experiencesWorkflowTool,
    // transport: transportTool,
    // hotels: hotelsTool,
  },
}); 