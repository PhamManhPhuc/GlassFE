"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReport, setSelectedReport] = useState("sales");

  const reportTypes = [
    {
      id: "sales",
      name: "Báo cáo doanh số",
      description: "Doanh thu và hiệu quả bán hàng",
    },
    {
      id: "products",
      name: "Báo cáo sản phẩm",
      description: "Hiệu suất sản phẩm và tồn kho",
    },
    {
      id: "customers",
      name: "Báo cáo khách hàng",
      description: "Hành vi và phân khúc khách hàng",
    },
    {
      id: "orders",
      name: "Báo cáo đơn hàng",
      description: "Xử lý đơn hàng và giao vận",
    },
  ];

  const periods = [
    { value: "7", label: "7 ngày gần nhất" },
    { value: "30", label: "30 ngày gần nhất" },
    { value: "90", label: "90 ngày gần nhất" },
    { value: "365", label: "1 năm gần nhất" },
  ];

  const realData = {
    sales: {
      totalRevenue: 0, // TODO: Fetch from orders API
      totalOrders: 0, // TODO: Fetch from orders API
      averageOrderValue: 0, // TODO: Calculate from orders API
      topProducts: [], // TODO: Fetch from orders API
    },
    products: {
      totalProducts: 0, // TODO: Fetch from products API
      lowStock: 0, // TODO: Calculate from products API
      outOfStock: 0, // TODO: Calculate from products API
      topSelling: [], // TODO: Fetch from orders API
    },
    customers: {
      totalCustomers: 0, // TODO: Fetch from users API
      newCustomers: 0, // TODO: Fetch from users API
      returningCustomers: 0, // TODO: Fetch from users API
      averageOrderValue: 0, // TODO: Calculate from orders API
    },
    orders: {
      totalOrders: 0, // TODO: Fetch from orders API
      pendingOrders: 0, // TODO: Fetch from orders API
      completedOrders: 0, // TODO: Fetch from orders API
      cancelledOrders: 0, // TODO: Fetch from orders API
    },
  };

  const handleDownload = () => {
    // TODO: Implement actual report generation and download
    console.log(
      `Downloading ${selectedReport} report for ${selectedPeriod} days`
    );
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case "sales":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Tổng doanh thu
                      </p>
                      <p className="text-2xl font-bold">
                        {formatVND(realData.sales.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Tổng đơn hàng
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.sales.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <PieChart className="h-8 w-8 text-accent" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Giá trị đơn hàng TB
                      </p>
                      <p className="text-2xl font-bold">
                        {formatVND(realData.sales.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm doanh thu cao nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realData.sales.topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.orders} đơn hàng
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatVND(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "products":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Tổng sản phẩm
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.products.totalProducts}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Sắp hết hàng
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.products.lowStock}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Hết hàng
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.products.outOfStock}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realData.products.topSelling.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.sales} lượt bán
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatVND(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "customers":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Tổng khách hàng
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.customers.totalCustomers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Khách hàng mới
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.customers.newCustomers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Tổng đơn hàng
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.orders.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Hoàn tất
                      </p>
                      <p className="text-2xl font-bold">
                        {realData.orders.completedOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Chọn loại báo cáo để xem dữ liệu</div>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
            <p className="text-gray-600">
              Tạo và tải xuống các báo cáo kinh doanh
            </p>
          </div>
        </div>

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Cấu hình báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Loại báo cáo
                </label>
                <Select
                  value={selectedReport}
                  onValueChange={setSelectedReport}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Khoảng thời gian
                </label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Tải báo cáo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </AdminLayout>
  );
}
