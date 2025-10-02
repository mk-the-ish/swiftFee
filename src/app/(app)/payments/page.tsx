'use client';

import React from 'react';
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
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { Payment, Student } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  feeType: z.enum(['tuition', 'levy', 'building', 'exam'], {
    required_error: 'Please select a fee type.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.enum(['USD', 'ZWG']),
  bankAccountId: z.string({ required_error: 'Please select a bank account.' }),
});

export default function PaymentsPage() {
  const { students, setStudents, bankAccounts, payments, setPayments, exchangeRate } =
    useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      currency: 'USD',
    },
  });

  function onSubmit(values: z.infer<typeof paymentFormSchema>) {
    const student = students.find((s) => s.id === values.studentId);
    if (!student) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student not found.' });
      return;
    }
    
    const amountInUSD = values.currency === 'ZWG' ? values.amount / exchangeRate : values.amount;

    // Create new payment record
    const newPayment: Payment = {
      id: `P${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      feeType: values.feeType,
      amount: values.amount,
      currency: values.currency,
      amountInUSD,
      date: new Date().toISOString().split('T')[0],
      bankAccountId: values.bankAccountId,
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Update student's owing balance
    setStudents((prevStudents) =>
      prevStudents.map((s) => {
        if (s.id === values.studentId && values.feeType !== 'exam') {
          const owingKey = `${values.feeType}Owing` as keyof Student;
          const currentOwing = s[owingKey] as number;
          const newOwing = Math.max(0, currentOwing - amountInUSD);
          return { ...s, [owingKey]: newOwing };
        }
        return s;
      })
    );

    toast({
      title: 'Payment Recorded',
      description: `${formatCurrency(values.amount, values.currency)} from ${student.name} has been successfully recorded.`,
    });
    form.reset({currency: 'USD'});
  }

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - {s.grade}
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
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 250" {...field} />
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
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 10).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.studentName}</div>
                      <div className="text-sm text-muted-foreground">{p.date}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.feeType}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amount, p.currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amountInUSD)}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">No payments recorded yet.</TableCell>
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
