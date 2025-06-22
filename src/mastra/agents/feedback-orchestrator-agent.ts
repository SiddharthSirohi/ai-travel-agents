import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { editRestaurantTool } from '../tools/edit-restaurant-tool';

export const feedbackOrchestratorAgent = new Agent({
  name: 'feedback-orchestrator-agent',
  
  // Using a powerful model for nuanced understanding of feedback
  model: openai('gpt-4o'), 

  // The system prompt is crucial for directing the agent's behavior.
  instructions: `
    You are a specialized AI agent responsible for modifying an existing travel itinerary based on user feedback.

    Your task is to parse the user's request and the provided 'currentItinerary' JSON object. You should use the appropriate tool for editing, adding, or removing items from the itinerary.

    INPUT:
    You will receive a JSON object containing:
    - 'message': The user's natural language feedback (e.g., "Can you swap the dinner on day 2 for something cheaper?").
    - 'currentItinerary': The complete JSON of the trip plan to be modified.

    EXECUTION STEPS:
    1.  ANALYZE the user's 'message' to understand the desired change (e.g., which day, what meal, what kind of change like 'replace', 'remove', 'add').
    2.  Make sure to pre process the 'message' to make it more readable and understandable by the tool.
    3.  CALL the tool with the correctly populated arguments.
    4.  FINAL OUTPUT: You MUST return ONLY the JSON output from the tool as your final response. Do not add any conversational text or formatting around it. Your entire output should be the modified itinerary JSON.
  `,

  // Register the editing tool. This is the only tool it should need.
  tools: {
    editRestaurant: editRestaurantTool,
  },
}); 