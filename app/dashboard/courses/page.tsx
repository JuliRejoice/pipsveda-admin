'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Play, MapPin, Edit, Trash2, MoreVertical, Video, Link as LinkIcon, UploadCloud, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleUI, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createCourse, getCourses, updateCourse, deleteCourse } from '@/components/api/course';
import React from 'react';
import {
    Dialog as ConfirmDialog,
    DialogContent as ConfirmDialogContent,
    DialogHeader as ConfirmDialogHeader,
    DialogTitle as ConfirmDialogTitle,
    DialogFooter as ConfirmDialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { Course } from '@/components/api/course';

export default function Courses() {
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('recorded');
    const [isTabSwitching, setIsTabSwitching] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Date states...
    const [recordedStartDate, setRecordedStartDate] = useState<Date | undefined>();
    const [recordedEndDate, setRecordedEndDate] = useState<Date | undefined>();
    const [liveStartDate, setLiveStartDate] = useState<Date | undefined>();
    const [liveEndDate, setLiveEndDate] = useState<Date | undefined>();
    const [physicalStartDate, setPhysicalStartDate] = useState<Date | undefined>();
    const [physicalEndDate, setPhysicalEndDate] = useState<Date | undefined>();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    // Add error state
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Add this validation function at the top level of the component
    const validateForm = (formData: FormData, courseType: string) => {
        const errors: Record<string, string> = {};
        
        // Common validations for all course types
        const name = formData.get('name')?.toString().trim() || '';
        const description = formData.get('description')?.toString().trim() || '';
        const instructor = formData.get('instructor')?.toString().trim() || '';
        
        if (!name) {
            errors.name = 'Course name is required';
        } else if (name.length < 5) {
            errors.name = 'Course name must be at least 5 characters';
        }

        if (!description) {
            errors.description = 'Description is required';
        } else if (description.length < 20) {
            errors.description = 'Description must be at least 20 characters';
        }

        if (!instructor) {
            errors.instructor = 'Instructor name is required';
        }

        // Validate price
        const price = parseFloat(formData.get('price')?.toString() || '0');
        if (isNaN(price) || price < 0) {
            errors.price = 'Please enter a valid price';
        }

        // Validate dates
        const startDate = formData.get('startDate')?.toString();
        const endDate = formData.get('endDate')?.toString();
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.dateRange = 'End date must be after start date';
        }

        // Course type specific validations
        // if (courseType === 'recorded') {
        //     if (!formData.get('courseVideo')?.toString().trim() && !editCourse?.courseVideo) {
        //         errors.courseVideo = 'Course video URL is required';
        //     } else if (formData.get('courseVideo') && !isValidUrl(formData.get('courseVideo')?.toString() || '')) {
        //         errors.courseVideo = 'Please enter a valid URL';
        //     }
        // }

        if (courseType === 'live') {
            if (!formData.get('zoomLink')?.toString().trim() && !editCourse?.meetingLink) {
                errors.zoomLink = 'Zoom meeting link is required';
            } else if (formData.get('zoomLink') && !isValidUrl(formData.get('zoomLink')?.toString() || '')) {
                errors.zoomLink = 'Please enter a valid Zoom URL';
            }
        }

        if (courseType === 'physical') {
            if (!formData.get('location')?.toString().trim()) {
                errors.location = 'Location is required';
            }
            if (!formData.get('address')?.toString().trim()) {
                errors.address = 'Address is required';
            }
        }

        return errors;
    };

    // Add this URL validation helper function
    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Fetch courses with pagination and filtering
    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching courses with params:', {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                courseType: activeTab
            });

            const response = await getCourses({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                courseType: activeTab
            });

            console.log('API Response:', response);

            if (response && response.success) {
                const { data, count } = response.payload;

                setCourses(data || []);
                setTotalItems(count || 0);
                setTotalPages(Math.ceil((count || 0) / itemsPerPage));

                console.log('Updated state:', {
                    coursesCount: data?.length || 0,
                    totalItems: count || 0,
                    totalPages: Math.ceil((count || 0) / itemsPerPage)
                });
            } else {
                console.error('API Response indicates failure:', response);
                setError(response?.message || 'Failed to load courses');
            }
        } catch (err: any) {
            console.error('Error in fetchCourses:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError('Failed to load courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Pagination state changed:', {
            currentPage,
            itemsPerPage,
            totalItems,
            totalPages,
            coursesCount: courses.length
        });
    }, [currentPage, itemsPerPage, totalItems, totalPages, courses]);

    // Fetch courses when pagination or filters change
    useEffect(() => {
        fetchCourses();
    }, [currentPage, itemsPerPage, searchTerm, activeTab]);

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const getYoutubeThumbnail = (url: string) => {
        const match = url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    };

    const handleDeleteCourse = async (id: string) => {
        setDeleteDialogOpen(false);
        try {
            const data = await deleteCourse(id);
            if (data.success) {
                toast.success('Course deleted successfully', {
                    description: data?.message || 'The course has been deleted.',
                });
                // Refresh course list
                const refreshed = await getCourses();
                setCourses(refreshed.payload.data);
            } else {
                toast.error('Failed to delete course', {
                    description: data?.message || 'An error occurred.',
                });
            }
        } catch (err) {
            toast.error('API error', {
                description: err instanceof Error ? err.message : 'An error occurred.',
            });
        }
    };

    const CourseCard = ({ course }: { course: any }) => {
        const [popoverOpen, setPopoverOpen] = useState(false);

        return (
            <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative aspect-video bg-background">
                    {course.courseVideo ? (
                        <img
                            src={course.courseVideo}
                            alt={course.CourseName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Image className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                </div>
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-medium text-lg line-clamp-2">
                                <Link href={`/dashboard/courses/${course._id}`} className="hover:underline cursor-pointer">
                                    {course.CourseName}
                                </Link>
                            </h3>
                            <div className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden text-ellipsis">
                                {course.description}
                            </div>
                        </div>
                        <DropdownMenu open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={e => {
                                    e.stopPropagation();
                                    setEditCourse(course);
                                    setOpen(true);
                                    setPopoverOpen(false);
                                }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                        setCourseToDelete(course);
                                        setDeleteDialogOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                            ${course.price || '0'}
                        </span>
                        <Badge variant="outline" className="capitalize">
                            {course.courseType}
                        </Badge>
                    </div>


                    <div className="text-sm text-muted-foreground font-bold">
                        {course.courseStart ? format(new Date(course.courseStart), 'MMM d, yyyy') : 'No start date'}
                        {course.courseEnd ? ` - ${format(new Date(course.courseEnd), 'MMM d, yyyy')}` : ''}
                    </div>
                 
                        <div className="flex items-center text-sm text-muted-foreground">
                            <span className="font-bold">Instructor:</span>
                            <span className="ml-1">{course.instructor || "John Doe"}</span>
                        </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">

                            <span className="ml-1 capitalize">{course.language || 'English'} | Rating 4.6 | 100 Students</span>
                        </div>

                    </div>


                    {course.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{course.location}</span>
                        </div>
                    )}


                </CardContent>
            </Card>
        );
    };

    async function handleCourseSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const courseType = formData.get('courseType');
        
        // Validate form
        const errors = validateForm(formData, courseType?.toString() || '');
        setFormErrors(errors);
        
        // If there are errors, stop submission
        if (Object.keys(errors).length > 0) {
            toast.error('Please fix the form errors');
            return;
        }

        // Build the payload object with correct keys
        const CourseName = formData.get('name') || '';
        const description = formData.get('description') || '';
        const price = formData.get('price') || '';
        const courseStart = formData.get('startDate') || '';
        const courseEnd = formData.get('endDate') || '';
        const meetingLink = formData.get('zoomLink') || '';
        const location = formData.get('location') || '';
        const instructor = formData.get('instructor') || '';
        const language = formData.get('language') || 'english';

        const courseTypeValue = courseType ? String(courseType) : '';
        const payload: Record<string, any> = {
            CourseName,
            description,
            price,
            courseStart,
            courseEnd,
            meetingLink,
            location,
            instructor,
            language,
            courseType: courseTypeValue,
            // image: (add file upload later)
        };

        console.log('Submitting payload:', payload); // For debugging

        try {
            let data;
            if (editCourse && editCourse._id) {
                // Update existing course
                data = await updateCourse(editCourse._id, payload);
            } else {
                // Create new course
                data = await createCourse(payload);
            }

            if (data.success) {
                setOpen(false);
                setEditCourse(null);
                toast.success(editCourse ? 'Course updated successfully' : 'Course created successfully', {
                    description: data?.message || (editCourse ? 'The course has been updated.' : 'The course has been created.'),
                });
                // Refresh course list
                const refreshed = await getCourses();
                setCourses(refreshed.payload.data);
            } else {
                toast.error(editCourse ? 'Failed to update course' : 'Failed to create course', {
                    description: data?.message || 'An error occurred.',
                });
            }
        } catch (err) {
            toast.error('API error', {
                description: err instanceof Error ? err.message : 'An error occurred.',
            });
        }
    }

    const handleTabChange = (value: string) => {
        setIsTabSwitching(true);
        setActiveTab(value);
        setTimeout(() => {
            setIsTabSwitching(false);
        }, 500);
    };

    const renderCourseList = (courses: any[], emptyMessage: string) => {
        if (loading) {
            return (
                <div className="flex justify-center items-center min-h-[70vh] items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
            );
        } else if (error) {
            return <div className="text-red-500">{error}</div>;
        } else {
            return (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {courses.map((course) => (
                        <CourseCard key={course._id || course.CourseName} course={course} />
                    ))}
                    {courses.length === 0 && <div className="col-span-full text-center text-gray-400">{emptyMessage}</div>}
                </div>
            );
        }
    };

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitleUI>
                            {editCourse ? `Edit ${editCourse.courseType?.charAt(0).toUpperCase() + editCourse.courseType?.slice(1)} Course` : 'Create Course'}
                        </DialogTitleUI>
                    </DialogHeader>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="recorded">Recorded</TabsTrigger>
                            <TabsTrigger value="live">Live</TabsTrigger>
                            <TabsTrigger value="physical">Physical</TabsTrigger>
                        </TabsList>
                        {/* Recorded Course Form */}
                        <TabsContent value="recorded">
                            <form className="space-y-4" onSubmit={handleCourseSubmit}>
                                <input type="hidden" name="courseType" value="recorded" />
                                <div>
                                    <label className="block font-medium mb-1">Course Intro Video</label>
                                    <Input type="file" accept="video/*" name="introVideo" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Name</label>
                                    <Input placeholder="Course Name" name="name" defaultValue={editCourse?.CourseName || ''} />
                                    {formErrors.name && <div className="text-red-500">{formErrors.name}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Description</label>
                                    <Input placeholder="Course Description" name="description" defaultValue={editCourse?.description || ''} />
                                    {formErrors.description && <div className="text-red-500">{formErrors.description}</div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium mb-1">Instructor Name</label>
                                        <Input placeholder="Instructor Name" name="instructor" defaultValue={editCourse?.instructor || ''} />
                                        {formErrors.instructor && <div className="text-red-500">{formErrors.instructor}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Language</label>
                                        <select
                                            name="language"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue={editCourse?.language || 'english'}
                                        >
                                            <option value="english">English</option>
                                            <option value="spanish">Spanish</option>
                                            <option value="french">French</option>
                                            <option value="german">German</option>
                                            <option value="hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Start and End Date in one row */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">Start Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {recordedStartDate ? (
                                                        format(recordedStartDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={recordedStartDate} onSelect={setRecordedStartDate} initialFocus />
                                            </PopoverContent>
                                            <input
                                                type="hidden"
                                                name="startDate"
                                                value={recordedStartDate ? format(recordedStartDate, 'yyyy-MM-dd') : ''}
                                            />
                                        </Popover>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">End Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {recordedEndDate ? (
                                                        format(recordedEndDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={recordedEndDate} onSelect={setRecordedEndDate} initialFocus />
                                            </PopoverContent>
                                            <input
                                                type="hidden"
                                                name="endDate"
                                                value={recordedEndDate ? format(recordedEndDate, 'yyyy-MM-dd') : ''}
                                            />
                                        </Popover>
                                    </div>
                                </div>
                                {formErrors.dateRange && <div className="text-red-500">{formErrors.dateRange}</div>}
                                <div>
                                    <label className="block font-medium mb-1">Course Price</label>
                                    <Input placeholder="Course Price" type="number" name="price" defaultValue={editCourse?.price || ''} />
                                    {formErrors.price && <div className="text-red-500">{formErrors.price}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Upload Videos (per module/chapter)</label>
                                    <Input type="file" accept="video/*" multiple name="videos" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{editCourse ? 'Update Course' : 'Create Recorded Course'}</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                        {/* Live Course Form */}
                        <TabsContent value="live">
                            <form className="space-y-4" onSubmit={handleCourseSubmit}>
                                <input type="hidden" name="courseType" value="live" />
                                <div>
                                    <label className="block font-medium mb-1">Course Intro Video</label>
                                    <Input type="file" accept="video/*" name="introVideo" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Name</label>
                                    <Input placeholder="Course Name" name="name" defaultValue={editCourse?.CourseName || ''} />
                                    {formErrors.name && <div className="text-red-500">{formErrors.name}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Description</label>
                                    <Input placeholder="Course Description" name="description" defaultValue={editCourse?.description || ''} />
                                    {formErrors.description && <div className="text-red-500">{formErrors.description}</div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium mb-1">Instructor Name</label>
                                        <Input placeholder="Instructor Name" name="instructor" defaultValue={editCourse?.instructor || ''} />
                                        {formErrors.instructor && <div className="text-red-500">{formErrors.instructor}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Language</label>
                                        <select
                                            name="language"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue={editCourse?.language || 'english'}
                                        >
                                            <option value="english">English</option>
                                            <option value="spanish">Spanish</option>
                                            <option value="french">French</option>
                                            <option value="german">German</option>
                                            <option value="hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Start and End Date in one row */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">Start Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {liveStartDate ? (
                                                        format(liveStartDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={liveStartDate} onSelect={setLiveStartDate} initialFocus />
                                            </PopoverContent>
                                            <input type="hidden" name="startDate" value={liveStartDate ? format(liveStartDate, 'yyyy-MM-dd') : ''} />
                                        </Popover>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">End Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {liveEndDate ? (
                                                        format(liveEndDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={liveEndDate} onSelect={setLiveEndDate} initialFocus />
                                            </PopoverContent>
                                            <input type="hidden" name="endDate" value={liveEndDate ? format(liveEndDate, 'yyyy-MM-dd') : ''} />
                                        </Popover>
                                    </div>
                                </div>
                                {formErrors.dateRange && <div className="text-red-500">{formErrors.dateRange}</div>}
                                {/* <div>
                  <label className="block font-medium mb-1">Date and Time</label>
                  <Input placeholder="e.g. 2024-01-20 10:00 AM" name="dateTime" />
                </div> */}
                                <div>
                                    <label className="block font-medium mb-1">Zoom Meeting Link</label>
                                    <Input placeholder="Zoom Meeting Link" name="zoomLink" defaultValue={editCourse?.meetingLink || ''} />
                                    {formErrors.zoomLink && <div className="text-red-500">{formErrors.zoomLink}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Upload Meeting Recording (post-session)</label>
                                    <Input type="file" accept="video/*" name="meetingRecording" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{editCourse ? 'Update Course' : 'Create Live Course'}</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                        {/* Physical Course Form */}
                        <TabsContent value="physical">
                            <form className="space-y-4" onSubmit={handleCourseSubmit}>
                                <input type="hidden" name="courseType" value="physical" />
                                <div>
                                    <label className="block font-medium mb-1">Course Intro Video</label>
                                    <Input type="file" accept="video/*" name="introVideo" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Name</label>
                                    <Input placeholder="Course Name" name="name" defaultValue={editCourse?.CourseName || ''} />
                                    {formErrors.name && <div className="text-red-500">{formErrors.name}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Course Description</label>
                                    <Input placeholder="Course Description" name="description" defaultValue={editCourse?.description || ''} />
                                    {formErrors.description && <div className="text-red-500">{formErrors.description}</div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium mb-1">Instructor Name</label>
                                        <Input placeholder="Instructor Name" name="instructor" defaultValue={editCourse?.instructor || ''} />
                                        {formErrors.instructor && <div className="text-red-500">{formErrors.instructor}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Language</label>
                                        <select
                                            name="language"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue={editCourse?.language || 'english'}
                                        >
                                            <option value="english">English</option>
                                            <option value="spanish">Spanish</option>
                                            <option value="french">French</option>
                                            <option value="german">German</option>
                                            <option value="hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Start and End Date in one row */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">Start Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {physicalStartDate ? (
                                                        format(physicalStartDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={physicalStartDate} onSelect={setPhysicalStartDate} initialFocus />
                                            </PopoverContent>
                                            <input
                                                type="hidden"
                                                name="startDate"
                                                value={physicalStartDate ? format(physicalStartDate, 'yyyy-MM-dd') : ''}
                                            />
                                        </Popover>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1">End Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left border rounded-md px-3 py-2 flex items-center gap-2"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    {physicalEndDate ? (
                                                        format(physicalEndDate, 'yyyy-MM-dd')
                                                    ) : (
                                                        <span className="text-gray-400">Pick a date</span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={physicalEndDate} onSelect={setPhysicalEndDate} initialFocus />
                                            </PopoverContent>
                                            <input
                                                type="hidden"
                                                name="endDate"
                                                value={physicalEndDate ? format(physicalEndDate, 'yyyy-MM-dd') : ''}
                                            />
                                        </Popover>
                                    </div>
                                </div>
                                {formErrors.dateRange && <div className="text-red-500">{formErrors.dateRange}</div>}
                                {/* <div>
                  <label className="block font-medium mb-1">Date and Time</label>
                  <Input placeholder="e.g. 2024-02-15 9:00 AM" name="dateTime" />
                </div> */}
                                <div>
                                    <label className="block font-medium mb-1">Location</label>
                                    <Input placeholder="Location" name="location" defaultValue={editCourse?.location || ''} />
                                    {formErrors.location && <div className="text-red-500">{formErrors.location}</div>}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Address</label>
                                    <Input placeholder="Address" name="address" defaultValue={editCourse?.address || ''} />
                                    {formErrors.address && <div className="text-red-500">{formErrors.address}</div>}
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{editCourse ? 'Update Course' : 'Create Physical Course'}</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <ConfirmDialogContent>
                    <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Delete Course</ConfirmDialogTitle>
                    </ConfirmDialogHeader>
                    <div>
                        Are you sure you want to delete <b>{courseToDelete?.CourseName}</b>? This action cannot be undone.
                    </div>
                    <ConfirmDialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => courseToDelete && handleDeleteCourse(courseToDelete._id)}>
                            Delete
                        </Button>
                    </ConfirmDialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>

            <div className="flex items-center justify-between space-x-2 p-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button
                    onClick={() => {
                        setEditCourse(null);
                        setOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4 px-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recorded" className="w-full">Recorded</TabsTrigger>
                    <TabsTrigger value="live" className="w-full">Live</TabsTrigger>
                    <TabsTrigger value="physical" className="w-full">Physical</TabsTrigger>
                </TabsList>

                {isTabSwitching ? (
                    <div className="flex justify-center items-center min-h-[70vh] items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <TabsContent value="recorded" className="space-y-4 pt-4">
                            {renderCourseList(courses.filter((c) => c.courseType?.toLowerCase() === 'recorded'), 'No recorded courses found.')}
                        </TabsContent>
                        <TabsContent value="live" className="space-y-4 pt-4">
                            {renderCourseList(courses.filter((c) => c.courseType?.toLowerCase() === 'live'), 'No live courses found.')}
                        </TabsContent>
                        <TabsContent value="physical" className="space-y-4 pt-4">
                            {renderCourseList(courses.filter((c) => c.courseType?.toLowerCase() === 'physical'), 'No physical courses found.')}
                        </TabsContent>
                    </>
                )}
            </Tabs>
            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                }}
                itemsPerPageOptions={[8, 10, 20, 30, 50]}
                className="border-t pt-4"
            />
        </div>
    );
}
