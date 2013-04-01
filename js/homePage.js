/** @license
 | Version 10.2
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.CheckBox");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("esri.tasks.find");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dijit.TooltipDialog");
dojo.require("js.config");

var map;                    //ESRI map object
var tempBufferLayer = 'tempBufferLayer';        //Graphics layer object for displaying buffered region
var queryGraphicLayer = 'queryGraphicLayer';    //Graphics layer object for displaying queried features
var tempGPSLayer = 'tempGPSLayer';          //Graphics layer object for displaying GPS graphic
var geometryService;        //Geometry used for Buffering
var baseMapLayerCollection; //variable to store basemap collection
var roadCenterLinesLayerURL;   //Variable for storing Road layer URL
var roadCenterLinesLayerID = 'roadCenterLinesLayerID';  //Temp Feature layer ID
var qTask = 'qTask';        //Query task object for querying feature layer
var maxAllowableOffset;     //The maximum allowable offset used for generalizing geometries returned by the query operation.
var maxBufferDistance;      //The maximum allowable buffer distance
var defaultBufferDistance;  //Default Buffer distance
var rendererColor;          //Variable for storing feature layer renderer color
var averyTemplates;         //Variable storing array of avery label formats
var helpURL;            //Variable for storing Help URL
var gpTaskAvery;            //ESRI.Tasks.Geoprocessor object for PDF
var gpTaskCsv;              //esri.tasks.geoprocessor object for CSV
var searchFields;           //Variable for storing configurable address fields
var queryOutFields;         //Variable for storing configurable query outfields
var infoPopupFieldsCollection; //Variable for storing configurable Info Popup fields
var occupantFields;         //Variable for storing Occupant related avery fields
var averyFieldsCollection;  //Variable for storing configurable avery fields
var csvFieldsCollection;    //Variable for storing configurable csv column fields
var occupantName;           //Variable for getting word "Occupant" from config
var findTask;                  //Find task object for querying feature layer
var graphicLayerClicked = false;  //Flag for storing state of Graphics Layer Clicked
var infoWindowTitle; //variable for displaying info window title

var roadLineColor; //default color of the road
var infoRoadCollectionFields; //Variable for storing configurable Info Road collection fields
var mouseMoveHandle; // variable to display the tooltip
var isMac = false; //flag set for Mac
var showNullAs; //variable for displaying the default value when Field value is not available
var mapSharingOptions; //variable for storing the tiny service URL
var featureID; //variable to store feature Id while sharing
var locatorSettings; //variable to store locator settings
var parcelInformation; //variable to store fields information for parcel

var messages; //variable to store error messages from errorMessages.xml
var infoPopupHeight; //variable used for storing the info window height
var infoPopupWidth; //variable used for storing the info window width

var taxParcelQueryURL; //variable to store the parcel URL to query
var parcelArray = []; //Array to store the shared parcels
var roadArray = []; //Array to store the shared road object id's
var toolTipContents; //variable to store the content's for tooltip


var lastSearchString; //variable for storing the last search string value
var stagedSearch; //variable for storing the time limit for search
var lastSearchTime; //variable for storing the time of last searched value

//Function to initialize the map and read data from Configuration file
function Init() {
    dojo.connect(window, "onresize", function () {
        if (map) {
            map.resize();
            map.reposition();
        }
    });

    ShowLoadingMessage('Loading');

    // Identify the key presses while implementing auto-complete and assign appropriate actions
    dojo.connect(dojo.byId("txtAddress"), 'onkeyup', function (evt) {
        if (evt) {
            if (evt.keyCode == dojo.keys.ENTER) {
                if (dojo.byId("txtAddress").value != '') {
                    dojo.byId("imgSearchLoader").style.display = "block";
                    Locate();
                    return;
                }
            }
            if ((!((evt.keyCode > 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) || (evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
                evt = (evt) ? evt : event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
                return;
            }
            if (dojo.coords("divAddressHolder").h > 0) {
                if (dojo.byId("txtAddress").value.trim() != '') {
                    if (lastSearchString != dojo.byId("txtAddress").value.trim()) {
                        lastSearchString = dojo.byId("txtAddress").value.trim();
                        RemoveChildren(dojo.byId('tblAddressResults'));

                        // Clear any staged search
                        clearTimeout(stagedSearch);

                        if (dojo.byId("txtAddress").value.trim().length > 0) {
                            // Stage a new search, which will launch if no new searches show up
                            // before the timeout
                            stagedSearch = setTimeout(function () {
                                dojo.byId("imgSearchLoader").style.display = "block";
                                Locate();
                            }, 500);
                        }
                    }
                } else {
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    dojo.byId("imgSearchLoader").style.display = "none";
                    RemoveChildren(dojo.byId('tblAddressResults'));
                    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                }
            }
        }
    });

    dojo.connect(dojo.byId("txtAddress"), 'onpaste', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    dojo.connect(dojo.byId("txtAddress"), 'oncut', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    dojo.xhrGet({
        url: "ErrorMessages.xml",
        handleAs: "xml",
        preventCache: true,
        load: function (xmlResponse) {
            messages = xmlResponse;
        }
    });

    if (navigator.appVersion.indexOf("Mac") >= 0) {
        isMac = true;
    }
    esri.config.defaults.io.postLength = 256;
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    esri.config.defaults.io.alwaysUseProxy = false;
    esri.config.defaults.io.timeout = 600000;

    var responseObject = new js.config();

    dojo.byId('imgApp').src = responseObject.ApplicationIcon;
    dojo.byId('lblAppName').innerHTML = responseObject.ApplicationName;
    var mapExtent = responseObject.DefaultExtent;
    searchFields = responseObject.AddressSearchFields.split(",");
    queryOutFields = responseObject.QueryOutFields.split(",");
    infoWindowTitle = responseObject.InfoWindowTitle;
    infoPopupFieldsCollection = responseObject.InfoPopupFieldsCollection;
    occupantName = responseObject.OccupantName;
    occupantFields = responseObject.OccupantFields.split(",");

    infoPopupHeight = responseObject.InfoPopupHeight;
    infoPopupWidth = responseObject.InfoPopupWidth;
    toolTipContents = responseObject.ToolTipContents;

    mapSharingOptions = responseObject.MapSharingOptions;
    dojo.byId('divSplashContent').innerHTML = responseObject.SplashScreenMessage;

    infoRoadCollectionFields = responseObject.InfoRoadCollectionFields;
    showNullAs = responseObject.ShowNullValueAs;

    averyFieldsCollection = responseObject.AveryFieldsCollection;
    csvFieldsCollection = responseObject.CsvFieldsCollection;
    parcelInformation = responseObject.ParcelInformation;

    var infoWindow = new mobile.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });

    map = new esri.Map("map", {
        slider: true,
        infoWindow: infoWindow
    });

    rendererColor = responseObject.RendererColor;
    roadLineColor = responseObject.RoadLineColor;

    var taxParcelFindURL = responseObject.TaxParcelQueryMap;
    taxParcelQueryURL = responseObject.TaxParcelPublishingLayer;
    roadCenterLinesLayerURL = responseObject.RoadCenterLines;

    helpURL = responseObject.HelpURL;
    maxAllowableOffset = parseFloat(responseObject.MaxAllowableOffset);
    maxBufferDistance = parseFloat(responseObject.MaxBufferDistance);
    defaultBufferDistance = parseFloat(responseObject.DefaultBufferDistance);
    gpTaskAvery = new esri.tasks.Geoprocessor(responseObject.ServiceTask);
    gpTaskCsv = new esri.tasks.Geoprocessor(responseObject.CsvServiceTask);

    locatorSettings = responseObject.LocatorSettings;
    dojo.byId("tdSearchAddress").innerHTML = locatorSettings.Locators[0].DisplayText;
    dojo.byId("tdSearchCase").innerHTML = locatorSettings.Locators[1].DisplayText;

    // Set address search parameters
    dojo.byId("txtAddress").setAttribute("defaultAddress", locatorSettings.Locators[0].DefaultValue);
    dojo.byId('txtAddress').value = locatorSettings.Locators[0].DefaultValue;
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("txtAddress").setAttribute("defaultAddressTitle", locatorSettings.Locators[0].DefaultValue);
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").setAttribute("defaultCase", locatorSettings.Locators[1].DefaultValue);
    dojo.byId("txtAddress").setAttribute("defaultCaseTitle", locatorSettings.Locators[1].DefaultValue);
    dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId('txtAddress'), "onfocus", function (evt) {
        this.style.color = "#FFF";
    });
    dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);

    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);
    qTask = new esri.tasks.QueryTask(taxParcelQueryURL);
    findTask = new esri.tasks.FindTask(taxParcelFindURL);
    dojo.connect(map, "onLoad", function () {
        var zoomExtent;
        var extent = GetQuerystring('extent');
        if (extent != "") {
            zoomExtent = extent.split(',');
        }
        else {
            zoomExtent = responseObject.DefaultExtent.split(",");
        }
        var startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
        map.setExtent(startExtent);
        MapInitFunction(map);
        if (isMac) {
            document.oncontextmenu = function (evt) {
                return false;
            }
        }

        //Share functionality with parcels and road information
        var query;
        if (window.location.toString().split("$parcelID=").length > 1) {
            GetValuesToBuffer(true);
            if (window.location.toString().split("$displayInfo=").length > 1) {
                parcelArray = window.location.toString().split("$parcelID=")[1].split("$displayInfo=")[0].split(",");
            }
            else {
                parcelArray = window.location.toString().split("$parcelID=")[1].split(",");
            }

            query = new esri.tasks.Query();
            var parcelGroup = "";
            for (var p = 0; p < parcelArray.length; p++) {
                if (p == (parcelArray.length - 1)) {
                    parcelGroup += "'" + parcelArray[p] + "'";
                }
                else {
                    parcelGroup += "'" + parcelArray[p] + "',";
                }
            }
            query.where = parcelInformation.ParcelIdentification + " in (" + parcelGroup + ")";
            query.returnGeometry = true;
            query.outFields = ["*"];
            var qTask = new esri.tasks.QueryTask(taxParcelQueryURL);
            qTask.execute(query, function (featureset) {
                ShowLoadingMessage('Loading');
                AddShareParcelsToMap(featureset, 0);
            });
        }
        else if (window.location.toString().split("$roadID=").length > 1) {
            GetValuesToBuffer(false);
            if (window.location.toString().split("$displayInfo=").length > 1) {
                roadArray = window.location.toString().split("$roadID=")[1].split("$displayInfo=")[0].split(",");
            }
            else {
                roadArray = window.location.toString().split("$roadID=")[1].split(",");
            }

            query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.objectIds = [roadArray.join(",")];
            setTimeout(function () {
                map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_ADD, function (featureSet) {
                    polyLine = new esri.geometry.Polyline(map.spatialReference);
                    var numSegments = map.getLayer(roadCenterLinesLayerID).graphics.length;
                    if (0 < numSegments) {
                        for (var j = 0; j < numSegments; j++) {
                            if (map.getLayer(roadCenterLinesLayerID).graphics[j]) {
                                polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
                            }
                        }
                        map.setExtent(polyLine.getExtent().expand(2));
                    }
                    CreateBuffer();
                }, function (err) {
                    HideLoadingMessage();
                    alert(err.message);
                });
            }, 1000);
        }
        else {
            HideLoadingMessage();
        }
    });

    dojo.connect(map, "onClick", ExecuteQueryTask);
    dojo.connect(map, 'onMouseOut', fireMapMouseUp);
    dojo.connect(map, "onExtentChange", function (evt) {
        map.infoWindow.hide();
        SetMapTipPosition();
        if (dojo.coords("divAppContainer").h > 0) {
            ShareLink(false);
        }
    });

    function fireMapMouseUp(e) {
        var oEvent = null;

        if (document.createEvent) {
            oEvent = document.createEvent("MouseEvents");
            oEvent.initMouseEvent("mouseup", true, true, window, 0, 0, 0, e.pageX, e.pageY, false, false, false, false, 0, null);
        } else if (document.createEventObject) {
            oEvent = document.createEventObject();
            oEvent.detail = 0;
            oEvent.screenX = 0;
            oEvent.screenY = 0;
            oEvent.clientX = e.pageX;
            oEvent.clientY = e.pageY;
            oEvent.ctrlKey = false;
            oEvent.altKey = false;
            oEvent.shiftKey = false;
            oEvent.metaKey = false;
            oEvent.button = 0;
            oEvent.relatedTarget = null;
        }

        var fired = false;
        var mapElement = document.getElementById('map');

        if (document.createEvent) {
            fired = mapElement.dispatchEvent(oEvent);
        } else if (document.createEventObject) {
            fired = mapElement.fireEvent('onmouseup', oEvent);
        }
    }


    dojo.connect(dojo.query(".divInfoWindowContainer")[0], "onmouseover", function (evt) {
        HideMapTip();
    });
    dojo.connect(dojo.byId('headerContent'), "onmouseover", function (evt) {
        HideMapTip();
    });
    dojo.connect(dojo.byId('imgApp'), "onmouseover", function (evt) {
        HideMapTip();
    });

    baseMapLayerCollection = responseObject.BaseMapLayers;
    averyTemplates = responseObject.AveryLabelTemplates;
    CreateBaseMapComponent();
    GetAveryTemplates();

    if (dojo.isIE) {
        dojo.byId('txtBuffer').style.width = "128px";
    }
    if (!Modernizr.geolocation) {
        dojo.byId("tdGPS").style.display = "none";
    }
    dojo.connect(dojo.byId('btnSubmit'), "onclick", CreateBuffer);
}

//Get the parameters to buffer the parcel (or) road region(s)
function GetValuesToBuffer(parcel) {
    if (window.location.toString().split("$dist=").length > 1) {
        dojo.byId('txtBuffer').value = Number(window.location.toString().split("$dist=")[1].split("$PDF=")[0]);
        var str = window.location.toString().split("$PDF=")[1].split("$CSV=")[0];
        dijit.byId('chkPdf').checked = (str == "false") ? "" : str;
        str = window.location.toString().split("$CSV=")[1].split("$occupant=")[0];
        dijit.byId('chkCsv').checked = (str == "false") ? "" : str;
        str = window.location.toString().split("$occupant=")[1].split("$owner=")[0];
        dijit.byId('chkOccupants').checked = (str == "false") ? "" : str;
        str = window.location.toString().split("$owner=")[1].split("$averyFormat=")[0];
        dijit.byId('chkOwners').checked = (str == "false") ? "" : str;
        var annotation;
        if (parcel) {
            annotation = "$parcelID=";
        }
        else {
            annotation = "$roadID=";
        }
        dijit.byId('selectAvery').store.fetch({
            query: { name: window.location.toString().split("$averyFormat=")[1].split(annotation)[0].split("avery")[1] },
            onComplete: function (items) {
                dijit.byId('selectAvery').setDisplayedValue(items[0].name[0]);
                dijit.byId('selectAvery').item = items[0];
            }
        });
    }
}

//Validate the numeric text box control
function onlyNumbers(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;

    return true;
}

//Get InternetExplorer Version
function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1);
    }
    return rv;
}

//Function to create graphics and feature layer
function MapInitFunction(map) {
    dojo.byId('divSplashScreenContainer').style.display = "block";
    dojo.addClass(dojo.byId('divSplashScreenContent'), "divSplashScreenDialogContent");
    SetSplashScreenHeight();

    dojo.byId('map_zoom_slider').style.top = '80px';

    //Event for resizing the map
    dojo.connect(dojo.byId('map'), 'resize', function () {
        var resizeTimer;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            map.resize();
            map.reposition();
        }, 500);
    });

    //Adding buffer graphics layer on map
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempBufferLayer;
    map.addLayer(gLayer);

    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempGPSLayer;
    map.addLayer(gLayer);

    //Adding query graphics layer on map
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = queryGraphicLayer;
    map.addLayer(gLayer);
    dojo.connect(gLayer, "onClick", function (evtArgs) {
        graphicLayerClicked = true;
        findTasksGraphicClicked = false;
    });

    var roadLineSymbol = new esri.symbol.SimpleLineSymbol();
    roadLineSymbol.setWidth(5);
    var roadLinefillColor = new dojo.Color(roadLineColor);
    roadLineSymbol.setColor(roadLinefillColor);
    var roadLineRenderer = new esri.renderer.SimpleRenderer(roadLineSymbol);

    var roadCenterLinesLayer = new esri.layers.FeatureLayer(roadCenterLinesLayerURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"]
    });
    roadCenterLinesLayer.id = roadCenterLinesLayerID;
    roadCenterLinesLayer.setRenderer(roadLineRenderer);
    map.addLayer(roadCenterLinesLayer);
    dojo.connect(roadCenterLinesLayer, "onClick", function (evt) {
        if (evt.ctrlKey) {
            if (dijit.byId('toolTipDialog')) {
                HideRoad(evt);
            }
        }
        else {
            ShowRoadDetails(evt.graphic.attributes, evt.mapPoint);
        }
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
    });
}
dojo.addOnLoad(Init);