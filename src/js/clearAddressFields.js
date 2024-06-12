(function($) {
    $(document).ready(function() {
        console.log('Address validation script loaded'); // Confirm script load

        const billingRequiredFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];
        const billingAllFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state', '#billing_address_2'];
        const shippingRequiredFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state'];
        const shippingAllFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state', '#shipping_address_2'];

        if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.is_user_logged_in === "0") {
            const fieldsToClear = [
                '#billing_address_1', '#billing_address_2', '#billing_city',
                '#billing_state', '#billing_postcode', '#shipping_address_1',
                '#shipping_address_2', '#shipping_city', '#shipping_state', '#shipping_postcode'
            ];

            fieldsToClear.forEach(selector => {
                const input = $(selector);
                if (input.length) {
                    input.val('');
                    if (selector === '#billing_state' || selector === '#shipping_state') {
                        input.prop('selectedIndex', 0); // Reset the select field
                    }
                }
            });

            console.log('Checkout fields cleared for guest users.');
        }

        window.billingRequiredFields = billingRequiredFields;
        window.billingAllFields = billingAllFields;
        window.shippingRequiredFields = shippingRequiredFields;
        window.shippingAllFields = shippingAllFields;
    });
})(jQuery);
