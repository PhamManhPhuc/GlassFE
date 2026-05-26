// @ts-nocheck
'use server';

import { glassesRecommendation } from '@/ai/flows/glasses-recommendation';
import { Product } from '@/lib/types';
import { z } from 'zod';

const InputSchema = z.object({
  needsDescription: z.string().min(3, { message: 'Please describe your needs in a bit more detail.' }),
});

export type AIFormState = {
  message: string | null;
  recommendation: string | null;
  recommendedProducts: Product[] | null;
  timestamp?: number;
};

export async function getGlassesRecommendation(prevState: AIFormState, formData: FormData): Promise<AIFormState> {
  const parsed = InputSchema.safeParse({
    needsDescription: formData.get('needs'),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.errors[0].message,
      recommendation: null,
      recommendedProducts: null,
    };
  }

  try {
    const result = await glassesRecommendation({ needsDescription: parsed.data.needsDescription });
    return {
      message: 'Here is our AI-powered recommendation:',
      recommendation: result.recommendation,
      recommendedProducts: result.recommendedProducts,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Sorry, we couldn\'t generate a recommendation at this time. Please try again later.',
      recommendation: null,
      recommendedProducts: null,
    };
  }
}
