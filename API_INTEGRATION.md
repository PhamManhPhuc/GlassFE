# API Integration Guide

This document describes how the GlassesStore application has been updated to use backend API calls instead of local data.

## Changes Made

### 1. API Service Layer (`src/lib/api.ts`)

- Created a comprehensive API service with functions for all product endpoints
- Includes error handling and type safety
- Supports filtering, sorting, and search functionality

### 2. Updated Components

- **Shop Page** (`src/app/shop/page.tsx`): Now fetches products and filter options from API
- **Product Detail Page** (`src/app/shop/[id]/page.tsx`): Loads individual products and related products from API
- **Featured Products** (`src/components/homepage/FeaturedProducts.tsx`): Fetches featured products from API

### 3. Type Updates (`src/lib/types.ts`)

- Made Product interface more flexible to handle API responses
- Added ProductFilters interface for API filtering

### 4. Local Data Removal (`src/lib/products.ts`)

- Removed all local product data
- Kept legacy constants for reference

## API Endpoints Required

Your backend should implement these endpoints:

```
GET /api/products
- Query params: search, shape, color, brand, material, sortBy, featured
- Returns: Array of Product objects

GET /api/products/:id
- Returns: Single Product object

GET /api/products/:shapeName
- Returns: Array of Product objects filtered by shape

GET /api/products/color/:colorName
- Returns: Array of Product objects filtered by color

GET /api/products/:productId/images
- Returns: Array of image URLs

GET /api/products/filters
- Returns: Object with shapes, brands, materials, colors arrays
```

## Environment Configuration

Set the following environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Features

- **Loading States**: All components show loading indicators while fetching data
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Filtering**: Supports filtering by shape, color, brand, material, and search
- **Sorting**: Supports sorting by featured, price, and rating
- **Responsive**: Maintains responsive design with loading states

## Migration Notes

- All local product data has been removed
- Components now use async data loading
- Error boundaries and loading states have been added
- The application gracefully handles API failures

## Testing

To test the integration:

1. Start your backend server on the configured port
2. Set the `NEXT_PUBLIC_API_URL` environment variable
3. Run the Next.js application
4. Verify that products load from the API instead of local data
