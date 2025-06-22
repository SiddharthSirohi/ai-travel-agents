"use client";

import { useState } from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Mountain, Sparkles, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '../ui/button';
import { ItineraryItem } from '@/lib/types';
import { GeneratingTripModal } from '@/components/agents/GeneratingTripModal';

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

interface Experience {
  name: string;
  startTime: string;
  endTime: string;
  imageUrl: string;
  locationLatitude: number;
  locationLongitude: number;
  urlLink: string;
}

interface ExperienceDay {
  date: string;
  morningExperience?: Experience;
  afternoonExperience?: Experience;
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

const calculateDuration = (startTime: string, endTime: string): number => {
  // Parse times in HH:mm format
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Calculate total minutes from start of day
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Calculate duration
  return endTotalMinutes - startTotalMinutes;
};

export function TripSummaryBar() {
  const { destination, dates, preferences, agentStatuses, setItinerary, updateAgentStatus } = useTripStore();
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [isTripGenerated, setIsTripGenerated] = useState(false);

  const handleGenerateTrip = async () => {
    if (!destination || !dates) {
      console.error('Destination and dates must be set to generate a trip.');
      // Optionally, show a toast or other notification to the user
      return;
    }

    setIsGeneratingModalOpen(true);
    setIsTripGenerated(false);
    agentStatuses.forEach(agent => updateAgentStatus(agent.type, { status: 'working' }));

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
        agentStatuses.forEach(agent => updateAgentStatus(agent.type, { status: 'error' }));
        setIsGeneratingModalOpen(false);
        return;
      }

      const data = await response.json();
      
      agentStatuses.forEach(agent => updateAgentStatus(agent.type, { status: 'completed' }));
      setIsTripGenerated(true);
      
      console.log('Full API response structure:', data);
      
      // Log the messages structure to understand it better
      console.log('Messages count:', data.response?.messages?.length);
      data.response?.messages?.forEach((msg: any, index: number) => {
        console.log(`Message ${index}:`, {
          role: msg.role,
          contentLength: msg.content?.length,
          content: msg.content
        });
      });

      // Safely extract data with fallbacks
      let hotelsByDays = [];
      let mealsByDays = [];
      let experiencesByDays = [];

      try {
        hotelsByDays = data.response?.messages?.[1]?.content?.[0]?.result?.days || [];
        console.log('Hotels extracted:', hotelsByDays);
      } catch (e) {
        console.error('Error extracting hotels:', e);
      }

      try {
        // Look through all messages for meals data
        for (let i = 0; i < data.response.messages.length; i++) {
          const msg = data.response.messages[i];
          // Skip if no content
          if (!msg.content) continue;
          
          // Handle string content (tool call responses)
          if (typeof msg.content === 'string') {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.meals) {
                mealsByDays = parsed.meals;
                console.log(`Found meals in messages[${i}] (string content)`);
                break;
              }
              // Check for nested structure
              if (parsed.result?.meals) {
                mealsByDays = parsed.result.meals;
                console.log(`Found meals in messages[${i}].result (string content)`);
                break;
              }
            } catch (e) {
              // Not JSON or doesn't contain meals
            }
          }
          // Handle array content
          else if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              if (msg.content[j]?.result?.meals) {
                mealsByDays = msg.content[j].result.meals;
                console.log(`Found meals in messages[${i}].content[${j}]`);
                break;
              }
              // Check for nested result structure
              if (msg.content[j]?.result?.result?.meals) {
                mealsByDays = msg.content[j].result.result.meals;
                console.log(`Found meals in messages[${i}].content[${j}].result.result`);
                break;
              }
            }
          }
          if (mealsByDays.length > 0) break;
        }
        console.log('Meals extracted:', mealsByDays);
      } catch (e) {
        console.error('Error extracting meals:', e);
      }

            // Check if experiences exist in different locations
      try {
        // Look through all messages for experiences
        for (let i = 0; i < data.response.messages.length; i++) {
          const msg = data.response.messages[i];
          // Skip if no content
          if (!msg.content) continue;
          
          // Handle string content (tool call responses)
          if (typeof msg.content === 'string') {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.experiences) {
                experiencesByDays = parsed.experiences;
                console.log(`Found experiences in messages[${i}] (string content)`);
                break;
              }
            } catch (e) {
              // Not JSON or doesn't contain experiences
            }
          }
          // Handle array content
          else if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              if (msg.content[j]?.result?.experiences) {
                experiencesByDays = msg.content[j].result.experiences;
                console.log(`Found experiences in messages[${i}].content[${j}]`);
                break;
              }
            }
          }
          if (experiencesByDays.length > 0) break;
        }
        console.log('Experiences extracted:', experiencesByDays);
      } catch (e) {
        console.error('Error extracting experiences:', e);
      }

      // If no meals found and we have waypoints, create fallback meals
      if (mealsByDays.length === 0 && experiencesByDays.length > 0) {
        console.log('No meals found, creating fallback meals for each day');
        mealsByDays = experiencesByDays.map((expDay: ExperienceDay) => ({
          date: expDay.date,
          lunch: {
            name: 'Local Restaurant (Lunch)',
            cuisine: 'Local',
            rating: 4.0,
            priceRange: '$$',
            address: 'Local area restaurant',
            description: 'Enjoy local cuisine for lunch',
            specialties: ['Local specialties'],
            placeId: `fallback-lunch-${expDay.date}`,
            timeFrom: '12:00',
            timeTo: '14:00'
          },
          dinner: {
            name: 'Local Restaurant (Dinner)',
            cuisine: 'Local',
            rating: 4.0,
            priceRange: '$$',
            address: 'Local area restaurant',
            description: 'Enjoy local cuisine for dinner',
            specialties: ['Local specialties'],
            placeId: `fallback-dinner-${expDay.date}`,
            timeFrom: '19:00',
            timeTo: '21:00'
          }
        }));
      }

      console.log('Final extracted data:', {
        hotels: hotelsByDays.length,
        meals: mealsByDays.length,
        experiences: experiencesByDays.length
      });

      // Add detailed logging for experiences
      console.log('Raw experiences data:', experiencesByDays);
      experiencesByDays.forEach((day: ExperienceDay, index: number) => {
        console.log(`Day ${index} (${day.date}):`, {
          morningExperience: day.morningExperience ? {
            name: day.morningExperience.name,
            locationLatitude: day.morningExperience.locationLatitude,
            locationLongitude: day.morningExperience.locationLongitude,
            coordinateTypes: {
              lat: typeof day.morningExperience.locationLatitude,
              lng: typeof day.morningExperience.locationLongitude
            }
          } : null,
          afternoonExperience: day.afternoonExperience ? {
            name: day.afternoonExperience.name,
            locationLatitude: day.afternoonExperience.locationLatitude,
            locationLongitude: day.afternoonExperience.locationLongitude,
            coordinateTypes: {
              lat: typeof day.afternoonExperience.locationLatitude,
              lng: typeof day.afternoonExperience.locationLongitude
            }
          } : null
        });
      });

      const mealItems: ItineraryItem[] = (mealsByDays || []).flatMap((day: MealDay) => {
        const items: ItineraryItem[] = [];
        
        // Check if lunch exists and has required properties
        if (day.lunch && day.lunch.name) {
          const lunchItem: ItineraryItem = {
            id: `${day.date}-lunch-${day.lunch.placeId || 'unknown'}`,
            type: 'meal',
            title: day.lunch.name,
            description: day.lunch.description || 'Lunch venue',
            date: day.date,
            time: convertTime12to24(day.lunch.timeFrom || '12:00'),
            duration: 120,
            location: day.lunch.address || 'Address not available',
          coordinates: undefined, // Will be set after fetching from placeId
            price: 0, // Or parse from priceRange
            currency: 'USD',
            status: 'confirmed',
            rating: day.lunch.rating || 0,
            details: {
              cuisine: day.lunch.cuisine || 'Unknown',
              priceRange: day.lunch.priceRange || '$$',
              specialties: day.lunch.specialties || [],
              placeId: day.lunch.placeId,
          },
          };

          items.push(lunchItem);
        }
        
        // Check if dinner exists and has required properties
        if (day.dinner && day.dinner.name) {
          const dinnerItem: ItineraryItem = {
            id: `${day.date}-dinner-${day.dinner.placeId || 'unknown'}`,
            type: 'meal',
            title: day.dinner.name,
            description: day.dinner.description || 'Dinner venue',
            date: day.date,
            time: convertTime12to24(day.dinner.timeFrom || '19:00'),
            duration: 120,
            location: day.dinner.address || 'Address not available',
          coordinates: undefined, // Will be set after fetching from placeId
            price: 0,
            currency: 'USD',
            status: 'confirmed',
            rating: day.dinner.rating || 0,
            details: {
              cuisine: day.dinner.cuisine || 'Unknown',
              priceRange: day.dinner.priceRange || '$$',
              specialties: day.dinner.specialties || [],
              placeId: day.dinner.placeId,
          },
          };
          items.push(dinnerItem);
        }
        
        return items;
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

      // Parse experiences
      const experienceItems: ItineraryItem[] = (experiencesByDays || []).flatMap((day: ExperienceDay) => {
        const items: ItineraryItem[] = [];
        
        if (day.morningExperience) {
          const exp = day.morningExperience;
          const duration = calculateDuration(exp.startTime, exp.endTime);
          
          // Validate coordinates
          const lat = Number(exp.locationLatitude);
          const lng = Number(exp.locationLongitude);
          const hasValidCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          
          console.log(`Morning experience ${exp.name} coordinates:`, {
            raw: { lat: exp.locationLatitude, lng: exp.locationLongitude },
            parsed: { lat, lng },
            valid: hasValidCoordinates
          });
          
          items.push({
            id: `${day.date}-morning-experience-${exp.name.replace(/\s+/g, '-')}`,
            type: 'activity',
            title: exp.name,
            description: 'Morning experience',
            date: day.date,
            time: exp.startTime,
            duration: duration,
            location: `${exp.locationLatitude}, ${exp.locationLongitude}`,
            coordinates: hasValidCoordinates ? [lat, lng] : undefined,
            price: 0, // Price not available in the data
            currency: 'USD',
            status: 'confirmed',
            imageUrl: exp.imageUrl,
            details: {
              urlLink: exp.urlLink,
              timeSlot: 'morning',
              startTime: exp.startTime,
              endTime: exp.endTime
            }
          });
        }
        
        if (day.afternoonExperience) {
          const exp = day.afternoonExperience;
          const duration = calculateDuration(exp.startTime, exp.endTime);
          
          // Validate coordinates
          const lat = Number(exp.locationLatitude);
          const lng = Number(exp.locationLongitude);
          const hasValidCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          
          console.log(`Afternoon experience ${exp.name} coordinates:`, {
            raw: { lat: exp.locationLatitude, lng: exp.locationLongitude },
            parsed: { lat, lng },
            valid: hasValidCoordinates
          });
          
          items.push({
            id: `${day.date}-afternoon-experience-${exp.name.replace(/\s+/g, '-')}`,
            type: 'activity',
            title: exp.name,
            description: 'Afternoon experience',
            date: day.date,
            time: exp.startTime,
            duration: duration,
            location: `${exp.locationLatitude}, ${exp.locationLongitude}`,
            coordinates: hasValidCoordinates ? [lat, lng] : undefined,
            price: 0, // Price not available in the data
            currency: 'USD',
            status: 'confirmed',
            imageUrl: exp.imageUrl,
            details: {
              urlLink: exp.urlLink,
              timeSlot: 'afternoon',
              startTime: exp.startTime,
              endTime: exp.endTime
            }
          });
        }
        
        return items;
      });

      // Fetch coordinates for meals using placeId
      const mealItemsWithCoordinates = await Promise.all(
        mealItems.map(async (item) => {
          if (item.details?.placeId && !item.coordinates) {
            console.log(`Fetching coordinates for meal: ${item.title} (${item.details.placeId})`);
            const coordinates = await getCoordinatesFromPlaceId(item.details.placeId);
            if (coordinates) {
              console.log(`Got coordinates for ${item.title}:`, coordinates);
              return { ...item, coordinates };
            } else {
              console.log(`Failed to get coordinates for ${item.title}`);
            }
          }
          return item;
        })
      );

      setItinerary([...mealItemsWithCoordinates, ...hotelItems, ...experienceItems]);

      // Add debugging logs
      console.log("=== DEBUGGING ITINERARY ITEMS ===");
      console.log("Meal items:", mealItemsWithCoordinates.map(item => ({
        id: item.id,
        title: item.title,
        coordinates: item.coordinates,
        type: item.type
      })));
      console.log("Hotel items:", hotelItems.map(item => ({
        id: item.id,
        title: item.title,
        coordinates: item.coordinates,
        type: item.type
      })));
      console.log("Experience items:", experienceItems.map(item => ({
        id: item.id,
        title: item.title,
        coordinates: item.coordinates,
        type: item.type,
        locationData: {
          locationLatitude: item.details?.locationLatitude,
          locationLongitude: item.details?.locationLongitude
        }
      })));
      console.log("All itinerary items with coordinates:", [...mealItemsWithCoordinates, ...hotelItems, ...experienceItems].filter(item => item.coordinates));

      console.log("data", data);

    } catch (error) {
      console.error('An error occurred while generating the trip:', error);
      agentStatuses.forEach(agent => updateAgentStatus(agent.type, { status: 'error' }));
      setIsGeneratingModalOpen(false);
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
    <>
      <GeneratingTripModal
        isOpen={isGeneratingModalOpen}
        onClose={() => setIsGeneratingModalOpen(false)}
        isSuccess={isTripGenerated}
      />
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
    </>
  );
} 