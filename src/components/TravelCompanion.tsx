"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Calendar, Map, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatInterface } from './chat/ChatInterface';
import { TimelineCanvas } from './timeline/TimelineCanvas';
import { MapCanvas } from './map/MapCanvas';
import { GlobalControls } from './controls/GlobalControls';
import { AnimatedGradientText } from './magicui/animated-gradient-text';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TravelCompanion() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
        {/* Header with global controls */}
        <div className="flex-shrink-0">
          <GlobalControls />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Dynamic Canvas (Timeline/Map) */}
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isChatOpen ? "mr-0" : "mr-0"
          )}>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <div className="border-b px-6 py-3 bg-card/50">
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-fit grid-cols-2">
                    <TabsTrigger value="timeline" className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Timeline</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center space-x-2">
                      <Map className="w-4 h-4" />
                      <span>Map</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Chat toggle button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isChatOpen ? 'Hide Chat' : 'Show Chat'}</span>
                    {isChatOpen ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="timeline" className="h-full m-0">
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <TimelineCanvas />
                  </motion.div>
                </TabsContent>

                <TabsContent value="map" className="h-full m-0">
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <MapCanvas />
                  </motion.div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right panel - Collapsible Chat Sidebar */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 384, opacity: 1 }} // w-96 = 384px
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-shrink-0 border-l bg-card/50 overflow-hidden"
              >
                <div className="w-96 h-full flex flex-col">
                  <div className="border-b px-4 py-3 bg-card/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <h2 className="font-semibold">Chat with AI</h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsChatOpen(false)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask about flights, hotels, restaurants, or activities
                    </p>
                  </div>
                  <ChatInterface />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat toggle when closed - floating button */}
          {!isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-40"
            >
              <Button
                onClick={() => setIsChatOpen(true)}
                size="sm"
                className="h-12 px-3 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <div className="flex flex-col items-center space-y-1">
                  <MessageSquare className="w-4 h-4" />
                  <ChevronLeft className="w-3 h-3" />
                </div>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Responsive mobile layout */}
        <div className="md:hidden">
          <Card className="fixed bottom-4 left-4 right-4 p-4 bg-card/95 backdrop-blur-sm border shadow-lg">
            <div className="text-center text-sm text-muted-foreground">
              💡 For the best experience, view on desktop or tablet
            </div>
          </Card>
        </div>

        {/* Loading overlay for better UX */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="fixed inset-0 bg-background flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-4xl mx-auto"
            >
              ✈️
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Loading Travel Companion</h2>
              <p className="text-muted-foreground">Initializing AI agents...</p>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
} 