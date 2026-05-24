"use client";

import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { groupProductsForAIRecommendation } from "@/utils/groupProductsByCategory";

interface AIRecommendationGroupsProps {
  products: Product[];
}

export default function AIRecommendationGroups({
  products,
}: AIRecommendationGroupsProps) {
  const groups = groupProductsForAIRecommendation(products);

  return (
    <div className="ai-recommendations-groups w-full space-y-5">
      {groups.map((group) => (
        <section key={group.id} className="ai-recommendations-group w-full">
          <h4 className="mb-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#ffd4af]/85">
            {group.label}
          </h4>
          <div
            className="ai-recommendations-row"
            role="list"
            aria-label={group.label}
          >
            {group.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="ai-recommendations-row__card"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
