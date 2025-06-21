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
import { BrandLogo } from '@/components/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

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
  const [stage, setStage] = useState<'initial' | 'processing' | 'followup'>('initial');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;

    // Persist to store
    setDestination(destination);
    setDates({ startDate, endDate });
    updatePreferences({ budget, travelers, style: travelStyle, groupType });

    // Show processing state
    setStage('processing');

    // Artificial delay before showing follow-up questions
    setTimeout(() => {
      setStage('followup');
    }, 2000 + Math.random() * 1500); // 2-3.5 seconds
  };

  const handleFollowupFinish = (answers: Record<string, any>) => {
    updatePreferences(answers);
    router.push('/trip');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/5 w-96 h-96 bg-secondary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <BrandLogo size={48} />
        <div className="text-sm text-muted-foreground">
          Step {stage === 'initial' ? '1' : '2'} of 2
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">
            {stage === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <Card className="w-full max-w-2xl shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Plan Your Next Trip with Columbus AI
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      Tell us about your dream destination and we'll create the perfect itinerary
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Origin & Destination */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">From</label>
                          <DestinationSearch 
                            value={origin} 
                            onSelect={setOrigin} 
                            className="w-full" 
                            placeholder="Your departure city"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">To</label>
                          <DestinationSearch 
                            value={destination} 
                            onSelect={setDestinationState} 
                            className="w-full" 
                            placeholder="Where do you want to go?"
                          />
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Departure</label>
                          <Input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Return</label>
                          <Input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Budget & Travelers */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Budget Range</label>
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Travelers</label>
                          <Input 
                            type="number" 
                            min={1} 
                            value={travelers} 
                            onChange={(e) => setTravelers(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Group Type & Travel Style */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Group Type</label>
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Travel Style</label>
                          <Combobox
                            options={[
                              { value: 'adventure', label: 'Adventure' },
                              { value: 'chill', label: 'Relaxed' },
                              { value: 'luxury', label: 'Luxury' },
                            ]}
                            value={travelStyle}
                            onValueChange={(val) => setTravelStyle(val as any)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        className="w-full text-lg py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                        disabled={!destination || !startDate || !endDate}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Planning
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {stage === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <Card className="w-full max-w-md text-center p-8 shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
                  <CardContent className="space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Analyzing Your Preferences</h3>
                      <p className="text-muted-foreground">
                        Columbus AI is preparing personalized questions to create your perfect itinerary...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {stage === 'followup' && (
              <motion.div
                key="followup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <div className="w-full max-w-4xl">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                      Let's Personalize Your Experience
                    </h2>
                    <p className="text-muted-foreground">
                      A few quick questions to make your trip truly yours
                    </p>
                  </div>
                  <FollowupQuestions
                    className="mx-auto shadow-2xl border-0 bg-card/80 backdrop-blur-sm"
                    onFinish={handleFollowupFinish}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 