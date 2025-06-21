import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface EventSuggestion {
  title: string;
  description: string;
  date: string;
  link?: string;
  sources?: string[];
}

export const perplexityEventsTool = createTool({
  id: 'get-local-events',
  description:
    'Use Perplexity AI to fetch unique local events or small experiences for a given location and date range',
  inputSchema: z.object({
    location: z.string().describe('City or area name'),
    dateRange: z
      .string()
      .describe('Desired date range in format YYYY-MM-DD to YYYY-MM-DD'),
    interests: z
      .string()
      .describe('Comma-separated list of user interests (e.g. "food, art")'),
  }),
  outputSchema: z.object({
    events: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        link: z.string().optional(),
        sources: z.array(z.string()).optional(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    return await fetchEvents(
      context.location,
      context.dateRange,
      context.interests,
    );
  },
});

const fetchEvents = async (
  location: string,
  dateRange: string,
  interests: string,
): Promise<{ events: EventSuggestion[] }> => {
  const pplxKey = process.env.PPLX_API_KEY;
  if (!pplxKey) {
    throw new Error('PPLX_API_KEY env variable is not set');
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful travel assistant. Find unique local events and respond in valid JSON format. Always include specific dates when available.',
    },
    {
      role: 'user',
      content: `Find up to 7 unique, small-scale events or short experiences happening in ${location} between ${dateRange} that would interest travelers who like: ${interests}. Include local festivals, markets, exhibitions, pop-ups, cultural events, workshops, etc. For each event, provide the specific date if available. Return response as valid JSON with this exact structure: {"events":[{"title":"Event Name","description":"Brief description with specific details","date":"YYYY-MM-DD or date range","link":"optional direct event URL if mentioned"}]}`,
    },
  ];

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${pplxKey}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages,
      stream: false,
      search_mode: 'web',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Perplexity API response:', response.status, errorText);
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { 
    choices: { message: { content: string } }[];
    citations?: string[];
    search_results?: { title: string; url: string; date?: string }[];
  };
  
  const content = data.choices?.[0]?.message?.content ?? '';
  
  // Extract source URLs from citations and search_results
  const sources: string[] = [];
  
  // Add citations (being deprecated but still available)
  if (data.citations) {
    sources.push(...data.citations);
  }
  
  // Add search_results URLs (newer format)
  if (data.search_results) {
    sources.push(...data.search_results.map(result => result.url));
  }

  try {
    // Handle potential <think> tags in reasoning models
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.events)) {
        // Add sources to each event
        const eventsWithSources = parsed.events.slice(0, 7).map((event: any) => ({
          ...event,
          sources: sources.length > 0 ? sources : undefined
        }));
        
        return { events: eventsWithSources };
      }
    }
  } catch (e) {
    console.error('Failed to parse Perplexity response:', e);
    console.error('Response content:', content);
    console.log('Available sources:', sources);
  }

  // If parsing fails but we have sources, return them with a fallback event
  if (sources.length > 0) {
    return {
      events: [{
        title: `Events in ${location}`,
        description: `Check the sources for current events in ${location} during ${dateRange}`,
        date: dateRange.split(' to ')[0] || new Date().toISOString().split('T')[0],
        sources: sources
      }]
    };
  }

  // If everything fails, return empty list
  return { events: [] };
}; 