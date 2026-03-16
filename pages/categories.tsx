import DefaultLayout from "@/layouts/default";
import { CategoryList } from "@/features/category-list";

export default function CategoriesPage() {
  return (
    <DefaultLayout>
      <CategoryList />
    </DefaultLayout>
  );
}
