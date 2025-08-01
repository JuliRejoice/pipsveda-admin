import { notFound } from 'next/navigation';
import { getChapters, getCourses } from '@/components/api/course';
import { CourseChapters } from './course-chapters';
import { use, useEffect, useState } from 'react';
import CourseClientWrapper from './_components/course-client-wrapper';

// Add metadata for the page
export const metadata = {
  title: 'Courses',
};

interface PageProps {
  params: { courseId: string }
}

// This function generates the static params at build time
export async function generateStaticParams() {
  try {
    const response = await getCourses();

    const courses = response.payload?.data || [];
    return courses.map((course: any) => ({
      courseId: course._id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function CourseChaptersPage({ params }: PageProps) {
  const { courseId } = params;

  return (
    <CourseClientWrapper courseId={courseId} />
  );
}

