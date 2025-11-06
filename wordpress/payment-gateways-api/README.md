# Payment Gateways REST API Plugin

A secure WordPress plugin that provides a REST API endpoint for fetching enabled WooCommerce payment gateways.

## Features

- **Secure Authentication**: Uses WooCommerce REST API authentication (Consumer Key/Secret)
- **Reliable Data Source**: Uses WooCommerce's internal payment gateway functions
- **Proper Sanitization**: All output is sanitized for security
- **Error Handling**: Comprehensive error handling and validation

## Installation

1. Upload the `payment-gateways-api` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. The endpoint will be available at: `/wp-json/wc/v3/payment_gateways`

## Security

The endpoint requires WooCommerce REST API authentication:
- Uses Consumer Key and Consumer Secret
- Validates API keys against the database
- Checks for read permissions
- Uses secure hash comparison (prevents timing attacks)

## API Endpoint

**URL**: `/wp-json/wc/v3/payment_gateways`  
**Method**: `GET`  
**Authentication**: WooCommerce REST API (Consumer Key/Secret)

### Response

```json
[
  {
    "id": "bacs",
    "title": "Direct Bank Transfer",
    "description": "Make your payment directly into our bank account.",
    "method_title": "Direct Bank Transfer",
    "enabled": true
  },
  {
    "id": "cod",
    "title": "Cash on Delivery",
    "description": "Pay with cash upon delivery.",
    "method_title": "Cash on Delivery",
    "enabled": true
  }
]
```

## Alternative: Direct Database Access (Less Secure)

If you prefer not to use the plugin, you can modify the Next.js API to directly query the WordPress database, but this requires:
- Database credentials
- Direct database access
- Less secure than REST API authentication

The current implementation uses secure REST API authentication which is the recommended approach.

