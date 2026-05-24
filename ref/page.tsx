// "use client";
// import React, { use, useState, useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import useSWR from "swr";
// import {
//   ProductDetailResponse,
// } from "@/types/product";
// import { ShoppingCart } from "lucide-react";
// import { toast } from "react-toastify";
// import ThreeViewer from "@/components/ThreeViewer";
// import ProductReviewSection from "@/components/ProductReviewSection";

// interface PageParams {
//   slug: string;
// }

// interface PageProps {
//   params: PageParams | Promise<PageParams>;
// }

// const fetcher = async (url: string): Promise<ProductDetailResponse> => {
//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error("Failed to fetch product");
//   }
//   return res.json();
// };

// export default function ProductDetailPage({ params }: PageProps) {
//   const router = useRouter();
//   const [userId, setUserId] = useState<number | null>(null);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [selectedSize, setSelectedSize] = useState<number | null>(null);
//   const [quantity, setQuantity] = useState(1);
//   const [isAdding, setIsAdding] = useState(false);
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0); // For image/3D viewer switching
//   const [isNutritionExpanded, setIsNutritionExpanded] = useState(false); // For collapsible nutrition info

//   // In newer Next.js versions, `params` may be passed as a Promise in client components
//   const resolvedParams =
//     params instanceof Promise ? use(params) : (params as PageParams);

//   const {
//     data,
//     error,
//     isLoading,
//   } = useSWR<ProductDetailResponse>(
//     `http://localhost:8800/api/products/${resolvedParams.slug}`,
//     fetcher
//   );

//   useEffect(() => {
//     // Check if user is logged in
//     const token = localStorage.getItem("auth_token");
//     const userStr = localStorage.getItem("user");

//     if (token && userStr) {
//       setIsLoggedIn(true);
//       try {
//         const user = JSON.parse(userStr);
//         if (user?.id) {
//           setUserId(user.id);
//         }
//       } catch (error) {
//         console.error("Error parsing user data:", error);
//       }
//     }


//   }, []);

//   useEffect(() => {
//     // Set default size if product has sizes
//     if (data?.product?.hasSize && data.product.ProductVariants && data.product.ProductVariants.length > 0) {
//       setSelectedSize(data.product.ProductVariants[0].id);
//     }

//     // Set 3D viewer as default view if product has 3DUrl
//     if (data?.product?.["3DUrl"]) {
//       setSelectedImageIndex(-1); // -1 represents 3D viewer
//     } else {
//       setSelectedImageIndex(0); // Default to first image
//     }

//     console.log(data);
//   }, [data]);

//   if (isLoading) {
//     return (
//       <main className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
//           <p className="text-gray-600">Loading product...</p>
//         </div>
//       </main>
//     );
//   }

//   if (error || !data || data.errCode !== 0 || !data.product) {
//     return (
//       <main className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-red-600 text-lg mb-2">Error loading product</p>
//           <p className="text-gray-600">
//             {error instanceof Error ? error.message : "Product not found"}
//           </p>
//         </div>
//       </main>
//     );
//   }

//   const product = data.product;
//   const mainImage = product.ProductImages[0];

//   const handleAddToCart = async () => {
//     if (!isLoggedIn || !userId) {
//       toast.info("Please log in to add items to your cart");
//       router.push("/login");
//       return;
//     }

//     if (product.hasSize && !selectedSize) {
//       toast.warning("Please select a size");
//       return;
//     }

//     setIsAdding(true);

//     try {
//       const token = localStorage.getItem("auth_token");
//       const response = await fetch(
//         `http://localhost:8800/api/users/${userId}/cart/items`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             productId: product.id,
//             quantity: quantity,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok || result.errCode !== 0) {
//         throw new Error(result.message || "Failed to add item to cart");
//       }

//       toast.success(`Added ${quantity} item(s) to cart!`);
//       setQuantity(1); // Reset quantity

//       // Trigger a custom event to update cart count in header
//       window.dispatchEvent(new Event("cartUpdated"));
//     } catch (error) {
//       toast.error(
//         error instanceof Error ? error.message : "Failed to add item to cart"
//       );
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-background text-foreground">
//       <div className="mx-auto max-w-5xl px-4 py-10">
//         <div className="mb-6">
//           <Link
//             href="/shop"
//             className="text-sm text-gray-500 hover:text-gray-700"
//           >
//             ← Back to shop
//           </Link>
//         </div>

//         <div className="grid gap-10 md:grid-cols-2">
//           {/* Images */}
//           <section>
//             {/* Main Display Area */}
//             <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
//               {selectedImageIndex === -1 && product["3DUrl"] ? (
//                 // Show 3D Viewer
//                 <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white">
//                   <ThreeViewer modelUrl={product["3DUrl"]} />
//                 </div>
//               ) : (
//                 // Show Selected Image
//                 mainImage && (
//                   <Image
//                     src={product.ProductImages[selectedImageIndex]?.pic_url || mainImage.pic_url}
//                     alt={product.name}
//                     fill
//                     className="object-contain"
//                   />
//                 )
//               )}
//             </div>

//             {/* Thumbnails */}
//             {(product.ProductImages.length > 1 || product["3DUrl"]) && (
//               <div className="flex gap-3 flex-wrap">
//                 {/* Image Thumbnails */}
//                 {product.ProductImages.map((img, index) => (
//                   <button
//                     key={img.id}
//                     onClick={() => setSelectedImageIndex(index)}
//                     className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${selectedImageIndex === index
//                       ? "border-black scale-105"
//                       : "border-gray-200 hover:border-gray-400"
//                       }`}
//                   >
//                     <Image
//                       src={img.pic_url}
//                       alt={`${product.name} thumbnail ${img.display_order}`}
//                       fill
//                       className="object-contain"
//                     />
//                   </button>
//                 ))}

//                 {/* 3D Viewer Thumbnail */}
//                 {product["3DUrl"] && (
//                   <button
//                     onClick={() => setSelectedImageIndex(-1)}
//                     className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all flex items-center justify-center ${selectedImageIndex === -1
//                       ? "border-black bg-black text-white scale-105"
//                       : "border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 hover:border-gray-400"
//                       }`}
//                   >
//                     <div className="text-center">
//                       <svg
//                         className="w-8 h-8 mx-auto mb-1"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
//                         />
//                       </svg>
//                       <span className="text-[10px] font-medium">3D</span>
//                     </div>
//                   </button>
//                 )}
//               </div>
//             )}
//           </section>

//           {/* Details */}
//           <section className="flex flex-col gap-6">
//             <div>
//               <h1 className="text-2xl font-semibold">{product.name}</h1>
//               {product.subtitle && (
//                 <p className="mt-1 text-sm text-gray-500">
//                   {product.subtitle}
//                 </p>
//               )}
//             </div>

//             <div>
//               <p className="text-2xl font-bold">
//                 ${Number(product.price).toFixed(2)}
//               </p>
//             </div>

//             <div>
//               <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-700">
//                 Description
//               </h2>
//               <p className="text-sm leading-relaxed text-gray-700">
//                 {product.description}
//               </p>
//             </div>

//             {/* Nutritional Information - Collapsible */}
//             {product.ProductDetails && (
//               <div className="border border-gray-200 rounded-lg overflow-hidden">
//                 <button
//                   onClick={() => setIsNutritionExpanded(!isNutritionExpanded)}
//                   className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
//                 >
//                   <h2 className="text-base font-bold text-gray-900">
//                     Dinh dưỡng
//                   </h2>
//                   <svg
//                     className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isNutritionExpanded ? "rotate-180" : ""
//                       }`}
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M19 9l-7 7-7-7"
//                     />
//                   </svg>
//                 </button>

//                 {isNutritionExpanded && (
//                   <div className="px-4 py-4 bg-white border-t border-gray-200">
//                     {/* Serving Size */}
//                     <div className="mb-4 pb-3 border-b border-gray-200">
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm font-semibold text-gray-900 uppercase">
//                           GIÁ TRỊ DINH DƯỠNG TRONG
//                         </span>
//                         <span className="text-sm font-semibold text-gray-900">
//                           {product.ProductDetails.serving_size}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Nutritional Values */}
//                     <div className="space-y-2 mb-4">
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           NĂNG LƯỢNG
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {product.ProductDetails.energy_kcal} kcal
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           CHẤT ĐẠM
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {product.ProductDetails.protein} g
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           CHẤT BÉO
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {product.ProductDetails.fat} g
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           CARBOHYDRATE
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {product.ProductDetails.carbohydrates} g
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           ĐƯỜNG
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {product.ProductDetails.sugars} g
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center py-1">
//                         <span className="text-sm text-gray-900 uppercase">
//                           NATRI
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           ≤ {Math.round(product.ProductDetails.fiber * 10)} mg
//                         </span>
//                       </div>
//                     </div>

//                     {/* Ingredients */}
//                     <div className="pt-3 border-t border-gray-200">
//                       <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">
//                         Thành phần
//                       </h3>
//                       <p className="text-sm text-gray-900 leading-relaxed uppercase">
//                         {product.ProductDetails.ingredient}
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {product.hasSize && product.ProductVariants && product.ProductVariants.length > 0 && (
//               <div>
//                 <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-700">
//                   Size
//                 </h2>
//                 <div className="flex flex-wrap gap-2">
//                   {product.ProductVariants?.map((variant) => (
//                     <label
//                       key={variant.id}
//                       className={`flex cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${selectedSize === variant.id
//                         ? "border-black bg-black text-white"
//                         : "border-gray-300 text-gray-800 hover:border-black"
//                         }`}
//                     >
//                       <input
//                         type="radio"
//                         name="size"
//                         value={variant.id}
//                         checked={selectedSize === variant.id}
//                         onChange={() => setSelectedSize(variant.id)}
//                         className="sr-only"
//                       />
//                       <span>{variant.Size.name}</span>
//                       {variant.stock > 0 && (
//                         <span className="ml-2 text-xs opacity-75">
//                           ({variant.stock} in stock)
//                         </span>
//                       )}
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Quantity Selector */}
//             <div>
//               <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-700">
//                 Quantity
//               </h2>
//               <div className="flex items-center gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 hover:border-black transition"
//                   disabled={quantity <= 1}
//                 >
//                   <span className="text-lg">−</span>
//                 </button>
//                 <span className="text-lg font-medium w-8 text-center">{quantity}</span>
//                 <button
//                   type="button"
//                   onClick={() => setQuantity(quantity + 1)}
//                   className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 hover:border-black transition"
//                 >
//                   <span className="text-lg">+</span>
//                 </button>
//               </div>
//             </div>

//             {/* Add to Cart Button */}
//             {isLoggedIn ? (
//               <button
//                 type="button"
//                 onClick={handleAddToCart}
//                 disabled={isAdding || (product.hasSize && !selectedSize)}
//                 className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isAdding ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                     <span>Adding...</span>
//                   </>
//                 ) : (
//                   <>
//                     <ShoppingCart className="w-4 h-4" />
//                     <span>Add to Cart</span>
//                   </>
//                 )}
//               </button>
//             ) : (
//               <div className="space-y-3">
//                 <p className="text-sm text-gray-600">
//                   Please log in to add items to your cart.
//                 </p>
//                 <Link
//                   href="/login"
//                   className="mt-2 inline-flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-900"
//                 >
//                   Login
//                 </Link>
//               </div>
//             )}
//           </section>
//         </div>

//         {/* Customer Reviews & Ratings Section */}
//         <div className="mt-16 border-t border-gray-200 pt-12">
//           <ProductReviewSection
//             productId={product.id}
//             userId={userId || undefined}
//           />
//         </div>
//       </div>
//     </main>
//   );
// }

