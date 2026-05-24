"use client";

import { createContext, useState, useEffect, ReactNode } from "react";
import { productApi } from "@/lib/api";
import type { Product, CartItem } from "@/lib/types";

interface AppContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    opts?: { productVariationId?: number; quantity?: number }
  ) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  user: { id: number; name: string; roleID?: number } | null;
  login: (id: number, name: string, roleID?: number) => void;
  register: (id: number, name: string, roleID?: number) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isUserLoaded: boolean;
}

export const AppContext = createContext<AppContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  favorites: [],
  toggleFavorite: () => {},
  user: null,
  login: () => {}, // CHANGE: (id, name, roleID) => {} is fine, but () => {} is enough for default value
  register: () => {},
  logout: () => {},
  isAdmin: () => false,
  isUserLoaded: false,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState<{
    id: number; // CHANGE: Add 'id'
    name: string;
    roleID?: number;
  } | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    const storedFavorites = localStorage.getItem("favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Mark user data as loaded
    setIsUserLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync favorites from backend when user is present
  useEffect(() => {
    if (!user?.id) return; // Only sync when user is logged in and has an ID

    (async () => {
      try {
        const ids = await productApi.getFavoriteProductIds(user.id);
        if (Array.isArray(ids) && ids.length >= 0) setFavorites(ids);
      } catch {
        // ignore backend errors; fallback to local favorites
      }
    })();
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Load cart from backend when user is available
  useEffect(() => {
    if (!user?.id) return; // Only load when user is logged in and has an ID

    (async () => {
      try {
        const serverCart = await productApi.getCart(user.id);
        if (Array.isArray(serverCart)) {
          setCart(serverCart);
        }
      } catch {
        // ignore
      }
    })();
  }, [user]);

  const addToCart = (
    product: Product,
    opts?: { productVariationId?: number; quantity?: number }
  ) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Backend sync (best-effort)
    try {
      const userId = user?.id;
      const productVariationId = opts?.productVariationId;
      const quantity = opts?.quantity ?? 1;
      if (userId && productVariationId) {
        productApi
          .addCartItem(userId, productVariationId, quantity)
          .catch(() => {});
      } else if (!userId) {
        console.log("User not logged in, cart item stored locally only");
      } else {
        console.error("Product variation ID is required");
      }
    } catch (error) {
      console.error("Error adding to cart", error);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    try {
      const userId = user?.id;
      if (userId) {
        productApi.clearCart(userId).catch(() => {});
      }
    } catch {}
  };

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const userId = user?.id;
      const isFav = prev.includes(productId);
      // Fire-and-forget to backend
      if (userId) {
        if (isFav) {
          productApi.removeFavorite(userId, productId).catch(() => {});
          return prev.filter((id) => id !== productId);
        } else {
          productApi.addFavorite(userId, productId).catch(() => {});
          return [...prev, productId];
        }
      }
      // If no user, just toggle locally
      return isFav
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
    });
  };

  // CHANGE: Add 'id' to the login function
  const login = (id: number, name: string, roleID?: number) => {
    setUser({ id, name, roleID });
  };

  const register = (id: number, name: string, roleID?: number) => {
    setUser({ id, name, roleID });
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roleID === 1;
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        favorites,
        toggleFavorite,
        user,
        login,
        register,
        logout,
        isAdmin,
        isUserLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
