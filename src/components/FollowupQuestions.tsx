"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'single' | 'multi';
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'transport',
    text: 'How would you like to travel between destinations?',
    field: 'transport',
    type: 'single',
    options: [
      { value: 'flight', label: 'Flight' },
      { value: 'train', label: 'Train' },
      { value: 'bus', label: 'Bus' },
      { value: 'car', label: 'Car' },
    ],
  },
  {
    id: 'accommodation',
    text: 'What type of accommodation do you prefer?',
    field: 'accommodation',
    type: 'single',
    options: [
      { value: 'hotel', label: 'Hotel' },
      { value: 'hostel', label: 'Hostel' },
      { value: 'resort', label: 'Resort' },
      { value: 'apartment', label: 'Apartment' },
    ],
  },
  {
    id: 'dietary',
    text: 'Do you have any dietary preferences?',
    field: 'dietary',
    type: 'single',
    options: [
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'non-vegetarian', label: 'Non-Vegetarian' },
      { value: 'both', label: 'Both / Flexible' },
    ],
  },
  {
    id: 'food',
    text: 'What kind of food experiences interest you? (select all that apply)',
    field: 'food',
    type: 'multi',
    options: [
      { value: 'street food', label: 'Street Food' },
      { value: 'fine dining', label: 'Fine Dining' },
      { value: 'casual restaurants', label: 'Casual Restaurants' },
      { value: 'local delicacies', label: 'Local Delicacies' },
    ],
  },
  {
    id: 'activities',
    text: 'What types of activities are you interested in? (select all that apply)',
    field: 'activities',
    type: 'multi',
    options: [
      { value: 'outdoors', label: 'Outdoors' },
      { value: 'museums', label: 'Museums' },
      { value: 'shopping', label: 'Shopping' },
      { value: 'cultural', label: 'Cultural' },
      { value: 'nightlife', label: 'Nightlife' },
    ],
  },
];

interface FollowupProps {
  onFinish: (answers: Record<string, any>) => void;
  className?: string;
}

export function FollowupQuestions({ onFinish, className }: FollowupProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentQuestion = QUESTIONS[step];

  const handleSingleSelect = (value: string) => {
    setAnswers((prev) => {
      const newA = { ...prev, [currentQuestion.field]: value };
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        onFinish(newA);
      }
      return newA;
    });
  };

  const handleMultiToggle = (value: string) => {
    setAnswers((prev) => {
      const arr: string[] = prev[currentQuestion.field] || [];
      const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [currentQuestion.field]: newArr };
    });
  };

  const canContinue = () => {
    const ans = answers[currentQuestion.field];
    return Array.isArray(ans) && ans.length > 0;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onFinish(answers);
    }
  };

  return (
    <Card className={className ?? 'w-full max-w-xl h-[600px] flex flex-col overflow-hidden'}>
      <CardContent className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* History */}
        {QUESTIONS.slice(0, step).map((q) => (
          <div key={q.id} className="space-y-2">
            <div className="bg-muted px-4 py-2 rounded-lg max-w-fit text-sm">{q.text}</div>
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-fit ml-auto text-sm">
              {Array.isArray(answers[q.field]) ? answers[q.field].join(', ') : answers[q.field]}
            </div>
          </div>
        ))}

        {/* Current question */}
        {currentQuestion && (
          <div className="space-y-2">
            <div className="bg-muted px-4 py-2 rounded-lg max-w-fit text-sm">{currentQuestion.text}</div>
            <div>
              {currentQuestion.type === 'single' ? (
                <Combobox
                  options={currentQuestion.options}
                  value={answers[currentQuestion.field] || ''}
                  onValueChange={handleSingleSelect}
                  className="w-full"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((opt) => {
                    const selected = (answers[currentQuestion.field] || []).includes(opt.value);
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        className={cn(selected && 'bg-primary text-primary-foreground')}
                        onClick={() => handleMultiToggle(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {/* bottom nav only for multi */}
      {currentQuestion.type === 'multi' && (
        <div className="border-t p-4 flex justify-end">
          <Button onClick={handleNext} disabled={!canContinue()}>
            {step === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      )}
    </Card>
  );
} 