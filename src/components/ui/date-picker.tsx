
"use client"

import * as React from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"

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
  const [open, setOpen] = React.useState(false)
  
  // We need to manage the month displayed in the calendar separately
  // so that it doesn't jump around when the user is selecting a date.
  const [displayMonth, setDisplayMonth] = React.useState<Date>(date || fromDate || toDate || new Date());

  React.useEffect(() => {
    if (date) {
      setDisplayMonth(date);
    }
  }, [date]);


  const handleYearChange = (year: string) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year, 10))
    setDisplayMonth(newDate);
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(month, 10))
    setDisplayMonth(newDate);
  }
  
  const fromYear = fromDate?.getFullYear() || new Date().getFullYear() - 100;
  const toYear = toDate?.getFullYear() || new Date().getFullYear();

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => (fromYear + i));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
         <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
                setDate(d)
                setOpen(false)
            }}
            fromDate={fromDate}
            toDate={toDate}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            captionLayout="dropdown-nav"
         />
      </PopoverContent>
    </Popover>
  )
}
