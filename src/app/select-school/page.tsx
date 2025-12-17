'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useSchool } from '@/context/school-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function SelectSchoolContent() {
    const { user, loading } = useUser();
    const { selectedSchoolId, setSelectedSchoolId, userData, schools } = useSchool();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (selectedSchoolId) {
            router.push('/dashboard');
        }
    }, [selectedSchoolId, router]);

    if (loading || !userData) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Select School</CardTitle>
                    <CardDescription>Choose the school you want to manage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {schools.map((school) => (
                        <Button
                            key={school.id}
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedSchoolId(school.id)}
                        >
                            {school.name}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default function SelectSchoolPage() {
    return (
        <FirebaseClientProvider>
            <SelectSchoolContent />
        </FirebaseClientProvider>
    );
}