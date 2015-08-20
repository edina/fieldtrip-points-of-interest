'use strict';

define(function(require) {
    var utils = require('./utils');

    /**
     * Fetch a card
     * @param group {String} group name
     * @param editor {String} editor name
     * @param card {String} card name
     * @returns a promise that resolves in the html content of the card
     */
    var fetchCard = function(group, editor, card) {
        return $.get(card);
    };

    /**
     * Replace the content of the card for the new html
     * @param html {String} html body of the card
     */
    var renderCard = function(html) {
        $('#card-body').html(html);
    };

    /**
     * Display the error card
     */
    var displayErrorCard = function() {
        var errorCard = 'not-found-card.html';

        $.get(errorCard)
            .done(renderCard)
            .fail(function() {
                console.error('Missing error card: ' + errorCard);
            });
    };

    var displayCard = function(group, editor, card) {
        fetchCard(group, editor, card)
            .done(renderCard)
            .fail(displayErrorCard);
    };

    /**
     * Display the card requested in the url parameters when the page is showed
     */
    $(document).on('pagebeforeshow', '#view-card-page', function() {
        var params = utils.paramsFromURL($(this).data('url'));
        displayCard(params.group, params.editor, params.card);
    });
});
