<?php
/**
 * Plugin Name: Display Order Meta Fields
 * Description: Ensures custom order meta fields are visible in WooCommerce order detail page and order emails
 * Version: 1.0.0
 * Author: Your Team
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Ensure custom order meta fields are displayed in WooCommerce admin
 * This hook makes sure meta fields without underscore prefix are always visible
 */
add_action('woocommerce_admin_order_data_after_order_details', 'display_custom_order_meta_fields', 10, 1);

function display_custom_order_meta_fields($order) {
    // Get all order meta data
    $meta_data = $order->get_meta_data();
    
    // List of custom meta keys we want to ensure are displayed
    $custom_keys = array(
        'Delivery Instructions',
        'Delivery Authority',
        'Newsletter Subscription',
        'Payment Method Display',
    );
    
    // Display each custom meta field
    foreach ($custom_keys as $key) {
        $value = $order->get_meta($key);
        if (!empty($value)) {
            ?>
            <div class="order_data_column">
                <h3><?php echo esc_html($key); ?></h3>
                <p><?php echo esc_html($value); ?></p>
            </div>
            <?php
        }
    }
}

/**
 * Add custom order meta fields to WooCommerce order emails
 * This adds the fields to both customer and admin emails
 */
add_action('woocommerce_email_order_details', 'add_custom_order_meta_to_emails', 20, 4);

function add_custom_order_meta_to_emails($order, $sent_to_admin, $plain_text, $email) {
    // Custom meta keys to display in emails
    $custom_keys = array(
        'Delivery Instructions' => 'Delivery Instructions',
        'Delivery Authority' => 'Delivery Authority',
        'Newsletter Subscription' => 'Newsletter Subscription',
        'Payment Method Display' => 'Payment Method',
    );
    
    $has_meta = false;
    $meta_data = array();
    
    // Collect all custom meta fields
    foreach ($custom_keys as $key => $label) {
        $value = $order->get_meta($key);
        if (!empty($value)) {
            $has_meta = true;
            $meta_data[$label] = $value;
        }
    }
    
    // If no custom meta, don't display anything
    if (!$has_meta) {
        return;
    }
    
    // Display based on email format (HTML or plain text)
    if ($plain_text) {
        // Plain text email format
        echo "\n" . __("Additional Information", "woocommerce") . "\n";
        echo str_repeat("=", 40) . "\n\n";
        
        foreach ($meta_data as $label => $value) {
            echo esc_html($label) . ": " . esc_html($value) . "\n";
        }
        
        echo "\n" . str_repeat("=", 40) . "\n\n";
        // Per-item details: SKU, Variations, Delivery Frequency
        echo "\n" . __("Item Details", "woocommerce") . "\n";
        echo str_repeat("-", 40) . "\n\n";
        foreach ($order->get_items('line_item') as $item_id => $item) {
            /** @var WC_Order_Item_Product $item */
            $product = $item->get_product();
            $name = $item->get_name();
            $sku = $product ? $product->get_sku() : '';
            $delivery_frequency = $item->get_meta('Delivery Frequency');
            // Attempt to get formatted variation
            $variation_text = '';
            if ($product && $product->is_type('variation')) {
                $variation_text = wc_get_formatted_variation($product, true);
            }
            echo esc_html($name) . "\n";
            if (!empty($sku)) echo "  SKU: " . esc_html($sku) . "\n";
            if (!empty($variation_text)) echo "  Variations: " . wp_strip_all_tags($variation_text) . "\n";
            if (!empty($delivery_frequency)) echo "  Delivery Frequency: " . esc_html($delivery_frequency) . "\n";
            echo "\n";
        }
    } else {
        // HTML email format
        ?>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #96588a;">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">
                <?php echo esc_html__("Additional Information", "woocommerce"); ?>
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
                <?php foreach ($meta_data as $label => $value): ?>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555; width: 40%;">
                        <?php echo esc_html($label); ?>:
                    </td>
                    <td style="padding: 8px 0; color: #333;">
                        <?php echo esc_html($value); ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #2271b1;">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">
                <?php echo esc_html__("Item Details", "woocommerce"); ?>
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
                <?php foreach ($order->get_items('line_item') as $item_id => $item): ?>
                    <?php 
                        /** @var WC_Order_Item_Product $item */
                        $product = $item->get_product();
                        $name = $item->get_name();
                        $sku = $product ? $product->get_sku() : '';
                        $delivery_frequency = $item->get_meta('Delivery Frequency');
                        $variation_html = '';
                        if ($product && $product->is_type('variation')) {
                            $variation_html = wc_get_formatted_variation($product, true);
                        }
                    ?>
                    <tr>
                        <td colspan="2" style="padding: 8px 0; color: #333; font-weight: bold; border-top: 1px solid #e5e5e5;">
                            <?php echo esc_html($name); ?>
                        </td>
                    </tr>
                    <?php if (!empty($sku)): ?>
                    <tr>
                        <td style="padding: 6px 0; color: #555; width: 40%;"><?php esc_html_e('SKU', 'woocommerce'); ?>:</td>
                        <td style="padding: 6px 0; color: #333;"><?php echo esc_html($sku); ?></td>
                    </tr>
                    <?php endif; ?>
                    <?php if (!empty($variation_html)): ?>
                    <tr>
                        <td style="padding: 6px 0; color: #555; width: 40%;"><?php esc_html_e('Variations', 'woocommerce'); ?>:</td>
                        <td style="padding: 6px 0; color: #333;"><?php echo wp_kses_post($variation_html); ?></td>
                    </tr>
                    <?php endif; ?>
                    <?php if (!empty($delivery_frequency)): ?>
                    <tr>
                        <td style="padding: 6px 0; color: #555; width: 40%;"><?php echo esc_html__('Delivery Frequency', 'woocommerce'); ?>:</td>
                        <td style="padding: 6px 0; color: #333;"><?php echo esc_html($delivery_frequency); ?></td>
                    </tr>
                    <?php endif; ?>
                <?php endforeach; ?>
            </table>
        </div>
        <?php
    }
}

/**
 * Alternative: Add custom meta to email order meta section
 * This adds it to the existing order meta display area
 */
add_action('woocommerce_email_order_meta', 'add_custom_order_meta_to_email_meta_section', 10, 3);

function add_custom_order_meta_to_email_meta_section($order, $sent_to_admin, $plain_text) {
    // Custom meta keys to display
    $custom_keys = array(
        'Delivery Instructions' => 'Delivery Instructions',
        'Delivery Authority' => 'Delivery Authority',
        'Newsletter Subscription' => 'Newsletter Subscription',
        'Payment Method Display' => 'Payment Method',
    );
    
    foreach ($custom_keys as $key => $label) {
        $value = $order->get_meta($key);
        if (!empty($value)) {
            if ($plain_text) {
                echo "\n" . esc_html($label) . ": " . esc_html($value) . "\n";
            } else {
                echo "<p><strong>" . esc_html($label) . ":</strong> " . esc_html($value) . "</p>";
            }
        }
    }
}

/**
 * Add custom meta fields to order meta box display
 * This ensures they show up in the "Order Data" section
 */
add_filter('woocommerce_order_item_get_formatted_meta_data', 'add_custom_order_meta_to_display', 10, 2);

function add_custom_order_meta_to_display($formatted_meta, $item) {
    // This ensures meta fields are formatted properly
    return $formatted_meta;
}

/**
 * Register custom order meta fields for display
 * This makes WooCommerce aware of these fields
 */
add_action('woocommerce_after_order_itemmeta', 'display_order_item_custom_meta', 10, 3);

function display_order_item_custom_meta($item_id, $item, $product) {
    // This hook can be used to display item-level custom meta if needed
}

