import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Transaction } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'USD' | 'ZWG' = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }
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


export function handlePrint(printAreaId: string, title: string) {
    const printContent = document.getElementById(printAreaId);
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
        printWindow.document.write(`<html><head><title>${title}</title>`);
        printWindow.document.write('<link rel="stylesheet" href="https://unpkg.com/tailwindcss@2.2.19/dist/tailwind.min.css" />');
        printWindow.document.write('<style>body { font-family: sans-serif; -webkit-print-color-adjust: exact; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; } tr:nth-child(even) {background-color: #f9f9f9;} </style>');
        printWindow.document.write('</head><body class="p-8">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    }
}
