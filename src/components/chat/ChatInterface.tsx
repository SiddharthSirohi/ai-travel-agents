"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    chatMessages, 
    addChatMessage, 
    startPlanning, 
    stopPlanning,
    isPlanning,
    preferences,
    destination,
    dates
  } = useTripStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, streamingMessage]);

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
      // Create a temporary message for streaming
      const tempMessageId = `streaming-${Date.now()}`;
      setCurrentStreamingMessageId(tempMessageId);
      setStreamingMessage('');

      // Add initial assistant message
      addChatMessage({
        role: 'assistant',
        content: 'Let me help you plan your trip. I\'m gathering information from our travel agents...',
      });

      // Prepare the request payload
      const requestPayload = {
        message: userMessage,
        preferences: {
          ...preferences,
          destination: destination?.name || 'Not specified',
          startDate: dates?.startDate || '',
          endDate: dates?.endDate || '',
        },
      };

             // Make streaming request to API
       // Use the test endpoint if no preferences are set, otherwise use the full trip endpoint
       const endpoint = (!destination?.name && !dates?.startDate) ? '/api/chat' : '/api/trip';
       const payload = endpoint === '/api/chat' ? { message: userMessage } : requestPayload;

       const response = await fetch(endpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(payload),
       });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Handle different types of streaming data
                if (parsed.type === 'text_delta' && parsed.text_delta?.content) {
                  accumulatedContent += parsed.text_delta.content;
                  setStreamingMessage(accumulatedContent);
                } else if (parsed.type === 'text' && parsed.text) {
                  accumulatedContent += parsed.text;
                  setStreamingMessage(accumulatedContent);
                } else if (parsed.content) {
                  // Handle direct content
                  accumulatedContent += parsed.content;
                  setStreamingMessage(accumulatedContent);
                }
                             } catch {
                 // Handle non-JSON data (plain text chunks)
                 if (data && data !== 'undefined') {
                   accumulatedContent += data;
                   setStreamingMessage(accumulatedContent);
                 }
               }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Add the final complete message
      if (accumulatedContent.trim()) {
        addChatMessage({
          role: 'assistant',
          content: accumulatedContent.trim(),
        });
      } else {
        addChatMessage({
          role: 'assistant',
          content: 'I\'ve finished processing your request. Check your itinerary for the results!',
        });
      }

    } catch (error) {
      console.error('Streaming error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'I encountered an issue while processing your request. Please try again or check your connection.',
      });
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
      setCurrentStreamingMessageId(null);
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
                  <div className="text-sm whitespace-pre-wrap">
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

        {/* Streaming message */}
        {streamingMessage && currentStreamingMessageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <Card className="p-3 bg-card border-primary/50">
                <div className="text-sm whitespace-pre-wrap">
                  {streamingMessage}
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </div>
                <div className="flex items-center mt-2 text-xs opacity-70">
                  <Badge variant="outline" className="text-primary border-primary/50">
                    Streaming...
                  </Badge>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {isTyping && !streamingMessage && (
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
            placeholder="Ask Columbus AI about flights, hotels, restaurants, or activities..."
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
            {streamingMessage ? 'Columbus AI is responding...' : 'Our smart travel agents are working on your request...'}
          </div>
        )}
      </div>
    </div>
  );
} 