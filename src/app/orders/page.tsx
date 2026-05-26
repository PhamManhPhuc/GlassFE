"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { productApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { AppContext } from "@/context/AppContext";
import { getOrderStatusLabel } from "@/utils/orderStatus";

interface OrderSummary {
  id: number;
  status: string;
  total_amount?: string;
  order_date?: string;
}

function formatOrderTotal(total?: string) {
  if (!total) return "—";
  const numeric = Number(String(total).replace(/[^0-9.-]/g, ""));
  if (!Number.isNaN(numeric) && String(total).trim() !== "") {
    return numeric.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  }
  return total;
}

function formatOrderDate(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const { user } = useContext(AppContext);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const userId = user?.id;
      if (!userId) {
        setError("Người dùng chưa đăng nhập");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await productApi.getOrders(userId);
        const mapped: OrderSummary[] = (Array.isArray(data) ? data : []).map(
          (o: any) => ({
            id: Number(o?.id ?? 0),
            status: String(o?.status ?? ""),
            total_amount: o?.total_amount,
            order_date: o?.order_date,
          }),
        );
        setOrders(mapped);
      } catch {
        setError("Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="container relative z-10 mx-auto px-4 pt-10 pb-4 md:pt-12 md:pb-6">
            <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/40">
                  Lịch sử giao dịch
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
              </div>
              <h1 className="relative z-10 font-headline text-4xl font-light uppercase tracking-[0.18em] text-white/95 sm:text-5xl md:text-6xl">
                <div
                  className="absolute -left-8 -top-10 h-10 w-10 overflow-hidden rounded-2xl border border-white/10 shadow-lg animate-float-fade md:-left-16 md:h-16 md:w-16"
                  style={{ animationDelay: "0s" }}
                >
                  <img
                    src="/homepage/hero/anh3.jpg"
                    alt="Decor"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div
                  className="absolute -right-8 top-2 h-12 w-12 overflow-hidden rounded-full border border-white/10 shadow-lg animate-float-fade md:-right-16 md:h-20 md:w-20"
                  style={{ animationDelay: "-2s" }}
                >
                  <img
                    src="/homepage/hero/anh1.jpg"
                    alt="Decor"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div
                  className="absolute -bottom-4 left-6 h-8 w-8 overflow-hidden rounded-xl border border-white/10 shadow-lg animate-float-fade md:left-8 md:h-12 md:w-12"
                  style={{ animationDelay: "-4s" }}
                >
                  <img
                    src="/homepage/hero/anh2.jpg"
                    alt="Decor"
                    className="h-full w-full object-cover"
                  />
                </div>
                Đơn hàng
              </h1>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 pt-2 pb-8 md:pb-12">
          {loading ? (
            <div className="mt-8 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Đang tải đơn hàng...
            </div>
          ) : error === "Người dùng chưa đăng nhập" ? (
            <Card className="mt-8 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  Vui lòng đăng nhập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bạn cần đăng nhập để xem đơn hàng của mình.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              </CardContent>
            </Card>
          ) : error ? (
            <p className="mt-8 text-red-400">{error}</p>
          ) : orders.length === 0 ? (
            <Card className="mt-8 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  Chưa có đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Hãy đặt hàng để xem tại đây.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/shop">Mua ngay</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4">
              {orders.map((o) => (
                <Card key={o.id} className="text-white">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-lg font-semibold text-white">
                          Đơn hàng #{o.id}
                        </span>
                        {o.status ? (
                          <span className="rounded-full border border-[#ff9b53]/30 bg-[rgba(255,130,32,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#ffb56d]">
                            {getOrderStatusLabel(o.status)}
                          </span>
                        ) : null}
                      </div>
                      {formatOrderDate(o.order_date) ? (
                        <p className="text-sm text-muted-foreground">
                          Đặt ngày {formatOrderDate(o.order_date)}
                        </p>
                      ) : null}
                      <p className="text-base font-semibold text-white">
                        Tổng thanh toán:{" "}
                        <span className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
                          {formatOrderTotal(o.total_amount)}
                        </span>
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 self-start rounded-full border border-white bg-gray-600/55 px-3 text-xs font-semibold normal-case tracking-normal text-white shadow-none hover:border-white hover:bg-gray-600/70 hover:text-white hover:shadow-none sm:self-center [&_svg]:text-white"
                    >
                      <Link href={`/orders/${o.id}`} className="text-white">
                        Chi tiết
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
