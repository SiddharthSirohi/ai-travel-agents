import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TripState, ItineraryItem, ChatMessage, AgentStatus, TripDestination, TripDates, TravelPreferences, AgentType } from './types';

interface TripStore extends TripState {
  // Actions
  setDestination: (destination: TripDestination) => void;
  setDates: (dates: TripDates) => void;
  updatePreferences: (preferences: Partial<TravelPreferences>) => void;
  addItineraryItem: (item: ItineraryItem) => void;
  updateItineraryItem: (id: string, updates: Partial<ItineraryItem>) => void;
  removeItineraryItem: (id: string) => void;
  reorderItineraryItems: (items: ItineraryItem[]) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateAgentStatus: (type: AgentType, updates: Partial<AgentStatus>) => void;
  startPlanning: () => void;
  stopPlanning: () => void;
  resetTrip: () => void;
  calculateTotalCost: () => void;
}

const initialAgentStatuses: AgentStatus[] = [
  {
    type: 'flights',
    name: 'Flight Agent',
    emoji: '✈️',
    status: 'idle',
    lastUpdate: new Date().toISOString(),
  },
  {
    type: 'hotels',
    name: 'Hotel Agent',
    emoji: '🏨',
    status: 'idle',
    lastUpdate: new Date().toISOString(),
  },
  {
    type: 'dining',
    name: 'Dining Agent',
    emoji: '🍴',
    status: 'idle',
    lastUpdate: new Date().toISOString(),
  },
  {
    type: 'activities',
    name: 'Activity Agent',
    emoji: '🎟️',
    status: 'idle',
    lastUpdate: new Date().toISOString(),
  },
];

// Helper function to generate dates relative to today
const getRelativeDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Sample itinerary items for demonstration
const sampleItinerary: ItineraryItem[] = [
  {
    id: 'sample-flight-1',
    type: 'flight',
    title: 'Emirates EK215',
    description: 'Direct flight, Premium Economy',
    date: getRelativeDate(7),
    time: '06:30',
    duration: 480,
    location: 'Mumbai → Dubai',
    coordinates: [25.2532, 55.3657],
    price: 1250,
    currency: 'USD',
    status: 'confirmed',
    rating: 4.5,
    details: {
      airline: 'Emirates',
      flightNumber: 'EK215',
      class: 'Premium Economy',
      departure: 'BOM Terminal 2',
      arrival: 'DXB Terminal 3',
      baggage: '2x23kg included',
    },
  },
  {
    id: 'sample-hotel-1',
    type: 'hotel',
    title: 'The Taj Mahal Palace',
    description: 'Luxury heritage hotel overlooking the Arabian Sea',
    date: getRelativeDate(7),
    time: '15:00',
    duration: 1440,
    location: 'Colaba, Mumbai',
    coordinates: [18.9217, 72.8332],
    price: 450,
    currency: 'USD',
    status: 'confirmed',
    rating: 4.8,
    details: {
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: 'Sea View Room',
      amenities: ['WiFi', 'Gym', 'Spa', 'Pool', 'Restaurant'],
      cancellation: 'Free until 24h before',
    },
  },
  {
    id: 'sample-activity-1',
    type: 'activity',
    title: 'Gateway of India Tour',
    description: 'Guided heritage walk around the iconic monument',
    date: getRelativeDate(8),
    time: '10:00',
    duration: 180,
    location: 'Colaba, Mumbai',
    coordinates: [18.9220, 72.8347],
    price: 25,
    currency: 'USD',
    status: 'pending',
    rating: 4.6,
    details: {
      category: 'Sightseeing',
      duration: '3 hours',
      includes: ['Guide', 'Entry tickets'],
      difficulty: 'Easy',
    },
  },
  {
    id: 'sample-dining-1',
    type: 'meal',
    title: 'Trishna',
    description: 'Award-winning seafood restaurant',
    date: getRelativeDate(8),
    time: '13:00',
    duration: 120,
    location: 'Fort, Mumbai',
    coordinates: [18.9339, 72.8356],
    price: 80,
    currency: 'USD',
    status: 'confirmed',
    rating: 4.7,
    details: {
      cuisine: 'Seafood, Indian',
      dressCode: 'Smart casual',
      dietary: ['Vegetarian options available'],
      reservation: 'Confirmed',
    },
  },
  {
    id: 'sample-activity-2',
    type: 'activity',
    title: 'Mumbai Street Food Tour',
    description: 'Culinary adventure through local markets',
    date: getRelativeDate(8),
    time: '16:00',
    duration: 210,
    location: 'Various locations, Mumbai',
    coordinates: [19.0176, 72.8561],
    price: 35,
    currency: 'USD',
    status: 'pending',
    rating: 4.8,
    details: {
      category: 'Food & Culture',
      duration: '3.5 hours',
      includes: ['Food tastings', 'Guide', 'Transport'],
      difficulty: 'Easy',
    },
  },
  {
    id: 'sample-dining-2',
    type: 'meal',
    title: 'Britannia & Co.',
    description: 'Historic Parsi cafe',
    date: getRelativeDate(9),
    time: '12:30',
    duration: 90,
    location: 'Ballard Estate, Mumbai',
    coordinates: [18.9322, 72.8417],
    price: 25,
    currency: 'USD',
    status: 'pending',
    rating: 4.5,
    details: {
      cuisine: 'Parsi, Iranian',
      dressCode: 'Casual',
      dietary: ['Non-vegetarian'],
      reservation: 'Not required',
    },
  },
  {
    id: 'sample-activity-3',
    type: 'activity',
    title: 'Elephanta Caves Excursion',
    description: 'Ferry ride and exploration of ancient cave temples',
    date: getRelativeDate(9),
    time: '09:00',
    duration: 300,
    location: 'Elephanta Island',
    coordinates: [18.9633, 72.9315],
    price: 40,
    currency: 'USD',
    status: 'confirmed',
    rating: 4.5,
    details: {
      category: 'Cultural Heritage',
      duration: '5 hours',
      includes: ['Ferry tickets', 'Guide', 'Entry fees'],
      difficulty: 'Moderate',
    },
  },
  {
    id: 'sample-flight-2',
    type: 'flight',
    title: 'Air India AI191',
    description: 'Return flight, Economy',
    date: getRelativeDate(14),
    time: '18:45',
    duration: 240,
    location: 'Dubai → Mumbai',
    coordinates: [19.0896, 72.8656],
    price: 890,
    currency: 'USD',
    status: 'confirmed',
    rating: 4.2,
    details: {
      airline: 'Air India',
      flightNumber: 'AI191',
      class: 'Economy',
      departure: 'DXB Terminal 1',
      arrival: 'BOM Terminal 2',
      baggage: '1x23kg included',
    },
  },
];

const initialState: TripState = {
  destination: {
    id: '1',
    name: 'Mumbai',
    country: 'Maharashtra, India',
    coordinates: [19.0760, 72.8777],
  },
  dates: {
    startDate: getRelativeDate(7),
    endDate: getRelativeDate(14),
  },
  preferences: {
    budget: 'moderate',
    style: 'chill',
    travelers: 2,
    transport: undefined,
    accommodation: undefined,
    dietary: undefined,
    food: [],
    activities: [],
    groupType: undefined,
  },
  itinerary: sampleItinerary,
  chatMessages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to your AI Travel Companion! I\'m here to help you plan the perfect trip. Where would you like to go?',
      timestamp: new Date().toISOString(),
    },
  ],
  agentStatuses: initialAgentStatuses,
  isPlanning: false,
  totalCost: sampleItinerary.reduce((sum, item) => sum + item.price, 0),
};

export const useTripStore = create<TripStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDestination: (destination) =>
        set((state) => ({ destination }), false, 'setDestination'),

      setDates: (dates) =>
        set((state) => ({ dates }), false, 'setDates'),

      updatePreferences: (preferences) =>
        set(
          (state) => ({
            preferences: { ...state.preferences, ...preferences },
          }),
          false,
          'updatePreferences'
        ),

      addItineraryItem: (item) =>
        set(
          (state) => {
            const newItinerary = [...state.itinerary, item];
            const totalCost = newItinerary.reduce((sum, item) => sum + item.price, 0);
            return { itinerary: newItinerary, totalCost };
          },
          false,
          'addItineraryItem'
        ),

      updateItineraryItem: (id, updates) =>
        set(
          (state) => {
            const newItinerary = state.itinerary.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            );
            const totalCost = newItinerary.reduce((sum, item) => sum + item.price, 0);
            return { itinerary: newItinerary, totalCost };
          },
          false,
          'updateItineraryItem'
        ),

      removeItineraryItem: (id) =>
        set(
          (state) => {
            const newItinerary = state.itinerary.filter((item) => item.id !== id);
            const totalCost = newItinerary.reduce((sum, item) => sum + item.price, 0);
            return { itinerary: newItinerary, totalCost };
          },
          false,
          'removeItineraryItem'
        ),

      reorderItineraryItems: (items) =>
        set(
          (state) => ({ itinerary: items }),
          false,
          'reorderItineraryItems'
        ),

      addChatMessage: (message) =>
        set(
          (state) => ({
            chatMessages: [
              ...state.chatMessages,
              {
                ...message,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
              },
            ],
          }),
          false,
          'addChatMessage'
        ),

      updateAgentStatus: (type, updates) =>
        set(
          (state) => ({
            agentStatuses: state.agentStatuses.map((agent) =>
              agent.type === type
                ? { ...agent, ...updates, lastUpdate: new Date().toISOString() }
                : agent
            ),
          }),
          false,
          'updateAgentStatus'
        ),

      startPlanning: () => set({ isPlanning: true }, false, 'startPlanning'),

      stopPlanning: () => set({ isPlanning: false }, false, 'stopPlanning'),

      resetTrip: () => set(initialState, false, 'resetTrip'),

      calculateTotalCost: () =>
        set(
          (state) => ({
            totalCost: state.itinerary.reduce((sum, item) => sum + item.price, 0),
          }),
          false,
          'calculateTotalCost'
        ),
    }),
    {
      name: 'trip-store',
    }
  )
); 