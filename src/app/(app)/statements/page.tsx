
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import { formatCurrency, handlePrint } from '@/lib/utils';
import type { BankAccount, Transaction, Payment, StatementCategory } from '@/lib/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Printer } from 'lucide-react';

type CategorizedTransaction = {
  id: string;
  date: string;
  amount: number;
  account: string;
  category: StatementCategory;
  description: string;
};

function Cashbook() {
  const { bankAccounts, transactions, payments } = useAppContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const { incomingData, outgoingData, categories } = useMemo(() => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    const getAccountDetails = (accountId: string) => {
        const acc = bankAccounts.find(a => a.id === accountId);
        return acc ? `${acc.bankName} ${acc.accountNumber}` : 'Unknown';
    }

    const getPaymentCategory = (paymentId?: string): StatementCategory | 'other' => {
        if (!paymentId) return 'other';
        const payment = payments.find(p => p.id === paymentId);
        return payment ? payment.feeType : 'other';
    }
    
    const getExpenseCategory = (description: string): StatementCategory => {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('salary') || lowerDesc.includes('salaries')) return 'salaries';
        if (lowerDesc.includes('stationery')) return 'stationery';
        if (lowerDesc.includes('utility') || lowerDesc.includes('utilities') || lowerDesc.includes('bill')) return 'utilities';
        if (lowerDesc.includes('maintenance') || lowerDesc.includes('repair')) return 'maintenance';
        return 'other';
    }

    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const matchesDate = txDate >= startDate && txDate <= endDate;
      const matchesAccount = !selectedAccount || tx.bankAccountId === selectedAccount;
      const matchesCurrency = !selectedCurrency || tx.currency === selectedCurrency;
      return matchesDate && matchesAccount && matchesCurrency;
    });

    const categorized = filteredTransactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: tx.originalAmount,
        account: getAccountDetails(tx.bankAccountId),
        type: tx.type,
        category: tx.type === 'incoming' ? getPaymentCategory(tx.relatedPaymentId) : getExpenseCategory(tx.description),
        description: tx.description,
    }));

    const incomingData: CategorizedTransaction[] = categorized.filter(tx => tx.type === 'incoming');
    const outgoingData: CategorizedTransaction[] = categorized.filter(tx => tx.type === 'outgoing');

    const allCategories = [ ...new Set([...incomingData.map(d => d.category), ...outgoingData.map(d => d.category)])];

    return { incomingData, outgoingData, categories: allCategories };
  }, [
    selectedYear,
    selectedMonth,
    selectedAccount,
    selectedCurrency,
    transactions,
    payments,
    bankAccounts,
  ]);

  const calculateTotals = (data: CategorizedTransaction[]) => {
      const totals: Record<string, number> = { total: 0 };
      categories.forEach(category => { totals[category] = 0; });
      data.forEach(entry => {
          totals.total += entry.amount;
          if (totals[entry.category] !== undefined) {
              totals[entry.category] += entry.amount;
          }
      });
      return totals;
  };

  const debitTotals = calculateTotals(incomingData);
  const creditTotals = calculateTotals(outgoingData);
  const currency = selectedCurrency || (bankAccounts.find(b => b.id === selectedAccount)?.currency) || 'USD';


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Monthly Cashbook</CardTitle>
                <CardDescription>
                A detailed view of all incoming (Debit) and outgoing (Credit) transactions for the selected period.
                </CardDescription>
            </div>
             <Button variant="outline" onClick={() => handlePrint('cashbook-print', 'Monthly Cashbook')}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="mr-2 font-semibold text-sm">Year:</label>
            <Select value={String(selectedYear)} onValueChange={e => setSelectedYear(parseInt(e))}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                        {new Date().getFullYear() - i}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mr-2 font-semibold text-sm">Month:</label>
             <Select value={String(selectedMonth)} onValueChange={e => setSelectedMonth(parseInt(e))}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mr-2 font-semibold text-sm">Account:</label>
            <Select value={selectedAccount} onValueChange={e => setSelectedAccount(e)}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Accounts</SelectItem>
                    {bankAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                            {acc.bankName} - {acc.accountNumber} ({acc.currency})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div>
            <label className="mr-2 font-semibold text-sm">Currency:</label>
            <Select value={selectedCurrency} onValueChange={e => setSelectedCurrency(e)}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div id="cashbook-print" className="overflow-x-auto">
             <h1 className="text-xl font-bold mb-2">Cashbook for {format(new Date(selectedYear, selectedMonth -1), 'MMMM yyyy')}</h1>
            <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader>
                    <TableRow>
                        <TableHead colSpan={categories.length + 3} className="text-left px-4 py-2 bg-green-100 text-green-800">Debit</TableHead>
                        <TableHead colSpan={categories.length + 3} className="text-left px-4 py-2 bg-red-100 text-red-800">Credit</TableHead>
                    </TableRow>
                    <TableRow>
                        <TableHead className="px-2 py-2">Date</TableHead>
                        <TableHead className="px-2 py-2">Details</TableHead>
                        <TableHead className="px-2 py-2 text-right">Total</TableHead>
                        {categories.map((category) => ( <TableHead key={`debit-cat-${category}`} className="px-2 py-2 text-right capitalize">{category}</TableHead> ))}
                        
                        <TableHead className="px-2 py-2 border-l">Date</TableHead>
                        <TableHead className="px-2 py-2">Details</TableHead>
                        <TableHead className="px-2 py-2 text-right">Total</TableHead>
                        {categories.map((category) => ( <TableHead key={`credit-cat-${category}`} className="px-2 py-2 text-right capitalize">{category}</TableHead> ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {Array.from({ length: Math.max(incomingData.length, outgoingData.length) }).map((_, index) => (
                        <TableRow key={index}>
                            {/* Debit Side */}
                            {incomingData[index] ? (
                                <>
                                    <TableCell className="px-2 py-2 text-nowrap">{format(new Date(incomingData[index].date), 'dd-MMM')}</TableCell>
                                    <TableCell className="px-2 py-2">{incomingData[index].description}</TableCell>
                                    <TableCell className="px-2 py-2 text-right font-medium">{formatCurrency(incomingData[index].amount, currency as 'USD' | 'ZWG')}</TableCell>
                                    {categories.map((category) => (
                                        <TableCell key={`debit-val-${index}-${category}`} className="px-2 py-2 text-right">
                                            {incomingData[index].category === category ? formatCurrency(incomingData[index].amount, currency as 'USD' | 'ZWG') : ''}
                                        </TableCell>
                                    ))}
                                </>
                            ) : ( <TableCell colSpan={categories.length + 3}></TableCell> )}
                            {/* Credit Side */}
                             {outgoingData[index] ? (
                                <>
                                    <TableCell className="px-2 py-2 border-l text-nowrap">{format(new Date(outgoingData[index].date), 'dd-MMM')}</TableCell>
                                    <TableCell className="px-2 py-2">{outgoingData[index].description}</TableCell>
                                    <TableCell className="px-2 py-2 text-right font-medium">{formatCurrency(outgoingData[index].amount, currency as 'USD' | 'ZWG')}</TableCell>
                                    {categories.map((category) => (
                                        <TableCell key={`credit-val-${index}-${category}`} className="px-2 py-2 text-right">
                                            {outgoingData[index].category === category ? formatCurrency(outgoingData[index].amount, currency as 'USD' | 'ZWG') : ''}
                                        </TableCell>
                                    ))}
                                </>
                            ) : ( <TableCell colSpan={categories.length + 3}></TableCell> )}
                        </TableRow>
                     ))}
                     {/* Totals Row */}
                     <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={2} className="px-2 py-2 text-right">Totals</TableCell>
                        <TableCell className="px-2 py-2 text-right">{formatCurrency(debitTotals.total, currency as 'USD' | 'ZWG')}</TableCell>
                        {categories.map((category) => (
                            <TableCell key={`debit-total-${category}`} className="px-2 py-2 text-right">{formatCurrency(debitTotals[category], currency as 'USD' | 'ZWG')}</TableCell>
                        ))}

                        <TableCell colSpan={2} className="px-2 py-2 text-right border-l">Totals</TableCell>
                        <TableCell className="px-2 py-2 text-right">{formatCurrency(creditTotals.total, currency as 'USD' | 'ZWG')}</TableCell>
                        {categories.map((category) => (
                            <TableCell key={`credit-total-${category}`} className="px-2 py-2 text-right">{formatCurrency(creditTotals[category], currency as 'USD' | 'ZWG')}</TableCell>
                        ))}
                     </TableRow>
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}


export default function StatementsPage() {
    // For now, we only have the Cashbook. We can add more statements later.
    return <Cashbook />;
}
