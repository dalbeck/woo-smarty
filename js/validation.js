jQuery(document).ready(function($) {
    console.log('Address validation script loaded'); // Confirm script load

    // Create and append the modal structure to the body
    const modalHTML = `
        <div id="address-validation-modal" style="display: none;">
            <div class="inner-modal">
                <h4 id="modal-heading">Confirm Address</h4>
                <div id="address-validation-content">
                    <div class="api-col-container" style="display: none;">
                        <div class="api-col api-col-1">
                            <p><strong>Your Entered:</strong></p>
                            <div id="user-entered-address"></div>
                            <button id="use-original-address">Keep Original Address</button>
                        </div>
                        <div class="api-col api-col-2">
                            <p><strong>Suggested Address:</strong></p>
                            <div id="api-suggested-address"></div>
                            <button id="use-corrected-address">Use Suggested Address</button>
                        </div>
                    </div>
                    <div id="validation-failed-message" style="display: none;">
                        <p>Address validation failed. Please check your address and try again.</p>
                        <ul id="failed-fields-list"></ul>
                        <button id="close-validation-modal">Close</button>
                    </div>
                    <div id="address-not-found-message" style="display: none;">
                        <p>Address not found. The address, exactly as submitted, could not be found in the city, state, or ZIP Code provided. Either the primary number is missing, the street is missing, or the street is too badly misspelled to understand.</p>
                        <button id="close-address-not-found-modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    $('body').append(modalHTML);

    const apiUrl = smarty_params.api_url;
    const apiKey = smarty_params.api_key;
    let apiResponseData;
    let bypassApiCall = false;
    let currentAddressType = 'billing'; // Default to billing, will be updated dynamically

    const billingRequiredFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];
    const billingAllFields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state', '#billing_address_2'];
    const shippingRequiredFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state'];
    const shippingAllFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state', '#shipping_address_2'];

    function allRequiredFieldsFilled(fields) {
        return fields.every(selector => {
            const input = $(selector);
            return input.length && input.val().trim();
        });
    }

    function handleAddressValidation(fields, addressType) {
        currentAddressType = addressType; // Update currentAddressType dynamically
        const requiredFields = addressType === 'billing' ? billingRequiredFields : shippingRequiredFields;

        if (!bypassApiCall && allRequiredFieldsFilled(requiredFields)) {
            const street = $(fields[0]).val().trim();
            const city = $(fields[1]).val().trim();
            const state = $(fields[3]).val().trim();
            const zipcode = $(fields[2]).val().trim();

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
                    const modal = $('#address-validation-modal');
                    const content = $('#address-validation-content');
                    const apiColContainer = content.find('.api-col-container');
                    const validationFailedMessage = $('#validation-failed-message');
                    const addressNotFoundMessage = $('#address-not-found-message');
                    const failedFieldsList = $('#failed-fields-list');

                    // Remove validation-failed class and data-validated attribute from all fields
                    fields.forEach(selector => {
                        const input = $(selector);
                        if (input.length) {
                            input.removeClass('validation-failed');
                            const wrapper = input.closest('.woocommerce-input-wrapper');
                            if (wrapper.length) {
                                wrapper.removeAttr('data-validated');
                            }
                            input.removeAttr('readonly'); // Remove readonly attribute
                            input.removeClass('readonly'); // Remove readonly class
                            input.css('background-color', ''); // Reset background color
                            if (selector === '#shipping_state' || selector === '#billing_state') {
                                input.prop('disabled', false); // Enable the select field
                                input.removeClass('readonly'); // Remove readonly class
                                // Remove readonly class from select2 container
                                input.siblings('.select2-container').find('span.selection').removeClass('readonly');
                            }
                        }
                    });

                    if (data.length > 0 && data[0].components) {
                        const analysis = data[0].analysis;
                        if (analysis.footnotes && analysis.footnotes.startsWith('F')) {
                            // Show address not found message
                            $('#modal-heading').text('Invalid Address');
                            apiColContainer.hide();
                            validationFailedMessage.hide();
                            addressNotFoundMessage.show();
                            modal.show();
                        } else {
                            apiResponseData = data;
                            const components = data[0].components;
                            console.log('Validated Address:', components);  // Specifically log the validated address components
                            $('#user-entered-address').html(`
                                <span class="modal-street">${street}</span>
                                <span class="modal-city">${city}</span>
                                <span class="modal-state">${state}</span>
                                <span class="modal-zip">${zipcode}</span>
                            `);
                            const secondaryAddress = components.secondary_designator
                                ? `${components.secondary_designator} ${components.delivery_point}`
                                : '';
                            $('#api-suggested-address').html(`
                                <span class="modal-street">${components.primary_number} ${components.street_predirection || ''} ${components.street_name} ${components.street_suffix || ''} ${components.street_postdirection || ''}</span>
                                ${secondaryAddress ? `<span>${secondaryAddress}</span>` : ''}
                                <span class="modal-city">${components.city_name}</span>
                                <span class="modal-state">${components.state_abbreviation}</span>
                                <span class="modal-zip">${components.zipcode}</span>
                                ${components.plus4_code ? `<span class="modal-zip-extended">-${components.plus4_code}</span>` : ''}
                            `);
                            $('#modal-heading').text(`Confirm ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`);
                            apiColContainer.show();
                            validationFailedMessage.hide();
                            addressNotFoundMessage.hide();
                            modal.show();

                            // Add data-validated attribute to wrapper of fields
                            fields.forEach(selector => {
                                const input = $(selector);
                                if (input.length && input.val().trim()) {
                                    const wrapper = input.closest('.woocommerce-input-wrapper');
                                    if (wrapper.length) {
                                        wrapper.attr('data-validated', 'true');
                                    }
                                    input.attr('readonly', 'true'); // Set readonly attribute
                                    input.addClass('readonly'); // Add readonly class
                                    input.css('background-color', '#f0f0f0'); // Gray out the input
                                    if (selector === '#shipping_state' || selector === '#billing_state') {
                                        input.addClass('readonly'); // Add readonly class
                                        // Add readonly class to select2 container
                                        input.siblings('.select2-container').find('span.selection').addClass('readonly');
                                    }
                                }
                            });

                            // Populate address_2 only if both secondary_designator and delivery_point are present
                            if (components.secondary_designator && components.delivery_point) {
                                $(fields[4]).val(secondaryAddress);
                            }

                            // Lock address_2 even if no value is present
                            const address2 = $(fields[4]);
                            if (address2.length) {
                                address2.attr('readonly', 'true');
                                address2.addClass('readonly'); // Add readonly class
                                address2.css('background-color', '#f0f0f0'); // Gray out the input
                            }

                            // Insert the link to allow re-editing the address fields
                            const editAddressLinkId = addressType === 'billing' ? '#edit-billing-address-link' : '#edit-shipping-address-link';
                            const container = addressType === 'billing' ? $('#billing_email_field') : $('.woocommerce-shipping-fields');
                            if (container.length && !$(editAddressLinkId).length) {
                                const editAddressLink = $('<a>', {
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
                                            const input = $(selector);
                                            if (input.length) {
                                                input.removeAttr('readonly');
                                                input.removeClass('readonly');
                                                input.css('background-color', ''); // Remove gray out
                                                if (selector === '#billing_state') {
                                                    input.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
                                                }
                                            }
                                        });
                                    } else {
                                        shippingAllFields.forEach(selector => {
                                            const input = $(selector);
                                            if (input.length) {
                                                input.removeAttr('readonly');
                                                input.removeClass('readonly');
                                                input.css('background-color', ''); // Remove gray out
                                                if (selector === '#shipping_state') {
                                                    input.siblings('.select2-container').find('span.selection').removeClass('readonly'); // Remove readonly class from select2 container
                                                }
                                            }
                                        });
                                    }
                                    $(editAddressLinkId).remove();
                                });
                            }
                        }
                    } else {
                        console.log('Address validation failed:', data);
                        $('#modal-heading').text('Invalid Address');
                        apiColContainer.hide();
                        validationFailedMessage.show();
                        addressNotFoundMessage.hide();
                        modal.show();

                        // Highlight the fields that failed validation
                        requiredFields.forEach(selector => {
                            const input = $(selector);
                            if (input.length) {
                                input.addClass('validation-failed');
                            }
                        });

                        // Add list of failed fields to the modal
                        failedFieldsList.html(requiredFields.map(selector => {
                            const input = $(selector);
                            if (input.length && !input.val().trim()) {
                                return `<li>${selector.replace(`#${addressType}_`, '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
                            }
                            return '';
                        }).join(''));
                    }
                })
                .catch(error => {
                    console.error('AJAX error:', error);
                    $('#modal-heading').text('Invalid Address');
                    const modal = $('#address-validation-modal');
                    const content = $('#address-validation-content');
                    const apiColContainer = content.find('.api-col-container');
                    const validationFailedMessage = $('#validation-failed-message');
                    const addressNotFoundMessage = $('#address-not-found-message');
                    const failedFieldsList = $('#failed-fields-list');

                    apiColContainer.hide();
                    validationFailedMessage.show();
                    addressNotFoundMessage.hide();
                    modal.show();

                    // Highlight the fields that failed validation
                    requiredFields.forEach(selector => {
                        const input = $(selector);
                        if (input.length) {
                            input.addClass('validation-failed');
                        }
                    });

                    // Add list of failed fields to the modal
                    failedFieldsList.html(requiredFields.map(selector => {
                        const input = $(selector);
                        if (input.length && !input.val().trim()) {
                            return `<li>${selector.replace(`#${addressType}_`, '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
                        }
                        return '';
                    }).join(''));
                });
        } else {
            console.log(`${addressType} address fields are not completely filled.`);
        }
    }

    $('#use-original-address').on('click', () => {
        $('#address-validation-modal').hide();
        // Remove data-validated attribute and readonly class from current address type fields
        const fields = currentAddressType === 'billing' ? billingAllFields : shippingAllFields;
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

    $('#use-corrected-address').on('click', () => {
        if (apiResponseData) {
            bypassApiCall = true;

            const components = apiResponseData[0].components;
            const addressFields = currentAddressType === 'billing' ? billingAllFields : shippingAllFields;

            $(addressFields[0]).val(`${components.primary_number} ${components.street_predirection || ''} ${components.street_name} ${components.street_suffix || ''} ${components.street_postdirection || ''}`);
            const secondaryAddress = components.secondary_designator
                ? `${components.secondary_designator} ${components.delivery_point}`
                : '';
            if (components.secondary_designator && components.delivery_point) {
                $(addressFields[4]).val(secondaryAddress);
            }
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

    billingAllFields.forEach(selector => {
        const element = $(selector);
        if (element.length) {
            element.on('change', () => {
                handleAddressValidation(billingAllFields, 'billing');
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
            const modal = $('#address-validation-modal');
            if (this.checked) {
                // Clear all shipping fields when checkbox is clicked
                shippingAllFields.forEach(selector => {
                    const input = $(selector);
                    if (input.length) {
                        input.val('');
                        if (selector === '#shipping_state') {
                            input.prop('selectedIndex', 0); // Reset the select field
                        }
                    }
                });
            } else {
                modal.hide(); // Hide modal if shipping is unchecked
            }
        });
    } else {
        console.error('Shipping address checkbox not found');
    }

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
