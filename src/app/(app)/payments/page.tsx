'use client';

import React, { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { Payment, Student, Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  receiptNumber: z.string().min(1, { message: 'Receipt number is required.' }),
  feeType: z.enum(['tuition', 'levy', 'building', 'exam'], {
    required_error: 'Please select a fee type.',
  }),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Ecocash'], {
    required_error: 'Please select a payment method.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.enum(['USD', 'ZWG']),
  bankAccountId: z.string().optional(), // For direct bank payments
  depositAccountId: z.string().optional(), // For cash deposits
}).refine(data => {
    if (data.paymentMethod === 'Cash') {
        return !!data.depositAccountId;
    }
    if (data.paymentMethod === 'Bank Transfer' || data.paymentMethod === 'Ecocash') {
        return !!data.bankAccountId;
    }
    return true;
}, {
    message: "A bank account must be selected for this payment method.",
    path: ["bankAccountId"], // This error can be shown on both, but bankAccountId is fine
});


function StudentSelector({
  onSelect,
}: {
  onSelect: (student: Student) => void;
}) {
  const { students } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleSelect = (student: Student) => {
    onSelect(student);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          Select a student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Student</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-0">
          <Input
            placeholder="Search by name or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleSelect(student)}
                >
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">{student.grade}</div>
                  </div>
                </Button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No students found.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function PaymentsPage() {
  const { students, updateStudentBalances, bankAccounts, payments, addPayment, addTransaction, exchangeRate } =
    useAppContext();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      currency: 'USD',
      receiptNumber: '',
    },
  });
  
  const paymentMethod = form.watch('paymentMethod');


  async function onSubmit(values: z.infer<typeof paymentFormSchema>) {
    const student = students.find((s) => s.id === values.studentId);
    if (!student) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student not found.' });
      return;
    }
    
    const rate = exchangeRate?.rate || 1;
    const amountInUSD = values.currency === 'ZWG' ? values.amount / rate : values.amount;

    // Create new payment record
    const newPayment: Omit<Payment, 'id'> = {
      studentId: student.id,
      studentName: student.name,
      feeType: values.feeType,
      paymentMethod: values.paymentMethod,
      amount: values.amount,
      currency: values.currency,
      amountInUSD,
      date: new Date().toISOString(),
      receiptNumber: values.receiptNumber,
      deposited: values.paymentMethod !== 'Cash', // Cash payments are deposited later
      ...(values.paymentMethod !== 'Cash' && { bankAccountId: values.bankAccountId }),
      ...(values.paymentMethod === 'Cash' && { depositAccountId: values.depositAccountId }),
    };

    const paymentRef = await addPayment(newPayment);
    
    // If not cash, create transaction immediately
    if(values.paymentMethod !== 'Cash' && values.bankAccountId) {
        const bankAccount = bankAccounts.find(ba => ba.id === values.bankAccountId);
        if (bankAccount) {
            const newTransaction: Omit<Transaction, 'id'> = {
                date: new Date().toISOString(),
                bankAccountId: values.bankAccountId,
                type: 'incoming',
                description: `Fee payment from ${student.name} (Receipt: ${values.receiptNumber})`,
                amount: amountInUSD,
                currency: values.currency,
                originalAmount: values.amount,
                relatedPaymentId: paymentRef?.id
            };
            await addTransaction(newTransaction);
        }
    }

    // Update student's owing balance
    if (values.feeType !== 'exam') {
        await updateStudentBalances(values.studentId, values.feeType, amountInUSD);
    }

    toast({
      title: 'Payment Recorded',
      description: `${formatCurrency(values.amount, values.currency)} from ${student.name} has been successfully recorded.`,
    });
    form.reset({
      currency: 'USD',
      receiptNumber: '',
      studentId: undefined,
      feeType: undefined,
      amount: undefined,
      bankAccountId: undefined,
      depositAccountId: undefined,
      paymentMethod: undefined,
    });
    setSelectedStudent(null);
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    form.setValue('studentId', student.id);
    form.clearErrors('studentId');
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Record a Payment</CardTitle>
            <CardDescription>Fill in the details to record a new fee payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Student</FormLabel>
                       <FormControl>
                        {selectedStudent ? (
                          <div className='flex items-center justify-between'>
                            <div>
                                <p className='font-medium'>{selectedStudent.name}</p>
                                <p className='text-sm text-muted-foreground'>{selectedStudent.grade}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedStudent(null);
                              form.resetField('studentId');
                            }}>Change</Button>
                          </div>
                        ) : (
                          <StudentSelector onSelect={handleStudentSelect} />
                        )}
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., REC-00123" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition</SelectItem>
                          <SelectItem value="levy">Levy</SelectItem>
                          <SelectItem value="building">Building Fund</SelectItem>
                          <SelectItem value="exam">Exam Fee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Ecocash">Ecocash</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input type="number" placeholder="e.g., 250" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="USD" />
                            </FormControl>
                            <FormLabel className="font-normal">USD</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="ZWG" />
                            </FormControl>
                            <FormLabel className="font-normal">ZWG</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {paymentMethod === 'Cash' && (
                    <FormField
                        control={form.control}
                        name="depositAccountId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deposit to Account</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select account for end-of-day deposit" />
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
                            <FormDescription>This is the account the cash will be deposited into.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                {paymentMethod && paymentMethod !== 'Cash' && (
                  <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid into Bank Account</FormLabel>
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
                )}
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>A list of the most recent fee payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 10).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.studentName}</div>
                      <div className="text-sm text-muted-foreground">{new Date(p.date).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{p.receiptNumber}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.paymentMethod}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amount, p.currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amountInUSD)}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No payments recorded yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
