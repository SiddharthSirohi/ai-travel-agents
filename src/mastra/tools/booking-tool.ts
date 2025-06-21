import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchBookingHotels } from '../../../bookingdotcom_scraper';

export const bookingSearchTool = createTool({
  id: 'search-booking-hotels',
  description: 'Search for hotel accommodations on Booking.com with specific dates, location, and guest requirements',
  inputSchema: z.object({
    city: z.string().describe('City or location to search for hotels (e.g., "Mumbai, India", "New York, USA")'),
    checkin: z.string().describe('Check-in date in YYYY-MM-DD format (e.g., "2025-12-20")'),
    checkout: z.string().describe('Check-out date in YYYY-MM-DD format (e.g., "2025-12-22")'),
    adults: z.number().describe('Number of adult guests'),
    rooms: z.number().describe('Number of rooms required'),
    children: z.number().optional().default(0).describe('Number of children (optional, defaults to 0)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    hotels: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        location: z.string(),
        dates: z.string(),
        guests: z.string(),
        rooms: z.number(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { city, checkin, checkout, adults, rooms, children = 0 } = context;
    
    try {
      console.log(`Searching Booking.com for hotels in ${city} from ${checkin} to ${checkout}`);
      
      const hotels = await searchBookingHotels(
        city,
        checkin,
        checkout,
        adults,
        rooms,
        children
      );

      if (hotels.length === 0) {
        return {
          success: false,
          message: `No hotels found for ${city} on the specified dates`,
          hotels: []
        };
      }

      return {
        success: true,
        message: `Found ${hotels.length} hotels in ${city}`,
        hotels: hotels.map(hotel => ({
          name: hotel.name,
          price: hotel.price,
          location: city,
          dates: `${checkin} to ${checkout}`,
          guests: `${adults} adults${children > 0 ? `, ${children} children` : ''}`,
          rooms: rooms
        }))
      };
    } catch (error) {
      console.error('Booking.com search error:', error);
      return {
        success: false,
        message: `Error searching for hotels: ${error instanceof Error ? error.message : 'Unknown error'}`,
        hotels: []
      };
    }
  },
}); 