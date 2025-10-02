'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { generateFinancialStatementAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

const reportFormSchema = z.object({
  feeType: z.enum(['all', 'tuition', 'levy', 'building', 'exam']),
  bankAccountId: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
});

export default function ReportsPage() {
  const { bankAccounts } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [statement, setStatement] = useState('');

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      feeType: 'all',
      dateRange: { from: undefined, to: undefined },
    },
  });

  async function onSubmit(values: z.infer<typeof reportFormSchema>) {
    setIsLoading(true);
    setStatement('');

    let criteria = `Generate a financial statement for ${values.feeType} fees.`;
    if (values.dateRange.from && values.dateRange.to) {
        criteria += ` From ${format(values.dateRange.from, 'PPP')} to ${format(values.dateRange.to, 'PPP')}.`;
    }
    if (values.bankAccountId) {
        const bank = bankAccounts.find(b => b.id === values.bankAccountId);
        if(bank) {
            criteria += ` Deposited into the ${bank.bankName} (${bank.accountNumber}) account.`;
        }
    }
    
    const result = await generateFinancialStatementAction({ criteria });

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Error Generating Statement',
            description: result.error,
        });
    } else if (result.statement) {
        setStatement(result.statement);
        toast({
            title: 'Statement Generated',
            description: 'The financial statement has been successfully generated.',
        });
    }

    setIsLoading(false);
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Generate Statement</CardTitle>
            <CardDescription>
              Use AI to generate a financial statement based on your criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <SelectItem value="all">All Fees</SelectItem>
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
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date range</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value.from && 'text-muted-foreground'
                              )}
                            >
                              {field.value.from ? (
                                field.value.to ? (
                                  <>
                                    {format(field.value.from, 'LLL dd, y')} -{' '}
                                    {format(field.value.to, 'LLL dd, y')}
                                  </>
                                ) : (
                                  format(field.value.from, 'LLL dd, y')
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={field.value as DateRange}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All bank accounts" />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Statement'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Financial Statement</CardTitle>
            <CardDescription>The AI-generated statement will appear below.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ) : statement ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{statement}</pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Your generated statement will be displayed here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
