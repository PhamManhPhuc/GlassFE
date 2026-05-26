import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-white/10">
          <div className="container mx-auto px-2 pt-2 pb-8 md:pt-3 md:pb-6">
            <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] px-4 py-4 sm:min-h-[32rem] sm:px-6 sm:py-10 lg:min-h-[36rem] lg:px-10 lg:py-12">
              <div className="absolute inset-0 rounded-[2rem]">
                <Image
                  src="/homepage/hero/anh5.jpg"
                  alt="Bộ sưu tập KYRO"
                  fill
                  className="object-cover opacity-55"
                />
                <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,160,90,0.1),transparent_26%),linear-gradient(180deg,rgba(8,8,8,0.32),rgba(8,8,8,0.68)),linear-gradient(90deg,rgba(8,8,8,0.78),rgba(8,8,8,0.46),rgba(8,8,8,0.68))]" />
              </div>

              <div className="relative z-10 flex min-h-[24rem] items-center sm:min-h-[28rem] lg:min-h-[32rem]">
                <div className="w-full max-w-3xl text-left lg:ml-[6%]">
                  <h1 className="mt-6 max-w-3xl font-headline text-4xl uppercase tracking-[0.12em] text-white sm:text-5xl lg:text-6xl">
                    CÂU CHUYỆN KYRO
                  </h1>
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    KYRO được tạo nên với mong muốn mang đến một không gian mua sắm hiện đại dành cho kính mắt và phụ kiện — nơi phong cách, sự tinh tế và trải nghiệm được đặt ở trung tâm.
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Chúng tôi theo đuổi ngôn ngữ thiết kế tối giản, tập trung vào những chi tiết vừa đủ để mỗi sản phẩm dễ dàng hòa hợp với phong cách thường ngày nhưng vẫn giữ được dấu ấn riêng biệt. Từ kính mắt, dây chuyền đến khuyên tai, mọi thiết kế đều được lựa chọn với tinh thần hiện đại và tính ứng dụng cao.
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Tại KYRO, trải nghiệm mua sắm không chỉ dừng lại ở việc lựa chọn sản phẩm. Đó còn là cảm giác trực quan, rõ ràng và dễ tiếp cận trong từng tương tác — từ hình ảnh, bố cục đến cách khám phá bộ sưu tập.
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Chúng tôi tin rằng sự tinh tế luôn đến từ những điều đơn giản nhất. Và KYRO được xây dựng để trở thành nơi giúp bạn hoàn thiện phong cách theo cách tự nhiên và hiện đại hơn mỗi ngày.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <section className="container mx-auto px-2 pb-50 md:pb-24">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="kyro-panel-soft p-7 text-center lg:text-left">
              <p className="text-sm font-normal tracking-normal text-[#ffb56d]">
                Chất liệu
              </p>
              <h2 className="mt-4 text-2xl font-normal text-white">
                Ngôn ngữ hình ảnh có chiều sâu
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Nền tối, bề mặt kính và hiệu ứng chrome được tiết chế để sản
                phẩm có cảm giác nổi khối, sang hơn và bớt nhiễu thị giác.
              </p>
            </div>

            <div className="kyro-panel-soft p-7 text-center lg:text-left">
              <p className="text-sm font-normal tracking-normal text-[#ffb56d]">
                Bố cục
              </p>
              <h2 className="mt-4 text-2xl font-normal text-white">
                Căn trái nhưng vẫn ở giữa màn
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Khối nội dung chính được neo vào vùng trung tâm của section để
                bố cục cân hơn, trong khi text căn trái giúp nhịp đọc tự nhiên
                và rõ ràng hơn.
              </p>
            </div>

            <div className="kyro-panel-soft p-7 text-center lg:text-left">
              <p className="text-sm font-normal tracking-normal text-[#ffb56d]">
                Trải nghiệm
              </p>
              <h2 className="mt-4 text-2xl font-normal text-white">
                Liền mạch từ xem đến mua
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Từ trang giới thiệu đến trang sản phẩm và thanh toán, cùng một
                ngôn ngữ thị giác được giữ xuyên suốt để hành trình mua sắm
                mượt và nhất quán hơn.
              </p>
            </div>
          </div>
        </section> */}

        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="kyro-panel p-10 text-center sm:p-14">
            <h2 className="font-headline text-4xl uppercase tracking-[0.12em] text-white sm:text-5xl">
              Khám phá Bộ sưu tập
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Nâng tầm diện mạo với các thiết kế phụ kiện mới nhất. Khám phá ngay để trải nghiệm quá trình mua sắm và thanh toán nhanh chóng, tiện lợi.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/shop">Mua ngay</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
