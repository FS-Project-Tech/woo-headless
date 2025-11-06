'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, Filter, X, Grid, List } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import { useProducts, useCategories, useTags } from '@/hooks/useWooCommerce';
import { ProductFilters } from '@/types/woocommerce';
import { debounce } from '@/utils';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 12,
    orderby: 'date',
    order: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Get data
  const { data: productsData, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  // Update filters from URL params
  useEffect(() => {
    const newFilters: ProductFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      per_page: parseInt(searchParams.get('per_page') || '12'),
      orderby: (searchParams.get('orderby') as any) || 'date',
      order: (searchParams.get('order') as any) || 'desc',
      category: searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined,
      tag: searchParams.get('tag') ? parseInt(searchParams.get('tag')!) : undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      on_sale: searchParams.get('on_sale') === 'true',
      featured: searchParams.get('featured') === 'true',
      stock_status: (searchParams.get('stock_status') as any) || undefined,
      search: searchParams.get('search') || undefined,
    };
    setFilters(newFilters);
    setSearchQuery(newFilters.search || '');
  }, [searchParams]);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      per_page: 12,
      orderby: 'date',
      order: 'desc',
    });
    setSearchQuery('');
  };

  const products = productsData?.data || [];
  const totalPages = productsData?.totalPages || 0;
  const currentPage = productsData?.currentPage || 1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Products</h1>
          <p className="text-muted-foreground">
            Discover our wide range of products
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-80"
          >
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categories</label>
                    <div className="space-y-2">
                      {categories.slice(0, 10).map((category) => (
                        <label key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.category === category.id}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateFilters({ category: category.id });
                              } else {
                                updateFilters({ category: undefined });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.min_price || ''}
                      onChange={(e) => updateFilters({ 
                        min_price: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.max_price || ''}
                      onChange={(e) => updateFilters({ 
                        max_price: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.stock_status === 'instock'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilters({ stock_status: 'instock' });
                          } else {
                                updateFilters({ stock_status: undefined });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm">In Stock</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.on_sale}
                            onChange={(e) => updateFilters({ on_sale: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-sm">On Sale</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.featured}
                            onChange={(e) => updateFilters({ featured: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-sm">Featured</span>
                        </label>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Products Section */}
              <div className="flex-1">
                {/* Toolbar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
                >
                  {/* Results Count */}
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? (
                      'Loading...'
                    ) : (
                      `Showing ${products.length} of ${productsData?.total || 0} products`
                    )}
                  </div>

                  {/* View Controls */}
                  <div className="flex items-center gap-4">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Sort by:</label>
                      <select
                        value={`${filters.orderby}-${filters.order}`}
                        onChange={(e) => {
                          const [orderby, order] = e.target.value.split('-');
                          updateFilters({ orderby: orderby as any, order: order as any });
                        }}
                        className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="popularity-desc">Most Popular</option>
                        <option value="rating-desc">Highest Rated</option>
                        <option value="title-asc">Name: A to Z</option>
                        <option value="title-desc">Name: Z to A</option>
                      </select>
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Products Grid */}
                <ProductGrid
                  products={products}
                  isLoading={isLoading}
                  columns={viewMode === 'grid' ? 4 : 1}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mt-12"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => updateFilters({ page: currentPage - 1 })}
                      >
                        Previous
                      </Button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            onClick={() => updateFilters({ page: pageNum })}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => updateFilters({ page: currentPage + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    export default function ProductsPage() {
      return (
        <Suspense fallback={
          <Layout>
            <div className="container mx-auto px-4 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="h-48 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-6 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Layout>
        }>
          <ProductsContent />
        </Suspense>
      );
    }
