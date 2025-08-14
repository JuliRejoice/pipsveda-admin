"use client";
import { getChapters } from '@/components/api/course';
import React, { useEffect, useState } from 'react'
import { Chapter, CourseChapters } from '../course-chapters';


export default function CourseClientWrapper({ courseId }: { courseId: string }) {
    const [chapterData, setChapterData] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(false);
    const getChaptersService = async (courseId: string) => {
        try {
            setLoading(true);
            const response = await getChapters(courseId);
            return response.payload?.data || [];
        }
        catch (error) {
            console.error('Error fetching chapters:', error);
            return [];
        }
    }
    useEffect(() => {
        const fetchChapters = async () => {
            const chapters = await getChaptersService(courseId);
            setChapterData(chapters);
            setLoading(false);
        }
        fetchChapters();
    }, [courseId]);
    return (
        <CourseChapters
            initialChapters={chapterData}
            setChapters={setChapterData}
            courseId={courseId}
            loading={loading}
            setLoading={setLoading}
        />
    )
}
