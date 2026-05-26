"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { getGlassesRecommendation, AIFormState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProductCard from "./ProductCard";
import { Sparkles, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import "./AIAssistantButton.css";

const initialState: AIFormState = {
  message: null,
  recommendation: null,
  recommendedProducts: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn("ai-submit-button", "w-full sm:w-auto")}
    >
      <svg
        viewBox="0 0 24 24"
        height="24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="currentColor"
      >
        <g fill="none">
          <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"></path>
          <path
            d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM11 6.094l-.806 2.36a6 6 0 0 1-3.49 3.649l-.25.091l-2.36.806l2.36.806a6 6 0 0 1 3.649 3.49l.091.25l.806 2.36l.806-2.36a6 6 0 0 1 3.49-3.649l.25-.09l2.36-.807l-2.36-.806a6 6 0 0 1-3.649-3.49l-.09-.25zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026.35l.35-1.027A1 1 0 0 1 19 2"
            fill="currentColor"
          ></path>
        </g>
      </svg>
      {pending ? "Đang phân tích..." : "Nhận gợi ý"}
    </button>
  );
}

export default function AIAssistant() {
  const [state, formAction] = useActionState(
    getGlassesRecommendation,
    initialState,
  );
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.recommendation) {
      toast({
        title: "Chưa thể gợi ý",
        description: state.message,
        variant: "destructive",
      });
    }
    if (state.recommendation) {
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <section
      id="ai-assistant"
      className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#000000_0%,#050000_40%,#000000_100%),radial-gradient(circle_at_top,rgba(255,155,83,0.06),transparent_24%)] py-16 md:py-28 lg:py-32"
    >
      <div className="container mx-auto px-4">
        <div>
          <Card className="overflow-hidden border-white/12 bg-[linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_52%,rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(191,195,201,0.18),transparent_30%)] shadow-[0_32px_90px_-42px_rgba(0,0,0,0.9)]">
              <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-white/12 bg-[linear-gradient(135deg,rgba(245,245,243,0.92),rgba(191,195,201,0.76))] text-[#0F0F10] shadow-[0_20px_40px_-24px_rgba(191,195,201,0.72)]">
                <Bot className="h-6 w-6" />
              </div>
              <CardTitle className="text-3xl text-white/95 md:text-4xl">
                AI STYLIST
              </CardTitle>
              <CardDescription className="mx-auto max-w-2xl text-base leading-7 text-white/95 md:text-lg">
                Chia sẻ phong cách, nhu cầu của bạn để AI gợi ý những phụ kiện phù hợp nhất.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} action={formAction} className="space-y-4">
                <Textarea
                  id="needs"
                  name="needs"
                  placeholder="Ví dụ: 'Tôi muốn một cặp kính thanh lịch để đi làm', 'Tôi cần khuyên tai nhỏ gọn để đeo hằng ngày' hoặc 'Gợi ý cho tôi một vòng cổ tối giản để dễ phối đồ'"
                  className="min-h-[148px] resize-y px-4 py-3.5 text-base leading-relaxed placeholder:text-muted-foreground/85 sm:min-h-[168px] md:min-h-[188px] md:px-5 md:py-4 md:text-lg md:leading-relaxed"
                  required
                />
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  <SubmitButton />
                </div>
              </form>

              {state.recommendation && (
                <div key={state.timestamp} className="mt-6 animate-in fade-in-50 duration-500">
                  <Card className="border-white/12 bg-[linear-gradient(155deg,rgba(191,195,201,0.14),rgba(255,255,255,0.04)_48%,rgba(255,255,255,0.02))]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl text-white/95">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Gợi ý dành cho bạn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/95">{state.recommendation}</p>
                      {state.recommendedProducts && state.recommendedProducts.length > 0 && (
                        <div className="mt-10">
                          <h4 className="mb-6 text-lg text-white/95 sm:text-xl">
                            Sản phẩm phù hợp
                          </h4>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {state.recommendedProducts.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
