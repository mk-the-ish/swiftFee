
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { User, Cake, Phone, Home, Printer, Pencil, FilePlus, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Student, Payment } from '@/lib/types';
import { AddStudentForm } from '../components/add-student-form';
import { Logo } from '@/components/icons';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription as AlertDialogDescriptionComponent,
} from '@/components/ui/alert-dialog';


const billingFormSchema = z.object({
  tuition: z.coerce.number().min(0),
  levy: z.coerce.number().min(0),
  buildingFund: z.coerce.number().min(0),
});

function BillStudentDialog({ student }: { student: Student }) {
    const [open, setOpen] = React.useState(false);
    const { billStudent } = useAppContext();
    const { toast } = useToast();
    const { user } = useUser();

    const form = useForm<z.infer<typeof billingFormSchema>>({
        resolver: zodResolver(billingFormSchema),
        defaultValues: {
            tuition: 0,
            levy: 0,
            buildingFund: 0,
        },
    });

    async function onSubmit(values: z.infer<typeof billingFormSchema>) {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to perform this action." });
            return;
        }
        await billStudent(student.id, values, { userId: user.uid, userName: user.displayName || user.email || 'Unknown' });
        toast({
            title: 'Student Billed',
            description: `${student.name} has been billed successfully.`
        });
        form.reset();
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><FilePlus className="mr-2 h-4 w-4" />Bill Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bill {student.name}</DialogTitle>
                    <DialogDescription>
                        Enter the amounts to add to the student's outstanding balance.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                         <DialogFooter className="mt-4">
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">Add Bill</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function InfoCard({ icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <div className="bg-muted rounded-md p-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

function InvoiceDialog({ student, bankAccounts }: { student: Student, bankAccounts: any[] }) {
    const handlePrint = () => {
        const printContent = document.getElementById('invoice-print-area');
        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow && printContent) {
            printWindow.document.write('<html><head><title>Print Invoice</title>');
            printWindow.document.write('<link rel="stylesheet" href="https://unpkg.com/tailwindcss@2.2.19/dist/tailwind.min.css" />');
            printWindow.document.write('</head><body>');
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

    const usdAccounts = bankAccounts.filter(a => a.currency === 'USD');
    const levyAccount = usdAccounts.find(a => a.bankName === 'CBZ');
    const tuitionAccount = usdAccounts.find(a => a.bankName === 'ZB Bank');
    const zwgAccount = bankAccounts.find(a => a.bankName === 'CABS');


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" />Print Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Invoice for {student.name}</DialogTitle>
                    <DialogDescription>Review the invoice below before printing.</DialogDescription>
                </DialogHeader>
                <div id="invoice-print-area" className="text-gray-800">
                    <div className="p-8 border rounded-lg">
                        <header className="flex justify-between items-center pb-6 border-b">
                            <div className="flex items-center gap-4">
                                <Logo className="h-20 w-20 text-blue-800" />
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">MAKOMO COUNCIL PRIMARY SCHOOL</h1>
                                    <p className="text-sm">P.O.BOX EP 3</p>
                                    <p className="text-sm">EPWORTH ZIMPOST</p>
                                    <p className="text-sm">HARARE Tel: (04)2937464</p>
                                </div>
                            </div>
                            <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
                                <p className="text-xs text-gray-500">School Logo</p>
                            </div>
                        </header>
                        <section className="py-6">
                            <h2 className="text-lg font-semibold">Invoice for {student.name}</h2>
                            <p className="text-sm text-gray-600">{student.grade}</p>
                            <div className="flex justify-between items-center mt-4">
                                <div>
                                    <span className="font-medium">Quote Date:</span> {format(new Date(), 'dd/MM/yyyy')}
                                </div>
                                <div>
                                    <span className="font-medium">Invoice Number:</span> {student.id}
                                </div>
                            </div>
                        </section>
                        <section>
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-2 font-medium">Description</th>
                                        <th className="text-right p-2 font-medium">Amount (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.levyOwing > 0 && (
                                        <tr className="border-b">
                                            <td className="p-2">Levy</td>
                                            <td className="p-2 text-right">{formatCurrency(student.levyOwing)}</td>
                                        </tr>
                                    )}
                                    {student.tuitionOwing > 0 && (
                                        <tr className="border-b">
                                            <td className="p-2">Tuition</td>
                                            <td className="p-2 text-right">{formatCurrency(student.tuitionOwing)}</td>
                                        </tr>
                                    )}
                                    <tr className="font-bold bg-gray-50">
                                        <td className="p-2 text-right">Total Owed</td>
                                        <td className="p-2 text-right">{formatCurrency(student.levyOwing + student.tuitionOwing)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                         <section className="pt-6">
                            <h3 className="text-md font-bold mb-2">Banking Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                               {levyAccount && (
                                 <div>
                                     <p className="font-semibold">LEVY</p>
                                     <p>Bank: {levyAccount.bankName}</p>
                                     <p>Branch: {levyAccount.branch}</p>
                                     <p>Account No: {levyAccount.accountNumber}-USD</p>
                                      {zwgAccount && <p>{zwgAccount.accountNumber}-ZIG</p>}
                                 </div>
                               )}
                               {tuitionAccount && (
                                  <div>
                                     <p className="font-semibold">TUITION</p>
                                     <p>Bank: {tuitionAccount.bankName}</p>
                                     <p>Branch: {tuitionAccount.branch}</p>
                                     <p>Account No: {tuitionAccount.accountNumber}-USD</p>
                                 </div>
                               )}
                            </div>
                        </section>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function StudentProfileView({ student, onEdit }: { student: Student, onEdit: () => void }) {
    const isValidDate = student.dateOfBirth && !isNaN(new Date(student.dateOfBirth).getTime());
    const totalOwing = student.tuitionOwing + student.levyOwing + student.buildingFundOwing;
    const { bankAccounts } = useAppContext();

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">{student.name} <Badge variant={student.status === 'active' || student.status === 'entrant' ? 'default' : 'secondary'} className="capitalize">{student.status}</Badge></CardTitle>
                        <CardDescription>{student.grade}{student.class} - Student ID: {student.id}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit Student</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    <InfoCard icon={User} label="Gender" value={student.gender} />
                    <InfoCard 
                        icon={Cake} 
                        label="Date of Birth" 
                        value={isValidDate ? format(new Date(student.dateOfBirth), "MMMM dd, yyyy") : 'N/A'} 
                    />
                    <InfoCard icon={User} label="Guardian" value={`${student.guardianName}`} />
                    <InfoCard icon={Phone} label="Guardian's Phone" value={student.guardianPhone} />
                    <InfoCard icon={Home} label="Address" value={student.address} />
                </CardContent>
                 <CardFooter className="flex gap-2">
                    <InvoiceDialog student={student} bankAccounts={bankAccounts} />
                    <BillStudentDialog student={student} />
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tuition Owing</span>
                        <span className="font-medium">{formatCurrency(student.tuitionOwing)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Levy Owing</span>
                        <span className="font-medium">{formatCurrency(student.levyOwing)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Building Fund Owing</span>
                        <span className="font-medium">{formatCurrency(student.buildingFundOwing)}</span>
                    </div>
                     <div className="flex justify-between items-center font-bold text-lg border-t pt-4">
                        <span>Total Owing</span>
                        <span className={totalOwing < 0 ? 'text-green-600' : ''}>{formatCurrency(totalOwing)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StudentProfileEdit({ student, onCancel }: { student: Student, onCancel: () => void }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Editing {student.name}</CardTitle>
                        <CardDescription>Update the student's details below.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <AddStudentForm studentToEdit={student} setOpen={(isOpen) => !isOpen && onCancel()} />
            </CardContent>
        </Card>
    );
}

function DeletePaymentDialog({ payment }: { payment: Payment }) {
    const { deletePayment } = useAppContext();
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
            await deletePayment(payment, {
                userId: user.uid,
                userName: user.displayName || user.email,
            });
            toast({ title: 'Success', description: 'Payment has been deleted.' });
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
                    <AlertDialogDescriptionComponent>
                        This will permanently delete the payment of {formatCurrency(payment.amount, payment.currency)} from {payment.studentName}.
                        The amount will be added back to the student's owing balance. This action cannot be undone.
                    </AlertDialogDescriptionComponent>
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
                    <AlertDialogAction onClick={handleDelete} disabled={!password}>Delete Payment</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export default function StudentProfilePage() {
  const { id } = useParams();
  const { students, payments } = useAppContext();
  const [isEditing, setIsEditing] = React.useState(false);

  const student = students.find((s) => s.id === id);
  
  const studentPayments = React.useMemo(() => {
    if (!student) return [];
    return payments
        .filter((p) => p.studentId === student.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, student]);

  if (!student) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Student not found</h1>
                <p className="text-muted-foreground">The student you are looking for does not exist.</p>
            </div>
        </div>
    )
  }
  
  return (
    <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            {isEditing ? (
                <StudentProfileEdit student={student} onCancel={() => setIsEditing(false)} />
            ) : (
                <StudentProfileView student={student} onEdit={() => setIsEditing(true)} />
            )}
        </div>
        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>A complete record of all payments made for {student.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Amount (USD)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {studentPayments.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell><Badge variant="secondary">{p.receiptNumber}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{p.feeType}</Badge></TableCell>
                        <TableCell className="text-right">{formatCurrency(p.amount, p.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.amountInUSD)}</TableCell>
                        <TableCell className="text-right">
                           <DeletePaymentDialog payment={p} />
                        </TableCell>
                    </TableRow>
                    ))}
                    {studentPayments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No payments recorded for this student.</TableCell>
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

    

    

