
'use client';

import React, { useState, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { cn, formatCurrency, handlePrint } from '@/lib/utils';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { generateFinancialStatementAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gradeProgression, classColors, type Student, type Grade, type Class } from '@/lib/types';

const reportFormSchema = z.object({
  feeType: z.enum(['all', 'tuition', 'levy', 'building', 'exam']),
  bankAccountId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});


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
                    <Select onValueChange={(value) => setSelectedGrade(value as Grade)} value={selectedGrade}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                        <SelectContent>
                             {gradeProgression.map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={(value) => setSelectedClass(value as Class | 'all')} value={selectedClass}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classColors.map(color => (
                                <SelectItem key={color} value={color} className="capitalize">{color}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        onClick={() => handlePrint('class-list-print', `Class List - ${selectedGrade} ${selectedClass !== 'all' ? selectedClass : ''}`)} 
                        disabled={selectedGrade === 'all' || classList.length === 0}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print List
                    </Button>
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


function AiReports() {
    const { bankAccounts } = useAppContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [statement, setStatement] = useState('');

    const form = useForm<z.infer<typeof reportFormSchema>>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
        feeType: 'all',
        },
    });

    async function onSubmit(values: z.infer<typeof reportFormSchema>) {
        setIsLoading(true);
        setStatement('');

        let criteria = `Generate a financial statement for ${values.feeType} fees.`;
        if (values.startDate && values.endDate) {
            criteria += ` From ${format(values.startDate, 'PPP')} to ${format(values.endDate, 'PPP')}.`;
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
            <CardTitle>Generate AI Statement</CardTitle>
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

                 <div className="space-y-2">
                    <FormLabel>Date Range</FormLabel>
                    <div className="grid gap-2">
                        <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                             <FormItem>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                 </div>
                
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


export default function ReportsPage() {
    return (
        <Tabs defaultValue="debtors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="debtors">Debtors List</TabsTrigger>
                <TabsTrigger value="class_lists">Class Lists</TabsTrigger>
                <TabsTrigger value="ai_reports">AI Statements</TabsTrigger>
            </TabsList>
            <TabsContent value="debtors" className="mt-6">
                <DebtorsList />
            </TabsContent>
            <TabsContent value="class_lists" className="mt-6">
                <ClassLists />
            </TabsContent>
            <TabsContent value="ai_reports" className="mt-6">
                <AiReports />
            </TabsContent>
        </Tabs>
    )
}
