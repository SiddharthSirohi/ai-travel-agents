"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, MapPin, Users, DollarSign, Settings, Sparkles, Mountain, Crown, RefreshCw, CheckCircle, AlertCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { AgentType } from '@/lib/types';
import { callAgent } from '@/lib/mock-api';
import { motion, AnimatePresence } from 'framer-motion';
import { mockDestinations } from '@/lib/mock-api';
import { cn } from '@/lib/utils';

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
  
  const [isEditingDestination, setIsEditingDestination] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [refreshingAgent, setRefreshingAgent] = useState<AgentType | null>(null);
  const [isAgentDockExpanded, setIsAgentDockExpanded] = useState(false);

  // Auto-expand when agents are working
  const hasWorkingAgents = agentStatuses.some(agent => agent.status === 'working');
  const shouldExpandAgentDock = isAgentDockExpanded || hasWorkingAgents;

  // Auto-collapse after agents finish working (with delay)
  useEffect(() => {
    if (!hasWorkingAgents && !isAgentDockExpanded) {
      return;
    }
    
    if (!hasWorkingAgents && isAgentDockExpanded) {
      const timer = setTimeout(() => {
        setIsAgentDockExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds of no activity
      
      return () => clearTimeout(timer);
    }
  }, [hasWorkingAgents, isAgentDockExpanded]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  const budgetPercentage = (totalCost / preferences.budget) * 100;
  const activeCount = agentStatuses.filter(a => a.status === 'working').length;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Trip Overview */}
        <div className="flex items-center space-x-3">
          {/* Destination */}
          <Dialog open={isEditingDestination} onOpenChange={setIsEditingDestination}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex items-center space-x-2">
                <MapPin className="w-3 h-3" />
                <span className="text-sm">{destination?.name || 'Select Destination'}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Destination</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {mockDestinations.map((dest) => (
                  <Button
                    key={dest.id}
                    variant={destination?.id === dest.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => {
                      setDestination(dest);
                      setIsEditingDestination(false);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">{dest.name}</div>
                      <div className="text-xs text-muted-foreground">{dest.country}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Dates */}
          <Dialog open={isEditingDates} onOpenChange={setIsEditingDates}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span className="text-sm">
                  {dates ? 
                    `${new Date(dates.startDate).toLocaleDateString()} - ${new Date(dates.endDate).toLocaleDateString()}` :
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
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updatePreferences({ travelers: Math.max(1, preferences.travelers - 1) })}
                disabled={preferences.travelers <= 1}
              >
                -
              </Button>
              <span className="px-2 text-sm font-medium min-w-[20px] text-center">{preferences.travelers}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updatePreferences({ travelers: preferences.travelers + 1 })}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Preferences & Budget */}
        <div className="flex items-center space-x-3">
          {/* Travel Style */}
          <div className="flex items-center space-x-1">
            {(['adventure', 'chill', 'luxury'] as const).map((style) => (
              <Button
                key={style}
                variant={preferences.style === style ? "default" : "outline"}
                size="sm"
                className="h-8 px-3"
                onClick={() => updatePreferences({ style })}
              >
                <div className="flex items-center space-x-1">
                  {getStyleIcon(style)}
                  <span className="text-xs capitalize">{style}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Budget Control */}
          <div className="flex items-center space-x-3 min-w-[180px]">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Budget</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(preferences.budget)}
                </span>
              </div>
              <Slider
                value={[preferences.budget]}
                onValueChange={([value]) => updatePreferences({ budget: value })}
                max={preferences.maxBudget}
                min={1000}
                step={500}
                className="w-full"
              />
            </div>
          </div>

          {/* Cost Overview */}
          <div className="flex items-center space-x-2 min-w-[120px]">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total Cost</div>
              <div className="text-sm font-bold">{formatCurrency(totalCost)}</div>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="w-16 bg-muted rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    budgetPercentage > 100 ? 'bg-red-500' :
                    budgetPercentage > 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {budgetPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Agent Dock & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Integrated Agent Dock */}
          <div className="relative">
            {/* Collapsed view - just agent avatars */}
            {!shouldExpandAgentDock && (
              <div className="flex items-center space-x-1">
                {agentStatuses.map((agent) => (
                  <Tooltip key={agent.type}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110",
                          getStatusColor(agent.status)
                        )}
                        onClick={() => setIsAgentDockExpanded(true)}
                      >
                        <span className="text-xs">{agent.emoji}</span>
                        {/* Status indicator */}
                        <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 border">
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
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAgentDockExpanded(true)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Expanded view - dropdown */}
            <AnimatePresence>
              {shouldExpandAgentDock && (
                <div className="absolute top-full right-0 mt-1 z-50">
                  <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
                      <CardContent className="p-3 w-64">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-xs font-medium text-muted-foreground">AI AGENTS</div>
                            <Badge variant="outline" className="text-xs">
                              {activeCount} active
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAgentDockExpanded(false)}
                            className="h-6 px-2"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {agentStatuses.map((agent) => (
                            <motion.div
                              key={agent.type}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "w-12 h-12 p-0 relative transition-all duration-200",
                                      getStatusColor(agent.status),
                                      refreshingAgent === agent.type && "cursor-not-allowed opacity-50"
                                    )}
                                    onClick={() => handleRefreshAgent(agent.type)}
                                    disabled={refreshingAgent === agent.type || agent.status === 'working'}
                                  >
                                    {/* Agent emoji */}
                                    <span className="text-lg">{agent.emoji}</span>
                                    
                                    {/* Status indicator */}
                                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border">
                                      {getStatusIcon(agent.status)}
                                    </div>
                                    
                                    {/* Progress bar for working status */}
                                    {agent.status === 'working' && agent.progress !== undefined && (
                                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b">
                                        <motion.div
                                          className="h-full bg-blue-500 rounded-b"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${agent.progress}%` }}
                                          transition={{ duration: 0.3 }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Refresh animation */}
                                    {refreshingAgent === agent.type && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                                      </div>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <div className="text-center">
                                    <div className="font-medium">{agent.name}</div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                      Status: {agent.status}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Updated: {new Date(agent.lastUpdate).toLocaleTimeString()}
                                    </div>
                                    {agent.status === 'idle' && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        Click to refresh
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Overall status */}
                        <div className="mt-3 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Last sync: {new Date(Math.max(...agentStatuses.map(a => new Date(a.lastUpdate).getTime()))).toLocaleTimeString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                agentStatuses.forEach(agent => {
                                  if (agent.status !== 'working') {
                                    handleRefreshAgent(agent.type);
                                  }
                                });
                              }}
                              disabled={agentStatuses.some(a => a.status === 'working')}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Refresh All
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Settings className="w-3 h-3 mr-1" />
                  <span className="text-xs">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Trip Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Maximum Budget</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm">$</span>
                      <Input
                        type="number"
                        value={preferences.maxBudget}
                        onChange={(e) => updatePreferences({ maxBudget: parseInt(e.target.value) || 10000 })}
                        min={preferences.budget}
                        step={500}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Travel Style</label>
                    <div className="flex space-x-2 mt-1">
                      {(['adventure', 'chill', 'luxury'] as const).map((style) => (
                        <Button
                          key={style}
                          variant={preferences.style === style ? "default" : "outline"}
                          size="sm"
                          onClick={() => updatePreferences({ style })}
                          className="flex items-center space-x-1"
                        >
                          {getStyleIcon(style)}
                          <span className="capitalize">{style}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="default" 
              size="sm"
              className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              <span className="text-xs">Lock Trip</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 