import { useState } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

import {
  ImageIcon,
  Eye,
  BookPlus,
  BookAIcon,
  CalendarClock,
  Trash2,
  MoreVertical,
  Edit,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CourseCard = ({
  course,
  activeTab,
  onView,
  onEdit,
  onDelete,
}: {
  course: any;
  activeTab: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative aspect-video bg-background">
        {!course.courseVideo ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        ) : (
          <Image
            src={course.courseVideo}
            alt={course.CourseName || "Course thumbnail"}
            className="w-full h-full object-cover"
            width={400}
            height={225}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={true}
            loading="eager"
            unoptimized={false}
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,XXXXX"
          />
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg line-clamp-2">
              <Link
                href={
                  activeTab === "live"
                    ? `/dashboard/courses/${course._id}`
                    : `/dashboard/courses/${course._id}`
                }
                className="hover:underline cursor-pointer truncate block max-w-[250px]"
              >
                {course.CourseName}
              </Link>
            </h3>
            <div className="text-base text-muted-foreground line-clamp-2 h-12 overflow-hidden text-ellipsis font-lexend">
              {course.description}
            </div>
          </div>
          <DropdownMenu open={popoverOpen} onOpenChange={setPopoverOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setPopoverOpen(false);
                  onView();
                }}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-5 w-5" />
                <span className="text-base font-semibold text-gray-500 font-lexend">
                  View Course
                </span>
              </DropdownMenuItem>

              {activeTab === "live" ? (
                <>
                  <Link
                    href={`/dashboard/courses/${course._id}/batches?type=${activeTab}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <CalendarClock className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Batch
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookAIcon className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Syllabus
                      </span>
                    </DropdownMenuItem>
                  </Link>
                </>
              ) : activeTab === "physical" ? (
                <>
                  <Link
                    href={`/dashboard/courses/${course._id}/batches?type=${activeTab}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookPlus className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Batch
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookAIcon className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Syllabus
                      </span>
                    </DropdownMenuItem>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/dashboard/courses/${course._id}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookPlus className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Chapters
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookAIcon className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Edit Syllabus
                      </span>
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
              <DropdownMenuItem
                //   onClick={(e) => {
                //     e.stopPropagation();
                //     setEditCourse(course);
                //     setOpen(true);
                //     setPopoverOpen(false);
                //     setIsSyllabusVisible(false);
                //     setIsPhysicalBatchVisible(false);
                //     setIsLiveBatchVisible(false);
                //     setIsChaptersVisible(false);
                //   }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverOpen(false);
                  onEdit();
                }}
              >
                <Edit className="mr-2 h-5 w-5" />
                <span className="text-base font-semibold text-gray-500 font-lexend">
                  Edit Course
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                //   onClick={() => {
                //     setCourseToDelete(course);
                //     setDeleteDialogOpen(true);
                //   }}
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                <span className="text-base font-semibold text-red-600">
                  Delete
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">${course.price || "0"}</span>
          <Badge variant="outline" className="capitalize">
            <span className="text-white">{course.courseType}</span>
          </Badge>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="font-bold">Instructor:</span>
          <span className="ml-1">{course.instructor?.name || "John Doe"}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <span className=" capitalize">
              {course.language || "English"} | {course?.subscribed || 0}{" "}
              Students
            </span>
          </div>
        </div>

        {course.country && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{course.country}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
