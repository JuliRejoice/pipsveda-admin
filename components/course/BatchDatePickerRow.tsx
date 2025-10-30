import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Batch {
  _id?: string;
  batchName?: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  courseId?: string;
  centerId?: string;
}

interface Center {
  _id: string;
  centerName: string;
}

interface Props {
  index: number;
  batch: any;
  updateBatch: (
    index: number,
    key: "startDate" | "endDate" | "centerId",
    value: Date | string | null
  ) => void;
  removeBatch?: (index: number) => void;
  errors?: { startDate?: string; endDate?: string; centerId?: string };
  centers?: Center[];
  location?: boolean;
  setSelectedCenter?: any;
}

export const BatchDatePickerRow: React.FC<Props> = ({
  index,
  batch,
  updateBatch,
  removeBatch,
  errors = {},
  centers = [],
  location,
  setSelectedCenter,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-4 border p-4 rounded-lg">
      {location && (
        <div className="flex-1">
          <label className="block font-medium mb-1">Batch Location</label>

          <Select
            value={batch.centerId || ""}
            onValueChange={(value) => {
              const selectedCenter = centers?.find((c) => c._id === value);
              updateBatch(index, "centerId", value);
              setSelectedCenter(selectedCenter);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full",
                errors?.centerId && "border-red-500 focus:ring-red-500"
              )}
            >
              <SelectValue placeholder="Select a center" />
            </SelectTrigger>

            <SelectContent>
              {centers && centers.length > 0 ? (
                centers.map((center) => (
                  <SelectItem key={center._id} value={center._id}>
                    {center.centerName}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No centers available
                </div>
              )}
            </SelectContent>
          </Select>

          {errors?.centerId && (
            <p className="text-red-500 text-sm mt-1">{errors.centerId}</p>
          )}
        </div>
      )}

      <div className="flex gap-4">
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
                  <span className="text-muted-foreground">
                    Pick a start date
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-0">
              <Calendar
                mode="single"
                selected={batch.startDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date);
                    localDate.setMinutes(
                      localDate.getMinutes() - localDate.getTimezoneOffset()
                    );
                    updateBatch(index, "startDate", localDate);
                  } else {
                    updateBatch(index, "startDate", null);
                  }
                }}
                initialFocus
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
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
                  <span className="text-muted-foreground">
                    Pick an end date
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-0">
              <Calendar
                mode="single"
                selected={batch.endDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date);
                    localDate.setMinutes(
                      localDate.getMinutes() - localDate.getTimezoneOffset()
                    );
                    updateBatch(index, "endDate", localDate);
                  } else {
                    updateBatch(index, "endDate", null);
                  }
                }}
                initialFocus
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </PopoverContent>
          </Popover>
          {errors?.endDate && (
            <div className="text-red-500 text-sm mt-1">{errors.endDate}</div>
          )}
        </div>
      {removeBatch && (
        <Button
          variant="outline"
          onClick={() => removeBatch(index)}
          className="w-full mt-7 md:w-auto h-[55px] text-red-500 border-red-500"
        >
          <Trash className="h-4 w-4 " />
        </Button>
      )}
      </div>

    </div>
  );
};
