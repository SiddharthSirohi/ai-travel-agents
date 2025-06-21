import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface Accommodation {
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  placeId: string;
}

export const accommodationSearchTool = createTool({
  id: 'search-accommodations',
  description:
    'Search for accommodations (hotels, hostels, inns, B&Bs, rentals) in a given location. Returns up to 10 highly-rated results.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'A natural-language query describing the desired stay, e.g. "affordable 4-star hotels in Paris"',
      ),
  }),
  outputSchema: z.object({
    accommodations: z.array(
      z.object({
        name: z.string(),
        address: z.string(),
        rating: z.number(),
        userRatingsTotal: z.number(),
        priceLevel: z.number().optional(),
        placeId: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    return await searchAccommodations(context.query);
  },
});

const searchAccommodations = async (
  query: string,
): Promise<{ accommodations: Accommodation[] }> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable not set');
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query,
    )}&type=lodging&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { results: any[] };

  const accommodations: Accommodation[] = data.results
    .filter((p) => p.rating && p.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      address: p.formatted_address ?? p.vicinity ?? '',
      rating: p.rating,
      userRatingsTotal: p.user_ratings_total,
      priceLevel: p.price_level,
      placeId: p.place_id,
    }));

  return { accommodations };
}; 