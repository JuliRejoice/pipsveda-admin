"use client";
import { getChapters } from '@/components/api/course';
import React, { useEffect, useState } from 'react'
import { CourseChapters } from '../course-chapters';

export default function CourseClientWrapper({ courseId }: { courseId: string }) {
    const [chapterData, setChapterData] = useState([]);
    const getChaptersService = async (courseId: string) => {
        try {
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
        }
        fetchChapters();
    }, [courseId]);
    return (
        <CourseChapters
            initialChapters={chapterData}
            courseId={courseId}
        />
    )
}
