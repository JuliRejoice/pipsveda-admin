'use client';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useCallback } from 'react';

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-md"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    // ['link', 'image'],
    ['clean'],
    // [{ 'color': [] }, { 'background': [] }],
    // ['blockquote', 'code-block'],
    // ['align', 'direction'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  // 'link', 'image',
  // 'color', 'background',
  // 'blockquote', 'code-block',
  // 'align', 'direction'
];

export default function RichTextEditor({ value, onChange, className = '' }: RichTextEditorProps) {
  const handleChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        className="bg-background rounded-md"
      />
      <style jsx global>{`
        .ql-container {
          min-height: 200px;
          font-size: 1rem;
        }
        .ql-toolbar {
          border-radius: 0.375rem 0.375rem 0 0;
          background-color: #f9fafb;
        }
        .ql-container {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        .ql-editor {
          min-height: 150px;
        }
      `}</style>
    </div>
  );
}
