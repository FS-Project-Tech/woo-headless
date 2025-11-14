"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

interface Quote {
  id: string;
  date: string;
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
}

export default function DashboardQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/quotes', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }

        const data = await response.json();
        setQuotes(data.quotes || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load quotes');
        showError(err.message || 'Failed to load quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading quotes: {error}</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">View all your quote requests</p>
        </div>

        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📄</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-600 mb-6">Request a quote from your cart to see it here</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600 mt-1">View all your quote requests</p>
      </div>

      <div className="space-y-3">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500">Quote #</p>
                <p className="text-base font-semibold text-gray-900">{quote.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(quote.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    quote.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : quote.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : quote.status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-semibold text-gray-900">
                  ${quote.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Items ({quote.items.length})</p>
              <div className="space-y-2">
                {quote.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.name} {item.sku && `(${item.sku})`} × {item.quantity}
                    </span>
                    <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Subtotal: ${quote.subtotal.toFixed(2)}</p>
                {quote.shipping > 0 && <p>Shipping: ${quote.shipping.toFixed(2)}</p>}
                {quote.discount > 0 && <p className="text-emerald-600">Discount: -${quote.discount.toFixed(2)}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">${quote.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

