import Link from "next/link";
import { ArrowUpRight, Instagram, Facebook, Twitter } from "lucide-react";

const links = {
  "Khám phá": [
    { href: "/shop", label: "Tất cả sản phẩm" },
    { href: "/shop?category=glasses", label: "Kính mắt" },
    { href: "/shop?category=necklaces", label: "Vòng cổ" },
    { href: "/shop?category=earrings", label: "Khuyên tai" },
  ],
  "Dịch vụ": [
    { href: "/cart", label: "Giỏ hàng" },
    { href: "/orders", label: "Đơn hàng" },
    { href: "/favorites", label: "Danh sách yêu thích" },
    { href: "/about", label: "Về KYRO" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(180deg,#070708,#030304)]">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="kyro-panel p-8">
            <p className="text-xs uppercase tracking-[0.34em] text-primary">KYRO</p>
            <h3 className="mt-3 font-headline text-4xl uppercase tracking-[0.16em] text-white">
              Hiện đại - Cao cấp
            </h3>
            {/* <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Trải nghiệm mua sắm dark theme cho kính mắt và phụ kiện với đường nét
              tối giản, điểm nhấn bạc tinh tế và cảm giác cao cấp trên mọi màn hình.
            </p> */}
            <div className="mt-6 flex gap-3">
              {[Twitter, Facebook, Instagram].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground no-underline hover:border-[#ff9b53]/35 hover:bg-[rgba(255,130,32,0.08)] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title} className="kyro-panel-soft p-8">
              <h4 className="text-xs uppercase tracking-[0.34em] text-accent">{title}</h4>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between text-sm text-muted-foreground no-underline hover:text-white"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} KYRO</p>
          <p>Đen / Bạc / Trắng</p>
        </div> */}
      </div>
    </footer>
  );
}
