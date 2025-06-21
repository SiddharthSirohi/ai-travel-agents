import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Simulate a streaming response
        const responses = [
          "I'm analyzing your request...\n\n",
          "Let me search for travel options...\n\n",
          "🔍 Checking flights...\n",
          "✅ Found some great flight options!\n\n",
          "🏨 Looking for accommodations...\n",
          "✅ Found perfect hotels for your stay!\n\n",
          "🍽️ Searching for dining recommendations...\n",
          "✅ Discovered amazing local restaurants!\n\n",
          "🎟️ Finding activities and attractions...\n",
          "✅ Curated exciting activities for you!\n\n",
          `Based on your request about "${message}", I've found comprehensive travel options including flights, hotels, dining, and activities. Check your timeline for the detailed itinerary!`
        ];
        
        for (let i = 0; i < responses.length; i++) {
          const chunk = responses[i];
          
          // Format as Server-Sent Events
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          // Add delay between chunks to simulate real streaming
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        }
        
        // Send final done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred on the server.' }), 
      { status: 500 }
    );
  }
} 