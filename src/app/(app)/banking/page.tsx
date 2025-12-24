
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
import type { Transaction, StatementCategory } from '@/lib/types';
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useUser } from '@/firebase/auth/use-user';
import { statementCategories } from '@/lib/types';
import { Label } from '@/components/ui/label';


const expenseFormSchema = z.object({
  bankAccountId: z.string({ required_error: 'Please select a bank account.' }),
  description: z.string().min(3, { message: 'Description is too short.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  category: z.enum(statementCategories, { required_error: 'Please select a category.' }),
});

const revenueFormSchema = z.object({
  bankAccountId: z.string({ required_error: 'Please select a bank account.' }),
  description: z.string().min(3, { message: 'Description is too short.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  category: z.enum(statementCategories, { required_error: 'Please select a category.' }),
});


function RecordExpense() {
  const { bankAccounts, addTransaction } = useAppContext();
  const { toast } = useToast();
  const { user } = useUser();
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
        description: '',
        category: 'other',
    }
  });

  async function onSubmit(values: z.infer<typeof expenseFormSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to record an expense.' });
        return;
    }
    const bankAccount = bankAccounts.find(ba => ba.id === values.bankAccountId);
    if (!bankAccount) return;

    const newTransaction: Omit<Transaction, 'id'> = {
      date: new Date().toISOString(),
      bankAccountId: values.bankAccountId,
      type: 'outgoing',
      description: values.description,
      amount: values.amount,
      currency: bankAccount.currency,
      originalAmount: values.amount,
      recordedById: user.uid,
      recordedBy: user.displayName || user.email || 'Unknown User',
      category: values.category,
    };
    await addTransaction(newTransaction);
    toast({
      title: 'Expense Recorded',
      description: `${formatCurrency(values.amount, bankAccount.currency)} has been recorded as an expense.`,
    });
    form.reset({ description: '', amount: undefined, bankAccountId: undefined, category: 'other' });
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
                    <Input placeholder="e.g., Office Stationery" {...field} />
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 75.50" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {statementCategories.filter(c => !['tuition', 'levy', 'building', 'exam'].includes(c)).map(c => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

function RecordRevenue() {
  const { bankAccounts, addTransaction } = useAppContext();
  const { toast } = useToast();
  const { user } = useUser();
  const form = useForm<z.infer<typeof revenueFormSchema>>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: {
        description: '',
        category: 'projects',
    }
  });

  async function onSubmit(values: z.infer<typeof revenueFormSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to record revenue.' });
        return;
    }
    const bankAccount = bankAccounts.find(ba => ba.id === values.bankAccountId);
    if (!bankAccount) return;

    const newTransaction: Omit<Transaction, 'id'> = {
      date: new Date().toISOString(),
      bankAccountId: values.bankAccountId,
      type: 'incoming',
      description: values.description,
      amount: values.amount,
      currency: bankAccount.currency,
      originalAmount: values.amount,
      recordedById: user.uid,
      recordedBy: user.displayName || user.email || 'Unknown User',
      category: values.category,
    };
    await addTransaction(newTransaction);
    toast({
      title: 'Revenue Recorded',
      description: `${formatCurrency(values.amount, bankAccount.currency)} has been recorded as revenue.`,
    });
    form.reset({ description: '', amount: undefined, bankAccountId: undefined, category: 'projects' });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Record Revenue</CardTitle>
            <CardDescription>
              Record incoming money from sources other than fees, like projects or donations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Bank Account</FormLabel>
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
                    <Input placeholder="e.g., Tuckshop sales" {...field} />
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 350.00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {statementCategories.filter(c => ['projects', 'other'].includes(c)).map(c => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Record Revenue</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


function DailyDeposits() {
    const { payments, markPaymentsAsDeposited, bankAccounts, addTransaction } = useAppContext();
    const { toast } = useToast();
    const { user } = useUser();

    const cashByAccount = React.useMemo(() => {
        const cashPaymentsToDeposit = payments
            .filter((p) => p.paymentMethod === 'Cash' && !p.deposited && p.depositAccountId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const grouped = cashPaymentsToDeposit.reduce((acc, p) => {
            const accountId = p.depositAccountId!;
            if (!acc[accountId]) {
                const account = bankAccounts.find(b => b.id === accountId);
                acc[accountId] = {
                    accountName: account ? `${account.bankName} (${account.accountNumber})` : 'Unknown Account',
                    currency: account?.currency || 'USD',
                    total: 0,
                    payments: [],
                };
            }
            acc[accountId].total += p.amount;
            acc[accountId].payments.push(p);
            return acc;
        }, {} as Record<string, { accountName: string; currency: 'USD' | 'ZWG'; total: number; payments: typeof payments }>);
        
        return Object.entries(grouped);

    }, [payments, bankAccounts]);


    const handleDeposit = async (accountId: string, total: number, currency: 'USD' | 'ZWG', paymentIds: string[], studentId: string) => {
        if (paymentIds.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No cash payments to deposit for this account.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to record a deposit.' });
            return;
        }

        const newTransaction: Omit<Transaction, 'id'> = {
            date: new Date().toISOString(),
            bankAccountId: accountId,
            type: 'incoming',
            description: `Daily cash deposit from fees`,
            amount: total, // Assuming cash deposits are already in the correct currency of the account
            currency: currency,
            originalAmount: total,
            recordedById: user.uid,
            recordedBy: user.displayName || user.email || 'Unknown User',
            category: 'other', // Or derive a more specific category if possible
        };
        await addTransaction(newTransaction);

        await markPaymentsAsDeposited(paymentIds, studentId);

        toast({
            title: 'Cash Deposited',
            description: `${formatCurrency(total, currency)} has been deposited successfully.`,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Cash Deposits</CardTitle>
                <CardDescription>
                    Summary of undeposited cash payments, grouped by their destination bank account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {cashByAccount.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {cashByAccount.map(([accountId, data]) => (
                            <AccordionItem value={accountId} key={accountId}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span className="font-semibold">{data.accountName}</span>
                                        <span className="font-bold text-lg">{formatCurrency(data.total, data.currency)}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-muted/50 rounded-b-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Receipt #</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.payments.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{p.studentName}</TableCell>
                                                    <TableCell><Badge variant="secondary">{p.receiptNumber}</Badge></TableCell>
                                                    <TableCell className="text-right">{formatCurrency(p.amount, p.currency)}</TableCell>
                                                </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                         <div className="mt-4 flex justify-end">
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button>Deposit {formatCurrency(data.total, data.currency)}</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Deposit</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to deposit {formatCurrency(data.total, data.currency)} into {data.accountName}? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeposit(accountId, data.total, data.currency, data.payments.map(p => p.id), data.payments[0].studentId)}>
                                                        Confirm Deposit
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                         </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>No undeposited cash payments.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DeleteTransactionDialog({ transaction }: { transaction: Transaction }) {
    const { deleteTransaction } = useAppContext();
    const { toast } = useToast();
    const { user, reauthenticate } = useUser();
    const [password, setPassword] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleDelete = async () => {
        if (!user || !user.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setError('');
        try {
            await reauthenticate(password);
            await deleteTransaction(transaction.id, {
                userId: user.uid,
                userName: user.displayName || user.email,
            });
            toast({ title: 'Success', description: 'Transaction has been deleted.' });
            setPassword('');
            setOpen(false);
        } catch (e: any) {
            setError('Authentication failed. Please check your password.');
            console.error(e);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the transaction: "{transaction.description}" of {formatCurrency(transaction.originalAmount, transaction.currency)}.
                        This action cannot be undone and may affect financial reports.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="password">Enter your password to confirm:</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={!password}>Delete Transaction</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function TransactionHistory() {
    const { transactions, bankAccounts } = useAppContext();
    const groupedTransactions = groupTransactionsByAccount(transactions);

    const getAccountBalance = (accountId: string) => {
        const accountTransactions = groupedTransactions[accountId] || [];
        return accountTransactions.reduce((balance, t) => {
            // Note: we use originalAmount here because 'amount' is always in USD for consistency in financial reports
            const amount = t.type === 'incoming' ? t.originalAmount : -t.originalAmount;
            return balance + amount;
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
                                    <TableHead>Recorded By</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                             <Badge variant="outline" className="capitalize mt-1">{t.category}</Badge>
                                        </TableCell>
                                        <TableCell>{t.recordedBy}</TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'incoming' ? '+' : '-'} {formatCurrency(t.originalAmount, t.currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DeleteTransactionDialog transaction={t} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!groupedTransactions[account.id] || groupedTransactions[account.id].length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No transactions for this account yet.</TableCell>
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
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="history">Transaction History</TabsTrigger>
        <TabsTrigger value="deposits">Daily Deposits</TabsTrigger>
        <TabsTrigger value="expense">Record Expense</TabsTrigger>
        <TabsTrigger value="revenue">Record Revenue</TabsTrigger>
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
       <TabsContent value="revenue" className="mt-6">
        <RecordRevenue />
      </TabsContent>
    </Tabs>
  );
}
