"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { productApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, DollarSign, Plus } from "lucide-react";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    price: "",
    description: "",
  });
  const [size, setSize] = useState("");
  const [brand_id, setBrandId] = useState("");
  const [shape_id, setShapeId] = useState("");
  const [material_id, setMaterialId] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [brandsList, shapesList, materialsList] = await Promise.all([
          productApi.getBrands(),
          productApi.getShapes(),
          productApi.getMaterials(),
        ]);
        setBrands(brandsList);
        setShapes(shapesList);
        setMaterials(materialsList);
      } catch {
        // ignore load errors for now
      }
    })();
    (async () => {
      try {
        const list = await productApi.getFeatures();
        setAvailableFeatures(list);
      } catch {
        // ignore load errors for now
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.price) {
      setError("Tên và giá là bắt buộc");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload: any = {
        name: form.name,
        subtitle: form.subtitle || null,
        price: Number(form.price),
        description: form.description || null,
        size,
        brand_id,
        shape_id,
        material_id,
        features,
      };
      await productApi.adminCreateProduct(payload);
      setSuccess("Tạo sản phẩm thành công!");
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (e) {
      setError("Không thể tạo sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products")}
          >
            {" "}
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại sản phẩm
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sản phẩm mới</h1>
            <p className="text-gray-600">Tạo sản phẩm mới cho cửa hàng của bạn</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="pl-10"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="size">Kích thước</Label>
                <Input
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Ví dụ: Nhỏ/Vừa hoặc 52-18-140"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_id">Thương hiệu</Label>
                <select
                  id="brand_id"
                  value={brand_id}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shape_id">Dáng</Label>
                <select
                  id="shape_id"
                  value={shape_id}
                  onChange={(e) => setShapeId(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Chọn dáng</option>
                  {shapes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_id">Chất liệu</Label>
                <select
                  id="material_id"
                  value={material_id}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Chọn chất liệu</option>
                  {materials.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Features selection */}
            <div className="space-y-3">
              <Label>Tính năng đã chọn</Label>
              <div className="flex gap-2 flex-wrap">
                {features.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Chưa chọn tính năng nào
                  </div>
                ) : (
                  features.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 border rounded-md p-2"
                    >
                      {f.img ? (
                        <img
                          src={f.img}
                          alt={f.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : null}
                      <div className="text-sm">{f.name}</div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setFeatures(features.filter((_, i) => i !== idx))
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Label className="pt-2">Tính năng có sẵn</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {availableFeatures.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Không có tính năng nào
                  </div>
                ) : (
                  availableFeatures.map((af) => {
                    const isSelected = features.some((x) =>
                      af.id !== undefined && x.id !== undefined
                        ? x.id === af.id
                        : x.name === af.name
                    );
                    return (
                      <label
                        key={af.id ?? af.name}
                        className="flex items-center gap-2 border rounded-md p-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(v) => {
                            const truthy = Boolean(v);
                            if (truthy) {
                              if (!isSelected)
                                setFeatures([
                                  ...features,
                                  { id: af.id, name: af.name, img: af.img },
                                ]);
                            } else {
                              if (isSelected)
                                setFeatures(
                                  features.filter((x) =>
                                    af.id !== undefined && x.id !== undefined
                                      ? x.id !== af.id
                                      : x.name !== af.name
                                  )
                                );
                            }
                          }}
                        />
                        {af.img ? (
                          <img
                            src={af.img}
                            alt={af.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : null}
                        <div className="text-sm">{af.name}</div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleCreate} disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                {saving ? "Đang tạo..." : "Tạo sản phẩm"}
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
      </div>
    </AdminLayout>
  );
}
