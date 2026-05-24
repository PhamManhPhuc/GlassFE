"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingCart,
  Eye,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { adminOrdersApi, ApiError } from "@/lib/api";

interface Order {
  id: number;
  user_id: number;
  total_amount: number | string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  shipping_cost?: number | string;
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
    price_at_purchase: number | string;
    product_variation_id: number;
    product_variation?: {
      id: number;
      price: number | string;
      product?: {
        id: number;
        name: string;
      };
      color?: {
        name: string;
      };
    };
  }>;
}

const ORDERS_PER_PAGE = 15;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await adminOrdersApi.getAllOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to load orders:", err);
      if (err instanceof ApiError) {
        setError(`Failed to load orders: ${err.message}`);
      } else {
        setError("Failed to load orders data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await adminOrdersApi.updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      if (err instanceof ApiError) {
        setError(`Failed to update order status: ${err.message}`);
      } else {
        setError("Failed to update order status. Please try again.");
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;

    try {
      setUpdatingStatus(orderId);
      await adminOrdersApi.cancelOrder(orderId);
      await loadOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      if (err instanceof ApiError) {
        setError(`Failed to cancel order: ${err.message}`);
      } else {
        setError("Failed to cancel order. Please try again.");
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter(
          (order) => order.status.toLowerCase() === filter.toLowerCase(),
        );

  const totalPageCount = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const pagedOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPageCount));
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status.toLowerCase() === "pending").length,
    processing: orders.filter((o) => o.status.toLowerCase() === "processing")
      .length,
    shipped: orders.filter((o) => o.status.toLowerCase() === "shipped").length,
    completed: orders.filter((o) => o.status.toLowerCase() === "completed")
      .length,
    cancelled: orders.filter((o) => o.status.toLowerCase() === "cancelled")
      .length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalItems = (order: Order) => {
    return (
      order.item_count ||
      order.order_items?.reduce((total, item) => total + item.quantity, 0) ||
      0
    );
  };

  const formatAmount = (amount: number | string) => {
    const numAmount =
      typeof amount === "string" ? parseFloat(amount) : Number(amount);
    return Number.isNaN(numAmount)
      ? "0đ"
      : numAmount.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <div className="text-lg text-gray-500">Đang tải đơn hàng...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng</h1>
            <p className="text-gray-600">
              Quản lý đơn hàng và tiến trình xử lý
            </p>
          </div>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status} ({count})
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Đơn hàng ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/10">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-left">
                    <th className="w-[8%] px-4 py-4 font-medium text-[#d9dde3]">
                      Mã đơn
                    </th>
                    <th className="w-[14%] px-4 py-4 font-medium text-[#d9dde3]">
                      Khách hàng
                    </th>
                    <th className="w-[20%] px-4 py-4 font-medium text-[#d9dde3]">
                      Email
                    </th>
                    <th className="w-[10%] px-4 py-4 font-medium text-[#d9dde3]">
                      Số món
                    </th>
                    <th className="w-[12%] px-4 py-4 font-medium text-[#d9dde3]">
                      Thành tiền
                    </th>
                    <th className="w-[16%] px-4 py-4 font-medium text-[#d9dde3]">
                      Trạng thái
                    </th>
                    <th className="w-[8%] px-4 py-4 font-medium text-[#d9dde3]">
                      Ngày
                    </th>
                    <th className="w-[8%] px-4 py-4 font-medium text-[#d9dde3]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-white/10 last:border-0 hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-4 align-top">
                        <span className="font-medium text-white">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium text-white">
                          {order.user?.name || "Không rõ"}
                        </div>
                      </td>
                      <td className="truncate px-4 py-4 align-top text-[#bfc3c9]">
                        {order.user?.email || "Không có"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[#eef2f6]">
                          {getTotalItems(order)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="inline-flex items-center gap-1 rounded-full border border-[#ff9b53]/20 bg-[rgba(255,155,83,0.08)] px-3 py-1 text-[#fff1e3]">
                          <span className="font-medium text-white">
                            {formatAmount(order.total_amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusUpdate(order.id, value)
                          }
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger className="h-8 w-full min-w-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Chờ xử lý</SelectItem>
                            <SelectItem value="processing">Đang xử lý</SelectItem>
                            <SelectItem value="shipped">Đã gửi hàng</SelectItem>
                            <SelectItem value="completed">Hoàn tất</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-[#bfc3c9]">
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 px-0"
                            onClick={() =>
                              window.open(`/admin/orders/${order.id}`, "_blank")
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {order.status.toLowerCase() !== "cancelled" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 px-0"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={updatingStatus === order.id}
                            >
                              {updatingStatus === order.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>

          {totalPageCount > 1 ? (
            <CardFooter className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-500">
                Hiển thị <strong>{Math.min(startIndex + 1, filteredOrders.length)}</strong>
                {" - "}
                <strong>{Math.min(endIndex, filteredOrders.length)}</strong>
                {" / "}
                <strong>{filteredOrders.length}</strong> đơn hàng
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={
                    currentPage === totalPageCount || totalPageCount === 0
                  }
                >
                  Sau
                </Button>
              </div>
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </AdminLayout>
  );
}
