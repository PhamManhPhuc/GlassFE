"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { productApi, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await productApi.getFeaturedProducts();
        if (Array.isArray(products)) {
          setFeaturedProducts(products.slice(0, 5));
        } else {
          setError("Du lieu tra ve tu may chu khong hop le.");
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Khong the tai san pham noi bat.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-3 text-[1.4rem] font-semibold uppercase tracking-[0.22em] text-accent">
              <span
                className="h-px w-14 bg-[linear-gradient(90deg,rgba(255,130,32,0.12),rgba(255,130,32,0.95))]"
                aria-hidden
              />
              Tuyển chọn nổi bật
            </span>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Khám phá các thiết kế kính mắt và trang sức được yêu thích nhất
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground no-underline transition-colors hover:text-accent"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error ? (
          <Alert className="mt-10 rounded-[1.5rem] border-[#ff9b53]/15 bg-[rgba(255,130,32,0.06)]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="kyro-panel-soft flex items-center gap-3 px-5 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Dang tai san pham noi bat...</span>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
