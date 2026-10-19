import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, pattern = "dd MMM yyyy") {
  if (!date) return "-";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (parsed instanceof Date && isNaN(parsed.getTime())) {
    return "-";
  }
  return format(parsed, pattern);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function getAvailableYears(course: string, attempt: string, groupModule?: string): string[] {
  const current = new Date();
  const currentYear = current.getFullYear();
  const currentMonth = current.getMonth();
  
  let firstValidYear = currentYear;

  const isCseet = course === "cseet" || course.includes("cseet");

  if (isCseet) {
    if (attempt === "june") {
      if (currentMonth > 0) firstValidYear = currentYear + 1;
    } else if (attempt === "oct") {
      if (currentMonth > 4) firstValidYear = currentYear + 1;
    } else if (attempt === "feb") {
      if (currentMonth > 9) firstValidYear = currentYear + 2;
      else firstValidYear = currentYear + 1;
    }
  } else {
    if (attempt === "june") {
      if (groupModule === "both" || groupModule === "full" || !groupModule) {
        if (currentMonth > 10) firstValidYear = currentYear + 2;
        else firstValidYear = currentYear + 1;
      } else {
        if (currentMonth > 0) firstValidYear = currentYear + 1;
      }
    } else if (attempt === "dec") {
      if (groupModule === "both" || groupModule === "full" || !groupModule) {
        if (currentMonth > 4) firstValidYear = currentYear + 1;
      } else {
        if (currentMonth > 6) firstValidYear = currentYear + 1;
      }
    }
  }

  return [firstValidYear, firstValidYear + 1, firstValidYear + 2, firstValidYear + 3].map(String);
}

