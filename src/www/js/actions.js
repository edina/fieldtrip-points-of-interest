'use strict';

define(function(require) {
    var actions = {};

    /**
     * Register an action handler for  aspecific activity
     * @param action action name
     * @param func function to handle the action
     */
    var register = function(action, func) {
        if (typeof func !== 'function') {
            console.error('Can\'t register a non-function for the action: ' + action);
            return;
        }

        if (!actions.hasOwnProperty(action)) {
            actions[action] = [];
        }
        actions[action].push(func);
    };

    /**
     * Invoke all the functions registered for the action
     * @action an rpc like object with method and params
     */
    var perform = function(action) {
        var functions;

        if (actions.hasOwnProperty(action.method)) {
            functions = actions[action.method];

            for (var i = 0, len = functions.length; i < len; i++) {
                functions[i].call(this, action);
            }
        }
        else {
            console.warn('No action [' + action.method + '] registered');
        }
    };

    return {
        register: register,
        perform: perform
    };
});
