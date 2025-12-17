'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { School } from '@/lib/types';

function MultiDashboardContent() {
    const { user, loading } = useUser();
    const firestore = useFirestore();
    const { data: schools = [] } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Multi-School Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schools.length}</div>
                    </CardContent>
                </Card>
                {/* Add more aggregated metrics here */}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Schools Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="space-y-2">
                            {schools.map((school) => (
                                <div key={school.id} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{school.name}</p>
                                        <p className="text-sm text-muted-foreground">{school.address}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function MultiDashboardPage() {
    return <MultiDashboardContent />;
}