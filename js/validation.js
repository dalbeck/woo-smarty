document.addEventListener('DOMContentLoaded', function() {
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
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const apiUrl = smarty_params.api_url;
    const apiKey = smarty_params.api_key;
    const authId = smarty_params.auth_id;
    const authToken = smarty_params.auth_token;
    let apiResponseData;
    let bypassApiCall = false;
    let currentAddressType = 'billing'; // Default to billing, will be updated dynamically

    const fields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];
    const shippingFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state'];

    function allFieldsFilled(fields) {
        return fields.every(selector => {
            const input = document.querySelector(selector);
            return input && input.value;
        });
    }

    function handleAddressValidation(fields, addressType) {
        currentAddressType = addressType; // Update currentAddressType dynamically
        if (!bypassApiCall && allFieldsFilled(fields)) {
            const street = document.querySelector(fields[0]).value;
            const city = document.querySelector(fields[1]).value;
            const state = document.querySelector(fields[3]).value;
            const zipcode = document.querySelector(fields[2]).value;

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
                    const modal = document.getElementById('address-validation-modal');
                    const content = document.getElementById('address-validation-content');
                    const apiColContainer = content.querySelector('.api-col-container');
                    const validationFailedMessage = document.getElementById('validation-failed-message');
                    const addressNotFoundMessage = document.getElementById('address-not-found-message');
                    const failedFieldsList = document.getElementById('failed-fields-list');

                    // Remove validation-failed class from all fields
                    fields.forEach(selector => {
                        const input = document.querySelector(selector);
                        if (input) {
                            input.classList.remove('validation-failed');
                        }
                    });

                    if (data.length > 0 && data[0].components) {
                        const analysis = data[0].analysis;
                        if (analysis.footnotes && analysis.footnotes.startsWith('F')) {
                            // Show address not found message
                            document.getElementById('modal-heading').textContent = 'Invalid Address';
                            apiColContainer.style.display = 'none';
                            validationFailedMessage.style.display = 'none';
                            addressNotFoundMessage.style.display = 'block';
                            modal.style.display = 'flex';
                        } else {
                            apiResponseData = data;
                            const components = data[0].components;
                            console.log('Validated Address:', components);  // Specifically log the validated address components
                            document.getElementById('user-entered-address').innerHTML = `
                                <span class="modal-street">${street}</span>
                                <span class="modal-city">${city}</span>
                                <span class="modal-state">${state}</span>
                                <span class="modal-zip">${zipcode}</span>
                            `;
                            const secondaryAddress = components.secondary_designator
                                ? `${components.secondary_designator} ${components.delivery_point}`
                                : components.delivery_point || '';
                            document.getElementById('api-suggested-address').innerHTML = `
                                <span class="modal-street">${components.primary_number} ${components.street_name} ${components.street_suffix || ''}</span>
                                ${secondaryAddress ? `<span>${secondaryAddress}</span>` : ''}
                                <span class="modal-city">${components.city_name}</span>
                                <span class="modal-state">${components.state_abbreviation}</span>
                                <span class="modal-zip">${components.zipcode}</span>
                                ${components.plus4_code ? `<span class="modal-zip-extended">-${components.plus4_code}</span>` : ''}
                            `;
                            document.getElementById('modal-heading').textContent = `Confirm ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`;
                            apiColContainer.style.display = 'flex';
                            validationFailedMessage.style.display = 'none';
                            addressNotFoundMessage.style.display = 'none';
                            modal.style.display = 'flex';
                        }
                    } else {
                        console.log('Address validation failed:', data);
                        document.getElementById('modal-heading').textContent = 'Invalid Address';
                        apiColContainer.style.display = 'none';
                        validationFailedMessage.style.display = 'block';
                        addressNotFoundMessage.style.display = 'none';
                        modal.style.display = 'flex';

                        // Highlight the fields that failed validation
                        fields.forEach(selector => {
                            const input = document.querySelector(selector);
                            if (input) {
                                input.classList.add('validation-failed');
                            }
                        });

                        // Add list of failed fields to the modal
                        failedFieldsList.innerHTML = fields.map(selector => {
                            const input = document.querySelector(selector);
                            if (input && !input.value) {
                                return `<li>${selector.replace('#billing_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
                            }
                            return '';
                        }).join('');
                    }
                })
                .catch(error => {
                    console.error('AJAX error:', error);
                    document.getElementById('modal-heading').textContent = 'Invalid Address';
                    const modal = document.getElementById('address-validation-modal');
                    const content = document.getElementById('address-validation-content');
                    const apiColContainer = content.querySelector('.api-col-container');
                    const validationFailedMessage = document.getElementById('validation-failed-message');
                    const addressNotFoundMessage = document.getElementById('address-not-found-message');
                    const failedFieldsList = document.getElementById('failed-fields-list');

                    apiColContainer.style.display = 'none';
                    validationFailedMessage.style.display = 'block';
                    addressNotFoundMessage.style.display = 'none';
                    modal.style.display = 'flex';

                    // Highlight the fields that failed validation
                    fields.forEach(selector => {
                        const input = document.querySelector(selector);
                        if (input) {
                            input.classList.add('validation-failed');
                        }
                    });

                    // Add list of failed fields to the modal
                    failedFieldsList.innerHTML = fields.map(selector => {
                        const input = document.querySelector(selector);
                        if (input && !input.value) {
                            return `<li>${selector.replace('#billing_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
                        }
                        return '';
                    }).join('');
                });
        } else {
            console.log(`${addressType} address fields are not completely filled.`);
        }
    }

    document.getElementById('use-original-address').addEventListener('click', () => {
        document.getElementById('address-validation-modal').style.display = 'none';
    });

    document.getElementById('use-corrected-address').addEventListener('click', () => {
        if (apiResponseData) {
            bypassApiCall = true;

            const components = apiResponseData[0].components;
            const addressFields = currentAddressType === 'billing' ? fields : shippingFields;

            document.querySelector(addressFields[0]).value = components.primary_number + ' ' + components.street_name + ' ' + (components.street_suffix || '');
            const secondaryAddress = components.secondary_designator
                ? `${components.secondary_designator} ${components.delivery_point}`
                : components.delivery_point || '';
            if (secondaryAddress) {
                document.querySelector('#billing_address_2').value = secondaryAddress;
            }
            document.querySelector(addressFields[1]).value = components.city_name;
            document.querySelector(addressFields[2]).value = components.zipcode + (components.plus4_code ? '-' + components.plus4_code : '');
            const stateField = document.querySelector(addressFields[3]);
            stateField.value = components.state_abbreviation;
            stateField.dispatchEvent(new Event('change'));

            setTimeout(() => {
                bypassApiCall = false;
                document.getElementById('address-validation-modal').style.display = 'none';
            }, 100);
        }
    });

    document.getElementById('close-validation-modal').addEventListener('click', () => {
        document.getElementById('address-validation-modal').style.display = 'none';
    });

    document.getElementById('close-address-not-found-modal').addEventListener('click', () => {
        document.getElementById('address-validation-modal').style.display = 'none';
    });

    fields.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('change', () => {
                handleAddressValidation(fields, 'billing');
            });
        } else {
            console.error(`Element not found for selector: ${selector}`);
        }
    });

    shippingFields.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('change', () => {
                const checkbox = document.getElementById('ship-to-different-address-checkbox');
                if (checkbox && checkbox.checked) {
                    handleAddressValidation(shippingFields, 'shipping');
                }
            });
        } else {
            console.error(`Element not found for selector: ${selector}`);
        }
    });

    const checkbox = document.getElementById('ship-to-different-address-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            const modal = document.getElementById('address-validation-modal');
            if (!this.checked) {
                modal.style.display = 'none'; // Hide modal if shipping is unchecked
            }
        });
    } else {
        console.error('Shipping address checkbox not found');
    }

    console.log('Address validation script setup complete');
});
