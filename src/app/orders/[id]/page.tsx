"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { productApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppContext } from "@/context/AppContext";
import { formatVND } from "@/lib/utils";
import { getOrderStatusLabel } from "@/utils/orderStatus";

interface OrderItemView {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  productId?: number;
  variantId?: number;
  colorName?: string;
  colorHex?: string;
  currentPrice?: number;
}

const orderSectionTitleClass =
  "border-b border-white/10 pb-3 font-body text-xl font-semibold tracking-normal text-white sm:text-2xl";

function formatOrderTotal(total?: string) {
  if (!total) return "—";
  const numeric = Number(String(total).replace(/[^0-9.-]/g, ""));
  if (!Number.isNaN(numeric) && String(total).trim() !== "") {
    return numeric.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  }
  return total;
}

export default function OrderDetailPage() {
  const { user } = useContext(AppContext);
  const { id } = useParams();
  const orderId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    status: string;
    total_amount?: string;
    order_date?: string;
  } | null>(null);
  const [items, setItems] = useState<OrderItemView[]>([]);

  useEffect(() => {
    if (!orderId) return;

    const userId = user?.id;
    if (!userId) {
      setError("Người dùng chưa đăng nhập");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await productApi.getOrderDetail(userId, orderId);
        const status = String(data?.status ?? "");
        const total_amount = data?.total_amount;
        const order_date = data?.order_date;
        setSummary({ status, total_amount, order_date });

        const orderItems = Array.isArray(data?.OrderItems)
          ? data.OrderItems
          : Array.isArray(data?.orderItems)
            ? data.orderItems
            : [];

        const mappedBase: OrderItemView[] = orderItems.map((oi: any) => {
          const pv = oi?.ProductVariation ?? {};
          const p = pv?.Product ?? {};
          const images = Array.isArray(pv?.ProductImages) ? pv.ProductImages : [];
          const firstUrl = images.length ? String(images[0]?.pic_url) : undefined;

          return {
            id: Number(oi?.id ?? 0),
            name: String(p?.name ?? "Sản phẩm"),
            quantity: Number(oi?.quantity ?? 1),
            price: Number(oi?.price_at_purchase ?? 0),
            image: firstUrl,
            productId: Number(p?.id ?? 0),
            variantId: Number(oi?.product_variation_id ?? pv?.id ?? 0),
          };
        });

        const enriched: OrderItemView[] = await Promise.all(
          mappedBase.map(async (it) => {
            try {
              if (!it.productId || !it.variantId) return it;

              const variants = await productApi.getProductVariants(it.productId);
              const v = variants.find((vv) => Number(vv.id) === Number(it.variantId));
              if (!v) return it;

              const image = (Array.isArray(v.images) && v.images[0]) || it.image;
              const product = await productApi.getProductById(it.productId);
              const currentPrice = product?.price ?? it.price;

              return {
                ...it,
                image,
                colorName: v.colorName,
                colorHex: v.colorHex,
                currentPrice: Number(currentPrice),
              };
            } catch {
              return it;
            }
          }),
        );

        setItems(enriched);
      } catch {
        setError("Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, user]);

  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link
            href="/orders"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-[#ffb56d]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đơn hàng
          </Link>

          <h1 className="mb-8 font-body text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Đơn hàng #{orderId}
          </h1>

          {loading ? (
            <div className="mt-8 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Đang tải đơn hàng...
            </div>
          ) : error ? (
            <p className="mt-8 text-red-400">{error}</p>
          ) : (
            <>
              <Card className="mb-6 font-body text-white">
                <CardContent className="space-y-4 p-6">
                  <p className={orderSectionTitleClass}>Tóm tắt</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/20 bg-white/[0.1] p-4">
                      <span className="text-sm text-muted-foreground">
                        Trạng thái
                      </span>
                      <span className="mt-2 block text-base font-semibold text-white">
                        {getOrderStatusLabel(summary?.status ?? "")}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-[#ff9b53]/25 bg-[rgba(255,130,32,0.1)] p-4">
                      <span className="text-sm text-muted-foreground">
                        Tổng tiền
                      </span>
                      <span className="kyro-amount mt-2 block font-body text-3xl tabular-nums sm:text-4xl">
                        {formatOrderTotal(summary?.total_amount)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/[0.1] p-4">
                      <span className="text-sm text-muted-foreground">
                        Ngày đặt
                      </span>
                      <span className="mt-2 block text-base font-semibold text-white">
                        {summary?.order_date
                          ? new Date(summary.order_date).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="font-body text-white">
                <CardContent className="p-6">
                  <p className={`${orderSectionTitleClass} mb-4`}>Sản phẩm</p>
                  <ul className="divide-y divide-white/10">
                    {items.map((it) => (
                      <li
                        key={it.id}
                        className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"
                      >
                        <div className="product-image-thumb-frame flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl p-0 sm:h-32 sm:w-32">
                          <Image
                            src={it.image || "/placeholder.svg"}
                            alt={it.name}
                            width={128}
                            height={128}
                            className="h-full w-full max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-body text-base font-semibold text-white">
                            {it.name}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>Số lượng: {it.quantity}</span>
                            {it.colorName && (
                              <span className="inline-flex items-center gap-1">
                                <span>Màu: {it.colorName}</span>
                                {it.colorHex && (
                                  <span
                                    className="inline-block h-3 w-3 rounded-full border border-white/20"
                                    style={{ backgroundColor: it.colorHex }}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="font-body text-base font-semibold tabular-nums text-white">
                            {formatVND(it.price)}
                          </div>
                          {typeof it.currentPrice === "number" &&
                            it.currentPrice !== it.price && (
                              <div className="mt-1 text-sm text-muted-foreground">
                                Giá hiện tại: {formatVND(it.currentPrice)}
                              </div>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
