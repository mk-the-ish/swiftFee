'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import type { School } from '@/lib/types';

function SetupTestAccountsContent() {
    const { user, createUserWithEmail, signOut } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const { data: schools = [] } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    const testAccounts = [
        {
            email: 'admin@swiftfee.com',
            password: 'Admin123!',
            displayName: 'System Admin',
            role: 'system_admin' as const,
            schoolIds: schools.map(s => s.id),
            defaultSchoolId: schools[0]?.id
        },
        {
            email: 'schooladmin@swiftfee.com',
            password: 'School123!',
            displayName: 'School Admin',
            role: 'school_admin' as const,
            schoolIds: schools.slice(0, 1).map(s => s.id),
            defaultSchoolId: schools[0]?.id
        },
        {
            email: 'teacher@swiftfee.com',
            password: 'Teacher123!',
            displayName: 'Teacher',
            role: 'teacher' as const,
            schoolIds: schools.slice(0, 1).map(s => s.id),
            defaultSchoolId: schools[0]?.id
        }
    ];

    const createUserDocumentsForExistingAccounts = async () => {
        if (!firestore) {
            toast({
                title: 'Error',
                description: 'Firestore not available.',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            // This is a workaround - we'll create user documents with placeholder UIDs
            // In a real app, you'd get the actual UIDs from Firebase Auth Admin SDK
            const placeholderUsers = [
                {
                    email: 'admin@swiftfee.com',
                    displayName: 'System Admin',
                    role: 'system_admin' as const,
                    schoolIds: schools.map(s => s.id),
                    defaultSchoolId: schools[0]?.id,
                    placeholderUid: 'admin_' + Date.now()
                },
                {
                    email: 'schooladmin@swiftfee.com',
                    displayName: 'School Admin',
                    role: 'school_admin' as const,
                    schoolIds: schools.slice(0, 1).map(s => s.id),
                    defaultSchoolId: schools[0]?.id,
                    placeholderUid: 'schooladmin_' + Date.now()
                },
                {
                    email: 'teacher@swiftfee.com',
                    displayName: 'Teacher',
                    role: 'teacher' as const,
                    schoolIds: schools.slice(0, 1).map(s => s.id),
                    defaultSchoolId: schools[0]?.id,
                    placeholderUid: 'teacher_' + Date.now()
                }
            ];

            toast({
                title: 'Manual User Document Creation Required',
                description: 'Since accounts already exist, you need to manually create user documents. Please contact the developer to add this functionality, or recreate accounts.',
            });

            console.log('To fix this, the developer needs to:');
            console.log('1. Use Firebase Admin SDK to get actual UIDs');
            console.log('2. Create user documents with correct UIDs');
            console.log('3. Or provide a way to link existing accounts');

        } catch (error: any) {
            console.error('Error:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create user documents.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Setup Required</CardTitle>
                        <CardDescription>Please sign in to set up test accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Setup Test Accounts</CardTitle>
                    <CardDescription>
                        Create test accounts manually using the signup form. Click "Show Test Credentials" to see the account details, then use "Go to Signup" to create them.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Test Accounts (Create manually via signup):</h3>
                        <div className="space-y-2">
                            {testAccounts.map((account, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded bg-muted/50">
                                    <div>
                                        <div className="font-medium">{account.displayName}</div>
                                        <div className="text-sm text-muted-foreground">{account.email}</div>
                                        <div className="text-sm text-muted-foreground">Role: {account.role}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono bg-background px-2 py-1 rounded border">
                                            {account.password}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">Password</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={createUserDocumentsForExistingAccounts}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Loading...' : 'Show Test Credentials'}
                        </Button>
                        <Button
                            onClick={() => router.push('/login')}
                            className="flex-1"
                        >
                            Go to Signup
                        </Button>
                    </div>

                    {schools.length === 0 && (
                        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
                            <p className="text-sm text-yellow-800">
                                No schools found. Please run the seed script first: <code>npm run seed</code>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function SetupTestAccountsPage() {
    return (
        <FirebaseClientProvider>
            <SetupTestAccountsContent />
        </FirebaseClientProvider>
    );
}