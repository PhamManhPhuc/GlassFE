"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroImages = [
  {
    src: "/homepage/hero/anh1.jpg",
    alt: "Kính mắt KYRO phối cảnh 1",
    label: "Kỹ thuật hoàn thiện",
  },
  {
    src: "/homepage/hero/anh2.jpg",
    alt: "Kính mắt KYRO phối cảnh 2",
    label: "Chất liệu sắc nét",
  },
  {
    src: "/homepage/hero/anh5.jpg",
    alt: "Kính mắt KYRO phối cảnh 4",
    label: "Nhận diện thương hiệu",
  },
];

const heroStats = [
  {
    value: "100+",
    label: "Thiết kế",
    className:
      "bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_56%),radial-gradient(circle_at_top_left,rgba(191,195,201,0.2),transparent_36%)]",
  },
  {
    value: "4.9",
    label: "Đánh giá",
    className:
      "bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_56%),radial-gradient(circle_at_top_left,rgba(191,195,201,0.2),transparent_36%)]",
  },
  {
    value: "24h",
    label: "Xử lý",
    className:
      "bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_56%),radial-gradient(circle_at_top_left,rgba(191,195,201,0.2),transparent_36%)]",
  },
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const visiblePreviews = useMemo(
    () =>
      Array.from({ length: 3 }, (_, offset) => {
        const index = (activeIndex + offset) % heroImages.length;
        return { ...heroImages[index], index };
      }),
    [activeIndex],
  );

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 kyro-grid opacity-25" aria-hidden />
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid items-stretch gap-3 lg:grid-cols-[0.88fr_0.9fr]">
          <div className="kyro-panel relative overflow-hidden p-6 sm:p-7 lg:p-8">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,130,32,0.15),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(191,195,201,0.3),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]"
              aria-hidden
            />
            <div className="relative max-w-lg">
              <span className="inline-flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent">
                <span
                  className="h-px w-10 bg-[linear-gradient(90deg,rgba(255,130,32,0.12),rgba(255,130,32,0.95))]"
                  aria-hidden
                />
                KYRO COLLECTION
              </span>
              <h1 className="kyro-text-glow mt-9 font-headline text-[2rem] uppercase leading-[0.95] tracking-[-0.05em] text-white sm:text-[2.6rem] xl:text-[3.25rem]">
                <span className="block">PHỤ KIỆN KYRO</span>
                <span className="mt-4 block">ÁNH PHONG CÁCH</span>
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground sm:text-[0.92rem]">
                Khám phá bộ sưu tập kính mắt, dây chuyền và khuyên tai mang
                phong cách hiện đại. KYRO tạo nên điểm nhấn tinh tế cho diện mạo
                hằng ngày.
              </p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Button
                  asChild
                  className="h-10 justify-center px-4 text-[0.72rem] sm:justify-start"
                >
                  <Link href="/shop">
                    Khám phá bộ sưu tập
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-4 text-[0.72rem]"
                >
                  <Link href="/about">Xem thương hiệu</Link>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 items-stretch gap-3 sm:gap-4">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "hero-shine-card flex min-h-0 flex-col justify-center overflow-hidden rounded-[1rem] border border-white/10 px-3 py-3 sm:px-3.5 sm:py-3.5",
                      stat.className,
                    )}
                  >
                    <p className="text-xl font-semibold leading-none text-white sm:text-2xl">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-[0.62rem] uppercase leading-tight tracking-[0.18em] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="kyro-panel relative min-h-[320px] overflow-hidden p-3.5 sm:min-h-[370px] sm:p-4">
            <div className="grid h-full gap-3 md:grid-cols-[minmax(0,1fr)_84px]">
              <div className="relative min-h-[235px] overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/20 sm:min-h-[285px]">
                {heroImages.map((image, index) => (
                  <div
                    key={image.src}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-700",
                      index === activeIndex ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      priority={index === 0}
                      className="hero-image-drift object-cover"
                    />
                  </div>
                ))}
                <div
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,16,0.08),rgba(15,15,16,0.58)),radial-gradient(circle_at_75%_20%,rgba(255,130,32,0.18),transparent_20%),radial-gradient(circle_at_22%_18%,rgba(191,195,201,0.16),transparent_24%),linear-gradient(120deg,rgba(15,15,16,0.16),transparent_45%)]"
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <div className="hero-shine-card rounded-[1rem] border border-white/10 bg-[linear-gradient(155deg,rgba(0,0,0,0.32),rgba(255,255,255,0.06)_180%)] p-3 backdrop-blur-xl sm:p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-primary">
                      {heroImages[activeIndex].label}
                    </p>
                    {/* <p className="mt-1.5 max-w-sm text-[0.78rem] leading-5 text-white/78 sm:text-sm sm:leading-6">
                      Bộ ảnh tự động chuyển cảnh để người xem nhìn thấy nhiều góc độ
                      và chất liệu mà không cần tự thao tác.
                    </p> */}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:grid-rows-3">
                {visiblePreviews.map((image, order) => (
                  <button
                    key={`${image.src}-${order}`}
                    type="button"
                    onClick={() => setActiveIndex(image.index)}
                    className={cn(
                      "hero-shine-card relative overflow-hidden rounded-[0.95rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_54%)] transition-all duration-300",
                      image.index === activeIndex
                        ? "scale-[1.02] border-[#ff9b53]/40 ring-1 ring-[#ff9b53]/45"
                        : "opacity-70 hover:border-[#ff9b53]/25 hover:opacity-100",
                    )}
                    aria-label={`Chọn ảnh ${image.index + 1}`}
                  >
                    <div className="relative h-20 md:h-full md:min-h-[78px]">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,15,16,0.86))] px-2 py-1.5 text-left">
                      <p className="text-[0.58rem] uppercase tracking-[0.14em] text-white/78">
                        {image.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
