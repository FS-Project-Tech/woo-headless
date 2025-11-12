"use client";

/**
 * Example Cart Usage Component
 * Demonstrates how to use the CartProvider in your components
 */

import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";

export default function CartExample() {
  const {
    items,
    addItem,
    removeItem,
    updateItemQty,
    total,
    isOpen,
    open,
    close,
    syncWithWooCommerce,
    validateCart,
    isSyncing,
    syncError,
  } = useCart();

  const [validationErrors, setValidationErrors] = useState<
    Array<{ itemId: string; message: string }>
  >([]);

  // Example: Add a product to cart
  const handleAddToCart = () => {
    addItem({
      productId: 123,
      name: "Example Product",
      slug: "example-product",
      price: "99.99",
      qty: 1,
      imageUrl: "https://example.com/image.jpg",
      sku: "SKU123",
    });
  };

  // Example: Sync cart before checkout
  const handleSyncCart = async () => {
    await syncWithWooCommerce("SAVE10"); // Optional coupon code
  };

  // Example: Validate cart on mount
  useEffect(() => {
    const validate = async () => {
      const result = await validateCart();
      if (!result.valid) {
        setValidationErrors(result.errors);
      } else {
        setValidationErrors([]);
      }
    };

    if (items.length > 0) {
      validate();
    }
  }, [items, validateCart]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Cart Example</h2>

      {/* Sync Status */}
      {isSyncing && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-blue-800">Syncing cart with WooCommerce...</p>
        </div>
      )}

      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-800">Error: {syncError}</p>
          <button
            onClick={handleSyncCart}
            className="mt-2 text-sm text-red-600 underline"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="font-semibold text-yellow-800">Cart Validation Issues:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {validationErrors.map((error) => (
              <li key={error.itemId} className="text-yellow-700">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cart Items */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Cart Items ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ${item.price} × {item.qty} = ${(parseFloat(item.price) * item.qty).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      updateItemQty(item.id, Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 rounded border px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart Total */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold">${total}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Example Product
        </button>
        <button
          onClick={handleSyncCart}
          disabled={isSyncing || items.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync with WooCommerce"}
        </button>
        <button
          onClick={isOpen ? close : open}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {isOpen ? "Close Cart" : "Open Cart"}
        </button>
      </div>
    </div>
  );
}

