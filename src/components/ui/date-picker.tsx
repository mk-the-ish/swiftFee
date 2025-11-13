
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

  const handleYearChange = (year: string) => {
    const newDate = date ? new Date(date) : new Date()
    newDate.setFullYear(parseInt(year, 10))
    setDate(newDate)
  }

  const handleMonthChange = (month: string) => {
    const newDate = date ? new Date(date) : new Date()
    newDate.setMonth(parseInt(month, 10))
    setDate(newDate)
  }

  const fromYear = fromDate?.getFullYear() || new Date().getFullYear() - 100;
  const toYear = toDate?.getFullYear() || new Date().getFullYear();

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
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        <div className="flex space-x-2">
          <Select
             onValueChange={handleMonthChange}
             value={date ? date.getMonth().toString() : undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(0, i), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={date ? date.getFullYear().toString() : undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: toYear - fromYear + 1 }, (_, i) => (
                <SelectItem key={i} value={(fromYear + i).toString()}>
                  {fromYear + i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
                setDate(d)
                setOpen(false)
            }}
            fromDate={fromDate}
            toDate={toDate}
            month={date}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
