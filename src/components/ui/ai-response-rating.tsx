'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface AIResponseRatingProps {
  responseId: string;
  modelUsed?: string;
  taskType?: string;
  onRatingSubmitted?: (rating: 'positive' | 'negative') => void;
  className?: string;
}

export function AIResponseRating({
  responseId,
  modelUsed,
  taskType = 'email_generation',
  onRatingSubmitted,
  className = ''
}: AIResponseRatingProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRating = async (newRating: 'positive' | 'negative') => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setRating(newRating);

    try {
      const response = await fetch('/api/ai/model-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseId,
          rating: newRating === 'positive' ? 5 : 2, // 5 for positive, 2 for negative
          modelId: modelUsed,
          taskType,
          complexity: 'standard'
        }),
      });

      if (response.ok) {
        toast({
          title: newRating === 'positive' ? 'Thanks!' : 'Feedback Received',
          description: newRating === 'positive' 
            ? 'Your positive feedback helps improve AI responses.' 
            : 'Thanks for the feedback. We\'ll work to improve.',
        });
        
        onRatingSubmitted?.(newRating);
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
      setRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Rate this response:</span>
      
      <Button
        variant={rating === 'positive' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleRating('positive')}
        disabled={isSubmitting || rating !== null}
        className="flex items-center space-x-1"
      >
        {isSubmitting && rating === 'positive' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        <span>Good</span>
      </Button>

      <Button
        variant={rating === 'negative' ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => handleRating('negative')}
        disabled={isSubmitting || rating !== null}
        className="flex items-center space-x-1"
      >
        {isSubmitting && rating === 'negative' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
        <span>Poor</span>
      </Button>

      {rating && !isSubmitting && (
        <span className="text-sm text-green-600">✓ Feedback submitted</span>
      )}
    </div>
  );
}





