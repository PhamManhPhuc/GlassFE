"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { productApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Pencil,
  Search,
  Filter,
  Eye,
  Package,
  DollarSign,
  Power,
  PowerOff,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  active: boolean;
  Brand?: { id: number; name: string };
  Shape?: { id: number; name: string };
  Material?: { id: number; name: string };
  ProductVariations?: Array<{
    id: number;
    Color: { name: string; hex_code: string };
    ProductImages: Array<{ pic_url: string }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [filteredItems, setFilteredItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [items, searchTerm, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.adminListProducts();
      const processedData = Array.isArray(data) ? data : [];
      setItems(processedData);
      setFilteredItems(processedData);
    } catch (e) {
      console.error("Error loading products:", e);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Brand?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Shape?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "created":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    setFilteredItems(filtered);
  };

  const handleToggleActive = async (id: number) => {
    try {
      const result = await productApi.adminToggleProductActive(id);

      const updateProductStatus = (product: Product) => {
        if (Number(product?.id) === id) {
          return { ...product, active: result.product.active };
        }

        return product;
      };

      setItems((prevItems) => prevItems.map(updateProductStatus));
      setFilteredItems((prevFilteredItems) =>
        prevFilteredItems.map(updateProductStatus),
      );
    } catch (toggleError) {
      console.error("Error in handleToggleActive:", toggleError);
      setError("Không thể thay đổi trạng thái sản phẩm");
    }
  };

  const promptToggleActive = (product: Product) => {
    setProductToToggle(product);
    setIsDialogOpen(true);
  };

  const confirmToggleActive = () => {
    if (productToToggle) {
      handleToggleActive(Number(productToToggle.id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sản phẩm</h1>
            <p className="text-gray-600">Quản lý kho sản phẩm của bạn</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Sản phẩm mới
            </Link>
          </Button>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(197,202,210,0.12),rgba(96,102,112,0.08))]">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm sản phẩm theo tên, thương hiệu hoặc dáng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "price" | "created")
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white"
                >
                  <option value="name">Sắp xếp theo tên</option>
                  <option value="price">Sắp xếp theo giá</option>
                  <option value="created">Sắp xếp theo ngày tạo</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  <Filter className="mr-1 h-4 w-4" />
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-gray-500">Đang tải sản phẩm...</div>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sản phẩm ({filteredItems.length}/{items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.24)]">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04] text-left">
                      <th className="w-[25%] px-3 py-4 font-medium text-[#d9dde3]">
                        Sản phẩm
                      </th>
                      <th className="w-[12%] px-3 py-4 font-medium text-[#d9dde3]">
                        Thương hiệu
                      </th>
                      <th className="w-[11%] px-3 py-4 font-medium text-[#d9dde3]">
                        Dáng
                      </th>
                      <th className="w-[12%] px-3 py-4 font-medium text-[#d9dde3]">
                        Giá
                      </th>
                      <th className="w-[11%] px-3 py-4 font-medium text-[#d9dde3]">
                        Trạng thái
                      </th>
                      <th className="w-[10%] px-3 py-4 font-medium text-[#d9dde3]">
                        Biến thể
                      </th>
                      <th className="w-[12%] px-3 py-4 font-medium text-[#d9dde3]">
                        Ngày tạo
                      </th>
                      <th className="w-[8%] px-3 py-4 font-medium text-center text-[#d9dde3]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-white/10 last:border-0 hover:bg-white/[0.04]"
                      >
                        <td className="px-3 py-4 align-top">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-white">
                              {product.name}
                            </div>
                            {product.description ? (
                              <div className="truncate text-xs text-[#bfc3c9]">
                                {product.description}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-top">
                          {product.Brand ? (
                            <span className="block truncate text-[#eef2f6]">
                              {product.Brand.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 align-top">
                          {product.Shape ? (
                            <span className="block truncate text-[#ffd7b7]">
                              {product.Shape.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 align-top">
                          <div className="inline-flex items-center gap-1 rounded-full border border-[#ff9b53]/20 bg-[rgba(255,155,83,0.08)] px-3 py-1 text-[#fff1e3]">
                            <DollarSign className="h-3 w-3 text-[#ffb57a]" />
                            <span className="font-medium text-white">
                              {Number.isFinite(Number(product.price))
                                ? Number(product.price).toFixed(2)
                                : "0.00"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <span
                            className={`block truncate ${
                              product.active !== true
                                ? "text-[#ffe6d0]"
                                : "text-[#c7ccd3]"
                            }`}
                          >
                            {product.active !== true ? "Đang bán" : "Ngừng bán"}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <div className="flex items-center gap-1">
                            {product.ProductVariations?.slice(0, 2).map(
                              (variation) => (
                                <div
                                  key={variation.id}
                                  className="h-3 w-3 rounded-full border border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                                  style={{
                                    backgroundColor: variation.Color?.hex_code,
                                  }}
                                  title={variation.Color?.name}
                                />
                              ),
                            )}
                            {product.ProductVariations &&
                            product.ProductVariations.length > 2 ? (
                              <span className="text-xs text-[#bfc3c9]">
                                +{product.ProductVariations.length - 2}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <div className="truncate text-[#bfc3c9]">
                            {product.createdAt
                              ? new Date(product.createdAt).toLocaleDateString()
                              : "-"}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <div className="flex items-center justify-center gap-1">
                            <Button asChild size="sm" variant="outline" className="h-9 w-9 px-0">
                              <Link href={`/shop/${product.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-9 w-9 px-0">
                              <Link href={`/admin/products/${product.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="h-9 w-9 px-0"
                              variant={
                                product.active !== true
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() => promptToggleActive(product)}
                              title={
                                product.active !== true
                                  ? "Ngừng bán sản phẩm"
                                  : "Kích hoạt sản phẩm"
                              }
                            >
                              {product.active !== true ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredItems.length === 0 ? (
                  <div className="py-10 text-center text-[#bfc3c9]">
                    {searchTerm
                      ? "Không tìm thấy sản phẩm phù hợp với tìm kiếm."
                      : "Không tìm thấy sản phẩm."}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setProductToToggle(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ thay đổi trạng thái của sản phẩm:
              <br />
              <strong className="font-medium">{productToToggle?.name}</strong>
              <br />
              Bạn sắp{" "}
              <strong className="uppercase">
                {productToToggle?.active !== true ? "ngừng bán" : "kích hoạt"}
              </strong>{" "}
              sản phẩm này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
