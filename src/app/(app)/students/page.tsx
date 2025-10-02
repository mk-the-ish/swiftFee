'use client';

import React, { useState, useMemo } from 'react';
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
import type { Student } from '@/lib/types';
import { ArrowUpDown } from 'lucide-react';

type SortKey = keyof Student | 'totalOwing';

export default function StudentsPage() {
  const { students } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

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

    return sortableStudents.filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm, sortConfig]);

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
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>
          A list of all students and their outstanding fee balances.
        </CardDescription>
        <div className="pt-2">
            <Input 
                placeholder="Search by name or grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="name">Name</SortableHeader>
              <SortableHeader sortKey="grade">Grade</SortableHeader>
              <SortableHeader sortKey="tuitionOwing">Tuition Owing</SortableHeader>
              <SortableHeader sortKey="levyOwing">Levy Owing</SortableHeader>
              <SortableHeader sortKey="buildingFundOwing">Building Fund</SortableHeader>
              <SortableHeader sortKey="totalOwing">Total Owing</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{formatCurrency(student.tuitionOwing)}</TableCell>
                <TableCell>{formatCurrency(student.levyOwing)}</TableCell>
                <TableCell>{formatCurrency(student.buildingFundOwing)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(student.totalOwing)}</TableCell>
              </TableRow>
            ))}
             {filteredAndSortedStudents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No students found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
