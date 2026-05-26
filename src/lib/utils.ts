import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVND(amount: number | string): string {
  const num = Number(String(amount).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return String(amount);
  return num.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
}
