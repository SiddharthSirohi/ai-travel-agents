"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { AgentType } from '@/lib/types';
import { callAgent } from '@/lib/mock-api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AgentDock() {
  const { 
    agentStatuses, 
    updateAgentStatus, 
    addItineraryItem, 
    preferences,
    addChatMessage 
  } = useTripStore();
  const [refreshingAgent, setRefreshingAgent] = useState<AgentType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when agents are working
  const hasWorkingAgents = agentStatuses.some(agent => agent.status === 'working');
  const shouldExpand = isExpanded || hasWorkingAgents;

  // Auto-collapse after agents finish working (with delay)
  useEffect(() => {
    if (!hasWorkingAgents && !isExpanded) {
      return;
    }
    
    if (!hasWorkingAgents && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds of no activity
      
      return () => clearTimeout(timer);
    }
  }, [hasWorkingAgents, isExpanded]);

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
        return <Clock className="w-3 h-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Zap className="w-3 h-3 text-gray-400" />;
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

  const activeCount = agentStatuses.filter(a => a.status === 'working').length;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-0">
          {/* Collapsed view - just agent avatars */}
          {!shouldExpand && (
            <motion.div
              initial={{ height: 'auto' }}
              animate={{ height: 'auto' }}
              className="p-3"
            >
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {agentStatuses.map((agent) => (
                    <Tooltip key={agent.type}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110",
                            getStatusColor(agent.status)
                          )}
                          onClick={() => setIsExpanded(true)}
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
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            Status: {agent.status}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="h-8 px-2"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Expanded view - full interface */}
          <AnimatePresence>
            {shouldExpand && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="p-3">
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
                      onClick={() => setIsExpanded(false)}
                      className="h-6 px-2"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <AnimatePresence>
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
                    </AnimatePresence>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
} 