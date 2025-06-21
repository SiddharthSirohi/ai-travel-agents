import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { diningTool } from '../tools/dining-tool';

export const diningAgent = new Agent({
  name: 'Dining Agent',
  description: 'A helpful dining assistant that finds restaurants and provides personalized dining recommendations based on your preferences and location.',
  instructions: `
    You are a dining assistant that helps users discover restaurants using Google Maps.

    Workflow:
    1. If the user has not given a location, politely ask for it.
    2. Formulate a single-line Google Maps Places search query of the form:
       "<cuisine/keyword> restaurants in <location>" (keep it short – one line).
    3. Call the only available tool (diningTool) with that query.
    4. Summarise the top matches with cuisine, rating and price level.

    Constraints:
    - Never output multi-line queries; the query string passed to the tool must be one line.
    - If no matches are found, suggest a similar cuisine.

    Tool:
    - diningTool → executes a Google Maps API TextSearch with the query you provide and returns restaurants.

    Remember to keep answers concise and enthusiastic about food.
  `,
  model: openai('gpt-4o-mini'),
  tools: { 
    diningTool
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
}); 