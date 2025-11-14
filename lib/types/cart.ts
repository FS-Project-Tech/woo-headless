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
}

