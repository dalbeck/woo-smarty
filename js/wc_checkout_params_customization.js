jQuery(document).ready(function($) {
    if (typeof wc_checkout_params !== 'undefined' && typeof custom_params !== 'undefined') {
        wc_checkout_params.is_user_logged_in = custom_params.is_user_logged_in;
        wc_checkout_params.has_saved_billing_address = custom_params.has_saved_billing_address;
        wc_checkout_params.has_saved_shipping_address = custom_params.has_saved_shipping_address;
        console.log('is_user_logged_in:', wc_checkout_params.is_user_logged_in);
        console.log('has_saved_billing_address:', wc_checkout_params.has_saved_billing_address);
        console.log('has_saved_shipping_address:', wc_checkout_params.has_saved_shipping_address);
    } else {
        console.log('wc_checkout_params or custom_params is not defined.');
    }
});
