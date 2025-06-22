"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Zap } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useTripStore } from '@/lib/store';

interface GeneratingTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuccess: boolean;
}

export function GeneratingTripModal({ isOpen, onClose, isSuccess }: GeneratingTripModalProps) {
  const { agentStatuses } = useTripStore();
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const { width, height } = useWindowSize();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && !isSuccess) {
      interval = setInterval(() => {
        setActiveAgentIndex((prevIndex) => (prevIndex + 1) % agentStatuses.length);
      }, 2000); // Increased from 1500ms to 2000ms for slower transitions
    }
    return () => clearInterval(interval);
  }, [isOpen, isSuccess, agentStatuses.length]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[750px] bg-background/80 backdrop-blur-sm p- py-16">
        {isSuccess && <Confetti width={width} height={height} recycle={false} />}
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold">
            {isSuccess ? 'Your Trip is Ready!' : 'Crafting Your Adventure...'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-12">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <CheckCircle className="w-24 h-24 text-green-500" />
              <p className="text-xl">We&apos;ve planned the perfect getaway for you.</p>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-12">
              {agentStatuses.map((agent, index) => (
                <div
                  key={agent.type}
                  className={`flex flex-col items-center gap-4 transition-all duration-700 ${
                    index === activeAgentIndex ? 'scale-125' : 'scale-100 opacity-40'
                  }`}
                >
                  <div
                    className={`relative w-28 h-28 flex items-center justify-center rounded-full bg-muted/50 transition-all duration-700
                      border border-gray-200/30 backdrop-blur-sm
                      ${
                        index === activeAgentIndex 
                          ? 'shadow-[0_0_30px_rgba(0,0,0,0.1)] shadow-primary/30' 
                          : ''
                      }`}
                  >
                    <span className="text-5xl">{agent.emoji}</span>
                    {index === activeAgentIndex && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        <Zap className="w-8 h-8 text-yellow-400 animate-[ping_3s_ease-in-out_infinite]" />
                      </div>
                    )}
                  </div>
                  <span className="text-base font-medium text-muted-foreground">{agent.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 