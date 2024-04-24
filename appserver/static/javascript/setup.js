"use strict";

require.config({
    paths: {
        SetupPage: "../app/prometheus_alertmanager/javascript/views/setup_page",
    },
    scriptType: 'module',
});

require([
    "backbone",
    "jquery",
    "SetupPage",
], function(Backbone, jquery, SetupPage) {
    var setup_page = new SetupPage({
        // Sets the element that will be used for rendering
        el: jquery("#main_container"),
    });

    setup_page.render();
});
