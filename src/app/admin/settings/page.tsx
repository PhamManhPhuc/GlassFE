"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Store, Mail, Bell, Shield, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: "Spectra Specs",
    storeEmail: "admin@spectraspecs.com",
    storePhone: "+1 (555) 123-4567",
    storeAddress: "123 Main Street, City, State 12345",
    storeDescription: "Stylish Eyewear for Every Vision",
    notifications: {
      newOrders: true,
      lowStock: true,
      customerMessages: false,
      systemUpdates: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: "strong",
    },
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    // In real app, show success toast
  };

  const updateSetting = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".");
      const newSettings = { ...prev };
      // Use `any` for dynamic nested updates to satisfy TS and keep code concise
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...current[keys[i]] };
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
            {/* <p className="text-gray-600">
              Quản lý cài đặt và tùy chọn của cửa hàng
            </p> */}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Thông tin cửa hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Tên cửa hàng</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => updateSetting("storeName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="storeEmail">Email cửa hàng</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => updateSetting("storeEmail", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="storePhone">Số điện thoại cửa hàng</Label>
              <Input
                id="storePhone"
                value={settings.storePhone}
                onChange={(e) => updateSetting("storePhone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storeAddress">Địa chỉ cửa hàng</Label>
              <Input
                id="storeAddress"
                value={settings.storeAddress}
                onChange={(e) => updateSetting("storeAddress", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storeDescription">Mô tả cửa hàng</Label>
              <Textarea
                id="storeDescription"
                value={settings.storeDescription}
                onChange={(e) =>
                  updateSetting("storeDescription", e.target.value)
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="newOrders">Đơn hàng mới</Label>
                <p className="text-sm text-gray-500">
                  Nhận thông báo khi có đơn hàng mới
                </p>
              </div>
              <Switch
                id="newOrders"
                checked={settings.notifications.newOrders}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.newOrders", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lowStock">Cảnh báo sắp hết hàng</Label>
                <p className="text-sm text-gray-500">
                  Nhận thông báo khi sản phẩm sắp hết
                </p>
              </div>
              <Switch
                id="lowStock"
                checked={settings.notifications.lowStock}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.lowStock", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="customerMessages">Tin nhắn khách hàng</Label>
                <p className="text-sm text-gray-500">
                  Nhận thông báo khi khách hàng gửi tin nhắn
                </p>
              </div>
              <Switch
                id="customerMessages"
                checked={settings.notifications.customerMessages}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.customerMessages", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemUpdates">Cập nhật hệ thống</Label>
                <p className="text-sm text-gray-500">
                  Nhận thông báo về cập nhật và bảo trì hệ thống
                </p>
              </div>
              <Switch
                id="systemUpdates"
                checked={settings.notifications.systemUpdates}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.systemUpdates", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Cài đặt bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorAuth">Xác thực hai lớp</Label>
                <p className="text-sm text-gray-500">
                  Tăng thêm một lớp bảo mật cho tài khoản của bạn
                </p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.security.twoFactorAuth}
                onCheckedChange={(checked) =>
                  updateSetting("security.twoFactorAuth", checked)
                }
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Thời gian hết phiên (phút)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  updateSetting(
                    "security.sessionTimeout",
                    parseInt(e.target.value)
                  )
                }
                className="w-32"
              />
            </div>
            <div>
              <Label htmlFor="passwordPolicy">Chính sách mật khẩu</Label>
              <select
                id="passwordPolicy"
                value={settings.security.passwordPolicy}
                onChange={(e) =>
                  updateSetting("security.passwordPolicy", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="basic">Cơ bản (6+ ký tự)</option>
                <option value="medium">Trung bình (8+ ký tự, có số)</option>
                <option value="strong">
                  Mạnh (8+ ký tự, có số và ký hiệu)
                </option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Thông tin liên hệ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email hỗ trợ</Label>
                <Input value="support@spectraspecs.com" disabled />
              </div>
              <div>
                <Label>Số điện thoại hỗ trợ</Label>
                <Input value="+1 (555) 123-4567" disabled />
              </div>
            </div>
            <div className="mt-4">
              <Label>Giờ làm việc</Label>
              <Input value="Monday - Friday: 9:00 AM - 6:00 PM" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
