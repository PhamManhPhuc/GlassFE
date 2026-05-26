"use client";

import { useContext, useState, useEffect, Key } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ThreeViewer from "@/components/ThreeViewer";
import ArTryOnViewer from "@/components/ArTryOnViewer";
import EarringTryOnViewer from "@/components/EarringTryOnViewer";
import NecklaceTryOnViewer from "@/components/NecklaceTryOnViewer";
import { AppContext } from "@/context/AppContext";
import { productApi, ApiError } from "@/lib/api";
import type { Product, ProductVariant } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart, Loader2, Camera, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, formatVND } from "@/lib/utils";
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
import StarRating from "@/components/ui/star-rating";
import FaceShapeModal from "@/components/FaceShapeModal.fixed";
import { FaceShape } from "@/utils/faceShapeClassifier";

// Tối ưu URL ảnh Cloudinary để tải nhanh hơn
const optimizeImageUrl = (url: string): string => {
  if (!url || !url.includes("cloudinary.com")) return url;
  const parts = url.split("/upload/");
  if (parts.length === 2) {
    return `${parts[0]}/upload/f_auto,q_auto,w_800/${parts[1]}`;
  }
  return url;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = parseInt(id as string, 10);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [show3DModel, setShow3DModel] = useState(false);
  const [showArTryOn, setShowArTryOn] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart, toggleFavorite, favorites, user } = useContext(AppContext);
  const { toast } = useToast();
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [detectedShape, setDetectedShape] = useState<FaceShape | null>(null);

  const [productRating, setProductRating] = useState(0);

  const handleRatingChange = (newRating: number) => {
    setProductRating(newRating);
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productDataRaw, variantsRaw] = await Promise.all([
          productApi.getProductById(productId),
          productApi.getProductVariants(productId),
        ]);

        const productData = productDataRaw as Product;
        setProduct(productData);
        setShow3DModel(false);
        setShowArTryOn(false);

        const relatedByShape = await productApi.getProductsByShape(
          productData.shape,
        );
        const relatedSource = Array.isArray(relatedByShape)
          ? relatedByShape
          : Array.isArray((relatedByShape as any)?.data)
            ? (relatedByShape as any).data
            : [];
        const related = relatedSource
          .filter(
            (p: any) =>
              p && typeof p.id === "number" && p.id !== productData.id,
          )
          .slice(0, 4);
        setRelatedProducts(related);

        const variantArray = Array.isArray(variantsRaw)
          ? (variantsRaw as ProductVariant[])
          : [];
        setVariants(variantArray);
        if (variantArray.length > 0) {
          setSelectedVariantId(variantArray[0].id);
          const initialVariantImages = Array.isArray(variantArray[0].images)
            ? variantArray[0].images
            : [];
          const fallback = Array.isArray(productData.picUrl)
            ? productData.picUrl
            : [];
          const first =
            (initialVariantImages[0] || fallback[0]) ?? "/placeholder.svg";
          setSelectedImageUrl(optimizeImageUrl(first));
        } else {
          const fallback = Array.isArray(productData.picUrl)
            ? productData.picUrl
            : [];
          const first = fallback[0] ?? "/placeholder.svg";
          setSelectedImageUrl(optimizeImageUrl(first));
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError(
          err instanceof ApiError ? err.message : "Không thể tải sản phẩm",
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50/50">
          <div className="container mx-auto px-4 py-8 text-center md:py-12">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Đang tải sản phẩm...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50/50">
          <div className="container mx-auto px-4 py-8 text-center md:py-12">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl">
              {error ? "Lỗi tải sản phẩm" : "Không tìm thấy sản phẩm"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {error ||
                "Xin lỗi, chúng tôi không thể tìm thấy sản phẩm bạn đang tìm."}
            </p>
            <Button
              asChild
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/shop">Quay lại cửa hàng</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);
  const modelUrl = product.modelUrl || null;
  const arModelUrl = product.tryOnUrl || modelUrl;
  const has3DModel = Boolean(modelUrl);
  const isEarringProduct =
    product.arTryOnCategory === "earrings" ||
    /khuyên|earring|bông\s*tai|hoa\s*tai/i.test(product.name) ||
    /khuyên|earring|bông\s*tai|hoa\s*tai/i.test(product.category ?? "");
  const isNecklaceProduct =
    product.arTryOnCategory === "necklaces" ||
    /necklace|vòng\s*cổ|dây\s*chuyền/i.test(product.name) ||
    /necklace|vòng\s*cổ|dây\s*chuyền/i.test(product.category ?? "");
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) || null;

  const allVariantImages: string[] = Array.isArray(variants)
    ? Array.from(
        new Set(
          variants
            .flatMap((variant) =>
              Array.isArray(variant.images) ? variant.images : [],
            )
            .filter((url) => typeof url === "string" && url.length > 0),
        ),
      )
    : [];
  const fallbackImages = Array.isArray(product.picUrl) ? product.picUrl : [];
  const galleryImages =
    allVariantImages.length > 0 ? allVariantImages : fallbackImages;

  const optimizedGalleryImages = galleryImages.map(optimizeImageUrl);
  const optimizedSelectedImageUrl = selectedImageUrl
    ? optimizeImageUrl(selectedImageUrl)
    : null;

  const primaryImageUrl =
    optimizedSelectedImageUrl ??
    optimizedGalleryImages[0] ??
    "/placeholder.svg";

  const handleAddToCart = () => {
    const variant = selectedVariantId
      ? variants.find((item) => item.id === selectedVariantId)
      : null;

    addToCart(product, {
      productVariationId: variant ? variant.id : undefined,
      quantity: 1,
    });

    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} hiện đã có trong giỏ hàng của bạn.`,
    });
  };

  const handleToggleFavorite = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    toggleFavorite(product.id);
    toast({
      title: isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
      description: `${product.name} đã được ${
        isFavorite ? "xóa khỏi" : "thêm vào"
      } danh sách yêu thích của bạn.`,
    });
  };

  const handleReviewSubmit = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!reviewText.trim() || productRating === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn số sao và viết nội dung đánh giá.",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting review:", productRating, reviewText);
    productApi
      .updateReview(user.id, product.id, productRating, reviewText)
      .then(() => {
        toast({
          title: "Đã gửi đánh giá",
          description: "Cảm ơn bạn đã gửi phản hồi!",
        });

        const newReview = {
          User: {
            id: user.id,
            fullname: user.name || "Bạn",
          },
          rating: productRating,
          review_text: reviewText,
        };

        setProduct((prevProduct) => {
          if (!prevProduct) return null;

          return {
            ...prevProduct,
            reviews: [newReview, ...prevProduct.reviews],
          };
        });

        setProductRating(0);
        setReviewText("");
      })
      .catch((err) => {
        console.error("Failed to submit review:", err);
        toast({
          title: "Lỗi",
          description:
            err instanceof ApiError
              ? err.message
              : "Không thể gửi đánh giá của bạn.",
          variant: "destructive",
        });
      });
  };

  const mediaActionButtonClass =
    "inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b53]/50 sm:h-11 sm:text-[0.72rem]";
  const mediaActionButtonIdleClass =
    "border-[#ff9b53]/45 bg-[linear-gradient(180deg,rgba(255,170,100,0.32),rgba(28,16,8,0.96))] text-white shadow-[inset_0_1px_0_rgba(255,210,170,0.38),0_6px_20px_-8px_rgba(255,106,0,0.45)] hover:border-[#ffb073]/65 hover:bg-[linear-gradient(180deg,rgba(255,185,120,0.4),rgba(32,18,10,0.98))] active:scale-[0.98]";
  const mediaActionButtonActiveClass =
    "border-[#ff8a20] bg-[linear-gradient(135deg,#ff7a18,#ff5a00)] text-white shadow-[inset_0_1px_0_rgba(255,220,180,0.4),0_10px_24px_-14px_rgba(255,106,0,0.9)]";
  const mediaActionButtonDisabledClass =
    "cursor-not-allowed border-white/20 bg-white/[0.06] text-white/35 shadow-none hover:border-white/20 hover:bg-white/[0.06] active:scale-100";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(255,140,56,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(255,176,115,0.08),transparent_18%),linear-gradient(180deg,#050505_0%,#090909_42%,#030303_100%)]">
        <div className="container mx-auto flex min-h-[calc(100dvh-4rem)] flex-col px-4 pt-2 pb-2 md:min-h-[calc(100dvh-4.25rem)] md:pt-2.5 md:pb-3">
          <div className="kyro-panel-soft flex min-h-0 flex-1 flex-col overflow-hidden p-2.5 sm:p-3">
            <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1.02fr)_1px_minmax(0,0.98fr)]">
              <div className="flex min-h-0 flex-1 flex-col gap-2 xl:pr-4">
                <div className="product-image-frame relative flex min-h-[min(52vh,520px)] flex-1 items-center justify-center overflow-hidden rounded-[1.2rem] border shadow-[0_28px_64px_-36px_rgba(0,0,0,0.95)] xl:min-h-0">
                  {show3DModel && has3DModel ? (
                    <div className="absolute inset-0 h-full w-full product-image-stage-inner">
                      <ThreeViewer modelUrl={modelUrl!} />
                    </div>
                  ) : showArTryOn ? (
                    <div className="absolute inset-0 h-full w-full">
                      {isNecklaceProduct ? (
                        <NecklaceTryOnViewer
                          modelUrl={arModelUrl!}
                          fitMetadata={product.arModelFit}
                        />
                      ) : isEarringProduct ? (
                        <EarringTryOnViewer
                          modelUrl={arModelUrl!}
                          fitMetadata={product.arModelFit}
                        />
                      ) : (
                        <ArTryOnViewer
                          modelUrl={arModelUrl!}
                          fitMetadata={product.arModelFit}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="product-image-stage-inner flex h-full w-full items-center justify-center p-2 sm:p-3">
                      <Image
                        src={primaryImageUrl}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="mx-auto h-full w-full max-h-full max-w-full object-contain"
                        data-ai-hint="product photo"
                      />
                    </div>
                  )}
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!has3DModel) return;
                      setShowArTryOn(false);
                      setShow3DModel((prev) => !prev);
                    }}
                    disabled={!has3DModel}
                    className={cn(
                      mediaActionButtonClass,
                      !has3DModel
                        ? mediaActionButtonDisabledClass
                        : show3DModel
                          ? mediaActionButtonActiveClass
                          : mediaActionButtonIdleClass,
                    )}
                    aria-label="Xem mô hình 3D"
                    title={
                      has3DModel ? "Xem mô hình 3D" : "Không có mô hình 3D"
                    }
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                      />
                    </svg>
                    <span>3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!has3DModel) return;
                      setShow3DModel(false);
                      setShowArTryOn((prev) => !prev);
                    }}
                    disabled={!has3DModel}
                    className={cn(
                      mediaActionButtonClass,
                      !has3DModel
                        ? mediaActionButtonDisabledClass
                        : showArTryOn
                          ? mediaActionButtonActiveClass
                          : mediaActionButtonIdleClass,
                    )}
                    aria-label={
                      isEarringProduct ? "Thử khuyên tai AR" : "Thử kính AR"
                    }
                    title={
                      has3DModel
                        ? isEarringProduct
                          ? "Thử khuyên tai AR"
                          : "Thử kính AR"
                        : "Không có mô hình 3D"
                    }
                  >
                    <Camera className="h-4 w-4 shrink-0" />
                    <span>AR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFaceModal(true)}
                    className={cn(
                      mediaActionButtonClass,
                      mediaActionButtonIdleClass,
                    )}
                    aria-label="AI gợi ý theo dáng mặt"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="truncate">AI dáng mặt</span>
                  </button>
                </div>

                {galleryImages.length > 0 && (
                  <div className="grid shrink-0 grid-cols-4 gap-1 sm:grid-cols-5 md:grid-cols-6">
                    {optimizedGalleryImages.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(optimizeImageUrl(url));
                          setShow3DModel(false);
                          setShowArTryOn(false);
                        }}
                        className={cn(
                          "product-image-thumb-frame overflow-hidden rounded-xl border-2 focus:outline-none transition-[border-color,box-shadow]",
                          selectedImageUrl === url &&
                            !show3DModel &&
                            !showArTryOn
                            ? "border-[#ff7a18] shadow-[0_0_0_1px_rgba(255,122,24,0.45),inset_0_0_0_1px_rgba(255,155,83,0.25)] ring-[3px] ring-[#ff9b53]/75"
                            : "border-white/20 hover:border-[#ff9b53]/55",
                        )}
                        aria-label={`Xem ảnh ${index + 1}`}
                        title={`Xem ảnh ${index + 1}`}
                      >
                        <Image
                          src={url}
                          alt={`${product.name} ảnh ${index + 1}`}
                          width={200}
                          height={200}
                          className="h-9 w-full object-contain p-1 sm:h-10"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mx-auto my-2.5 hidden h-full w-px bg-white/10 xl:block" />

              <div className="mt-2.5 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto border-t border-white/10 pt-2.5 xl:mt-0 xl:max-h-full xl:border-t-0 xl:pl-4 xl:pt-0">
                <h1 className="mb-6 break-words font-body text-xl font-semibold leading-snug tracking-normal text-foreground sm:mb-7 sm:text-2xl md:text-3xl">
                  {product.name}
                </h1>
                <div className="rounded-[1rem] border border-[#ffb073]/20 bg-[radial-gradient(circle_at_top,rgba(255,176,115,0.18),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,130,32,0.1)_48%,rgba(12,12,12,0.94))] px-3 py-2 shadow-[0_24px_50px_-28px_rgba(255,130,32,0.7)]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#ffd4af]/80">
                    Giá bán
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[#ffb56d] drop-shadow-[0_0_24px_rgba(255,130,32,0.2)] sm:text-4xl">
                    {formatVND(Number(product.price ?? 0))}
                  </p>
                </div>
                <div className="mt-3 space-y-1 rounded-[1.1rem] border border-white/10 bg-black/25 p-2.5 sm:p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Hình dáng:</span>
                    <span className="text-muted-foreground">
                      {product.shape}
                    </span>
                  </div>

                  {product.face_suitable &&
                    product.face_suitable.trim() !== "" && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          Phù hợp khuôn mặt:
                        </span>
                        <span className="text-muted-foreground">
                          {product.face_suitable}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      Thương hiệu:
                    </span>
                    <span className="rounded-full border border-[#ffb073]/25 bg-[#ff9b53]/12 px-3 py-1 text-sm text-[#ffd0a4]">
                      {product.brand}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Chất liệu:</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-white/80">
                      {product.material}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 rounded-[1.1rem] border border-white/10 bg-black/20 p-2.5 sm:p-3">
                  <p className="text-base leading-normal text-muted-foreground">
                    {product.description}
                  </p>
                </div>

                {product.category === "kính" && (
                  <>
                    <div className="mt-2.5 space-y-1.5 rounded-[1.1rem] border border-white/10 bg-black/20 p-2.5 sm:p-3">
                      <h3 className="text-lg font-semibold text-white">
                        Thông số kỹ thuật
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Chiều ngang kính:
                          </span>
                          <span className="font-medium">
                            {product.dimensions.width}mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Chiều dài kính:
                          </span>
                          <span className="font-medium">
                            {product.dimensions.length}mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Độ rộng tròng:
                          </span>
                          <span className="font-medium">
                            {product.dimensions.lensWidth}mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Độ cao tròng:
                          </span>
                          <span className="font-medium">
                            {product.dimensions.lensHeight}mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Cầu mũi:
                          </span>
                          <span className="font-medium">
                            {product.dimensions.bridge}mm
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-auto flex flex-row gap-3 pt-1.5">
                  <Button
                    size="lg"
                    className="h-14 w-[85%] rounded-2xl border-0 bg-[linear-gradient(135deg,#ff7a18,#ff5a00)] px-6 text-white shadow-[0_24px_48px_-22px_rgba(255,106,0,0.9)] hover:bg-[linear-gradient(135deg,#ff8a2a,#ff6400)] hover:shadow-[0_28px_56px_-20px_rgba(255,106,0,0.95)]"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Thêm vào giỏ hàng
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 w-[15%] rounded-2xl border-white/14 bg-white/[0.04] px-0 text-white hover:border-[#ff9b53]/45 hover:bg-[#ff9b53]/10"
                    onClick={handleToggleFavorite}
                    title={
                      isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
                    }
                    aria-label={
                      isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
                    }
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFavorite && "fill-red-500 text-red-500",
                      )}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-body text-3xl font-semibold tracking-normal text-primary sm:text-4xl">
              Đánh giá của khách hàng
            </h2>
            <div className="mx-auto mt-8 max-w-3xl space-y-6">
              {product.reviews.map(
                (
                  review: {
                    User: {
                      id: number;
                      fullname: string;
                    };
                    rating: number;
                    review_text: string | null;
                  },
                  index: Key | null | undefined,
                ) => (
                  <div
                    key={review.User.id || index}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <h4 className="reviewerName">
                      {review.User ? review.User.fullname : "Ẩn danh"}
                    </h4>
                    <div className="mb-2 flex items-center">
                      {Array.from({ length: 5 }, (_, starIndex) => {
                        const fillPercent = Math.max(
                          0,
                          Math.min(1, review.rating - starIndex),
                        );
                        return (
                          <span
                            key={starIndex}
                            className="text-sm"
                            style={{
                              background: `linear-gradient(90deg, gold ${
                                fillPercent * 100
                              }%, #ddd ${fillPercent * 100}%)`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-muted-foreground">
                      {review.review_text}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div>
              <h3 className="mb-4 mt-10 font-body text-2xl font-semibold tracking-normal text-foreground">
                Viết đánh giá
              </h3>
              <div>
                <StarRating
                  rating={productRating}
                  onRatingChange={handleRatingChange}
                  size={30}
                />
              </div>
              <textarea
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] p-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Viết đánh giá của bạn tại đây..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
              <div className="mt-2 flex justify-end">
                <Button
                  className="normal-case tracking-normal"
                  onClick={handleReviewSubmit}
                >
                  Gửi đánh giá
                </Button>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="py-8 md:py-10">
            <div className="container mx-auto px-4">
              <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Có thể bạn cũng thích
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yêu cầu đăng nhập</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích.
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

        <FaceShapeModal
          isOpen={showFaceModal}
          onClose={() => {
            setShowFaceModal(false);
            setDetectedShape(null);
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
