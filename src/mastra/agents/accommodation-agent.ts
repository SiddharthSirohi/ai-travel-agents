import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { accommodationSearchTool } from '../tools/accommodation-tool';

export const accommodationAgent = new Agent({
  name: 'Accommodation Search Agent',
  model: openai('gpt-4o'),
  instructions: `
    You are an expert travel accommodation assistant.

    Workflow:
    1. Interpret the user's request for places to stay. Identify location, accommodation type preferences (hotel, hostel, Airbnb, etc.), star or rating requirements, and any budget limits.
    2. Compose an appropriate \"query\" string and call the \"search-accommodations\" tool to fetch candidate properties.
    3. Select the three most suitable options based on rating (>=4), relevance to the user's preferences, and number of reviews.
    4. Reply ONLY with a valid JSON object that conforms exactly to this schema (no markdown):

    {
      "results": [
        {
          "name": string,
          "address": string,
          "rating": number,
          "userRatingsTotal": number,
          "priceLevel": number | null,
          "whySpecial": string
        },
        ... up to 3 items
      ]
    }

    "whySpecial" should be a short sentence (max 25 words) explaining why the accommodation stands out for the user.

    Do NOT add any extra keys or commentary outside the JSON.
  `,
  tools: { accommodationSearchTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
}); 