'use server';

import OpenAI from "openai";
import { productApi } from '@/lib/api';
import { z } from 'zod';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

  // 1. Fetch products
  const response = await productApi.getAllProducts();

  // 🔥 Giảm token (rất quan trọng)
  const catalog = response.products.slice(0, 20);

  try {
    // 2. Call OpenAI
    const completion = await client.chat.completions.create({
      model: "googleai/gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: `
You are an expert eyeglasses stylist.

Rules:
- Only choose products from the provided catalog
- Return EXACTLY 3 products
- Do NOT invent products
- Output MUST be valid JSON
          `,
        },
        {
          role: "user",
          content: `
User needs: ${input.needsDescription}

Catalog:
${JSON.stringify(catalog)}
          `,
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(text);

    return GlassesRecommendationOutputSchema.parse(parsed);

  } catch (err) {
    console.error("OpenAI failed → fallback", err);

    // 🔥 fallback tránh crash
    return {
      recommendation: "Gợi ý tạm thời dựa trên sản phẩm nổi bật.",
      recommendedProducts: catalog.slice(0, 3),
    };
  }
}