"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createSyllabus,
  deleteSyllabus,
  getAllSyllabus,
  updateSyllabus,
} from "@/components/api/syllabus";
import { getCourses } from "@/components/api/course";

interface Syllabus {
  _id?: string;
  title: string;
  description: string;
}

interface SyllabusSectionProps {
  syllabusList?: Syllabus[];
  onAdd?: (data: Syllabus[]) => void;
  onUpdate?: (id: string, data: Syllabus) => void;
  onDelete?: (id: string) => void;
  courseId?: string;
  setOpen?: (open: boolean) => void;
  setIsSyllabusVisible?: (open: boolean) => void;
  setIsLiveBatchVisible?: (open: boolean) => void;
  setIsPhysicalBatchVisible?: (open: boolean) => void;
  saveTitle?: string;
}

export default function SyllabusSection({
  courseId,
  setOpen,
  setIsSyllabusVisible,
  setIsLiveBatchVisible,
  setIsPhysicalBatchVisible,
  saveTitle,
}: SyllabusSectionProps) {
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Record<string, { title?: string; description?: string }>
  >({});

  const fetchSyllabus = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const response = await getAllSyllabus(courseId);
      if (response.success) {
        const courseSyllabus = response.payload?.data?.reverse().filter(
          (s: any) =>
            (typeof s.courseId === "object" ? s.courseId?._id : s.courseId) ===
            courseId
        );
        setSyllabusList(
          courseSyllabus?.length
            ? courseSyllabus
            : [{ title: "", description: "" }]
        );
      } else {
        toast.error(response.message || "Failed to load syllabus");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching syllabus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabus();
  }, [courseId]);

  const validate = (syllabus: Syllabus, index: number) => {
    const newErrors = { ...errors };
    const err: { title?: string; description?: string } = {};

    if (!syllabus.title?.trim()) {
      err.title = "Title is required";
    } else if (syllabus.title.trim().length < 3) {
      err.title = "Title must be at least 3 characters";
    }

    if (!syllabus.description?.trim()) {
      err.description = "Description is required";
    } else if (syllabus.description.trim().length < 10) {
      err.description = "Description must be at least 10 characters";
    }

    newErrors[index] = err;
    setErrors(newErrors);
    return Object.keys(err).length === 0;
  };

  const handleAdd = () => {
    setSyllabusList((prev) => [...prev, { title: "", description: "" }]);
  };
  const handleFieldChange = (
    index: number,
    field: keyof Syllabus,
    value: string
  ) => {
    const updated = [...syllabusList];
    updated[index][field] = value;
    setSyllabusList(updated);
  };

  const handleSave = async () => {
    if (!courseId) return toast.error("Missing Course ID");

    const validationResults = syllabusList.map((item, i) => validate(item, i));
    const allValid = validationResults.every((valid) => valid);

    if (!allValid) {
      const firstInvalidIndex = validationResults.findIndex((valid) => !valid);
      if (firstInvalidIndex !== -1) {
        const element = document.getElementById(
          `syllabus-item-${firstInvalidIndex}`
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return toast.error("Please fix validation errors before saving");
    }

    setLoading(true);
    try {
      for (const syllabus of syllabusList) {
        const payload = {
          title: syllabus.title.trim(),
          description: syllabus.description.trim(),
          courseId,
        };

        if (syllabus._id) {
          await updateSyllabus(syllabus._id, payload);
        } else {
          await createSyllabus([payload]);
        }
      }
      toast.success("Syllabus saved successfully");
      await fetchSyllabus();
      setOpen && setOpen(false);
      setIsSyllabusVisible && setIsSyllabusVisible(false);
      setIsLiveBatchVisible && setIsLiveBatchVisible(true);
      setIsPhysicalBatchVisible && setIsPhysicalBatchVisible(true);
      setErrors({});
    } catch (error) {
      console.error(error);
      toast.error("Error saving syllabus");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string, index?: number) => {
    if (id) {
      try {
        const res = await deleteSyllabus(id);
        if (res.success) {
          toast.success("Deleted successfully");
          setSyllabusList((prev) => prev.filter((s) => s._id !== id));
        } else toast.error(res.message || "Failed to delete syllabus");
      } catch (error) {
        toast.error("Error deleting syllabus");
      }
    } else if (index !== undefined) {
      // remove unsaved syllabus from UI
      setSyllabusList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const containerHeight =
    syllabusList.length <= 1
      ? "h-auto"
      : "h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400";

  return (
    <div
      className={`flex flex-col justify-between space-y-6 ${containerHeight} pr-2`}
    >
      <div className="flex justify-between items-center">
        <Button onClick={handleAdd} variant="default" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Syllabus
        </Button>
      </div>
      {syllabusList.length === 0 && (
        <p className="text-gray-500">No syllabus added yet.</p>
      )}
      {syllabusList.map((item, index) => (
        <div
          key={item._id || index}
          id={`syllabus-item-${index}`}
          className="border rounded-lg p-4 space-y-2 relative bg-gray-50"
        >
          <div className="flex items-start gap-3">
            <div className="w-full">
              <Input
                placeholder="Enter Title"
                value={item.title}
                onChange={(e) =>
                  handleFieldChange(index, "title", e.target.value)
                }
                onBlur={() => validate(item, index)}
              />
              {errors[index]?.title && (
                <p className="text-sm text-red-500">{errors[index].title}</p>
              )}
            </div>
            {syllabusList.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDelete(item._id, index)}
                className="text-red-500 h-[55px] hover:text-red-600 "
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Enter Description"
            value={item.description}
            onChange={(e) =>
              handleFieldChange(index, "description", e.target.value)
            }
            onBlur={() => validate(item, index)}
            className="h-32"
          />
          {errors[index]?.description && (
            <p className="text-sm text-red-500">{errors[index].description}</p>
          )}
        </div>
      ))}
      <div className="flex w-full justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="flex  items-center gap-2"
        >
          {saveTitle ? saveTitle : loading ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  );
}
