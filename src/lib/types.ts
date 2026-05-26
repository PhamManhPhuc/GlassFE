export interface ArModelFitMetadata {
  offset?: {
    x?: number;
    y?: number;
    z?: number;
  };
  rotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  scaleMultiplier?: number;
}

export interface Product {
  id: number;
  name: string;
  subtitle?: string;
  price: number;
  picUrl: string[]; // Array of images, the first one is the cover image
  description: string;
  size?: string;
  dimensions: {
    width: number; // frame width (mm)
    length: number; // frame length (mm)
    lensWidth: number; // lens width (mm)
    lensHeight: number; // lens height (mm)
    bridge: number; // nose bridge (mm)
  };
  shape: string; // Made flexible to handle any shape from API
  brand: string; // Made flexible to handle any brand from API
  material: string; // Made flexible to handle any material from API
  rating: number;
  isFeatured: boolean;
  color: string; // Color: Red, black, black blue, purple, ...
  face_suitable: string; // "Round face", "Square face", "Oval face", "Long face", "Diamond face", "Heart face"
  features?: Array<{ id?: number; name: string; img?: string }>;
  reviews: Review[];
  category?: string;
  modelUrl?: string; // 3D model URL from backend
  tryOnUrl?: string; // optimised AR try-on model URL from backend
  arModelFit?: ArModelFitMetadata; // Optional AR fit metadata per model
  /** Khi backend gửi — chọn viewer AR: kính vs khuyên tai vs vòng cổ */
  arTryOnCategory?: "glasses" | "earrings" | "necklaces";
}

export type Review = {
  id?: number; // or any type returned by API
  User: {
    id: number;
    fullname: string;
  };
  rating: number;
  review_text: string;
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductFilters {
  shape?: string;
  color?: string;
  brand?: string;
  material?: string;
  search?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
}

export interface ProductVariant {
  id: number;
  productId: number;
  colorId: number;
  colorName: string;
  colorHex?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  images: string[]; // sorted by display_order
}
