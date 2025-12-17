'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { School } from '@/lib/types';
import { Plus, Edit, Trash2 } from 'lucide-react';

function SchoolsPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactInfo: '',
    });

    const { data: schools = [], loading: schoolsLoading } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    const resetForm = () => {
        setFormData({ name: '', address: '', contactInfo: '' });
        setEditingSchool(null);
    };

    const openDialog = (school?: School) => {
        if (school) {
            setEditingSchool(school);
            setFormData({
                name: school.name,
                address: school.address || '',
                contactInfo: school.contactInfo || '',
            });
        } else {
            resetForm();
        }
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setLoading(true);
        try {
            if (editingSchool) {
                // Update existing school
                const schoolRef = doc(firestore, 'schools', editingSchool.id);
                await updateDoc(schoolRef, {
                    ...formData,
                    updatedAt: new Date().toISOString(),
                });
                toast({ title: 'School updated successfully' });
            } else {
                // Create new school
                await addDoc(collection(firestore, 'schools'), {
                    ...formData,
                    createdAt: new Date().toISOString(),
                });
                toast({ title: 'School created successfully' });
            }
            closeDialog();
        } catch (error) {
            console.error(error);
            toast({ title: 'Error saving school', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (schoolId: string) => {
        if (!firestore) return;
        if (!confirm('Are you sure you want to delete this school? This will remove all associated data.')) return;

        setLoading(true);
        try {
            await deleteDoc(doc(firestore, 'schools', schoolId));
            toast({ title: 'School deleted successfully' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error deleting school', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>Please log in to access this page.</div>;
    }

    if (schoolsLoading) {
        return <div>Loading schools...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">School Management</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add School
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                                <DialogDescription>
                                    {editingSchool ? 'Update the school information.' : 'Create a new school in the system.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="address" className="text-right">
                                        Address
                                    </Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="contactInfo" className="text-right">
                                        Contact
                                    </Label>
                                    <Input
                                        id="contactInfo"
                                        value={formData.contactInfo}
                                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : editingSchool ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Schools</CardTitle>
                    <CardDescription>Manage all schools in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schools.map((school) => (
                                <TableRow key={school.id}>
                                    <TableCell className="font-medium">{school.name}</TableCell>
                                    <TableCell>{school.address || '-'}</TableCell>
                                    <TableCell>{school.contactInfo || '-'}</TableCell>
                                    <TableCell>{new Date(school.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDialog(school)}
                                            className="mr-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(school.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {schools.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No schools found. Click "Add School" to create your first school.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function SchoolsPage() {
    return <SchoolsPageContent />;
}