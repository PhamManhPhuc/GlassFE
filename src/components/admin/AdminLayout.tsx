"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  Store,
  X,
} from "lucide-react";
import "./admin-theme.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Bảng điều khiển", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Sản phẩm", href: "/admin/products", icon: Package },
  { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, isAdmin, isUserLoaded } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isUserLoaded && !isAdmin() && !isLoggingOut) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [isUserLoaded, isAdmin, router, isLoggingOut]);

  if (!isUserLoaded || isRedirecting || (isUserLoaded && !isAdmin())) {
    return (
      <div className="admin-theme admin-loading min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-gray-600">
            {!isUserLoaded ? "Đang tải..." : "Đang chuyển hướng..."}
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    router.push("/login");
  };

  return (
    <div className="admin-theme admin-shell min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="admin-surface flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-primary">Trang quản trị</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`admin-nav-link flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "admin-nav-link-active bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 space-y-3 border-t border-white/10 p-4">
          <Link
            href="/"
            className="admin-store-link flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex items-center gap-3">
              <Store className="h-4 w-4" />
              Xem cửa hàng
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.18em]">
              Live
            </span>
          </Link>

          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="admin-logout text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <main className="p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
