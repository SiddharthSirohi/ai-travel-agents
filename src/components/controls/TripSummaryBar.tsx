"use client";

import { MapPin, Calendar as CalendarIcon, Users, Mountain, Sparkles, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '../ui/button';
import { ItineraryItem } from '@/lib/types';

interface Meal {
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  address: string;
  description: string;
  specialties: string[];
  placeId: string;
  timeFrom: string;
  timeTo: string;
  location?: string;
}

interface MealDay {
  date: string;
  lunch: Meal;
  dinner: Meal;
}

interface HotelInfo {
  name: string;
  type: string;
  rating: number;
  priceRange: string;
  location: string;
  summary: string;
  placeId: string;
}

interface HotelDay {
  date: string;
  hotel_info: HotelInfo;
}

const convertTime12to24 = (time: string): string => {
  if (!time) return '00:00';
  const timeUpper = time.toUpperCase();
  const isPM = timeUpper.includes('PM');
  let [hours] = timeUpper.split(/[^\d]/).map(Number);

  if (isNaN(hours)) return '00:00';

  if (isPM && hours !== 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:00`;
};

// Function to get coordinates from Google Places API using placeId
const getCoordinatesFromPlaceId = async (placeId: string): Promise<[number, number] | undefined> => {
  if (!placeId) return undefined;
  
  try {
    const response = await fetch(`/api/places/${placeId}`);
    if (!response.ok) {
      console.warn(`Failed to fetch coordinates for placeId: ${placeId}, status: ${response.status}`);
      const errorText = await response.text();
      console.warn(`Error response:`, errorText);
      return undefined;
    }
    
    const data = await response.json();
    console.log(`API response for placeId ${placeId}:`, data);
    if (data.coordinates) {
      return [data.coordinates.lat, data.coordinates.lng];
    }
    console.warn(`No coordinates in response for placeId: ${placeId}`);
    return undefined;
  } catch (error) {
    console.error(`Error fetching coordinates for placeId ${placeId}:`, error);
    return undefined;
  }
};

export function TripSummaryBar() {
  const { destination, dates, preferences, agentStatuses, setItinerary } = useTripStore();

  const handleGenerateTrip = async () => {
    if (!destination || !dates) {
      console.error('Destination and dates must be set to generate a trip.');
      // Optionally, show a toast or other notification to the user
      return;
    }

    const payload = {
      destinationCity: destination.name,
      startDate: dates.startDate,
      endDate: dates.endDate,
      profile: {
        budgetTier: preferences.budget,
        travellerCount: preferences.travelers,
        travelStyle: preferences.style,
        groupType: preferences.groupType || 'solo', // default to solo
        preferredTransport: preferences.transport || 'unknown', // default
        accommodationType: preferences.accommodation || 'unknown', // default
        dietaryPreference: preferences.dietary || 'none', // default
        foodExperiences: preferences.food,
        activityTypes: preferences.activities,
      },
    };

    console.log('Generating trip with payload:', payload);

    try {
      const response = await fetch('/api/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to generate trip:', response.status, errorData);
        // Here you might want to update some state to show an error to the user
        return;
      }

      // Parse the JSON response from the server (non-streaming)
      const data = await response.json();
      const mealsByDays = data.response.messages[1].content[1].result.result.meals;
      const hotelsByDays = data.response.messages[1].content[0].result.days;

      console.log('Meals by days:', mealsByDays);
      console.log('Hotels by days:', hotelsByDays);
      console.log('Trip generation response:', data);

      const mealItems: ItineraryItem[] = mealsByDays.flatMap((day: MealDay) => {
        const lunchItem: ItineraryItem = {
          id: `${day.date}-lunch-${day.lunch.placeId}`,
          type: 'meal',
          title: day.lunch.name,
          description: day.lunch.description,
          date: day.date,
          time: convertTime12to24(day.lunch.timeFrom),
          duration: 120,
          location: day.lunch.address,
          coordinates: undefined, // Will be set after fetching from placeId
          price: 0, // Or parse from priceRange
          currency: 'USD',
          status: 'confirmed',
          rating: day.lunch.rating,
          details: {
            cuisine: day.lunch.cuisine,
            priceRange: day.lunch.priceRange,
            specialties: day.lunch.specialties,
            placeId: day.lunch.placeId,
          },
        };

        const dinnerItem: ItineraryItem = {
          id: `${day.date}-dinner-${day.dinner.placeId}`,
          type: 'meal',
          title: day.dinner.name,
          description: day.dinner.description,
          date: day.date,
          time: convertTime12to24(day.dinner.timeFrom),
          duration: 120,
          location: day.dinner.address,
          coordinates: undefined, // Will be set after fetching from placeId
          price: 0,
          currency: 'USD',
          status: 'confirmed',
          rating: day.dinner.rating,
          details: {
            cuisine: day.dinner.cuisine,
            priceRange: day.dinner.priceRange,
            specialties: day.dinner.specialties,
            placeId: day.dinner.placeId,
          },
        };
        return [lunchItem, dinnerItem];
      });

      const hotelItems: ItineraryItem[] = (hotelsByDays || []).map((day: HotelDay) => {
        const [lat, lng] = day.hotel_info.location.split(',').map(Number);
        return {
          id: `${day.date}-hotel-${day.hotel_info.placeId}`,
          type: 'hotel',
          title: day.hotel_info.name,
          description: day.hotel_info.summary,
          date: day.date,
          time: '00:00', // Typical check-in time
          duration: 1440, // Full day
          location: day.hotel_info.name.split('|')[0].trim(),
          coordinates: [lat, lng] as [number, number],
          price: 0,
          currency: 'USD',
          status: 'confirmed',
          rating: day.hotel_info.rating,
          details: {
            ...day.hotel_info
          }
        };
      });

      // Fetch coordinates for meal items using their placeIds
      const mealItemsWithCoords = await Promise.all(
        mealItems.map(async (item) => {
          const placeId = item.details.placeId;
          console.log(`Processing meal item: ${item.title}, placeId: ${placeId}`);
          if (placeId) {
            const coordinates = await getCoordinatesFromPlaceId(placeId);
            console.log(`Coordinates for ${item.title}:`, coordinates);
            return { ...item, coordinates };
          }
          console.log(`No placeId for meal: ${item.title}`);
          return item;
        })
      );

      console.log('Final meal items with coordinates:', mealItemsWithCoords);
      console.log('Meal items with valid coordinates:', mealItemsWithCoords.filter(item => item.coordinates));
      console.log('Meal items without coordinates:', mealItemsWithCoords.filter(item => !item.coordinates));
      console.log('Final hotel items:', hotelItems);
      
      setItinerary([...mealItemsWithCoords, ...hotelItems]);

    } catch (error) {
      console.error('An error occurred while generating the trip:', error);
    }
  };

  const formatDates = () => {
    if (!dates) return 'Dates not set';
    const start = new Date(dates.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(dates.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const getBudgetIcon = () => {
    switch (preferences.budget) {
      case 'budget':
        return '💰';
      case 'moderate':
        return '💳';
      case 'luxury':
        return '💎';
      default:
        return '';
    }
  };

  const getStyleIcon = () => {
    switch (preferences.style) {
      case 'adventure':
        return <Mountain className="w-4 h-4" />;
      case 'luxury':
        return <Crown className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />;
      case 'completed':
        return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
      case 'error':
        return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
      default:
        return <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Trip Info */}
        <div className="flex flex-wrap items-center gap-2 text-sm items-center">
          <BrandLogo size={32} className="mr-2" />
          {destination && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              <MapPin className="w-3 h-3" />
              {destination.name}
            </Badge>
          )}
          {dates && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDates()}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
            <Users className="w-3 h-3" />
            {preferences.travelers}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
            {getStyleIcon()}
            {preferences.style}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs">{getBudgetIcon()}</span>
            {preferences.budget}
          </Badge>
        </div>

        {/* Right: Agent statuses and Generate button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {agentStatuses.map((agent) => (
              <Tooltip key={agent.type}>
                <TooltipTrigger asChild>
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <span className="text-sm" title={agent.name}>{agent.emoji}</span>
                    <div className="absolute -top-0.5 -right-0.5">{getStatusIcon(agent.status)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-center">
                    <div className="font-medium text-xs">{agent.name}</div>
                    <div className="text-xs capitalize">{agent.status}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Button onClick={handleGenerateTrip} size="sm">
            Generate Trip Plan
          </Button>
        </div>
      </div>
    </div>
  );
} 