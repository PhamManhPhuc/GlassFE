"use client";

import { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { authApi, ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
    email: z.string().email({ message: "Vui lòng nhập email hợp lệ." }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: RegisterFormData) {
    try {
      const userData = await authApi.register(data.name, data.email, data.password);
      register(userData.id, userData.name, userData.roleID);

      toast({
        title: "Tạo tài khoản thành công",
        description: "Chào mừng bạn đến với KYRO.",
      });

      router.push("/");
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? "Email này đã được sử dụng."
          : "Đã có lỗi xảy ra. Vui lòng thử lại.";

      toast({
        title: "Đăng ký thất bại",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="kyro-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_460px]">
        <div className="kyro-panel hidden p-10 lg:block xl:p-14">
          <span className="kyro-kicker">Tạo tài khoản</span>
          <h1 className="mt-6 font-headline text-6xl uppercase tracking-[0.12em] text-white">
            Tham gia không gian KYRO.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Khu vực đăng ký giờ nằm trong cùng một hệ giao diện cao cấp,
            giúp điểm chạm đầu tiên với tài khoản đồng nhất với toàn bộ storefront.
          </p>
        </div>

        <Card className="text-white">
          <CardHeader className="text-center">
            <Link href="/" className="font-headline text-3xl uppercase tracking-[0.24em] text-white no-underline">
              KYRO
            </Link>
            <CardTitle className="mt-4">Tạo tài khoản</CardTitle>
            <CardDescription>Lưu sản phẩm yêu thích, theo dõi đơn hàng và thanh toán nhanh hơn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ban@example.com" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="ml-2 text-white no-underline hover:text-primary">
              Đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
