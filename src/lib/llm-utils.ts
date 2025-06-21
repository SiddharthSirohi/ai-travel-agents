import { openai } from '@ai-sdk/openai';
import { generateObject, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';

/**
 * Generate a strongly-typed object from an LLM using the AI-SDK `generateObject` helper.
 * Falls back to a single retry with a lower temperature before returning `null`.
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  prompt: string,
  opts: {
    temperature?: number;
  } = {}
): Promise<T | null> {
  const { temperature = 0.2 } = opts;

  async function call(temp: number) {
    return await generateObject({
      model: openai('gpt-4o-mini'),
      schema,
      prompt,
      temperature: temp,
      mode: 'json', // force JSON-only mode when supported
    });
  }

  try {
    const { object } = await call(temperature);
    return object as T;
  } catch (err) {
    // retry once with lower temperature if validation / parse failed
    if (NoObjectGeneratedError.isInstance(err)) {
      try {
        const { object } = await call(Math.max(0, temperature - 0.1));
        return object as T;
      } catch (err2) {
        console.warn('generateStructured: retry failed', err2);
        return null;
      }
    }
    console.warn('generateStructured error', err);
    return null;
  }
} 