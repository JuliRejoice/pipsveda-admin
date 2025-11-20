"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  Video as VideoIcon,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createChapter, uploadImage } from "@/components/api/course";
import Image from "next/image";

interface Chapter {
  id?: string;
  chapterName: string;
  description: string;
  duration: string;
  videoFile: File | null;
  videoUrl: string;
  chapterNo: string;
  chapterImage: File | null;
  chapterImageUrl: string;
}

interface Props {
  courseId: any;
  onSuccess?: () => void;
  setChaptersList?: any;
}

export default function CustomChapterFormList({
  courseId,
  onSuccess,
  setChaptersList,
}: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: Date.now().toString(),
      chapterName: "",
      description: "",
      duration: "",
      videoFile: null,
      videoUrl: "",
      chapterNo: "",
      chapterImage: null,
      chapterImageUrl: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>(
    {}
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreviews, setVideoPreviews] = useState<Record<number, string>>(
    {}
  );

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement;

    // Handle video file upload with preview
    if (name === "videoFile" && type === "file" && files?.length) {
      const file = files[0];
      const videoUrl = URL.createObjectURL(file);
      setVideoPreviews((prev) => ({
        ...prev,
        [index]: videoUrl, // store preview for this index only
      }));
    }

    setChapters((prev) =>
      prev.map((ch, i) =>
        i === index
          ? {
              ...ch,
              [name]:
                type === "file" ? (files?.length ? files[0] : null) : value,
              ...(type === "file"
                ? { videoUrl: files?.[0] ? files[0].name : ch.videoUrl }
                : {}),
            }
          : ch
      )
    );
  };

  const handleImageUpload = async (file: File, index: number) => {
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      toast.error(
        "Invalid file format. Thumbnail must be an image (JPEG, JPG, PNG, or WebP)"
      );
      return;
    } else if (file.size >= 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setLoading(true);

      const response = await uploadImage(file);
      setImagePreview(URL.createObjectURL(file));

      if (!response.success) {
        throw new Error("Image upload failed");
      }
      const imageUrl = response.payload || "";

      setChapters((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          chapterImage: imageUrl,
        };
        return updated;
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, index);
    }
  };

  const handleAddChapter = () => {
    setChapters([
      ...chapters,
      {
        id: Date.now().toString(),
        chapterName: "",
        description: "",
        duration: "",
        videoFile: null,
        videoUrl: "",
        chapterNo: "",
        chapterImage: null,
        chapterImageUrl: "",
      },
    ]);
  };

  const handleDeleteChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const validateAllChapters = (): boolean => {
    let isValid = true;
    const newErrors: Record<number, Record<string, string>> = {};

    chapters.forEach((chapter, index) => {
      const chapterErrors: Record<string, string> = {};

      if (!chapter.chapterName.trim()) {
        chapterErrors.chapterName = "Chapter title is required";
        isValid = false;
      }

      if (!chapter.description.trim()) {
        chapterErrors.description = "Description is required";
        isValid = false;
      }

      if (!chapter.chapterNo) {
        chapterErrors.chapterNo = "Chapter number is required";
        isValid = false;
      } else if (
        isNaN(Number(chapter.chapterNo)) ||
        Number(chapter.chapterNo) <= 0
      ) {
        chapterErrors.chapterNo = "Chapter number must be a positive number";
        isValid = false;
      }

      if (!chapter.duration) {
        chapterErrors.duration = "Duration is required";
        isValid = false;
      } else if (
        isNaN(Number(chapter.duration)) ||
        Number(chapter.duration) <= 0
      ) {
        chapterErrors.duration = "Duration must be a positive number";
        isValid = false;
      }

      if (!chapter.videoFile && !chapter.videoUrl) {
        chapterErrors.videoFile =
          "Please upload a video file or provide a video URL";
        isValid = false;
      }

      if (Object.keys(chapterErrors).length > 0) {
        newErrors[index] = chapterErrors;
      }
    });

    setErrors(newErrors);

    // Scroll to first error if any
    if (!isValid) {
      const firstErrorIndex = Object.keys(newErrors)[0];
      if (firstErrorIndex) {
        const element = document.getElementById(`chapter-${firstErrorIndex}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please fix the validation errors before submitting");
    }

    return isValid;
  };

  const handleSubmitAll = async () => {
    if (!validateAllChapters()) {
      return;
    }
    setLoading(true);
    try {
      for (const chapter of chapters) {
        const data = new FormData();
        data.append("chapterName", chapter.chapterName);
        data.append("description", chapter.description);
        data.append("duration", chapter.duration);
        data.append("chapterNo", chapter.chapterNo);
        data.append("courseId", courseId);
        if (chapter.videoFile) data.append("image", chapter.videoFile);

        if (chapter.chapterImage) {
          data.append("chapterImage", chapter.chapterImage);
        }

        await createChapter(data);
      }

      toast.success("All chapters created successfully!");
      setChapters([
        {
          chapterName: "",
          description: "",
          duration: "",
          videoFile: null,
          videoUrl: "",
          chapterNo: "",
          chapterImage: null,
          chapterImageUrl: "",
        },
      ]);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating chapters:", error);
      toast.error("Failed to create chapters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
      <div className="flex justify-between items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Chapters</h2>
        <Button type="button" variant="default" onClick={handleAddChapter}>
          <Plus className="mr-2 h-4 w-4" /> Add Another Chapter
        </Button>
      </div>
      {chapters.map((chapter, index) => (
        <div
          key={index}
          id={`chapter-${index}`}
          className="p-4 border mb-8  rounded-lg space-y-4 relative"
        >
          {chapters.length > 1 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 text-red-500 hover:text-red-800"
              onClick={() => handleDeleteChapter(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          <div>
            <Label className="block text-sm mb-1">Chapter Title *</Label>
            <Input
              name="chapterName"
              value={chapter.chapterName}
              onChange={(e) => handleInputChange(index, e)}
              placeholder="Enter chapter title"
              className="text-md font-normal"
            />
            {errors[index]?.chapterName && (
              <p className="text-sm text-red-600 mt-1">
                {errors[index].chapterName}
              </p>
            )}
          </div>

          <div>
            <Label className="block text-sm mb-1">Description *</Label>
            <textarea
              name="description"
              value={chapter.description}
              onChange={(e) => handleInputChange(index, e)}
              className={`w-full p-2 border rounded-md resize-none ${
                errors[index]?.description ? "" : ""
              }`}
              placeholder="Enter chapter description"
              rows={3}
            />
            {errors[index]?.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors[index].description}
              </p>
            )}
          </div>
          <div className="w-full">
            <Label className="block text-sm mb-1">Chapter Thumbnail</Label>
            <div className="w-full mt-1">
              <div className="border border-dashed border-gray-300 rounded-md p-4">
                <div className="flex items-center space-x-4">
                  {chapter.chapterImage ? (
                    <div className="relative">
                      <Image
                        src={
                          imagePreview
                            ? imagePreview
                            : typeof chapter.chapterImage === "string"
                            ? chapter.chapterImage
                            : chapter.chapterImage instanceof File
                            ? URL.createObjectURL(chapter.chapterImage)
                            : ""
                        }
                        width={1000}
                        height={1000}
                        alt="Chapter thumbnail"
                        className="h-20 w-20 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          const updatedChapters = [...chapters];
                          updatedChapters[index] = {
                            ...updatedChapters[index],
                            chapterImage: null,
                          };
                          setChapters(updatedChapters);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {chapter.chapterImage
                        ? chapter.chapterImage.name
                        : "No thumbnail selected"}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`image-upload-${index}`}
                        name="chapterImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, index)}
                        className="hidden"
                      />
                      <Label
                        htmlFor={`image-upload-${index}`}
                        className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#6b4fd8] cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {chapter.chapterImage ? "Change" : "Upload"} Thumbnail
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {errors[index]?.chapterImage && (
              <p className="mt-1 text-sm text-red-600">
                {errors[index].chapterImage}
              </p>
            )}
          </div>
          <div className="w-full">
            <Label className="block text-sm mb-1">Video File *</Label>
            <div className="w-full">
              <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                <div className="flex items-center space-x-4">
                  {chapter.videoFile || videoPreviews[index] ? (
                    <div className="relative">
                      <video
                        key={index}
                        src={
                          videoPreviews[index]
                            ? videoPreviews[index]
                            : chapter.videoUrl
                        }
                        className="h-20 w-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        muted
                        onMouseEnter={(e) => {
                          const video = e.currentTarget;
                          video.currentTime = 1;
                        }}
                        onClick={() => {
                          window.open(chapter.videoUrl, "_blank");
                        }}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          const updatedChapters = [...chapters];
                          updatedChapters[index] = {
                            ...updatedChapters[index],
                            videoFile: null,
                          };
                          setChapters(updatedChapters);
                          const input = document.getElementById(
                            `video-upload-${index}`
                          ) as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                      >
                        <Trash2 className=" text-white h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
                      <VideoIcon className="h-6 w-6" />
                    </div>
                  )}

                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 text-start">
                      {chapter.videoFile
                        ? chapter.videoFile.name
                        : chapter.videoUrl
                        ? "Using video URL"
                        : "No video file selected"}
                    </p>
                    {/* File Input */}
                    <Input
                      type="file"
                      name="videoFile"
                      id={`video-upload-${index}`}
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => handleInputChange(index, e)}
                      className="hidden"
                    />
                    <div className="mt-2 flex items-center">
                      <Label
                        htmlFor={`video-upload-${index}`}
                        className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white gradient-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {chapter.videoFile ? "Change Video" : "Upload Video"}
                      </Label>
                    </div>
                  </div>
                </div>
                {/* Remove button if file is selected */}
              </div>

              {(errors[index]?.videoFile || errors[index]?.videoUrl) && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[index].videoFile || errors[index].videoUrl}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm mb-1">Chapter No *</Label>
              <Input
                name="chapterNo"
                type="number"
                value={chapter.chapterNo}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="1"
                min={1}
                className={errors[index]?.chapterNo ? "" : ""}
              />
              {errors[index]?.chapterNo && (
                <p className="text-sm text-red-600 mt-1">
                  {errors[index].chapterNo}
                </p>
              )}
            </div>
            <div>
              <Label className="block text-sm mb-1">Duration (hours) *</Label>
              <Input
                name="duration"
                type="number"
                value={chapter.duration}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="e.g. 2"
                min={0.5}
                step={0.5}
                className={errors[index]?.duration ? "" : ""}
              />
              {errors[index]?.duration && (
                <p className="text-sm text-red-600 mt-1">
                  {errors[index].duration}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 bg-background pt-4 border-t flex justify-end">
        <Button onClick={handleSubmitAll} disabled={loading} className="">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save All Chapters"
          )}
        </Button>
      </div>
    </div>
  );
}
