jQuery(document).ready(function($) {
    const apiUrl = smarty_params.api_url;
    const apiKey = smarty_params.api_key;
    const authToken = smarty_params.auth_token;
    const authId = smarty_params.auth_id;
    window.apiResponseData = null;
    window.currentAddressType = 'billing'; // Default to billing, will be updated dynamically
    let bypassApiCall = false;
    let isMissingApartmentNumber = false;

    function handleAddressValidation(fields, addressType) {
        window.currentAddressType = addressType; // Update currentAddressType dynamically
        const requiredFields = addressType === 'billing' ? window.billingRequiredFields : window.shippingRequiredFields;

        if (!bypassApiCall && window.allRequiredFieldsFilled(requiredFields)) {
            let street = $(fields[0]).val().trim();
            const street2 = $(fields[4]).val().trim(); // Address line 2 (e.g., apartment number)
            const city = $(fields[1]).val().trim();
            const state = $(fields[3]).val().trim();
            const zipcode = $(fields[2]).val().trim();

            const enteredStreet = street;

            const requestUrl = `${apiUrl}?key=${apiKey}&street=${encodeURIComponent(street)}&street2=${encodeURIComponent(street2)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zipcode)}&match=enhanced&candidates=10&license=us-core-cloud`;

            console.log(`Validating ${addressType} address:`, { street, street2, city, state, zipcode });
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
                        const metadata = data[0].metadata;
                        console.log('Detected zip_type:', metadata.zip_type);
                        console.log('Detected record_type:', metadata.record_type);

                        // Check if the record_type is 'H' and the secondary address is missing
                        if (metadata.record_type === 'H' && !street2 && !isMissingApartmentNumber) {
                            console.log('Detected record_type H with missing apartment/unit number');
                            $('#missing-apartment-number-message').show();
                            $('#address-validation-content').hide();
                            $('#address-validation-modal').show();
                            return;
                        }

                        if (analysis.footnotes && analysis.footnotes.startsWith('F')) {
                            // Show address not found message
                            $('#modal-heading').text('Invalid Address');
                            apiColContainer.hide();
                            validationFailedMessage.hide();
                            addressNotFoundMessage.show();
                            modal.show();
                        } else {
                            window.apiResponseData = data;
                            const components = data[0].components;
                            let deliveryLine1 = data[0].delivery_line_1 || '';
                            const deliveryLine2 = data[0].delivery_line_2 || ''; // Get delivery_line_2 if present

                            // Log the dpv_match_code and dpv_footnotes for debugging
                            console.log('dpv_match_code:', analysis.dpv_match_code);
                            console.log('dpv_footnotes:', analysis.dpv_footnotes);

                            // Modify deliveryLine1 based on dpv_match_code and dpv_footnotes
                            if (analysis.dpv_match_code === 'S' || analysis.dpv_footnotes.includes('TA')) {
                                components.primary_number = components.primary_number.replace(/([0-9]+)[A-Za-z]?$/, '$1'); // Strip trailing alpha character from primary_number
                                deliveryLine1 = `${components.primary_number} ${components.street_name} ${components.street_suffix}`.trim();
                                console.log('Modified deliveryLine1 for dpv_match_code "S" or dpv_footnotes containing "TA":', deliveryLine1);
                            }

                            console.log('Validated Address:', components);  // Specifically log the validated address components
                            $('#user-entered-address').html(`
                                <span class="modal-street">${enteredStreet} ${street2}</span>
                                <span class="modal-city">${city}</span>
                                <span class="modal-state">${state}</span>
                                <span class="modal-zip">${zipcode}</span>
                            `);

                            if (data.length === 1) {
                                // Use the single suggested address directly
                                const singleAddress = data[0];
                                const components = singleAddress.components;
                                const fullAddress = `
                                    <div class="suggested-address single-response">
                                        <span>${components.primary_number} ${components.street_predirection || ''} ${components.street_name} ${components.street_suffix || ''} ${components.street_postdirection || ''}</span>
                                        <span>${components.city_name}</span>
                                        <span>${components.state_abbreviation}</span>
                                        <span>${components.zipcode}${components.plus4_code ? '-' + components.plus4_code : ''}</span>
                                    </div>`;
                                $('#api-suggested-address').html(fullAddress);
                            } else {
                                // Add radio buttons for each suggested address
                                let suggestedAddressesHTML = data.map((address, index) => {
                                    const components = address.components;
                                    let deliveryLine1 = address.delivery_line_1 || '';
                                    const deliveryLine2 = address.delivery_line_2 || '';
                                    const secondaryAddress = (components.secondary_designator && components.secondary_number)
                                        ? `${components.secondary_designator} ${components.secondary_number}`
                                        : '';
                                    const urbanization = components.urbanization || '';
                                    const suggestedStreet = `${components.primary_number} ${components.street_predirection || ''} ${components.street_name} ${components.street_suffix || ''} ${components.street_postdirection || ''}`.trim();

                                    // Modify deliveryLine1 based on dpv_match_code and dpv_footnotes
                                    if (address.analysis.dpv_match_code === 'S' || address.analysis.dpv_footnotes.includes('TA')) {
                                        components.primary_number = components.primary_number.replace(/([0-9]+)[A-Za-z]?$/, '$1'); // Strip trailing alpha character from primary_number
                                        deliveryLine1 = `${components.primary_number} ${components.street_name} ${components.street_suffix}`.trim();
                                        console.log('Modified deliveryLine1 for dpv_match_code "S" or dpv_footnotes containing "TA":', deliveryLine1);
                                    }

                                    const fullAddress = `${suggestedStreet}, ${components.city_name}, ${components.state_abbreviation} ${components.zipcode}${components.plus4_code ? '-' + components.plus4_code : ''}`;

                                    return `
                                        <div class="suggested-address">
                                            <label>
                                                <input type="radio" name="suggested-address" value="${index}" ${index === 0 ? 'checked' : ''}>
                                                <span>${fullAddress}</span>
                                            </label>
                                        </div>`;
                                }).join('');

                                $('#api-suggested-address').html(suggestedAddressesHTML);
                            }

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

                            // Populate address_2 with delivery_line_2 if present, else use secondary_designator and secondary_number
                            let address2Value = deliveryLine2 || '';
                            if (!address2Value && components.secondary_designator && components.secondary_number) {
                                address2Value = `${components.secondary_designator} ${components.secondary_number}`;
                            }

                            // Add urbanization to address_2 if present
                            if (components.urbanization) {
                                address2Value = `${components.urbanization} ${address2Value}`.trim();
                            }

                            // Set the value for address_2
                            $(fields[4]).val(address2Value);

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
                                        window.billingAllFields.forEach(selector => {
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
                                        window.shippingAllFields.forEach(selector => {
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
                    const missingApartmentNumberMessage = $('#missing-apartment-number-message');
                    const failedFieldsList = $('#failed-fields-list');

                    apiColContainer.hide();
                    validationFailedMessage.show();
                    addressNotFoundMessage.hide();
                    missingApartmentNumberMessage.hide();
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

    window.handleAddressValidation = handleAddressValidation;
});
