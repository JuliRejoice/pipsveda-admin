"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, ArrowLeft, MoreVertical, CalendarPlus } from "lucide-react";
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

interface CourseSessionsProps {
  params: { courseId: string };
  courseName: string;
}

export default function CourseSessions({ params, courseName: initialCourseName = "" }: CourseSessionsProps) {
  const [courseName, setCourseName] = useState(initialCourseName);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    sessionName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00 - 10:00",
    meetingLink: "",
    image: null as File | null,
    courseId: params.courseId,
  });

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

    try {
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (selectedSession) {
        // Update existing session
        const response = await updateSession(selectedSession._id, formDataToSend);

        if (response.success) {
          toast.success("Session updated successfully");
          await fetchSessions(); // Reload sessions after update
        } else {
          throw new Error(response.message || "Failed to update session");
        }
      } else {
        // Create new session
        const response = await createSession(formDataToSend);

        if (response.success) {
          toast.success("Session created successfully");
          await fetchSessions(); // Reload sessions after create
        } else {
          throw new Error(response.message || "Failed to create session");
        }
      }

      // Reset form
      setIsAddDialogOpen(false);
      setSelectedSession(null);
      setFormData({
        sessionName: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
        meetingLink: "",
        image: null,
        courseId: params.courseId,
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save session");
    }
  };

  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      const response = await deleteSession(selectedSession._id);

      if (response.success) {
        toast.success("Session deleted successfully");
        await fetchSessions(); // Reload sessions after delete
      } else {
        throw new Error(response.message || "Failed to delete session");
      }

      setIsDeleteDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete session");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, image: file }));

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = (session: Session) => {
    setSelectedSession(session);
    setFormData({
      sessionName: session.sessionName,
      description: session.description,
      date: session.date,
      time: session.time,
      meetingLink: session.meetingLink,
      image: null,
      courseId: params.courseId, // Use courseId from URL params instead of session object
    });

    if (session.image) {
      setImagePreview(session.image);
    } else {
      setImagePreview(null);
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
        <Button onClick={() => setIsAddDialogOpen(true)}>
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
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded" onClick={() => openEditDialog(session)}>
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
                            <img src={session.sessionVideo} alt={session.sessionVideo} className="w-24 h-24 object-cover rounded-md border border-gray-200 hover:opacity-80 transition" />
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedSession ? "Edit Session" : "Add New Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Name</label>
              <Input value={formData.sessionName} onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })} placeholder="Session name" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Session description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Input type="text" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} placeholder="e.g., 09:00 - 10:00" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <Input value={formData.meetingLink} onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." type="url" required />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{selectedSession ? "Update Session" : "Create Session"}</Button>
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
          <p>Are you sure you want to delete this session? This action cannot be undone.</p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
