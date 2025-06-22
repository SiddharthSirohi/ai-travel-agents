"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThumbsUp, ThumbsDown, RefreshCw, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { ItineraryItem, AgentType } from '@/lib/types';
import { motion } from 'framer-motion';
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

const getTypeColor = (type: string) => {
  switch (type) {
    case 'flight': return 'bg-blue-200 hover:bg-blue-300 border-blue-400 text-blue-800';
    case 'hotel': return 'bg-green-200 hover:bg-green-300 border-green-400 text-green-800';
    case 'meal': return 'bg-yellow-200 hover:bg-yellow-300 border-yellow-400 text-yellow-800';
    case 'activity': return 'bg-purple-200 hover:bg-purple-300 border-purple-400 text-purple-800';
    default: return 'bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-800';
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

function TimeBlock({ block, onItemClick }: { block: TimeBlock; onItemClick: (item: ItineraryItem) => void }) {
  const { item } = block;

  const top = (block.startHour + block.startMinute / 60) * 60;
  const height = Math.max(30, ((block.endHour - block.startHour) + (block.endMinute - block.startMinute) / 60) * 60);
  const width = `calc(${100 / block.totalColumns}% - 4px)`;
  const left = `calc(${(100 / block.totalColumns) * block.column}% + 2px)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute rounded-md p-2 cursor-pointer text-xs ${getTypeColor(item.type)} 
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
  const { itinerary, updateItineraryItem, addItineraryItem } = useTripStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const weekDays = useMemo(() => {
    const days = [];
    let start = selectedDate;
    if(viewMode === 'week') {
      start = weekStart;
    }
    const dayCount = viewMode === 'week' ? 7 : 1;
    for (let i = 0; i < dayCount; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [selectedDate, viewMode, weekStart]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const processItemsForDay = (date: Date): { allDayBlocks: ItineraryItem[], timedBlocks: TimeBlock[] } => {
    const dayItems = itinerary.filter(item => 
      isSameDay(new Date(item.date), date)
    );
    
    const allDayItems = dayItems.filter(item => item.type === 'hotel');
    const timedItems = dayItems.filter(item => item.type !== 'hotel');

    const sortedItems = timedItems.sort((a, b) => {
      const timeA = parse(a.time, 'HH:mm', new Date());
      const timeB = parse(b.time, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });

    const timedBlocks: TimeBlock[] = [];
    const columns: { endTime: Date }[] = [];

    sortedItems.forEach(item => {
      const startTime = parse(item.time, 'HH:mm', new Date());
      const duration = item.duration || 60;
      const endTime = addMinutes(startTime, duration);

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

      timedBlocks.push({
        item,
        startHour: startTime.getHours(),
        startMinute: startTime.getMinutes(),
        endHour: endTime.getHours(),
        endMinute: endTime.getMinutes(),
        column,
        totalColumns: 1
      });
    });

    const maxColumns = Math.max(1, columns.length);
    timedBlocks.forEach(block => {
      block.totalColumns = maxColumns;
    });

    return { allDayBlocks: allDayItems, timedBlocks };
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
      const alternatives = await getAlternatives(id, item.type as AgentType);
      alternatives.forEach(alt => addItineraryItem(alt));
    } catch (error) {
      console.error('Failed to load alternatives:', error);
    } finally {
      setIsLoadingAlternatives(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const daysToMove = viewMode === 'week' ? 7 : 1;
    setSelectedDate(current => addDays(current, direction === 'next' ? daysToMove : -daysToMove));
  };

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="h-full flex flex-col bg-background rounded-lg border overflow-hidden">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[200px] text-center">
                {viewMode === 'week' 
                  ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                  : format(selectedDate, 'EEEE, MMMM d, yyyy')
                }
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant={viewMode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('day')}>
              Day
            </Button>
            <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')}>
              Week
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="relative">
              {/* Sticky header with days */}
              <div className={`sticky top-0 left-0 z-20 flex bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
                <div className="w-16 flex-shrink-0 sticky left-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
                  <div className="h-[calc(3rem+1px)]"></div>
                </div>
                <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center border-l">
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content area */}
              <div className="flex">
                {/* Hour column - sticky */}
                <div className="w-16 flex-shrink-0 sticky left-0 z-10 bg-background border-r">
                  <div className="h-12 border-b"></div> {/* Spacer to match all-day events height */}
                  <div className="text-xs text-center text-muted-foreground">
                    {hours.map(hour => (
                      <div key={hour} className="h-[60px] flex items-center justify-center border-t">
                        {hour > 0 ? format(new Date(0, 0, 0, hour), 'ha') : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar grid */}
                <div className="flex-1 relative">
                  {/* Horizontal grid lines spanning full width */}
                  <div className="absolute inset-0 top-12 pointer-events-none">
                    {hours.map(hour => (
                      <div key={hour} className="h-[60px] border-t"></div>
                    ))}
                  </div>

                  {/* Day columns */}
                  <div className={`relative grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} min-h-full`}>
                    {weekDays.map(day => {
                      const { allDayBlocks, timedBlocks } = processItemsForDay(day);
                      return (
                        <div key={day.toISOString()} className="relative border-l min-h-full">
                          <div className="h-12 border-b p-1 space-y-1 overflow-y-auto">
                            {allDayBlocks.map(item => (
                              <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-1 rounded text-xs truncate cursor-pointer ${getTypeColor(item.type)}`}
                              >
                                {item.title}
                              </div>
                            ))}
                          </div>
                          <div className="absolute inset-0 top-12">
                            {timedBlocks.map(block => (
                              <TimeBlock key={block.item.id} block={block} onItemClick={setSelectedItem} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <span>{getTypeIcon(selectedItem.type)}</span>
                  <span>{selectedItem.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Date:</span> {selectedItem.date}</div>
                  <div><span className="font-medium">Time:</span> {selectedItem.time}</div>
                  <div><span className="font-medium">Location:</span> {selectedItem.location}</div>
                  <div><span className="font-medium">Price:</span> {selectedItem.currency} {selectedItem.price}</div>
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
                  <Button variant="outline" size="sm" onClick={() => handleApprove(selectedItem.id)} disabled={isLoadingAlternatives === selectedItem.id}><ThumbsUp className="w-4 h-4 mr-1" />Approve</Button>
                  <Button variant="outline" size="sm" onClick={() => handleReject(selectedItem.id)} disabled={isLoadingAlternatives === selectedItem.id}><ThumbsDown className="w-4 h-4 mr-1" />Reject</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFindAlternative(selectedItem.id)} disabled={isLoadingAlternatives === selectedItem.id}><RefreshCw className={`w-4 h-4 mr-1 ${isLoadingAlternatives === selectedItem.id ? 'animate-spin' : ''}`} />Alternatives</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 