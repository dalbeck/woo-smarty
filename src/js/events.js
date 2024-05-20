import { handleAddressValidation } from './validation';

jQuery(document).ready(function($) {
    const billingAllFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state', '#billing_address_2'];
    const shippingAllFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state', '#shipping_address_2'];

    billingAllFields.forEach(selector => {
        const element = $(selector);
        if (element.length) {
            element.on('change', () => {
                handleAddressValidation(billingAllFields, 'billing');
            });

            element.on('input', () => {
                const wrapper = element.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                    element.removeAttr('readonly');
                    element.removeClass('readonly');
                    element.css('background-color', '');
                    if (selector === '#billing_state') {
                        element.prop('disabled', false);
                        element.siblings('.select2-container').find('span.selection').removeClass('readonly');
                    }
                }
            });
        } else {
            console.error(`Element not found for selector: ${selector}`);
        }
    });

    shippingAllFields.forEach(selector => {
        const element = $(selector);
        if (element.length) {
            element.on('change', () => {
                const checkbox = $('#ship-to-different-address-checkbox');
                if (checkbox.length && checkbox.is(':checked')) {
                    handleAddressValidation(shippingAllFields, 'shipping');
                }
            });

            element.on('input', () => {
                const wrapper = element.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                    element.removeAttr('readonly');
                    element.removeClass('readonly');
                    element.css('background-color', '');
                    if (selector === '#shipping_state') {
                        element.prop('disabled', false);
                        element.siblings('.select2-container').find('span.selection').removeClass('readonly');
                    }
                }
            });
        } else {
            console.error(`Element not found for selector: ${selector}`);
        }
    });

    const checkbox = $('#ship-to-different-address-checkbox');
    if (checkbox.length) {
        checkbox.on('change', function() {
            const modal = $('#address-validation-modal');
            if (this.checked) {
                shippingAllFields.forEach(selector => {
                    const input = $(selector);
                    if (input.length) {
                        input.val('');
                        if (selector === '#shipping_state') {
                            input.prop('selectedIndex', 0);
                        }
                    }
                });
            } else {
                modal.hide();
            }
        });
    } else {
        console.error('Shipping address checkbox not found');
    }
});
