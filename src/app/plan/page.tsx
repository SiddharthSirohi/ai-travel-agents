"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DestinationSearch } from '@/components/controls/DestinationSearch';
import { useTripStore } from '@/lib/store';
import { TripDestination } from '@/lib/types';
import { FollowupQuestions } from '@/components/FollowupQuestions';

export default function PlanPage() {
  const router = useRouter();
  const {
    destination: storeDest,
    dates: storeDates,
    preferences: storePrefs,
    setDestination,
    setDates,
    updatePreferences,
  } = useTripStore();

  const [origin, setOrigin] = useState<TripDestination | null>(null);
  const [destination, setDestinationState] = useState<TripDestination | null>(storeDest);
  const [startDate, setStartDate] = useState(storeDates?.startDate || '');
  const [endDate, setEndDate] = useState(storeDates?.endDate || '');
  const [budget, setBudget] = useState<'budget' | 'moderate' | 'luxury'>(storePrefs.budget);
  const [travelers, setTravelers] = useState(storePrefs.travelers);
  const [travelStyle, setTravelStyle] = useState<'adventure' | 'chill' | 'luxury'>(storePrefs.style);
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'friends'>(storePrefs.groupType || 'solo');
  const [stage, setStage] = useState<'initial' | 'followup'>('initial');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;

    // Persist to store (origin not yet supported in store)
    setDestination(destination);
    setDates({ startDate, endDate });
    updatePreferences({ budget, travelers, style: travelStyle, groupType });

    // switch to follow-up stage
    setStage('followup');
  };

  return (
    <div className={
      stage === 'initial'
        ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6'
        : 'min-h-screen flex items-start justify-center bg-gradient-to-br from-background to-muted/20 p-6'
    }>
      <Card className={stage === 'initial' ? 'w-full max-w-2xl' : 'w-full max-w-md mr-6'}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Plan Your New Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Origin City */}
            <div>
              <label className="block text-sm font-medium mb-1">Origin City</label>
              <DestinationSearch value={origin} onSelect={setOrigin} className="w-full" />
            </div>

            {/* Destination City */}
            <div>
              <label className="block text-sm font-medium mb-1">Destination City</label>
              <DestinationSearch value={destination} onSelect={setDestinationState} className="w-full" />
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Budget tier */}
            <div>
              <label className="block text-sm font-medium mb-1">Budget Tier</label>
              <Combobox
                options={[
                  { value: 'budget', label: 'Budget', subtitle: '₹10K-50K' },
                  { value: 'moderate', label: 'Moderate', subtitle: '₹50K-2L' },
                  { value: 'luxury', label: 'Premium', subtitle: '₹2L+' },
                ]}
                value={budget}
                onValueChange={(val) => setBudget(val as 'budget' | 'moderate' | 'luxury')}
                className="w-full"
              />
            </div>

            {/* Number of people */}
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Number of People</label>
                <Input type="number" min={1} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} />
              </div>
              {/* Group type */}
              <div>
                <label className="block text-sm font-medium mb-1">Group Type</label>
                <Combobox
                  options={[
                    { value: 'solo', label: 'Solo' },
                    { value: 'couple', label: 'Couple' },
                    { value: 'family', label: 'Family' },
                    { value: 'friends', label: 'Friends' },
                  ]}
                  value={groupType}
                  onValueChange={(val) => setGroupType(val as any)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-sm font-medium mb-1">Travel Style</label>
              <Combobox
                options={[
                  { value: 'adventure', label: 'Adventure' },
                  { value: 'chill', label: 'Chill' },
                  { value: 'luxury', label: 'Luxury' },
                ]}
                value={travelStyle}
                onValueChange={(val) => setTravelStyle(val as any)}
                className="w-full"
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full text-lg py-6" disabled={!destination || !startDate || !endDate}>
              Start Planning
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Follow-up section */}
      {stage === 'followup' && (
        <FollowupQuestions
          className="w-full max-w-xl"
          onFinish={(answers) => {
            updatePreferences(answers);
            router.push('/trip');
          }}
        />
      )}
    </div>
  );
} 