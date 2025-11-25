/**
 * Cart Types
 * Shared type definitions for cart-related functionality
 */

export interface CartItem {
	id: string; // productId or productId:variationId
	productId: number;
	variationId?: number;
	name: string;
	slug: string;
	imageUrl?: string;
	price: string; // display price string
	qty: number;
	sku?: string | null;
	attributes?: { [name: string]: string };
	deliveryPlan?: "none" | "7" | "14" | "30";
	/** WooCommerce tax class slug or name, e.g. 'gst-10', 'gst-free' */
	tax_class?: string;
	/** WooCommerce tax status, e.g. 'taxable', 'none' */
	tax_status?: string;
}

