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

    $('#close-validation-modal').on('click', () => {
        $('#address-validation-modal').hide();
    });

    $('#close-address-not-found-modal').on('click', () => {
        $('#address-validation-modal').hide();
    });
});
