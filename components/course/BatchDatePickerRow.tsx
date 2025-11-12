import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  Trash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Center {
  _id: string;
  centerName: string;
}

interface Props {
  index: number;
  batch: any;
  updateBatch: (
    index: number,
    key: "startDate" | "endDate" | "centerId" | "time" | "meetingLink",
    value: Date | string | null
  ) => void;
  removeBatch?: (index: number) => void;
  errors?: {
    startDate?: string;
    endDate?: string;
    centerId?: string;
    time?: string;
    meetingLink?: string;
  };
  centers?: Center[];
  location?: boolean;
  link?: boolean;
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
  link,
  setSelectedCenter,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(
    batch.startDate ? new Date(batch.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    batch.endDate ? new Date(batch.endDate) : null
  );
  const [time, setTime] = useState<string>(batch.time || "");
  const [meetingLink, setMeetingLink] = useState<string>(
    batch.meetingLink || ""
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCenter, setSelectedCenterState] = useState<any>(null);

  useEffect(() => {
    if (batch.centerId && centers && centers.length > 0) {
      const center = centers.find((c) => c._id === batch.centerId);
      if (center) {
        setSelectedCenterState(center);
      } else if (typeof batch.centerId === "object") {
        setSelectedCenterState(batch.centerId);
      }
    } else {
      setSelectedCenterState(null);
    }
  }, [batch.centerId, centers]);

  return (
    <div className="flex flex-col gap-4 mb-4 border p-4 rounded-lg">
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
                {startDate ? (
                  format(startDate, "PPP")
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
                selected={startDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date);
                    localDate.setMinutes(
                      localDate.getMinutes() - localDate.getTimezoneOffset()
                    );
                    setStartDate(localDate);
                    updateBatch(index, "startDate", localDate);
                  } else {
                    setStartDate(null);
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
                {endDate ? (
                  format(endDate, "PPP")
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
                selected={endDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date);
                    localDate.setMinutes(
                      localDate.getMinutes() - localDate.getTimezoneOffset()
                    );
                    setEndDate(localDate);
                    updateBatch(index, "endDate", localDate);
                  } else {
                    setEndDate(null);
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-2">
          <label className="block font-medium mb-1">Batch Time</label>
          <div className="relative rounded-md shadow-sm">
            <Input
              name="time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                updateBatch(index, "time", e.target.value);
              }}
              className={cn("pl-10 w-full", "")}
              placeholder="HH:MM"
            />
          </div>
          {errors?.time && (
            <p className="mt-1 text-sm text-red-600">{errors.time}</p>
          )}
        </div>
        {location && (
          <div className="flex-1">
            <label className="block font-medium mb-1">Batch Location</label>

            <Select
              value={selectedCenter?._id || ""}
              onValueChange={(value) => {
                const center = centers.find((c) => c._id === value);
                setSelectedCenterState(center || null);
                updateBatch(index, "centerId", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select center">
                  {selectedCenter?.centerName || "Select center"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center._id} value={center._id}>
                    {center.centerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors?.centerId && (
              <p className="text-red-500 text-sm mt-1">{errors.centerId}</p>
            )}
          </div>
        )}

        {link && (
          <div className="space-y-2">
            <label className="block font-medium mb-1">Zoom Meeting Link</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <Input
                name="meetingLink"
                type="url"
                placeholder="https://zoom.us/j/meeting-id"
                value={batch.meetingLink || ""}
                onChange={(e) =>
                  updateBatch(index, "meetingLink", e.target.value)
                }
                className="pl-10 w-full"
              />
            </div>
            {errors?.meetingLink && (
              <p className="mt-1 text-sm text-red-600">{errors.meetingLink}</p>
            )}
          </div>
        )}
      </div>

      {removeBatch &&
        index !== 0 &&
        !(location && batch.centerId && index === 0) && (
          <Button
            variant="outline"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeBatch(index);
            }}
            className="w-full mt-7 md:w-auto h-[55px] text-red-500 border-red-500"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
    </div>
  );
};
