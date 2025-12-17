'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useMultiSchoolAggregation } from '@/firebase/firestore/hooks';
import { useCollection } from '@/firebase/firestore/hooks';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Student, Payment, Transaction, School } from '@/lib/types';
import { Users, DollarSign, CreditCard, TrendingUp, Download, BarChart3, PieChart, Calendar, Target } from 'lucide-react';

// Utility function to convert array of objects to CSV
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

// Utility function to download CSV
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ReportsPageContent() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    // Aggregate data across all schools
    const { data: allStudents, loading: studentsLoading } = useMultiSchoolAggregation<Student>('students');
    const { data: allPayments, loading: paymentsLoading } = useMultiSchoolAggregation<Payment>('payments');
    const { data: allTransactions, loading: transactionsLoading } = useMultiSchoolAggregation<Transaction>('transactions');
    const { data: schools, loading: schoolsLoading } = useCollection<School>(
        firestore ? collection(firestore, 'schools') : null
    );

    // Export functions
    const exportStudents = () => {
        const csvData = arrayToCSV(allStudents.map(student => ({
            id: student.id,
            name: student.name,
            grade: student.grade,
            class: student.class,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            guardianName: student.guardianName,
            guardianPhone: student.guardianPhone,
            address: student.address,
            status: student.status,
            tuitionOwing: student.tuitionOwing,
            levyOwing: student.levyOwing,
            buildingFundOwing: student.buildingFundOwing,
            schoolId: student.schoolId,
            schoolName: student.schoolName,
        })));
        downloadCSV(csvData, `students-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportPayments = () => {
        const csvData = arrayToCSV(allPayments.map(payment => ({
            id: payment.id,
            studentId: payment.studentId,
            studentName: payment.studentName,
            receiptNumber: payment.receiptNumber,
            feeType: payment.feeType,
            paymentMethod: payment.paymentMethod,
            amount: payment.amount,
            currency: payment.currency,
            amountInUSD: payment.amountInUSD,
            date: payment.date,
            deposited: payment.deposited,
            recordedBy: payment.recordedBy,
            schoolId: payment.schoolId,
            schoolName: payment.schoolName,
        })));
        downloadCSV(csvData, `payments-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportTransactions = () => {
        const csvData = arrayToCSV(allTransactions.map(transaction => ({
            id: transaction.id,
            date: transaction.date,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            currency: transaction.currency,
            originalAmount: transaction.originalAmount,
            category: transaction.category,
            recordedBy: transaction.recordedBy,
            relatedPaymentId: transaction.relatedPaymentId || '',
            schoolId: transaction.schoolId,
            schoolName: transaction.schoolName,
        })));
        downloadCSV(csvData, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportSchools = () => {
        const csvData = arrayToCSV(schools.map(school => ({
            id: school.id,
            name: school.name,
            address: school.address || '',
            contactInfo: school.contactInfo || '',
        })));
        downloadCSV(csvData, `schools-${new Date().toISOString().split('T')[0]}.csv`);
    };

    if (userLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (schoolsLoading || studentsLoading || paymentsLoading || transactionsLoading) {
        return <div className="flex h-screen items-center justify-center">Loading reports...</div>;
    }

    // Calculate aggregated metrics
    const totalStudents = allStudents.length;
    const activeStudents = allStudents.filter(s => s.status === 'active').length;
    const totalPayments = allPayments.length;
    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amountInUSD, 0);
    const pendingPayments = allPayments.filter(p => !p.deposited).length;
    const totalTransactions = allTransactions.length;
    const incomingTransactions = allTransactions.filter(t => t.type === 'incoming');
    const outgoingTransactions = allTransactions.filter(t => t.type === 'outgoing');
    const netCashFlow = incomingTransactions.reduce((sum, t) => sum + t.amount, 0) -
                       outgoingTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Group payments by month for trend
    const paymentsByMonth = allPayments.reduce((acc, payment) => {
        const date = new Date(payment.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + payment.amountInUSD;
        return acc;
    }, {} as Record<string, number>);

    const recentMonths = Object.keys(paymentsByMonth)
        .sort()
        .slice(-6)
        .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount: paymentsByMonth[month]
        }));

    // Advanced Analytics Calculations

    // 1. Grade-wise analysis
    const gradeAnalysis = allStudents.reduce((acc, student) => {
        if (!acc[student.grade]) {
            acc[student.grade] = { count: 0, revenue: 0, outstanding: 0 };
        }
        acc[student.grade].count++;
        const studentPayments = allPayments.filter(p => p.studentId === student.id);
        acc[student.grade].revenue += studentPayments.reduce((sum, p) => sum + p.amountInUSD, 0);
        acc[student.grade].outstanding += student.tuitionOwing + student.levyOwing + student.buildingFundOwing;
        return acc;
    }, {} as Record<string, { count: number; revenue: number; outstanding: number }>);

    // 2. Payment method analysis
    const paymentMethodAnalysis = allPayments.reduce((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amountInUSD;
        return acc;
    }, {} as Record<string, number>);

    // 3. Seasonal patterns (monthly enrollment and payments)
    const monthlyEnrollment = allStudents.reduce((acc, student) => {
        const month = new Date(student.dateOfBirth).getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const monthlyPayments = allPayments.reduce((acc, payment) => {
        const month = new Date(payment.date).getMonth();
        acc[month] = (acc[month] || 0) + payment.amountInUSD;
        return acc;
    }, {} as Record<number, number>);

    // 4. Revenue forecasting (simple linear trend)
    const revenueTrend = Object.entries(paymentsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount], index) => ({ month, amount, index }));

    const avgGrowthRate = revenueTrend.length > 1 ?
        revenueTrend.slice(1).reduce((sum, curr, i) =>
            sum + (curr.amount - revenueTrend[i].amount) / revenueTrend[i].amount, 0
        ) / (revenueTrend.length - 1) : 0;

    const forecastedRevenue = revenueTrend.length > 0 ?
        revenueTrend[revenueTrend.length - 1].amount * (1 + avgGrowthRate) : 0;

    // 5. School performance comparison
    const schoolPerformance = schools.map(school => {
        const schoolStudents = allStudents.filter(s => s.schoolId === school.id);
        const schoolPayments = allPayments.filter(p => p.schoolId === school.id);
        const schoolRevenue = schoolPayments.reduce((sum, p) => sum + p.amountInUSD, 0);
        const schoolOutstanding = schoolStudents.reduce((sum, s) =>
            sum + s.tuitionOwing + s.levyOwing + s.buildingFundOwing, 0);

        return {
            school: school.name,
            students: schoolStudents.length,
            revenue: schoolRevenue,
            outstanding: schoolOutstanding,
            avgRevenuePerStudent: schoolStudents.length > 0 ? schoolRevenue / schoolStudents.length : 0
        };
    });

    // 6. Payment status analysis
    const paymentStatusAnalysis = {
        deposited: allPayments.filter(p => p.deposited).length,
        pending: allPayments.filter(p => !p.deposited).length,
        depositedAmount: allPayments.filter(p => p.deposited).reduce((sum, p) => sum + p.amountInUSD, 0),
        pendingAmount: allPayments.filter(p => !p.deposited).reduce((sum, p) => sum + p.amountInUSD, 0)
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">System Reports</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportSchools}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Schools
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportStudents}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Students
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPayments}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Payments
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportTransactions}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Transactions
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schools.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Active educational institutions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeStudents} active students
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            From {totalPayments} payments
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${netCashFlow.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalTransactions} total transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Payment Trends</CardTitle>
                        <CardDescription>Revenue over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="space-y-4">
                            {recentMonths.map((item, index) => (
                                <div key={item.month} className="flex items-center">
                                    <div className="w-20 text-sm">{item.month}</div>
                                    <div className="flex-1">
                                        <div
                                            className="h-2 bg-primary rounded"
                                            style={{
                                                width: `${(item.amount / Math.max(...recentMonths.map(m => m.amount))) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="w-16 text-right text-sm font-medium">
                                        ${item.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>Current payment processing status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Deposited</span>
                                </div>
                                <span className="text-sm font-medium">{totalPayments - pendingPayments}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm">Pending</span>
                                </div>
                                <span className="text-sm font-medium">{pendingPayments}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Analytics Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Revenue/Student</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${totalStudents > 0 ? (totalRevenue / totalStudents).toFixed(0) : '0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all schools
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${allStudents.reduce((sum, s) => sum + s.tuitionOwing + s.levyOwing + s.buildingFundOwing, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total unpaid fees
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {totalPayments > 0 ? ((paymentStatusAnalysis.deposited / totalPayments) * 100).toFixed(1) : '0'}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Deposited payments
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${avgGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(avgGrowthRate * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Monthly revenue growth
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Analytics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Grade-wise Analysis */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Grade-wise Performance
                        </CardTitle>
                        <CardDescription>Student distribution and revenue by grade</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(gradeAnalysis)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([grade, data]) => (
                                <div key={grade} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex-1">
                                        <div className="font-medium">Grade {grade}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {data.count} students • ${data.revenue.toLocaleString()} revenue
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-red-600">
                                            ${data.outstanding.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Outstanding</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Payment Methods
                        </CardTitle>
                        <CardDescription>Revenue distribution by payment method</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(paymentMethodAnalysis)
                                .sort(([,a], [,b]) => b - a)
                                .map(([method, amount]) => (
                                <div key={method} className="flex items-center justify-between">
                                    <span className="text-sm">{method}</span>
                                    <div className="text-right">
                                        <div className="font-medium">${amount.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {((amount / totalRevenue) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Seasonal Patterns */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Seasonal Patterns
                        </CardTitle>
                        <CardDescription>Monthly payment trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from({ length: 12 }, (_, i) => {
                                const monthName = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' });
                                const paymentAmount = monthlyPayments[i] || 0;
                                const maxAmount = Math.max(...Object.values(monthlyPayments));
                                return (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-12 text-xs">{monthName}</div>
                                        <div className="flex-1">
                                            <div
                                                className="h-2 bg-primary rounded"
                                                style={{
                                                    width: maxAmount > 0 ? `${(paymentAmount / maxAmount) * 100}%` : '0%'
                                                }}
                                            />
                                        </div>
                                        <div className="w-16 text-right text-xs">
                                            ${paymentAmount.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Forecasting */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Revenue Forecast
                        </CardTitle>
                        <CardDescription>Projected next month revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    ${forecastedRevenue.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Next month projection
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm">
                                    Growth Rate: <span className={avgGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {(avgGrowthRate * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>Detailed payment processing status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm">Deposited</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">{paymentStatusAnalysis.deposited}</div>
                                    <div className="text-xs text-muted-foreground">
                                        ${paymentStatusAnalysis.depositedAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-sm">Pending</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">{paymentStatusAnalysis.pending}</div>
                                    <div className="text-xs text-muted-foreground">
                                        ${paymentStatusAnalysis.pendingAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* School Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>School Performance Comparison</CardTitle>
                    <CardDescription>Comparative analysis across all schools</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {schoolPerformance
                            .sort((a, b) => b.revenue - a.revenue)
                            .map((school, index) => {
                            const maxRevenue = Math.max(...schoolPerformance.map(s => s.revenue));
                            const revenuePercentage = maxRevenue > 0 ? (school.revenue / maxRevenue) * 100 : 0;

                            return (
                                <div key={school.school} className="p-4 border rounded">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <h4 className="font-medium">{school.school}</h4>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">${school.revenue.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">
                                                ${school.avgRevenuePerStudent.toFixed(0)}/student
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{school.students} students</span>
                                            <span className="text-red-600">
                                                ${school.outstanding.toLocaleString()} outstanding
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${revenuePercentage}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {revenuePercentage.toFixed(1)}% of highest revenue
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReportsPage() {
    return <ReportsPageContent />;
}