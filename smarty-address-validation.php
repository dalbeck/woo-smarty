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
    return; // Stop execution of the script
}

function smarty_enqueue_scripts() {
    wp_enqueue_script( 'smarty-validation-js', plugins_url( 'js/validation.js', __FILE__ ), array('jquery'), '1.0', true );
    wp_enqueue_style( 'smarty-validation-css', plugins_url( 'css/style.css', __FILE__ ), array(), '1.0' );
}

add_action( 'wp_enqueue_scripts', 'smarty_enqueue_scripts' );

define('SMARTY_API_KEY', '23009612322313671');
define('SMARTY_AUTH_ID', '48f7f162-42ba-0878-5910-a746a172fa2d');
define('SMARTY_AUTH_TOKEN', '40Pmy8WbSNUcfhFlP9bl');

$api_key = defined('SMARTY_API_KEY') ? SMARTY_API_KEY : '';
$smarty_auth_id = defined('SMARTY_AUTH_ID') ? SMARTY_AUTH_ID : '';
$smarty_auth_token = defined('SMARTY_AUTH_TOKEN') ? SMARTY_AUTH_TOKEN : '';

function smarty_checkout_field_scripts()
{
    if (is_checkout()) {
        wp_enqueue_script('smarty-validation-js');
        wp_localize_script('smarty-validation-js', 'smarty_params', array(
            'api_url' => 'https://us-autocomplete-pro.api.smartystreets.com/lookup',
            'api_key' => defined('SMARTY_API_KEY') ? SMARTY_API_KEY : ''
        ));
    }
}
add_action('woocommerce_after_checkout_form', 'smarty_checkout_field_scripts');
