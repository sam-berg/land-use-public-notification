/** @license
 | Version 10.2
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
var mapPoint;                       //variable to store map point location
var dist;                           //variable to store buffer distance
var averyFormat = '';               //variable to store avery format
var pdfFormat = '';                 //variable to store PDF format download
var csvFormat = '';                 //variable to store CSV format download
var occupants = '';                 //variable to store notifying occupants
var owners = '';                    //variable to store notifying owners
var overlapCount;                   //Variable to maintain the count of overlapping parcels.
var geometryForBuffer;              //variable to store geometry to be used for buffer
var findTasksGraphicClicked = false; //flag for handling to draw polygon
var polygon = true;                 //flag for handling to draw route and polygon
var interactiveParcel = false;
var flagForNewRoad; //flag for handling to draw new route
var flagForAddress = false; //flag to handle address search
var bufferArray = []; //Array to store buffer parameters


//Locate Address/ParcleID using findtask
function Locate() {
    var thisSearchTime = lastSearchTime = (new Date()).getTime();

    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    if (dojo.byId("tdSearchAddress").className.trim() == "tdSearchByAddress") {

        ClearAll();
        parcelArray = [];

        var searchText = dojo.byId("txtAddress");
        if (searchText) {
            searchText = searchText.value;
            if (searchText) {
                searchText = searchText.trim();
            }
        }

        flagForAddress = true;
        if (!searchText || searchText === "") {
            dojo.byId("imgSearchLoader").style.display = "none";
            RemoveChildren(dojo.byId('tblAddressResults'));
            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
            alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
            return;
        }

        //Search for address
        var query;
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = queryOutFields;

        var whereClause = "";
        var whereSearchText = searchText.toUpperCase();
        dojo.forEach(searchFields, function(field, i) {
            if (i > 0) {
                whereClause += " OR ";
            }
            whereClause += "UPPER(" + field + ") LIKE '%" + whereSearchText + "%'";
        });
        query.where = whereClause;

        esri.config.defaults.io.alwaysUseProxy = true;
        qTask.execute(query, function (featureSet) {
            if (thisSearchTime < lastSearchTime) {
                return;
            }
            PopulateSearchItem(searchText, featureSet);
        }, function (err) {
            FindTaskErrBack();
        });

        dojo.byId("imgSearchLoader").style.display = "block";
    }
    else {
        //Search for road
        if (dojo.byId("txtAddress").value.trim() == '') {
            dojo.byId("imgSearchLoader").style.display = "none";
            RemoveChildren(dojo.byId('tblAddressResults'));
            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
            if (dojo.byId("txtAddress").value != "") {
                alert(messages.getElementsByTagName("streetToLocate")[0].childNodes[0].nodeValue);
            }
            return;
        }

        ClearAll();
        parcelArray = [];
        roadArray = [];
        isSpanClicked = false;
        HideMapTip();
        dojo.disconnect(mouseMoveHandle);
        interactiveParcel = false;

        var query = new esri.tasks.Query();
        query.where = "UPPER(" + locatorSettings.Locators[1].DisplayField + ") LIKE '" + dojo.byId("txtAddress").value.trim().toUpperCase() + "%'";
        dojo.byId("imgSearchLoader").style.display = "block";

        map.getLayer(roadCenterLinesLayerID).queryFeatures(query, function (featureSet) {
            if (thisSearchTime < lastSearchTime) {
                return;
            }

            RemoveChildren(dojo.byId('tblAddressResults'));
            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
            dojo.byId("txtAddress").value = dojo.byId("txtAddress").value.trim();
            if (featureSet.features.length > 0) {
                if (query.where.toUpperCase().match(dojo.byId("txtAddress").value.toUpperCase())) {
                    if (featureSet.features.length == 1) {
                        FindAndShowRoads();
                    } else {
                        var searchString = dojo.byId("txtAddress").value.trim().toLowerCase();
                        var table = dojo.byId("tblAddressResults");
                        var tBody = document.createElement("tbody");
                        table.appendChild(tBody);
                        table.className = "tbl";
                        table.cellSpacing = 0;
                        table.cellPadding = 0;
                        var nameArray = [];
                        for (var order = 0; order < featureSet.features.length; order++) {
                            nameArray.push({ name: featureSet.features[order].attributes[locatorSettings.Locators[1].DisplayField], attributes: featureSet.features[order].attributes, geometry: featureSet.features[order].geometry });
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
                            if (0 == i || searchString != nameArray[i].attributes[locatorSettings.Locators[1].DisplayField].toLowerCase()) {
                                if (i > 0) {
                                    var previousFoundName = nameArray[i - 1].attributes[locatorSettings.Locators[1].DisplayField]
                                } else {
                                    var previousFoundName = "";
                                }
                                if (nameArray[i].attributes[locatorSettings.Locators[1].DisplayField] != previousFoundName) {
                                    ++numUnique;
                                    var tr = document.createElement("tr");
                                    tBody.appendChild(tr);
                                    var td1 = document.createElement("td");
                                    td1.innerHTML = nameArray[i].attributes[locatorSettings.Locators[1].DisplayField];
                                    td1.className = 'tdAddress';
                                    td1.id = i;
                                    td1.title = 'Click to locate road segment';
                                    td1.setAttribute("OBJECTID", nameArray[0].attributes[map.getLayer(roadCenterLinesLayerID).objectIdField]);
                                    td1.onclick = function () {
                                        ClearBuffer();
                                        dojo.byId("txtAddress").value = this.innerHTML;
                                        dojo.byId('txtAddress').setAttribute("defaultCase", this.innerHTML);
                                        dojo.byId("txtAddress").setAttribute("defaultCaseTitle", this.innerHTML);
                                        polygon = false;
                                        FindAndShowRoads();
                                        HideAddressContainer();
                                    }
                                    tr.appendChild(td1);
                                }
                            }
                        }

                        if (1 < numUnique) {
                            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                        } else {
                            dojo.byId("txtAddress").value = nameArray[0].attributes[locatorSettings.Locators[1].DisplayField];
                            dojo.byId('txtAddress').setAttribute("defaultCase", nameArray[0].attributes[locatorSettings.Locators[1].DisplayField]);
                            dojo.byId("txtAddress").setAttribute("defaultCaseTitle", nameArray[0].attributes[locatorSettings.Locators[1].DisplayField]);
                            FindAndShowRoads();
                            HideAddressContainer();
                        }
                    }
                }
            } else {
                selectedPoint = null;
                displayInfo = null;
                map.infoWindow.hide();
                dojo.byId("imgSearchLoader").style.display = "none";
                RemoveChildren(dojo.byId('tblAddressResults'));
                CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                LoctorErrBack("unableToLocate", true);
            }
            dojo.byId("imgSearchLoader").style.display = "none";
        });

    }
}

//Populate list of parcel id's in address container
function PopulateSearchItem(searchText, featureSet) {
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").value.trim();
    if (flagForAddress) {
        RemoveChildren(dojo.byId('tblAddressResults'));
        CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));

        var DisplayField = [];
        var features = featureSet.features;
        var ieVersion = getInternetExplorerVersion();
        if (features.length > 0) {
            // Find the full text of the first attribute that contains the match
            var whereSearchText = searchText.toUpperCase();
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                dojo.some(searchFields, function(field) {
                    var value = feature.attributes[field];
                    if (value && value.toUpperCase().indexOf(whereSearchText) >= 0) {
                        feature.foundFieldName = field;
                        feature.value = value;
                        return true;
                    }
                    return false;
                });
            }

            if (features.length === 1) {
                FindTaskResults(features[0]);
            } else {
                var addressParcelFields = locatorSettings.Locators[0].DisplayField.split(",");
                for (var i = 0; i < features.length; i++) {
                    if (features[i].foundFieldName === addressParcelFields[0])
                        DisplayField[i] = addressParcelFields[0];
                    else if (features[i].foundFieldName === addressParcelFields[1])
                        DisplayField[i] = addressParcelFields[1];
                }

                var table = dojo.byId("tblAddressResults");
                var tBody = document.createElement("tbody");
                table.appendChild(tBody);
                table.className = "tbl";
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
                    td1.innerHTML = features[i].attributes[DisplayField[i]];
                    td1.className = 'tdAddress';
                    td1.height = 20;
                    td1.id = i;
                    td1.title = 'Click to Locate parcel';
                    td1.setAttribute("parcelId", features[i].attributes[addressParcelFields[0]]);
                    td1.onclick = function () {
                        dojo.byId("txtAddress").value = this.innerHTML;
                        dojo.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                        dojo.byId("txtAddress").setAttribute("defaultAddressTitle", this.innerHTML);
                        FindTaskResults(features[this.id]);
                        RemoveChildren(dojo.byId('tblAddressResults'));
                        dojo.byId("imgSearchLoader").style.display = "none";
                    }
                    tr.appendChild(td1);
                }
                SetAddressResultsHeight();
            }
        } else {
            selectedPoint = null;
            displayInfo = null;
            map.infoWindow.hide();
            alert(messages.getElementsByTagName("unableToLocateParcel")[0].childNodes[0].nodeValue);
        }
        dojo.byId("imgSearchLoader").style.display = "none";
        flagForAddress = false;
    }
}

//Locate selected parcel or address
function FindTaskResults(selectedFeature) {
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

    dojo.byId("txtAddress").defaultText = selectedFeature.value;

    var layer = map.getLayer(queryGraphicLayer);
    var lineColor = new dojo.Color();
    lineColor.setColor(rendererColor);

    var fillColor = new dojo.Color();
    fillColor.setColor(rendererColor);
    fillColor.a = 0.25;

    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
    selectedFeature.setSymbol(symbol);

    geometryForBuffer = selectedFeature.geometry;
    parcelArray.push(selectedFeature.attributes[parcelInformation.AliasParcelField]);
    ringsmultiPoint = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 3857 }));
    for (var i = 0; i < selectedFeature.geometry.rings[0].length; i++)
        ringsmultiPoint.addPoint(selectedFeature.geometry.rings[0][i]);
    var centerPoint = ringsmultiPoint.getExtent().getCenter();

    map.setExtent(GetExtentFromPolygon(selectedFeature.geometry.getExtent().expand(4)));

    setTimeout(function () { ShowFindTaskData(selectedFeature, centerPoint) }, 700);
    layer.add(selectedFeature);

    findTasksGraphicClicked = true;
    graphicLayerClicked = false;
    polygon = true; //if the parcel is already drawn

    HideAddressContainer();
}

//This function is called when find task service fails or does not return any data
function FindTaskErrBack() {
    flagForAddress = false;
    dojo.byId("imgSearchLoader").style.display = "none";
    RemoveChildren(dojo.byId('tblAddressResults'));
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
    selectedPoint = null;
    displayInfo = null;
    map.infoWindow.hide();
    LoctorErrBack(messages.getElementsByTagName("noResults")[0].childNodes[0].nodeValue, false);
}

//This function is called when locator service fails or does not return any data
function LoctorErrBack(val, xml) {
    var table = dojo.byId("tblAddressResults");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.cellSpacing = 0;
    table.cellPadding = 0;

    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    if (xml) {
        td1.innerHTML = messages.getElementsByTagName(val)[0].childNodes[0].nodeValue;
    }
    else {
        td1.innerHTML = val;
    }
    tr.appendChild(td1);
}

//Display the parcels on map
function ExecuteQueryTask(evt) {
    HideShareAppContainer();
    HideAddressContainer();
    if (dojo.coords("divLayerContainer").h > 0) {
        dojo.replaceClass("divLayerContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divLayerContainer').style.height = '0px';
    }
    if (!graphicLayerClicked || findTasksGraphicClicked) {
        roadArray = [];
        featureSet = null;
        if (!evt.ctrlKey) {
            ShowLoadingMessage('Locating parcel');
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            ClearAll();
            interactiveParcel = false;
            parcelArray = [];
            QueryForParcel(evt);
            if (map.getLayer(roadCenterLinesLayerID)) {
                map.getLayer(roadCenterLinesLayerID).clearSelection();
            }
        }
        if (interactiveParcel) {
            if (map.getLayer(tempBufferLayer).graphics.length > 0) {
                parcelArray = bufferArray;
            }
            ClearAll(evt);
            if (evt.ctrlKey) {
                if (polygon) {
                    HideMapTip();
                    ShowLoadingMessage('Locating adjacent parcel');
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
            selectedPoint = null;
            displayInfo = null;
            map.infoWindow.hide();
            HideMapTip();
            ShowLoadingMessage('Locating adjacent road');
            mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForRoad);
            QueryForAdjacentRoad(evt);
        }
    }
}

//Query for parcel when clicked on map
function QueryForParcel(evt) {
    var mapPointForQuery = new esri.geometry.Point(evt.mapPoint.x, evt.mapPoint.y, map.spatialReference);
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
            alert(messages.getElementsByTagName("noParcel")[0].childNodes[0].nodeValue);
            HideMapTip();
            HideLoadingMessage();
        }
    }, function (err) {
        alert(messages.getElementsByTagName("unableToPerform")[0].childNodes[0].nodeValue);
        HideLoadingMessage();
    });
    esri.config.defaults.io.alwaysUseProxy = false;
}

//Find the road segment
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
    alert(messages.getElementsByTagName("fetchRoadInformation")[0].childNodes[0].nodeValue);
}

//Locate adjacent road
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
                    query.where = locatorSettings.Locators[1].DisplayField + "= '" + featureset.features[0].attributes[locatorSettings.Locators[1].DisplayField] + "'";
                    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_ADD, function (featureSet) {
                        var polyLine = new esri.geometry.Polyline(map.spatialReference);
                        for (var j = 0; j < map.getLayer(roadCenterLinesLayerID).graphics.length; j++) {
                            map.getLayer(roadCenterLinesLayerID).graphics[j].show();
                            polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
                            roadArray.push(map.getLayer(roadCenterLinesLayerID).graphics[j].attributes[map.getLayer(roadCenterLinesLayerID).objectIdField]);
                        }
                        map.setExtent(polyLine.getExtent().expand(1.5));
                    });
                    HideLoadingMessage();
                }
                else {
                    HideLoadingMessage();
                    alert(messages.getElementsByTagName("noRoad")[0].childNodes[0].nodeValue);
                }
            });
        }, function (error) {
            HideLoadingMessage();
            alert(error.message);
        });
    }
    else {
        HideLoadingMessage();
        alert(messages.getElementsByTagName("noRoad")[0].childNodes[0].nodeValue);
    }
}

//Function if their are multiple features in featureSet
function ShowFeatureSet(fset, evt) {
    ClearAll(evt);
    if (fset.features.length > 1) {
        var screenPoint = evt.screenPoint;
        featureSet = fset;
        overlapCount = 0;
        var contentDiv = CreateContent(featureSet.features);
        ShowOverlappingParcels(featureSet.features, contentDiv, evt, featureSet.features[0].attributes[parcelInformation.ParcelIdentification]);
        var features = featureSet.features;
        DrawPolygon(features, false);
        geometryForBuffer = features[0].geometry;
        map.setExtent(CenterMapPoint(evt.mapPoint, fset.features[0].geometry.getExtent().expand(9)));
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
        parcelArray.push(feature.attributes[parcelInformation.ParcelIdentification]);
        displayInfo = feature.attributes[parcelInformation.ParcelIdentification] + "$infoParcel";
        ShowUniqueParcel(feature, evt);
        HideLoadingMessage();
        map.setExtent(CenterMapPoint(evt.mapPoint, fset.features[0].geometry.getExtent().expand(9)));
        layer.add(feature);
        polygon = true;
        geometryForBuffer = feature.geometry;
    }
}

//Get the extent of polygon
function GetExtentFromPolygon(extent) {
    var width = extent.getWidth();
    var height = extent.getHeight();
    var xmin = extent.xmin;
    var ymin = extent.ymin - (height / 6);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Get the extent of point
function CenterMapPoint(mapPoint, extent) {
    var width = extent.getWidth();
    var height = extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 4);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Draw polygon around the feature
function DrawPolygon(features, share) {
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
        if (attributeCollection[features[i].attributes[parcelInformation.LowParcelIdentification]]) {
            attributeCollection[features[i].attributes[parcelInformation.LowParcelIdentification]].push({ id: features[i].attributes[parcelInformation.ParcelIdentification], name: features[i].attributes });
            if (!share) {
                if (i == 1) {
                    parcelArray.push(features[0].attributes[parcelInformation.ParcelIdentification]);
                }
            }
        }
        else {
            attributeCollection[features[i].attributes[parcelInformation.LowParcelIdentification]] = [];
            graphicCollection[features[i].attributes[parcelInformation.LowParcelIdentification]] = features[i].geometry;
            attributeCollection[features[i].attributes[parcelInformation.LowParcelIdentification]].push({ id: features[i].attributes[parcelInformation.ParcelIdentification], name: features[i].attributes });
        }
    }
    for (var lowerParcelID in attributeCollection) {
        var featureData = attributeCollection[lowerParcelID];
        var parcelAttributeData = [];
        if (featureData.length > 1) {
            for (var i = 0; i < featureData.length; i++) {
                parcelAttributeData[featureData[i].id] = featureData[i].name;
                if (i == 0) {
                    bufferArray.push(featureData[0].name[parcelInformation.ParcelIdentification]);
                }
            }
        }
        else {
            parcelAttributeData = featureData[0].name;
            bufferArray.push(featureData[0].name[parcelInformation.ParcelIdentification]);
        }
        var graphic = new esri.Graphic(graphicCollection[lowerParcelID], symbol, parcelAttributeData);
        qglayer.add(graphic);
    }
}

//Get buffer region around located parcel/address.
function CreateBuffer(evt) {
    ShowLoadingMessage('Buffering');
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);
    var params = new esri.tasks.BufferParameters();
    ClearBuffer();
    dist = dojo.byId('txtBuffer');
    pdfFormat = dijit.byId('chkPdf').checked;
    csvFormat = dijit.byId('chkCsv').checked;
    occupants = dijit.byId('chkOccupants').checked;
    owners = dijit.byId('chkOwners').checked;
    //check if at least owners or occupants is selected
    if (dist.value != "") {
        if (!IsNumeric(dist.value)) {
            dist.value = "";
            dist.focus();
            ShowErrorMessage('spanFileUploadMessage', messages.getElementsByTagName("enterNumeric")[0].childNodes[0].nodeValue, '#FFFF00');
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
                            alert(messages.getElementsByTagName("createBuffer")[0].childNodes[0].nodeValue);
                        }

                        params.distances = [dist.value];
                        params.unit = esri.tasks.GeometryService.UNIT_FOOT;
                        esri.config.defaults.io.alwaysUseProxy = true;
                        geometryService.buffer(params, function (geometries) {
                            ShowBufferRoad(geometries);
                        });
                        esri.config.defaults.io.alwaysUseProxy = false;
                        selectedPoint = null;
                        displayInfo = null;
                        map.infoWindow.hide();
                    }
                    else {
                        BufferParameters();
                    }
                }
                else {
                    ShowErrorMessage('spanFileUploadMessage', messages.getElementsByTagName("inValidAveryFormat")[0].childNodes[0].nodeValue, '#FFFF00');
                    HideLoadingMessage();
                }
            }
            else {
                ShowErrorMessage('spanFileUploadMessage', messages.getElementsByTagName("fileSelect")[0].childNodes[0].nodeValue, '#FFFF00');
                HideLoadingMessage();
            }
        }
        else {
            ShowErrorMessage('spanFileUploadMessage', messages.getElementsByTagName("selectProperty")[0].childNodes[0].nodeValue, '#FFFF00');
            HideLoadingMessage();
        }
    }
    else {
        ShowErrorMessage('spanFileUploadMessage', messages.getElementsByTagName("enterBufferDist")[0].childNodes[0].nodeValue, '#FFFF00');
        HideLoadingMessage();
    }
}

//Fetch parameters to buffer
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
        alert(messages.getElementsByTagName("createBuffer")[0].childNodes[0].nodeValue);
    }
    params.distances = [dist.value];
    params.unit = esri.tasks.GeometryService.UNIT_FOOT;
    params.outSpatialReference = map.spatialReference;
    esri.config.defaults.io.alwaysUseProxy = true;
    geometryService.buffer(params, ShowBuffer, function (err) { HideLoadingMessage(); alert("Query " + err); });               //querying geometry service for buffered geometry
    esri.config.defaults.io.alwaysUseProxy = false;
    selectedPoint = null;
    displayInfo = null;
    map.infoWindow.hide();
    if (findTasksGraphicClicked) {
        findTasksGraphicClicked = false;
        graphicLayerClicked = false;
    }
    ShowLoadingMessage('Buffering');
}

//Function to draw buffer for parcel(s)
function ShowBuffer(geometries) {
    ClearAll(true);
    HideLoadingMessage();
    selectedPoint = null;
    displayInfo = null;
    map.infoWindow.hide();
    ShowLoadingMessage('Locating Parcels');
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
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    query.returnGeometry = true;
    //executing query task for selecting intersecting features
    qTask.execute(query, function (featureSet) { QueryCallback(featureSet, false) });
}

//Function to draw buffer for road(s)
function ShowBufferRoad(geometries) {
    ClearAll(true);
    ShowLoadingMessage('Buffering Adjacent Roads');
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

//Handle queryTask callback for avery label and csv generation.
function QueryCallback(featureSet, road) {
    if (map.getLayer(queryGraphicLayer)) {
        map.getLayer(queryGraphicLayer).clear();
    }

    var features = featureSet.features;
    var layer = map.getLayer(queryGraphicLayer);
    if (features.length == 0) {
        if (!road) {
            alert(messages.getElementsByTagName("noParcel")[0].childNodes[0].nodeValue);
        } else {
            alert('There are no parcels adjacent to the road within ' + dist.value + ' feet.');
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

            DrawPolygon(features, false);

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
            alert(err.message);
        }
    }
}

//Create dynamic avery parameter string
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
                if (features[featureCount].attributes[occupantFields[1]]) {               //Condition for displaying occupant fields
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
        alert(err.Message);
    }
}

//Create dynamic csv parameter string
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
            if (features[featureCount].attributes[occupantFields[1]]) {               //Condition for displaying occupant fields
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

//Display current location
function ShowMyLocation() {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        HideAddressContainer();
    }
    ClearAll();
    navigator.geolocation.getCurrentPosition(
        function (position) {
            ShowLoadingMessage("Finding your current location");
            mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, map.spatialReference);
            var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
            graphicCollection.addPoint(mapPoint);
            geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
                for (var bMap = 0; bMap < baseMapLayerCollection.length; bMap++) {
                    if (map.getLayer(baseMapLayerCollection[bMap].Key).visible) {
                        var bmap = baseMapLayerCollection[bMap].Key;
                    }
                }
                if (!map.getLayer(bmap).fullExtent.contains(newPointCollection[0].getPoint(0))) {
                    mapPoint = null;
                    selectedMapPoint = null;
                    map.getLayer(tempGPSLayer).clear();
                    map.infoWindow.hide();
                    HideLoadingMessage();
                    alert(messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
                    return;
                }
                map.infoWindow.hide();
                mapPoint = newPointCollection[0].getPoint(0);
                map.centerAt(mapPoint);
                var gpsSymbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
                var attr = {
                    lat: position.coords.longitude,
                    long: position.coords.latitude
                };
                var graphic = new esri.Graphic(mapPoint, gpsSymbol, attr, null);
                map.getLayer(tempGPSLayer).add(graphic);
                HideLoadingMessage();
            });
        },
            function (error) {
                HideLoadingMessage();
                switch (error.code) {
                    case error.TIMEOUT:
                        alert(messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert(messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
                        break;
                    case error.PERMISSION_DENIED:
                        alert(messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
                        break;
                    case error.UNKNOWN_ERROR:
                        alert(messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
                        break;
                }
            }, { timeout: 10000 });
}
