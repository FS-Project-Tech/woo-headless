# Wishlist API WordPress Plugin

This plugin provides REST API endpoints for managing user wishlists stored in WordPress user meta.

## Installation

1. Upload the `wishlist-api` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Ensure you have JWT Authentication plugin installed and configured (for user authentication)

## Requirements

- WordPress 5.0+
- WooCommerce (optional, but recommended)
- JWT Authentication for WP-API plugin (for REST API authentication)

## API Endpoints

### Get User Wishlist
- **URL**: `/wp-json/custom/v1/wishlist`
- **Method**: GET
- **Authentication**: Required (Bearer token)
- **Response**: `{ "wishlist": [1, 2, 3] }` (array of product IDs)

### Add to Wishlist
- **URL**: `/wp-json/custom/v1/wishlist/add`
- **Method**: POST
- **Authentication**: Required (Bearer token)
- **Body**: `{ "product_id": 123 }`
- **Response**: `{ "wishlist": [1, 2, 3] }`

### Remove from Wishlist
- **URL**: `/wp-json/custom/v1/wishlist/remove`
- **Method**: POST
- **Authentication**: Required (Bearer token)
- **Body**: `{ "product_id": 123 }`
- **Response**: `{ "wishlist": [1, 2] }`

## How It Works

- Wishlist data is stored in WordPress user meta with the key `wishlist`
- The wishlist is stored as an array of product IDs: `[1, 2, 3]`
- Each user has their own wishlist that persists across sessions

## Notes

- The plugin requires JWT authentication to identify the current user
- The JWT token should be sent in the Authorization header: `Authorization: Bearer <token>`
- If JWT authentication is not properly configured, the endpoints will return 401 Unauthorized

