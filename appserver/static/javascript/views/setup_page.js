//012345678901234567890123456789ab
"use strict";

import * as Setup from './setup_configuration.js'
import { get_template } from "./setup_page_template.js";
import * as Splunk from './splunk_helpers.js'
import * as StoragePasswords from "./storage_passwords.js";
import { promisify } from "./utils.js";

const SECRET_REALM = "prometheus_alertmanager";
const APP_NAME = "prometheus_alertmanager";

define(
    ["backbone", "jquery", "splunkjs/splunk"],
    function(Backbone, jquery, splunk_js_sdk) {
        var SetupView = Backbone.View.extend({
            // -----------------------------------------------------------------
            // Backbon Functions, These are specific to the Backbone library
            // -----------------------------------------------------------------
            initialize: function initialize() {
                Backbone.View.prototype.initialize.apply(this, arguments);
                this.init_properties(splunk_js_sdk)
            },

            events: {
                "click .setup_button": "trigger_setup",
            },

            render: function() {
                this.el.innerHTML = get_template();
                return this;
            },

            trigger_setup: function trigger_setup() {
                // Used to hide the error output, when a setup is retried
                this.display_error_output([]);

                var integration_key_input_element = jquery("input[name=param_integration_key]");
                var integration_key = integration_key_input_element.val();
                var sanitized_integration_key = this.sanitize_string(integration_key);

                var integration_url_input_element = jquery("input[name=param_integration_url]");
                var integration_url = integration_url_input_element.val();
                var sanitized_integration_url = this.sanitize_string(integration_url);

                var error_messages_to_display = this.validate_inputs(
                    sanitized_integration_key,
                    sanitized_integration_url
                );

                var did_error_messages_occur = error_messages_to_display.length > 0;
                if (did_error_messages_occur) {
                    // Displays the errors that occurred input validation
                    this.display_error_output(error_messages_to_display);
                } else {
                    this.perform_setup(
                        splunk_js_sdk,
                        sanitized_integration_key,
                        sanitized_integration_url
                    );
                }
            },

            // This is where the main setup process occurs
            perform_setup: async function perform_setup(splunk_js_sdk, integration_key, integration_url) {

                try {
                    // Create the Splunk JS SDK Service object
                    const splunk_js_sdk_service = Setup.create_splunk_js_sdk_service(
                        splunk_js_sdk,
                        StoragePasswords.APP_NAMESPACE,
                    );

                    if(integration_key && !integration_key.startsWith("*")) {
                      StoragePasswords.write_secret(splunk_js_sdk_service, SECRET_REALM, 'integration_key', integration_key)
                    }

                    StoragePasswords.write_secret(splunk_js_sdk_service, SECRET_REALM, 'integration_url', integration_url)

                    await Setup.complete_setup(splunk_js_sdk_service);
                    await Setup.reload_splunk_app(splunk_js_sdk_service, APP_NAME);
                    Setup.redirect_to_splunk_app_homepage(APP_NAME);
                } catch (error) {
                    var error_messages_to_display = [];
                    if (
                        error !== null &&
                        typeof error === "object" &&
                        error.hasOwnProperty("responseText")
                    ) {
                        var response_object = JSON.parse(error.responseText);
                        error_messages_to_display = this.extract_error_messages(
                            response_object.messages,
                        );
                    } else {
                        // Assumed to be string
                        error_messages_to_display.push(error);
                    }

                    this.display_error_output(error_messages_to_display);
                }
            },

            init_properties: async function init_properties(splunk_js_sdk) {
              const splunk_js_sdk_service = Setup.create_splunk_js_sdk_service(
                  splunk_js_sdk,
                  StoragePasswords.APP_NAMESPACE,
              );

              var integration_key = await StoragePasswords.fetch_storage_password(splunk_js_sdk_service, SECRET_REALM, 'integration_key');
              var integration_url = await StoragePasswords.fetch_storage_password(splunk_js_sdk_service, SECRET_REALM, 'integration_url');

              const relpath = "properties/" + "alert_actions" + "/" + "alertmanager"

              var endpoint = new splunkjs.Service.Endpoint(splunk_js_sdk_service, relpath);
              if (integration_url == null) {
                endpoint.get("param.integration_url", null, function(err, response) {
                  if (typeof response != "undefined" && response.data!="" ) {
                    integration_url = response.data
                  }
                })
              }
              if (integration_key == null) {
                endpoint.get("param.integration_key", null, function(err, response) {
                  if (typeof response != "undefined" && response.data!="" ) {
                    integration_url = response.data
                  }
                })
              }

              if (integration_key) {
                const mask = "******************************"
                jquery("input[name=param_integration_key]").val(mask + integration_key.slice(30))
              }

              jquery("input[name=param_integration_url]").val(integration_url);
            },

            // ----------------------------------
            // Input Cleaning and Checking
            // ----------------------------------
            sanitize_string: function sanitize_string(string_to_sanitize) {
                var sanitized_string = string_to_sanitize.trim();

                return sanitized_string;
            },

            validate_integration_key_input: function validate_integration_key_input(integration_key) {
                var error_messages = [];
                return error_messages;
            },

            validate_integration_url_input: function validate_integration_url_input(integration_url) {
                var error_messages = [];
                return error_messages;
            },

            validate_inputs: function validate_inputs(integration_key, integration_url) {
                var error_messages = [];

                var integration_key_errors = this.validate_integration_key_input(integration_key);
                var integration_url_errors = this.validate_integration_url_input(integration_url);

                error_messages = error_messages.concat(integration_key_errors);

                return error_messages;
            },

            extract_error_messages: function extract_error_messages(error_messages) {

                var error_messages_to_display = [];
                for (var index = 0; index < error_messages.length; index++) {
                    var error_message = error_messages[index];
                    var error_message_to_display =
                        error_message.type + ": " + error_message.text;
                    error_messages_to_display.push(error_message_to_display);
                }

                return error_messages_to_display;
            },

            display_error_output: function display_error_output(error_messages) {
                // Hides the element if no messages, shows if any messages exist
                var did_error_messages_occur = error_messages.length > 0;

                var error_output_element = jquery(".setup.container .error.output");

                if (did_error_messages_occur) {
                    var new_error_output_string = "";
                    new_error_output_string += "<ul>";
                    for (var index = 0; index < error_messages.length; index++) {
                        new_error_output_string +=
                            "<li>" + error_messages[index] + "</li>";
                    }
                    new_error_output_string += "</ul>";

                    error_output_element.html(new_error_output_string);
                    error_output_element.stop();
                    error_output_element.fadeIn();
                } else {
                    error_output_element.stop();
                    error_output_element.fadeOut({
                        complete: function() {
                            error_output_element.html("");
                        },
                    });
                }
            },
        });

        return SetupView;
    },
);
