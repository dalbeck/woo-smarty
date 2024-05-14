<?php

// define('SMARTY_API_KEY', '23009612322313671');
// define('SMARTY_AUTH_ID', '48f7f162-42ba-0878-5910-a746a172fa2d');
// define('SMARTY_AUTH_TOKEN', '40Pmy8WbSNUcfhFlP9bl');

function smarty_checkout_field_scripts()
{
    if (is_checkout()) {
        wp_enqueue_script('smarty-validation-js');
        wp_localize_script('smarty-validation-js', 'smarty_params', array(
            'api_url' => 'https://us-street.api.smartystreets.com/street-address',
            'api_key' => SMARTY_API_KEY
        ));
    }
}
add_action('woocommerce_after_checkout_form', 'smarty_checkout_field_scripts');
