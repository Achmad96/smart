import { getCategories, seedDefaultCategories } from "@/actions/category.actions";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function ManageCategoriesPage() {
  let categories = await getCategories();
  
  if (categories.length === 0) {
    await seedDefaultCategories();
    categories = await getCategories();
  }

  return <CategoriesClient initialCategories={categories} />;
}
