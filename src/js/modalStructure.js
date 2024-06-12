(function($) {
    $(document).ready(function() {
        // Create and append the modal structure to the body
        const modalHTML = `
            <div id="address-validation-modal" style="display: none;">
                <div class="inner-modal">
                    <h4 id="modal-heading">Confirm Address</h4>
                    <div id="missing-apartment-number-message" style="display: none;">
                        <p>You forgot to enter your apartment or suite #. Please enter it here:</p>
                        <input type="text" id="apartment-number-input" placeholder="Apartment/Suite Number" />
                        <button id="submit-apartment-number">Submit</button>
                        <a href="#" id="no-apartment-number">I do not have one.</a>
                    </div>
                    <div id="address-validation-content">
                        <div class="api-col-container" style="display: none;">
                            <div class="api-col api-col-1">
                                <p><strong>You Entered:</strong></p>
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
    });
})(jQuery);
