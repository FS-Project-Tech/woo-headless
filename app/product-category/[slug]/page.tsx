import { fetchCategoryBySlug } from "@/lib/woocommerce";
import CategoryPageClient from "@/components/CategoryPageClient";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const category = await fetchCategoryBySlug(slug).catch(() => null);

	return (
		<CategoryPageClient 
			initialSlug={slug}
			initialCategoryName={category?.name}
		/>
	);
}
