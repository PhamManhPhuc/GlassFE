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

const loginSchema = z.object({
  email: z.string().email({ message: "Vui lòng nhập email hợp lệ." }),
  password: z.string().min(1, { message: "Vui lòng nhập mật khẩu." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: LoginFormData) {
    try {
      const userData = await authApi.login(data.email, data.password);
      login(userData.id, userData.name, userData.roleID);

      toast({
        title: "Chào mừng quay lại",
        description: "Tài khoản của bạn đã sẵn sàng.",
      });

      router.push(userData.roleID === 1 ? "/admin/dashboard" : "/");
    } catch (error) {
      const message =
        error instanceof ApiError && (error.status === 404 || error.status === 401)
          ? "Email hoặc mật khẩu không đúng."
          : "Đã có lỗi xảy ra. Vui lòng thử lại.";

      toast({
        title: "Đăng nhập thất bại",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="kyro-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_440px]">
        <div className="kyro-panel hidden p-10 lg:block xl:p-14">
          <span className="kyro-kicker">Truy cập tài khoản</span>
          <h1 className="mt-6 font-headline text-6xl uppercase tracking-[0.12em] text-white">
            Bước vào KYRO.
          </h1>
        </div>

        <Card className="text-white">
          <CardHeader className="text-center">
            <Link href="/" className="font-headline text-3xl uppercase tracking-[0.24em] text-white no-underline">
              KYRO
            </Link>
            <CardTitle className="mt-4">Đăng nhập</CardTitle>
            <CardDescription>Truy cập đơn hàng, danh sách yêu thích và giỏ hàng của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="ml-2 text-white no-underline hover:text-primary">
              Tạo tài khoản
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
