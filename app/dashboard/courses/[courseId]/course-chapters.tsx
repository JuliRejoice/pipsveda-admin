'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, ArrowLeft, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createChapter, updateChapter, deleteChapter, getChapters } from '@/components/api/course';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { MoreVertical } from 'lucide-react';

export interface Chapter {
    _id: string;
    chapterName: string; // new
    title?: string; // keep for backward compatibility
    description: string;
    duration: number;
    videoUrl: string;
    chapterVideo?: string; // add this for YouTube links
    chapterNo: number; // new
    order?: number; // keep for backward compatibility
    courseId: string | {
        _id: string;
        CourseName: string;
        // other course properties...
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

export function CourseChapters({ initialChapters, courseId, courseName, loading, setLoading,setChapters }: CourseChaptersProps) {
    const router = useRouter();
    const [isTabSwitching, setIsTabSwitching] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [formData, setFormData] = useState<{
        chapterName: string;
        description: string;
        duration: number;
        videoUrl: string;
        chapterNo: number;
        image: File | null;
    }>({
        chapterName: '',
        description: '',
        duration: 0,
        videoUrl: '',
        chapterNo: 0,
        image: null,
    });


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
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'file'
                    ? (e.target as HTMLInputElement).files?.[0] || null
                    : name === 'duration' || name === 'chapterNo'
                        ? Number(value)
                        : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('chapterName', formData.chapterName);
            data.append('description', formData.description);
            data.append('duration', String(formData.duration));
            data.append('videoUrl', formData.videoUrl);
            data.append('chapterNo', String(formData.chapterNo));
            data.append('courseId', courseId);
            
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (selectedChapter) {
                await updateChapter(selectedChapter._id, data);
                toast.success('Chapter updated successfully');
                const res=await getChapters(courseId);
                setChapters?.(res.payload?.data || []);
                router.refresh(); // Only refresh after success!
            } else {
                await createChapter(data);
                toast.success('Chapter created successfully');
                const res=await getChapters(courseId);
                setChapters?.(res.payload?.data || []);
                router.refresh();
            }
            setIsAddDialogOpen(false);
            setSelectedChapter(null);
            setFormData({ chapterName: '', description: '', duration: 0, videoUrl: '', chapterNo: 0, image: null });
        } catch (error) {
            console.error('Error saving chapter:', error);
            toast.error('Failed to save chapter');
            // Do NOT call router.refresh() here!
        }
    };

    const handleDelete = async () => {
        if (!selectedChapter) return;
        try {
            await deleteChapter(selectedChapter._id);
            toast.success('Chapter deleted successfully');
            const res=await getChapters(courseId);
            setChapters?.(res.payload?.data || []);
           
            router.refresh();
            setIsDeleteDialogOpen(false);
            setSelectedChapter(null);
        } catch (error) {
            console.error('Error deleting chapter:', error);
            toast.error('Failed to delete chapter');
        }
    };

    const openEditDialog = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setFormData({
            chapterName: chapter.chapterName || chapter.title || '',
            description: chapter.description,
            duration: chapter.duration,
            videoUrl: chapter.videoUrl,
            chapterNo: chapter.chapterNo || chapter.order || 0,
            image: null,
        });
        setIsAddDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-center items-center min-h-[70vh] items-center">
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
                        duration: 0,
                        videoUrl: '',
                        chapterNo: 0,
                        image: null,
                    });
                    setIsAddDialogOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Chapter
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle><h2 className="text-2xl font-bold tracking-tight">
                        {courseName || (initialChapters[0]?.courseId && typeof initialChapters[0].courseId === 'object'
                            ? initialChapters[0].courseId.CourseName
                            : 'Course Chapters')}
                    </h2></CardTitle>
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
                                                        <h3 className="font-semibold text-lg mb-1">{chapter.chapterName}</h3>
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
                            <Input
                                name="chapterName"
                                value={formData.chapterName}
                                onChange={handleInputChange}
                                placeholder="Chapter title"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Chapter description"
                                className="w-full border rounded-md p-2 text-sm min-h-[80px]"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Chapter No</label>
                                <Input
                                    type="number"
                                    name="chapterNo"
                                    value={formData.chapterNo}
                                    onChange={handleInputChange}
                                    placeholder="Display order"
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                                <Input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="Duration in minutes"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Video URL</label>
                            <Input
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleInputChange}
                                placeholder="https://example.com/video"
                                type="url"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{selectedChapter ? 'Update' : 'Create'} Chapter</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Chapter</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this chapter? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
