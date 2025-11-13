"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DatePicker({
  date,
  setDate,
  fromDate,
  toDate,
}: {
  date?: Date,
  setDate: (date?: Date) => void,
  fromDate?: Date,
  toDate?: Date,
}) {
  const [day, setDay] = React.useState<string | undefined>(date ? String(date.getDate()) : undefined);
  const [month, setMonth] = React.useState<string | undefined>(date ? String(date.getMonth()) : undefined);
  const [year, setYear] = React.useState<string | undefined>(date ? String(date.getFullYear()) : undefined);

  React.useEffect(() => {
    if (date) {
      setDay(String(date.getDate()));
      setMonth(String(date.getMonth()));
      setYear(String(date.getFullYear()));
    } else {
        setDay(undefined);
        setMonth(undefined);
        setYear(undefined);
    }
  }, [date]);

  const handleDateChange = (part: 'day' | 'month' | 'year', value: string) => {
    const newDay = part === 'day' ? parseInt(value, 10) : day ? parseInt(day, 10) : undefined;
    const newMonth = part === 'month' ? parseInt(value, 10) : month ? parseInt(month, 10) : undefined;
    const newYear = part === 'year' ? parseInt(value, 10) : year ? parseInt(year, 10) : undefined;

    if (part === 'day') setDay(value);
    if (part === 'month') setMonth(value);
    if (part === 'year') setYear(value);

    if (newDay !== undefined && newMonth !== undefined && newYear !== undefined) {
      const newDate = new Date(newYear, newMonth, newDay);
      // Check if date is valid, e.g., not Feb 30.
      if (newDate.getFullYear() === newYear && newDate.getMonth() === newMonth && newDate.getDate() === newDay) {
          setDate(newDate);
      } else {
          setDate(undefined); // or handle invalid date case
      }
    } else {
        setDate(undefined);
    }
  };

  const fromYear = fromDate?.getFullYear() || new Date().getFullYear() - 100;
  const toYear = toDate?.getFullYear() || new Date().getFullYear();
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i).reverse();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));
  const daysInMonth = (year && month) ? new Date(parseInt(year, 10), parseInt(month, 10) + 1, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  return (
    <div className="flex gap-2">
      <Select value={day} onValueChange={(value) => handleDateChange('day', value)}>
        <SelectTrigger className="w-1/3"><SelectValue placeholder="Day" /></SelectTrigger>
        <SelectContent>
          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={(value) => handleDateChange('month', value)}>
        <SelectTrigger className="w-1/3"><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent>
          {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={(value) => handleDateChange('year', value)}>
        <SelectTrigger className="w-1/3"><SelectValue placeholder="Year" /></SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
