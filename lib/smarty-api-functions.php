<?php

/**
 * Enqueue Smarty validation script and localize script parameters for checkout.
 *
 * This function enqueues the Smarty validation JavaScript file on the WooCommerce checkout page.
 * It also localizes the script by passing the API URL and the stored API credentials from the database
 * to the script, enabling it to use these values during address validation.
 *
 * @return void
 */
function smarty_checkout_field_scripts()
{
    if (is_checkout()) {
        wp_enqueue_script('smarty-validation-js', plugins_url('js/validation.js', __FILE__), array(), '1.0', true);
        wp_enqueue_style('smarty-validation-css', plugins_url('css/style.css', __FILE__), array(), '1.0');

        wp_localize_script('smarty-validation-js', 'smarty_params', array(
            'api_url' => 'https://us-street.api.smarty.com/street-address',
            'api_key' => get_option('smarty_api_key'),
            'auth_id' => get_option('smarty_auth_id'),
            'auth_token' => get_option('smarty_auth_token'),
        ));
    }
}

add_action('wp_enqueue_scripts', 'smarty_checkout_field_scripts');
