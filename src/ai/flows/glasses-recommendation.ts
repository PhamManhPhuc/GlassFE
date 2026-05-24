'use server';

import { ai } from '@/ai/genkit';
import { productApi } from '@/lib/api';
import { z } from 'zod';

// ===== Schema =====
const GlassesRecommendationInputSchema = z.object({
  needsDescription: z.string(),
});

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  picUrl: z.array(z.string()),
  description: z.string(),
  dimensions: z.object({
    width: z.number(),
    length: z.number(),
    lensWidth: z.number(),
    lensHeight: z.number(),
    bridge: z.number(),
  }),
  shape: z.string(),
  brand: z.string(),
  material: z.string(),
  rating: z.number(),
  isFeatured: z.boolean(),
  color: z.string(),
});

const GlassesRecommendationOutputSchema = z.object({
  recommendation: z.string(),
  recommendedProducts: z.array(ProductSchema),
});

export type GlassesRecommendationInput = z.infer<typeof GlassesRecommendationInputSchema>;
export type GlassesRecommendationOutput = z.infer<typeof GlassesRecommendationOutputSchema>;

// ===== MAIN FUNCTION =====
export async function glassesRecommendation(
  input: GlassesRecommendationInput
): Promise<GlassesRecommendationOutput> {

  const response = await productApi.getAllProducts();
  const catalog = response.products.slice(0, 20);

  try {
    const { text } = await ai.generate({
      prompt: `
You are an expert eyeglasses stylist.

Rules:
- Only choose products from the provided catalog
- Return EXACTLY 3 products
- Do NOT invent products
- Output MUST be valid JSON matching this shape: { "recommendation": string, "recommendedProducts": Product[] }

User needs: ${input.needsDescription}

Catalog:
${JSON.stringify(catalog)}
      `,
      output: { format: 'json' },
    });

    const parsed = JSON.parse(text ?? '{}');
    return GlassesRecommendationOutputSchema.parse(parsed);

  } catch (err) {
    console.error("Gemini failed → fallback", err);
    return {
      recommendation: "Gợi ý tạm thời dựa trên sản phẩm nổi bật.",
      recommendedProducts: catalog.slice(0, 3),
    };
  }
}
