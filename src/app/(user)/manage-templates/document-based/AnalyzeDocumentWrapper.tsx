'use client';

import dynamic from 'next/dynamic';

const AnalyzeDocumentClient = dynamic(() => import('./AnalyzeDocumentClient'), { ssr: false });

export default function AnalyzeDocumentWrapper({ categories }: { categories: any[] }) {
  return <AnalyzeDocumentClient categories={categories} />;
}
