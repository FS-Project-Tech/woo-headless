'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMenu, useSearchProducts, useCartUrl, useCart } from '@/hooks/useWooCommerce';
import { debounce } from '@/utils';
import { useIsScrolled } from '@/hooks/useClient';
import Cart from '@/components/cart/Cart';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isScrolled = useIsScrolled(10);

  const { data: menuItems = [] } = useMenu('primary');
  const { data: cartUrl } = useCartUrl();
  const { data: cart } = useCart();
  
  const {
    data: searchResults,
    isLoading: isSearching,
  } = useSearchProducts(searchQuery, 5);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    debouncedSearch(query);
    setIsSearchOpen(query.length > 0);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      } ${className}`}
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.svg"
                alt="Store Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-primary">Store</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.ID}
                href={item.url}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4"
                onChange={handleSearchChange}
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults?.products.length ? (
                      <div className="py-2">
                        {searchResults.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="flex items-center space-x-3 p-3 hover:bg-accent transition-colors"
                            onClick={() => setIsSearchOpen(false)}
                          >
                            <div className="relative w-12 h-12">
                              <Image
                                src={product.images[0]?.src || '/placeholder-image.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.price_html}
                              </p>
                            </div>
                          </Link>
                        ))}
                        <div className="border-t border-border p-2">
                          <Link
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            className="text-sm text-primary hover:underline"
                            onClick={() => setIsSearchOpen(false)}
                          >
                            View all results for "{searchQuery}"
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart?.items && cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>

            {/* User Account */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User className="w-5 h-5" />
                <span className="sr-only">Account</span>
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4"
                  onChange={handleSearchChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border"
            >
              <nav className="py-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.ID}
                    href={item.url}
                    className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </motion.header>
  );
}
