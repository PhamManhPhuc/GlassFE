"use client";

import { useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, Star, Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatVND } from "@/lib/utils";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, user } = useContext(AppContext);
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckoutClick = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await router.push("/checkout");
      } else {
        setShowAuthModal(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout navigation failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="container relative z-10 mx-auto px-4 pt-8 pb-4 md:pt-10 md:pb-6">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="mb-6 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20"></div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/40">
                  Quy trình mua sắm
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20"></div>
              </div>
              <h1 className="font-headline text-4xl uppercase tracking-[0.18em] text-white/95 sm:text-5xl md:text-6xl font-light relative z-10">
                <div className="absolute -top-10 -left-10 md:-left-20 w-12 h-12 md:w-20 md:h-20 rounded-[2rem] overflow-hidden animate-float-fade shadow-lg border border-white/10" style={{ animationDelay: "0s" }}>
                  <img src="/homepage/hero/anh2.jpg" alt="Decor" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-0 -right-10 md:-right-16 w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden animate-float-fade shadow-lg border border-white/10" style={{ animationDelay: '-1.8s' }}>
                  <img src="/homepage/hero/anh3.jpg" alt="Decor" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-5 md:-bottom-6 left-2 md:left-6 w-8 h-8 md:w-14 md:h-14 rounded-xl overflow-hidden animate-float-fade shadow-lg border border-white/10" style={{ animationDelay: '-4s' }}>
                  <img src="/homepage/hero/anh1.jpg" alt="Decor" className="w-full h-full object-cover" />
                </div>
                Giỏ hàng
              </h1>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 pt-2 pb-10 md:pt-4 md:pb-14">
          {cart.length === 0 ? (
            <div className="kyro-panel mt-8 flex flex-col items-center justify-center p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-primary" />
              <h2 className="mt-6 text-2xl uppercase tracking-[0.08em] text-white">
                Giỏ hàng đang trống
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Hãy bắt đầu khám phá danh mục và thêm sản phẩm để tiếp tục quy trình thanh toán KYRO mới.
              </p>
              <Button asChild className="mt-6">
                <Link href="/shop">Khám phá cửa hàng</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-0">
                    <ul role="list" className="divide-y divide-white/8">
                      {cart.map((item) => (
                        <li key={item.product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
                          <div className="h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:h-32 sm:w-32">
                            <Image
                              src={(Array.isArray(item.product.picUrl) && item.product.picUrl[0]) || "/placeholder.svg"}
                              alt={item.product.name}
                              width={128}
                              height={128}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <Link href={`/shop/${item.product.id}`} className="text-lg font-semibold text-white no-underline hover:text-primary">
                                  {item.product.name}
                                </Link>
                                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                  {item.product.shape}
                                </p>
                              </div>
                              <p className="text-lg font-semibold text-white">
                                {formatVND(item.product.price)}
                              </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center text-sm text-white">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button variant="ghost" type="button" onClick={() => removeFromCart(item.product.id)}>
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="text-white">
                  <CardHeader>
                    <CardTitle>Tóm tắt đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Tạm tính</span>
                        <span className="text-white">{formatVND(getCartTotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vận chuyển</span>
                        <span className="text-white">Miễn phí</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-semibold text-white">
                        <span>Tổng cộng</span>
                        <span>{formatVND(getCartTotal())}</span>
                      </div>
                    </div>
                    <Button size="lg" className="mt-6 w-full" onClick={handleCheckoutClick} disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Tiến hành thanh toán
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <AlertDialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yêu cầu đăng nhập</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng đăng nhập để tiếp tục thanh toán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push("/login")}>
                Đăng nhập
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
}
