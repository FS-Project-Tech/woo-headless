'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WooCommerceProductVariation, WooCommerceAttribute, WooCommerceProduct } from '@/types/woocommerce';

interface VariationSelectorProps {
  product: WooCommerceProduct;
  variations: WooCommerceProductVariation[];
  selectedAttributes: Record<string, string>;
  onAttributeChange: (attributeName: string, value: string) => void;
  selectedVariation: WooCommerceProductVariation | null;
  onVariationSelect: (variation: WooCommerceProductVariation | null) => void;
}

export default function VariationSelector({
  product,
  variations,
  selectedAttributes,
  onAttributeChange,
  selectedVariation,
  onVariationSelect,
}: VariationSelectorProps) {
  // Group variations by attributes
  const attributeOptions: Record<string, string[]> = {};
  
  product.attributes.forEach(attr => {
    if (attr.variation) {
      attributeOptions[attr.name] = attr.options;
    }
  });

  // Find matching variation based on selected attributes
  React.useEffect(() => {
    if (Object.keys(selectedAttributes).length === Object.keys(attributeOptions).length) {
      const matchingVariation = variations.find(variation => {
        return variation.attributes.every(attr => 
          selectedAttributes[attr.name] === attr.option
        );
      });
      onVariationSelect(matchingVariation || null);
    } else {
      onVariationSelect(null);
    }
  }, [selectedAttributes, variations, attributeOptions, onVariationSelect]);

  const isAttributeSelected = (attributeName: string, value: string) => {
    return selectedAttributes[attributeName] === value;
  };

  const isVariationAvailable = (attributeName: string, value: string) => {
    return variations.some(variation => {
      const attr = variation.attributes.find(a => a.name === attributeName);
      return attr?.option === value;
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(attributeOptions).map(([attributeName, options]) => (
        <div key={attributeName}>
          <h3 className="text-sm font-medium text-foreground mb-3 capitalize">
            {attributeName}
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.map(option => {
              const isSelected = isAttributeSelected(attributeName, option);
              const isAvailable = isVariationAvailable(attributeName, option);
              
              return (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onAttributeChange(attributeName, option)}
                    disabled={!isAvailable}
                    className={`min-w-0 px-3 py-2 ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : isAvailable 
                          ? 'hover:bg-muted' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {option}
                    {!isAvailable && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Unavailable
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
      
      {selectedVariation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-muted rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected Variation</p>
              <p className="font-medium">{selectedVariation.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-bold text-lg">
                {selectedVariation.price ? `$${selectedVariation.price}` : 'Price on request'}
              </p>
            </div>
          </div>
          
          {selectedVariation.stock_status && (
            <div className="mt-2">
              <Badge 
                variant={selectedVariation.stock_status === 'instock' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {selectedVariation.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
