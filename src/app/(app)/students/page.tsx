
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
import type { Student, StudentStatus, Grade } from '@/lib/types';
import { ArrowUpDown, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddStudentForm } from './components/add-student-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gradeProgression } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

// A custom hook to debounce a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
      <DialogContent className="sm:max-w-lg">
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
type SortableStudent = Student & { totalOwing: number };

export default function StudentsPage() {
  const { students } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatus>('active');
  const [displayList, setDisplayList] = useState<SortableStudent[]>([]);

  useEffect(() => {
    let sortableStudents = [...students].map(student => ({
      ...student,
      totalOwing: student.tuitionOwing + student.levyOwing + student.buildingFundOwing
    }));

    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        const valA = a[sortConfig.key as keyof typeof a];
        const valB = b[sortConfig.key as keyof typeof b];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        return 0;
      });
    }

    const filtered = sortableStudents.filter((student) => {
        const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
        const matchesStatus = student.status === statusFilter;
        return matchesSearch && matchesGrade && matchesStatus;
    });

    setDisplayList(filtered);

  }, [students, debouncedSearchTerm, sortConfig, gradeFilter, statusFilter]);

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
                    <SelectItem value="entrant">Entrant</SelectItem>
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
            {displayList.map((student) => (
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
                <TableCell><Badge variant={student.status === 'active' || student.status === 'entrant' ? 'default' : 'secondary'} className="capitalize">{student.status}</Badge></TableCell>
              </TableRow>
            ))}
             {displayList.length === 0 && (
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
