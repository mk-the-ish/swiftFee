'use client';

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
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
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { User, Cake, Phone, Home, BarChart } from 'lucide-react';
import { format } from 'date-fns';

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

export default function StudentProfilePage() {
  const { id } = useParams();
  const { students, payments } = useAppContext();

  const student = students.find((s) => s.id === id);
  const studentPayments = payments.filter((p) => p.studentId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!student) {
    notFound();
  }
  
  const totalOwing = student.tuitionOwing + student.levyOwing + student.buildingFundOwing;

  return (
    <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>{student.grade} - Student ID: {student.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <InfoCard icon={User} label="Gender" value={student.gender} />
                    <InfoCard icon={Cake} label="Date of Birth" value={format(new Date(student.dateOfBirth), "MMMM dd, yyyy")} />
                    <InfoCard icon={User} label="Guardian" value={`${student.guardianName}`} />
                    <InfoCard icon={Phone} label="Guardian's Phone" value={student.guardianPhone} />
                    <InfoCard icon={Home} label="Address" value={student.address} />
                </CardContent>
            </Card>
            <Card className="mt-8">
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
                        <span>{formatCurrency(totalOwing)}</span>
                    </div>
                </CardContent>
            </Card>
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
                    </TableRow>
                    ))}
                    {studentPayments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No payments recorded for this student.</TableCell>
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
