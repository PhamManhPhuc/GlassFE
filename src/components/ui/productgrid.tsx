"use client";

// 1. Update React import
import React from "react";
import { formatVND } from "@/lib/utils";

// 2. Import your Select component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 3. REMOVE API import - Parent component will handle this
// import * as api from "@/lib/api";

// --- Add TypeScript Interface ---
// 4. Define interface for Product
interface Product {
  id: string | number;
  name: string;
  price: number | string;
  rating: number | string;
}

// 5. Define type for sort options
type SortOrder = "featured" | "price-asc" | "price-desc" | "rating";

// --- End of TypeScript Interface ---

// 6. Define Props for ProductGrid
interface ProductGridProps {
  products: Product[]; // Receive filtered and sorted products from parent
  loading: boolean;
  sortOrder: SortOrder;
  onSortChange: (newValue: SortOrder) => void; // Callback to notify parent of changes
}

// Product Card component (added type for props)
function ProductCard({ product }: { product: Product }) {
  // Safely convert to number for display
  const displayPrice = parseFloat(String(product.price)) || 0;
  const displayRating = parseFloat(String(product.rating)) || 0;

  return (
    <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      {/* Mock product image */}
      <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-400"></div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="mt-2 text-xl font-bold text-gray-900">
          {formatVND(displayPrice)}
        </p>
        <p className="text-sm text-gray-500">
          Rating: {displayRating ? displayRating.toFixed(1) : "N/A"} / 5.0
        </p>
      </div>
    </div>
  );
}

/**
 * Main component - MODIFIED TO RECEIVE PROPS
 */
export default function ProductGrid({
  products,
  loading,
  sortOrder,
  onSortChange,
}: ProductGridProps) {
  // 7. REMOVE ALL STATE, USEEFFECT, USEMEMO
  // const [allProducts, setAllProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState<boolean>(true);
  // const [sortOrder, setSortOrder] = useState<SortOrder>("featured");
  // useEffect(() => { ... });
  // const handleSortChange = (newValue: string) => { ... };
  // const sortedProducts = useMemo<Product[]>(() => { ... });

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-gray-700">
          Showing {products.length} products
        </span>

        <Select
          value={sortOrder} // Use sortOrder from props
          onValueChange={(newValue) => onSortChange(newValue as SortOrder)} // Call function from props
          disabled={loading} // Use loading from props
        >
          <SelectTrigger className="w-[200px] rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* FIX: Use `products` from props */}
          {products.map((product) => (
            <ProductCard key={product.id || product.name} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
