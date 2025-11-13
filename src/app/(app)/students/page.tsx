
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { formatCurrency } from '@/lib/utils';
import type { Student, StudentStatus } from '@/lib/types';
import { ArrowUpDown, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { gradeProgression } from '@/lib/types';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is too short.' }),
  grade: z.enum(gradeProgression),
  dateOfBirth: z.date({ required_error: 'Date of birth is required.' }),
  gender: z.enum(['Male', 'Female']),
  guardianName: z.string().min(2, { message: "Guardian's name is too short." }),
  guardianPhone: z.string().min(5, { message: "Guardian's phone is too short." }),
  address: z.string().min(5, { message: 'Address is too short.' }),
  status: z.enum(['active', 'graduated', 'transferred']),
});

export function AddStudentForm({ setOpen, studentToEdit }: { setOpen: (open: boolean) => void, studentToEdit?: Student }) {
  const { addStudent, updateStudent } = useAppContext();
  const { toast } = useToast();
  
  const isEditMode = !!studentToEdit;

  const getInitialDate = (dateString?: string) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: isEditMode ? {
        ...studentToEdit,
        dateOfBirth: getInitialDate(studentToEdit.dateOfBirth),
    } : {
      name: '',
      grade: 'ECD A',
      gender: 'Male',
      guardianName: '',
      guardianPhone: '',
      address: '',
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode && studentToEdit) {
      form.reset({
        ...studentToEdit,
        dateOfBirth: getInitialDate(studentToEdit.dateOfBirth),
      });
    }
  }, [studentToEdit, isEditMode, form]);

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    if (isEditMode && studentToEdit) {
        await updateStudent(studentToEdit.id, {
            ...values,
            dateOfBirth: values.dateOfBirth.toISOString()
        });
        toast({
            title: 'Student Updated',
            description: `${values.name} has been updated.`,
        });

    } else {
        const newStudent: Omit<Student, 'id'> = {
          ...values,
          dateOfBirth: values.dateOfBirth.toISOString(),
          tuitionOwing: 0,
          levyOwing: 0,
          buildingFundOwing: 0,
        };
        await addStudent(newStudent);
        toast({
          title: 'Student Added',
          description: `${values.name} has been added to the system.`,
        });
    }

    form.reset();
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="grade" render={({ field }) => (
                <FormItem>
                <FormLabel>Grade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger></FormControl>
                    <SelectContent>{gradeProgression.map(grade => (<SelectItem key={grade} value={grade}>{grade}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                   <FormControl>
                      <DatePicker 
                        date={field.value}
                        setDate={field.onChange}
                        fromDate={new Date('1990-01-01')}
                        toDate={new Date()}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="guardianName" render={({ field }) => (
                <FormItem><FormLabel>Guardian's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                <FormItem><FormLabel>Guardian's Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
       
        <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <DialogFooter className="mt-4">
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button type="submit">{isEditMode ? 'Update Student' : 'Add Student'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the form below to add a new student to the system.
          </DialogDescription>
        </DialogHeader>
        <AddStudentForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}

type SortKey = keyof Student | 'totalOwing';

export default function StudentsPage() {
  const { students } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatus>('active');

  const filteredAndSortedStudents = useMemo(() => {
    let sortableStudents = [...students].map(student => ({
      ...student,
      totalOwing: student.tuitionOwing + student.levyOwing + student.buildingFundOwing
    }));

    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        const valA = a[sortConfig.key as keyof typeof a];
        const valB = b[sortConfig.key as keyof typeof b];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            if (valA.toLowerCase() < valB.toLowerCase()) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA.toLowerCase() > valB.toLowerCase()) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
        }
        
        return 0;
      });
    }

    return sortableStudents.filter((student) => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
        const matchesStatus = student.status === statusFilter;
        return matchesSearch && matchesGrade && matchesStatus;
    });

  }, [students, searchTerm, sortConfig, gradeFilter, statusFilter]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader = ({ sortKey, children }: { sortKey: SortKey, children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)}>
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between'>
        <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>
            A list of all students in the system.
            </CardDescription>
        </div>
        <AddStudentDialog />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 pb-4">
            <Input 
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {gradeProgression.map(grade => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StudentStatus)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="name">Name</SortableHeader>
              <SortableHeader sortKey="grade">Grade</SortableHeader>
              <SortableHeader sortKey="tuitionOwing">Tuition Owing</SortableHeader>
              <SortableHeader sortKey="levyOwing">Levy Owing</SortableHeader>
              <SortableHeader sortKey="buildingFundOwing">Building Fund</SortableHeader>
              <SortableHeader sortKey="totalOwing">Total Owing</SortableHeader>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  <Link href={`/students/${student.id}`} className="hover:underline text-primary">
                    {student.name}
                  </Link>
                </TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{formatCurrency(student.tuitionOwing)}</TableCell>
                <TableCell>{formatCurrency(student.levyOwing)}</TableCell>
                <TableCell>{formatCurrency(student.buildingFundOwing)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(student.totalOwing)}</TableCell>
                <TableCell><Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="capitalize">{student.status}</Badge></TableCell>
              </TableRow>
            ))}
             {filteredAndSortedStudents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">No students found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
