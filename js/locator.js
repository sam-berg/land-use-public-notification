/** @license
 | Version 10.1.1
 | Copyright 2012 Esri
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
var mapPoint;                       //variable for storing map point location
var dist;                           //variable for storing buffer distance
var averyFormat = '';               //variable for storing avery format
var pdfFormat = '';                 //flags for PDF format download
var csvFormat = '';                 //flags for CSV format download
var occupants = '';                 //flags for notifying occupants
var owners = '';                    //flags for notifying owners
var overlapCount;                   //Variable for maintaining the count of overlapping parcels.
var geometryForBuffer;              //var for storing geometry to be used for buffer
var findTasksGraphicClicked = false;
var polygon = true; ;                       //flag for handling drawing route and polygon
var interactiveParcel = false;
var flagForNewRoad;

//function for locating address/ParcleID Using Findtask
function Locate() {
    if (dojo.byId('imgGPS').src = "images/BlueGPS.png") {
        dojo.byId('imgGPS').src = "images/gps.png";
        var gpsButton = dijit.byId('imgGPSButton');
        gpsButton.attr("checked", false);
    }
    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    PositionAddressList();
    if (dojo.byId('rbAddress').checked) {
        var searchAddress;
        var findParams;
        findParams = new esri.tasks.FindParameters();
        findParams.returnGeometry = true;
        findParams.layerIds = [0];
        findParams.searchFields = searchFields;
        findParams.outSpatialReference = map.spatialReference;
        var nodeBaseMap = dojo.byId('divBaseMapTitleContainer');
        var basemapButton = dijit.byId('imgBaseMap');
        basemapButton.attr("checked", false);
        ClearAll();
        if (nodeBaseMap.style.display != "none") {
            ShowHideBaseMapComponent();
        }
        CloseAddressContainer();

        searchAddress = dojo.byId("txtAddress").value.trim();
        findParams.searchText = searchAddress;

        if (searchAddress != "") {
            findTask.execute(findParams, PopulateSearchItem, function (err) {
                HideLoadingMessage();
                ShowDialog('Error', err.message);

            });
            ShowLoadingMessage('Searching...');
        }
        else {
            ShowDialog('Error', 'Enter an Address or Parcel ID to search.');
        }
    }
    else {
        var nodeBaseMap = dojo.byId('divBaseMapTitleContainer');
        var basemapButton = dijit.byId('imgBaseMap');
        basemapButton.attr("checked", false);
        if (nodeBaseMap.style.display != "none") {
            ShowHideBaseMapComponent();
        }
        CloseAddressContainer();

        var roadName = dojo.byId("txtAddress").value.trim();
        if (roadName == "") {
            ShowDialog('Error', 'Enter a road or street name to search.');
        }
        else {
            ClearAll();
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            interactiveParcel = false;

            var query = new esri.tasks.Query();
            query.where = "UPPER(FULLNAME) LIKE '" + roadName.toUpperCase() + "%'";
            ShowLoadingMessage('Searching...');
            map.getLayer(roadCenterLinesLayerID).queryFeatures(query, function (featureSet) {
                RemoveChildren(dojo.byId('divAddressContainer'));

                if (featureSet.features.length > 0) {
                    if (featureSet.features.length == 1) {
                        FindAndShowRoads();
                    } else {
                        var searchString = dojo.byId("txtAddress").value.trim().toLowerCase();
                        var table = document.createElement("table");
                        var tBody = document.createElement("tbody");
                        table.appendChild(tBody);
                        table.className = "tbl";
                        table.id = "tbl";
                        table.cellSpacing = 0;
                        table.cellPadding = 0;
                        var nameArray = [];
                        for (var order = 0; order < featureSet.features.length; order++) {
                            nameArray.push({ name: featureSet.features[order].attributes["FULLNAME"], attributes: featureSet.features[order].attributes, geometry: featureSet.features[order].geometry });
                        }
                        nameArray.sort(function (a, b) {
                            var nameA = a.name.toLowerCase();
                            var nameB = b.name.toLowerCase();
                            if (nameA < nameB) //sort string ascending
                                return -1
                            if (nameA >= nameB)
                                return 1
                        });

                        var numUnique = 0;
                        for (var i = 0; i < nameArray.length; i++) {
                            if (0 == i || searchString != nameArray[i].attributes["FULLNAME"].toLowerCase()) {
                                if (i > 0) {
                                    var previousFoundName = nameArray[i - 1].attributes["FULLNAME"]
                                } else {
                                    var previousFoundName = "";
                                }
                                if (nameArray[i].attributes["FULLNAME"] != previousFoundName) {
                                    ++numUnique;
                                    var tr = document.createElement("tr");
                                    tBody.appendChild(tr);
                                    var td1 = document.createElement("td");
                                    td1.innerHTML = nameArray[i].attributes["FULLNAME"];
                                    td1.className = 'tdAddress';
                                    td1.id = i;
                                    td1.title = 'Click to locate road segment';
                                    td1.setAttribute("OBJECTID", nameArray[0].attributes[map.getLayer(roadCenterLinesLayerID).objectIdField]);
                                    td1.onclick = function () {
                                        ClearBuffer();
                                        dojo.byId("txtAddress").value = this.innerHTML;
                                        polygon = false;
                                        FindAndShowRoads();
                                        HideAddressContainer();
                                    }
                                    tr.appendChild(td1);
                                }
                            }
                        }

                        if(1 < numUnique) {
                            AnimateAdvanceSearch();
                            var scrollbar_container = document.createElement('div');
                            scrollbar_container.id = "address_container1";
                            scrollbar_container.className = "addressScrollbar_container";

                            var container = document.createElement("div");
                            container.id = "address_content1";
                            container.className = 'addressScrollbar_content';
                            container.appendChild(table);
                            scrollbar_container.appendChild(container);
                            dojo.byId('divAddressContainer').appendChild(scrollbar_container);
                            CreateScrollbar(scrollbar_container, container);
                        } else {
                            dojo.byId("txtAddress").value = nameArray[0].attributes["FULLNAME"];
                            FindAndShowRoads();
                        }
                    }
                } else {
                    map.infoWindow.hide();
                    ShowDialog('Error', 'Unable to locate specified street or road.');
                }

                HideLoadingMessage();
            });

        }
    }
}

//function for finding the road segment
function FindRoadSegment(objectID) {
    var query = new esri.tasks.Query();
    query.objectIds = [Number(objectID)];
    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
        if (map.getLayer(queryGraphicLayer)) {
            map.getLayer(queryGraphicLayer).clear();
        }

        map.setExtent(features[0].geometry.getExtent().expand(2));
    }, QueryError);
    polygon = false;
}

//Error handler for buffering events failed
function QueryError(err) {
    ShowDialog("Error", "An error occured while fetching road information.");
}

//function for displaying the parcels on map
function ExecuteQueryTask(evt) {
    if (!graphicLayerClicked || findTasksGraphicClicked) {
        featureSet = null;
        if (!evt.ctrlKey) {
            ShowLoadingMessage('Locating parcel...');
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            ClearAll();
            interactiveParcel = false;
            QueryForParcel(evt);
            if (map.getLayer(roadCenterLinesLayerID)) {
                map.getLayer(roadCenterLinesLayerID).clearSelection();
            }
        }
        if (interactiveParcel) {
            ClearAll(evt);
            if (evt.ctrlKey) {
                if (polygon) {
                    HideMapTip();
                    ShowLoadingMessage('Locating adjacent parcel...');
                    mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
                    QueryForParcel(evt);
                }
            }
        }
        if (findTasksGraphicClicked) {
            findTasksGraphicClicked = false;
            graphicLayerClicked = false;
        }
    }
    else {
        ShowFeatureDetails(evt.graphic, evt);
        graphicLayerClicked = false;
        geometryForBuffer = evt.graphic.geometry;
    }
    var ctrlPressed = 0;
    if (parseInt(navigator.appVersion) > 3) {
        var evnt = evt ? evt : window.event;
        if (parseInt(navigator.appVersion) > 3) {
            ctrlPressed = evnt.ctrlKey;
        }
    }

    if (ctrlPressed) {
        if (!polygon) {
            map.infoWindow.hide();
            HideMapTip();
            ShowLoadingMessage('Locating adjacent road...');
            mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForRoad);
            QueryForAdjacentRoad(evt);
        }

    }
}


//function to query for parcel when clicked on map
function QueryForParcel(evt) {
    var mapPointForQuery = new esri.geometry.Point(evt.mapPoint.x, evt.mapPoint.y, new esri.SpatialReference({ wkid: 102100 }));
    var query;
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = queryOutFields;
    query.geometry = mapPointForQuery;
    esri.config.defaults.io.alwaysUseProxy = true;
    qTask.execute(query, function (fset) {
        if (fset.features.length) {
            ShowFeatureSet(fset, evt);
        }
        else {
            ShowDialog('Error', "Parcel not found at current location.");
            HideMapTip();
            HideLoadingMessage();
        }
    }, function (erer) {
        ShowDialog('Error', "Unable To Perform Operation, Invalid Geometry.");
        HideLoadingMessage();
    });
    esri.config.defaults.io.alwaysUseProxy = false;
}

//function for locating adjacent road
function QueryForAdjacentRoad(evt) {
    if (interactiveParcel) {
        var temp = evt.mapPoint.getExtent();
        var params = new esri.tasks.BufferParameters();
        params.geometries = [evt.mapPoint];
        params.distances = [50];
        params.unit = esri.tasks.GeometryService.UNIT_FOOT;
        params.outSpatialReference = map.spatialReference;
        esri.config.defaults.io.alwaysUseProxy = true;
        geometryService.buffer(params, function (geometries) {
            var query = new esri.tasks.Query();
            query.geometry = geometries[0];
            query.where = "1=1";
            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
            query.returnGeometry = true;

            queryTask = new esri.tasks.QueryTask(roadCenterLinesLayerURL);
            queryTask.execute(query, function (featureset) {
                if (featureset.features.length > 0) {
                    var query = new esri.tasks.Query();
                    query.where = "FULLNAME = '" + featureset.features[0].attributes.FULLNAME + "'";
                    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_ADD, function (featureSet) {
                        var polyLine = new esri.geometry.Polyline(map.spatialReference);
                        for (var j = 0; j < map.getLayer(roadCenterLinesLayerID).graphics.length; j++) {
                                                        map.getLayer(roadCenterLinesLayerID).graphics[j].show();
                            polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
                        }
                        map.setExtent(polyLine.getExtent().expand(1.5));
                    });
                    HideLoadingMessage();
                }
                else {
                    HideLoadingMessage();
                    ShowDialog('Error', 'Road not found at current location.');
                }
            });
        }, function (error) {
            HideLoadingMessage();
            ShowDialog('Error', error.message);
        });
    }
    else {
        HideLoadingMessage();
        ShowDialog('Error', 'Road not found at current location.');
    }
}

//Function if their are multiple features in FeatureSet
function ShowFeatureSet(fset, evt) {
    ClearAll(evt);
    if (fset.features.length > 1) {
        var screenPoint = evt.screenPoint;
        featureSet = fset;
        overlapCount = 0;
        var contentDiv = CreateContent(featureSet.features);
        ShowOverlappingParcels(featureSet.features, contentDiv, evt);
        var features = featureSet.features;
        DrawPolygon(features);
        geometryForBuffer = features[0].geometry;
    }
    else {
        var feature = fset.features[0];
        var layer = map.getLayer(queryGraphicLayer);
        var lineColor = new dojo.Color();
        lineColor.setColor(rendererColor);
        var fillColor = new dojo.Color();
        fillColor.setColor(rendererColor);
        fillColor.a = 0.25;
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
        feature.setSymbol(symbol);
        ShowUniqueParcel(feature, evt);
        HideLoadingMessage();
        map.setExtent(CenterMapPoint(evt.mapPoint, fset.features[0].geometry.getExtent().expand(9)));
        layer.add(feature);
        polygon = true;
        geometryForBuffer = feature.geometry;
    }
}

//function for locating selected parcel or addr
function FindTaskResults(results) {
    map.graphics.clear();
    //clearing all graphic layers query layers
    ClearAll();
    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    interactiveParcel = false;
    if (map.getLayer(roadCenterLinesLayerID)) {
        map.getLayer(roadCenterLinesLayerID).clear();
    }
    dojo.byId("txtAddress").value = results.value;

    dojo.byId("txtAddress").defaultText = results.value;

    var layer = map.getLayer(queryGraphicLayer);
    var lineColor = new dojo.Color();
    lineColor.setColor(rendererColor);

    var fillColor = new dojo.Color();
    fillColor.setColor(rendererColor);
    fillColor.a = 0.25;

    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
    results.feature.setSymbol(symbol);

    geometryForBuffer = results.feature.geometry;
    ringsmultiPoint = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 3857 }));
    for (var i = 0; i < results.feature.geometry.rings[0].length; i++)
        ringsmultiPoint.addPoint(results.feature.geometry.rings[0][i]);
    var centerPoint = ringsmultiPoint.getExtent().getCenter();

    map.setExtent(GetExtentFromPolygon(results.feature.geometry.getExtent().expand(4)));

    setTimeout(function () { ShowFindTaskData(results.feature, centerPoint) }, 300);
    layer.add(results.feature);

    findTasksGraphicClicked = true;
    graphicLayerClicked = false;
    polygon = true; //if the parcel is already drawn
}

//Function to get the extent of polygon
function GetExtentFromPolygon(extent) {
    var width = extent.getWidth();
    var height = extent.getHeight();
    var xmin = extent.xmin;
    var ymin = extent.ymin - (height / 6);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//function to get the extent of point
function CenterMapPoint(mapPoint, extent) {
    var width = extent.getWidth();
    var height = extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 4);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//function to populate all the parcel ids
function PopulateSearchItem(featureSet) {
    var DislayField = [];
    var features = featureSet;
    var ieVersion = getInternetExplorerVersion();
    if (features.length > 0) {
        if (features.length == 1) {
            FindTaskResults(featureSet[0]);
        }
        else {
            for (var i = 0; i < featureSet.length; i++) {
                if (featureSet[i].foundFieldName == "Parcel Identification Number")
                    DislayField[i] = "Parcel Identification Number";
                else if (featureSet[i].foundFieldName == "Site Address")
                    DislayField[i] = "Site Address";
            }
            RemoveChildren(dojo.byId('divAddressContainer'));
            var table = document.createElement("table");
            var tBody = document.createElement("tbody");
            table.appendChild(tBody);
            table.className = "tbl";
            table.id = "tbl";
            if (ieVersion.toString() == "7") {          //Patch for fixing overflow-x issue in compatibility mode.
                table.style.width = "94%";
                table.style.overflowX = "hidden";
            }
            table.cellSpacing = 0;
            table.cellPadding = 0;
            for (var i = 0; i < features.length; i++) {
                var tr = document.createElement("tr");
                tBody.appendChild(tr);
                var td1 = document.createElement("td");
                td1.innerHTML = featureSet[i].feature.attributes[DislayField[i]];
                td1.className = 'tdAddress';
                td1.height = 20;
                td1.id = i;
                td1.title = 'Click to Locate parcel';
                td1.setAttribute("parcelId", featureSet[i].feature.attributes["Parcel Identification Number"]);
                td1.onclick = function () {
                    FindTaskResults(featureSet[this.id]);
                    WipeOutControl(dojo.byId('divAddressContainer'), 500);
                }
                tr.appendChild(td1);
            }
            AnimateAdvanceSearch();
            var scrollbar_container = document.createElement('div');
            scrollbar_container.id = "address_container";
            scrollbar_container.className = "addressScrollbar_container";

            var container = document.createElement("div");
            container.id = "address_content";
            container.className = 'addressScrollbar_content';

            if (dojo.isIE < 9) {
                if (dojo.isIE) {
                    scrollbar_container.style.height = 127 + "px";
                    container.style.height = 126 + "px";
                }
            }
            container.appendChild(table);
            scrollbar_container.appendChild(container);
            dojo.byId('divAddressContainer').appendChild(scrollbar_container);
            CreateScrollbar(scrollbar_container, container);
        }
        HideLoadingMessage();
    }
    else {
        RemoveChildren(dojo.byId('divAddressContainer'));
        map.infoWindow.hide();
        ShowDialog('Error', 'Unable to locate specified address or parcel.');
        HideLoadingMessage();
    }
}

//function for Drawing Polygon Around the Feature
function DrawPolygon(features) {
    var lineColor = new dojo.Color();
    lineColor.setColor(rendererColor);
    var fillColor = new dojo.Color();
    fillColor.setColor(rendererColor);
    fillColor.a = 0.25;
    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
    var qglayer = map.getLayer(queryGraphicLayer);
    map.graphics.clear();

    var graphicCollection = [];
    var attributeCollection = [];
    for (var i = 0; i < features.length; i++) {
        if (attributeCollection[features[i].attributes.LOWPARCELID]) {
            attributeCollection[features[i].attributes.LOWPARCELID].push({ id: features[i].attributes.PARCELID, name: features[i].attributes });
        }
        else {
            attributeCollection[features[i].attributes.LOWPARCELID] = [];
            graphicCollection[features[i].attributes.LOWPARCELID] = features[i].geometry;
            attributeCollection[features[i].attributes.LOWPARCELID].push({ id: features[i].attributes.PARCELID, name: features[i].attributes });
        }
    }
    for (var lowerParcelID in attributeCollection) {
        var featureData = attributeCollection[lowerParcelID];
        var parcelAttributeData = [];
        if (featureData.length > 1) {
            for (var i = 0; i < featureData.length; i++) {
                parcelAttributeData[featureData[i].id] = featureData[i].name;
            }
        }
        else {
            parcelAttributeData = featureData[0].name;
        }
        var graphic = new esri.Graphic(graphicCollection[lowerParcelID], symbol, parcelAttributeData);
        qglayer.add(graphic);
    }

}

//function to get buffer region around Located parcel/address.
function CreateBuffer(evt) {
    ShowLoadingMessage('Buffering...');
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    var params = new esri.tasks.BufferParameters();
    ClearBuffer();
    dist = dojo.byId('txtBuffer');
    pdfFormat = dijit.byId('chkPdf').checked;
    csvFormat = dijit.byId('chkCsv').checked;
    occupants = dijit.byId('chkOccupants').checked;
    owners = dijit.byId('chkOwners').checked;
    //check if atleast owners or occupants is selected
    if (dist.value != "") {
        if (!IsNumeric(dist.value)) {
            dist.value = "";
            dist.focus();
            ShowErrorMessage('spanFileUploadMessage', 'Please enter numeric value.', '#FFFF00');
        }
        else if (!IsBufferValid(dist.value)) {
            ShowErrorMessage('spanFileUploadMessage', 'Valid buffer range is between 1 to ' + maxBufferDistance + ' feet.', '#FFFF00');
            HideLoadingMessage();
            return;
        }
        if ((owners == "checked" || owners) || (occupants == "checked" || occupants)) {
            if ((pdfFormat == "checked" || pdfFormat) || (csvFormat == "checked" || csvFormat)) {
                if (dijit.byId('selectAvery').item != null) {
                    averyFormat = dijit.byId('selectAvery').item.id[0];
                    if (map.getLayer(roadCenterLinesLayerID).getSelectedFeatures().length > 0) {
                        if (map.getLayer(roadCenterLinesLayerID).graphics) {
                            var polyLine = new esri.geometry.Polyline(map.spatialReference);
                            for (var j = 0; j < map.getLayer(roadCenterLinesLayerID).graphics.length; j++) {
                                if (map.getLayer(roadCenterLinesLayerID).graphics[j].visible) {
                                    polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
                                }
                            }
                            params.geometries = [polyLine];
                        }
                        else {
                            alert("Geometry for Buffer is Null in Create Buffer");
                        }

                        params.distances = [dist.value];
                        params.unit = esri.tasks.GeometryService.UNIT_FOOT;
                        esri.config.defaults.io.alwaysUseProxy = true;
                        geometryService.buffer(params, function (geometries) {
                            ShowBufferRoad(geometries);
                        });
                        esri.config.defaults.io.alwaysUseProxy = false;
                        map.infoWindow.hide();
                    }
                    else {
                        BufferParameters();
                    }
                }
                else {
                    ShowErrorMessage('spanFileUploadMessage', 'Invalid Avery format. Please select a valid format from the dropdown list.', '#FFFF00');
                    HideLoadingMessage();
                }
            }
            else {
                ShowErrorMessage('spanFileUploadMessage', 'Select atleast one file format to download.', '#FFFF00');
                HideLoadingMessage();
            }
        }
        else {
            ShowErrorMessage('spanFileUploadMessage', 'Select Property Owners or Occupants to notify.', '#FFFF00');
            HideLoadingMessage();
        }
    }
    else {
        ShowErrorMessage('spanFileUploadMessage', 'Please enter the buffer distance.', '#FFFF00');
        HideLoadingMessage();
    }
}

//function for giving parameters to buffer
function BufferParameters() {
    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);

    var params = new esri.tasks.BufferParameters();
    if (map.getLayer(queryGraphicLayer).graphics) {
        var polygon = new esri.geometry.Polygon(map.spatialReference);
        for (var i = 0; i < map.getLayer(queryGraphicLayer).graphics.length; i++) {
            polygon.addRing(map.getLayer(queryGraphicLayer).graphics[i].geometry.rings[0]);

        }
        params.geometries = [polygon];
    }
    else {
        alert("Geometry for Buffer is Null in Create Buffer");
    }
    params.distances = [dist.value];
    params.unit = esri.tasks.GeometryService.UNIT_FOOT;
    params.outSpatialReference = map.spatialReference;
    esri.config.defaults.io.alwaysUseProxy = true;
    geometryService.buffer(params, ShowBuffer, function (err) { HideLoadingMessage(); alert("Query " + err); });               //querying geometry service for buffered geometry
    esri.config.defaults.io.alwaysUseProxy = false;
    map.infoWindow.hide();
    if (findTasksGraphicClicked) {
        findTasksGraphicClicked = false;
        graphicLayerClicked = false;
    }
    ShowLoadingMessage('Buffering...');
}

//function to show selected parcels from feature layer.
function ShowBuffer(geometries) {
    ClearAll(true);
    HideLoadingMessage();
    map.infoWindow.hide();
    ShowLoadingMessage('Locating Parcels...');
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    var symbol = new esri.symbol.SimpleFillSymbol(
        esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        new esri.symbol.SimpleLineSymbol(
          esri.symbol.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([255, 0, 0, 0.65]), 2
        ),
        new dojo.Color([255, 0, 0, 0.35])
      );

    dojo.forEach(geometries, function (geometry) {
        AddGraphic(map.getLayer(tempBufferLayer), symbol, geometry);
    });

    var query = new esri.tasks.Query();
    query.geometry = geometries[0];
    query.outFields = queryOutFields;
    query.maxAllowableOffset = maxAllowableOffset;
    //    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    query.returnGeometry = true;
    //executing query task for selecting intersecting features
    qTask.execute(query, function (featureSet) { QueryCallback(featureSet, false) });
}

function ShowBufferRoad(geometries) {
    ClearAll(true);
    ShowLoadingMessage('Buffering Adjacent Roads...');
    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    var symbol = new esri.symbol.SimpleFillSymbol(
        esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        new esri.symbol.SimpleLineSymbol(
          esri.symbol.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([255, 0, 0, 0.65]), 2
        ),
        new dojo.Color([255, 0, 0, 0.35])
      );
    dojo.forEach(geometries, function (geometry) {
        AddGraphic(map.getLayer(tempBufferLayer), symbol, geometry);
        //        HideMapTip();
        //        dojo.disconnect(mouseMoveHandle);
    });

    var query = new esri.tasks.Query();
    query.geometry = geometries[0];
    query.outFields = queryOutFields;
    query.maxAllowableOffset = maxAllowableOffset;
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    query.returnGeometry = true;
    //executing query task for selecting intersecting features
    qTask.execute(query, function (featureSet) { QueryCallback(featureSet, true) });
}

//Function for handling queryTask callback for avery label and csv generation.
function QueryCallback(featureSet, road) {
    if (map.getLayer(queryGraphicLayer)) {
        map.getLayer(queryGraphicLayer).clear();
    }

    var features = featureSet.features;
    var layer = map.getLayer(queryGraphicLayer);
    if (features.length == 0) {
        if (!road) {
            ShowDialog('Error', 'Parcel not found at current location.');
        } else {

            ShowDialog('Error', 'There are no parcels adjacent to the road within ' + dist.value + ' feet.');
        }

        HideLoadingMessage();
    }
    else {
        try {
            var poly = new esri.geometry.Polygon(map.spatialReference);
            for (var feature in features) {
                poly.addRing(features[feature].geometry.rings[0]);
            }
            map.setExtent(poly.getExtent().expand(3));

            DrawPolygon(features);

            interactiveParcel = false;

            var strAveryParam = "";
            var strCsvParam = "";
            if (pdfFormat == "checked" || pdfFormat) {
                strAveryParam = CreateAveryParam(features);
            }
            if (csvFormat == "checked" || csvFormat) {
                strCsvParam = CreateCsvParam(features);
            }

            ExecuteGPTask(pdfFormat, csvFormat, strAveryParam, strCsvParam);
        }
        catch (err) {
            HideLoadingMessage();
            ShowDialog('Error', err.message);
        }
    }
}
//Function for dynamically creating avery parameter string
function CreateAveryParam(features) {
    try {
        var strAveryParam = '';
        for (var featureCount = 0; featureCount < features.length; featureCount++) {        //looping through populated features
            var averyFields;
            if (owners == "checked" || owners) {
                for (var fieldCount = 0; fieldCount < averyFieldsCollection.length; fieldCount++) { //looping through configurable avery fields
                    averyFields = averyFieldsCollection[fieldCount];
                    if (averyFields.split(',').length > 1) {
                        var subFields = averyFields.split(',');
                        for (var i = 0; i < subFields.length; i++) {
                            if (features[featureCount].attributes[subFields[i]]) {
                                strAveryParam += features[featureCount].attributes[subFields[i]].replace(',', '') + " ";
                            }
                        }
                        strAveryParam = strAveryParam.slice(0, -1) + "~";
                    }
                    else {
                        if (features[featureCount].attributes[averyFields]) {
                            strAveryParam += features[featureCount].attributes[averyFields].replace(',', '') + "~";
                        }
                    }
                }
                strAveryParam += "$";
            }
        }
        for (var featureCount = 0; featureCount < features.length; featureCount++) {//looping through populated features for occupants
            if (occupants == "checked" || occupants) {                  //if occupants are selected to be displayed
                if (features[featureCount].attributes.SITEADDRESS) {               //Condition for displaying occupant fields
                    for (var fieldCount = 0; fieldCount < occupantFields.length; fieldCount++) { //looping through configurable avery fields for occupants
                        averyFields = occupantFields[fieldCount];
                        if (fieldCount == 1) {
                            strAveryParam += occupantName + "~";
                        }
                        if (averyFields.split(',').length > 1) {
                            var subFields = averyFields.split(',');
                            for (var i = 0; i < subFields.length; i++) {
                                if (features[featureCount].attributes[subFields[i]]) {
                                    strAveryParam += features[featureCount].attributes[subFields[i]].replace(',', '') + " ";
                                }
                            }
                            strAveryParam = strAveryParam.slice(0, -1) + "~";
                        }
                        else {
                            if (features[featureCount].attributes[averyFields]) {
                                strAveryParam += features[featureCount].attributes[averyFields].replace(',', '') + "~";
                            }
                        }
                    }
                    strAveryParam += "$";
                }
            }
        }
        return strAveryParam;
    }
    catch (err) {
        ShowDialog(err.Message);
    }
}

//Function for dynamically creating csv parameter string
function CreateCsvParam(features) {
    var strCsvParam = '';
    for (var featureCount = 0; featureCount < features.length; featureCount++) {//looping through populated features for owners
        var csvFields;
        if (owners == "checked" || owners) {
            for (var fieldCount = 0; fieldCount < csvFieldsCollection.length; fieldCount++) { //looping through configurable avery fields
                csvFields = csvFieldsCollection[fieldCount];
                if (csvFields.split(',').length > 1) {
                    var subFields = csvFields.split(',');
                    strCsvParam += "\"";
                    for (var i = 0; i < subFields.length; i++) {
                        if (features[featureCount].attributes[subFields[i]]) {
                            strCsvParam += features[featureCount].attributes[subFields[i]].replace(',', '') + " ";
                        }
                        else {
                            strCsvParam += features[featureCount].attributes[subFields[i]] + " ";
                        }
                    }
                    strCsvParam = strCsvParam.slice(0, -1) + "\",";
                }
                else {
                    if (features[featureCount].attributes[csvFields]) {
                        strCsvParam += features[featureCount].attributes[csvFields].replace(',', '') + ",";
                    }
                    else {
                        strCsvParam += features[featureCount].attributes[csvFields] + ",";
                    }
                }
            }
            strCsvParam += "$";
        }
    }
    for (var featureCount = 0; featureCount < features.length; featureCount++) {//looping through populated features for occupants
        if (occupants == "checked" || occupants) {                  //if occupants are selected to be displayed
            if (features[featureCount].attributes.SITEADDRESS) {               //Condition for displaying occupant fields
                for (var fieldCount = 0; fieldCount < occupantFields.length; fieldCount++) { //looping through configurable avery fields
                    csvFields = occupantFields[fieldCount];
                    if (fieldCount == 1) {
                        strCsvParam += occupantName + ",";
                    }
                    if (csvFields.split(',').length > 1) {
                        var subFields = csvFields.split(',');
                        strCsvParam += "\"";
                        for (var i = 0; i < subFields.length; i++) {
                            strCsvParam += features[featureCount].attributes[subFields[i]].replace(',', '') + " ";
                        }
                        strCsvParam = strCsvParam.slice(0, -1) + "\",";
                    }
                    else {
                        if (features[featureCount].attributes[csvFields]) {
                            strCsvParam += features[featureCount].attributes[csvFields].replace(',', '') + ",";
                        }
                        else {
                            strCsvParam += features[featureCount].attributes[csvFields] + ",";
                        }
                    }
                }
                //Additional loop for appending additional commas
                for (var count = 0; count < (csvFieldsCollection.length - occupantFields.length); count++) {
                    strCsvParam += ",";
                }
                strCsvParam = strCsvParam.slice(0, -1);
                strCsvParam += "$";
            }
        }
    }
    strCsvParam = strCsvParam.slice(0, -1);
    return strCsvParam;
}


//function for displaying current location
function ShowMyLocation() {
    if (dojo.coords(dojo.byId('divBaseMapTitleContainer')).h > 0) {
        WipeOutControl(dojo.byId('divBaseMapTitleContainer'), 400);
    }
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }

    dijit.byId('imgBaseMap').attr("checked", false);
    dojo.byId('imgGPS').src = "images/BlueGPS.png";
    navigator.geolocation.getCurrentPosition(
		function (position) {
		    ShowLoadingMessage("Finding your current location...");
		    mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 102100 }));
		    var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
		    graphicCollection.addPoint(mapPoint);
		    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
		        HideLoadingMessage();
		        mapPoint = newPointCollection[0].getPoint(0);
		        map.centerAt(mapPoint);
		        var gpsSymbol = new esri.symbol.PictureMarkerSymbol(defaultImg, 25, 25);
		        var attr = {
		            lat: position.coords.longitude,
		            long: position.coords.latitude
		        };
		        var graphic = new esri.Graphic(mapPoint, gpsSymbol, attr, null);
		        map.getLayer(tempGPSLayer).add(graphic);

		    });
		},
    		function (error) {
    		    HideLoadingMessage();
    		    if (dojo.byId('imgGPS').src = "images/BlueGPS.png") {
    		        dojo.byId('imgGPS').src = "images/gps.png";
    		        var gpsButton = dijit.byId('imgGPSButton');
    		        gpsButton.attr("checked", false);
    		    }
    		    switch (error.code) {
    		        case error.TIMEOUT:
    		            alert(messages.getElementsByTagName("timeOut")[0].childNodes[0].nodeValue);
    		            break;
    		        case error.POSITION_UNAVAILABLE:
    		            alert(messages.getElementsByTagName("positionUnavailable")[0].childNodes[0].nodeValue);
    		            break;
    		        case error.PERMISSION_DENIED:
    		            alert(messages.getElementsByTagName("permissionDenied")[0].childNodes[0].nodeValue);
    		            break;
    		        case error.UNKNOWN_ERROR:
    		            alert(messages.getElementsByTagName("unknownError")[0].childNodes[0].nodeValue);
    		            break;
    		    }
    		}, { timeout: 10000 });
}

//function to find custom anchor point
function GetInfoWindowAnchor(pt, infoWindowWidth) {
    var verticalAlign;
    if (pt.y + 298 < map.height) {
        verticalAlign = "LOWER";
    }
    else {
        verticalAlign = "UPPER";
    }
    if ((pt.x + infoWindowWidth) > map.width) {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "LEFT"];
    }
    else {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "RIGHT"];
    }
}