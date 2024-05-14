<?php
// Add Settings Tab
add_filter('woocommerce_settings_tabs_array', 'my_plugin_add_settings_tab', 50); // Adjust priority as needed
function my_plugin_add_settings_tab($settings_tabs)
{
    $settings_tabs['smarty_settings'] = __('Smarty Settings', 'your-plugin-textdomain'); // Change textdomain
    return $settings_tabs;
}

// Add Settings Fields within the Tab
add_action('woocommerce_settings_smarty_settings', 'woo_smarty_plugin_output_settings');
function woo_smarty_plugin_output_settings()
{
    // Include existing settings field logic from previous example
    woocommerce_admin_fields(my_plugin_get_settings());
}

// Prepare Settings Array for Use with woocommerce_admin_fields
function my_plugin_get_settings()
{
    return array(
        array(
            'title' => __('Smarty API Credentials', 'your-plugin-textdomain'),
            'type' => 'title',
            'desc' => '',
            'id' => 'smarty_api_section'
        ),
        array(
            'title'    => __('API Key', 'your-plugin-textdomain'),
            'id'       => 'smarty_api_key',
            'type'     => 'text'
        ),
        array(
            'title'    => __('Auth ID', 'your-plugin-textdomain'),
            'id'       => 'smarty_auth_id',
            'type'     => 'text'
        ),
        array(
            'title'    => __('Auth Token', 'your-plugin-textdomain'),
            'id'       => 'smarty_auth_token',
            'type'     => 'text'
        ),
        array( 'type' => 'sectionend', 'id' => 'smarty_api_section' )
    );
}

// Update Settings Function
function woo_smarty_plugin_update_settings()
{
    // Call the WooCommerce function to update options
    woocommerce_update_options(my_plugin_get_settings());
}

// Ensure this action is tied to your settings tab slug
add_action('woocommerce_update_options_smarty_settings', 'woo_smarty_plugin_update_settings');
