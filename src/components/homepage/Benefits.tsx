import { Gem, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Tinh chọn phụ kiện",
    description:
      "Mỗi thiết kế được chọn lọc kỹ lưỡng để dễ phối, dễ dùng và phù hợp với phong cách hằng ngày.",
    shellClass:
      "bg-[linear-gradient(180deg,rgba(191,195,201,0.25),rgba(255,255,255,0.12)_36%,rgba(255,255,255,0.08))]",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(191,195,201,0.3),rgba(255,255,255,0.08))] text-[#F5F5F3]",
    label: "Tuyển chọn",
  },
  {
    icon: Gem,
    title: "CHI TIẾT CHỈN CHU",
    description:
      "Từ bề mặt, màu sắc đến hoàn thiện cuối cùng — mọi chi tiết đều hướng đến cảm giác cao cấp và hiện đại.",
    shellClass:
      "bg-[linear-gradient(180deg,rgba(191,195,201,0.25),rgba(255,255,255,0.12)_36%,rgba(255,255,255,0.08))]",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(191,195,201,0.3),rgba(255,255,255,0.08))] text-[#F5F5F3]",
    label: "Chất liệu",
  },
  {
    icon: Sparkles,
    title: "Thiết kế ứng dụng",
    description:
      "Các thiết kế mang tinh thần tối giản, dễ kết hợp với nhiều phong cách và phù hợp cho mọi ngày.",
    shellClass:
      "bg-[linear-gradient(180deg,rgba(191,195,201,0.25),rgba(255,255,255,0.12)_36%,rgba(255,255,255,0.08))]",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(191,195,201,0.3),rgba(255,255,255,0.08))] text-[#F5F5F3]",
    label: "Phong cách",
  },
  {
    icon: Truck,
    title: "MƯỢT MÀ MỌI THIẾT BỊ",
    description:
      "Giao diện trực quan giúp bạn dễ dàng khám phá, lựa chọn và mua sắm trên mọi kích thước màn hình.",
    shellClass:
      "bg-[linear-gradient(180deg,rgba(191,195,201,0.25),rgba(255,255,255,0.12)_36%,rgba(255,255,255,0.08))]",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(191,195,201,0.3),rgba(255,255,255,0.08))] text-[#F5F5F3]",
    label: "TRẢI NGHIỆM",
  },
];

export default function Benefits() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-3 text-[1.4rem] font-semibold uppercase tracking-[0.22em] text-accent">
            <span
              className="h-px w-10 bg-[linear-gradient(90deg,rgba(255,130,32,0.12),rgba(255,130,32,0.95))]"
              aria-hidden
            />
            TINH THẦN CỦA KYRO
          </span>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Những phụ kiện được tạo nên để cân bằng giữa thẩm mỹ và chất lượng
          </p>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className={cn(
                "group relative overflow-hidden rounded-[1.2rem] border border-white/10 p-4 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:border-[#ffab6e]/22",
                benefit.shellClass,
              )}
            >
              <div className="absolute inset-x-4 top-0 h-px bg-white/20" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-[radial-gradient(ellipse_at_center,rgba(255,130,32,0.14),transparent_60%)]" aria-hidden />
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-white/12 shadow-[0_20px_40px_-28px_rgba(255,255,255,0.22)]",
                  benefit.iconClass,
                )}
              >
                <benefit.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-[0.54rem] font-semibold uppercase tracking-[0.2em] text-primary">
                {benefit.label}
              </p>
              <h3 className="mt-2 text-[1.08rem] uppercase tracking-[0.05em] text-white">
                {benefit.title}
              </h3>
              <p className="mt-2 text-[0.84rem] leading-5 text-muted-foreground">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
