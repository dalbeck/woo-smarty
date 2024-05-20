const ValidationModule = (() => {
    const apiUrl = smarty_params.api_url;
    const apiKey = smarty_params.api_key;
    let apiResponseData;
    let bypassApiCall = false;
    let currentAddressType = 'billing';

    const billingRequiredFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];
    const billingAllFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state', '#billing_address_2'];
    const shippingRequiredFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state'];
    const shippingAllFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state', '#shipping_address_2'];

    function allRequiredFieldsFilled(fields) {
        return fields.every(selector => {
            const input = jQuery(selector);
            return input.length && input.val().trim();
        });
    }

    function handleAddressValidation(fields, addressType) {
        currentAddressType = addressType;
        const requiredFields = addressType === 'billing' ? billingRequiredFields : shippingRequiredFields;

        if (!bypassApiCall && allRequiredFieldsFilled(requiredFields)) {
            const street = jQuery(fields[0]).val().trim();
            const city = jQuery(fields[1]).val().trim();
            const state = jQuery(fields[3]).val().trim();
            const zipcode = jQuery(fields[2]).val().trim();

            const requestUrl = `${apiUrl}?key=${apiKey}&street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zipcode)}&match=invalid&candidates=10`;

            console.log(`Validating ${addressType} address:`, { street, city, state, zipcode });
            console.log('Request URL:', requestUrl);

            fetch(requestUrl)
                .then(response => {
                    console.log('API response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('API response:', data);
                    const modal = jQuery('#address-validation-modal');
                    const content = jQuery('#address-validation-content');
                    const apiColContainer = content.find('.api-col-container');
                    const validationFailedMessage = jQuery('#validation-failed-message');
                    const addressNotFoundMessage = jQuery('#address-not-found-message');
                    const failedFieldsList = jQuery('#failed-fields-list');

                    // Remove validation-failed class and data-validated attribute from all fields
                    fields.forEach(selector => {
                        const input = jQuery(selector);
                        if (input.length) {
                            input.removeClass('validation-failed');
                            const wrapper = input.closest('.woocommerce-input-wrapper');
                            if (wrapper.length) {
                                wrapper.removeAttr('data-validated');
                            }
                            input.removeAttr('readonly');
                            input.removeClass('readonly');
                            input.css('background-color', '');
                            if (selector === '#shipping_state' || selector === '#billing_state') {
                                input.prop('disabled', false);
                                input.removeClass('readonly');
                                input.siblings('.select2-container').find('span.selection').removeClass('readonly');
                            }
                        }
                    });

                    if (data.length > 0 && data[0].components) {
                        const analysis = data[0].analysis;
                        if (analysis.footnotes && analysis.footnotes.startsWith('F')) {
                            jQuery('#modal-heading').text('Invalid Address');
                            apiColContainer.hide();
                            validationFailedMessage.hide();
                            addressNotFoundMessage.show();
                            modal.show();
                        } else {
                            apiResponseData = data;
                            const components = data[0].components;
                            console.log('Validated Address:', components);
                            jQuery('#user-entered-address').html(`
                                <span class="modal-street">${street}</span>
                                <span class="modal-city">${city}</span>
                                <span class="modal-state">${state}</span>
                                <span class="modal-zip">${zipcode}</span>
                            `);
                            const secondaryAddress = components.secondary_designator
                                ? `${components.secondary_designator} ${components.delivery_point}`
                                : '';
                            jQuery('#api-suggested-address').html(`
                                <span class="modal-street">${components.primary_number} ${components.street_name} ${components.street_suffix || ''}</span>
                                ${secondaryAddress ? `<span>${secondaryAddress}</span>` : ''}
                                <span class="modal-city">${components.city_name}</span>
                                <span class="modal-state">${components.state_abbreviation}</span>
                                <span class="modal-zip">${components.zipcode}</span>
                                ${components.plus4_code ? `<span class="modal-zip-extended">-${components.plus4_code}</span>` : ''}
                            `);
                            jQuery('#modal-heading').text(`Confirm ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`);
                            apiColContainer.show();
                            validationFailedMessage.hide();
                            addressNotFoundMessage.hide();
                            modal.show();

                            // Add data-validated attribute to wrapper of fields
                            fields.forEach(selector => {
                                const input = jQuery(selector);
                                if (input.length && input.val().trim()) {
                                    const wrapper = input.closest('.woocommerce-input-wrapper');
                                    if (wrapper.length) {
                                        wrapper.attr('data-validated', 'true');
                                    }
                                    input.attr('readonly', 'true');
                                    input.addClass('readonly');
                                    input.css('background-color', '#f0f0f0');
                                    if (selector === '#shipping_state' || selector === '#billing_state') {
                                        input.addClass('readonly');
                                        input.siblings('.select2-container').find('span.selection').addClass('readonly');
                                    }
                                }
                            });

                            if (components.secondary_designator && components.delivery_point) {
                                jQuery(fields[4]).val(secondaryAddress);
                            }

                            const address2 = jQuery(fields[4]);
                            if (address2.length) {
                                address2.attr('readonly', 'true');
                                address2.addClass('readonly');
                                address2.css('background-color', '#f0f0f0');
                            }

                            const editAddressLinkId = addressType === 'billing' ? '#edit-billing-address-link' : '#edit-shipping-address-link';
                            const container = addressType === 'billing' ? jQuery('#billing_email_field') : jQuery('.woocommerce-shipping-fields');
                            if (container.length && !jQuery(editAddressLinkId).length) {
                                const editAddressLink = jQuery('<a>', {
                                    id: editAddressLinkId.substring(1),
                                    href: '#',
                                    text: `Click here to update your ${addressType} address.`,
                                    style: 'display: block; margin-top: 10px;'
                                });
                                container.after(editAddressLink);

                                editAddressLink.on('click', function(event) {
                                    event.preventDefault();
                                    if (addressType === 'billing') {
                                        billingAllFields.forEach(selector => {
                                            const input = jQuery(selector);
                                            if (input.length) {
                                                input.removeAttr('readonly');
                                                input.removeClass('readonly');
                                                input.css('background-color', '');
                                                if (selector === '#billing_state') {
                                                    input.siblings('.select2-container').find('span.selection').removeClass('readonly');
                                                }
                                            }
                                        });
                                    } else {
                                        shippingAllFields.forEach(selector => {
                                            const input = jQuery(selector);
                                            if (input.length) {
                                                input.removeAttr('readonly');
                                                input.removeClass('readonly');
                                                input.css('background-color', '');
                                                if (selector === '#shipping_state') {
                                                    input.siblings('.select2-container').find('span.selection').removeClass('readonly');
                                                }
                                            }
                                        });
                                    }
                                    jQuery(editAddressLinkId).remove();
                                });
                            }
                        }
                    } else {
                        console.log('Address validation failed:', data);
                        jQuery('#modal-heading').text('Invalid Address');
                        apiColContainer.hide();
                        validationFailedMessage.show();
                        addressNotFoundMessage.hide();
                        modal.show();

                        requiredFields.forEach(selector => {
                            const input = jQuery(selector);
                            if (input.length) {
                                input.addClass('validation-failed');
                            }
                        });

                        failedFieldsList.html(requiredFields.map(selector => {
                            const input = jQuery(selector);
                            if (input.length && !input.val().trim()) {
                                return `<li>${selector.replace(`#${addressType}_`, '').replace('_', ' ').replace(/\b\w/g, l.toUpperCase())}</li>`;
                            }
                            return '';
                        }).join(''));
                    }
                })
                .catch(error => {
                    console.error('AJAX error:', error);
                    jQuery('#modal-heading').text('Invalid Address');
                    const modal = jQuery('#address-validation-modal');
                    const content = jQuery('#address-validation-content');
                    const apiColContainer = content.find('.api-col-container');
                    const validationFailedMessage = jQuery('#validation-failed-message');
                    const addressNotFoundMessage = jQuery('#address-not-found-message');
                    const failedFieldsList = jQuery('#failed-fields-list');

                    apiColContainer.hide();
                    validationFailedMessage.show();
                    addressNotFoundMessage.hide();
                    modal.show();

                    requiredFields.forEach(selector => {
                        const input = jQuery(selector);
                        if (input.length) {
                            input.addClass('validation-failed');
                        }
                    });

                    failedFieldsList.html(requiredFields.map(selector => {
                        const input = jQuery(selector);
                        if (input.length && !input.val().trim()) {
                            return `<li>${selector.replace(`#${addressType}_`, '').replace('_', ' ').replace(/\b\w/g, l.toUpperCase())}</li>`;
                        }
                        return '';
                    }).join(''));
                });
        } else {
            console.log(`${addressType} address fields are not completely filled.`);
        }
    }

    // Event handler for 'use-corrected-address' button
    jQuery('#use-corrected-address').on('click', () => {
        if (apiResponseData) {
            bypassApiCall = true;

            const components = apiResponseData[0].components;
            const addressFields = currentAddressType === 'billing' ? billingAllFields : shippingAllFields;

            jQuery(addressFields[0]).val(`${components.primary_number} ${components.street_name} ${components.street_suffix || ''}`);
            const secondaryAddress = components.secondary_designator
                ? `${components.secondary_designator} ${components.delivery_point}`
                : '';
            if (components.secondary_designator && components.delivery_point) {
                jQuery(addressFields[4]).val(secondaryAddress);
            }
            jQuery(addressFields[1]).val(components.city_name);
            jQuery(addressFields[2]).val(`${components.zipcode}${components.plus4_code ? '-' + components.plus4_code : ''}`);
            const stateField = jQuery(addressFields[3]);
            stateField.val(components.state_abbreviation);
            stateField.trigger('change');

            addressFields.forEach(selector => {
                const input = jQuery(selector);
                if (input.length && input.val().trim()) {
                    const wrapper = input.closest('.woocommerce-input-wrapper');
                    if (wrapper.length) {
                        wrapper.attr('data-validated', 'true');
                        input.attr('readonly', 'true');
                        input.addClass('readonly');
                        input.css('background-color', '#f0f0f0');
                        if (selector.endsWith('_state')) {
                            input.addClass('readonly');
                            input.siblings('.select2-container').find('span.selection').addClass('readonly');
                        }
                    }
                }
            });

            setTimeout(() => {
                bypassApiCall = false;
                jQuery('#address-validation-modal').hide();
            }, 100);
        }
    });

    // Event handler for 'use-original-address' button
    jQuery('#use-original-address').on('click', () => {
        const fields = currentAddressType === 'billing' ? billingAllFields : shippingAllFields;
        fields.forEach(selector => {
            const input = jQuery(selector);
            if (input.length) {
                const wrapper = input.closest('.woocommerce-input-wrapper');
                if (wrapper.length) {
                    wrapper.removeAttr('data-validated');
                }
                input.removeAttr('readonly');
                input.removeClass('readonly');
                input.css('background-color', '');
                if (selector === '#shipping_state' || selector === '#billing_state') {
                    input.prop('disabled', false);
                    input.siblings('.select2-container').find('span.selection').removeClass('readonly');
                }
            }
        });
        jQuery('#address-validation-modal').hide();
    });

    return {
        handleAddressValidation
    };
})();

export const { handleAddressValidation } = ValidationModule;
