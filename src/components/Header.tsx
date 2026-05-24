"use client";

import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SELECT_DROPDOWN_CONTENT_CLASSNAME, SELECT_DROPDOWN_ITEM_CLASSNAME } from "@/components/ui/select";
import { Check, ChevronDown, Heart, LayoutDashboard, LogIn, LogOut, Menu, Package, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const shopCategoryLinks = [
  { href: "/shop?category=earrings", label: "Khuyên tai" },
  { href: "/shop?category=glasses", label: "Kính mắt" },
  { href: "/shop?category=necklaces", label: "Vòng cổ" },
] as const;

const navLinksWithoutShop = [
  { href: "/", label: "Trang chủ" },
  { href: "/about", label: "Thương hiệu" },
  { href: "/favorites", label: "Đã lưu" },
];

function isShopPath(pathname: string) {
  return pathname === "/shop" || pathname.startsWith("/shop/");
}

function ProductsNavDesktop({
  navLinkClass,
}: {
  navLinkClass: (href: string, options?: { mobile?: boolean; active?: boolean }) => string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  const shopActive = isShopPath(pathname);
  const activeCategorySlug = (searchParams.get("category") || "").trim().toLowerCase();

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/shop"
        className={cn(
          navLinkClass("/shop", { active: shopActive }),
          open && !shopActive && "text-white/[0.94] after:opacity-55",
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>Sản phẩm</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 opacity-70 transition-transform duration-200 ease-out",
            open && "rotate-180",
            shopActive && "opacity-100",
          )}
          aria-hidden
        />
      </Link>
      {open ? (
        <div
          className="absolute left-0 top-full z-50 pt-1"
          role="menu"
          aria-label="Danh mục sản phẩm"
        >
          <div
            className={cn(
              SELECT_DROPDOWN_CONTENT_CLASSNAME,
              "translate-y-1 origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            )}
          >
            <div className="p-1">
              {shopCategoryLinks.map((item) => {
                const slug = item.href.split("category=")[1] ?? "";
                const rowActive = shopActive && activeCategorySlug === slug;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      SELECT_DROPDOWN_ITEM_CLASSNAME,
                      "text-foreground no-underline hover:bg-white/[0.08] hover:text-white",
                    )}
                    role="menuitem"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {rowActive ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : null}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeaderInner() {
  const { cart, user, logout, isAdmin } = useContext(AppContext);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdminUser = isAdmin();
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const navLinkClass = (href: string, { mobile = false, active }: { mobile?: boolean; active?: boolean } = {}) => {
    const isActive = active ?? pathname === href;
    return cn(
      "relative inline-flex items-center gap-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] outline-none transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10]",
      !mobile &&
        cn(
          "rounded-sm px-2 py-1.5 -my-0.5",
          "after:pointer-events-none after:absolute after:inset-x-1.5 after:bottom-0 after:h-px after:content-[''] after:bg-[linear-gradient(90deg,transparent,rgba(255,130,32,0.9),transparent)] after:opacity-0 after:transition-[opacity,transform] after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive
            ? "text-white after:opacity-100"
            : "text-muted-foreground/88 hover:text-white/[0.93] hover:after:opacity-70 active:text-white/80",
        ),
      mobile &&
        cn(
          "w-full justify-center rounded-xl border border-white/[0.06] bg-transparent px-4 py-3 text-xs tracking-[0.2em]",
          isActive
            ? "border-[#ff9b53]/30 bg-[rgba(255,130,32,0.08)] text-white"
            : "text-muted-foreground/88 hover:border-[#ff9b53]/20 hover:bg-[rgba(255,130,32,0.04)] hover:text-white/[0.92] active:bg-[rgba(255,130,32,0.08)]",
        ),
    );
  };

  const IconLink = ({
    href,
    label,
    children,
  }: {
    href: string;
    label: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-transparent text-muted-foreground/90 no-underline transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#ff9b53]/28 hover:bg-[rgba(255,130,32,0.08)] hover:text-white/[0.92] active:bg-[rgba(255,130,32,0.12)]"
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(180deg,rgba(10,10,11,0.92),rgba(10,10,11,0.78))] backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-2.5">
            <span className="kyro-chrome inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9b53]/18 text-xs font-semibold tracking-[0.18em] text-white shadow-[0_0_24px_rgba(255,130,32,0.14)]">
              K
            </span>
            <div>
              <p className="font-headline text-xl uppercase tracking-[0.18em] text-white">
                KYRO
              </p>
              {/* <p className="text-[0.58rem] uppercase tracking-[0.26em] text-muted-foreground">
                Sang trọng hiện đại
              </p> */}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex md:gap-6">
          <Link href={navLinksWithoutShop[0].href} className={navLinkClass(navLinksWithoutShop[0].href)}>
            {navLinksWithoutShop[0].label}
          </Link>
          <ProductsNavDesktop navLinkClass={navLinkClass} />
          {navLinksWithoutShop.slice(1).map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 md:flex">
            {isAdminUser ? (
              <Button
                asChild
                size="sm"
                className="h-9 rounded-full border border-[#ffb87a]/30 bg-[linear-gradient(135deg,rgba(255,138,32,0.18),rgba(255,138,32,0.08))] px-3 text-[0.65rem] uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(255,138,32,0.14)] hover:border-[#ffb87a]/45 hover:bg-[linear-gradient(135deg,rgba(255,138,32,0.24),rgba(255,138,32,0.12))]"
              >
                <Link href="/admin/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Quản lý
                </Link>
              </Button>
            ) : null}
            <IconLink href="/orders" label="Đơn hàng">
              <Package className="h-3.5 w-3.5" />
            </IconLink>
            <IconLink href="/cart" label="Giỏ hàng">
              <ShoppingCart className="h-3.5 w-3.5" />
              {cartCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full border border-[#ffd2ad]/50 bg-[#FF8A20] px-1 text-[0.58rem] text-[#0F0F10]">
                  {cartCount}
                </Badge>
              ) : null}
            </IconLink>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[0.68rem] uppercase tracking-[0.18em] text-white outline-none hover:bg-white/[0.08] focus:bg-white/[0.08] transition-colors">
                    <User className="h-3.5 w-3.5" />
                    {user.name}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn(SELECT_DROPDOWN_CONTENT_CLASSNAME, "min-w-[160px] p-1 mt-1")}>
                  <DropdownMenuItem className={cn(SELECT_DROPDOWN_ITEM_CLASSNAME, "pl-3 text-red-400 focus:text-red-300 focus:bg-red-500/10")} onClick={logout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs">
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5" />
                  Đăng nhập
                </Link>
              </Button>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4.5 w-4.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] border-l border-white/10 bg-[linear-gradient(180deg,#111113,#0b0b0d)] text-foreground">
              <div className="mt-6 space-y-3">
                <div className="mb-6">
                  <p className="font-headline text-2xl uppercase tracking-[0.18em] text-white">
                    KYRO
                  </p>
                  <p className="mt-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Chính xác. Hiện diện. Hoàn thiện.
                  </p>
                </div>
                {navLinksWithoutShop.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(item.href, { mobile: true })}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="rounded-2xl border border-white/10 bg-[#080809] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,130,32,0.04)]">
                  <Link
                    href="/shop"
                    className="inline-flex w-full items-center justify-center gap-1.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/88 no-underline transition-colors duration-300 hover:text-white/[0.92]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sản phẩm
                    <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                  </Link>
                  <div className="mt-3 space-y-2">
                    {shopCategoryLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg border border-white/[0.06] bg-[#0c0c0e] px-3 py-2.5 text-center text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 no-underline transition-[color,background-color,border-color] duration-300 hover:border-[#ff9b53]/20 hover:bg-[rgba(255,130,32,0.05)] hover:text-zinc-200 active:bg-[rgba(255,130,32,0.08)]"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5 pt-3">
                  <IconLink href="/favorites" label="Yêu thích">
                    <Heart className="h-3.5 w-3.5" />
                  </IconLink>
                  <IconLink href="/orders" label="Đơn hàng">
                    <Package className="h-3.5 w-3.5" />
                  </IconLink>
                  <IconLink href="/cart" label="Giỏ hàng">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {cartCount > 0 ? (
                      <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full border border-[#ffd2ad]/50 bg-[#FF8A20] px-1 text-[0.58rem] text-[#0F0F10]">
                        {cartCount}
                      </Badge>
                    ) : null}
                  </IconLink>
                </div>
                {isAdminUser ? (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-3 h-10 w-full border-[#ffb87a]/30 bg-[rgba(255,138,32,0.08)] text-xs uppercase tracking-[0.18em] text-white hover:border-[#ffb87a]/45 hover:bg-[rgba(255,138,32,0.14)]"
                  >
                    <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Quản lý
                    </Link>
                  </Button>
                ) : null}
                {user ? (
                  <Button variant="outline" className="mt-3 h-10 w-full text-xs" onClick={logout}>
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất
                  </Button>
                ) : (
                  <Button asChild className="mt-3 h-10 w-full text-xs">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <LogIn className="h-3.5 w-3.5" />
                      Đăng nhập
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 border-b border-white/10 bg-[#0F0F10]/82" />}>
      <HeaderInner />
    </Suspense>
  );
}
