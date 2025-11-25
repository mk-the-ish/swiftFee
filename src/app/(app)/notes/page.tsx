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
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
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

const noteFormSchema = z.object({
  description: z.string().min(1, { message: 'Note cannot be empty.' }).max(500, { message: 'Note cannot be longer than 500 characters.' }),
});

export default function NotesPage() {
  const { notes, addNote, deleteNote } = useAppContext();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof noteFormSchema>) {
    if (!user || !user.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a note.',
      });
      return;
    }

    await addNote({
      description: values.description,
      authorName: user.displayName || user.email,
      authorId: user.id,
    });

    toast({
      title: 'Note Added',
      description: 'Your note has been successfully posted.',
    });
    form.reset();
  }

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes]);

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Create a New Note</CardTitle>
                <CardDescription>Share a quick note with other staff members.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your note here..."
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Posting...' : 'Post Note'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes Board</CardTitle>
            <CardDescription>Recent notes from all users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {sortedNotes.length > 0 ? sortedNotes.map(note => (
                    <div key={note.id} className="flex items-start gap-4">
                        <div className="flex-1">
                            <p className="text-sm">{note.description}</p>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                                <span>
                                    <strong>{note.authorName}</strong> - {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                </span>
                                {user?.id === note.authorId && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this note.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteNote(note.id)}>
                                                Yes, delete note
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                     <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>No notes have been posted yet.</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
