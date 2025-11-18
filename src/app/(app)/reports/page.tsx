
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { Printer } from 'lucide-react';
import { cn, formatCurrency, handlePrint } from '@/lib/utils';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/app-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gradeProgression, classColors, type Student, type Grade, type Class, Payment, Transaction } from '@/lib/types';

function DebtorsList() {
    const { students } = useAppContext();

    const debtors = useMemo(() => {
        return students
            .map(s => ({...s, totalOwing: s.tuitionOwing + s.levyOwing + s.buildingFundOwing}))
            .filter(s => s.totalOwing > 0)
            .sort((a,b) => b.totalOwing - a.totalOwing);
    }, [students]);

    const totalSchoolDebt = useMemo(() => {
        return debtors.reduce((acc, student) => acc + student.totalOwing, 0);
    }, [debtors]);

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle>Debtors List</CardTitle>
                    <CardDescription>A list of all students with outstanding balances.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handlePrint('debtors-list-print', 'Debtors List')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print List
                </Button>
            </CardHeader>
            <CardContent>
                <div id="debtors-list-print">
                    <h1 className="text-2xl font-bold mb-4">Debtors List</h1>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead className="text-right">Tuition Owing</TableHead>
                                <TableHead className="text-right">Levy Owing</TableHead>
                                <TableHead className="text-right">Building Fund</TableHead>
                                <TableHead className="text-right font-bold">Total Owing</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debtors.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.grade}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(student.tuitionOwing)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(student.levyOwing)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(student.buildingFundOwing)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(student.totalOwing)}</TableCell>
                                </TableRow>
                            ))}
                            {debtors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No students have outstanding balances.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                     <div className="mt-8 text-right">
                        <h2 className="text-xl font-bold">Total Owed by Whole School: {formatCurrency(totalSchoolDebt)}</h2>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ClassLists() {
    const { students } = useAppContext();
    const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('ECD A');
    const [selectedClass, setSelectedClass] = useState<Class | 'all'>('all');

    const classList = useMemo(() => {
        if (selectedGrade === 'all') return [];
        return students
            .filter(s => s.grade === selectedGrade && (selectedClass === 'all' || s.class === selectedClass))
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [students, selectedGrade, selectedClass]);
    
    return (
        <Card>
            <CardHeader>
                 <CardTitle>Class Lists</CardTitle>
                 <CardDescription>View and print a list of students for any grade and class.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-4 mb-6">
                    <DatePicker 
                        date={new Date()}
                        setDate={() => {}}
                    />
                 </div>
                
                <div id="class-list-print">
                    <h1 className="text-2xl font-bold mb-4 capitalize">Class List: {selectedGrade} {selectedClass !== 'all' ? selectedClass : ''}</h1>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Date of Birth</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classList.map(student => {
                                const isValidDate = student.dateOfBirth && !isNaN(new Date(student.dateOfBirth).getTime());
                                return (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.gender}</TableCell>
                                        <TableCell>{isValidDate ? format(new Date(student.dateOfBirth), "dd MMMM, yyyy") : 'N/A'}</TableCell>
                                    </TableRow>
                                )
                            })}
                            {classList.length === 0 && selectedGrade !== 'all' && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No students found for this selection.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

            </CardContent>
        </Card>
    );
}

function DailyStatement() {
  const { payments, transactions } = useAppContext();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { dailyPayments, dailyExpenses, paymentsTotal, expensesTotal } = useMemo(() => {
    if (!date) {
      return { dailyPayments: [], dailyExpenses: [], paymentsTotal: 0, expensesTotal: 0 };
    }

    const selectedDate = format(date, 'yyyy-MM-dd');

    const dailyPayments = payments.filter(p => format(new Date(p.date), 'yyyy-MM-dd') === selectedDate);
    const dailyExpenses = transactions.filter(t => t.type === 'outgoing' && format(new Date(t.date), 'yyyy-MM-dd') === selectedDate);
    
    const paymentsTotal = dailyPayments.reduce((acc, p) => acc + p.amountInUSD, 0);
    const expensesTotal = dailyExpenses.reduce((acc, t) => acc + t.amount, 0);

    return { dailyPayments, dailyExpenses, paymentsTotal, expensesTotal };
  }, [date, payments, transactions]);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Daily Statement</CardTitle>
          <CardDescription>A summary of payments and expenses for a selected day.</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <DatePicker date={date} setDate={setDate} />
          <Button variant="outline" onClick={() => handlePrint('daily-statement-print', `Daily Statement for ${date ? format(date, 'PPP') : ''}`)} disabled={!date}>
            <Printer className="mr-2 h-4 w-4" />
            Print Statement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="daily-statement-print">
          <h1 className="text-2xl font-bold mb-4">Daily Statement for {date ? format(date, 'PPP') : 'N/A'}</h1>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Payments Received (Income)</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.studentName}</TableCell>
                      <TableCell>{p.receiptNumber}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.amountInUSD)}</TableCell>
                    </TableRow>
                  ))}
                   {dailyPayments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">No payments recorded for this day.</TableCell>
                    </TableRow>
                   )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold">Total Income</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(paymentsTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Expenses Paid (Outgoing)</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyExpenses.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.description}</TableCell>
                      <TableCell className="capitalize">{t.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {dailyExpenses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">No expenses recorded for this day.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(expensesTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
          <div className="mt-8 text-right">
             <h2 className="text-xl font-bold">Net Total for the Day: {formatCurrency(paymentsTotal - expensesTotal)}</h2>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
    return (
        <Tabs defaultValue="debtors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="debtors">Debtors List</TabsTrigger>
                <TabsTrigger value="class_lists">Class Lists</TabsTrigger>
                <TabsTrigger value="daily_statement">Daily Statement</TabsTrigger>
            </TabsList>
            <TabsContent value="debtors" className="mt-6">
                <DebtorsList />
            </TabsContent>
            <TabsContent value="class_lists" className="mt-6">
                <ClassLists />
            </TabsContent>
            <TabsContent value="daily_statement" className="mt-6">
                <DailyStatement />
            </TabsContent>
        </Tabs>
    )
}
