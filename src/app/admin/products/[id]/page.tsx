"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { productApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  ArrowLeft,
  Package,
  DollarSign,
  Tag,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";

interface ProductFeature {
  id?: number;
  name: string;
  img?: string;
}

interface ProductImage {
  id?: number;
  pic_url: string;
  display_order: number;
}

interface ProductVariation {
  id: number;
  Color: { name: string; hex_code: string };
  ProductImages: ProductImage[];
}

interface Product {
  id: number;
  name: string;
  subtitle?: string;
  price: number;
  description?: string;
  size?: string;
  Brand?: { id: number; name: string };
  Shape?: { id: number; name: string };
  Material?: { id: number; name: string };
  ProductFeatures?: ProductFeature[];
  ProductVariations?: ProductVariation[];
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminEditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const productId = Number(id);

  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [shapes, setShapes] = useState<Array<{ id: number; name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: number; name: string }>>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    price: "",
    description: "",
    size: "",
    brand_id: "",
    shape_id: "",
    material_id: "",
  });
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<ProductFeature[]>([]);
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

  useEffect(() => {
    (async () => {
      try {
        const list = await productApi.getFeatures();
        setAvailableFeatures(list);
      } catch {
        // Ignore feature loading errors for now.
      }
    })();
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.adminGetProduct(productId);
      setProduct(data);
      setForm({
        name: data?.name ?? "",
        subtitle: data?.subtitle ?? "",
        price: String(data?.price ?? ""),
        description: data?.description ?? "",
        size: data?.size ?? "",
        brand_id: data?.Brand?.id ? String(data.Brand.id) : "",
        shape_id: data?.Shape?.id ? String(data.Shape.id) : "",
        material_id: data?.Material?.id ? String(data.Material.id) : "",
      });

      const rawFeatures = Array.isArray(data?.ProductFeatures)
        ? data.ProductFeatures
        : Array.isArray(data?.features)
          ? data.features
          : [];

      setFeatures(
        rawFeatures
          .map((feature: any) => ({
            id: feature.id,
            name: feature.name ?? feature.title,
            img: feature.img ?? feature.image,
          }))
          .filter((feature: ProductFeature) => feature.name)
      );
    } catch {
      setError("Khong the tai san pham.");
    } finally {
      setLoading(false);
    }
  };

  const getVariationById = (variationId: number) =>
    product?.ProductVariations?.find((item) => item.id === variationId);

  const updateVariationImageValue = (variationId: number, nextUrl: string) => {
    setProduct((current) => {
      if (!current?.ProductVariations) return current;

      return {
        ...current,
        ProductVariations: current.ProductVariations.map((variation) => {
          if (variation.id !== variationId) return variation;

          const nextImages = variation.ProductImages ? [...variation.ProductImages] : [];
          if (nextImages.length === 0) {
            nextImages.push({
              pic_url: nextUrl,
              display_order: 1,
            });
          } else {
            nextImages[0] = {
              ...nextImages[0],
              pic_url: nextUrl,
            };
          }

          return {
            ...variation,
            ProductImages: nextImages,
          };
        }),
      };
    });
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

  const handleSaveVariationImage = async (variationId: number) => {
    const currentVariation = getVariationById(variationId);
    const firstImage = currentVariation?.ProductImages?.[0];
    const url = firstImage?.pic_url?.trim();

    if (!url) {
      setError("Vui long nhap URL anh hop le.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (firstImage?.id) {
        await productApi.adminUpdateProductImage(firstImage.id, {
          pic_url: url,
        });
      } else {
        await productApi.adminAddVariationImage(variationId, {
          pic_url: url,
          display_order: 1,
        });
      }

      setSuccess("Da cap nhat anh bien the.");
      await loadProduct();
    } catch {
      setError("Khong the cap nhat anh bien the.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariationImage = async (variationId: number) => {
    const firstImage = getVariationById(variationId)?.ProductImages?.[0];

    if (!firstImage?.id) {
      setError("Khong co anh hop le de xoa.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await productApi.adminDeleteProductImage(firstImage.id);
      setSuccess("Da xoa anh.");
      await loadProduct();
    } catch {
      setError("Khong the xoa anh.");
    } finally {
      setSaving(false);
    }
  };

  const swapVariationImageOrder = async (
    currentVariationId: number,
    direction: "up" | "down"
  ) => {
    if (!product?.ProductVariations?.length) {
      setError("Khong tim thay bien the de sap xep.");
      return;
    }

    const currentIndex = product.ProductVariations.findIndex(
      (item) => item.id === currentVariationId
    );
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= product.ProductVariations.length
    ) {
      setError("Khong the di chuyen anh theo huong nay.");
      return;
    }

    const currentImage = product.ProductVariations[currentIndex]?.ProductImages?.[0];
    const targetImage = product.ProductVariations[targetIndex]?.ProductImages?.[0];

    if (
      !currentImage?.id ||
      !targetImage?.id ||
      currentImage.display_order == null ||
      targetImage.display_order == null
    ) {
      setError("Can hai anh chinh hop le de doi thu tu.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await Promise.all([
        productApi.adminUpdateProductImage(currentImage.id, {
          display_order: targetImage.display_order,
        }),
        productApi.adminUpdateProductImage(targetImage.id, {
          display_order: currentImage.display_order,
        }),
      ]);
      setSuccess("Da cap nhat thu tu anh.");
      await loadProduct();
    } catch {
      setError("Khong the sap xep lai anh.");
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lai san pham
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chinh sua san pham #{productId}
            </h1>
            <p className="text-gray-600">
              Cap nhat thong tin san pham va cac bien the
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-gray-500">Dang tai san pham...</div>
          </div>
        ) : (
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Thong tin co ban</TabsTrigger>
              <TabsTrigger value="features">Tinh nang</TabsTrigger>
              <TabsTrigger value="variations">Bien the</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Thong tin san pham
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ten san pham *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Nhap ten san pham"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Phu de</Label>
                      <Input
                        id="subtitle"
                        value={form.subtitle}
                        onChange={(e) =>
                          setForm({ ...form, subtitle: e.target.value })
                        }
                        placeholder="Phu de ngan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Gia *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
                    <Label htmlFor="description">Mo ta</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Nhap mo ta san pham"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="size">Kich thuoc</Label>
                      <Input
                        id="size"
                        value={form.size}
                        onChange={(e) =>
                          setForm({ ...form, size: e.target.value })
                        }
                        placeholder="Vi du: Nho/Vua hoac 52-18-140"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand_id">Thuong hieu</Label>
                      <select
                        id="brand_id"
                        value={form.brand_id}
                        onChange={(e) =>
                          setForm({ ...form, brand_id: e.target.value })
                        }
                        className="w-full rounded border px-2 py-1"
                      >
                        <option value="">Chon thuong hieu</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shape_id">Dang</Label>
                      <select
                        id="shape_id"
                        value={form.shape_id}
                        onChange={(e) =>
                          setForm({ ...form, shape_id: e.target.value })
                        }
                        className="w-full rounded border px-2 py-1"
                      >
                        <option value="">Chon dang</option>
                        {shapes.map((shape) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material_id">Chat lieu</Label>
                      <select
                        id="material_id"
                        value={form.material_id}
                        onChange={(e) =>
                          setForm({ ...form, material_id: e.target.value })
                        }
                        className="w-full rounded border px-2 py-1"
                      >
                        <option value="">Chon chat lieu</option>
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
                      {saving ? "Dang luu..." : "Luu thay doi"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/products")}
                    >
                      Huy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tinh nang san pham
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 items-end gap-3 md:grid-cols-3"
                      >
                        <div className="space-y-2">
                          <Label>Ten</Label>
                          <Input
                            value={feature.name}
                            onChange={(e) => {
                              const next = features.slice();
                              next[index] = {
                                ...next[index],
                                name: e.target.value,
                              };
                              setFeatures(next);
                            }}
                            placeholder="Lop phu chong tray"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL hinh anh</Label>
                          <Input
                            value={feature.img ?? ""}
                            onChange={(e) => {
                              const next = features.slice();
                              next[index] = {
                                ...next[index],
                                img: e.target.value,
                              };
                              setFeatures(next);
                            }}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() =>
                              setFeatures(features.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Xoa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Label>Tinh nang co san</Label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {availableFeatures.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          Khong co tinh nang nao
                        </div>
                      ) : (
                        availableFeatures.map((availableFeature) => {
                          const isSelected = features.some((item) =>
                            availableFeature.id !== undefined && item.id !== undefined
                              ? item.id === availableFeature.id
                              : item.name === availableFeature.name
                          );

                          return (
                            <label
                              key={availableFeature.id ?? availableFeature.name}
                              className="flex cursor-pointer items-center gap-2 rounded-md border p-2"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(value) => {
                                  const checked = Boolean(value);
                                  if (checked && !isSelected) {
                                    setFeatures([
                                      ...features,
                                      {
                                        id: availableFeature.id,
                                        name: availableFeature.name,
                                        img: availableFeature.img,
                                      },
                                    ]);
                                    return;
                                  }

                                  if (!checked && isSelected) {
                                    setFeatures(
                                      features.filter((item) =>
                                        availableFeature.id !== undefined &&
                                        item.id !== undefined
                                          ? item.id !== availableFeature.id
                                          : item.name !== availableFeature.name
                                      )
                                    );
                                  }
                                }}
                              />
                              {availableFeature.img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={availableFeature.img}
                                  alt={availableFeature.name}
                                  className="h-6 w-6 object-contain"
                                />
                              ) : null}
                              <div className="text-sm">{availableFeature.name}</div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFeatures([...features, { name: "", img: "" }])
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" /> Them tinh nang
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setSaving(true);
                          setError(null);
                          setSuccess(null);
                          await productApi.adminSetProductFeatures(
                            productId,
                            features
                          );
                          setSuccess("Cap nhat tinh nang thanh cong.");
                          await loadProduct();
                        } catch {
                          setError("Khong the cap nhat tinh nang.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      <Save className="mr-1 h-4 w-4" /> Luu tinh nang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Bien the san pham va hinh anh
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product?.ProductVariations &&
                  product.ProductVariations.length > 0 ? (
                    <div className="space-y-4">
                      {product.ProductVariations.map((variation) => (
                        <div key={variation.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-full border"
                                style={{
                                  backgroundColor: variation.Color?.hex_code,
                                }}
                              />
                              <div>
                                <p className="font-medium">
                                  {variation.Color?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {variation.ProductImages?.length || 0} hinh anh
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="URL hinh anh"
                                value={variation.ProductImages?.[0]?.pic_url ?? ""}
                                onChange={(e) =>
                                  updateVariationImageValue(
                                    variation.id,
                                    e.target.value
                                  )
                                }
                                className="w-64 rounded border px-2 py-1"
                              />

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSaveVariationImage(variation.id)
                                }
                                disabled={saving}
                              >
                                Luu anh
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  swapVariationImageOrder(variation.id, "up")
                                }
                                disabled={saving}
                              >
                                Chuyen len
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  swapVariationImageOrder(variation.id, "down")
                                }
                                disabled={saving}
                              >
                                Chuyen xuong
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteVariationImage(variation.id)
                                }
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Palette className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p>Khong tim thay bien the cho san pham nay.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
