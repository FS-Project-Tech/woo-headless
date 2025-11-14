<?php
/**
 * Plugin Name: Payment Gateways REST API
 * Description: Secure REST API endpoint for fetching enabled WooCommerce payment gateways
 * Version: 1.0.0
 * Author: Your Team
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register REST API route with proper authentication
add_action('rest_api_init', function () {
    register_rest_route('wc/v3', '/payment_gateways', array(
        'methods' => 'GET',
        'callback' => 'get_enabled_payment_gateways',
        'permission_callback' => 'verify_payment_gateways_request', // Secure authentication
    ));
});

/**
 * Verify request authentication using WooCommerce REST API authentication
 * This ensures only authenticated requests can access payment gateway information
 * Uses the same authentication as WooCommerce REST API endpoints
 */
function verify_payment_gateways_request($request) {
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return false;
    }

    // Use WooCommerce's built-in REST API authentication
    // This automatically handles HTTP Basic Auth with Consumer Key/Secret
    if (!class_exists('WC_REST_Authentication')) {
        // Fallback to manual verification
        return verify_woocommerce_api_key();
    }
    
    // Use WooCommerce's authentication class
    $auth = new WC_REST_Authentication();
    
    // WooCommerce REST API uses HTTP Basic Auth
    // The authentication is handled automatically by WordPress REST API
    // We just need to verify the request has proper credentials
    
    // Check if request has authentication headers
    $consumer_key = $request->get_header('consumer_key');
    $consumer_secret = $request->get_header('consumer_secret');
    
    // Or check HTTP Basic Auth (standard WooCommerce REST API method)
    if (empty($consumer_key) && isset($_SERVER['PHP_AUTH_USER'])) {
        $consumer_key = $_SERVER['PHP_AUTH_USER'];
        $consumer_secret = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
    }
    
    // If no credentials, deny access
    if (empty($consumer_key) || empty($consumer_secret)) {
        return false;
    }
    
    // Verify API key using WooCommerce's method
    return verify_woocommerce_api_key();
}

/**
 * Verify WooCommerce API key credentials
 * This is a secure method that validates against WooCommerce's API key table
 */
function verify_woocommerce_api_key() {
    global $wpdb;
    
    // Get credentials from HTTP Basic Auth
    $consumer_key = isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '';
    $consumer_secret = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
    
    if (empty($consumer_key) || empty($consumer_secret)) {
        return false;
    }
    
    // WooCommerce stores API keys in wp_woocommerce_api_keys table
    $table_name = $wpdb->prefix . 'woocommerce_api_keys';
    
    // Verify the API key exists and is active
    $api_key = $wpdb->get_row($wpdb->prepare(
        "SELECT key_id, permissions, consumer_key, consumer_secret, user_id, description
         FROM {$table_name}
         WHERE consumer_key = %s
         AND status = 'active'
         LIMIT 1",
        $consumer_key
    ));
    
    if (!$api_key) {
        return false;
    }
    
    // WooCommerce stores consumer_secret as a hash (SHA256)
    // We need to hash the provided secret and compare
    $hashed_secret = hash('sha256', $consumer_secret);
    
    // Use hash_equals to prevent timing attacks
    if (!hash_equals($api_key->consumer_secret, $hashed_secret)) {
        return false;
    }
    
    // Check if API key has read permissions
    if ($api_key->permissions !== 'read' && $api_key->permissions !== 'read_write') {
        return false;
    }
    
    return true;
}

/**
 * Get enabled payment gateways from WooCommerce
 */
function get_enabled_payment_gateways($request) {
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return new WP_Error(
            'woocommerce_not_active',
            'WooCommerce is not active',
            array('status' => 400)
        );
    }

    try {
        // Get all payment gateways using WooCommerce's internal method
        $gateways = WC()->payment_gateways->get_available_payment_gateways();
        
        $enabled_gateways = array();
        
        foreach ($gateways as $gateway_id => $gateway) {
            // Only include enabled gateways
            if ($gateway->enabled === 'yes') {
                $enabled_gateways[] = array(
                    'id' => sanitize_text_field($gateway_id),
                    'title' => sanitize_text_field($gateway->get_title()),
                    'description' => sanitize_textarea_field($gateway->get_description()),
                    'method_title' => sanitize_text_field($gateway->get_method_title()),
                    'enabled' => true,
                );
            }
        }
        
        // Return response with proper headers
        $response = rest_ensure_response($enabled_gateways);
        $response->header('Cache-Control', 'no-cache, must-revalidate, max-age=0');
        
        return $response;
        
    } catch (Exception $e) {
        return new WP_Error(
            'payment_gateways_error',
            'Error fetching payment gateways: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

