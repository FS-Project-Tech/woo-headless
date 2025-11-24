import wcAPI, { fetchProductBySlug, fetchProductVariations, fetchProducts, WooCommerceVariation } from '@/lib/woocommerce';
import ProductGallery from '@/components/ProductGallery';
import ProductDetailPanel from '@/components/ProductDetailPanel';
import ProductInfoAccordion from '@/components/ProductInfoAccordion';
import ServiceFeatures from '@/components/ServiceFeatures';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ProductStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData';
import type { Metadata } from 'next';



// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const product = await fetchProductBySlug(slug).catch(() => null);
	
	if (!product) {
		return {
			title: 'Product Not Found',
		};
	}

	const price = product.on_sale && product.sale_price 
		? product.sale_price 
		: product.price || product.regular_price;
	
	const imageUrl = product.images?.[0]?.src || '';
	const description = product.short_description 
		? product.short_description.replace(/<[^>]*>/g, '').substring(0, 160)
		: `${product.name} - ${product.price ? `$${price}` : 'View product details'}`;

	return {
		title: `${product.name} | WooCommerce Store`,
		description: description,
		openGraph: {
			title: product.name,
			description: description,
			images: imageUrl ? [
				{
					url: imageUrl,
					width: 1200,
					height: 1200,
					alt: product.images?.[0]?.alt || product.name,
				}
			] : [],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: product.name,
			description: description,
			images: imageUrl ? [imageUrl] : [],
		},
		alternates: {
			canonical: `/products/${slug}`,
		},
	};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;

	const product = await fetchProductBySlug(slug).catch(() => null);
	if (!product) {
		notFound();
	}

	// Fetch variations server-side and pass to client panel
	const variations: WooCommerceVariation[] = await (async () => {
		try {
			// Not all products have variations
			// @ts-ignore - product may not have type field strictly
			if (!product.variations || product.variations.length === 0) return [] as WooCommerceVariation[];
			return await fetchProductVariations(product.id);
		} catch {
			return [] as WooCommerceVariation[];
		}
	})();

	// Calculate price for structured data
	const price = product.on_sale && product.sale_price 
		? product.sale_price 
		: product.price || product.regular_price;

	// Related products by first category
	const firstCategoryId = product.categories?.[0]?.id;
	const [topSelling, similar] = await Promise.all([
		(async () => {
			if (!firstCategoryId) return [] as Awaited<ReturnType<typeof fetchProducts>>;
			// Try popularity first, fallback to date if popularity fails
			try { 
				const products = await fetchProducts({ per_page: 6, category: firstCategoryId, orderby: 'popularity' });
				// If popularity returns empty, try date ordering
				if (products.length === 0) {
					return await fetchProducts({ per_page: 6, category: firstCategoryId, orderby: 'date', order: 'desc' });
				}
				return products;
			} catch (error) { 
				console.error('Error fetching top selling products:', error);
				// Fallback to date ordering
				try {
					return await fetchProducts({ per_page: 6, category: firstCategoryId, orderby: 'date', order: 'desc' });
				} catch {
					return [];
				}
			}
		})(),
		(async () => {
			if (!firstCategoryId) return [] as Awaited<ReturnType<typeof fetchProducts>>;
			try { return await fetchProducts({ per_page: 6, category: firstCategoryId, orderby: 'date', order: 'desc' }); } catch (error) { 
				console.error('Error fetching similar products:', error);
				return []; 
			}
		})(),
	]);

	// Breadcrumb items for structured data
	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Shop', href: '/shop' },
		...(product.categories?.[0] 
			? [{ label: product.categories[0].name, href: `/product-category/${product.categories[0].slug}` }] 
			: []),
		{ label: product.name },
	];

	return (
		<>
			{/* Structured Data for SEO */}
			<ProductStructuredData product={product} />
			<BreadcrumbStructuredData items={breadcrumbItems} />
			
			<div className="min-h-screen py-12">
				<div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
					<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, ...(product.categories?.[0] ? [{ label: product.categories[0].name, href: `/product-category/${product.categories[0].slug}` }] : []), { label: product.name }]} />
				</div>
			<div className="mx-auto w-[85vw] grid grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-5 lg:gap-10 lg:px-8">
				{/* Left: Gallery (40%) */}
				<div className="lg:col-span-2">
					<ProductGallery images={(product.images || []).map((img) => ({ id: img.id, src: img.src, alt: img.alt, name: img.name }))} />
				</div>
				{/* Center: Details (40%) */}
				<div className="lg:col-span-2">
					<ProductDetailPanel product={product} variations={variations} />
				</div>
				{/* Right: Vertical placeholder (20%) */}
				<div className="lg:col-span-1">
					<div className="relative overflow-hidden rounded-xl border border-gray-200 aspect-[3/5] sm:aspect-[2/3] lg:h-[28rem]">
						<Image 
							src="https://picsum.photos/600/1200?random=31"
							alt="Promotional"
							fill
							sizes="(max-width: 1024px) 100vw, 20vw"
							className="object-cover"
						/>
					</div>
				</div>
			</div>

			{/* Full-width description section */}
			{product && (
				<div className="mx-auto mt-10 max-w-8xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
						{/* Left 60% - Accordions */}
						<div className="lg:col-span-3">
							<h2 className="mb-3 text-xl font-semibold text-gray-900">Product details</h2>
							<ProductInfoAccordion product={product} variations={variations} />
						</div>

						{/* Right 40% - Reviews */}
						<div className="lg:col-span-2">
							<h2 className="mb-3 text-xl font-semibold text-gray-900">Product reviews</h2>
							{await (async () => {
								try {
									const res = await wcAPI.get('/products/reviews', { params: { product: product.id, per_page: 5 } });
									const reviews = Array.isArray(res.data) ? res.data : [];
									if (reviews.length === 0) return <div className="rounded border p-4 text-sm text-gray-600">No reviews yet.</div>;
									return (
										<ul className="space-y-3">
											{reviews.map((r: any) => (
												<li key={r.id} className="rounded border p-3">
													<div className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: r.reviewer }} />
													<div className="text-xs text-gray-500">Rating: {r.rating || 0}/5</div>
													<div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: r.review || '' }} />
												</li>
											))}
										</ul>
									);
								} catch {
									return <div className="rounded border p-4 text-sm text-gray-600">Reviews unavailable.</div>;
								}
							})()}
						</div>
					</div>
				</div>
			)}

			{/* Related sections */}
			{firstCategoryId && (
				<div className="mx-auto mt-10 max-w-8xl px-4 sm:px-6 lg:px-8 space-y-10">
					{/* Top most selling */}
					<section>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Top most selling products</h3>
							<a href={`/shop?category=${encodeURIComponent(firstCategoryId)}&orderby=popularity`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</a>
						</div>
						{topSelling.length > 0 ? (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
								{topSelling.map((p) => (
									<ProductCard key={p.id} id={p.id} slug={p.slug} name={p.name} sku={p.sku} price={p.price} sale_price={p.sale_price} regular_price={p.regular_price} on_sale={p.on_sale} tax_class={p.tax_class} average_rating={p.average_rating} rating_count={p.rating_count} imageUrl={p.images?.[0]?.src} imageAlt={p.images?.[0]?.alt || p.name} />
								))}
							</div>
						) : (
							<div className="text-sm text-gray-600">No products found.</div>
						)}
					</section>

					{/* Similar products */}
					<section>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Similar products</h3>
							<a href={`/shop?category=${encodeURIComponent(firstCategoryId)}&orderby=date&order=desc`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</a>
						</div>
						{similar.length > 0 ? (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
								{similar.map((p) => (
									<ProductCard key={p.id} id={p.id} slug={p.slug} name={p.name} sku={p.sku} price={p.price} sale_price={p.sale_price} regular_price={p.regular_price} on_sale={p.on_sale} tax_class={p.tax_class} average_rating={p.average_rating} rating_count={p.rating_count} imageUrl={p.images?.[0]?.src} imageAlt={p.images?.[0]?.alt || p.name} />
								))}
							</div>
						) : (
							<div className="text-sm text-gray-600">No products found.</div>
						)}
					</section>

				</div>
			)}
		</div>
		</>
	);
}

function renderMetaList(product: any, keys: string[]) {
    const meta = product?.meta_data as Array<{ key: string; value: any }> | undefined;
    const found = meta?.find((m) => keys.includes(String(m.key).toLowerCase()));
    if (!found) return <div className="text-sm text-gray-600">No data available.</div>;
    const val = found.value;
    if (typeof val === 'string') return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: val }} />;
    if (Array.isArray(val)) return (
        <ul className="list-disc pl-5">
            {val.map((v: any, i: number) => (<li key={i}>{String(v)}</li>))}
        </ul>
    );
    return <div className="text-sm text-gray-600">No data available.</div>;
}
