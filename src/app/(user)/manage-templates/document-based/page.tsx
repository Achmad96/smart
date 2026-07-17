import { Suspense } from 'react';
import AnalyzeDocumentWrapper from './AnalyzeDocumentWrapper';
import { getCategories } from '@/actions/category.actions';

export const dynamic = 'force-dynamic';

export default async function AnalyzeDocumentPage() {
  const categories = await getCategories();
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AnalyzeDocumentWrapper categories={categories} />
    </Suspense>
  );
}
