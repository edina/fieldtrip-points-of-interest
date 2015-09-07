'use strict';

/* global cordova */

define(function(require) {
    // Import modules
    var records = require('records');
    var map = require('map');
    var file = require('file');
    var download = require('plugins/sync/js/download');
    var cards = require('./cards');
    var actions = require('./actions');

    //Constants
    var PLUGIN_PATH = 'plugins/points-of-interest';

    // Check if the required sync plugin is installed
    if (typeof download !== 'object') {
        console.warn('Required fieldtrip-sync plugin is not installed');
    }

    /**
     * Show a POI layer adding it if necessary
     */
    var showPOILayer = function(layerMetadata) {
        // If the layer is available make it visible
        var layer = map.getLayer(layerMetadata.id);

        if (layer) {
            layer.display(true);
        }
        else {
            fetchFileURLAsJSON(layerMetadata.options.fileURL)
                .done(addPOILayer)
                .fail(function(err) {
                    console.error(err);
                });
        }

    };

    /**
     * Hide a POI layer
     */
    var hidePOILayer = function(layerMetadata) {
        var layer = map.getLayer(layerMetadata.id);

        if (layer) {
            layer.display(false);
        }
        else {
            console.warn('Not layer found with id' + layerMetadata.id);
        }
    };

    /**
     * Zoom to the extent of the layer features
     */
    var zoomToExtentPOILayer = function(layerMetadata) {
        var layer = map.getLayer(layerMetadata.id);

        if (layer) {
            map.zoomToExtent(layer.getDataExtent());
        }
        else {
            console.warn('Not layer found with id' + layerMetadata.id);
        }
    };

    /**
     * Check if the object contains a geojson FeatureCollection
     * @params object {Object} containin a geoJSON
     * @returns {Bool} true/false
     */
    var containsFeatureCollection = function(object) {
        if (object.type && object.type === 'FeatureCollection' &&
            object.features && typeof Array.isArray(object.features)) {
            return true;
        }
        return false;
    };

    /**
     * Open an editor from the parameters of the action
     * @param action {Object}
     *     param.name {String} name of the editor
     *     param.group {String} group of the editor (optional)
     */
    var openEditor = function(action) {
        var params = action.params;

        var group = params.group || records.EDITOR_GROUP.PRIVATE;
        var name = params.name;
        records.annotate(group, name);
    };

    var openCard = function(action) {
        var params = action.params;
        var group = params.group || records.EDITOR_GROUP.PRIVATE;
        var editor = params.editor;

        var card = params.card;
        var cardUrl = 'view-card.html' +
            '?group=' + group + '&editor=' + editor + '&card=' + card;

        $('body').pagecontainer('change', cardUrl);
    };

    /**
     * Open an editor
     * @param action {Object}
     *     - type {String} type of object to open
     */
    var doOpen = function(action) {
        var type = action.params.type;

        switch (type) {
            case 'editor':
                openEditor(action);
                break;
            case 'card':
                openCard(action);
                break;
            default:
                console.warn('Don\'t know how to open: [' + type + ']');
        }
    };

    /**
     * Register the initial actions for the markers
     */
    var registerActions = function() {
        actions.register('open', doOpen);
    };

    /**
     * Register the actios over the features of the POI Layer
     * @param layer {OpenLayers.Layer} reference to the layer
     */
    var registerPOILayerEvents = function(layer) {
        var onFeatureSelect = function(evt) {
            var feature = evt.feature;
            actions.perform(feature.data.action);
        };

        var onFeatureUnselect = function(evt) {
            var feature = evt.feature;
        };

        map.registerFeatureEvents(layer, {
            selected: onFeatureSelect,
            unselected: onFeatureUnselect
        });
    };

    /**
     * Add styles to the POI features
     * @param layer {OpenLayers.Layer} a layer
     */
    var setPOILayerStyles = function(layer) {
        var defaultStyle;
        var selectStyle;

        defaultStyle = {
            graphicWidth: 35,
            graphicHeight: 50,
            externalGraphic: PLUGIN_PATH + '/css/images/plain_marker@2x.png'
        };

        selectStyle = {
            graphicWidth: 35,
            graphicHeight: 50,
            externalGraphic: PLUGIN_PATH + '/css/images/plain_marker@2x.png',
            graphicOpacity: 0.9
        };

        map.setLayerStyle(layer, defaultStyle, 'default');
        map.setLayerStyle(layer, selectStyle, 'select');
    };

    /**
     * Adds a geoJSON as a POI layer to the map
     * @param poiGeoJSON {Object} and object containing the geoJSON with the POI
     */
    var addPOILayer = function(poiGeoJSON) {
        var poiLayer;
        var layerId;
        var layerName;

        if (!containsFeatureCollection(poiGeoJSON)) {
            console.error('Json doesn\'t contains a FeatureCollection');
            return;
        }

        layerId = poiGeoJSON.properties.id;
        layerName = poiGeoJSON.properties.name;

        poiLayer = map.addGeoJSONLayer(layerId, poiGeoJSON);

        setPOILayerStyles(poiLayer);
        registerPOILayerEvents(poiLayer);
        registerActions();

        poiLayer.setVisibility(true);
    };

    /**
     * Wraps downloadItem as a promise
     *
     * @param options {Object}
     *   remoteDir {String} Remote dir
     *   fileName {String} Remote file name
     *   localDir {String} Local directory
     *   targetName {String} Local filename
     * @returns a promise that resolves in a {FileEntry} or is rejected with an Error
     */
    var downloadItem = function(options) {
        var deferred = $.Deferred();
        var json;

        download.downloadItem(
            options,
            function(fileEntry) {
                deferred.resolve(fileEntry);
            },
            function(err) {
                deferred.reject(err);
            }
        );

        return deferred.promise();
    };

    /**
     * Fetch the contents of a file as JSON
     *
     * @param {String} a fileURL
     * @returns a promise that resolvers in an {Object}
     */
    var fetchFileURLAsJSON = function(fileURL) {
        var deferred = $.Deferred();

        // Resolve the fileURL as a {fileEntry}
        file.resolveFileURL(fileURL)
            .done(function(fileEntry) {
                fetchFileEntryAsJSON(fileEntry)
                    .done(deferred.resolve)
                    .fail(deferred.reject);
            })
            .fail(function(err) {
                console.error(err);
            });
        return deferred.promise();
    };

    /**
     * Fetch the contents of a fileEntry as JSON
     *
     * @param fileEntry {FileEntry} a FileEntry
     * @returns a promise that resolve in an {Object}
     */
    var fetchFileEntryAsJSON = function(fileEntry) {
        var deferred = $.Deferred();

        file.readTextFile(fileEntry)
            .done(function(text) {
                var poiGeoJSON;
                try {
                    poiGeoJSON = JSON.parse(text);
                }
                catch (ex) {
                    deferred.reject(ex);
                }

                deferred.resolve(poiGeoJSON);
            })
            .fail(function(err) {
                deferred.reject(err);
            });

        return deferred.promise();
    };

    /**
     * Read the content of a layer and register it in the layers object
     * fileEntry {FileEntry} - A File entry where the layer is stored
     */
    var registerLayer = function(fileEntry) {
        fetchFileEntryAsJSON(fileEntry)
            .done(function(geoJSON) {
                var id = geoJSON.properties.id;
                var name = geoJSON.properties.name;
                var options = {
                    fileURL: fileEntry.toURL()
                };

                map.addLayerToLayersList(id, name, 'poi', options);
            })
            .fail(function(err) {
                console.error(err);
            });
    };

    /**
     * Extract the poi from the editor markup
     * implements the records.processEditor interface
     * @param editorName name of the editor
     * @param html html content of the editor
     * @param group from records.EDITOR_GROUP
     * @param online boolean value if the processing is held online
     */
    var extractPOI = function(editorName, html, group, online) {
        var $form = $(html);
        var geofence;
        var geofences;

        $form
            .find('[data-fieldtrip-type=poi] [data-poi-file]')
            .each(function(i, el) {
                var options = {};
                var poiFile = el.getAttribute('data-poi-file');
                var fullLocalPath;
                options.remoteDir = 'features';
                options.fileName = poiFile;
                options.localDir = records.getEditorsDir(group);
                options.targetName = poiFile;
                fullLocalPath = file.getFilePath(options.localDir) + '/' + options.targetName;

                downloadItem(options)
                    .done(registerLayer);
            });
    };

    /**
     * Perform initialization actions for the the POI plugin
     */
    var initPOIPlugin = function() {
        // Inject the plugin styles
        $('head').prepend('<link rel="stylesheet" href="' + PLUGIN_PATH + '/css/style.css" type="text/css" />');

        // Add map page show handler
        $(document).on('pagebeforeshow', '#map-page', function() {

        });

        // Add the plugin editor process to the pipeline
        records.addProcessEditor(extractPOI);

        // Listen for on/off events in the layer list
        map.suscribeToLayersControl({
            enableLayer: function(event, layerMetaData) {
                // TODO: Filter the POI layers
                showPOILayer(layerMetaData);
            },
            disableLayer: function(event, layerMetadata) {
                hidePOILayer(layerMetadata);
            },
            clickLayer: function(event, layerMetadata) {
                zoomToExtentPOILayer(layerMetadata);
            }
        });
    };

    // Init the plugin
    initPOIPlugin();
});
