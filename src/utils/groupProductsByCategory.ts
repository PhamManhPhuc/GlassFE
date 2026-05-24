import type { Product } from "@/lib/types";

export type ProductRecommendationGroupId =
  | "earrings"
  | "glasses"
  | "necklace";

export function getProductRecommendationGroup(
  product: Product,
): ProductRecommendationGroupId {
  const category = (product.category || "").toLowerCase();
  if (category.includes("khuyên") || category.includes("earring")) {
    return "earrings";
  }
  if (category.includes("vòng cổ") || category.includes("necklace")) {
    return "necklace";
  }
  return "glasses";
}

const GROUP_DEFS: { id: ProductRecommendationGroupId; label: string }[] = [
  { id: "earrings", label: "Khuyên tai" },
  { id: "glasses", label: "Kính mắt" },
  { id: "necklace", label: "Vòng cổ" },
];

export function groupProductsForAIRecommendation(products: Product[]) {
  const buckets = new Map<ProductRecommendationGroupId, Product[]>(
    GROUP_DEFS.map((g) => [g.id, []]),
  );

  for (const product of products) {
    const key = getProductRecommendationGroup(product);
    buckets.get(key)!.push(product);
  }

  return GROUP_DEFS.map((g) => ({
    ...g,
    products: buckets.get(g.id) ?? [],
  })).filter((g) => g.products.length > 0);
}
