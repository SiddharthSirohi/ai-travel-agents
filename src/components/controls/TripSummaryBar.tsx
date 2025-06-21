"use client";

import { MapPin, Calendar as CalendarIcon, Users, Mountain, Sparkles, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '../ui/button';

export function TripSummaryBar() {
  const { destination, dates, preferences, agentStatuses } = useTripStore();

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

      // For now, we are not handling the stream, just logging.
      console.log('Trip generation request successful.');
      console.log('response', response);
      // If you have a streaming response, you would handle it here.
      // e.g., const reader = response.body?.getReader();
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