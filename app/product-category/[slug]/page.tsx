import { fetchCategoryBySlug, fetchCategories } from "@/lib/woocommerce";
import CategoryPageClient from "@/components/CategoryPageClient";
import { BreadcrumbStructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";

// Generate metadata for category pages
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const category = await fetchCategoryBySlug(slug).catch(() => null);
	
	if (!category) {
		return {
			title: "Category Not Found",
		};
	}

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
	
	return {
		title: category.name,
		description: category.description 
			? category.description.replace(/<[^>]*>/g, '').substring(0, 160)
			: `Browse ${category.name} products at our store`,
		openGraph: {
			title: `${category.name} | WooCommerce Store`,
			description: category.description 
				? category.description.replace(/<[^>]*>/g, '').substring(0, 160)
				: `Browse ${category.name} products`,
			type: "website",
			url: `${siteUrl}/product-category/${slug}`,
		},
		twitter: {
			card: "summary_large_image",
			title: category.name,
			description: category.description 
				? category.description.replace(/<[^>]*>/g, '').substring(0, 160)
				: `Browse ${category.name} products`,
		},
		alternates: {
			canonical: `/product-category/${slug}`,
		},
	};
}


export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const category = await fetchCategoryBySlug(slug).catch(() => null);

	// Breadcrumb items for structured data
	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Shop', href: '/shop' },
		{ label: category?.name || 'Category' },
	];

	return (
		<>
			{/* Structured Data for SEO */}
			{category && <BreadcrumbStructuredData items={breadcrumbItems} />}
			
			<CategoryPageClient 
				initialSlug={slug}
				initialCategoryName={category?.name}
			/>
		</>
	);
}
