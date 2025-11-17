"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  Video,
  Users,
  DollarSign,
  Globe,
  BookOpen,
  Link2,
  CheckCircle,
  XCircle,
  Gauge,
} from "lucide-react";

interface ViewCourseModalProps {
  open: boolean;
  onClose: () => void;
  course: any;
}

export default function ViewCourseModal({
  open,
  onClose,
  course,
}: ViewCourseModalProps) {
  if (!course) return null;

  const isLiveCourse = course?.courseType?.toLowerCase() === "live";
  const isPhysicalCourse = course?.courseType?.toLowerCase() === "physical";
  const isRecordedCourse = course?.courseType?.toLowerCase() === "recorded";

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Course Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Course Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Thumbnail */}
                  <div className="md:col-span-1">
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-300">
                      {course?.courseVideo ? (
                        <img
                          src={course.courseVideo}
                          alt={course.CourseName || "Course Thumbnail"}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <BookOpen className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Badge
                        variant="default"
                        className="w-full justify-center py-2 text-sm font-semibold border-2"
                      >
                        {course?.courseType?.toUpperCase() || "UNKNOWN TYPE"}
                      </Badge>
                    </div>
                  </div>

                  {/* Course Title and Description */}
                  <div className="md:col-span-2">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl rounded-lg font-bold text-gray-900 mb-2">
                          {course?.CourseName || "Untitled Course"}
                        </h2>
                        {course?.description && (   
                          <p className="text-gray-600 leading-relaxed line-clamp-3 text-sm">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Quick Info Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full border border-gray-300">
                              <Globe className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              Language
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {course?.language || "Not specified"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full border border-gray-300">
                              <DollarSign className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              Price
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ${course?.price || "0"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full border border-gray-300">
                              <Clock className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              Duration
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {course?.hours || "0"} Hours
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full border border-gray-300">
                              {course?.isActive ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              Status
                            </p>
                          </div>
                          <p
                            className={`font-semibold ${
                              course?.isActive
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {course?.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Type Specific Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-[#e9ecff] border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3 text-lg">
                  <div className="p-2 bg-white rounded-full border border-gray-300 ">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-900">
                    Contact Information
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-full border border-gray-300">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Instructor
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {course?.instructor?.name ||
                      course?.instructor ||
                      "Not specified"}
                  </p>
                </div>
                {course?.email && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-full border border-gray-300">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                    </div>
                    <a
                      href={`mailto:${course.email}`}
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                    >
                      {course.email}
                    </a>
                  </div>
                )}

                {course?.phone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-full border border-gray-300">
                        <Phone className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                    </div>
                    <a
                      href={`tel:${course.phone}`}
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                    >
                      {course.phone}
                    </a>
                  </div>
                )}

                {course?.courseLevel && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-full border border-gray-300">
                        <Gauge className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Course Level
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-sm font-semibold"
                    >
                      {course.courseLevel}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            {(course?.courseIntroVideo || course?.courseVideo) && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="bg-[#e9ecff] border-b border-gray-200">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <div className="p-2 bg-white rounded-full border border-gray-300 ">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-bold text-gray-900">
                      Course Media
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {course?.courseIntroVideo && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Intro Video
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border-2 border-gray-300 ">
                        <video
                          src={course.courseIntroVideo}
                          className="w-full max-w-2xl rounded-lg"
                          controls
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Media */}

          {/* Additional Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-[#e9ecff] border-b border-gray-200">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-white rounded-full border border-gray-300">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-gray-900">
                  Additional Information
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-full border border-gray-300">
                      <CalendarDays className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Created Date
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(course?.createdAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-full border border-gray-300">
                      <CalendarDays className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Last Updated
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(course?.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
