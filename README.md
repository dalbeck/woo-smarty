# Smarty Address Validation for WooCommerce

This is a WordPress plugin that integrates Smarty address validation API into WooCommerce checkout fields.

## Description

The Smarty Address Validation for WooCommerce plugin is designed to enhance the checkout process in your WooCommerce store by integrating the Smarty address validation API. This ensures that customers enter valid addresses, improving the efficiency of your shipping process.

## Installation

1. Upload the plugin files to the `/wp-content/plugins/` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

## Requirements

- WordPress 4.0 or higher
- WooCommerce 3.0 or higher
- Smarty Account with US Address Validation API Key

## Usage

Once the plugin is activated, it will automatically integrate Smarty address validation into your WooCommerce checkout fields.

## Development

- `nvm use 20`
- `npm install`
- Dev Mode: `npm start`
- Production Build: `npm run build` (This will create a dist folder with the bundled and minified files.)

- modal.js: Contains the modal creation and event handlers for modal buttons.
- validation.js: Handles the address validation logic, including API calls and validation results.
- events.js: Contains event listeners for billing and shipping fields, as well as handling changes in the "Ship to a different address" checkbox.
- utils.js: Contains utility functions for populating checkout fields and handling WooCommerce hooks to ensure fields are correctly populated and enabled during checkout.

## Author

Danny Albeck - [https://github.com/dalbeck](https://github.com/dalbeck)

## Version

1.0

## WooCommerce Compatibility

Tested up to WooCommerce 8.0.3
