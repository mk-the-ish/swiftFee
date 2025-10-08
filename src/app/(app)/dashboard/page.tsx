'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/app-context';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Users, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { subDays, format } from 'date-fns';

const chartConfig = {
  incoming: {
    label: 'Incoming',
    color: 'hsl(var(--chart-2))',
  },
  outgoing: {
    label: 'Outgoing',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

function CashFlowChart({ currency }: { currency: 'USD' | 'ZWG' }) {
  const { transactions } = useAppContext();

  const chartData = React.useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    
    const dailyData = last7Days.map(day => {
      return {
        date: format(day, 'MMM d'),
        incoming: 0,
        outgoing: 0,
      };
    });

    transactions.filter(t => t.currency === currency).forEach(t => {
      const transactionDate = new Date(t.date);
      const dateString = format(transactionDate, 'yyyy-MM-dd');
      const dayData = dailyData.find(d => format(subDays(new Date(), dailyData.length - 1 - dailyData.findIndex(dd => dd.date === format(transactionDate, 'MMM d'))), 'yyyy-MM-dd') === dateString);

      if (dayData) {
        if (t.type === 'incoming') {
          dayData.incoming += t.originalAmount;
        } else {
          dayData.outgoing += t.originalAmount;
        }
      }
    });

    return dailyData;
  }, [transactions, currency]);


  return (
     <Card>
      <CardHeader>
        <CardTitle>Cash Flow ({currency})</CardTitle>
        <CardDescription>
          Incoming vs. Outgoing transactions for the last 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(Number(value), currency).replace(currency === 'USD' ? '$' : 'ZWG', '')}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                  />
                }
              />
              <Bar dataKey="incoming" fill="var(--color-incoming)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outgoing" fill="var(--color-outgoing)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { students, exchangeRate, setExchangeRate } = useAppContext();
  const { toast } = useToast();
  const [rateInput, setRateInput] = React.useState(exchangeRate?.rate.toString() || '');

  React.useEffect(() => {
    if (exchangeRate) {
        setRateInput(exchangeRate.rate.toString());
    }
  }, [exchangeRate]);

  const totalStudents = students.length;
  const totalOwed = students.reduce(
    (acc, s) => acc + s.tuitionOwing + s.levyOwing + s.buildingFundOwing,
    0
  );
  const studentsWithDebt = students.filter(
    (s) => s.tuitionOwing > 0 || s.levyOwing > 0 || s.buildingFundOwing > 0
  ).length;

  const studentsWithCredit = students.filter(
    (s) => (s.tuitionOwing + s.levyOwing + s.buildingFundOwing) < 0
  ).length;

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRate = parseFloat(rateInput);
    if (!isNaN(newRate) && newRate > 0) {
      await setExchangeRate(newRate);
      toast({
        title: 'Success',
        description: `Exchange rate updated to 1 USD = ${newRate} ZWG.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid, positive number for the exchange rate.',
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalOwed)}</div>
          <p className="text-xs text-muted-foreground">
            Total outstanding fees in USD
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
            Total students in the system
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(exchangeRate?.rate || 0, 'ZWG')}
          </div>
          <p className="text-xs text-muted-foreground">
            Current USD to ZWG exchange rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Students in Debt</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentsWithDebt}</div>
          <p className="text-xs text-muted-foreground">
            Students with outstanding balances
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Students in Credit</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentsWithCredit}</div>
          <p className="text-xs text-muted-foreground">
            Students with advance payments
          </p>
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
        <CashFlowChart currency="USD" />
      </div>
      <div className="lg:col-span-2">
        <CashFlowChart currency="ZWG" />
      </div>
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Set Daily Exchange Rate</CardTitle>
          <CardDescription>
            Enter the exchange rate for 1 USD to ZWG. This will be used for all ZWG transactions today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetRate} className="flex items-end gap-4">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="exchange-rate">1 USD to ZWG</Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.01"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="e.g., 13.5"
              />
            </div>
            <Button type="submit">Set Rate</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
