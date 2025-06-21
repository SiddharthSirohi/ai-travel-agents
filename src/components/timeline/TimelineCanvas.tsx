"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThumbsUp, ThumbsDown, RefreshCw, Clock, MapPin, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { ItineraryItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlternatives } from '@/lib/mock-api';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parse, addMinutes } from 'date-fns';

interface TimeBlock {
  item: ItineraryItem;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  column: number;
  totalColumns: number;
}

function TimeBlock({ block, onItemClick }: { block: TimeBlock; onItemClick: (item: ItineraryItem) => void }) {
  const { item } = block;
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
      case 'hotel': return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'meal': return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      case 'activity': return 'bg-purple-500 hover:bg-purple-600 border-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'meal': return '🍽️';
      case 'activity': return '🎯';
      default: return '📌';
    }
  };

  const top = (block.startHour + block.startMinute / 60) * 60;
  const height = Math.max(30, ((block.endHour - block.startHour) + (block.endMinute - block.startMinute) / 60) * 60);
  const width = `calc(${100 / block.totalColumns}% - 4px)`;
  const left = `calc(${(100 / block.totalColumns) * block.column}% + 2px)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute rounded-md p-2 cursor-pointer text-white text-xs ${getTypeColor(item.type)} 
        shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-l-4`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width,
        left,
        minHeight: '30px'
      }}
      onClick={() => onItemClick(item)}
    >
      <div className="flex items-start space-x-1">
        <span className="text-sm">{getTypeIcon(item.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          {height > 40 && (
            <div className="text-xs opacity-90 truncate">{item.time}</div>
          )}
          {height > 60 && (
            <div className="text-xs opacity-80 truncate flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {item.location}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TimelineCanvas() {
  const { itinerary, dates, updateItineraryItem, addItineraryItem } = useTripStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Calculate week range
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Generate days for the week view
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  // Generate hours for the timeline
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Process itinerary items into time blocks
  const processItemsForDay = (date: Date): TimeBlock[] => {
    const dayItems = itinerary.filter(item => 
      isSameDay(new Date(item.date), date)
    );

    // Sort by time
    const sortedItems = dayItems.sort((a, b) => {
      const timeA = parse(a.time, 'HH:mm', new Date());
      const timeB = parse(b.time, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });

    // Calculate overlaps and columns
    const blocks: TimeBlock[] = [];
    const columns: { endTime: Date }[] = [];

    sortedItems.forEach(item => {
      const startTime = parse(item.time, 'HH:mm', new Date());
      const duration = item.duration || 60; // Default 60 minutes if not specified
      const endTime = addMinutes(startTime, duration);

      // Find available column
      let column = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].endTime <= startTime) {
          column = i;
          break;
        } else if (i === columns.length - 1) {
          column = columns.length;
        }
      }

      if (column === columns.length) {
        columns.push({ endTime });
      } else {
        columns[column] = { endTime };
      }

      blocks.push({
        item,
        startHour: startTime.getHours(),
        startMinute: startTime.getMinutes(),
        endHour: endTime.getHours(),
        endMinute: endTime.getMinutes(),
        column,
        totalColumns: 1 // Will be updated after
      });
    });

    // Update total columns for each block
    const maxColumns = Math.max(1, columns.length);
    blocks.forEach(block => {
      block.totalColumns = maxColumns;
    });

    return blocks;
  };

  const handleApprove = (id: string) => {
    updateItineraryItem(id, { status: 'confirmed' });
    setSelectedItem(null);
  };

  const handleReject = (id: string) => {
    updateItineraryItem(id, { status: 'alternative' });
    setSelectedItem(null);
  };

  const handleFindAlternative = async (id: string) => {
    const item = itinerary.find(i => i.id === id);
    if (!item) return;

    setIsLoadingAlternatives(id);
    try {
      const alternatives = await getAlternatives(id, item.type as any);
      alternatives.forEach(alt => addItineraryItem(alt));
    } catch (error) {
      console.error('Failed to load alternatives:', error);
    } finally {
      setIsLoadingAlternatives(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(current => addDays(current, direction === 'next' ? 7 : -7));
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(current => addDays(current, direction === 'next' ? 1 : -1));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'meal': return '🍽️';
      case 'activity': return '🎯';
      default: return '📌';
    }
  };

  if (itinerary.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background p-4">
        <div className="flex items-center justify-center h-full rounded-lg border">
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-50">📅</div>
            <div>
              <h3 className="text-lg font-medium">No itinerary items yet</h3>
              <p className="text-muted-foreground">
                Start chatting to add flights, hotels, restaurants, and activities to your timeline
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="h-full flex flex-col bg-background rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {viewMode === 'week' 
                ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                : format(selectedDate, 'EEEE, MMMM d, yyyy')
              }
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 border-r">
            <div className="h-12 border-b" /> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-[60px] border-b text-xs text-muted-foreground px-2 py-1">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
            ))}
          </div>

          {/* Calendar content */}
          <div className="flex-1 flex">
            {viewMode === 'week' ? (
              // Week view
              weekDays.map((day, index) => {
                const isToday = isSameDay(day, new Date());
                const blocks = processItemsForDay(day);
                
                return (
                  <div key={index} className="flex-1 border-r last:border-r-0">
                    {/* Day header */}
                    <div className={`h-12 border-b px-2 py-1 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    
                    {/* Day column */}
                    <div className="relative">
                      {hours.map(hour => (
                        <div key={hour} className="h-[60px] border-b border-dashed" />
                      ))}
                      
                      {/* Time blocks */}
                      <AnimatePresence>
                        {blocks.map((block, blockIndex) => (
                          <TimeBlock
                            key={`${block.item.id}-${blockIndex}`}
                            block={block}
                            onItemClick={setSelectedItem}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })
            ) : (
              // Day view - single day with more space
              <div className="flex-1">
                {/* Header spacer to match week-view column header */}
                <div className="h-12 border-b" />

                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-dashed" />
                  ))}
                  
                  {/* Time blocks for single day */}
                  <AnimatePresence>
                    {processItemsForDay(selectedDate).map((block, blockIndex) => (
                      <TimeBlock
                        key={`${block.item.id}-${blockIndex}`}
                        block={block}
                        onItemClick={setSelectedItem}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <span>{getTypeIcon(selectedItem.type)}</span>
                  <span>{selectedItem.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {selectedItem.date}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedItem.time}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {selectedItem.location}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> {selectedItem.currency} {selectedItem.price}
                  </div>
                </div>

                {selectedItem.details && Object.keys(selectedItem.details).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Details:</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedItem.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(selectedItem.id)}
                    className="flex-1"
                    disabled={isLoadingAlternatives === selectedItem.id}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(selectedItem.id)}
                    className="flex-1"
                    disabled={isLoadingAlternatives === selectedItem.id}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFindAlternative(selectedItem.id)}
                    className="flex-1"
                    disabled={isLoadingAlternatives === selectedItem.id}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingAlternatives === selectedItem.id ? 'animate-spin' : ''}`} />
                    Alternatives
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
} 