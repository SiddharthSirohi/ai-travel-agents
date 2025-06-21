import { ItineraryItem, AgentType, TripDestination } from './types';

// Mock data for destinations
export const mockDestinations: TripDestination[] = [
  {
    id: '1',
    name: 'Tokyo',
    country: 'Japan',
    coordinates: [35.6762, 139.6503],
  },
  {
    id: '2',
    name: 'Paris',
    country: 'France',
    coordinates: [48.8566, 2.3522],
  },
  {
    id: '3',
    name: 'New York',
    country: 'United States',
    coordinates: [40.7128, -74.0060],
  },
  {
    id: '4',
    name: 'Bali',
    country: 'Indonesia',
    coordinates: [-8.3405, 115.0920],
  },
];

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock agent responses
export const mockAgentResponses = {
  flights: [
    {
      id: `flight-${Date.now()}`,
      type: 'flight' as const,
      title: 'Emirates EK215',
      description: 'Direct flight, Premium Economy',
      date: '2024-03-15',
      time: '14:30',
      duration: 480,
      location: 'JFK → NRT',
      coordinates: [35.7647, 140.3864] as [number, number],
      price: 1250,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.5,
      details: {
        airline: 'Emirates',
        flightNumber: 'EK215',
        class: 'Premium Economy',
        departure: 'JFK Terminal 4',
        arrival: 'Narita Terminal 1',
        baggage: '2x23kg included',
      },
    },
    {
      id: `flight-${Date.now() + 1}`,
      type: 'flight' as const,
      title: 'United UA837',
      description: 'Direct flight, Economy',
      date: '2024-03-15',
      time: '16:45',
      duration: 465,
      location: 'JFK → NRT',
      coordinates: [35.7647, 140.3864] as [number, number],
      price: 890,
      currency: 'USD',
      status: 'alternative' as const,
      rating: 4.2,
      details: {
        airline: 'United',
        flightNumber: 'UA837',
        class: 'Economy',
        departure: 'JFK Terminal 7',
        arrival: 'Narita Terminal 1',
        baggage: '1x23kg included',
      },
    },
  ],
  hotels: [
    {
      id: `hotel-${Date.now()}`,
      type: 'hotel' as const,
      title: 'Park Hyatt Tokyo',
      description: 'Luxury hotel in Shinjuku with city views',
      date: '2024-03-15',
      time: '15:00',
      location: 'Shinjuku, Tokyo',
      coordinates: [35.6869, 139.6922] as [number, number],
      price: 450,
      currency: 'USD',
      status: 'pending' as const,
      imageUrl: '/api/placeholder/300/200',
      rating: 4.8,
      details: {
        checkIn: '15:00',
        checkOut: '11:00',
        roomType: 'Deluxe Room',
        amenities: ['WiFi', 'Gym', 'Spa', 'Pool', 'Restaurant'],
        cancellation: 'Free until 24h before',
      },
    },
  ],
  dining: [
    {
      id: `dining-${Date.now()}`,
      type: 'meal' as const,
      title: 'Sukiyabashi Jiro',
      description: 'World-famous sushi restaurant',
      date: '2024-03-16',
      time: '19:00',
      duration: 120,
      location: 'Ginza, Tokyo',
      coordinates: [35.6717, 139.7634] as [number, number],
      price: 300,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.9,
      details: {
        cuisine: 'Japanese',
        dressCode: 'Smart casual',
        dietary: ['No vegetarian options'],
        reservation: 'Required 2 months ahead',
      },
    },
  ],
  activities: [
    {
      id: `activity-${Date.now()}`,
      type: 'activity' as const,
      title: 'Tokyo Skytree Visit',
      description: 'Observation deck with panoramic city views',
      date: '2024-03-17',
      time: '10:00',
      duration: 180,
      location: 'Sumida, Tokyo',
      coordinates: [35.7101, 139.8107] as [number, number],
      price: 25,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.6,
      details: {
        category: 'Sightseeing',
        duration: '3 hours',
        includes: ['Skip-the-line tickets', 'Audio guide'],
        difficulty: 'Easy',
      },
    },
  ],
};

// Simulate agent API calls
export const callAgent = async (
  agentType: AgentType,
  query: string,
  preferences: any
): Promise<ItineraryItem[]> => {
  await delay(2000 + Math.random() * 3000); // Random delay 2-5 seconds
  
  const responses = mockAgentResponses[agentType];
  if (!responses) return [];
  
  // Simulate some randomness in results
  const shouldFail = Math.random() < 0.1; // 10% chance of failure
  if (shouldFail) {
    throw new Error(`${agentType} agent temporarily unavailable`);
  }
  
  return responses.slice(0, Math.ceil(Math.random() * responses.length));
};

// Simulate getting alternative options
export const getAlternatives = async (
  itemId: string,
  itemType: AgentType
): Promise<ItineraryItem[]> => {
  await delay(1500 + Math.random() * 2000);
  
  const responses = mockAgentResponses[itemType];
  return responses.filter(item => item.id !== itemId);
};

// Mock WebSocket hook (placeholder)
export const useWebSocket = (url: string) => {
  return {
    isConnected: false,
    sendMessage: (message: any) => {
      console.log('Mock WebSocket send:', message);
    },
    lastMessage: null,
  };
}; 