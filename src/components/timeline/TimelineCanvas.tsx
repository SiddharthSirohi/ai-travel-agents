"use client";

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThumbsUp, ThumbsDown, RefreshCw, Clock, MapPin, Star, GripVertical } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { ItineraryItem } from '@/lib/types';
import { motion } from 'framer-motion';
import { getAlternatives } from '@/lib/mock-api';

interface SortableItemProps {
  item: ItineraryItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFindAlternative: (id: string) => void;
}

function SortableItem({ item, onApprove, onReject, onFindAlternative }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'hotel': return 'bg-green-100 border-green-300 text-green-800';
      case 'meal': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'activity': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className={`w-80 h-64 ${getTypeColor(item.type)} border-2 transition-all duration-200 hover:shadow-lg`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTypeIcon(item.type)}</span>
              <div>
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <p className="text-xs opacity-75">{item.description}</p>
              </div>
            </div>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 rounded"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{item.time}</span>
            </div>
            <Badge variant={item.status === 'confirmed' ? 'default' : 'secondary'}>
              {item.status}
            </Badge>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{item.location}</span>
          </div>

          {item.rating && (
            <div className="flex items-center space-x-1 text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{item.rating}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              {item.currency} {item.price}
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>{getTypeIcon(item.type)}</span>
                    <span>{item.title}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Date:</span> {item.date}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {item.time}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {item.location}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> {item.currency} {item.price}
                    </div>
                  </div>

                  {item.details && Object.keys(item.details).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Additional Details:</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(item.details).map(([key, value]) => (
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
                      onClick={() => onApprove(item.id)}
                      className="flex-1"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(item.id)}
                      className="flex-1"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFindAlternative(item.id)}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Alternatives
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TimelineCanvas() {
  const { itinerary, reorderItineraryItems, updateItineraryItem, addItineraryItem } = useTripStore();
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by date
  const groupedItems = itinerary.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  const sortedDates = Object.keys(groupedItems).sort();

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = itinerary.findIndex(item => item.id === active.id);
      const newIndex = itinerary.findIndex(item => item.id === over.id);
      
      const newOrder = arrayMove(itinerary, oldIndex, newIndex);
      reorderItineraryItems(newOrder);
    }
  }

  const handleApprove = (id: string) => {
    updateItineraryItem(id, { status: 'confirmed' });
  };

  const handleReject = (id: string) => {
    updateItineraryItem(id, { status: 'alternative' });
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

  if (itinerary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-6xl opacity-50">🗓️</div>
          <div>
            <h3 className="text-lg font-medium">No itinerary items yet</h3>
            <p className="text-muted-foreground">
              Start chatting to add flights, hotels, restaurants, and activities to your timeline
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">
                  {new Date(date).toLocaleDateString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <Badge variant="outline">
                  {groupedItems[date].length} items
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <SortableContext items={groupedItems[date].map(item => item.id)}>
                  <div className="flex space-x-4 pb-4">
                    {groupedItems[date].map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onFindAlternative={handleFindAlternative}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </motion.div>
          ))}
        </div>
      </DndContext>
    </div>
  );
} 