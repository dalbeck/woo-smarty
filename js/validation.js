document.addEventListener('DOMContentLoaded', function() {
    // Create and append the modal structure to the body
    const modalHTML = `
        <div id="address-validation-modal" style="display: none;">
            <div class="inner-modal">
                <h4 id="modal-heading">Confirm Address</h4>
                <div class="api-col-container">
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
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const apiUrl = smarty_params.api_url;
    const apiKey = smarty_params.api_key;
    let apiResponseData;
    let bypassApiCall = false;

    const fields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];
    const shippingFields = ['#shipping_address_1', '#shipping_city', '#shipping_postcode', '#shipping_state'];

    function allFieldsFilled(fields) {
        return fields.every(selector => {
            const input = document.querySelector(selector);
            return input && input.value;
        });
    }

    function handleAddressValidation(fields, addressType) {
        if (!bypassApiCall && allFieldsFilled(fields)) {
            const street = document.querySelector(fields[0]).value;
            const city = document.querySelector(fields[1]).value;
            const state = document.querySelector(fields[3]).value;
            const zipcode = document.querySelector(fields[2]).value;

            fetch(`${apiUrl}?auth-token=${apiKey}&street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zipcode)}&candidates=1`)
                .then(response => response.json())
                .then(data => {
                    if (data[0] && data[0].components) {
                        apiResponseData = data;
                        const components = data[0].components;
                        console.log('Validated Address:', components);  // Specifically log the validated address components
                        document.getElementById('user-entered-address').innerHTML = `
                            <span class="modal-street">${street}</span>
                            <span class="modal-city">${city}</span>
                            <span class="modal-state">${state}</span>
                            <span class="modal-zip">${zipcode}</span>
                        `;
                        document.getElementById('api-suggested-address').innerHTML = `
                            <span class="modal-street">${components.primary_number} ${components.street_name}</span>
                            ${components.secondary_number ? `<span> ${components.secondary_number}</span>` : ''}
                            <span class="modal-city">${components.city_name}</span>
                            <span class="modal-state">${components.state_abbreviation}</span>
                            <span class="modal-zip">${components.zipcode}</span>
                            ${components.plus4_code ? `<span class="modal-zip-extended">-${components.plus4_code}</span>` : ''}
                        `;
                        document.getElementById('modal-heading').textContent = `Confirm ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`;
                        document.getElementById('address-validation-modal').style.display = 'flex';
                    } else {
                        document.querySelector(fields[0]).style.border = '2px solid red';
                    }
                })
                .catch(error => {
                    console.error('AJAX error:', error);
                    document.querySelector(fields[0]).style.border = '2px solid orange';
                });
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

            document.querySelector(addressFields[0]).value = components.primary_number + ' ' + components.street_name;
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

    fields.forEach(selector => {
        document.querySelector(selector).addEventListener('change', () => {
            handleAddressValidation(fields, 'billing');
        });
    });

    shippingFields.forEach(selector => {
        document.querySelector(selector).addEventListener('change', () => {
            const checkbox = document.getElementById('ship-to-different-address-checkbox');
            if (checkbox && checkbox.checked) {
                handleAddressValidation(shippingFields, 'shipping');
            }
        });
    });

    document.getElementById('ship-to-different-address-checkbox').addEventListener('change', function() {
        const modal = document.getElementById('address-validation-modal');
        if (!this.checked) {
            modal.style.display = 'none'; // Hide modal if shipping is unchecked
        }
    });

    console.log('Address validation script loaded');
});
