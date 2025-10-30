"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  createSyllabus,
  updateSyllabus,
  getAllSyllabus,
  deleteSyllabus,
} from "@/components/api/syllabus";
import { getCourses } from "@/components/api/course";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Syllabus {
  _id?: string;
  title: string;
  description: string;
  courseId: string;
}

export default function CourseSyllabus() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [courseName, setCourseName] = useState("");
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Validate syllabus form
  const validateSyllabus = (data: Syllabus) => {
    const err: Record<string, string> = {};
    if (!data.title.trim()) err.title = "Title is required";
    if (!data.description.trim()) err.description = "Description is required";
    setErrors(err);
    return err;
  };

  // ✅ Fetch syllabus list
  const fetchSyllabus = async () => {
    try {
      const response = await getAllSyllabus();
      if (response.success) {
        const allSyllabus = response.payload?.data || [];
        const courseSyllabus = allSyllabus.filter((s: any) =>
          typeof s.courseId === "object"
            ? s.courseId?._id === courseId
            : s.courseId === courseId
        );
        setSyllabusList(courseSyllabus);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error loading syllabus:", err);
      toast.error("Failed to load syllabus");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch course name
  const fetchCourseName = async () => {
    try {
      const res = await getCourses();
      const course = res.payload?.data?.find((c: any) => c._id === courseId);
      if (course) setCourseName(course.CourseName);
    } catch (err) {
      console.error("Error fetching course:", err);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchSyllabus();
      fetchCourseName();
    }
  }, [courseId]);

  // ✅ Save syllabus (Create or Update)
  const handleSaveSyllabus = async (syllabus: Syllabus) => {
    const validationErrors = validateSyllabus(syllabus);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: syllabus.title.trim(),
        description: syllabus.description.trim(),
        courseId,
      };

      if (selectedSyllabus?._id) {
        const res = await updateSyllabus(selectedSyllabus._id, payload);
        if (res.success) {
          toast.success("Syllabus updated successfully");
          await fetchSyllabus();
        } else {
          toast.error(res.message || "Failed to update syllabus");
        }
      } else {
        const res = await createSyllabus([payload]);
        if (res.success) {
          toast.success("Syllabus created successfully");
          await fetchSyllabus();
        } else {
          toast.error(res.message || "Failed to create syllabus");
        }
      }

      setIsDialogOpen(false);
      setSelectedSyllabus(null);
      setErrors({});
    } catch (err) {
      toast.error("Error saving syllabus");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Delete syllabus
  const handleDeleteSyllabus = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteSyllabus(id);
      if (res.success) {
        toast.success("Syllabus deleted successfully");
        setSyllabusList((prev) => prev.filter((s) => s._id !== id));
      } else toast.error(res.message || "Failed to delete syllabus");
    } catch (err) {
      toast.error("Error deleting syllabus");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-base font-semibold">Back to Courses</span>
        </Button>

        <Button
          onClick={() => {
            setErrors({});
            setSelectedSyllabus({
              title: "",
              description: "",
              courseId,
            });
            setIsDialogOpen(true);
          }}
        >
          <BookOpen className="mr-2 h-4 w-4" /> Add Syllabus
        </Button>
      </div>

      {/* SYLLABUS LIST */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {courseName || "Syllabus"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syllabusList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No syllabus yet</p>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first syllabus
              </p>
            </div>
          ) : (
            <div className="grid gap-4  md:grid-cols-1 lg:grid-cols-1">
              {syllabusList.map((syllabus, index) => (
                <Card
                  key={syllabus._id}
                  className="relative group transition-shadow hover:shadow-lg"
                >
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg font-medium pr-20">
                      {index + 1}. {syllabus.title}
                    </CardTitle>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setErrors({});
                          setSelectedSyllabus(syllabus);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSyllabus(syllabus);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      {syllabus.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedSyllabus?._id ? "Edit Syllabus" : "Add New Syllabus"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={selectedSyllabus?.title || ""}
                onChange={(e) =>
                  setSelectedSyllabus((prev: any) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={selectedSyllabus?.description || ""}
                onChange={(e) =>
                  setSelectedSyllabus((prev: any) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleSaveSyllabus(
                  selectedSyllabus || { title: "", description: "", courseId }
                )
              }
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : selectedSyllabus?._id
                ? "Update Syllabus"
                : "Create Syllabus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Syllabus</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <AlertDescription>
              Are you sure you want to delete this syllabus? This action cannot
              be undone.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() =>
                handleDeleteSyllabus(selectedSyllabus?._id as string)
              }
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
