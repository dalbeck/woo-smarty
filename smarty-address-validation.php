<?php
/**
 * Plugin Name: Smarty Address Validation for WooCommerce
 * Plugin URI: https://www.ecosmetics.com
 * Description: Integrates Smarty address validation API into WooCommerce checkout fields.
 * Version: 1.0
 * Author: Danny Albeck
 * Author URI: https://www.ecosmetics.com
 * License: GPL2
 * WC requires at least: 3.0
 * WC tested up to: 5.9
 */

defined( 'ABSPATH' ) or die( 'No script' );

// Check if WooCommerce is active
if ( !in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
    add_action( 'admin_notices', function() {
        echo '<div class="error"><p>This plugin requires WooCommerce to be installed and active.</p></div>';
    });
    return;
}

function smarty_enqueue_scripts() {
    if ( is_checkout() ) {
        wp_enqueue_script('smarty-validation-js', plugins_url('js/validation.js', __FILE__), array(), '1.0', true);
        wp_enqueue_style( 'smarty-validation-css', plugins_url( 'css/style.css', __FILE__ ), array(), '1.0' );
    }
}

add_action( 'wp_enqueue_scripts', 'smarty_enqueue_scripts' );

include_once(dirname(__FILE__) . '/lib/smarty-api-functions.php');
include_once(dirname(__FILE__) . '/lib/smarty-settings.php');
