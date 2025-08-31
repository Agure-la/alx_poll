import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isExpired(date: Date): boolean {
  return new Date() > date;
}

// Poll utilities
export function calculateTotalVotes(options: { votes: number }[]): number {
  return options.reduce((total, option) => total + option.votes, 0);
}

export function calculatePercentage(votes: number, total: number): number {
  return total === 0 ? 0 : Math.round((votes / total) * 100);
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// String utilities
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}