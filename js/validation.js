jQuery(function($) {
    // URL and API key from PHP
    var apiUrl = smarty_params.api_url;
    var apiKey = smarty_params.api_key;

    // Listening to input changes on the address input field for real-time autocomplete
    $('#billing_address_1').on('input', function() {
        var searchQuery = $(this).val();

        // Check if input length is sufficient to trigger API call
        if (searchQuery.length > 3) { // Query when more than 3 characters are typed
            $.ajax({
                url: apiUrl + '?key=' + apiKey + '&search=' + encodeURIComponent(searchQuery),
                method: 'GET',
                success: function(data) {
                    console.log('API response:', data);
                    // Assuming data contains suggestions, this is where you would update a dropdown
                    // Update a dropdown list or suggestions box with results
                    var suggestionsList = $('#address-suggestions');
                    suggestionsList.empty();
                    if (data.suggestions) {
                        data.suggestions.forEach(function(suggestion) {
                            suggestionsList.append($('<option>').val(suggestion.text).text(suggestion.text));
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('AJAX error:', textStatus, errorThrown);
                }
            });
        }
    });

    // Add the suggestions container after the billing address field
    var suggestionsBox = $('<div id="address-suggestions" style="position: absolute; display: none; z-index: 1000; background: white; border: 1px solid #ccc;"></div>').insertAfter('#billing_address_1');

    // Function to adjust the width of the suggestions box to match the input field
    function adjustSuggestionsBoxWidth() {
        var inputWidth = $('#billing_address_1').outerWidth(); // Get the outer width of the input field
        suggestionsBox.width(inputWidth); // Set the width of the suggestions box
    }

    // Adjust the width initially and on window resize
    adjustSuggestionsBoxWidth();
    $(window).resize(adjustSuggestionsBoxWidth);

    // Listen for input on the billing address field
    $('#billing_address_1').on('input', function() {
        var searchQuery = $(this).val();

        if (searchQuery.length > 3) {
            $.ajax({
                url: smarty_params.api_url + '?key=' + smarty_params.api_key + '&search=' + encodeURIComponent(searchQuery),
                method: 'GET',
                success: function(data) {
                    console.log('Data received:', data); // Debugging: log data to console
                    suggestionsBox.empty().show();
                    if (data.suggestions && data.suggestions.length) {
                        data.suggestions.forEach(function(suggestion) {
                            var fullAddress = suggestion.street_line + ', ' + suggestion.city + ', ' + suggestion.state + ' ' + (suggestion.zipcode || '');
                            var suggestionDiv = $('<div class="suggestion-item">').text(fullAddress);
                            suggestionDiv.on('click', function() {
                                $('#billing_address_1').val(suggestion.street_line);
                                $('#billing_address_2').val(suggestion.secondary || '');
                                $('#billing_city').val(suggestion.city);
                                $('#billing_state').val(suggestion.state).trigger('change');
                                $('#billing_postcode').val(suggestion.zipcode);
                                suggestionsBox.hide();
                            });
                            suggestionsBox.append(suggestionDiv);
                        });
                    } else {
                        suggestionsBox.append('<div class="suggestion-item">No results found</div>');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('AJAX error:', textStatus, errorThrown);
                    suggestionsBox.hide();
                }
            });
        } else {
            suggestionsBox.hide();
        }
    });
});
