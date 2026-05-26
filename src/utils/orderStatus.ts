const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đã gửi hàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export function getOrderStatusLabel(status: string) {
  if (!status?.trim()) return "—";
  const key = status.trim().toLowerCase();
  return ORDER_STATUS_LABELS[key] ?? status;
}
