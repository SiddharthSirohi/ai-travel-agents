import { accommodationAgent } from './src/mastra/agents/accommodation-agent';

(async () => {
  const prompt =
    'Find me 4-star (or better) hotels in Florence under €250 per night at the end of July';
  const llmResponse = await accommodationAgent.stream([
    { role: 'user', content: prompt },
  ]);

  // The agent streams tokens; collect them so we can print the final JSON
  let full = '';
  for await (const chunk of llmResponse.textStream) {
    process.stdout.write(chunk);       // live typing effect
    full += chunk;
  }

  console.log('\n\n---- Parsed JSON ----');
  console.log(JSON.parse(full));       // full now contains the strict JSON
})();