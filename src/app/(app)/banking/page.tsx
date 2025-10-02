'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, groupTransactionsByAccount } from '@/lib/utils';
import type { Transaction, BankAccount } from '@/lib/types';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const expenseFormSchema = z.object({
  bankAccountId: z.string({ required_error: 'Please select a bank account.' }),
  description: z.string().min(3, { message: 'Description is too short.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

function RecordExpense() {
  const { bankAccounts, setTransactions } = useAppContext();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
  });

  function onSubmit(values: z.infer<typeof expenseFormSchema>) {
    const newTransaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date().toISOString(),
      bankAccountId: values.bankAccountId,
      type: 'outgoing',
      description: values.description,
      amount: values.amount,
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    toast({
      title: 'Expense Recorded',
      description: `${formatCurrency(values.amount)} has been recorded as an expense.`,
    });
    form.reset({ description: '', amount: undefined, bankAccountId: undefined });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Record an Expense</CardTitle>
            <CardDescription>
              Record an outgoing payment like bills, salaries, or other operational costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Bank Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bank account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber} ({b.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Stationery" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 75.50" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Record Expense</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function DailyDeposits() {
  const { payments, setPayments, bankAccounts, setTransactions } = useAppContext();
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  const cashPaymentsToDeposit = payments.filter(
    (p) => p.paymentMethod === 'Cash' && !p.deposited
  );

  const totalCashToDeposit = cashPaymentsToDeposit.reduce(
    (acc, p) => acc + p.amountInUSD,
    0
  );

  const handleDeposit = () => {
    if (!selectedAccountId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a bank account to deposit into.' });
      return;
    }
    if (cashPaymentsToDeposit.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No cash payments to deposit.' });
      return;
    }

    const newTransaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date().toISOString(),
      bankAccountId: selectedAccountId,
      type: 'incoming',
      description: `Daily cash deposit from fees`,
      amount: totalCashToDeposit,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // Mark payments as deposited
    setPayments(prevPayments =>
      prevPayments.map(p =>
        cashPaymentsToDeposit.some(dp => dp.id === p.id) ? { ...p, deposited: true } : p
      )
    );

    toast({
      title: 'Cash Deposited',
      description: `${formatCurrency(totalCashToDeposit)} has been deposited successfully.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Cash Deposits</CardTitle>
        <CardDescription>
          Summary of cash payments received today. Deposit the total amount into a bank account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Cash to Deposit</span>
                <span className="text-2xl font-bold">{formatCurrency(totalCashToDeposit)}</span>
            </div>
            <div className="flex items-end gap-4">
                <div className="flex-1">
                <Label htmlFor="deposit-account">Deposit to Account</Label>
                <Select onValueChange={setSelectedAccountId}>
                    <SelectTrigger id="deposit-account">
                    <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                    {bankAccounts.filter(b => b.currency === 'USD').map(b => (
                        <SelectItem key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumber})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={totalCashToDeposit === 0 || !selectedAccountId}>Deposit Cash</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deposit</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to deposit {formatCurrency(totalCashToDeposit)} into the selected bank account? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeposit}>Confirm Deposit</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Receipt #</TableHead>
              <TableHead className="text-right">Amount (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashPaymentsToDeposit.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.studentName}</TableCell>
                <TableCell><Badge variant="secondary">{p.receiptNumber}</Badge></TableCell>
                <TableCell className="text-right">{formatCurrency(p.amountInUSD)}</TableCell>
              </TableRow>
            ))}
            {cashPaymentsToDeposit.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No undeposited cash payments.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


function TransactionHistory() {
    const { transactions, bankAccounts } = useAppContext();
    const groupedTransactions = groupTransactionsByAccount(transactions);

    const getAccountBalance = (accountId: string) => {
        const accountTransactions = groupedTransactions[accountId] || [];
        return accountTransactions.reduce((balance, t) => {
            return t.type === 'incoming' ? balance + t.amount : balance - t.amount;
        }, 0);
    }

    return (
        <div className="space-y-6">
            {bankAccounts.map(account => (
                <Card key={account.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{account.bankName} ({account.currency})</CardTitle>
                                <CardDescription>{account.branch} - {account.accountNumber}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold">{formatCurrency(getAccountBalance(account.id), account.currency)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(groupedTransactions[account.id] || []).slice(0,10).map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {t.type === 'incoming' ? <ArrowDownCircle className="h-4 w-4 text-green-500" /> : <ArrowUpCircle className="h-4 w-4 text-red-500" />}
                                                <span>{t.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'incoming' ? '+' : '-'} {formatCurrency(t.amount, account.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!groupedTransactions[account.id] && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No transactions for this account yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function BankingPage() {
  return (
    <Tabs defaultValue="history" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="history">Transaction History</TabsTrigger>
        <TabsTrigger value="deposits">Daily Deposits</TabsTrigger>
        <TabsTrigger value="expense">Record Expense</TabsTrigger>
      </TabsList>
      <TabsContent value="history" className="mt-6">
        <TransactionHistory />
      </TabsContent>
      <TabsContent value="deposits" className="mt-6">
        <DailyDeposits />
      </TabsContent>
      <TabsContent value="expense" className="mt-6">
        <RecordExpense />
      </TabsContent>
    </Tabs>
  );
}
