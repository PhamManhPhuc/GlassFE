import type { Product } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ProductFilters {
  shape?: string | string[];
  color?: string | string[];
  face_suitable?: string | string[];
  brand?: string | string[];
  material?: string | string[];
  category?: string | string[];
  search?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  page?: number;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error occurred');
  }
}

function mapApiProduct(raw: any): Product {
  const dimensions = {
    width: Number(raw?.width ?? raw?.dimensions?.width ?? 0),
    length: Number(raw?.length ?? raw?.dimensions?.length ?? 0),
    lensWidth: Number(raw?.lens_width ?? raw?.dimensions?.lensWidth ?? 0),
    lensHeight: Number(raw?.lens_height ?? raw?.dimensions?.lensHeight ?? 0),
    bridge: Number(raw?.bridge ?? raw?.dimensions?.bridge ?? 0),
  };

  const sanitizeName = (v: any): string => {
    const s = typeof v === 'string' ? v : '';
    return /^\d+$/.test(s) ? '' : s;
  };

  const shapeName = sanitizeName(raw?.Shape?.name ?? (typeof raw?.shape === 'string' ? raw?.shape : ''));
  const brandName = sanitizeName(raw?.Brand?.name ?? (typeof raw?.brand === 'string' ? raw?.brand : ''));
  const materialName = sanitizeName(raw?.Material?.name ?? (typeof raw?.material === 'string' ? raw?.material : ''));
  const categoryName = sanitizeName(raw?.Category?.name ?? (typeof raw?.category === 'string' ? raw?.category : ''));

  const firstUrl = raw?.ProductVariations?.[0]?.ProductImages?.[0]?.pic_url;

  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ''),
    subtitle: typeof raw?.subtitle === 'string' ? raw.subtitle : undefined,
    price: Number(raw?.price ?? 0),
    picUrl: firstUrl ? [firstUrl] : (Array.isArray(raw?.picUrl) ? raw.picUrl : []),
    description: String(raw?.description ?? ''),
    size: typeof raw?.size === 'string' ? raw.size : undefined,
    dimensions,
    // Prefer associated names; fallback to provided name strings; avoid numeric ids as strings
    shape: shapeName,
    brand: brandName,
    material: materialName,
    category: categoryName,
    rating: Number(raw?.rating ?? 0),
    isFeatured: Boolean(raw?.isFeatured ?? false),
    color: String(raw?.color ?? ''),
    face_suitable: typeof raw?.face_suitable === 'string' ? raw.face_suitable : '',
    features: Array.isArray(raw?.ProductFeatures ?? raw?.features)
      ? (raw.ProductFeatures ?? raw.features).map((f: any) => ({
          id: Number(f?.id ?? 0) || undefined,
          name: String(f?.name ?? f?.title ?? ''),
          img: typeof f?.img === 'string' ? f.img : typeof f?.image === 'string' ? f.image : undefined,
        })).filter((f: any) => f.name.length > 0)
      : undefined,
    modelUrl:
      typeof raw?.url === 'string' && raw.url.trim()
        ? raw.url.trim()
        : typeof raw?.modelUrl === 'string' && raw.modelUrl.trim()
        ? raw.modelUrl.trim()
        : typeof raw?.['3DUrl'] === 'string' && raw['3DUrl'].trim()
        ? raw['3DUrl'].trim()
        : undefined,
    tryOnUrl:
      typeof raw?.tryOnUrl === 'string' && raw.tryOnUrl.trim()
        ? raw.tryOnUrl.trim()
        : undefined,
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
  } as Product;
}

export const productApi = {
  // Get all products with optional filters
  async getAllProducts(filters?: ProductFilters): Promise<{
  products: Product[];
  totalPages: number;
  totalProducts: number;
  currentPage: number;
}> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    const appendParam = (key: string, val: string | string[] | undefined) => {
      if (Array.isArray(val)) val.forEach(v => params.append(key, v));
      else if (val) params.append(key, val);
    };

    appendParam('shape', filters?.shape);
    appendParam('color', filters?.color);
    appendParam('face_suitable', filters?.face_suitable);
    appendParam('brand', filters?.brand);
    appendParam('material', filters?.material);
    appendParam('category', filters?.category);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    if (filters?.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';

    const resjson = await fetchApi<any>(endpoint);

    const res = resjson.data;

    //console.log('API Response:', res); // Debug log

    const arr = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.products)
      ? res.data.products
      : Array.isArray(res?.products)
      ? res.products
      : [];
    const mapped: Product[] = (arr as any[]).map(mapApiProduct);
    console.log(res.totalPages);
    return {
      products: mapped,
      totalPages: Number(res?.totalPages ?? 1),
      totalProducts: Number(res?.totalProducts ?? 0),
      currentPage: Number(res?.currentPage ?? 1),
    };
  },

  // Get product by ID
  async getProductById(id: number): Promise<Product> {
    const res = await fetchApi<any>(`/api/products/${id}`);
    const obj = res?.data && !Array.isArray(res.data) ? res.data : res?.product ?? res;
    let product = mapApiProduct(obj);
    try {
      const urls = await productApi.getProductImages(id);
      if (Array.isArray(urls) && urls.length > 0) {
        product.picUrl = urls;
      }
    } catch (_) {
      // ignore image loading errors
    }
    // If brand/shape/material strings are empty, try to derive from variants' nested Product associations
    if (!product.brand || !product.shape || !product.material) {
      try {
        const variants = await productApi.getProductVariants(id);
        const first = variants[0] as any;
        const nested = (first as any)?.Product;
        // In our mapping, getProductVariants returns flattened fields; but backend sample shows nested Product
        // If API client later returns flattened, this block will have no effect
        // Safely patch product names when available
        if (!product.brand && nested?.Brand?.name) product.brand = nested.Brand.name;
        if (!product.shape && nested?.Shape?.name) product.shape = nested.Shape.name;
        if (!product.material && nested?.Material?.name) product.material = nested.Material.name;
      } catch {
        // ignore
      }
    }
    return product;
  },

  // Get products by shape
  async getProductsByShape(shapeName: string): Promise<Product[]> {
    const res = await fetchApi<any>(`/api/products/shape/${encodeURIComponent(shapeName)}`);
    const arr = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.products)
      ? res.products
      : Array.isArray(res?.data?.products)
      ? res.data.products
      : [];
    const mapped: Product[] = (arr as any[]).map(mapApiProduct);
    // Optionally enrich first image for nicer related cards
    const withImages = await Promise.all(
      mapped.map(async (p) => {
        try {
          const urls = await productApi.getProductImages(p.id);
          const firstOnly = Array.isArray(urls) && urls.length ? [urls[0]] : p.picUrl;
          return { ...p, picUrl: firstOnly };
        } catch {
          return p;
        }
      })
    );
    return withImages;
  },

  // Get all product images
  async getProductImages(productId: number): Promise<string[]> {
    const res = await fetchApi<any>(`/api/products/${productId}/images`);
    const images = Array.isArray(res)
      ? res
      : Array.isArray(res?.images)
      ? res.images
      : Array.isArray(res?.data?.images)
      ? res.data.images
      : [];
    return images
      .slice()
      .sort((a: any, b: any) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0))
      .map((img: any) => String(img?.pic_url))
      .filter((url: string) => !!url);
  },

  async updateReview(userId: number, productId: number, rating: number, reviewText: string): Promise<void> {
    await fetchApi(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({userId, rating, reviewText }),
    } as any);
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    const res = await fetchApi<any>('/api/products?featured=true');
    const arr = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.products)
      ? res.data.products
      : Array.isArray(res?.products)
      ? res.products
      : [];
    const mapped: Product[] = (arr as any[]).map(mapApiProduct);
    // Enrich with images
    const withImages = await Promise.all(
      mapped.map(async (p) => {
        try {
          const urls = await productApi.getProductImages(p.id);
          return { ...p, picUrl: Array.isArray(urls) && urls.length ? urls : p.picUrl };
        } catch {
          return p;
        }
      })
    );
    return withImages;
  },

  // Get filter options (shapes, brands, materials, colors, categories)
  async getFilterOptions(): Promise<{
    shapes: string[];
    brands: string[];
    materials: string[];
    colors: string[];
    categories: string[];
  }> {
    const [brandsRes, shapesRes, colorsRes, materialsRes, categoriesRes] = await Promise.all([
      fetchApi<any>('/api/brands'),
      fetchApi<any>('/api/shapes'),
      fetchApi<any>('/api/colors'),
      fetchApi<any>('/api/materials'),
      fetchApi<any>('/api/categories'),
    ]);

    const toNames = (input: any): string[] => {
      const arr = Array.isArray(input)
        ? input
        : Array.isArray(input?.data)
        ? input.data
        : [];
      return arr
        .map((x: any) => (typeof x === 'string' ? x : x?.name))
        .filter((s: any) => typeof s === 'string' && s.length > 0);
    };

    return {
      brands: toNames(brandsRes),
      shapes: toNames(shapesRes),
      colors: toNames(colorsRes),
      materials: toNames(materialsRes),
      categories: toNames(categoriesRes),
    };
  },

  // New explicit lookup helpers using the new backend endpoints
  async getBrands(): Promise<string[]> {
    const res = await fetchApi<any>('/api/brands');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter((s: any) => typeof s === 'string' && s.length > 0);
  },
  async getShapes(): Promise<string[]> {
    const res = await fetchApi<any>('/api/shapes');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter((s: any) => typeof s === 'string' && s.length > 0);
  },
  async getMaterials(): Promise<string[]> {
    const res = await fetchApi<any>('/api/materials');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter((s: any) => typeof s === 'string' && s.length > 0);
  },

  // Admin methods that return objects with ID and name for dropdowns
  async adminGetBrands(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetchApi<any>('/api/brands');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => ({
      id: Number(x?.id ?? 0),
      name: typeof x === 'string' ? x : String(x?.name ?? ''),
    })).filter((item: any) => item.id > 0 && item.name.length > 0);
  },
  async adminGetShapes(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetchApi<any>('/api/shapes');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => ({
      id: Number(x?.id ?? 0),
      name: typeof x === 'string' ? x : String(x?.name ?? ''),
    })).filter((item: any) => item.id > 0 && item.name.length > 0);
  },
  async adminGetMaterials(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetchApi<any>('/api/materials');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => ({
      id: Number(x?.id ?? 0),
      name: typeof x === 'string' ? x : String(x?.name ?? ''),
    })).filter((item: any) => item.id > 0 && item.name.length > 0);
  },
  async adminGetCategories(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetchApi<any>('/api/categories');
    const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return arr.map((x: any) => ({
      id: Number(x?.id ?? 0),
      name: typeof x === 'string' ? x : String(x?.name ?? ''),
    })).filter((item: any) => item.id > 0 && item.name.length > 0);
  },

  // Get features (new endpoint)
  async getFeatures(): Promise<Array<{ id?: number; name: string; img?: string }>> {
    const res = await fetchApi<any>('/api/features');
    const arr = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];
    return (arr as any[])
      .map((f) => ({ id: f?.id, name: f?.name ?? f?.title ?? '', img: f?.img ?? f?.image }))
      .filter((f) => typeof f.name === 'string' && f.name.length > 0);
  },

  // Cart
  async getCart(userId: number): Promise<import('./types').CartItem[]> {
    const res = await fetchApi<any>(`/api/users/${userId}/cart`);
    const data = res?.data ?? res;
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((it: any) => {
      const v = it?.ProductVariation ?? it?.productVariation ?? {};
      const p = v?.Product ?? v?.product ?? {};
      const images = Array.isArray(v?.ProductImages) ? v.ProductImages : [];
      const firstUrl = images.length ? String(images[0]?.pic_url) : undefined;
      const product: Product = {
        id: Number(p?.id ?? 0),
        name: String(p?.name ?? ''),
        price: Number(v?.price ?? p?.price ?? 0),
        picUrl: firstUrl ? [firstUrl] : [],
        description: String(p?.description ?? ''),
        dimensions: {
          width: Number(p?.width ?? 0),
          length: Number(p?.length ?? 0),
          lensWidth: Number(p?.lens_width ?? 0),
          lensHeight: Number(p?.lens_height ?? 0),
          bridge: Number(p?.bridge ?? 0),
        },
        shape: String(p?.Shape?.name ?? p?.shape ?? ''),
        brand: String(p?.Brand?.name ?? p?.brand ?? ''),
        material: String(p?.Material?.name ?? p?.material ?? ''),
        rating: Number(p?.rating ?? 0),
        isFeatured: Boolean(p?.isFeatured ?? false),
        color: String(v?.Color?.name ?? ''),
      } as Product;
      return { product, quantity: Number(it?.quantity ?? 1) };
    });
  },
  async addCartItem(userId: number, productVariationId: number, quantity: number = 1): Promise<void> {
    await fetchApi(`/api/users/${userId}/cart/items`, {
      method: 'POST',
      body: JSON.stringify({ productVariationId, quantity }),
    } as any);
  },
  async clearCart(userId: number): Promise<void> {
    await fetchApi(`/api/users/${userId}/cart`, { method: 'DELETE' } as any);
  },

  // Orders
  async createOrderFromCart(userId: number, payload: {
    province?: string;
    district?: string;
    ward?: string;
    address?: string;
    delivery_date?: string; // ISO date string
    shipping_cost?: number | string;
    note?: string;
    use_product_price?: boolean; // Flag to indicate using product price instead of variant price
  }): Promise<any> {
    return fetchApi<any>(`/api/users/${userId}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    } as any);
  },
  async getOrders(userId: number): Promise<any[]> {
    const res = await fetchApi<any>(`/api/users/${userId}/orders`);
    return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  },
  async getOrderDetail(userId: number, orderId: number): Promise<any> {
    const res = await fetchApi<any>(`/api/users/${userId}/orders/${orderId}`);
    return res?.data ?? res;
  },
  // Admin products
  async adminListProducts(): Promise<any[]> {
    const res = await fetchApi<any>(`/api/admin/products`);
    const arr = Array.isArray(res?.products) ? res.products : (Array.isArray(res) ? res : []);
    // Normalize price to a number in case backend returns string or nested object
    return (arr as any[]).map((p) => ({
      ...p,
      price: Number(p?.price ?? p?.Product?.price ?? 0),
    }));
  },
  async adminGetProduct(id: number): Promise<any> {
    const res = await fetchApi<any>(`/api/admin/products/${id}`);
    return res?.product ?? res?.data ?? res;
  },
  async adminCreateProduct(payload: any): Promise<any> {
    return fetchApi<any>(`/api/admin/products`, { method: 'POST', body: JSON.stringify(payload) } as any);
  },
  async adminUpdateProduct(id: number, payload: any): Promise<any> {
    return fetchApi<any>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) } as any);
  },
  async adminSetProductFeatures(id: number, features: Array<{ name?: string; img?: string; title?: string; image?: string }>): Promise<any> {
    return fetchApi<any>(`/api/admin/products/${id}/features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    } as any);
  },
  async adminToggleProductActive(id: number): Promise<{ active: boolean }> {
    return fetchApi<{ active: boolean }>(`/api/admin/products/${id}/toggle-active`, { method: 'PATCH' } as any);
  },
  async adminAddVariationImage(
    variationId: number,
    payload: { pic_url: string; display_order?: number }
  ): Promise<any> {
    return fetchApi<any>(`/api/admin/product-variations/${variationId}/images`, {
      method: 'POST',
      body: JSON.stringify(payload),
    } as any);
  },
  async adminUpdateProductImage(
    id: number,
    payload: { pic_url?: string; display_order?: number }
  ): Promise<any> {
    return fetchApi<any>(`/api/admin/product-images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    } as any);
  },
  async adminDeleteProductImage(id: number): Promise<void> {
    await fetchApi(`/api/admin/product-images/${id}`, { method: 'DELETE' } as any);
  },

  // Favorites
  async getFavoriteProducts(userId: number): Promise<Product[]> {
    const res = await fetchApi<any>(`/api/users/${userId}/favorites`);
    const arr = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    const productsRaw = arr.map((fav: any) => fav?.Product ?? fav?.product ?? fav);
    const mapped: Product[] = productsRaw.filter(Boolean).map(mapApiProduct);
    const withImages = await Promise.all(
      mapped.map(async (p) => {
        try {
          const urls = await productApi.getProductImages(p.id);
          const firstOnly = Array.isArray(urls) && urls.length ? [urls[0]] : p.picUrl;
          return { ...p, picUrl: firstOnly };
        } catch {
          return p;
        }
      })
    );
    return withImages;
  },
  async getFavoriteProductIds(userId: number): Promise<number[]> {
    const res = await fetchApi<any>(`/api/users/${userId}/favorites`);
    const arr = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return arr
      .map((fav: any) => Number(fav?.product_id ?? fav?.Product?.id ?? fav?.product?.id))
      .filter((id: any) => Number.isFinite(id));
  },
  async addFavorite(userId: number, productId: number): Promise<void> {
    await fetchApi(`/api/favorites`, {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    } as any);
  },
  async removeFavorite(userId: number, productId: number): Promise<void> {
    await fetchApi(`/api/users/${userId}/favorites/${productId}`, { method: 'DELETE' } as any);
  },

  // Get product variants (colors, images, price per variant)
  async getProductVariants(productId: number): Promise<import('./types').ProductVariant[]> {
    const res = await fetchApi<any>(`/api/products/${productId}/variants`);
    const variants = Array.isArray(res)
      ? res
      : Array.isArray(res?.data?.variants)
      ? res.data.variants
      : Array.isArray(res?.variants)
      ? res.variants
      : [];

    return (variants as any[]).map((v) => {
      const images = Array.isArray(v?.ProductImages) ? v.ProductImages : [];
      const sortedUrls = images
        .slice()
        .sort((a: any, b: any) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0))
        .map((img: any) => String(img?.pic_url))
        .filter((url: string) => !!url);

      return {
        id: Number(v?.id ?? 0),
        productId: Number(v?.product_id ?? productId),
        colorId: Number(v?.color_id ?? v?.Color?.id ?? 0),
        colorName: String(v?.Color?.name ?? ''),
        colorHex: v?.Color?.hex_code,
        sku: String(v?.sku ?? ''),
        price: Number(v?.price ?? 0),
        stockQuantity: Number(v?.stock_quantity ?? 0),
        images: sortedUrls,
      };
    });
  },
};

// Analytics API
export const analyticsApi = {
  // Get dashboard metrics
  async getDashboardMetrics(): Promise<{
    summary: {
      [key: string]: {
        value: number;
        growth_rate: number;
        previous_value: number;
      };
    };
    monthly_revenue: Array<{
      period: string;
      month_name: string;
      revenue: number;
    }>;
    top_products: Array<{
      rank: number;
      product_name: string;
      sales: number;
      revenue: number;
    }>;
  }> {
    const res = await fetchApi<any>('/api/admin/analytics/dashboard');
    return res?.data ?? res;
  },

  // Update analytics data
  async updateAnalytics(): Promise<{ success: boolean; message: string }> {
    const res = await fetchApi<any>('/api/admin/analytics/update', {
      method: 'POST',
    });
    return res?.data ?? res;
  },
};

// Admin Orders API
export const adminOrdersApi = {
  // Get all orders
  async getAllOrders(): Promise<Array<{
    id: number;
    user_id: number;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    delivery_date?: string;
    shipping_cost?: number;
    note?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    item_count?: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
    order_items?: Array<{
      id: number;
      quantity: number;
      price_at_purchase: number;
      product_variation_id: number;
      product_variation?: {
        id: number;
        price: number;
        product?: {
          id: number;
          name: string;
        };
        color?: {
          name: string;
        };
      };
    }>;
  }>> {
    const res = await fetchApi<any>('/api/admin/orders');
    const orders = res?.data ?? res;
    
    
    // Transform backend data to match frontend expectations
    return orders.map((order: any) => {
      // Handle different possible user data structures
      let userData: { id: number; name: string; email: string } | undefined = undefined;
      if (order.User) {
        userData = {
          id: order.User.id,
          name: order.User.fullname || order.User.fullName || order.User.name || 'Unknown',
          email: order.User.email || 'N/A'
        };
      } else if (order.user) {
        userData = {
          id: order.user.id,
          name: order.user.fullname || order.user.fullName || order.user.name || 'Unknown',
          email: order.user.email || 'N/A'
        };
      } else if (order.username) {
        userData = {
          id: order.user_id || order.userId || 0,
          name: order.username,
          email: order.user_email || order.email || 'N/A'
        };
      }

      // Handle different possible order items structures
      let orderItems = [];
      if (order.OrderItems) {
        orderItems = order.OrderItems.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
          product_variation_id: item.product_variation_id,
          product_variation: item.ProductVariation ? {
            id: item.ProductVariation.id,
            price: item.ProductVariation.price,
            product: item.ProductVariation.Product ? {
              id: item.ProductVariation.Product.id,
              name: item.ProductVariation.Product.name
            } : undefined
          } : undefined
        }));
      } else if (order.order_items) {
        orderItems = order.order_items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
          product_variation_id: item.product_variation_id,
          product_variation: item.product_variation ? {
            id: item.product_variation.id,
            price: item.product_variation.price,
            product: item.product_variation.product ? {
              id: item.product_variation.product.id,
              name: item.product_variation.product.name
            } : undefined
          } : undefined
        }));
      }

      return {
        id: order.id,
        user_id: order.user_id || order.userId,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.createdAt || order.created_at,
        updated_at: order.updatedAt || order.updated_at,
        delivery_date: order.delivery_date,
        shipping_cost: order.shipping_cost,
        note: order.note,
        address: order.address,
        province: order.province,
        district: order.district,
        ward: order.ward,
        item_count: order.item_count,
        user: userData,
        order_items: orderItems
      };
    });
  },

  // Get order by ID
  async getOrderById(id: number): Promise<{
    id: number;
    user_id: number;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    delivery_date?: string;
    shipping_cost?: number;
    note?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    item_count?: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
    order_items?: Array<{
      id: number;
      quantity: number;
      price_at_purchase: number;
      product_variation_id: number;
      product_variation?: {
        id: number;
        price: number;
        product?: {
          id: number;
          name: string;
        };
        color?: {
          name: string;
        };
      };
    }>;
  }> {
    const res = await fetchApi<any>(`/api/admin/orders/${id}`);
    const order = res?.data ?? res;
    
    
    // Handle different possible user data structures
    let userData: { id: number; name: string; email: string } | undefined = undefined;
    if (order.User) {
      userData = {
        id: order.User.id,
        name: order.User.fullname || order.User.fullName || order.User.name || 'Unknown',
        email: order.User.email || 'N/A'
      };
    } else if (order.user) {
      userData = {
        id: order.user.id,
        name: order.user.fullname || order.user.fullName || order.user.name || 'Unknown',
        email: order.user.email || 'N/A'
      };
    } else if (order.username) {
      userData = {
        id: order.user_id || order.userId || 0,
        name: order.username,
        email: order.user_email || order.email || 'N/A'
      };
    }

    // Handle different possible order items structures
    let orderItems = [];
    if (order.OrderItems) {
      orderItems = order.OrderItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
        product_variation_id: item.product_variation_id,
        product_variation: item.ProductVariation ? {
          id: item.ProductVariation.id,
          price: item.ProductVariation.price,
          product: item.ProductVariation.Product ? {
            id: item.ProductVariation.Product.id,
            name: item.ProductVariation.Product.name
          } : undefined
        } : undefined
      }));
    } else if (order.order_items) {
      orderItems = order.order_items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
        product_variation_id: item.product_variation_id,
        product_variation: item.product_variation ? {
          id: item.product_variation.id,
          price: item.product_variation.price,
          product: item.product_variation.product ? {
            id: item.product_variation.product.id,
            name: item.product_variation.product.name
          } : undefined
        } : undefined
      }));
    }
    
    // Transform backend data to match frontend expectations
    return {
      id: order.id,
      user_id: order.user_id || order.userId,
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.createdAt || order.created_at,
      updated_at: order.updatedAt || order.updated_at,
      delivery_date: order.delivery_date,
      shipping_cost: order.shipping_cost,
      note: order.note,
      address: order.address,
      province: order.province,
      district: order.district,
      ward: order.ward,
      item_count: order.item_count,
      user: userData,
      order_items: orderItems
    };
  },

  // Update order status
  async updateOrderStatus(id: number, status: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchApi<any>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return res?.data ?? res;
  },

  // Cancel order
  async cancelOrder(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetchApi<any>(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

};

export const authApi = {
  /**
   * Đăng nhập người dùng
   * @param email Email của người dùng
   * @param password Mật khẩu của người dùng
   * @returns Thông tin người dùng nếu thành công
   */

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ id: number; name: string; email: string; roleID?: number }> {
    const res = await fetchApi<any>("/api/register", {
      method: "POST",
      body: JSON.stringify({ fullname:name, email, password }),
    } as any);

    const user = res?.data?.user ?? res?.user ?? res?.data ?? res;

    if (!user || typeof user.id !== "number" || (typeof user.name !== "string" && typeof user.fullname !== "string")) {
      throw new ApiError(
        404,
        "User data not found or in invalid format from API"
      );
    }

    return {
      id: Number(user.id),
      name: String(user.name ?? user.fullname ?? ""),
      email: String(user.email ?? email),
      roleID: user.roleID
        ? Number(user.roleID)
        : user.role_id
        ? Number(user.role_id)
        : undefined,
    };
  },

  async login(
    email: string,
    password: string
  ): Promise<{ id: number; name: string; email: string; roleID?: number }> {
    const res = await fetchApi<any>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    } as any);

    // Backend có thể trả về dữ liệu user trong nhiều cấu trúc khác nhau
    // Ví dụ: { data: { user: {...} } } hoặc { user: {...} } hoặc chỉ { ... }
    const user = res?.data?.user ?? res?.user ?? res?.data ?? res;

    // Kiểm tra tính hợp lệ của dữ liệu user trả về
    if (!user || typeof user.id !== "number" || (typeof user.name !== "string" && typeof user.fullname !== "string")) {
      throw new ApiError(
        404,
        "User data not found or in invalid format from API"
      );
    }

    // Trả về đối tượng user đã được chuẩn hóa
    return {
      id: Number(user.id),
      name: String(user.name ?? user.fullname ?? ""), // Ưu tiên 'name', sau đó 'fullname'
      email: String(user.email ?? email),
      roleID: user.roleID
        ? Number(user.roleID)
        : user.role_id
        ? Number(user.role_id)
        : undefined, // Xử lý cả 'roleID' và 'role_id'
    };
  },
};

export { ApiError };
