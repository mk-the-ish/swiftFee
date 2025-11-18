
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
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/app-context';
import { formatCurrency, handlePrint, getExpenseCategory, getPaymentCategory } from '@/lib/utils';
import type { BankAccount, Transaction, Payment, StatementCategory, FeeType } from '@/lib/types';
import { startOfMonth, endOfMonth, format, startOfYear, endOfYear } from 'date-fns';
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
  const [selectedAccount, setSelectedAccount] = useState('all-accounts');
  const [selectedCurrency, setSelectedCurrency] = useState('all-currencies');

  const { incomingData, outgoingData, categories } = useMemo(() => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    const getAccountDetails = (accountId: string) => {
        const acc = bankAccounts.find(a => a.id === accountId);
        return acc ? `${acc.bankName} ${acc.accountNumber}` : 'Unknown';
    }

    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const matchesDate = txDate >= startDate && txDate <= endDate;
      const matchesAccount = selectedAccount === 'all-accounts' || tx.bankAccountId === selectedAccount;
      const matchesCurrency = selectedCurrency === 'all-currencies' || tx.currency === selectedCurrency;
      return matchesDate && matchesAccount && matchesCurrency;
    });

    const categorized = filteredTransactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: tx.originalAmount,
        account: getAccountDetails(tx.bankAccountId),
        type: tx.type,
        category: tx.category,
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
  const currency = selectedCurrency === 'all-currencies' ? 'USD' : selectedCurrency as 'USD' | 'ZWG';


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
                    <SelectItem value="all-accounts">All Accounts</SelectItem>
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
                    <SelectItem value="all-currencies">All</SelectItem>
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

function TrialBalance() {
    const { transactions } = useAppContext();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { balanceArray, totalDebits, totalCredits } = useMemo(() => {
        const startDate = startOfYear(new Date(selectedYear, 0, 1));
        const endDate = endOfYear(new Date(selectedYear, 11, 31));

        const filteredTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
        });

        const balanceMap = new Map<StatementCategory, { debits: number, credits: number }>();

        filteredTransactions.forEach(tx => {
            if (!balanceMap.has(tx.category)) {
                balanceMap.set(tx.category, { debits: 0, credits: 0 });
            }
            const entry = balanceMap.get(tx.category)!;
            if (tx.type === 'outgoing') {
                entry.debits += tx.amount;
            } else {
                entry.credits += tx.amount;
            }
        });

        const balanceArray = Array.from(balanceMap, ([category, balances]) => ({
            category,
            ...balances,
        })).sort((a,b) => a.category.localeCompare(b.category));

        const totalDebits = balanceArray.reduce((sum, item) => sum + item.debits, 0);
        const totalCredits = balanceArray.reduce((sum, item) => sum + item.credits, 0);

        return { balanceArray, totalDebits, totalCredits };
    }, [selectedYear, transactions]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Trial Balance</CardTitle>
                        <CardDescription>A summary of debit and credit balances by category for the selected year.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => handlePrint('trial-balance-print', `Trial Balance for ${selectedYear}`)}>
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
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => (
                                <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                                    {new Date().getFullYear() - i}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div id="trial-balance-print">
                    <h1 className="text-xl font-bold mb-4">Trial Balance for {selectedYear}</h1>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Debits (USD)</TableHead>
                                <TableHead className="text-right">Credits (USD)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {balanceArray.map((item, index) => (
                                <TableRow key={`${item.category}-${index}`}>
                                    <TableCell className="capitalize">{item.category}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.debits)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.credits)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-lg">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">{formatCurrency(totalDebits)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totalCredits)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                    <div className={`mt-6 p-4 rounded-md text-center font-semibold border ${totalDebits.toFixed(2) === totalCredits.toFixed(2) ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                         {totalDebits.toFixed(2) === totalCredits.toFixed(2) ? (
                            <p>✅ The trial balance is in agreement! Debits equal Credits.</p>
                        ) : (
                            <p>⚠️ The trial balance is out of balance. Debits do not equal Credits.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


function ProfitAndLoss() {
    const { transactions } = useAppContext();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { revenueMap, expensesMap, totalRevenue, totalExpenses, netIncome } = useMemo(() => {
        const startDate = startOfYear(new Date(selectedYear, 0, 1));
        const endDate = endOfYear(new Date(selectedYear, 11, 31));

        const filteredTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
        });

        const revenueMap = filteredTransactions
            .filter(tx => tx.type === 'incoming')
            .reduce((acc, tx) => {
                acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
                return acc;
            }, {} as Record<StatementCategory, number>);

        const expensesMap = filteredTransactions
            .filter(tx => tx.type === 'outgoing')
            .reduce((acc, tx) => {
                acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
                return acc;
            }, {} as Record<StatementCategory, number>);
        
        const totalRevenue = Object.values(revenueMap).reduce((sum, amount) => sum + amount, 0);
        const totalExpenses = Object.values(expensesMap).reduce((sum, amount) => sum + amount, 0);
        const netIncome = totalRevenue - totalExpenses;

        return { revenueMap, expensesMap, totalRevenue, totalExpenses, netIncome };
    }, [selectedYear, transactions]);

    return (
        <Card>
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Profit & Loss Statement</CardTitle>
                        <CardDescription>A summary of revenues and expenses for the selected year.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => handlePrint('p-and-l-print', `Profit & Loss Statement for ${selectedYear}`)}>
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
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => (
                                <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                                    {new Date().getFullYear() - i}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div id="p-and-l-print">
                     <h1 className="text-xl font-bold mb-4">Profit & Loss Statement for {selectedYear}</h1>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Revenue</h2>
                            <Table>
                                <TableBody>
                                    {Object.entries(revenueMap).map(([category, amount]) =>(
                                        <TableRow key={category}>
                                            <TableCell className="capitalize">{category}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="font-bold text-md">
                                        <TableCell>Total Revenue</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Expenses</h2>
                            <Table>
                                <TableBody>
                                     {Object.entries(expensesMap).map(([category, amount]) =>(
                                        <TableRow key={category}>
                                            <TableCell className="capitalize">{category}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                     <TableRow className="font-bold text-md">
                                        <TableCell>Total Expenses</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalExpenses)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                     </div>
                     <div className={`mt-8 p-4 rounded-md text-center font-bold border ${netIncome >= 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        <p className="text-lg">Net {netIncome >= 0 ? 'Income' : 'Loss'}</p>
                        <p className="text-3xl">{formatCurrency(netIncome)}</p>
                    </div>
                </div>

            </CardContent>
        </Card>
    )

}


export default function StatementsPage() {
    return (
        <Tabs defaultValue="cashbook" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cashbook">Cashbook</TabsTrigger>
                <TabsTrigger value="trial_balance">Trial Balance</TabsTrigger>
                <TabsTrigger value="profit_loss">Profit & Loss</TabsTrigger>
            </TabsList>
            <TabsContent value="cashbook" className="mt-6">
                <Cashbook />
            </TabsContent>
            <TabsContent value="trial_balance" className="mt-6">
                <TrialBalance />
            </TabsContent>
            <TabsContent value="profit_loss" className="mt-6">
                <ProfitAndLoss />
            </TabsContent>
        </Tabs>
    );
}

    
