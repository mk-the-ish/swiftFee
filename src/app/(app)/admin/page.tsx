
'use client';

import React from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { gradeProgression } from '@/lib/types';
import type { BankAccount, Grade } from '@/lib/types';
import { Badge } from '@/components/ui/badge';


const billingFormSchema = z.object({
  tuition: z.coerce.number().min(0),
  levy: z.coerce.number().min(0),
  buildingFund: z.coerce.number().min(0),
});

const bankAccountFormSchema = z.object({
    bankName: z.string().min(2, "Bank name is too short"),
    branch: z.string().min(2, "Branch name is too short"),
    accountNumber: z.string().min(5, "Account number is too short"),
    currency: z.enum(['USD', 'ZWG'])
})

function NewTermBilling() {
  const { bulkBillStudents } = useAppContext();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof billingFormSchema>>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      tuition: 0,
      levy: 0,
      buildingFund: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof billingFormSchema>) {
    await bulkBillStudents(values);
    toast({
      title: 'Term Billed Successfully',
      description: 'All students have been billed for the new term.',
    });
    form.reset();
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>New Term Billing</CardTitle>
            <CardDescription>
              Enter the fees for the new term. This will be added to each student's
              outstanding balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tuition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuition Fee</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="levy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Levy</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buildingFund"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Fund</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Bill for New Term</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function NewYearUpgrade() {
  const { bulkUpgradeGrades } = useAppContext();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    await bulkUpgradeGrades();
    toast({
      title: 'Students Upgraded',
      description: 'All students have been moved to the next grade.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Year Upgrade</CardTitle>
        <CardDescription>
          This action will move every student up by one grade. This is irreversible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
            The grade progression is: ECD A → ECD B → Grade 1 → ... → Grade 7.
            Students in Grade 7 will have their status set to 'Graduated'. Students with status 'Entrant' will be changed to 'Active'.
        </p>
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Upgrade All Students</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently upgrade all
                students to their next grade level and activate all entrants.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpgrade}>
                Yes, upgrade students
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function BankAccountManagement() {
    const { bankAccounts, addBankAccount } = useAppContext();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof bankAccountFormSchema>>({
        resolver: zodResolver(bankAccountFormSchema),
        defaultValues: {
            currency: 'USD',
            bankName: '',
            branch: '',
            accountNumber: '',
        }
    });

    async function onSubmit(values: z.infer<typeof bankAccountFormSchema>) {
        await addBankAccount(values);
        toast({
            title: "Bank Account Added",
            description: `${values.bankName} account has been added.`
        });
        form.reset();
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Add Bank Account</CardTitle>
                            <CardDescription>Add a new bank account to the system.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="bankName" render={({ field }) => (
                                <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="branch" render={({ field }) => (
                                <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="currency" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="ZWG">ZWG</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Add Account</Button>
                        </CardFooter>
                    </form>
                 </Form>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Existing Bank Accounts</CardTitle>
                    <CardDescription>List of all bank accounts in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank</TableHead>
                                <TableHead>Account No.</TableHead>
                                <TableHead>Currency</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bankAccounts.map(account => (
                                <TableRow key={account.id}>
                                    <TableCell>
                                        <div className="font-medium">{account.bankName}</div>
                                        <div className="text-sm text-muted-foreground">{account.branch}</div>
                                    </TableCell>
                                    <TableCell>{account.accountNumber}</TableCell>
                                    <TableCell><Badge variant="secondary">{account.currency}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StudentIDGeneration() {
  const { bulkUpdateStudentIds } = useAppContext();
  const { toast } = useToast();

  const handleIdGeneration = async () => {
    await bulkUpdateStudentIds();
    toast({
      title: 'Student IDs Updated',
      description: 'All student IDs have been regenerated successfully.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Student IDs</CardTitle>
        <CardDescription>
          This action will regenerate IDs for all students based on the new format (MPYYCCNN). This is a one-time operation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
            Example: A student in Grade 7 Blue class graduating in 2025 will have an ID like `MP250001`.
        </p>
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Generate New IDs for All Students</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all existing students and recreate them with new IDs based on the specified format. Related payment records will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleIdGeneration}>
                Yes, generate new IDs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}


export default function AdminPage() {
  return (
    <Tabs defaultValue="billing" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="billing">New Term Billing</TabsTrigger>
        <TabsTrigger value="upgrade">New Year Upgrade</TabsTrigger>
        <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
        <TabsTrigger value="ids">Student IDs</TabsTrigger>
      </TabsList>
      <TabsContent value="billing" className="mt-6">
        <NewTermBilling />
      </TabsContent>
      <TabsContent value="upgrade" className="mt-6">
        <NewYearUpgrade />
      </TabsContent>
      <TabsContent value="banks" className="mt-6">
        <BankAccountManagement />
      </TabsContent>
      <TabsContent value="ids" className="mt-6">
        <StudentIDGeneration />
      </TabsContent>
    </Tabs>
  );
}
