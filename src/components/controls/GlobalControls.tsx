"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, MapPin, Users, DollarSign, Settings, Sparkles, Mountain, Crown, RefreshCw, CheckCircle, AlertCircle, Clock, Zap, Lock } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { AgentType } from '@/lib/types';
import { callAgent } from '@/lib/mock-api';
// Removed framer-motion imports since we no longer use expansion animations
import { cn } from '@/lib/utils';
import { DestinationSearch } from './DestinationSearch';
import { Combobox } from '@/components/ui/combobox';

export function GlobalControls() {
  const { 
    destination, 
    dates, 
    preferences, 
    totalCost,
    agentStatuses,
    setDestination, 
    setDates, 
    updatePreferences,
    updateAgentStatus,
    addItineraryItem,
    addChatMessage
  } = useTripStore();
  
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [refreshingAgent, setRefreshingAgent] = useState<AgentType | null>(null);
  // Removed agent dock expansion functionality

  const handleRefreshAgent = async (agentType: AgentType) => {
    setRefreshingAgent(agentType);
    updateAgentStatus(agentType, { status: 'working', progress: 0 });

    try {
      // Simulate agent search
      const results = await callAgent(agentType, `Find new ${agentType} options`, preferences);
      
      // Add results to itinerary
      results.forEach(item => addItineraryItem(item));
      
      // Update status
      updateAgentStatus(agentType, { status: 'completed', progress: 100 });
      
      // Add chat message
      addChatMessage({
        role: 'assistant',
        content: `${agentStatuses.find(a => a.type === agentType)?.name} found ${results.length} new options for you!`,
        agentType,
      });

    } catch (error) {
      updateAgentStatus(agentType, { status: 'error' });
      addChatMessage({
        role: 'assistant',
        content: `${agentStatuses.find(a => a.type === agentType)?.name} encountered an error. Please try again.`,
        agentType,
      });
    } finally {
      setRefreshingAgent(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <Clock className="w-2 h-2 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-2 h-2 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-2 h-2 text-red-500" />;
      default:
        return <Zap className="w-2 h-2 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'border-yellow-300 bg-yellow-50';
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'adventure':
        return <Mountain className="w-4 h-4" />;
      case 'luxury':
        return <Crown className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getBudgetDisplay = (budget: string) => {
    switch (budget) {
      case 'budget':
        return { label: 'Budget', range: '₹10K-50K', icon: '💰' };
      case 'moderate':
        return { label: 'Moderate', range: '₹50K-2L', icon: '💳' };
      case 'luxury':
        return { label: 'Premium', range: '₹2L+', icon: '💎' };
      default:
        return { label: 'Moderate', range: '₹50K-2L', icon: '💳' };
    }
  };

  const getStyleDisplay = (style: string) => {
    switch (style) {
      case 'adventure':
        return { label: 'Adventure', icon: <Mountain className="w-4 h-4" />, emoji: '🏔️' };
      case 'chill':
        return { label: 'Chill', icon: <Sparkles className="w-4 h-4" />, emoji: '🏖️' };
      case 'luxury':
        return { label: 'Luxury', icon: <Crown className="w-4 h-4" />, emoji: '👑' };
      default:
        return { label: 'Chill', icon: <Sparkles className="w-4 h-4" />, emoji: '🏖️' };
    }
  };

  // Removed activeCount since we no longer show agent count in dropdown

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex flex-1 items-center space-x-2">
          {/* Destination */}
          <DestinationSearch
            value={destination}
            onSelect={(dest) => dest && setDestination(dest)}
            className="h-8 w-[250px]"
          />

          {/* Dates */}
          <Dialog open={isEditingDates} onOpenChange={setIsEditingDates}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span className="text-sm">
                  {dates ? 
                    `${new Date(dates.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(dates.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` :
                    'Select Dates'
                  }
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Trip Dates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={dates?.startDate || '2024-03-15'}
                    onChange={(e) => setDates({
                      startDate: e.target.value,
                      endDate: dates?.endDate || '2024-03-20'
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={dates?.endDate || '2024-03-20'}
                    onChange={(e) => setDates({
                      startDate: dates?.startDate || '2024-03-15',
                      endDate: e.target.value
                    })}
                  />
                </div>
                <Button 
                  onClick={() => setIsEditingDates(false)}
                  className="w-full"
                >
                  Save Dates
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Travelers */}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updatePreferences({ travelers: Math.max(1, preferences.travelers - 1) })}
                disabled={preferences.travelers <= 1}
              >
                -
              </Button>
              <span className="px-3 text-sm font-medium min-w-[30px] text-center">{preferences.travelers}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updatePreferences({ travelers: preferences.travelers + 1 })}
              >
                +
              </Button>
            </div>
          </div>
          
          <div className="h-6 border-l border-border mx-2"></div>

          {/* Travel Style */}
          <Combobox
            options={[
              { 
                value: 'adventure', 
                label: 'Adventure', 
                subtitle: 'Thrills & excitement',
                icon: <Mountain className="w-4 h-4 text-muted-foreground" />
              },
              { 
                value: 'chill', 
                label: 'Chill', 
                subtitle: 'Relaxed & laid-back',
                icon: <Sparkles className="w-4 h-4 text-muted-foreground" />
              },
              { 
                value: 'luxury', 
                label: 'Luxury', 
                subtitle: 'Premium experiences',
                icon: <Crown className="w-4 h-4 text-muted-foreground" />
              }
            ]}
            value={preferences.style}
            onValueChange={(value) => updatePreferences({ style: value as 'adventure' | 'chill' | 'luxury' })}
            placeholder="Select style..."
            icon={getStyleIcon(preferences.style)}
            className="h-8 w-[160px]"
          />

          {/* Budget Control */}
          <Combobox
            options={[
              { 
                value: 'budget', 
                label: 'Budget', 
                subtitle: '₹10K-50K',
                icon: <span className="text-sm">💰</span>
              },
              { 
                value: 'moderate', 
                label: 'Moderate', 
                subtitle: '₹50K-2L',
                icon: <span className="text-sm">💳</span>
              },
              { 
                value: 'luxury', 
                label: 'Premium', 
                subtitle: '₹2L+',
                icon: <span className="text-sm">💎</span>
              }
            ]}
            value={preferences.budget}
            onValueChange={(value) => updatePreferences({ budget: value as 'budget' | 'moderate' | 'luxury' })}
            placeholder="Select budget..."
            icon={<span className="text-sm">{getBudgetDisplay(preferences.budget).icon}</span>}
            className="h-8 w-[140px]"
          />
        </div>

        {/* Right side - Agent Dock & Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Agent Status Display - No dropdown */}
          <div className="flex items-center space-x-1">
            {agentStatuses.map((agent) => (
              <Tooltip key={agent.type}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      getStatusColor(agent.status)
                    )}
                  >
                    <span className="text-sm">{agent.emoji}</span>
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border">
                      {getStatusIcon(agent.status)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-center">
                    <div className="font-medium text-xs">{agent.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      Status: {agent.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(agent.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="h-6 border-l border-border mx-2"></div>
          
          <div className="flex items-center space-x-2">
              <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                          <Settings className="w-3.5 h-3.5" />
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Settings</DialogTitle>
                      </DialogHeader>
                      <p>Placeholder for global settings.</p>
                  </DialogContent>
              </Dialog>
              <Button size="sm" className="h-8">
                  <Lock className="w-3.5 h-3.5" />
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 