import Link from "next/link";
import { fetchCategories } from "@/lib/woocommerce";
import { Suspense } from "react";
import AllCategoriesDrawer from "@/components/AllCategoriesDrawer";

async function CategoriesNavContent() {
	let categories = [] as Awaited<ReturnType<typeof fetchCategories>>;
	try {
		categories = await fetchCategories({ per_page: 7, parent: 0, hide_empty: true });
	} catch {
		categories = [] as any;
	}

	if (!categories || categories.length === 0) {
		return null;
	}

    return (
        <nav className="border-b bg-white">
            <div className="mx-auto w-full sm:w-[85vw] px-4 sm:px-6 lg:px-8">
                <ul
                    className="flex items-center gap-2 sm:gap-3 py-2 sm:py-3 text-sm overflow-x-auto whitespace-nowrap md:flex-wrap md:overflow-visible"
                    aria-label="Category navigation"
                >
                    <li className="shrink-0">
                        <AllCategoriesDrawer className="px-3 py-1.5 rounded-md hover:bg-gray-50" />
                    </li>
                    {/* Only the requested fixed links */}
                    <li className="shrink-0">
                        <Link href="/product-category/continence-care" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Continence care</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/product-category/urinary-care" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Urinary care</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/product-category/wound-care" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Wound care</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/product-category/skin-care" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Skin care</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/product-category/nutrition" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Nutrition</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/product-category/feeding-tube" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Feeding tube</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/#ndis" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">NDIS</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/shop" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Brands</Link>
                    </li>
                    <li className="shrink-0">
                        <Link href="/shop?on_sale=true" className="inline-flex items-center px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">Clearance</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default function CategoriesNav() {
	return (
		<Suspense fallback={<div className="border-b bg-white h-14" />}>
			<CategoriesNavContent />
		</Suspense>
	);
}
