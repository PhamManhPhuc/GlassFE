"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { productApi, ApiError, type ProductFilters } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Star,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const INITIAL_DISPLAY_LIMIT = 5;

function ShopPageInner() {
  const searchParams = useSearchParams();
  const categoryFromQuery = searchParams.get("category");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categoryMap: Record<string, string> = {
    glasses: "Kính mắt",
    necklaces: "Vòng cổ",
    earrings: "Khuyên tai",
  };

  const reverseCategoryMap: Record<string, string> = Object.fromEntries(
    Object.entries(categoryMap).map(([k, v]) => [v, k]),
  );

  const normalizeCategory = (value: string) => value.trim().toLowerCase();

  const categoriesForApi = (selected: string[]) =>
    selected.map((c) => {
      if (categoryViToSlug[c]) return categoryViToSlug[c];
      const lower = c.trim().toLowerCase();
      if (lower in categoryMap) return lower;
      return c;
    });

  useEffect(() => {
    const slug = categoryFromQuery
      ? normalizeCategory(categoryFromQuery)
      : null;
    const nextCategories = slug && categoryMap[slug] ? [categoryMap[slug]] : [];
    setSelectedCategories((prev) => {
      const unchanged =
        prev.length === nextCategories.length &&
        prev.every((value, index) => value === nextCategories[index]);
      return unchanged ? prev : nextCategories;
    });
    setCurrentPage(1);
  }, [categoryFromQuery]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters: ProductFilters = {
          search: searchTerm || undefined,
          sortBy: sortOrder as ProductFilters["sortBy"],
          brand: selectedBrands.length > 0 ? selectedBrands : undefined,
          material:
            selectedMaterials.length > 0 ? selectedMaterials : undefined,
          category:
            selectedCategories.length > 0
              ? selectedCategories.map((c) => reverseCategoryMap[c] || c)
              : undefined,
          page: currentPage,
        };

        const tasks: Promise<any>[] = [productApi.getAllProducts(filters)];
        if (!initialLoaded) {
          tasks.push(productApi.getFilterOptions());
        }

        const [productsData, filterOptions] = await Promise.all(tasks);
        setProducts(productsData.products || []);
        setTotalPages(productsData.totalPages || 1);
        setTotalProducts(productsData.totalProducts || 0);
        setCurrentPage(productsData.currentPage || 1);

        if (filterOptions) {
          setBrands(filterOptions.brands || []);
          setMaterials(filterOptions.materials || []);
          setCategories(
            (filterOptions.categories || []).map(
              (item: string) => categoryMap[item] || item,
            ),
          );
          setInitialLoaded(true);
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Không thể tải sản phẩm.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    searchTerm,
    sortOrder,
    selectedBrands,
    selectedMaterials,
    selectedCategories,
    currentPage,
    initialLoaded,
  ]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getDisplayedItems = (items: string[], showAll: boolean) =>
    showAll ? items : items.slice(0, INITIAL_DISPLAY_LIMIT);

  const FilterSection = ({
    title,
    items,
    selectedItems,
    showAll,
    onToggleShowAll,
    onItemChange,
    value,
  }: {
    title: string;
    items: string[];
    selectedItems: string[];
    showAll: boolean;
    onToggleShowAll: () => void;
    onItemChange: (item: string) => void;
    value: string;
  }) => {
    const displayedItems = getDisplayedItems(items, showAll);
    const hasMore = items.length > INITIAL_DISPLAY_LIMIT;

    return (
      <AccordionItem
        value={value}
        className="border-b border-white/10 last:border-b-0"
      >
        <AccordionTrigger className="px-3 py-4 font-body text-base font-semibold uppercase tracking-[0.14em] text-white hover:no-underline">
          {title}
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-4 pt-2">
          <div className="space-y-3">
            {displayedItems.map((item) => (
              <div
                key={item}
                className="flex items-center space-x-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
              >
                <Checkbox
                  id={`${value}-${item}`}
                  onCheckedChange={() => onItemChange(item)}
                  checked={selectedItems.includes(item)}
                  className="border-white/20 data-[state=checked]:border-[#BFC3C9] data-[state=checked]:bg-[#BFC3C9] data-[state=checked]:text-[#0F0F10]"
                />
                <Label
                  htmlFor={`${value}-${item}`}
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>
          {hasMore ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShowAll}
              className="mt-3 w-full justify-center"
            >
              {showAll ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Xem thêm
                </>
              )}
            </Button>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="container relative z-10 mx-auto px-4 py-10 md:py-12">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="mb-6 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20"></div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/40">
                  Bộ sưu tập
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20"></div>
              </div>
              <h1 className="font-headline text-4xl uppercase tracking-[0.18em] text-white/95 sm:text-5xl md:text-6xl font-light relative z-10">
                <div
                  className="absolute -top-12 -left-10 md:-left-20 w-12 h-12 md:w-20 md:h-20 rounded-2xl overflow-hidden animate-float-fade shadow-lg border border-white/10"
                  style={{ animationDelay: "0s" }}
                >
                  <img
                    src="/homepage/hero/anh1.jpg"
                    alt="Decor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute top-0 -right-10 md:-right-20 w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden animate-float-fade shadow-lg border border-white/10"
                  style={{ animationDelay: "-1.5s" }}
                >
                  <img
                    src="/homepage/hero/anh2.jpg"
                    alt="Decor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute -bottom-8 left-4 md:left-10 w-8 h-8 md:w-14 md:h-14 rounded-xl overflow-hidden animate-float-fade shadow-lg border border-white/10"
                  style={{ animationDelay: "-3s" }}
                >
                  <img
                    src="/homepage/hero/anh5.jpg"
                    alt="Decor"
                    className="w-full h-full object-cover"
                  />
                </div>
                Khám phá KYRO
              </h1>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="self-start">
              <div className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="border-b border-white/10 px-4 py-4">
                  <h2 className="font-body text-sm font-semibold uppercase tracking-[0.28em] text-white">
                    Bộ lọc
                  </h2>
                </div>
                <Accordion
                  type="multiple"
                  defaultValue={["category", "brand", "material"]}
                >
                  <FilterSection
                    title="Danh mục"
                    items={categories}
                    selectedItems={selectedCategories}
                    showAll={showAllCategories}
                    onToggleShowAll={() =>
                      setShowAllCategories(!showAllCategories)
                    }
                    onItemChange={(item) => {
                      setSelectedCategories((prev) =>
                        prev.includes(item)
                          ? prev.filter((value) => value !== item)
                          : [...prev, item],
                      );
                      setCurrentPage(1);
                    }}
                    value="category"
                  />
                  <FilterSection
                    title="Thương hiệu"
                    items={brands}
                    selectedItems={selectedBrands}
                    showAll={showAllBrands}
                    onToggleShowAll={() => setShowAllBrands(!showAllBrands)}
                    onItemChange={(item) => {
                      setSelectedBrands((prev) =>
                        prev.includes(item)
                          ? prev.filter((value) => value !== item)
                          : [...prev, item],
                      );
                      setCurrentPage(1);
                    }}
                    value="brand"
                  />
                  <FilterSection
                    title="Chất liệu"
                    items={materials}
                    selectedItems={selectedMaterials}
                    showAll={showAllMaterials}
                    onToggleShowAll={() =>
                      setShowAllMaterials(!showAllMaterials)
                    }
                    onItemChange={(item) => {
                      setSelectedMaterials((prev) =>
                        prev.includes(item)
                          ? prev.filter((value) => value !== item)
                          : [...prev, item],
                      );
                      setCurrentPage(1);
                    }}
                    value="material"
                  />
                </Accordion>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-6 rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm sản phẩm..."
                        className="rounded-[0.6rem] pl-11"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                      {loading
                        ? "Đang tải danh mục..."
                        : `${totalProducts} sản phẩm`}
                    </p>
                  </div>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => {
                      setSortOrder(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full xl:w-[240px] rounded-[0.6rem]">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Nổi bật</SelectItem>
                      <SelectItem value="price-asc">
                        Giá: thấp đến cao
                      </SelectItem>
                      <SelectItem value="price-desc">
                        Giá: cao đến thấp
                      </SelectItem>
                      <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error ? (
                <Alert className="rounded-[0.6rem] border-white/10 bg-white/[0.04]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {loading ? (
                <div className="kyro-panel flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                      Đang tải sản phẩm
                    </p>
                  </div>
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="kyro-panel py-24 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-5 text-2xl uppercase tracking-[0.08em] text-white">
                      Không có sản phẩm phù hợp
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Hãy thử từ khóa rộng hơn hoặc đặt lại bộ lọc để tiếp tục
                      khám phá.
                    </p>
                  </div>
                </div>
              )}

              {!loading && totalPages > 1 ? (
                <Pagination className="pt-10">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === page}
                              onClick={(event) => {
                                event.preventDefault();
                                handlePageChange(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopPageInner />
    </Suspense>
  );
}
