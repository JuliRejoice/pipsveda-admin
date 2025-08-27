'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, ArrowLeft, Video, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createChapter, updateChapter, deleteChapter, getChapters } from '@/components/api/course';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { MoreVertical } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Chapter {
    _id: string;
    chapterName: string; // new
    title?: string; // keep for backward compatibility
    description: string;
    duration: string; // changed from number to string
    videoUrl: string;
    chapterVideo?: string; // add this for YouTube links
    chapterNo: string; // changed from number to string
    order?: number; // keep for backward compatibility
    courseId: string | {
        _id: string;
        CourseName: string;
        hours: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface CourseChaptersProps {
    initialChapters: Chapter[];
    courseId: string;
    courseName?: string; // Add courseName prop
    loading?: boolean;
    setChapters?: (chapters: Chapter[]) => void;
    setLoading?: (loading: boolean) => void;
}

export function CourseChapters({ initialChapters, courseId, courseName, loading, setLoading, setChapters }: CourseChaptersProps) {
    const router = useRouter();
    const [isTabSwitching, setIsTabSwitching] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState<{
        chapterName: string;
        description: string;
        duration: string;
        videoUrl: string;
        chapterNo: string;
        image: File | null;
    }>({
        chapterName: '',
        description: '',
        duration: '',
        videoUrl: '',
        chapterNo: '',
        image: null,
    });

    const [errors, setErrors] = useState<{
        chapterName?: string;
        description?: string;
        duration?: string;
        videoUrl?: string;
        chapterNo?: string;
    }>({});

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};
        let isValid = true;

        if (!formData.chapterName.trim()) {
            newErrors.chapterName = 'Chapter name is required';
            isValid = false;
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
            isValid = false;
        }

        // Duration validation
        if (!formData.duration) {
            newErrors.duration = 'Duration is required';
            isValid = false;
        } else if (isNaN(Number(formData.duration))) {
            newErrors.duration = 'Duration must be a valid number';
            isValid = false;
        } else if (Number(formData.duration) <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
            isValid = false;
        } else if (Number(formData.duration) === 0) {
            newErrors.duration = 'Duration cannot be 0';
            isValid = false;
        }

        // Video URL validation
        if (!formData.videoUrl.trim()) {
            newErrors.videoUrl = 'Video URL is required';
            isValid = false;
        } else if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/.test(formData.videoUrl)) {
            newErrors.videoUrl = 'Please enter a valid URL';
            isValid = false;
        }

        // Chapter number validation
        if (!formData.chapterNo) {
            newErrors.chapterNo = 'Chapter number is required';
            isValid = false;
        } else if (isNaN(Number(formData.chapterNo)) || !Number.isInteger(Number(formData.chapterNo))) {
            newErrors.chapterNo = 'Chapter number must be a whole number';
            isValid = false;
        } else if (Number(formData.chapterNo) <= 0) {
            newErrors.chapterNo = 'Chapter number must be greater than 0';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };


    // Handle route changes and tab switching
    useEffect(() => {
        if (!router) return;

        // Trigger tab switching loader
        const handleRouteChange = () => {
            setIsTabSwitching(true);

            // Stop loader after short delay
            const timeout = setTimeout(() => {
                setIsTabSwitching(false);
            }, 500);

            return () => clearTimeout(timeout);
        };


    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        // Clear error when user types
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? (e.target as HTMLInputElement).files?.[0] || null : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const data = new FormData();            
            data.append('chapterName', formData.chapterName);
            data.append('description', formData.description);
            const durationValue = formData.duration ? String(Number(formData.duration)) : '';
            data.append('duration', durationValue);
            data.append('videoUrl', formData.videoUrl);
            data.append('chapterVideo', formData.videoUrl);
            data.append('chapterNo', formData.chapterNo);
            data.append('courseId', courseId);

            if (formData.image) {
                data.append('image', formData.image);
            }

            if (selectedChapter) {
                setIsUpdating(true);
                await updateChapter(selectedChapter._id, data);
                toast.success('Chapter updated successfully');
                const res = await getChapters(courseId);
                setChapters?.(res.payload?.data || []);
                router.refresh(); // Only refresh after success!
                setIsUpdating(false);
            } else {
                setIsCreating(true);
                await createChapter(data);
                toast.success('Chapter created successfully');
                const res = await getChapters(courseId);
                setChapters?.(res.payload?.data || []);
                router.refresh();
                setIsCreating(false);
            }
            setIsAddDialogOpen(false);
            setSelectedChapter(null);
            setFormData({ chapterName: '', description: '', duration: '', videoUrl: '', chapterNo: '', image: null });
        } catch (error) {
            console.error('Error saving chapter:', error);
            toast.error('Failed to save chapter');
            setIsCreating(false);
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedChapter) return;
        setIsDeleting(true);
        try {
            await deleteChapter(selectedChapter._id);
            toast.success('Chapter deleted successfully');
            const res = await getChapters(courseId);
            setChapters?.(res.payload?.data || []);

            router.refresh();
            setIsDeleteDialogOpen(false);
            setSelectedChapter(null);
            setIsDeleting(false);
        } catch (error) {
            console.error('Error deleting chapter:', error);
            toast.error('Failed to delete chapter');
            setIsDeleting(false);
        }
    };

    const openEditDialog = (chapter: Chapter) => {
        setSelectedChapter(chapter);
                   
        setFormData({
            chapterName: chapter.chapterName || chapter.title || '',
            description: chapter.description,
            duration: typeof chapter.courseId === 'string' ? '' : chapter.courseId.hours.toString(),
            videoUrl: chapter.videoUrl || chapter.chapterVideo || '',
            chapterNo: String(chapter.chapterNo || chapter.order || ''),
            image: null,
        });
        setErrors({});
        setIsAddDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-center items-center min-h-[70vh]">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
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
            <Button onClick={() => {
                setSelectedChapter(null);
                setFormData({
                    chapterName: '',
                    description: '',
                    duration: '',
                    videoUrl: '',
                    chapterNo: '',
                    image: null,
                });
                setErrors({});
                setIsAddDialogOpen(true);
            }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Chapter
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">
                    {courseName || (initialChapters[0]?.courseId && typeof initialChapters[0].courseId === 'object'
                        ? initialChapters[0].courseId.CourseName
                        : 'Course Chapters')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isTabSwitching ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : initialChapters.length === 0 && !loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No chapters found for this course.</p>
                        <p className="mt-2">Click the "Add Chapter" button to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {initialChapters
                            .sort((a, b) => {
                                const aNo = typeof a.chapterNo === 'number' ? a.chapterNo : typeof a.order === 'number' ? a.order : 0;
                                const bNo = typeof b.chapterNo === 'number' ? b.chapterNo : typeof b.order === 'number' ? b.order : 0;
                                return aNo - bNo;
                            })
                            .map((chapter) => {
                                // Helper for YouTube thumbnail
                                const url =
                                    typeof chapter.chapterVideo === 'string' && chapter.chapterVideo.length > 0
                                        ? chapter.chapterVideo
                                        : typeof chapter.videoUrl === 'string'
                                            ? chapter.videoUrl
                                            : '';
                                let videoId: string | null = null;
                                if (typeof url === 'string' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
                                    const match = url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                                    videoId = match ? match[1] : null;
                                }
                                return (
                                    <Card key={chapter._id} className="flex flex-col h-full relative">
                                        <CardContent className="p-4 flex flex-col flex-1">
                                            {/* Popover for Edit/Delete */}
                                            <div className="absolute top-2 right-2 z-10">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="p-1 rounded-full hover:bg-gray-200 focus:outline-none">
                                                            <MoreVertical className="h-5 w-5 text-gray-500" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" className="w-32 p-1">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                                                            onClick={() => openEditDialog(chapter)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                                                            onClick={() => {
                                                                setSelectedChapter(chapter);
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
                                                    {videoId ? (
                                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                                alt="Video Thumbnail"
                                                                className="w-24 h-24 object-cover rounded-md border border-gray-200 hover:opacity-80 transition"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <Video className="h-6 w-6 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 max-w-[95%]">{chapter.chapterName}</h3>
                                                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mb-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">Chapter {chapter.chapterNo}</span>
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                            {new Date(chapter.createdAt).toLocaleDateString('en-GB', {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2 overflow-hidden text-ellipsis">
                                                        {chapter.description}
                                                    </p>
                                                    {url && (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-block mt-1 px-3 py-1 text-background bg-foreground rounded-sm text-xs font-medium transition"
                                                        >
                                                            ▶ Watch Video
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Chapter Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedChapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <div className="w-full">
                                <Input
                                    name="chapterName"
                                    value={formData.chapterName}
                                    onChange={handleInputChange}
                                    placeholder="Chapter title"
                                    className="w-full"
                                />
                                {errors.chapterName && (
                                    <p className="text-sm text-red-500 mt-1">{errors.chapterName}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <div className="w-full">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Chapter description"
                                    className="w-full p-2 border rounded-md min-h-[100px]"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Chapter No</label>
                                <div className="w-full">
                                    <Input
                                        name="chapterNo"
                                        value={formData.chapterNo}
                                        onChange={handleInputChange}
                                        placeholder="Chapter Number"
                                        className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        type="number"
                                        onKeyDown={(e) => {
                                            if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+' || e.key === '.') {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {errors.chapterNo && (
                                        <p className="text-sm text-red-500 mt-1">{errors.chapterNo}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                                <div className="w-full">
                                    <Input
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="Duration (in hours)"
                                        className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        type="number"
                                        onKeyDown={(e) => {
                                            if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {errors.duration && (
                                        <p className="text-sm text-red-500 mt-1">{errors.duration}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Video URL</label>
                            <div className="w-full">
                                <Input
                                    name="videoUrl"
                                    value={formData.videoUrl}
                                    onChange={handleInputChange}
                                    placeholder="Video URL"
                                    className="w-full"
                                />
                                {errors.videoUrl && (
                                    <p className="text-sm text-red-500 mt-1">{errors.videoUrl}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating || isUpdating}>
                                {isCreating || isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isCreating ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : selectedChapter ? 'Update Chapter' : 'Create Chapter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Chapter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>Are you sure you want to delete this chapter? This action cannot be undone.</AlertDescription>
                        </Alert>
                        <div className="flex justify-end space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
