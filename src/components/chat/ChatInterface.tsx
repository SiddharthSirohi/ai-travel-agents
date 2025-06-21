"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { callAgent } from '@/lib/mock-api';
import { AgentType } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    chatMessages, 
    addChatMessage, 
    updateAgentStatus, 
    startPlanning, 
    stopPlanning,
    isPlanning,
    addItineraryItem,
    preferences
  } = useTripStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    setIsTyping(true);
    startPlanning();

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add assistant response
      addChatMessage({
        role: 'assistant',
        content: `I understand you're looking for "${userMessage}". Let me check with my agents to find the best options for you.`,
      });

      // Trigger agent calls based on message content
      const agentTypes: AgentType[] = [];
      
      if (userMessage.toLowerCase().includes('flight') || userMessage.toLowerCase().includes('fly')) {
        agentTypes.push('flights');
      }
      if (userMessage.toLowerCase().includes('hotel') || userMessage.toLowerCase().includes('stay')) {
        agentTypes.push('hotels');
      }
      if (userMessage.toLowerCase().includes('restaurant') || userMessage.toLowerCase().includes('eat')) {
        agentTypes.push('dining');
      }
      if (userMessage.toLowerCase().includes('activity') || userMessage.toLowerCase().includes('do')) {
        agentTypes.push('activities');
      }

      // If no specific agents mentioned, use all
      if (agentTypes.length === 0) {
        agentTypes.push('flights', 'hotels', 'dining', 'activities');
      }

      // Call agents in parallel
      const agentPromises = agentTypes.map(async (agentType) => {
        updateAgentStatus(agentType, { status: 'working', progress: 0 });
        
        try {
          const results = await callAgent(agentType, userMessage, preferences);
          results.forEach(item => addItineraryItem(item));
          updateAgentStatus(agentType, { status: 'completed', progress: 100 });
          
          return { agentType, results };
        } catch (error) {
          updateAgentStatus(agentType, { status: 'error' });
          throw error;
        }
      });

      const results = await Promise.allSettled(agentPromises);
      
      // Add summary message
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      if (successfulResults.length > 0) {
        addChatMessage({
          role: 'assistant',
          content: `Great! I found ${successfulResults.length} categories of options for you. Check out the timeline to see your itinerary taking shape!`,
        });
      }

    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'I encountered an issue while searching. Please try again.',
      });
    } finally {
      setIsTyping(false);
      stopPlanning();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {chatMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble */}
                <Card className={`p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card'
                }`}>
                  <div className="text-sm">
                    {message.content}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{formatTime(message.timestamp)}</span>
                    {message.agentType && (
                      <Badge variant="outline" className="ml-2">
                        {message.agentType}
                      </Badge>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <Card className="p-3 bg-card">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about flights, hotels, restaurants, or activities..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isPlanning}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isPlanning}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isPlanning && (
          <div className="text-xs text-muted-foreground mt-2">
            AI agents are working on your request...
          </div>
        )}
      </div>
    </div>
  );
} 