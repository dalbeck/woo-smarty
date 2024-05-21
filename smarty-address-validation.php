<?php
/**
 * Plugin Name: Smarty Address Validation for WooCommerce
 * Plugin URI: https://www.ecosmetics.com
 * Description: Integrates Smarty address validation API into WooCommerce checkout fields.
 * Version: 1.0.5
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

add_filter('default_checkout_billing_country', 'change_default_checkout_country');
add_filter('default_checkout_billing_state', 'change_default_checkout_state');
add_filter('default_checkout_shipping_country', 'change_default_checkout_country');
add_filter('default_checkout_shipping_state', 'change_default_checkout_state');

/**
 * Changes the default checkout country in WooCommerce.
 *
 * This function is used to prevent WooCommerce from auto-filling the country field during checkout.
 * It returns an empty string, effectively setting the default country to none.
 *
 * @return string Empty string to set the default country to none.
 */
function change_default_checkout_country()
{
    return ''; // country code
}

/**
 * Changes the default checkout state in WooCommerce.
 *
 * This function is used to prevent WooCommerce from auto-filling the state field during checkout.
 * It returns an empty string, effectively setting the default state to none.
 *
 * @return string Empty string to set the default state to none.
 */
function change_default_checkout_state()
{
    return ''; // state code
}

include_once(dirname(__FILE__) . '/lib/smarty-api-functions.php');
include_once(dirname(__FILE__) . '/lib/smarty-settings.php');
