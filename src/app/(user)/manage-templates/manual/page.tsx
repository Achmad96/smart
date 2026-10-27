import TemplateEditor from "../[id]/TemplateEditor";
import { getCategories } from "@/actions/category.actions";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const categories = await getCategories();
  return <TemplateEditor template={null} categories={categories} />;
}
