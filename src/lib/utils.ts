import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = 'VND') {
  if (amount === null || amount === undefined) {
    amount = 0;
  }
  // Hiển thị 'đ' thay vì '₫'
  const formatted = new Intl.NumberFormat('vi-VN', { currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  return `${formatted} đ`;
}

export function formatCurrencyShort(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    amount = 0;
  }

  if (Math.abs(amount) >= 1_000_000) {
    const value = (amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    return `${value} triệu`;
  }
  
  return formatCurrency(amount);
}