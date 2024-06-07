jQuery(document).ready(function($) {
    // Handle the use of the original address
    $('#use-original-address').on('click', () => {
        $('#address-validation-modal').hide();
        // Remove data-validated attribute and readonly class from current address type fields
        const fields = window.currentAddressType === 'billing' ? window.billingAllFields : window.shippingAllFields;
        fields.forEach(selector => {
            const input = $(selector);
            if (input.length) {
                const wrapper = input.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                }
                input.removeAttr('readonly');
                input.removeClass('readonly'); // Remove readonly class
                input.css('background-color', ''); // Reset background color
                if (selector.endsWith('_state')) {
                    input.prop('disabled', false); // Enable the select field
                    input.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
                }
            }
        });
    });

    // Handle the use of the corrected address
    $('#use-corrected-address').on('click', () => {
        const selectedAddressIndex = $('input[name="suggested-address"]:checked').val();
        if (window.apiResponseData && selectedAddressIndex !== undefined) {
            bypassApiCall = true;

            const selectedAddress = window.apiResponseData[selectedAddressIndex];
            const components = selectedAddress.components;
            const metadata = selectedAddress.metadata;
            const analysis = selectedAddress.analysis;
            let deliveryLine1 = selectedAddress.delivery_line_1;
            const deliveryLine2 = selectedAddress.delivery_line_2 || ''; // Get delivery_line_2 if present
            const addressFields = window.currentAddressType === 'billing' ? window.billingAllFields : window.shippingAllFields;

            let suggestedStreet = '';
            if (metadata.zip_type === 'Military') {
                suggestedStreet = `${deliveryLine1}`;
            } else if (metadata.record_type === 'P') {
                suggestedStreet = `${components.street_name} ${components.primary_number}`;
            } else {
                suggestedStreet = `${components.primary_number} ${components.street_predirection || ''} ${components.street_name} ${components.street_suffix || ''} ${components.street_postdirection || ''}`.trim();
            }

            // Modify deliveryLine1 based on dpv_match_code and dpv_footnotes
            if (analysis.dpv_match_code === 'S' || analysis.dpv_footnotes.includes('TA')) {
                components.primary_number = components.primary_number.replace(/([0-9]+)[A-Za-z]?$/, '$1'); // Strip trailing alpha character from primary_number
                deliveryLine1 = `${components.primary_number} ${components.street_name} ${components.street_suffix}`.trim();
                console.log('Modified deliveryLine1 for dpv_match_code "S" or dpv_footnotes containing "TA":', deliveryLine1);
            }

            $(addressFields[0]).val(suggestedStreet);
            const secondaryAddress = components.secondary_designator
                ? `${components.secondary_designator} ${components.secondary_number}`
                : '';
            const urbanization = components.urbanization || '';
            let address2Value = deliveryLine2 || secondaryAddress;

            if (urbanization) {
                address2Value = `${urbanization} ${address2Value}`.trim();
            }
            $(addressFields[4]).val(address2Value);
            $(addressFields[1]).val(components.city_name);
            $(addressFields[2]).val(`${components.zipcode}${components.plus4_code ? '-' + components.plus4_code : ''}`);
            const stateField = $(addressFields[3]);
            stateField.val(components.state_abbreviation);
            stateField.trigger('change');

            // Add data-validated attribute to wrapper of fields
            addressFields.forEach(selector => {
                const input = $(selector);
                if (input.length && input.val().trim()) {
                    const wrapper = input.closest('.woocommerce-input-wrapper');
                    if (wrapper.length) {
                        wrapper.attr('data-validated', 'true');
                        input.attr('readonly', 'true'); // Set readonly attribute
                        input.addClass('readonly'); // Add readonly class
                        input.css('background-color', '#f0f0f0'); // Gray out the input
                        if (selector.endsWith('_state')) {
                            input.addClass('readonly'); // Add readonly class
                            input.siblings('.select2-container').find('span.selection').addClass('readonly'); // Add readonly class to select2 container
                        }
                    }
                }
            });

            setTimeout(() => {
                bypassApiCall = false;
                $('#address-validation-modal').hide();
            }, 100);
        }
    });

    $('#close-validation-modal').on('click', () => {
        $('#address-validation-modal').hide();
    });

    $('#close-address-not-found-modal').on('click', () => {
        $('#address-validation-modal').hide();
    });

    $('#reenter-address').on('click', () => {
        $('#address-validation-modal').hide();
        // Remove data-validated attribute and readonly class from current address type fields
        const fields = window.currentAddressType === 'billing' ? window.billingAllFields : window.shippingAllFields;
        fields.forEach(selector => {
            const input = $(selector);
            if (input.length) {
                const wrapper = input.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                }
                input.removeAttr('readonly');
                input.removeClass('readonly'); // Remove readonly class
                input.css('background-color', ''); // Reset background color
                if (selector.endsWith('_state')) {
                    input.prop('disabled', false); // Enable the select field
                    input.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
                }
            }
        });
    });

    $('#submit-apartment-number').on('click', () => {
        const apartmentNumber = $('#apartment-number-input').val().trim();
        if (apartmentNumber) {
            $(window.currentAddressType === 'billing' ? '#billing_address_2' : '#shipping_address_2').val(apartmentNumber);
            $('#missing-apartment-number-message').hide();
            $('#address-validation-content').show();
            isMissingApartmentNumber = true;
            window.handleAddressValidation(window.currentAddressType === 'billing' ? window.billingAllFields : window.shippingAllFields, window.currentAddressType);
        }
    });

    $('#no-apartment-number').on('click', (e) => {
        e.preventDefault();
        $('#missing-apartment-number-message').hide();
        $('#address-validation-content').show();
        isMissingApartmentNumber = true;

        // Proceed to the next step without re-triggering the API call
        if (window.apiResponseData) {
            const components = window.apiResponseData[0].components;
            const addressFields = window.currentAddressType === 'billing' ? window.billingAllFields : window.shippingAllFields;

            // Populate the entered address
            $('#user-entered-address').html(`
                <span class="modal-street">${$(addressFields[0]).val().trim()} ${$(addressFields[4]).val().trim()}</span>
                <span class="modal-city">${$(addressFields[1]).val().trim()}</span>
                <span class="modal-state">${$(addressFields[3]).val().trim()}</span>
                <span class="modal-zip">${$(addressFields[2]).val().trim()}</span>
            `);

            // Populate the suggested address
            const suggestedStreet = components.primary_number + ' ' + components.street_name + ' ' + (components.street_suffix || '');
            $('#api-suggested-address').html(`
                <div class="suggested-address">
                    <label>
                        <input type="radio" name="suggested-address" value="0" checked>
                        <span>${suggestedStreet}, ${components.city_name}, ${components.state_abbreviation} ${components.zipcode}${components.plus4_code ? '-' + components.plus4_code : ''}</span>
                    </label>
                </div>
            `);

            $('#modal-heading').text(`Confirm ${window.currentAddressType.charAt(0).toUpperCase() + window.currentAddressType.slice(1)} Address`);
            $('#address-validation-content').show();
            $('#address-validation-modal').show();
        }
    });

    window.billingAllFields.forEach(selector => {
        const element = $(selector);
        if (element.length) {
            element.on('change', () => {
                window.handleAddressValidation(window.billingAllFields, 'billing');
            });

            element.on('input', () => {
                // Remove validation class and re-enable inputs when user starts typing
                const wrapper = element.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                    element.removeAttr('readonly'); // Remove readonly attribute
                    element.removeClass('readonly'); // Remove readonly class
                    element.css('background-color', ''); // Remove gray out
                    if (selector === '#billing_state') {
                        element.prop('disabled', false); // Enable the select field
                        element.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
                    }
                }
            });
        } else {
            console.error(`Element not found for selector: ${selector}`);
        }
    });

    window.shippingAllFields.forEach(selector => {
        const element = $(selector);
        if (element.length) {
            element.on('change', () => {
                const checkbox = $('#ship-to-different-address-checkbox');
                if (checkbox.length && checkbox.is(':checked')) {
                    window.handleAddressValidation(window.shippingAllFields, 'shipping');
                }
            });

            element.on('input', () => {
                // Remove validation class and re-enable inputs when user starts typing
                const wrapper = element.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                    element.removeAttr('readonly'); // Remove readonly attribute
                    element.removeClass('readonly'); // Remove readonly class
                    element.css('background-color', ''); // Remove gray out
                    if (selector === '#shipping_state') {
                        element.prop('disabled', false); // Enable the select field
                        element.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
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
            if (this.checked) {
                // Clear all shipping fields when checkbox is clicked
                window.shippingAllFields.forEach(selector => {
                    const input = $(selector);
                    if (input.length) {
                        input.val('');
                        if (selector === '#shipping_state') {
                            input.prop('selectedIndex', 0); // Reset the select field
                        }
                    }
                });
            } else {
                $('#address-validation-modal').hide(); // Hide modal if shipping is unchecked
            }
        });
    } else {
        console.error('Shipping address checkbox not found');
    }
});
