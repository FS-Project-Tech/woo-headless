<?php
/**
 * Plugin Name: Wishlist API
 * Description: REST API endpoints for managing user wishlist stored in user meta
 * Version: 1.0.0
 * Author: Your Team
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register REST API routes
add_action('rest_api_init', function () {
    // Get wishlist
    register_rest_route('custom/v1', '/wishlist', array(
        'methods' => 'GET',
        'callback' => 'get_user_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Add to wishlist
    register_rest_route('custom/v1', '/wishlist/add', array(
        'methods' => 'POST',
        'callback' => 'add_to_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Remove from wishlist
    register_rest_route('custom/v1', '/wishlist/remove', array(
        'methods' => 'POST',
        'callback' => 'remove_from_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ));
});

function is_user_logged_in($request) {
    // Check if user is logged in via session
    $user_id = get_current_user_id();
    if ($user_id > 0) {
        return true;
    }
    
    // Check JWT token if available
    $auth_header = $request->get_header('Authorization');
    if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        $token = $matches[1];
        // Validate JWT token using jwt-auth plugin if available
        // The jwt-auth plugin should set the user context automatically
        $user_id = get_current_user_id();
        if ($user_id > 0) {
            return true;
        }
    }
    
    return false;
}

function get_user_wishlist($request) {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_Error('unauthorized', 'User not logged in', array('status' => 401));
    }

    $wishlist = get_user_meta($user_id, 'wishlist', true);
    if (empty($wishlist)) {
        $wishlist = array();
    } else {
        // Ensure it's an array
        if (is_string($wishlist)) {
            $wishlist = json_decode($wishlist, true);
            if (!is_array($wishlist)) {
                $wishlist = array();
            }
        }
    }

    return rest_ensure_response(array('wishlist' => $wishlist));
}

function add_to_wishlist($request) {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_Error('unauthorized', 'User not logged in', array('status' => 401));
    }

    $params = $request->get_json_params();
    $product_id = isset($params['product_id']) ? intval($params['product_id']) : 0;

    if ($product_id <= 0) {
        return new WP_Error('invalid', 'Invalid product_id', array('status' => 400));
    }

    // Get current wishlist
    $wishlist = get_user_meta($user_id, 'wishlist', true);
    if (empty($wishlist)) {
        $wishlist = array();
    } else {
        if (is_string($wishlist)) {
            $wishlist = json_decode($wishlist, true);
            if (!is_array($wishlist)) {
                $wishlist = array();
            }
        }
    }

    // Add product if not already in wishlist
    if (!in_array($product_id, $wishlist)) {
        $wishlist[] = $product_id;
        update_user_meta($user_id, 'wishlist', $wishlist);
    }

    return rest_ensure_response(array('wishlist' => $wishlist));
}

function remove_from_wishlist($request) {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_Error('unauthorized', 'User not logged in', array('status' => 401));
    }

    $params = $request->get_json_params();
    $product_id = isset($params['product_id']) ? intval($params['product_id']) : 0;

    if ($product_id <= 0) {
        return new WP_Error('invalid', 'Invalid product_id', array('status' => 400));
    }

    // Get current wishlist
    $wishlist = get_user_meta($user_id, 'wishlist', true);
    if (empty($wishlist)) {
        $wishlist = array();
    } else {
        if (is_string($wishlist)) {
            $wishlist = json_decode($wishlist, true);
            if (!is_array($wishlist)) {
                $wishlist = array();
            }
        }
    }

    // Remove product from wishlist
    $wishlist = array_values(array_filter($wishlist, function ($id) use ($product_id) {
        return $id != $product_id;
    }));

    update_user_meta($user_id, 'wishlist', $wishlist);

    return rest_ensure_response(array('wishlist' => $wishlist));
}

