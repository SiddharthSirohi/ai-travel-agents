export interface TripDestination {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
}

export interface TripDates {
  startDate: string;
  endDate: string;
}

export interface TravelPreferences {
  budget: 'budget' | 'moderate' | 'luxury';
  style: 'adventure' | 'chill' | 'luxury';
  travelers: number;
  // FOLLOW-UP PREFERENCES
  transport?: 'flight' | 'train' | 'bus' | 'car';
  accommodation?: 'hotel' | 'hostel' | 'resort' | 'apartment';
  dietary?: 'vegetarian' | 'non-vegetarian' | 'both';
  food?: string[]; // e.g. ["street food", "fine dining"]
  activities?: string[]; // e.g. ["outdoors", "museums"]
  groupType?: 'solo' | 'couple' | 'family' | 'friends';
}

export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'meal' | 'activity';
  title: string;
  description: string;
  date: string;
  time: string;
  duration?: number; // in minutes
  location: string;
  coordinates?: [number, number];
  price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'alternative';
  imageUrl?: string;
  rating?: number;
  details: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentType?: AgentType;
}

export type AgentType = 'flights' | 'hotels' | 'dining' | 'activities';

export interface AgentStatus {
  type: AgentType;
  name: string;
  emoji: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  lastUpdate: string;
  progress?: number;
}

export interface TripState {
  destination: TripDestination | null;
  dates: TripDates | null;
  preferences: TravelPreferences;
  itinerary: ItineraryItem[];
  chatMessages: ChatMessage[];
  agentStatuses: AgentStatus[];
  isPlanning: boolean;
  totalCost: number;
}

export interface WebSocketMessage {
  type: 'chat' | 'itinerary_update' | 'agent_status' | 'system';
  payload: any;
  timestamp: string;
} 