"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type {
  CatalogueChapter,
  CatalogueSection,
  CatalogueProduct,
} from "@/lib/catalogue";

interface CatalogueBookProps {
  chapters: CatalogueChapter[];
}

export default function CatalogueBook({ chapters }: CatalogueBookProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [showTableOfContents, setShowTableOfContents] = useState(true);

  // Ensure component is mounted before rendering animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Flatten chapters into pages - each category is a separate page
  const pages: Array<{
    chapter: CatalogueChapter;
    section: CatalogueSection;
    products: CatalogueProduct[];
    pageIndex: number;
  }> = [];

  chapters.forEach((chapter) => {
    // Each category gets its own page with all products
    chapter.sections.forEach((section) => {
      pages.push({
        chapter,
        section,
        products: section.products,
        pageIndex: pages.length,
      });
    });
  });

  const totalPages = pages.length;

  // Find page index for a specific chapter
  const findChapterPage = (chapterSlug: string): number => {
    const firstPage = pages.findIndex(
      (page) => page.chapter.slug === chapterSlug
    );
    return firstPage !== -1 ? firstPage : 0;
  };

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex >= 0 && pageIndex < totalPages && !isFlipping) {
        const currentIdx = currentPage ?? 0;
        setDirection(pageIndex > currentIdx ? "right" : "left");
        setIsFlipping(true);
        setShowTableOfContents(false);
        setTimeout(() => {
          setCurrentPage(pageIndex);
          setIsFlipping(false);
        }, 300);
      }
    },
    [currentPage, totalPages, isFlipping]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage !== null && currentPage < totalPages - 1 && !isFlipping) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, isFlipping, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage !== null && currentPage > 0 && !isFlipping) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, isFlipping, goToPage]);

  const goToChapter = useCallback(
    (chapterSlug: string) => {
      const pageIndex = findChapterPage(chapterSlug);
      goToPage(pageIndex);
    },
    [goToPage]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPreviousPage();
      } else if (e.key === "ArrowRight") {
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPreviousPage, goToNextPage]);

  const currentPageData = currentPage !== null ? pages[currentPage] : null;

  if (totalPages === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <p className="text-gray-500">No products available in the catalogue.</p>
      </div>
    );
  }

  // Table of Contents View
  if (showTableOfContents || currentPage === null) {
    const tocContent = (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">
          Table of Contents
        </h2>
        <div className="space-y-2">
          {chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              onClick={() => goToChapter(chapter.slug)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {chapter.name}
                </span>
                <span className="text-sm text-gray-500">
                  {chapter.sections.reduce(
                    (sum, section) => sum + section.products.length,
                    0
                  )}{" "}
                  products
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] py-8">
        <div className="relative w-full max-w-4xl">
          <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-2xl p-8 border-4 border-amber-200">
            {isMounted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tocContent}
              </motion.div>
            ) : (
              tocContent
            )}
          </div>
        </div>
      </div>
    );
  }

  // Product Table View
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-8">
      {/* Book Container */}
      <div className="relative w-full max-w-6xl">
        {/* Book Cover Effect */}
        <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-2xl p-8 border-4 border-amber-200">
          {/* Page Content */}
          {isMounted ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{
                  rotateY: direction === "right" ? 90 : -90,
                  opacity: 0,
                }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{
                  rotateY: direction === "right" ? -90 : 90,
                  opacity: 0,
                }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-8 min-h-[500px]"
              >
                {currentPageData && (
                  <div className="h-full">
                  {/* Chapter Header */}
                  <div className="border-b-2 border-amber-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-amber-900">
                      {currentPageData.chapter.name}
                    </h2>
                    <p className="text-sm text-amber-700 mt-1">
                      {currentPageData.products.length} product
                      {currentPageData.products.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-amber-50 border-b-2 border-amber-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                              SKU
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                              Variations
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-amber-900">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPageData.products.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                No products in this section
                              </td>
                            </tr>
                          ) : (
                            currentPageData.products.map((product, idx) => (
                              <tr
                                key={product.id}
                                className={`border-b border-gray-200 hover:bg-amber-50 transition-colors ${
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {product.sku || "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/products/${product.slug}`}
                                    className="text-sm font-medium text-gray-900 hover:text-amber-700 transition-colors"
                                  >
                                    {product.name}
                                  </Link>
                                </td>
                                <td className="px-4 py-3">
                                  {product.variations &&
                                  product.variations.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {product.variations.map((variation, vIdx) => (
                                        <span
                                          key={vIdx}
                                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-800"
                                        >
                                          {variation.name}:{" "}
                                          {variation.options
                                            .slice(0, 3)
                                            .join(", ")}
                                          {variation.options.length > 3 && "..."}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {product.on_sale ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-bold text-red-600">
                                        ${product.sale_price}
                                      </span>
                                      <span className="text-xs text-gray-500 line-through">
                                        ${product.regular_price}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-bold text-gray-900">
                                      ${product.price}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 min-h-[500px]">
              {currentPageData && (
                <div className="h-full">
                  {/* Chapter Header */}
                  <div className="border-b-2 border-amber-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-amber-900">
                      {currentPageData.chapter.name}
                    </h2>
                    <p className="text-sm text-amber-700 mt-1">
                      {currentPageData.products.length} product
                      {currentPageData.products.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Products Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-amber-50 border-b-2 border-amber-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                            SKU
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">
                            Variations
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-amber-900">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPageData.products.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              No products in this section
                            </td>
                          </tr>
                        ) : (
                          currentPageData.products.map((product, idx) => (
                            <tr
                              key={product.id}
                              className={`border-b border-gray-200 hover:bg-amber-50 transition-colors ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {product.sku || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/products/${product.slug}`}
                                  className="text-sm font-medium text-gray-900 hover:text-amber-700 transition-colors"
                                >
                                  {product.name}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                {product.variations &&
                                product.variations.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {product.variations.map((variation, vIdx) => (
                                      <span
                                        key={vIdx}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-800"
                                      >
                                        {variation.name}:{" "}
                                        {variation.options
                                          .slice(0, 3)
                                          .join(", ")}
                                        {variation.options.length > 3 && "..."}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {product.on_sale ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-red-600">
                                      ${product.sale_price}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      ${product.regular_price}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-gray-900">
                                    ${product.price}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Page Number */}
          <div className="absolute bottom-4 right-8 text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={() => setShowTableOfContents(true)}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          Table of Contents
        </button>

        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 0 || isFlipping}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        <div className="text-sm text-gray-600">
          <span className="font-semibold">{currentPage + 1}</span> / {totalPages}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages - 1 || isFlipping}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Next
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-gray-500 mt-4">
        Use arrow keys or buttons to navigate
      </p>
    </div>
  );
}