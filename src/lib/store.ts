import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TripState, ItineraryItem, ChatMessage, AgentStatus, TripDestination, TripDates, TravelPreferences, AgentType } from './types';

interface TripStore extends TripState {
  // Actions
  setDestination: (destination: TripDestination) => void;
  setDates: (dates: TripDates) => void;
  updatePreferences: (preferences: Partial<TravelPreferences>) => void;
  setItinerary: (itinerary: ItineraryItem[]) => void;
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
    name: 'Transport Agent',
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

const welcomeItem: ItineraryItem = {
  id: 'welcome-item',
  type: 'activity',
  title: 'Your Adventure Awaits',
  description: 'Welcome to Columbus! Tell us your travel plans to get started.',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  duration: 120,
  location: 'Your next destination',
  price: 0,
  currency: 'USD',
  status: 'pending',
  rating: 5,
  details: {
    category: 'Planning',
  },
};

const initialState: TripState = {
  destination: null,
  dates: null,
  preferences: {
    budget: 'moderate',
    style: 'chill',
    travelers: 1,
    groupType: 'solo',
  },
  itinerary: [welcomeItem],
  chatMessages: [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "I hope you like the itinerary! Let me know if you need any help or want to make changes.",
      timestamp: new Date().toISOString(),
    },
  ],
  agentStatuses: initialAgentStatuses,
  isPlanning: false,
  totalCost: 0,
};

export const useTripStore = create<TripStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDestination: (destination) => set({ destination }),

      setDates: (dates) => set({ dates }),

      updatePreferences: (preferences) =>
        set((state) => ({ preferences: { ...state.preferences, ...preferences } })),

      setItinerary: (itinerary) => set({ itinerary }),

      addItineraryItem: (item) =>
        set((state) => ({ itinerary: [...state.itinerary, item] })),

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