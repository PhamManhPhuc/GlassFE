"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppContext } from "@/context/AppContext";
import type { Product } from "@/lib/types";
import { productApi } from "@/lib/api";
import { Heart, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, formatVND } from "@/lib/utils";
import "./ProductCard.css";

const optimizeImageUrl = (url: string): string => {
  if (!url || !url.includes("cloudinary.com")) return url;
  const parts = url.split("/upload/");
  if (parts.length === 2) {
    return `${parts[0]}/upload/f_auto,q_auto,w_800/${parts[1]}`;
  }
  return url;
};

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({
  product,
  className,
}: ProductCardProps) {
  const { addToCart, toggleFavorite, favorites } = useContext(AppContext);
  const { toast } = useToast();
  const isFavorite = favorites.includes(product.id);

  const [firstVariantId, setFirstVariantId] = useState<number | null>(null);

  const imageUrls = Array.isArray(product.picUrl) ? product.picUrl : [];
  const primaryImageUrl = optimizeImageUrl(imageUrls[0] ?? "/placeholder.svg");

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const variants = await productApi.getProductVariants(product.id);
        if (isCancelled) return;

        if (Array.isArray(variants) && variants.length > 0) {
          setFirstVariantId(Number(variants[0]?.id ?? null));
        }
      } catch (error) {
        console.error("Error fetching product variants:", error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [product.id]);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    addToCart(product, {
      productVariationId: firstVariantId ?? undefined,
      quantity: 1,
    });

    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} hiện đã có trong giỏ hàng của bạn.`,
    });
  };

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    toggleFavorite(product.id);

    toast({
      title: isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
      description: `${product.name} đã được ${
        isFavorite ? "xóa khỏi" : "thêm vào"
      } danh sách yêu thích của bạn.`,
    });
  };

  return (
    <article className={cn("product-card-ref group", className)}>
      <div className="card__shine" />
      <div className="card__glow" />

      <div className="card__content">
        <Link
          href={`/shop/${product.id}`}
          className="card__main-link"
          aria-label={`Xem chi tiết ${product.name}`}
        >
          <div className="card__image">
            <Image
              src={primaryImageUrl}
              alt={product.name}
              fill
              className="object-cover p-0 scale-[1.15] transition-transform duration-500 ease-out group-hover:scale-[1.25]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 190px"
            />
          </div>

          <div className="card__text">
            <p className="card__title">{product.name}</p>

            <div className="card__meta">
              <div className="card__rating">
                {Array.from({ length: 5 }, (_, index) => {
                  const fillPercent = Math.max(
                    0,
                    Math.min(1, product.rating - index),
                  );

                  return (
                    <span
                      key={index}
                      className="card__rating-star"
                      style={{
                        background: `linear-gradient(90deg, gold ${
                          fillPercent * 100
                        }%, #ddd ${fillPercent * 100}%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              <p className="card__description">
                {product.shape} | {product.brand}
              </p>
            </div>
          </div>
        </Link>

        <div className="card__footer">
          <div className="card__price-block">
            <div className="card__price">
              {formatVND(Number(product.price ?? 0))}
            </div>
          </div>

          <div className="card__actions">
            <button
              type="button"
              className={cn(
                "card__button card__button--favorite",
                isFavorite &&
                  "border-[#ff9b53]/35 bg-[rgba(255,130,32,0.14)] hover:bg-[rgba(255,130,32,0.2)]",
              )}
              onClick={handleToggleFavorite}
              aria-label="Bật hoặc tắt yêu thích"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite ? "fill-[#ff8a20] text-[#ff8a20]" : "text-white",
                )}
              />
            </button>

            <button
              type="button"
              className="card__button card__button--cart add-to-cart-button"
              onClick={handleAddToCart}
              aria-label="Thêm vào giỏ hàng"
            >
              <ShoppingCart className="h-4 w-4 text-[#0F0F10]" />
              <span className="card__button-label">Mua</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
