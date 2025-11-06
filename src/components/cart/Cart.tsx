'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useWooCommerce';
import { formatPrice } from '@/utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const handleQuantityChange = (cartItemKey: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem.mutate(cartItemKey);
    } else {
      updateCartItem.mutate({ cartItemKey, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (cartItemKey: string) => {
    removeCartItem.mutate(cartItemKey);
  };

  const handleClearCart = () => {
    clearCart.mutate();
  };

  const handleCheckout = () => {
    if (typeof window !== 'undefined') {
      window.open(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/checkout/`, '_blank');
    }
  };

  const handleViewCart = () => {
    if (typeof window !== 'undefined') {
      window.open(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/cart/`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart
                {cart?.items && cart.items.length > 0 && (
                  <Badge variant="secondary">{cart.items.length}</Badge>
                )}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : cart?.items && cart.items.length > 0 ? (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-3 p-3 border rounded-lg"
                    >
                      <div className="w-16 h-16 bg-muted rounded flex-shrink-0">
                        {item.product_data.images?.[0] && (
                          <img
                            src={item.product_data.images[0].src}
                            alt={item.product_data.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price)}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.key)}
                            className="w-6 h-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button variant="outline" className="mt-4" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart?.items && cart.items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">
                    {cart.currency.currency_symbol}{cart.totals.total}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleViewCart}
                    className="w-full"
                  >
                    View Cart on WooCommerce
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleClearCart}
                    className="w-full"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
