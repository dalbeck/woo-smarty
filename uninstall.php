<?php
if ( !defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Delete options
delete_option( 'smarty_api_key' );
delete_option( 'smarty_auth_id' );
delete_option( 'smarty_auth_token' );
