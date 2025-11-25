'use client';

import React, { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { gradeProgression, classColors } from '@/lib/types';
import type { Student } from '@/lib/types';

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is too short.' }),
  grade: z.enum(gradeProgression as [string, ...string[]]),
  class: z.enum(classColors as [string, ...string[]]),
  dateOfBirth: z.date({ message: 'Date of birth is required.' }),
  gender: z.enum(['Male', 'Female']),
  guardianName: z.string().min(2, { message: "Guardian's name is too short." }),
  guardianPhone: z.string().min(5, { message: "Guardian's phone is too short." }),
  address: z.string().min(5, { message: 'Address is too short.' }),
  status: z.enum(['active', 'graduated', 'transferred', 'entrant']),
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
        // @ts-ignore
        dateOfBirth: getInitialDate(studentToEdit.dateOfBirth),
    } : {
      name: '',
      grade: 'ECD A',
      class: 'blue',
      gender: 'Male',
      guardianName: '',
      guardianPhone: '',
      address: '',
      status: 'active',
      dateOfBirth: undefined,
    }
  });

  useEffect(() => {
    if (isEditMode && studentToEdit) {
      form.reset({
        ...studentToEdit,
        // @ts-ignore
        dateOfBirth: getInitialDate(studentToEdit.dateOfBirth),
      });
    }
  }, [studentToEdit, isEditMode, form]);

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    if (isEditMode && studentToEdit) {
        const payload: Partial<Omit<Student, 'id'>> = {
          ...(values as unknown as Partial<Omit<Student, 'id'>>),
          dateOfBirth: values.dateOfBirth.toISOString(),
        };
        await updateStudent(studentToEdit.id, payload);
        toast({
            title: 'Student Updated',
            description: `${values.name} has been updated.`,
        });

    } else {
        const newStudent: Omit<Student, 'id'> = {
          ...(values as unknown as Omit<Student, 'id'>),
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
        <div className="grid grid-cols-3 gap-4">
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
            <FormField control={form.control} name="class" render={({ field }) => (
                <FormItem>
                <FormLabel>Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                    <SelectContent>{classColors.map(c => (<SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>))}</SelectContent>
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
                    <SelectItem value="entrant">Entrant</SelectItem>
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