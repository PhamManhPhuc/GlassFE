"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

const reviews = [
  {
    name: "Linh A.",
    role: "Dan cong so",
    body: "Be mat dark moi khien trai nghiem duyet san pham cao cap hon han. San pham noi bat nhanh hon va luong xem co chu dich hon.",
    img: "https://picsum.photos/100/100?random=11",
  },
  {
    name: "Mai N.",
    role: "Nha sang tao",
    body: "Sang trong nhung khong on ao. The san pham, khoang trang va hinh anh deu chin chu hon tren dien thoai.",
    img: "https://picsum.photos/100/100?random=12",
  },
  {
    name: "Khanh T.",
    role: "Nha thiet ke",
    body: "Bang mau den va bac tao ban sac manh hon, dong thoi lam cho danh muc mang cam giac thuong hieu ro net hon.",
    img: "https://picsum.photos/100/100?random=13",
  },
  {
    name: "Vy P.",
    role: "Sinh vien",
    body: "Minh quet san pham nhanh hon rat nhieu. Bo cuc sach hon va cao cap hon truoc.",
    img: "https://picsum.photos/100/100?random=14",
  },
  {
    name: "Hoang D.",
    role: "Nhiep anh gia",
    body: "Cach xu ly anh san pham va chi tiet hover phan sang dac biet hop voi mat hang kinh mat.",
    img: "https://picsum.photos/100/100?random=15",
  },
  {
    name: "Trang K.",
    role: "Sang tao noi dung",
    body: "Responsive gio muot va can bang hon nhieu. Khong con cam giac qua to hay chat choi tren man hinh nho.",
    img: "https://picsum.photos/100/100?random=16",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

function ReviewCard({
  img,
  name,
  role,
  body,
}: {
  img: string;
  name: string;
  role: string;
  body: string;
}) {
  return (
    <figure className="relative flex h-[172px] w-[20rem] flex-col overflow-hidden rounded-[1.1rem] border border-white/20 bg-white/[0.12] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_40%)] p-3.5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="absolute inset-x-3.5 top-0 h-px bg-white/24" aria-hidden />
      <div className="absolute inset-x-3.5 bottom-0 h-px bg-white/8" aria-hidden />
      <div className="absolute right-2.5 top-2 text-[1.35rem] leading-none text-white/10" aria-hidden>
        "
      </div>
      <div className="flex items-center gap-2.5">
        <Image
          src={img}
          alt={name}
          width={38}
          height={38}
          className="rounded-full border border-white/12"
        />
        <div>
          <figcaption className="text-[0.84rem] font-semibold text-white">{name}</figcaption>
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">{role}</p>
        </div>
      </div>
      <div className="mt-1.5 flex gap-1 text-[#e5e7eb]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-3 w-3 fill-current" />
        ))}
      </div>
      <blockquote className="mt-1.5 flex-1 overflow-hidden text-[0.78rem] leading-[1.1rem] text-white/72">
        {body}
      </blockquote>
    </figure>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-3 text-[1.4rem] font-semibold uppercase tracking-[0.22em] text-accent">
            <span
              className="h-px w-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0.95))]"
              aria-hidden
            />
            Trải nghiệm từ khách hàng
          </span>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Những phản hồi từ khách hàng đã trải nghiệm sản phẩm và phong cách của KYRO.
          </p>
        </div>

        <div className="relative mt-8 overflow-hidden">
          <Marquee pauseOnHover className="[--duration:24s]">
            {firstRow.map((review) => (
              <div key={review.name} className="mx-3 py-2 odd:-rotate-1 even:rotate-1">
                <ReviewCard {...review} />
              </div>
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="mt-6 [--duration:26s]">
            {secondRow.map((review) => (
              <div key={review.name} className="mx-3 py-2 odd:rotate-1 even:-rotate-1">
                <ReviewCard {...review} />
              </div>
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
