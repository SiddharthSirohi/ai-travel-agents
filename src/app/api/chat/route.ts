import { NextRequest } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A non-empty "message" field is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Retrieve the orchestrator agent registered in src/mastra/index.ts
    const agent = mastra.getAgent('orchestrator');

    if (!agent) throw new Error('Could not locate orchestrator agent');

    // Stream the agent response back to the client as SSE
    const responseStream = await agent.stream(
      [{ role: 'user', content: message }],
      { maxSteps: 8 },
    );

    return responseStream.toDataStreamResponse();
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred on the server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
} 