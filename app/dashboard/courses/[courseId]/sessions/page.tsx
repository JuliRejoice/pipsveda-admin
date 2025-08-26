"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, ArrowLeft, MoreVertical, CalendarPlus, Upload, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createSession, deleteSession, getSession, updateSession } from "@/components/api/course";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  _id: string;
  sessionName: string;
  description: string;
  date: string;
  time: string;
  meetingLink: string;
  sessionVideo?: string;
  image?: string;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

import { getCourses } from "@/components/api/course";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CourseSessionsProps {
  params: { courseId: string };
}

export default function CourseSessions({ params }: CourseSessionsProps) {
  const [courseName, setCourseName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    sessionName: "",
    description: "",
    date: "",
    time: "",
    meetingLink: "",
    image: null as File | null,
    courseId: params.courseId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionName.trim()) {
      newErrors.sessionName = "Session name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    // Time format validation (HH:MM - HH:MM)
    if (!formData.time) {
      newErrors.time = "Time is required";
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = "Please enter time in format HH:MM - HH:MM (e.g., 09:00 - 10:00)";
      } else {
        // Additional validation to ensure end time is after start time
        const [startTime, endTime] = formData.time.split(' - ');
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        if (endTotal <= startTotal) {
          newErrors.time = "End time must be after start time";
        }
      }
    }

    // URL validation
    if (!formData.meetingLink) {
      newErrors.meetingLink = "Meeting link is required";
    } else {
      try {
        const url = new URL(formData.meetingLink);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.meetingLink = "URL must start with http:// or https://";
        }
        if (!url.hostname.includes('.')) {
          newErrors.meetingLink = "Please enter a valid domain name";
        }
      } catch (e) {
        newErrors.meetingLink = "Please enter a valid URL (e.g., https://meet.google.com/abc-xyz)";
      }
    }

    if (!selectedSession && !formData.image && !imagePreview) {
      newErrors.image = "Image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Function to fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await getSession(params.courseId);

      if (response.success) {
        setSessions(response.payload.data);
      } else {
        throw new Error(response.message || "Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch course name if not provided
  useEffect(() => {
    const fetchCourseName = async () => {
      if (!courseName) {
        try {
          const response = await getCourses();
          const course = response.payload?.data?.find((c: any) => c._id === params.courseId);
          if (course) {
            setCourseName(course.CourseName);
          }
        } catch (error) {
          console.error("Error fetching course details:", error);
        }
      }
    };

    fetchCourseName();
    fetchSessions();
  }, [params.courseId, courseName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Always use the courseId from params to ensure it's a string
      const currentCourseId = typeof params.courseId === 'string' ? params.courseId : '';

      // Add all form fields to FormData
      Object.entries({
        ...formData,
        courseId: currentCourseId // Ensure courseId is always a string
      }).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (selectedSession) {
        // Update existing session
        const response = await updateSession(selectedSession._id, formDataToSend);

        if (response.success) {
          toast.success("Session updated successfully");
          await fetchSessions();
          setIsAddDialogOpen(false);
          setSelectedSession(null); // Clear the selected session after update
          return; // Exit early after update
        } else {
          throw new Error(response.message || "Failed to update session");
        }
      } else {
        // Create new session
        const response = await createSession(formDataToSend);

        if (response.success) {
          toast.success("Session created successfully");
          await fetchSessions();
          setIsAddDialogOpen(false); // Close the dialog after successful create
          return; // Exit early after create
        } else {
          throw new Error(response.message || "Failed to create session");
        }
      }

      // Reset form
      setFormData({
        sessionName: "",
        description: "",
        date: "",
        time: "",
        meetingLink: "",
        image: null,
        courseId: params.courseId,
      });
      setImagePreview(null);
      setSelectedSession(null);
      setErrors({});
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await deleteSession(selectedSession._id);

      if (response.success) {
        toast.success("Session deleted successfully");
        await fetchSessions(); // Reload sessions after delete
        setIsDeleteDialogOpen(false);
        setSelectedSession(null);
      } else {
        throw new Error(response.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Please upload a valid image (JPEG, PNG, or WebP)'
        }));
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: '' }));

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    setSelectedSession(null);
    setIsCreateMode(true);
    // Reset form data with proper courseId
    setFormData({
      sessionName: "",
      description: "",
      date: "",
      time: "",
      meetingLink: "",
      image: null,
      courseId: typeof params.courseId === 'string' ? params.courseId : '',
    });
    setImagePreview(null);
    setErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setIsCreateMode(false);
    setFormData({
      sessionName: session.sessionName,
      description: session.description,
      date: session.date.split('T')[0],
      time: session.time,
      meetingLink: session.meetingLink,
      image: null,
      courseId: session.courseId,
    });
    if (session.image) {
      setImagePreview(session.image);
    }
    setIsAddDialogOpen(true);
  };

  // Split time string into start and end times
  const parseTimeRange = (timeString: string) => {
    if (!timeString) return { start: "", end: "" };
    const [start, end] = timeString.split(" - ");
    return { start, end };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>
        <Button onClick={handleAddNew}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Add Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl font-bold tracking-tight">{courseName || "Sessions"}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No sessions yet</p>
                <p className="text-sm text-muted-foreground mb-4">Get started by adding your first session</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => (
                    <Card key={session._id} className="flex flex-col h-full relative">
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="absolute top-2 right-2 z-10">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-gray-200 focus:outline-none">
                                <MoreVertical className="h-5 w-5 text-gray-500" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-32 p-1">
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded" onClick={() => handleEdit(session)}>
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                                onClick={() => {
                                  setSelectedSession(session);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                Delete
                              </button>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg min-w-[25%] min-h-[56px] flex items-center justify-center">
                            <img src={session.sessionVideo} alt="Session Image" className="w-24 h-24 object-cover rounded-md border border-gray-200 hover:opacity-80 transition" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{session.sessionName}</h3>
                            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mb-1">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{new Date(session.date).toLocaleDateString("en-GB")}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{session.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2 overflow-hidden text-ellipsis">{session.description}</p>
                            {session.meetingLink && (
                              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-3 py-1 text-background bg-foreground rounded-sm text-xs font-medium transition">
                                ▶ Join Meeting
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Session Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedSession(null);
          setIsCreateMode(true);
        }
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? "Add New Session" : "Edit Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Name</label>
              <Input
                value={formData.sessionName}
                onChange={(e) => {
                  setFormData({ ...formData, sessionName: e.target.value });
                  if (errors.sessionName) setErrors(prev => ({ ...prev, sessionName: '' }));
                }}
                placeholder="Session name"
                className={errors.sessionName ? 'border-red-500' : ''}
              />
              {errors.sessionName && <p className="text-sm text-red-500 mt-1">{errors.sessionName}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                </div>
              )}
              {errors.image && <p className="text-sm text-red-500 mt-1">{errors.image}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Session description"
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-red-500' : ''
                  }`}
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => {
                        const dateString = date ? format(date, "yyyy-MM-dd") : "";
                        setFormData({ ...formData, date: dateString });
                        if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                        // Close the popover after selection
                        const popoverTrigger = document.querySelector('[aria-haspopup="dialog"][data-state="open"]:not([data-radix-popper-content-wrapper])') as HTMLElement;
                        if (popoverTrigger) popoverTrigger.click();
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time (HH:MM - HH:MM)</label>
                <Input
                  type="text"
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({ ...formData, time: e.target.value });
                    if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
                  }}
                  placeholder="e.g., 09:00 - 10:00"
                  className={errors.time ? 'border-red-500' : ''}
                />
                {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <Input
                value={formData.meetingLink}
                onChange={(e) => {
                  setFormData({ ...formData, meetingLink: e.target.value });
                  if (errors.meetingLink) setErrors(prev => ({ ...prev, meetingLink: '' }));
                }}
                placeholder="https://meet.google.com/..."
                type="url"
                className={errors.meetingLink ? 'border-red-500' : ''}
              />
              {errors.meetingLink && <p className="text-sm text-red-500 mt-1">{errors.meetingLink}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isCreateMode ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  isCreateMode ? "Create Session" : "Update Session"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive" className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <AlertDescription>Are you sure you want to delete this session? This action cannot be undone.</AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
