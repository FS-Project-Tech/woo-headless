# Display Order Meta Fields Plugin

## Purpose
This WordPress plugin ensures that custom order meta fields (Delivery Instructions, Delivery Authority, Newsletter Subscription, Payment Method Display) are:
- Visible in the WooCommerce admin order detail page
- Included in order confirmation emails (both customer and admin emails)

## Installation
1. Upload the `display-order-meta` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress

## How It Works
- WooCommerce hides meta keys that start with `_` (underscore) in the admin UI
- This plugin ensures custom order meta fields are displayed even if they have special formatting
- The plugin hooks into WooCommerce's order display system and email system to show these custom fields

## Custom Order Meta Fields
The following fields are now visible in:
- **WooCommerce Admin Order Detail Page**
- **Order Confirmation Emails** (sent to customers)
- **New Order Emails** (sent to admin)

Fields included:
- **Delivery Instructions** - Customer's special delivery instructions
- **Delivery Authority** - "With Signature" or "Without Signature"
- **Newsletter Subscription** - "Yes" if customer subscribed
- **Payment Method Display** - Payment method title

## Email Display
The custom order meta fields are automatically added to:
- Customer order confirmation emails
- Admin new order notification emails
- Both HTML and plain text email formats are supported

The fields appear in a dedicated "Additional Information" section in the email, styled appropriately for the email format.

## Order Meta Storage
All order meta fields are stored in the WordPress database in the `wp_postmeta` table and are visible in:
- WooCommerce Admin → Orders → [Order Number] → Order Data section
- WooCommerce REST API (via `/wp-json/wc/v3/orders/{id}`)
- Order confirmation emails
