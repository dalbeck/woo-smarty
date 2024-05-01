jQuery(function($) {
    var fields = ['#billing_address_1', '#billing_city', '#billing_postcode', '#billing_state'];

    // Function to check if all fields have values
    function allFieldsFilled() {
        for (var i = 0; i < fields.length; i++) {
            if ($(fields[i]).val() === '') {
                return false;
            }
        }
        return true;
    }

    // Attach event handler to all relevant fields for combined address validation
    $(fields.join(',')).on('change', function() {
        if (allFieldsFilled()) {
            var street = $('#billing_address_1').val();
            var city = $('#billing_city').val();
            var state = $('#billing_state').val();
            var zipcode = $('#billing_postcode').val();
            var apiUrl = smarty_params.api_url;
            var apiKey = smarty_params.api_key;

            console.log('Validating address:', street, city, state, zipcode);

            $.ajax({
                url: apiUrl + '?auth-token=' + apiKey + '&street=' + encodeURIComponent(street) + '&city=' + encodeURIComponent(city) + '&state=' + encodeURIComponent(state) + '&zipcode=' + encodeURIComponent(zipcode) + '&candidates=1',
                method: 'GET',
                success: function(data) {
                    console.log('API response:', data);
                    if (data[0] && data[0].components) {
                        $('#billing_address_1').css('border', '2px solid green');
                        console.log('Address is valid.');
                    } else {
                        $('#billing_address_1').css('border', '2px solid red');
                        console.log('Address is invalid.');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('AJAX error:', textStatus, errorThrown);
                    $('#billing_address_1').css('border', '2px solid orange');
                }
            });
        } else {
            console.log('Not all address fields are filled yet.');
        }
    });
});
