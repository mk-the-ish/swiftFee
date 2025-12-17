'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { School } from '@/lib/types';

function SeedPageContent() {
    const { user } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const { data: schools = [] } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    const seedSchools = async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const schoolsRef = collection(firestore, 'schools');
            await addDoc(schoolsRef, {
                name: 'Prim-Makomo Primary School',
                address: '123 Main St, Harare',
                contactInfo: 'info@primmakomo.edu',
                createdAt: new Date().toISOString(),
            });
            await addDoc(schoolsRef, {
                name: 'Highlands Secondary School',
                address: '456 Oak Ave, Bulawayo',
                contactInfo: 'admin@highlands.edu',
                createdAt: new Date().toISOString(),
            });
            toast({ title: 'Schools seeded successfully' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error seeding schools', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const createUserDoc = async (uid: string, email: string, role: string, schoolIds: string[]) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', uid);
        await setDoc(userRef, {
            uid,
            email,
            displayName: email.split('@')[0],
            role,
            schoolIds,
            defaultSchoolId: schoolIds[0],
            createdAt: new Date().toISOString(),
        });
    };

    const seedUsers = async () => {
        if (!firestore || !user || schools.length === 0) return;
        setLoading(true);
        try {
            // Create user document for current user as system admin
            await createUserDoc(user.uid, user.email || 'admin@swiftfee.com', 'system_admin', schools.map(s => s.id));
            toast({ title: 'User document created', description: 'Redirecting to dashboard...' });
            // Redirect after a short delay
            setTimeout(() => router.push('/multi/dashboard'), 2000);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error creating user document', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const seedSampleData = async () => {
        if (!firestore || schools.length === 0) return;
        setLoading(true);
        try {
            const schoolId = schools[0].id; // Use first school

            // Seed students
            const studentsRef = collection(firestore, 'schools', schoolId, 'students');
            const sampleStudents = [
                {
                    id: 'MP2025070101',
                    name: 'John Doe',
                    grade: '1',
                    class: 'blue',
                    dateOfBirth: '2018-01-01',
                    gender: 'Male',
                    guardianName: 'Jane Doe',
                    guardianPhone: '+263123456789',
                    address: '123 Student St',
                    status: 'active',
                    tuitionOwing: 100,
                    levyOwing: 50,
                    buildingFundOwing: 25,
                },
                {
                    id: 'MP2025070102',
                    name: 'Jane Smith',
                    grade: '2',
                    class: 'green',
                    dateOfBirth: '2017-02-02',
                    gender: 'Female',
                    guardianName: 'Bob Smith',
                    guardianPhone: '+263987654321',
                    address: '456 Student Ave',
                    status: 'active',
                    tuitionOwing: 120,
                    levyOwing: 60,
                    buildingFundOwing: 30,
                },
            ];

            for (const student of sampleStudents) {
                await setDoc(doc(studentsRef, student.id), student);
            }

            // Seed bank account
            const bankAccountsRef = collection(firestore, 'schools', schoolId, 'bankAccounts');
            await addDoc(bankAccountsRef, {
                bankName: 'ZB Bank',
                branch: 'Harare Main',
                accountNumber: '1234567890',
                currency: 'USD',
            });

            // Set exchange rate
            const exchangeRateRef = doc(firestore, 'settings', 'exchangeRate');
            await setDoc(exchangeRateRef, {
                rate: 25.5,
                lastUpdated: new Date().toISOString(),
            });

            toast({ title: 'Sample data seeded successfully' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error seeding data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>Please log in to access this page.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Database Seeding</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Seed Schools</CardTitle>
                        <CardDescription>Create sample schools in the database.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={seedSchools} disabled={loading}>
                            {loading ? 'Seeding...' : 'Seed Schools'}
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Setup Current User</CardTitle>
                        <CardDescription>Create user document for the logged-in user as system admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={seedUsers} disabled={loading || schools.length === 0}>
                            {loading ? 'Setting up...' : 'Setup User'}
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Seed Sample Data</CardTitle>
                        <CardDescription>Add sample students and data to the first school.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={seedSampleData} disabled={loading || schools.length === 0}>
                            {loading ? 'Seeding...' : 'Seed Data'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function SeedPage() {
    return <SeedPageContent />;
}