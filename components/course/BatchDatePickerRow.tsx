import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash } from "lucide-react";
import { format } from "date-fns";
import React from "react";

interface Batch {
  _id?: string;
  batchName?: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  courseId?: string;
}

interface Props {
  index: number;
  batch: Batch;
  updateBatch: (
    index: number,
    key: "startDate" | "endDate",
    value: Date | null
  ) => void;
  removeBatch: (index: number) => void;
  errors?: { startDate?: string; endDate?: string };
}

export const BatchDatePickerRow: React.FC<Props> = ({
  index,
  batch,
  updateBatch,
  removeBatch,
  errors = {},
}) => {
  return (
    <div className="flex flex-col md:flex-row  gap-4 mb-4 border p-4 rounded-lg">
      <div className="flex-1 ">
        <label className="block font-medium mb-1">Start Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-[55px] justify-start text-left font-normal px-4 group"
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              {batch.startDate ? (
                format(batch.startDate, "PPP")
              ) : (
                <span className="text-muted-foreground">Pick a start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode="single"
              selected={batch.startDate || undefined}
              onSelect={(date) => updateBatch(index, "startDate", date || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors?.startDate && (
          <div className="text-red-500 text-sm mt-1">{errors.startDate}</div>
        )}
      </div>

      <div className="flex-1">
        <label className="block font-medium mb-1">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-[55px] justify-start text-left font-normal px-4 group"
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              {batch.endDate ? (
                format(batch.endDate, "PPP")
              ) : (
                <span className="text-muted-foreground">Pick an end date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode="single"
              selected={batch.endDate || undefined}
              onSelect={(date) => updateBatch(index, "endDate", date || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors?.endDate && (
          <div className="text-red-500 text-sm mt-1">{errors.endDate}</div>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => removeBatch(index)}
        className="w-full mt-7 md:w-auto h-[55px] text-red-500 border-red-500"
      >
        <Trash className="h-4 w-4 " />
      </Button>
    </div>
  );
};
