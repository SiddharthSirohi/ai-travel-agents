"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrentQuestion, setShowCurrentQuestion] = useState(true);

  const currentQuestion = QUESTIONS[step];

  const handleSingleSelect = async (value: string) => {
    setAnswers((prev) => {
      const newA = { ...prev, [currentQuestion.field]: value };
      return newA;
    });

    // Show processing state
    setIsProcessing(true);
    setShowCurrentQuestion(false);

    // Artificial delay before next question
    setTimeout(() => {
      setIsProcessing(false);
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
        setShowCurrentQuestion(true);
      } else {
        onFinish({ ...answers, [currentQuestion.field]: value });
      }
    }, 600 + Math.random() * 400); // 0.6-1 seconds
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

  const handleNext = async () => {
    if (!canContinue()) return;
    
    setIsProcessing(true);
    setShowCurrentQuestion(false);

    // Artificial delay before next question
    setTimeout(() => {
      setIsProcessing(false);
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
        setShowCurrentQuestion(true);
      } else {
        onFinish(answers);
      }
    }, 600 + Math.random() * 400); // 0.6-1 seconds
  };

  const getAnswerDisplay = (question: Question) => {
    const answer = answers[question.field];
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  };

  return (
    <Card className={cn('w-full max-w-2xl min-h-[600px] flex flex-col overflow-hidden', className)}>
      <CardContent className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            Question {step + 1} of {QUESTIONS.length}
          </div>
          <div className="flex space-x-1">
            {QUESTIONS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index < step ? 'bg-green-500' : 
                  index === step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        {/* Previous questions */}
        <AnimatePresence>
          {QUESTIONS.slice(0, step).map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-muted/50 px-4 py-3 rounded-lg text-sm">
                    {q.text}
                  </div>
                  <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg mt-2 text-sm ml-auto max-w-fit">
                    {getAnswerDisplay(q)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing state */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center space-x-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Processing your answer...</span>
            </div>
          </motion.div>
        )}

        {/* Current question */}
        <AnimatePresence>
          {currentQuestion && showCurrentQuestion && !isProcessing && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 rounded-lg border border-primary/20">
                <p className="text-lg font-medium">{currentQuestion.text}</p>
              </div>
              
              <div className="pl-4">
                {currentQuestion.type === 'single' ? (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-4 px-6 hover:bg-primary/5 hover:border-primary/30 transition-all"
                        onClick={() => handleSingleSelect(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt) => {
                        const selected = (answers[currentQuestion.field] || []).includes(opt.value);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            className={cn(
                              'h-auto py-4 px-6 transition-all',
                              selected && 'bg-primary text-primary-foreground shadow-lg'
                            )}
                            onClick={() => handleMultiToggle(opt.value)}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      {/* Bottom navigation for multi-select questions */}
      {currentQuestion?.type === 'multi' && showCurrentQuestion && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t p-6"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {(answers[currentQuestion.field] || []).length > 0 
                ? `${(answers[currentQuestion.field] || []).length} selected`
                : 'Select at least one option'
              }
            </div>
            <Button 
              onClick={handleNext} 
              disabled={!canContinue()}
              className="px-8"
            >
              {step === QUESTIONS.length - 1 ? 'Complete Setup' : 'Continue'}
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
} 