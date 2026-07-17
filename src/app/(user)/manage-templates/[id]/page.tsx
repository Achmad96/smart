import { getTemplateById } from '@/actions/template.actions';
import { getCategories } from '@/actions/category.actions';
import { notFound } from 'next/navigation';
import TemplateEditor from './TemplateEditor';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await getCategories();
  
  // Handle 'new' as a special case
  if (id === 'new') {
    return <TemplateEditor template={null} categories={categories} />;
  }

  const template = await getTemplateById(id);
  if (!template) notFound();

  return <TemplateEditor template={template} categories={categories} />;
}
