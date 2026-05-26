"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { productApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Package } from "lucide-react";

const ADMIN_NATIVE_SELECT_CLASS =
  "w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-white";

export default function AdminEditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const productId = Number(id);

  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [shapes, setShapes] = useState<Array<{ id: number; name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: number; name: string }>>([]);
  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    price: "",
    description: "",
    size: "",
    brand_id: "",
    shape_id: "",
    material_id: "",
    url3d: "",
    tryOnUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [brandsList, shapesList, materialsList] = await Promise.all([
          productApi.adminGetBrands(),
          productApi.adminGetShapes(),
          productApi.adminGetMaterials(),
        ]);
        setBrands(brandsList);
        setShapes(shapesList);
        setMaterials(materialsList);
      } catch {
        // Ignore lookup loading errors for now.
      }
    })();
  }, []);

  useEffect(() => {
    if (!productId) return;
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.adminGetProduct(productId);
      setForm({
        name: data?.name ?? "",
        subtitle: data?.subtitle ?? "",
        price: String(data?.price ?? ""),
        description: data?.description ?? "",
        size: data?.size ?? "",
        brand_id: data?.Brand?.id ? String(data.Brand.id) : "",
        shape_id: data?.Shape?.id ? String(data.Shape.id) : "",
        material_id: data?.Material?.id ? String(data.Material.id) : "",
        url3d: data?.url3d ?? "",
        tryOnUrl: data?.tryOnUrl ?? "",
      });

    } catch {
      setError("Khong the tai san pham.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await productApi.adminUpdateProduct(productId, {
        name: form.name,
        subtitle: form.subtitle,
        price: Number(form.price),
        description: form.description,
        size: form.size,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        shape_id: form.shape_id ? Number(form.shape_id) : null,
        material_id: form.material_id ? Number(form.material_id) : null,
        url3d: form.url3d || null,
        tryOnUrl: form.tryOnUrl || null,
      });

      setSuccess("Cap nhat san pham thanh cong.");
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch {
      setError("Khong the luu san pham.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-gray-600 shadow-none hover:bg-transparent hover:text-gray-900"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại sản phẩm
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chỉnh sửa sản phẩm #{productId}
            </h1>
            {/* <p className="text-gray-600">
              Cập nhật thông tin sản phẩm và các biến thể
            </p> */}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-gray-500">Dang tai san pham...</div>
          </div>
        ) : (
              <Card className="admin-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Thông tin sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên sản phẩm *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Phụ đề</Label>
                      <Input
                        id="subtitle"
                        value={form.subtitle}
                        onChange={(e) =>
                          setForm({ ...form, subtitle: e.target.value })
                        }
                        placeholder="Phụ đề ngắn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Giá *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                          đ
                        </span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                          }
                          placeholder="0"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Nhập mô tả sản phẩm"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="url3d">URL 3D</Label>
                      <Input
                        id="url3d"
                        value={form.url3d}
                        onChange={(e) =>
                          setForm({ ...form, url3d: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tryOnUrl">URL thử kính (Try-On)</Label>
                      <Input
                        id="tryOnUrl"
                        value={form.tryOnUrl}
                        onChange={(e) =>
                          setForm({ ...form, tryOnUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="size">Kích thước</Label>
                      <Input
                        id="size"
                        value={form.size}
                        onChange={(e) =>
                          setForm({ ...form, size: e.target.value })
                        }
                        placeholder="Ví dụ: Nhỏ/Vừa hoặc 52-18-140"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand_id">Thương hiệu</Label>
                      <select
                        id="brand_id"
                        value={form.brand_id}
                        onChange={(e) =>
                          setForm({ ...form, brand_id: e.target.value })
                        }
                        className={ADMIN_NATIVE_SELECT_CLASS}
                      >
                        <option value="">Chọn thương hiệu</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shape_id">Dáng</Label>
                      <select
                        id="shape_id"
                        value={form.shape_id}
                        onChange={(e) =>
                          setForm({ ...form, shape_id: e.target.value })
                        }
                        className={ADMIN_NATIVE_SELECT_CLASS}
                      >
                        <option value="">Chọn dáng</option>
                        {shapes.map((shape) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material_id">Chất liệu</Label>
                      <select
                        id="material_id"
                        value={form.material_id}
                        onChange={(e) =>
                          setForm({ ...form, material_id: e.target.value })
                        }
                        className={ADMIN_NATIVE_SELECT_CLASS}
                      >
                        <option value="">Chọn chất liệu</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                      <p className="text-sm text-green-600">{success}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/products")}
                    >
                      Hủy
                    </Button>
                  </div>
                </CardContent>
              </Card>
        )}
      </div>
    </AdminLayout>
  );
}
