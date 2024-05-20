jQuery(document).ready(function($) {
    const billingAllFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state', '#billing_address_2'];
    const shippingAllFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state', '#shipping_address_2'];

    // Function to ensure fields are populated correctly
    function populateCheckoutFields() {
        const billingFields = {
            billing_address_1: '#billing_address_1',
            billing_address_2: '#billing_address_2',
            billing_city: '#billing_city',
            billing_state: '#billing_state',
            billing_postcode: '#billing_postcode'
        };

        const shippingFields = {
            shipping_address_1: '#shipping_address_1',
            shipping_address_2: '#shipping_address_2',
            shipping_city: '#shipping_city',
            shipping_state: '#shipping_state',
            shipping_postcode: '#shipping_postcode'
        };

        // Update the Braintree fields with the current form values
        for (let field in billingFields) {
            const input = $(billingFields[field]);
            if (input.length) {
                wc_braintree_checkout_fields[field].value = input.val().trim();
            }
        }

        const shipToDifferentAddress = $('#ship-to-different-address-checkbox');
        if (shipToDifferentAddress.length && shipToDifferentAddress.is(':checked')) {
            for (let field in shippingFields) {
                const input = $(shippingFields[field]);
                if (input.length) {
                    wc_braintree_checkout_fields[field].value = input.val().trim();
                }
            }
        }

        // Log updated fields for debugging
        console.log('Updated wc_braintree_checkout_fields:', wc_braintree_checkout_fields);
    }

    // Hook into the WooCommerce checkout place order process
    $(document.body).on('checkout_place_order', function() {
        console.log('checkout_place_order triggered');

        // Populate fields before the form is submitted
        populateCheckoutFields();

        // Ensure fields are not disabled before submission
        const fieldsToEnable = [
            '#billing_address_1', '#billing_address_2', '#billing_city',
            '#billing_state', '#billing_postcode',
            '#shipping_address_1', '#shipping_address_2', '#shipping_city',
            '#shipping_state', '#shipping_postcode'
        ];

        fieldsToEnable.forEach(selector => {
            const input = $(selector);
            if (input.length) {
                input.removeAttr('disabled');
            }
        });

        // Return true to allow the checkout process to continue
        return true;
    });

    // Also hook into the beforeSend of the AJAX request to ensure the fields are enabled
    $(document).ajaxSend(function(event, jqXHR, settings) {
        if (settings.url === wc_checkout_params.checkout_url) {
            console.log('ajaxSend triggered for checkout');
            populateCheckoutFields();

            const fieldsToEnable = [
                '#billing_address_1', '#billing_address_2', '#billing_city',
                '#billing_state', '#billing_postcode',
                '#shipping_address_1', '#shipping_address_2', '#shipping_city',
                '#shipping_state', '#shipping_postcode'
            ];

            fieldsToEnable.forEach(selector => {
                const input = $(selector);
                if (input.length) {
                    input.removeAttr('disabled');
                }
            });
        }
    });

    // Clear fields if the user is not logged in
    if (typeof wc_checkout_params !== 'undefined' && !wc_checkout_params.is_logged_in) {
        billingAllFields.concat(shippingAllFields).forEach(selector => {
            const input = $(selector);
            if (input.length) {
                input.val('');
                if (selector === '#billing_state' || selector === '#shipping_state') {
                    input.prop('selectedIndex', 0); // Reset the select field
                }
            }
        });
    }

    console.log('Address validation script setup complete');
});
