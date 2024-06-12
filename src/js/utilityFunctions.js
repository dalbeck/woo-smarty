(function($) {
    $(document).ready(function() {
        function allRequiredFieldsFilled(fields) {
            return fields.every(selector => {
                const input = $(selector);
                return input.length && input.val().trim();
            });
        }

        window.allRequiredFieldsFilled = allRequiredFieldsFilled;
    });
})(jQuery);
