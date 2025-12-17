'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User, School } from '@/lib/types';
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX, Shield, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function UserManagementContent() {
    const { user: currentUser, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for user management
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        role: 'teacher' as User['role'],
        schoolIds: [] as string[],
        defaultSchoolId: ''
    });

    // Fetch data
    const { data: users, loading: usersLoading } = useCollection<User>(
        firestore ? collection(firestore, 'users') : null
    );
    const { data: schools, loading: schoolsLoading } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    if (userLoading || usersLoading || schoolsLoading) {
        return <div className="flex h-screen items-center justify-center">Loading user management...</div>;
    }

    const currentUserData = currentUser ? users.find(u => u.uid === currentUser.uid) : null;

    if (!currentUser || !currentUserData || currentUserData.role !== 'system_admin') {
        return <div className="flex h-screen items-center justify-center">Access denied. System admin required.</div>;
    }

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    // Get school names for display
    const getSchoolNames = (schoolIds: string[]) => {
        return schoolIds.map(id => schools.find(s => s.id === id)?.name).filter(Boolean).join(', ');
    };

    const getRoleBadgeColor = (role: User['role']) => {
        switch (role) {
            case 'system_admin': return 'bg-red-100 text-red-800';
            case 'school_admin': return 'bg-blue-100 text-blue-800';
            case 'teacher': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: User['role']) => {
        switch (role) {
            case 'system_admin': return <ShieldCheck className="h-4 w-4" />;
            case 'school_admin': return <Shield className="h-4 w-4" />;
            case 'teacher': return <Users className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const getUserStatus = (user: User) => {
        // For now, all users are considered active
        // In the future, this could be based on last login, account status, etc.
        return 'active';
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            displayName: user.displayName || '',
            role: user.role,
            schoolIds: user.schoolIds,
            defaultSchoolId: user.defaultSchoolId || ''
        });
        setIsEditDialogOpen(true);
    };

    const handleCreateUser = async () => {
        if (!firestore) return;

        try {
            // Generate a temporary UID for the user record
            // In a real implementation, this would be done by Firebase Auth
            const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const userData: Omit<User, 'uid'> = {
                email: formData.email,
                displayName: formData.displayName || undefined,
                role: formData.role,
                schoolIds: formData.schoolIds,
                defaultSchoolId: formData.defaultSchoolId || undefined,
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(firestore, 'users', tempUid), userData);

            toast({
                title: "User Record Created",
                description: `User record for ${formData.email} has been created. Note: Actual user account creation requires Firebase Admin SDK.`,
            });
            setIsCreateDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error creating user:', error);
            toast({
                title: "Error",
                description: "Failed to create user record. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleEditUser = async () => {
        if (!firestore || !editingUser) return;

        try {
            const updateData = {
                displayName: formData.displayName || undefined,
                role: formData.role,
                schoolIds: formData.schoolIds,
                defaultSchoolId: formData.defaultSchoolId || undefined,
            };

            await updateDoc(doc(firestore, 'users', editingUser.uid), updateData);

            toast({
                title: "User Updated",
                description: `User ${editingUser.email} has been updated successfully.`,
            });
            setIsEditDialogOpen(false);
            setEditingUser(null);
            resetForm();
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: "Error",
                description: "Failed to update user. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!firestore) return;

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(firestore, 'users', userId));

            toast({
                title: "User Record Deleted",
                description: "User record has been deleted. Note: Firebase Auth user account deletion requires Admin SDK.",
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: "Error",
                description: "Failed to delete user record. Please try again.",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            displayName: '',
            role: 'teacher',
            schoolIds: [],
            defaultSchoolId: ''
        });
    };

    // Bulk operations
    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
            return;
        }

        try {
            const deletePromises = selectedUsers.map(userId =>
                deleteDoc(doc(firestore!, 'users', userId))
            );
            await Promise.all(deletePromises);

            toast({
                title: "Users Deleted",
                description: `${selectedUsers.length} user records have been deleted.`,
            });
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error deleting users:', error);
            toast({
                title: "Error",
                description: "Failed to delete some users. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.uid));
        }
    };

    const handleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system. They will receive an email invitation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="displayName" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    Role
                                </Label>
                                <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({...formData, role: value})}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="school_admin">School Admin</SelectItem>
                                        <SelectItem value="system_admin">System Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(formData.role === 'teacher' || formData.role === 'school_admin') && (
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">
                                        Schools
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                        <Select onValueChange={(value) => {
                                            if (!formData.schoolIds.includes(value)) {
                                                setFormData({
                                                    ...formData,
                                                    schoolIds: [...formData.schoolIds, value],
                                                    defaultSchoolId: formData.defaultSchoolId || value
                                                });
                                            }
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Add school..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schools
                                                    .filter(school => !formData.schoolIds.includes(school.id))
                                                    .map((school) => (
                                                    <SelectItem key={school.id} value={school.id}>
                                                        {school.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex flex-wrap gap-1">
                                            {formData.schoolIds.map((schoolId) => {
                                                const school = schools.find(s => s.id === schoolId);
                                                return school ? (
                                                    <Badge key={schoolId} variant="secondary" className="flex items-center gap-1">
                                                        {school.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                const newSchoolIds = formData.schoolIds.filter(id => id !== schoolId);
                                                                setFormData({
                                                                    ...formData,
                                                                    schoolIds: newSchoolIds,
                                                                    defaultSchoolId: formData.defaultSchoolId === schoolId ? (newSchoolIds[0] || '') : formData.defaultSchoolId
                                                                });
                                                            }}
                                                        />
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                        {formData.schoolIds.length > 1 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="defaultSchool" className="text-sm">
                                                    Default School
                                                </Label>
                                                <Select value={formData.defaultSchoolId} onValueChange={(value) => setFormData({...formData, defaultSchoolId: value})}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select default school" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {formData.schoolIds.map((schoolId) => {
                                                            const school = schools.find(s => s.id === schoolId);
                                                            return school ? (
                                                                <SelectItem key={schoolId} value={schoolId}>
                                                                    {school.name}
                                                                </SelectItem>
                                                            ) : null;
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateUser}>Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="system_admin">System Admin</SelectItem>
                        <SelectItem value="school_admin">School Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-sm font-medium">
                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUsers([])}
                        >
                            Clear Selection
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* User Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all schools
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Admins</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'system_admin').length}</div>
                        <p className="text-xs text-muted-foreground">
                            Full system access
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">School Admins</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'school_admin').length}</div>
                        <p className="text-xs text-muted-foreground">
                            School-level access
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {users.filter(u => getUserStatus(u) === 'active').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Recently active users
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Manage user accounts and permissions across all schools
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Schools</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.includes(user.uid)}
                                            onCheckedChange={() => handleSelectUser(user.uid)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{user.displayName || user.email}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getRoleBadgeColor(user.role)}>
                                            <div className="flex items-center gap-1">
                                                {getRoleIcon(user.role)}
                                                {user.role.replace('_', ' ')}
                                            </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadgeColor(getUserStatus(user))}>
                                            {getUserStatus(user)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {user.schoolIds && user.schoolIds.length > 0
                                                ? getSchoolNames(user.schoolIds)
                                                : 'No schools assigned'
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user.uid)}
                                                disabled={user.uid === currentUser.uid}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="col-span-3"
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-displayName" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="edit-displayName"
                                value={formData.displayName}
                                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">
                                Role
                            </Label>
                            <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({...formData, role: value})}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="school_admin">School Admin</SelectItem>
                                    <SelectItem value="system_admin">System Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(formData.role === 'teacher' || formData.role === 'school_admin') && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                    Schools
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    <Select onValueChange={(value) => {
                                        if (!formData.schoolIds.includes(value)) {
                                            setFormData({
                                                ...formData,
                                                schoolIds: [...formData.schoolIds, value],
                                                defaultSchoolId: formData.defaultSchoolId || value
                                            });
                                        }
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Add school..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schools
                                                .filter(school => !formData.schoolIds.includes(school.id))
                                                .map((school) => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-wrap gap-1">
                                        {formData.schoolIds.map((schoolId) => {
                                            const school = schools.find(s => s.id === schoolId);
                                            return school ? (
                                                <Badge key={schoolId} variant="secondary" className="flex items-center gap-1">
                                                    {school.name}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer"
                                                        onClick={() => {
                                                            const newSchoolIds = formData.schoolIds.filter(id => id !== schoolId);
                                                            setFormData({
                                                                ...formData,
                                                                schoolIds: newSchoolIds,
                                                                defaultSchoolId: formData.defaultSchoolId === schoolId ? (newSchoolIds[0] || '') : formData.defaultSchoolId
                                                            });
                                                        }}
                                                    />
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                    {formData.schoolIds.length > 1 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-defaultSchool" className="text-sm">
                                                Default School
                                            </Label>
                                            <Select value={formData.defaultSchoolId} onValueChange={(value) => setFormData({...formData, defaultSchoolId: value})}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select default school" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formData.schoolIds.map((schoolId) => {
                                                        const school = schools.find(s => s.id === schoolId);
                                                        return school ? (
                                                            <SelectItem key={schoolId} value={schoolId}>
                                                                {school.name}
                                                            </SelectItem>
                                                        ) : null;
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleEditUser}>Update User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function UserManagementPage() {
    return <UserManagementContent />;
}