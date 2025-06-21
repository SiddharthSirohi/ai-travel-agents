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

const initialState: TripState = {
  destination: null,
  dates: null,
  preferences: {
    budget: 5000,
    maxBudget: 10000,
    style: 'chill',
    travelers: 2,
  },
  itinerary: [],
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
  totalCost: 0,
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