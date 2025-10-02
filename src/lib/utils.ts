import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Transaction } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'USD' | 'ZWG' = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


export function groupTransactionsByAccount(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((acc, transaction) => {
        const accountId = transaction.bankAccountId;
        if (!acc[accountId]) {
            acc[accountId] = [];
        }
        acc[accountId].push(transaction);
        // Sort by date descending
        acc[accountId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return acc;
    }, {} as Record<string, Transaction[]>);
}
