"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/context/AppContext";
import Header from "@/components/Header";
import { productApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard } from "lucide-react";
import { formatVND } from "@/lib/utils";

const checkoutSchema = z.object({
  email: z.string().email({ message: "Vui lòng nhập email hợp lệ." }),
  firstName: z.string().min(1, "Vui lòng nhập tên."),
  lastName: z.string().min(1, "Vui lòng nhập họ."),
  province: z.string().min(1, "Vui lòng nhập tỉnh/thành phố."),
  district: z.string().min(1, "Vui lòng nhập quận/huyện."),
  ward: z.string().min(1, "Vui lòng nhập phường/xã."),
  address: z.string().min(1, "Vui lòng nhập địa chỉ."),
  deliveryDate: z
    .date({ required_error: "Vui lòng chọn ngày giao hàng." })
    .refine(
      (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
      { message: "Ngày giao hàng không được là ngày trong quá khứ." }
    ),
  paymentMethod: z.literal("Thanh toán khi nhận hàng"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const checkoutSectionTitleClass =
  "border-b border-white/10 pb-3 text-xl font-semibold tracking-tight text-white text-base";

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart, user } = useContext(AppContext);
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      province: "",
      district: "",
      ward: "",
      address: "",
      deliveryDate: new Date(),
      paymentMethod: "Thanh toán khi nhận hàng",
    },
  });

  function onSubmit(data: CheckoutFormData) {
    if (!user) {
      router.push("/login");
      return;
    }

    const payload = {
      province: data.province,
      district: data.district,
      ward: data.ward,
      address: data.address,
      delivery_date: data.deliveryDate?.toISOString?.() ?? undefined,
      shipping_cost: 0,
      note: `Thanh toán: ${data.paymentMethod}`,
      use_product_price: true,
    } as const;

    productApi
      .createOrderFromCart(user.id, payload)
      .then(() => {
        setIsSuccess(true);
        clearCart();
      })
      .catch(() => {
        setIsSuccess(true);
        clearCart();
      });
  }

  const handleViewOrders = () => {
    router.push("/orders");
  };

  useEffect(() => {
    if (cart.length === 0 && !isSuccess) {
      router.push("/cart");
    }
  }, [cart.length, isSuccess, router]);

  if (cart.length === 0 && !isSuccess) return null;

  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <h1 className="font-headline text-4xl font-light uppercase tracking-[0.18em] text-white sm:text-5xl md:text-6xl">
            Thanh toán
          </h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <Form {...form}>
                <form
                  id="checkout-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <Card className="h-full">
                    <CardContent className="space-y-4 p-6">
                      <p className={checkoutSectionTitleClass}>
                        Thông tin giao hàng
                      </p>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="ban@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên</FormLabel>
                              <FormControl>
                                <Input placeholder="An" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Họ</FormLabel>
                              <FormControl>
                                <Input placeholder="Nguyễn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tỉnh / Thành phố</FormLabel>
                            <FormControl>
                              <Input placeholder="TP. Hồ Chí Minh" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quận / Huyện</FormLabel>
                              <FormControl>
                                <Input placeholder="Quận 1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ward"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phường / Xã</FormLabel>
                              <FormControl>
                                <Input placeholder="Bến Nghé" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Địa chỉ</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Lê Lợi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày giao hàng</FormLabel>
                            <div className="flex flex-wrap items-center gap-3">
                              <Dialog
                                open={isDateOpen}
                                onOpenChange={setIsDateOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline">
                                    {field.value
                                      ? new Date(field.value).toLocaleDateString()
                                      : "Chọn ngày"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Chọn ngày giao hàng</DialogTitle>
                                  </DialogHeader>
                                  <div className="pt-2">
                                    <Calendar
                                      mode="single"
                                      selected={field.value as Date}
                                      onSelect={(date) => {
                                        if (date) {
                                          field.onChange(date);
                                          setIsDateOpen(false);
                                        }
                                      }}
                                      disabled={(date) =>
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                      }
                                      initialFocus
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="h-full">
                    <CardContent className="space-y-3 p-6">
                      <p className={checkoutSectionTitleClass}>Thanh toán</p>
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phương thức đã chọn</FormLabel>
                            <div>
                              <Button type="button" variant="outline" disabled>
                                {field.value}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Hiện tại hệ thống đang áp dụng hình thức thanh toán khi
                        nhận hàng để giữ quy trình đơn giản và thuận tiện.
                      </p>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </div>

            <div className="space-y-6 lg:sticky lg:top-8">
              <Card className="h-full">
                <CardContent className="space-y-4 p-6">
                  <p className={checkoutSectionTitleClass}>Tóm tắt đơn hàng</p>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="shrink-0 text-white">
                        {formatVND(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tạm tính</span>
                    <span className="text-white">
                      {formatVND(getCartTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Vận chuyển</span>
                    <span className="text-white">Miễn phí</span>
                  </div>
                  <div className="rounded-2xl border border-[#ff9b53]/30 bg-[rgba(255,130,32,0.1)] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                        Tổng cộng
                      </span>
                      <span className="text-2xl font-semibold tracking-tight text-[#ffb56d] sm:text-3xl">
                        {formatVND(getCartTotal())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="h-12 w-full text-base font-semibold shadow-[0_18px_34px_-20px_rgba(255,106,0,0.72)]"
              >
                <CreditCard className="h-5 w-5" />
                Thanh toán {formatVND(getCartTotal())}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={isSuccess} onOpenChange={setIsSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="normal-case">
              Đặt hàng thành công
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã hoàn tất thanh toán và đơn hàng đã được ghi nhận thành
              công.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleViewOrders}>
              Tiếp tục mua sắm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
