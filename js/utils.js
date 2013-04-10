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
var isSpanClicked = false; //flag set to tooltip
var polyLine; // flag set to identify the graphic geometry
var tinyResponse; //variable to store the response getting from tiny URL api
var tinyUrl; //variable to store the tiny URL
var displayInfo = null; //variable to store the share info window information
var shareinfo = false; //Flag set for info window display
var selectedPoint = null; //variable to selected parcel/road geometry

//Display help window
function ShowHelp() {
    window.open(helpURL, "helpwindow");
}

//Add graphic to a layer.
function AddGraphic(layer, symbol, point, attr) {
    var graphic = new esri.Graphic(point, symbol, attr, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    layer.add(featureSet.features[0]);
}

//Clear All Graphics
function ClearAll(evt) {
    selectedPoint = null;
    displayInfo = null;
    map.infoWindow.hide();
    map.graphics.clear();
    for (var i = 0; i < map.graphicsLayerIds.length; i++) {
        if (evt) {
            if (evt.ctrlKey) {
                if (map.graphicsLayerIds[i] == queryGraphicLayer) {
                    continue;
                }
                if (map.graphicsLayerIds[i] == roadCenterLinesLayerID) {
                    continue;
                }
            }
        } else {
            if (map.getLayer(roadCenterLinesLayerID)) {
                map.getLayer(roadCenterLinesLayerID).clearSelection();
            }
        }

        if (map.graphicsLayerIds[i] == roadCenterLinesLayerID) {
            continue;
        }
        else {
            map.getLayer(map.graphicsLayerIds[i]).clear();
        }
    }
}

//Clear buffer layer
function ClearBuffer() {
    var layer = map.getLayer(tempBufferLayer);
    if (layer) {
        layer.clear();
    }
}

//Refresh address container div
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}

//Display Standby text
function ShowLoadingMessage(loadingMessage) {
    dojo.byId('divLoadingIndicator').style.display = 'block';
    dojo.byId('loadingMessage').innerHTML = loadingMessage;
}

//Hide Standby text
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//Set text to span control
function ShowErrorMessage(control, message, color) {
    var ctl = dojo.byId(control);
    ctl.style.display = 'block';
    ctl.innerHTML = message;
    ctl.style.color = color;
}

//Get template formats from configuration file
function GetAveryTemplates() {
    var averyTypes = { identifier: 'id', items: [] };
    for (var i = 0; i < averyTemplates.length; i++) {
        averyTypes.items[i] = { id: averyTemplates[i].value, name: averyTemplates[i].name };
    }
    var store = new dojo.data.ItemFileReadStore({ data: averyTypes });

    var filteringSelect = new dijit.form.ComboBox({
        autocomplete: false,
        hasdownarrow: true,
        id: 'selectAvery',
        store: store,
        searchAttr: "name",
        style: "width: 130px;color: #FFF !important;background-color:#303030 !important",
        onChange: function () {
            ValidateAveryFormat();
        }
    }, dojo.byId("cmbAveryLabels"));
    dijit.byId("selectAvery").textbox.readOnly = true;
}

//Validate avery format
function ValidateAveryFormat(value) {
    if (!dijit.byId('selectAvery').item) {
        dijit.byId('selectAvery').setValue('');
    }
}

//Check if buffer range is valid
function IsBufferValid(dist) {
    var isValid = true;
    var length = parseFloat(dist);
    if ((length < 1) || (length > maxBufferDistance)) {
        isValid = false;
    }
    return isValid;
}

//Check for valid numeric strings
function IsNumeric(dist) {
    if (!/\D/.test(dist))
        return true;
    else if (/^\d+\.\d+$/.test(dist))
        return true;
    else
        return false;
}

//Submit Geo-Processing task
function ExecuteGPTask(pdf, csv, strAveryParam, strCsvParam) {
    ShowLoadingMessage('Download in progress');
    if (pdf) {
        var params = { "Label_Format": averyFormat, "Address_Items": strAveryParam };
        esri.config.defaults.io.alwaysUseProxy = true;
        gpTaskAvery.submitJob(params, CompleteGPJob, StatusCallback, ErrCallback);
        esri.config.defaults.io.alwaysUseProxy = false;
    }
    if (csv) {
        var csvParams = { "Address_Items": strCsvParam };
        esri.config.defaults.io.alwaysUseProxy = true;
        gpTaskCsv.submitJob(csvParams, CompleteCsvGPJob, StatusCallback);
        esri.config.defaults.io.alwaysUseProxy = false;
    }
}

//PDF generation callback completion event handler
function CompleteGPJob(jobInfo) {
    if (jobInfo.jobStatus != "esriJobFailed") {
        gpTaskAvery.getResultData(jobInfo.jobId, "Output_File", DownloadFile);
        if (window.location.toString().split("$displayInfo=").length > 1) {
            if (!shareinfo) {
                shareinfo = true;
                ShareInfoWindow();
            }
        }
        HideLoadingMessage();
    }
}

//Csv generation callback completion event handler
function CompleteCsvGPJob(jobInfo) {
    if (jobInfo.jobStatus != "esriJobFailed") {
        gpTaskCsv.getResultData(jobInfo.jobId, "Output_File", DownloadCSVFile);
        if (window.location.toString().split("$displayInfo=").length > 1) {
            if (!shareinfo) {
                shareinfo = true;
                ShareInfoWindow();
            }
        }
        HideLoadingMessage();
    }
}

//function to call when the error exists
function ErrCallback(err) {
    if (window.location.toString().split("$displayInfo=").length > 1) {
        if (!shareinfo) {
            shareinfo = true;
            ShareInfoWindow();
        }
    }
    HideLoadingMessage();
    alert(err.message);
}

//Pdf generation status callback event handler
function StatusCallback(jobInfo) {
    var status = jobInfo.jobStatus;
    if (status == "esriJobFailed") {
        HideLoadingMessage();
        alert(messages.getElementsByTagName("noDataAvailable")[0].childNodes[0].nodeValue);
    }
}

//Function to open generated Pdf in a new window
function DownloadFile(outputFile) {
    window.open(outputFile.value.url);
}


//Function to open generated CSV in a new window
function DownloadCSVFile(outputFile) {
    if (navigator.appVersion.indexOf("Mac") != -1) {
        window.open(outputFile.value.url);
    }
    else {
        window.location = outputFile.value.url;
    }
}

//Function to show data of find task in info-window
function ShowFindTaskData(feature, mapPoint) {
    displayInfo = feature.attributes[parcelInformation.AliasParcelField] + "$infoParcel";
    selectedPoint = mapPoint;
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container1";
    scrollbar_container.className = "scrollbar_container";
    scrollbar_container.style.height = (infoPopupHeight - 80) + "px";
    detailsTab.appendChild(scrollbar_container);

    var scrollContent = document.createElement('div');
    scrollContent.id = "scrollList1";
    scrollContent.style.display = "block";
    scrollContent.className = 'scrollbar_content';
    scrollContent.style.height = (infoPopupHeight - 80) + "px";
    scrollbar_container.appendChild(scrollContent);

    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tblTransparent";
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    for (var key = 0; key < infoPopupFieldsCollection.length; key++) {
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        td1.innerHTML = infoPopupFieldsCollection[key].DisplayText;
        td1.className = 'tdDisplayField';
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.className = 'tdValueField';
        td2.height = 20;
        if (infoPopupFieldsCollection[key].AliasField.split(',').length >= 1) {
            var notApplicableCounter = 0;
            for (i = 0; i < infoPopupFieldsCollection[key].AliasField.split(',').length; i++) {
                if (feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] == "Null" || !feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]])
                    notApplicableCounter++;
            }
            if (notApplicableCounter == infoPopupFieldsCollection[key].AliasField.split(',').length)
                td2.innerHTML += showNullAs;
            else {
                for (i = 0; i < infoPopupFieldsCollection[key].AliasField.split(',').length; i++) {
                    if ((feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] != "Null" && feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]]))
                        td2.innerHTML += feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] + " ";
                }
                td2.innerHTML = td2.innerHTML.slice(0, -1);
            }
        }
        else {
            if (feature.attributes[infoPopupFieldsCollection[key].AliasField] == "Null" || !feature.attributes[infoPopupFieldsCollection[key].AliasField])
                td2.innerHTML = showNullAs;
            else
                td2.innerHTML = feature.attributes[infoPopupFieldsCollection[key].AliasField];
        }
        tr.appendChild(td1);
        tr.appendChild(td2);
    }

    var div = document.createElement("div");
    div.style.width = "100%";
    div.style.marginTop = "10px";
    div.align = "right";

    var table1 = document.createElement("table");
    table1.cellSpacing = 0;
    table1.cellPadding = 0;
    div.appendChild(table1);
    var tbody1 = document.createElement("tbody");
    table1.appendChild(tbody1);
    var tr1 = document.createElement("tr");
    tbody1.appendChild(tr1);

    var td1 = document.createElement("td");
    tr1.appendChild(td1);

    var img = document.createElement("img");
    img.id = "imgAdjacentParcels";
    img.src = "images/addContact.png";
    img.style.height = "25px";
    img.style.width = "25px";
    img.style.cursor = "pointer";
    img.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }

        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);

        isSpanClicked = true;
    }
    td1.appendChild(img);

    var td2 = document.createElement("td");
    tr1.appendChild(td2);

    var span = document.createElement("span");
    span.id = "spanAdjacentParcels";
    span.style.display = "block";
    span.style.color = "White";
    span.style.textDecoration = "underline";
    span.style.cursor = "pointer";
    span.style.marginRight = "40px";
    span.style.fontSize = "11px";
    span.innerHTML = "Add adjacent parcel";

    span.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
        isSpanClicked = true;
    }
    td2.appendChild(span);

    scrollContent.appendChild(table);
    detailsTab.appendChild(div);
    setTimeout(function () {
        CreateScrollbar(scrollbar_container, scrollContent);
    }, 500);

    ResetInfoWindowContent(detailsTab);

    map.infoWindow.resize(infoPopupWidth, infoPopupHeight);
    var infoTitle = feature.attributes[infoWindowTitle];
    if (infoTitle != "Null") {
        if (infoTitle.length > 25) {
            var title = infoTitle.trimString(25);
            dojo.byId("tdInfoHeader").innerHTML = title;
        }
        else {
            dojo.byId("tdInfoHeader").innerHTML = infoTitle;
        }
        dojo.byId("tdInfoHeader").title = infoTitle;
    }
    else {
        dojo.byId("tdInfoHeader").title = showNullAs;
    }

    if (mapPoint) {
        map.setExtent(GetBrowserMapExtent(mapPoint));
        setTimeout(function () {
            var screenPoint = map.toScreen(mapPoint);
            screenPoint.y = map.height - screenPoint.y;
            map.infoWindow.setLocation(screenPoint);
            map.infoWindow.show(screenPoint);
        }, 500);
    }
}

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Function to trim the string
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
}

//Query adjacent polygons
function FetchAdjacentPolygons(geometry) {
    var roadQuery = new esri.tasks.Query();
    roadQuery.geometry = geometry;
    roadQuery.spatialRelationship = esri.tasks.Query.SPATIAL_REL_TOUCHES;
    roadQuery.returnGeometry = true;
    roadQuery.outFields = ["*"];
    //executing query task for selecting intersecting features
    esri.config.defaults.io.alwaysUseProxy = true;
    qTask.execute(roadQuery, ShowResults);
    esri.config.defaults.io.alwaysUseProxy = false;
}

//Display the overlap results in info-window
function ShowResults(result) {
    var features = result.features;
    DrawPolygon(features, false);
    HideLoadingMessage();
}


//function called to show details of feature while clicked on graphic layer
function ShowFeatureDetails(feature, mapPoint) {
    if (feature.attributes) {
        if (feature.attributes[parcelInformation.ParcelIdentification] || feature.attributes[locatorSettings.Locators[0].DisplayField.split(",")[0]]) {
            ShowUniqueParcel(feature, mapPoint);
        }
        else {
            CreateDataForOverlappedParcels(feature, mapPoint);
        }
    }
    else {
        CreateDataForOverlappedParcels(feature, mapPoint);
    }
    if (feature.attributes[parcelInformation.AliasParcelField]) {
        displayInfo = feature.attributes[parcelInformation.AliasParcelField] + "$infoParcel";
    }
    else if (feature.attributes[parcelInformation.ParcelIdentification]) {
        displayInfo = feature.attributes[parcelInformation.ParcelIdentification] + "$infoParcel";
    }
}

//Create data template for overlapped parcels
function CreateDataForOverlappedParcels(feature, mapPoint) {
    overlapCount = 0;
    var contentDiv = CreateContentForGraphics(feature);
    for (var parcel in feature.attributes) {
        var attr = feature.attributes[parcel];
        break;
    }
    displayInfo = attr[parcelInformation.ParcelIdentification] + "$infoParcel";
    ShowOverlappingParcels(feature, contentDiv, mapPoint, attr[parcelInformation.ParcelIdentification]); //third parameter is set to true if details are for graphic
}

//Triggered when highlighted features are clicked
function ShowUniqueParcel(feature, mapPoint) {
    if (mapPoint.ctrlKey) {
        if (dijit.byId('toolTipDialog')) {
            selectedPoint = null;
            displayInfo = null;
            map.infoWindow.hide();
            if (!map.getLayer(roadCenterLinesLayerID).graphics.length) {
                map.getLayer(queryGraphicLayer).remove(feature);
                for (var q = 0; q < parcelArray.length; q++) {
                    if (parcelArray[q] == feature.attributes[parcelInformation.ParcelIdentification]) {
                        parcelArray.splice(q, 1);
                        break;
                    }
                }
            }
        }

        if (!map.getLayer(queryGraphicLayer).graphics.length) {
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            ClearAll();
            interactiveParcel = false;
        }
    }
    else {
        var detailsTab = document.createElement("div");
        detailsTab.style.width = "100%";
        detailsTab.style.height = "100%";

        var scrollbar_container = document.createElement('div');
        scrollbar_container.id = "scrollbar_container1";
        scrollbar_container.className = "scrollbar_container";
        scrollbar_container.style.height = (infoPopupHeight - 80) + "px";
        detailsTab.appendChild(scrollbar_container);

        var scrollContent = document.createElement('div');
        scrollContent.id = "scrollList1";
        scrollContent.style.display = "block";
        scrollContent.className = 'scrollbar_content';
        scrollContent.style.height = (infoPopupHeight - 80) + "px";
        scrollbar_container.appendChild(scrollContent);

        var table = document.createElement("table");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.className = "tblTransparent";
        table.id = "tblParcels";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        for (var key = 0; key < infoPopupFieldsCollection.length; key++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);

            var td1 = document.createElement("td");
            td1.innerHTML = infoPopupFieldsCollection[key].DisplayText;
            td1.className = 'tdDisplayField';
            td1.height = 20;
            var td2 = document.createElement("td");
            td2.className = 'tdValueField';
            td2.height = 20;
            if (feature.attributes[parcelInformation.ParcelIdentification]) {
                if (infoPopupFieldsCollection[key].FieldName.split(',').length > 1) {
                    var notApplicableCounter = 0;
                    for (i = 0; i < infoPopupFieldsCollection[key].FieldName.split(',').length; i++) {
                        if (!feature.attributes[infoPopupFieldsCollection[key].FieldName.split(',')[i]])
                            notApplicableCounter++;
                    }
                    if (notApplicableCounter == infoPopupFieldsCollection[key].FieldName.split(',').length)
                        td2.innerHTML += showNullAs;
                    else {
                        for (i = 0; i < infoPopupFieldsCollection[key].FieldName.split(',').length; i++) {
                            if (feature.attributes[infoPopupFieldsCollection[key].FieldName.split(',')[i]])
                                td2.innerHTML += feature.attributes[infoPopupFieldsCollection[key].FieldName.split(',')[i]] + " ";
                        }
                        td2.innerHTML = td2.innerHTML.slice(0, -1);
                    }
                }
                else {
                    if (feature.attributes[infoPopupFieldsCollection[key].FieldName]) {
                        if (!feature.attributes[infoPopupFieldsCollection[key].FieldName]) {
                            td2.innerHTML = showNullAs;
                        } else {
                            td2.innerHTML = feature.attributes[infoPopupFieldsCollection[key].FieldName];
                        }
                    }
                    else
                        if (feature.attributes[infoPopupFieldsCollection[key].FieldName]) {
                            td2.innerHTML = feature.attributes[infoPopupFieldsCollection[key].FieldName];
                        } else {
                            td2.innerHTML = showNullAs;
                        }
                }
            } else {
                if (infoPopupFieldsCollection[key].AliasField.split(',').length >= 1) {
                    var notApplicableCounter = 0;
                    for (i = 0; i < infoPopupFieldsCollection[key].AliasField.split(',').length; i++) {
                        if (feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] == "Null" || !feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]])
                            notApplicableCounter++;
                    }
                    if (notApplicableCounter == infoPopupFieldsCollection[key].AliasField.split(',').length)
                        td2.innerHTML += showNullAs;
                    else {
                        for (i = 0; i < infoPopupFieldsCollection[key].AliasField.split(',').length; i++) {
                            if ((feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] != "Null" && feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]]))
                                td2.innerHTML += feature.attributes[infoPopupFieldsCollection[key].AliasField.split(',')[i]] + " ";
                        }
                        td2.innerHTML = td2.innerHTML.slice(0, -1);
                    }
                }
                else {
                    if (feature.attributes[infoPopupFieldsCollection[key].AliasField] == "Null" || !feature.attributes[infoPopupFieldsCollection[key].AliasField])
                        td2.innerHTML = showNullAs;
                    else
                        td2.innerHTML = feature.attributes[infoPopupFieldsCollection[key].AliasField];
                }
            }
            tr.appendChild(td1);
            tr.appendChild(td2);
        }
        if (!map.getLayer(roadCenterLinesLayerID).graphics.length) {
            var div = document.createElement("div");
            div.style.width = "100%";
            div.style.marginTop = "10px";
            div.align = "right";

            var table1 = document.createElement("table");
            table1.cellSpacing = 0;
            table1.cellPadding = 0;

            div.appendChild(table1);
            var tbody1 = document.createElement("tbody");
            table1.appendChild(tbody1);
            var tr1 = document.createElement("tr");
            tbody1.appendChild(tr1);

            var td1 = document.createElement("td");
            tr1.appendChild(td1);

            var img = document.createElement("img");
            img.id = "imgAdjacentParcels";
            img.src = "images/addContact.png";
            img.style.height = "25px";
            img.style.width = "25px";
            img.style.cursor = "pointer";
            img.onclick = function (mapPoint) {
                polygon = true;
                interactiveParcel = true;
                selectedPoint = null;
                displayInfo = null;
                map.infoWindow.hide();
                if (isSpanClicked == true) {
                    return;
                }
                mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
                isSpanClicked = true;
            }
            td1.appendChild(img);

            var td2 = document.createElement("td");
            tr1.appendChild(td2);

            var span = document.createElement("span");
            span.style.color = "White";
            span.id = "spanAdjacentParcels";
            span.style.textDecoration = "underline";
            span.style.cursor = "pointer";
            span.style.marginRight = "40px";
            span.style.fontSize = "11px";
            span.innerHTML = "Add adjacent parcel";
            span.onclick = function (mapPoint) {
                polygon = true;
                interactiveParcel = true;
                selectedPoint = null;
                displayInfo = null;
                map.infoWindow.hide();
                if (isSpanClicked == true) {
                    return;
                }
                mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
                isSpanClicked = true;
            }
            td2.appendChild(span);
            detailsTab.appendChild(div);
        }
        scrollContent.appendChild(table);
        setTimeout(function () {
            CreateScrollbar(scrollbar_container, scrollContent);
        }, 500);

        ResetInfoWindowContent(detailsTab);

        map.infoWindow.resize(infoPopupWidth, infoPopupHeight);
        if (feature.attributes[parcelInformation.SiteAddress]) {
            if (feature.attributes[parcelInformation.SiteAddress].length > 25) {
                var title = feature.attributes[parcelInformation.SiteAddress];
                dojo.byId("tdInfoHeader").innerHTML = title.substring(0, 10);
            }
            else {
                dojo.byId("tdInfoHeader").innerHTML = feature.attributes[parcelInformation.SiteAddress];

                if (mapPoint) {
                    if (mapPoint.mapPoint) {
                        selectedPoint = mapPoint.mapPoint;
                        map.setExtent(GetBrowserMapExtent(mapPoint.mapPoint));
                    }
                    else {
                        selectedPoint = mapPoint;

                        var extent = GetQuerystring('extent');
                        if (extent != "") {
                            zoomExtent = extent.split(',');
                            var shareExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
                            map.setExtent(shareExtent);
                        }
                        else {
                            map.setExtent(GetBrowserMapExtent(mapPoint));
                        }


                    }
                    setTimeout(function () {
                        var screenPoint = map.toScreen(selectedPoint);
                        screenPoint.y = map.height - screenPoint.y;
                        map.infoWindow.setLocation(screenPoint);
                        map.infoWindow.show(screenPoint);
                    }, 500);
                }
                return;
            }
        }
        else {
            dojo.byId("tdInfoHeader").innerHTML = showNullAs;
        }

        if (feature.attributes[locatorSettings.Locators[0].DisplayField.split(",")[1]]) {
            if (feature.attributes[locatorSettings.Locators[0].DisplayField.split(",")[1]].length > 25) {
                var title = feature.attributes[locatorSettings.Locators[0].DisplayField.split(",")[1]];
                dojo.byId("tdInfoHeader").innerHTML = title.substring(0, 10);
            }
            else {
                dojo.byId("tdInfoHeader").innerHTML = feature.attributes[locatorSettings.Locators[0].DisplayField.split(",")[1]];
            }
        }
        else {
            dojo.byId("tdInfoHeader").innerHTML = showNullAs;
        }

        if (mapPoint) {
            if (mapPoint.mapPoint) {
                selectedPoint = mapPoint.mapPoint;
                map.setExtent(GetBrowserMapExtent(mapPoint.mapPoint));
            }
            else {
                selectedPoint = mapPoint;
                var extent = GetQuerystring('extent');
                if (extent != "") {
                    zoomExtent = extent.split(',');
                    var shareExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
                    map.setExtent(shareExtent);
                }
                else {
                    map.setExtent(GetBrowserMapExtent(mapPoint));
                }
            }

            setTimeout(function () {
                var screenPoint = map.toScreen(selectedPoint);
                screenPoint.y = map.height - screenPoint.y;
                map.infoWindow.setLocation(screenPoint);
                map.infoWindow.show(screenPoint);
            }, 500);
        }
    }
}

//Get the extent based on the map point for browser
function GetBrowserMapExtent(mapPoint) {
    var width = map.extent.getWidth();
    var height = map.extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 2.7);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Reast info-window content
function ResetInfoWindowContent(detailsTab) {
    RemoveChildren(dojo.byId("divInfoDetailsScroll"));
    dojo.byId("imgDetails").setAttribute("checked", "info");
    dojo.byId("imgDetails").src = "images/navigation.png";
    dojo.byId("imgDetails").title = "Notify";
    dojo.byId("divInfoDetails").style.display = "block";
    dojo.byId("divInfoNotify").style.display = "none";
    dojo.byId("divInfoDetailsScroll").appendChild(detailsTab);
}


//Display tooltip for road
function ShowMapTipForRoad(evt) {
    if (map.getLayer(roadCenterLinesLayerID).graphics.length) {
        if (isSpanClicked) {
            HideMapTip();
            var dialog = new dijit.TooltipDialog({
                id: "toolTipDialog",
                content: toolTipContents.Road,
                style: "position: absolute; z-index:1000;"
            });
            dialog.startup();
            dojo.style(dialog.domNode, "opacity", 0.80);
            dijit.placeOnScreen(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["TL", "TR"], { x: 5, y: 5 });
        }
    }
}

//Display tooltip for parcels
function ShowMapTipForParcels(evt) {
    if (map.getLayer(queryGraphicLayer).graphics.length) {
        if (isSpanClicked) {
            HideMapTip();

            var dialog = new dijit.TooltipDialog({
                id: "toolTipDialog",
                content: toolTipContents.Parcel,
                style: "position: absolute; z-index:1000;"
            });
            dialog.startup();
            dojo.style(dialog.domNode, "opacity", 0.80);
            dijit.placeOnScreen(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["TL", "TR"], { x: 5, y: 5 });
        }
    }
}

//Hide tooltip dialog
function HideMapTip() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//Sort comments according to date
function SortResultFeatures(a, b) {
    var x = a.attributes.SUBMITDT;
    var y = b.attributes.SUBMITDT;
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//Triggered when layer with multiple parcels is clicked
function ShowOverlappingParcels(feature, contentDiv, evt, parcelFeature) {
    if (evt.ctrlKey) {
        if (dijit.byId('toolTipDialog')) {
            selectedPoint = null;
            displayInfo = null;
            map.infoWindow.hide();
            for (var q = 0; q < parcelArray.length; q++) {
                if (parcelArray[q] == parcelFeature) {
                    parcelArray.splice(q, 1);
                    break;
                }
            }
            map.getLayer(queryGraphicLayer).remove(feature);
        }

        if (!map.getLayer(queryGraphicLayer).graphics.length) {
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            ClearAll();
            interactiveParcel = false;
        }
    }
    else {
        dojo.byId("tdInfoHeader").innerHTML = overlapCount + " Parcels found at this location";
        ResetInfoWindowContent(contentDiv);
        map.infoWindow.resize(infoPopupWidth, infoPopupHeight);

        if (evt.mapPoint) {
            selectedPoint = evt.mapPoint;
        }
        else {
            selectedPoint = evt;
        }

        var extent = GetQuerystring('extent');
        if (extent != "") {
            zoomExtent = extent.split(',');
            var shareExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
            map.setExtent(shareExtent);
        }
        else {
            map.setExtent(GetBrowserMapExtent(selectedPoint));
        }

        setTimeout(function () {
            var screenPoint = map.toScreen(selectedPoint);
            screenPoint.y = map.height - screenPoint.y;
            map.infoWindow.setLocation(screenPoint);
            map.infoWindow.show(screenPoint);

            var container = dojo.byId('scrollbar_container');
            var content = dojo.byId('divParcelList');
            CreateScrollbar(container, content);
        }, 500);
    }
    HideLoadingMessage();
}

function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;
    content.scrollTop = 0;
    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    }
    else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }
    var containerHeight = dojo.coords(container);
    scrollbar_track.style.right = 5 + 'px';
    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";
    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);
    if ((content.scrollHeight - content.offsetHeight) <= 5) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;
        yMax = yMax - 5; //for getting rounded bottom of handle
        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }
        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    //Attaching events to scrollbar components - Using mouse wheel
    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;

        if (delta <= -120) {
            var y = pxTop + 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));

        }
        else {
            var y = pxTop - 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 2 // Limit vertical movement
            scrollbar_handle.style.top = (y - 2) + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components - Click and Drag
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            }
            else
                offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax // Limit vertical movement
                if (y < 0) y = 0 // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else {
                return;
            }
        }
        isHandleClicked = false;
    };

    //Attaching events to scrollbar components - Releasing mouse click
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };

    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };

    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };

    var startPos;
    var scrollingTimer;

    dojo.connect(container, "touchstart", function (evt) {
        touchStartHandler(evt);
    });

    dojo.connect(container, "touchmove", function (evt) {
        touchMoveHandler(evt);
    });

    dojo.connect(container, "touchend", function (evt) {
        touchEndHandler(evt);
    });

    //Handlers for Touch Events
    function touchStartHandler(e) {
        startPos = e.touches[0].pageY;
    }

    function touchMoveHandler(e) {
        var touch = e.touches[0];
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        pxTop = scrollbar_handle.offsetTop;
        var y;
        if (startPos > touch.pageY) {
            y = pxTop + 10;
        }
        else {
            y = pxTop - 10;
        }

        //setting scrollbar handle
        if (y > yMax) y = yMax // Limit vertical movement
        if (y < 0) y = 0 // Limit vertical movement
        scrollbar_handle.style.top = y + "px";

        //setting content position
        content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));

        scrolling = true;
        startPos = touch.pageY;
    }

    function touchEndHandler(e) {
        scrollingTimer = setTimeout(function () { clearTimeout(scrollingTimer); scrolling = false; }, 100);
    }
    //stop touch event
}

//Create content for overlapping parcels
function CreateContentForGraphics(featureList) {
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container";
    scrollbar_container.style.height = (infoPopupHeight - 80) + "px";
    scrollbar_container.className = "scrollbar_container";

    var divParcelList = document.createElement('div');
    divParcelList.id = "divParcelList";
    divParcelList.style.height = (infoPopupHeight - 80) + "px";
    divParcelList.style.display = "block";
    divParcelList.className = 'scrollbar_content';

    var divDescription = document.createElement('div');
    divDescription.id = 'divDescription';
    divDescription.style.display = "none";
    divDescription.className = 'scrollbar_content';

    var divFooter = document.createElement('div');
    divFooter.id = 'divFooter';
    divFooter.style.display = 'none';
    divFooter.className = 'scrollbar_footer';

    var btnDiv = document.createElement("div");
    btnDiv.id = "btnParcelList";
    btnDiv.style.width = "75px";
    btnDiv.style.cursor = "pointer";
    btnDiv.className = "customButton";
    btnDiv.onclick = function () {
        ShowParcels();
    };
    divFooter.appendChild(btnDiv);

    var btnInnerDiv = document.createElement("div");
    btnInnerDiv.className = "customButtonInner";
    btnDiv.appendChild(btnInnerDiv);

    var btnTable = document.createElement("table");
    btnTable.style.width = "100%";
    btnTable.style.height = "100%";
    btnInnerDiv.appendChild(btnTable);

    var btnTbody = document.createElement("tbody");
    btnTable.appendChild(btnTbody);

    var btnTr = document.createElement("tr");
    btnTbody.appendChild(btnTr);

    var btnTd = document.createElement("td");
    btnTd.align = "center";
    btnTd.style.verticalAlign = "middle";
    btnTd.style.color = "white";
    btnTd.style.fontSize = "11px";
    btnTd.innerHTML = "Back";
    btnTr.appendChild(btnTd);


    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tblTransparent";
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    for (var parcelID in featureList.attributes) {
        overlapCount++;
        var attributes = featureList.attributes[parcelID];
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");

        var divParcelId = document.createElement("div");
        divParcelId.innerHTML = attributes[parcelInformation.ParcelIdentification];
        divParcelId.style.textDecoration = 'underline';
        divParcelId.onclick = function () {
            ShowParcelDetail(featureList.attributes[this.innerHTML]);
        }
        td1.appendChild(divParcelId);
        td1.className = 'tdParcel';
        td1.style.cursor = "pointer";
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.innerHTML = "&nbsp&nbsp" + attributes[parcelInformation.SiteAddress];
        td2.className = 'tdSiteAddress';
        td2.height = 20;

        tr.appendChild(td1);
        tr.appendChild(td2);
    }

    var div = document.createElement("div");
    div.style.width = "100%";
    div.align = "right";
    div.style.marginTop = "5px";

    var table1 = document.createElement("table");
    table1.cellSpacing = 0;
    table1.cellPadding = 0;
    div.appendChild(table1);
    var tbody1 = document.createElement("tbody");
    table1.appendChild(tbody1);
    var tr1 = document.createElement("tr");
    tbody1.appendChild(tr1);

    var td1 = document.createElement("td");
    tr1.appendChild(td1);


    var img = document.createElement("img");
    img.src = "images/addContact.png";
    img.id = "imgAdjacentParcels";
    img.style.height = "25px";
    img.style.width = "25px";
    img.style.cursor = "pointer";
    img.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
        isSpanClicked = true;
    }
    td1.appendChild(img);

    var td2 = document.createElement("td");
    tr1.appendChild(td2);

    var span = document.createElement("span");
    span.style.color = "White";
    span.id = "spanAdjacentParcels";
    span.style.textDecoration = "underline";
    span.style.cursor = "pointer";
    span.style.marginRight = "40px";
    span.style.fontSize = "11px";
    span.innerHTML = "Add adjacent parcel";

    span.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
        isSpanClicked = true;
    }
    td2.appendChild(span);

    divParcelList.appendChild(table);
    scrollbar_container.appendChild(divParcelList);
    scrollbar_container.appendChild(divDescription);
    scrollbar_container.appendChild(divFooter);

    detailsTab.appendChild(scrollbar_container);
    detailsTab.appendChild(div);

    return detailsTab;
}

//Create popup content for overlapping parcel
function CreateContent(featureList) {
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container";
    scrollbar_container.style.height = (infoPopupHeight - 80) + "px";
    scrollbar_container.className = "scrollbar_container";

    var divParcelList = document.createElement('div');
    divParcelList.id = "divParcelList";
    divParcelList.style.display = "block";
    divParcelList.style.height = (infoPopupHeight - 80) + "px";
    divParcelList.className = 'scrollbar_content';

    var divDescription = document.createElement('div');
    divDescription.id = 'divDescription';
    divDescription.style.display = "none";
    divDescription.className = 'scrollbar_content';

    var divFooter = document.createElement('div');
    divFooter.id = 'divFooter';
    divFooter.style.display = 'none';
    divFooter.className = 'scrollbar_footer';

    var btnDiv = document.createElement("div");
    btnDiv.id = "btnParcelList";
    btnDiv.style.width = "75px";
    btnDiv.style.cursor = "pointer";
    btnDiv.className = "customButton";
    btnDiv.onclick = function () {
        ShowParcels();
    };
    divFooter.appendChild(btnDiv);

    var btnInnerDiv = document.createElement("div");
    btnInnerDiv.className = "customButtonInner";
    btnDiv.appendChild(btnInnerDiv);

    var btnTable = document.createElement("table");
    btnTable.style.width = "100%";
    btnTable.style.height = "100%";
    btnInnerDiv.appendChild(btnTable);

    var btnTbody = document.createElement("tbody");
    btnTable.appendChild(btnTbody);

    var btnTr = document.createElement("tr");
    btnTbody.appendChild(btnTr);

    var btnTd = document.createElement("td");
    btnTd.align = "center";
    btnTd.style.verticalAlign = "middle";
    btnTd.style.color = "white";
    btnTd.style.fontSize = "11px";
    btnTd.innerHTML = "Back";
    btnTr.appendChild(btnTd);


    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tblTransparent";
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    for (var i = 0; i < featureList.length; i++) {
        overlapCount++;
        var attributes = featureList[i].attributes;
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");

        var divParcelId = document.createElement("div");
        divParcelId.innerHTML = attributes[parcelInformation.ParcelIdentification];
        divParcelId.style.textDecoration = 'underline';

        divParcelId.id = i;

        divParcelId.onclick = function () {
            ShowParcelDetail(featureList[this.id].attributes);
        }
        td1.appendChild(divParcelId);
        td1.className = 'tdParcel';
        td1.style.cursor = "pointer";
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.innerHTML = "&nbsp&nbsp" + attributes[parcelInformation.SiteAddress];
        td2.className = 'tdSiteAddress';
        td2.height = 20;

        tr.appendChild(td1);
        tr.appendChild(td2);
    }

    var div = document.createElement("div");
    div.style.width = "100%";
    div.align = "right";
    div.style.marginTop = "5px";

    var table1 = document.createElement("table");
    table1.cellSpacing = 0;
    table1.cellPadding = 0;
    div.appendChild(table1);
    var tbody1 = document.createElement("tbody");
    table1.appendChild(tbody1);
    var tr1 = document.createElement("tr");
    tbody1.appendChild(tr1);

    var td1 = document.createElement("td");
    tr1.appendChild(td1);

    var img = document.createElement("img");
    img.src = "images/addContact.png";
    img.id = "imgAdjacentParcels";
    img.style.height = "25px";
    img.style.width = "25px";
    img.style.cursor = "pointer";
    img.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
        isSpanClicked = true;
    }
    td1.appendChild(img);

    var td2 = document.createElement("td");
    tr1.appendChild(td2);

    var span = document.createElement("span");
    span.style.color = "White";
    span.id = "spanAdjacentParcels";
    span.style.textDecoration = "underline";
    span.style.cursor = "pointer";
    span.style.marginRight = "40px";
    span.style.fontSize = "11px";
    span.innerHTML = "Add adjacent parcel";

    span.onclick = function (mapPoint) {
        polygon = true;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForParcels);
        isSpanClicked = true;
    }
    td2.appendChild(span);
    divParcelList.appendChild(table);

    scrollbar_container.appendChild(divParcelList);
    scrollbar_container.appendChild(divDescription);
    scrollbar_container.appendChild(divFooter);

    detailsTab.appendChild(scrollbar_container);
    detailsTab.appendChild(div);
    return detailsTab;
}

//Display the particular road details in infowindow
function ShowRoadDetails(attributes, mapPoint) {
    displayInfo = attributes[map.getLayer(roadCenterLinesLayerID).objectIdField] + "$infoRoad";
    for (var i in attributes) {
        if (!isNaN(attributes[i])) {
            if (attributes[i] == null) {
                attributes[i] = showNullAs;
            }
        }
        else {
            if (!attributes[i]) {
                attributes[i] = showNullAs;
            }
        }
    }
    selectedPoint = mapPoint;
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container1";
    scrollbar_container.className = "scrollbar_container";
    scrollbar_container.style.height = (infoPopupHeight - 80) + "px";
    detailsTab.appendChild(scrollbar_container);

    var scrollContent = document.createElement('div');
    scrollContent.id = "scrollList1";
    scrollContent.style.display = "block";
    scrollContent.className = 'scrollbar_content';
    scrollContent.style.height = (infoPopupHeight - 80) + "px";
    scrollbar_container.appendChild(scrollContent);

    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tblTransparent";
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    for (var key = 0; key < infoRoadCollectionFields.length; key++) {
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        td1.innerHTML = infoRoadCollectionFields[key].DisplayText;
        td1.className = 'tdDisplayField';
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.className = 'tdValueField';
        td2.height = 20;
        td2.innerHTML = dojo.string.substitute(infoRoadCollectionFields[key].FieldName, attributes);

        tr.appendChild(td1);
        tr.appendChild(td2);
    }

    var div = document.createElement("div");
    div.style.width = "100%";
    div.style.marginTop = "10px";
    div.align = "right";
    div.id = "div";

    var table1 = document.createElement("table");
    table1.cellSpacing = 0;
    table1.cellPadding = 0;
    div.appendChild(table1);
    var tbody1 = document.createElement("tbody");
    table1.appendChild(tbody1);
    var tr1 = document.createElement("tr");
    tbody1.appendChild(tr1);

    var td1 = document.createElement("td");
    tr1.appendChild(td1);


    var img = document.createElement("img");
    img.src = "images/addContact.png";
    img.id = "imgAdjacentParcels";
    img.style.height = "25px";
    img.style.width = "25px";
    img.style.cursor = "pointer";
    img.onclick = function (mapPoint) {
        polygon = false;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }

        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForRoad);

        isSpanClicked = true;
    }
    td1.appendChild(img);

    var td2 = document.createElement("td");
    tr1.appendChild(td2);

    var span = document.createElement("span");
    span.id = "spanAdjacentParcels";
    span.style.display = "block";
    span.style.color = "White";
    span.style.textDecoration = "underline";
    span.style.cursor = "pointer";
    span.style.marginRight = "40px";
    span.style.fontSize = "11px";
    span.innerHTML = "Add adjacent road";

    span.onclick = function (mapPoint) {
        polygon = false;
        interactiveParcel = true;
        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        if (isSpanClicked == true) {
            return;
        }
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForRoad);
        isSpanClicked = true;
    }
    td2.appendChild(span);
    scrollContent.appendChild(table);
    detailsTab.appendChild(div);
    setTimeout(function () {
        CreateScrollbar(scrollbar_container, scrollContent);
    }, 500);

    dojo.byId("tdInfoHeader").innerHTML = attributes[locatorSettings.Locators[1].DisplayField];
    ResetInfoWindowContent(detailsTab);

    map.infoWindow.resize(infoPopupWidth, infoPopupHeight);

    if (mapPoint) {
        map.setExtent(GetBrowserMapExtent(mapPoint));

        setTimeout(function () {
            var screenPoint = map.toScreen(mapPoint);
            screenPoint.y = map.height - screenPoint.y;
            map.infoWindow.setLocation(screenPoint);
            map.infoWindow.show(screenPoint);
        }, 500);
    }
}


// Query, select, and show roads matching txtAddress contents
function FindAndShowRoads() {
    var query = new esri.tasks.Query();
    query.where = "UPPER(" + locatorSettings.Locators[1].DisplayField + ") LIKE '" + dojo.byId("txtAddress").value.trim().toUpperCase() + "%'";
    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, ShowSelectedRoads);
    polygon = true;
}

// Show selected roads
function ShowSelectedRoads() {
    polyLine = new esri.geometry.Polyline(map.spatialReference);
    var numSegments = map.getLayer(roadCenterLinesLayerID).graphics.length;
    if (0 < numSegments) {
        for (var j = 0; j < numSegments; j++) {
            if (map.getLayer(roadCenterLinesLayerID).graphics[j]) {
                polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
            }
            roadArray.push(map.getLayer(roadCenterLinesLayerID).graphics[j].attributes[map.getLayer(roadCenterLinesLayerID).objectIdField]);
        }
        map.setExtent(polyLine.getExtent().expand(2));
        setTimeout(function () {
            var point = polyLine.getPoint(0, 0);
            ShowRoadDetails(map.getLayer(roadCenterLinesLayerID).graphics[0].attributes, point)
        }, 1000);
    }
}

//Hide/delete road(s) segments
function HideRoad(roadname) {
    ShowLoadingMessage('Deselecting Adjacent Road');
    HideMapTip();
    var query = new esri.tasks.Query();
    query.maxAllowableOffset = maxAllowableOffset;
    query.where = "UPPER(" + locatorSettings.Locators[1].DisplayField + ") LIKE '" + roadname.graphic.attributes[locatorSettings.Locators[1].DisplayField].toUpperCase() + "%'";
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    query.returnGeometry = true;
    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_SUBTRACT, function (featureset) {
        for (var p = 0; p < featureset.length; p++) {
            for (var q = 0; q < roadArray.length; q++) {
                if (roadArray[q] == featureset[p].attributes[map.getLayer(roadCenterLinesLayerID).objectIdField]) {
                    roadArray.splice(q, 1);
                    break;
                }
            }
        }

        selectedPoint = null;
        displayInfo = null;
        map.infoWindow.hide();
        var count = 0;
        for (var t = 0; t < map.getLayer(roadCenterLinesLayerID).graphics.length; t++) {
            if (map.getLayer(roadCenterLinesLayerID).graphics[t].visible) {
                count++;
            }
        }
        if (!count) {
            isSpanClicked = false;
            HideMapTip();
            dojo.disconnect(mouseMoveHandle);
            ClearAll();
            polygon = true;
            interactiveParcel = false;
        }
        HideLoadingMessage();
        mouseMoveHandle = dojo.connect(map, "onMouseMove", ShowMapTipForRoad);
    });
}


//Show details of selected parcel.
function ShowParcelDetail(attr) {
    dojo.byId('spanAdjacentParcels').style.display = "none";
    dojo.byId('imgAdjacentParcels').style.display = "none";

    var scrollbar_container = dojo.byId('scrollbar_container');
    var divParcelList = dojo.byId('divParcelList');
    divParcelList.style.display = 'none';
    var divDescription = dojo.byId('divDescription');
    divDescription.style.display = 'block';
    var divFooter = dojo.byId('divFooter');
    divFooter.style.display = 'block';
    RemoveChildren(divDescription);

    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tblTransparent";
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    for (var key = 0; key < infoPopupFieldsCollection.length; key++) {
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        td1.innerHTML = infoPopupFieldsCollection[key].DisplayText;
        td1.className = 'tdDisplayField';
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.className = 'tdValueField';
        td2.height = 20;
        if (infoPopupFieldsCollection[key].FieldName.split(',').length > 1) {
            var notApplicableCounter = 0;
            for (i = 0; i < infoPopupFieldsCollection[key].FieldName.split(',').length; i++) {
                if (!attr[infoPopupFieldsCollection[key].FieldName.split(',')[i]])
                    notApplicableCounter++;
            }
            if (notApplicableCounter == infoPopupFieldsCollection[key].FieldName.split(',').length)
                td2.innerHTML += showNullAs;
            else {
                for (i = 0; i < infoPopupFieldsCollection[key].FieldName.split(',').length; i++) {

                    if (attr[infoPopupFieldsCollection[key].FieldName.split(',')[i]])
                        td2.innerHTML += attr[infoPopupFieldsCollection[key].FieldName.split(',')[i]] + " ";
                }
                td2.innerHTML = td2.innerHTML.slice(0, -1);
            }
        }
        else {
            if (attr[infoPopupFieldsCollection[key].FieldName] == null)
                td2.innerHTML = showNullAs;
            else
                td2.innerHTML = attr[infoPopupFieldsCollection[key].FieldName];
        }
        tr.appendChild(td1);
        tr.appendChild(td2);
    }
    divDescription.appendChild(table);
    this.content = divDescription;
    CreateScrollbar(scrollbar_container, content);

    if (attr[parcelInformation.SiteAddress]) {
        if (attr[parcelInformation.SiteAddress].length > 25) {
            var title = attr[parcelInformation.SiteAddress];
            dojo.byId("tdInfoHeader").innerHTML = title.substring(0, 10);
        }
        else {
            dojo.byId("tdInfoHeader").innerHTML = attr[parcelInformation.SiteAddress];
        }
        dojo.byId("tdInfoHeader").title = title;
    }
    else {
        dojo.byId("tdInfoHeader").innerHTML = showNullAs;
    }

}

//Display back to parcel list
function ShowParcels() {
    var scrollbar_container = dojo.byId('scrollbar_container');
    var divParcelList = dojo.byId('divParcelList');
    divParcelList.style.display = 'block';
    dojo.byId('spanAdjacentParcels').style.display = "block";
    dojo.byId('imgAdjacentParcels').style.display = "block";
    var divDescription = dojo.byId('divDescription');
    divDescription.style.display = 'none';
    var divFooter = dojo.byId('divFooter');
    divFooter.style.display = 'none';
    dojo.byId("tdInfoHeader").innerHTML = overlapCount + " Parcels found at this location";

    this.content = divParcelList;
    CreateScrollbar(scrollbar_container, content);
}

//Hide tooltip dialog
function CloseTooltipDialog() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//Display print window
function ShowModal(map) {
    ShowLoadingMessage("Loading print window");
    HideAddressContainer();

    window.showModalDialog("printMap.htm", window);
    HideLoadingMessage();
}

//Get current map extent
function GetPrintExtent() {
    return map.extent;
}

//Get current active URL for print functionality
function GetLayerUrl() {
    var layers = [];
    for (var j = 0; j < map.layerIds.length; j++) {
        var layer = map.getLayer(map.layerIds[j]);
        layers.push(layer);
    }
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].visible) {
            return layers[i].url;
        }
    }
}

//Get current instance of graphic layer(selected parcel) for print functionality
function GetParcelLayer() {
    var parcelLayer = map.getLayer(queryGraphicLayer);
    return parcelLayer;
}

//Get current instance of buffer layer(buffer region) for print functionality
function GetBufferLayer() {
    var bufferlayer = map.getLayer(tempBufferLayer);
    return bufferlayer;
}

//Get current instance of graphic layer(push pin) for print functionality
function GetGraphicLayer() {
    var graLayer = map.getLayer(tempGraphicLayer);
    return graLayer;
}

//Hide splash screen container
function HideSplashScreenMessage() {
    if (dojo.isIE < 9) {
        dojo.byId("divSplashScreenContent").style.display = "none";
    }
    dojo.addClass('divSplashScreenContainer', "opacityHideAnimation");
    dojo.replaceClass("divSplashScreenContent", "hideContainer", "showContainer");
}

//Show address container with wipe-in animation
function ShowLocateContainer() {
    HideShareAppContainer();
    HideBaseMapLayerContainer();
    if (dojo.coords("divAddressHolder").h > 0) {
        HideAddressContainer();
        dojo.byId('txtAddress').blur();
    }
    else {
        if (dojo.byId("txtAddress").getAttribute("defaultAddress") == dojo.byId("txtAddress").getAttribute("defaultAddressTitle")) {
            dojo.byId("txtAddress").style.color = "gray";
        }
        else {
            dojo.byId("txtAddress").style.color = "white";
        }
        RemoveChildren(dojo.byId('tblAddressResults'));
        RemoveScrollBar(dojo.byId("divAddressScrollContainer"));

        dojo.byId('divAddressHolder').style.height = "300px";
        dojo.replaceClass("divAddressHolder", "showContainerHeight", "hideContainerHeight");
    }
    RemoveChildren(dojo.byId('tblAddressResults'));
    SetAddressResultsHeight();
}

//Set height for address results and create scrollbar
function SetAddressResultsHeight() {
    if (dojo.coords(dojo.byId('divAddressHolder')).h > 0) {
        dojo.byId('divAddressScrollContent').style.height = (dojo.coords(dojo.byId('divAddressHolder')).h - 165) + "px";
    }
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
}

//Hide address container with wipe-out animation
function HideAddressContainer() {
    dojo.byId("imgSearchLoader").style.display = "none";
    dojo.byId("txtAddress").blur();
    dojo.replaceClass("divAddressHolder", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divAddressHolder').style.height = '0px';
}

//Display address container upon selecting 'Address' tab in search panel
function SearchByAddress() {
    if (dojo.byId("imgSearchLoader").style.display == "block") {
        return;
    }
    if (dojo.byId("txtAddress").getAttribute("defaultAddress") == dojo.byId("txtAddress").getAttribute("defaultAddressTitle")) {
        dojo.byId("txtAddress").style.color = "gray";
    }
    else {
        dojo.byId("txtAddress").style.color = "white";
    }
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultAddress");

    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultAddress");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("tdSearchAddress").className = "tdSearchByAddress";
    dojo.byId("tdSearchCase").className = "tdSearchByUnSelectedCase";
}

//Display case name container upon selecting 'Case Name' tab in search panel
function SearchByCase() {
    if (dojo.byId("imgSearchLoader").style.display == "block") {
        return;
    }

    if (dojo.byId("txtAddress").getAttribute("defaultCase") == dojo.byId("txtAddress").getAttribute("defaultCaseTitle")) {
        dojo.byId("txtAddress").style.color = "gray";
    }
    else {
        dojo.byId("txtAddress").style.color = "white";
    }

    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultCase");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("tdSearchAddress").className = "tdSearchByUnSelectedAddress";
    dojo.byId("tdSearchCase").className = "tdSearchByCase";
}

//Remove scroll bar
function RemoveScrollBar(container) {
    if (dojo.byId(container.id + 'scrollbar_track')) {
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
}

//Create the tiny url with current extent and selected feature
function ShareLink(ext) {
    tinyUrl = null;
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(window.location.toString());
    var urlStr;

    if ((parcelArray.length > 0) && (roadArray.length <= 0)) {
        if (map.getLayer(tempBufferLayer).graphics.length > 0) {
            urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$dist=" + dojo.byId('txtBuffer').value + "$PDF=" + ((dijit.byId('chkPdf').checked) ? "checked" : false)
            + "$CSV=" + ((dijit.byId('chkCsv').checked) ? "checked" : false) + "$occupant=" + ((dijit.byId('chkOccupants').checked) ? "checked" : false)
             + "$owner=" + ((dijit.byId('chkOwners').checked) ? "checked" : false)
            + "$averyFormat=" + dijit.byId('selectAvery').item.id[0] + "$parcelID=" + parcelArray.join(",");
        }
        else {
            urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$parcelID=" + parcelArray.join(",");
        }
    }
    else if (roadArray.length > 0) {
        if (!(dojo.byId('txtBuffer').value)) {
            dojo.byId('txtBuffer').value = defaultBufferDistance
        }
        if (!(dijit.byId('selectAvery').item)) {
            dijit.byId('selectAvery').store.fetch({ query: { name: "5160" }, onComplete: function (items) {
                dijit.byId('selectAvery').setDisplayedValue(items[0].name[0]);
                dijit.byId('selectAvery').item = items[0];
            }
            });
            dijit.byId('chkOwners').checked = true;
            dijit.byId('chkPdf').checked = true;
        }
        urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$dist=" + dojo.byId('txtBuffer').value + "$PDF=" + ((dijit.byId('chkPdf').checked) ? "checked" : false)
            + "$CSV=" + ((dijit.byId('chkCsv').checked) ? "checked" : false) + "$occupant=" + ((dijit.byId('chkOccupants').checked) ? "checked" : false)
             + "$owner=" + ((dijit.byId('chkOwners').checked) ? "checked" : false)
            + "$averyFormat=" + dijit.byId('selectAvery').item.id[0] + "$roadID=" + roadArray.join(",");

    }
    else {
        urlStr = encodeURI(url.path) + "?extent=" + mapExtent;
    }
    if (displayInfo) {
        urlStr = urlStr + "$displayInfo=" + displayInfo + "$point=" + selectedPoint.x + "," + selectedPoint.y;
    }
    url = dojo.string.substitute(mapSharingOptions.TinyURLServiceURL, [urlStr]);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (data) {
            tinyResponse = data;
            tinyUrl = data;
            var attr = mapSharingOptions.TinyURLResponseAttribute.split(".");
            for (var x = 0; x < attr.length; x++) {
                tinyUrl = tinyUrl[attr[x]];
            }
            if (ext) {
                if (dojo.coords("divAppContainer").h > 0) {
                    HideShareAppContainer();
                }
                else {
                    HideAddressContainer();
                    HideBaseMapLayerContainer();
                    dojo.byId('divAppContainer').style.height = 60 + "px";
                    dojo.replaceClass("divAppContainer", "showContainerHeight", "hideContainerHeight");
                }
            }
        },
        error: function (error) {
            alert(tinyResponse.error);
        }
    });
    setTimeout(function () {
        if (!tinyResponse) {
            alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
            return;
        }
    }, 6000);
}

//Open login page for facebook,tweet and open Email client with shared link for Email
function Share(site) {
    if (dojo.coords("divAppContainer").h > 0) {
        dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAppContainer').style.height = '0px';
    }
    if (tinyUrl) {
        switch (site) {
            case "facebook":
                window.open(dojo.string.substitute(mapSharingOptions.FacebookShareURL, [tinyUrl]));
                break;
            case "twitter":
                window.open(dojo.string.substitute(mapSharingOptions.TwitterShareURL, [tinyUrl]));
                break;
            case "mail":
                parent.location = dojo.string.substitute(mapSharingOptions.ShareByMailLink, [tinyUrl]);
                break;
        }
    }
    else {
        alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
        return;
    }
}

//Hide share link container
function HideShareAppContainer() {
    dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divAppContainer').style.height = '0px';
}

//Get current map Extent
function GetMapExtent() {
    var extents = Math.round(map.extent.xmin).toString() + "," + Math.round(map.extent.ymin).toString() + "," +
                  Math.round(map.extent.xmax).toString() + "," + Math.round(map.extent.ymax).toString();
    return (extents);
}

//Get query string value of the provided key, if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}

//Set height for splash screen
function SetSplashScreenHeight() {
    var height = dojo.coords(dojo.byId('divSplashScreenContent')).h - 80;
    dojo.byId('divSplashContent').style.height = (height + 14) + "px";
    CreateScrollbar(dojo.byId("divSplashContainer"), dojo.byId("divSplashContent"));
}

//Clear default value for text box controls
function ClearDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;
    target.style.color = "#FFF";
    target.value = '';
}

//Set default value on blur
function ReplaceDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;

    if (dojo.byId("tdSearchCase").className == "tdSearchByCase") {
        ResetTargetValue(target, "defaultCaseTitle", "gray");
    }
    else {
        ResetTargetValue(target, "defaultAddressTitle", "gray");
    }
}

//Set changed value for address/casename
function ResetTargetValue(target, title, color) {
    if (target.value == '' && target.getAttribute(title)) {
        target.value = target.title;
        if (target.title == "") {
            target.value = target.getAttribute(title);
        }
    }
    target.style.color = color;
}

//Reset map position
function SetMapTipPosition() {
    if (selectedPoint) {
        var screenPoint = map.toScreen(selectedPoint);
        screenPoint.y = map.height - screenPoint.y;
        map.infoWindow.setLocation(screenPoint);
    }
}

//Display details view in the info window
function ShowDetailsView() {
    if (dojo.byId("imgDetails").getAttribute("checked") == "info") {
        dojo.byId("imgDetails").setAttribute("checked", "notify");
        dojo.byId("imgDetails").src = "images/details.png";
        dojo.byId("imgDetails").title = "Details";
        dojo.byId("divInfoDetails").style.display = "none";
        dojo.byId("divInfoNotify").style.display = "block";
        dojo.byId('txtBuffer').value = defaultBufferDistance;
        dijit.byId('selectAvery').store.fetch({ query: { name: "5160" }, onComplete: function (items) {
            dijit.byId('selectAvery').setDisplayedValue(items[0].name[0]);
            dijit.byId('selectAvery').item = items[0];
        }
        });
        dijit.byId('chkOwners').setChecked(false);
        dijit.byId('chkOccupants').setChecked(false);
        dijit.byId('chkPdf').setChecked(false);
        dijit.byId('chkCsv').setChecked(false);
        dojo.byId('spanFileUploadMessage').style.display = 'none';
    }
    else {
        dojo.byId("imgDetails").setAttribute("checked", "info");
        dojo.byId("imgDetails").src = "images/navigation.png";
        dojo.byId("imgDetails").title = "Notify";
        dojo.byId("divInfoDetails").style.display = "block";
        dojo.byId("divInfoNotify").style.display = "none";
    }
}

//Hide info window
function HideInfoContainer() {
    displayInfo = null;
    selectedPoint = null;
    map.infoWindow.hide();

    isSpanClicked = false;
    HideMapTip();
    dojo.disconnect(mouseMoveHandle);

    interactiveParcel = false;
    polygon = true;
}

//Add parcels to map when app is shared
function AddShareParcelsToMap(fset, q) {
    if (fset.features[q]) {
        var feature = fset.features[q];
        var query = new esri.tasks.Query();
        query.where = parcelInformation.LowParcelIdentification + " = '" + feature.attributes[parcelInformation.LowParcelIdentification] + "'";
        query.returnGeometry = true;
        query.outFields = ["*"];
        qTask.execute(query, function (featureset) {
            if (featureset.features.length > 1) {
                DrawPolygon(featureset.features, true);
                q++;
                AddShareParcelsToMap(fset, q);
            }
            else {
                var layer = map.getLayer(queryGraphicLayer);
                var lineColor = new dojo.Color();
                lineColor.setColor(rendererColor);
                var fillColor = new dojo.Color();
                fillColor.setColor(rendererColor);
                fillColor.a = 0.25;
                var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
                feature.setSymbol(symbol);
                layer.add(feature);
                q++;
                AddShareParcelsToMap(fset, q);
            }
        });
    }
    else {
        polygon = true;
        geometryForBuffer = fset.features[q - 1].geometry;
        if (window.location.toString().split("$dist=").length > 1) {
            CreateBuffer();
        }
        else {
            if (window.location.toString().split("$displayInfo=").length > 1) {
                if (!shareinfo) {
                    shareinfo = true;
                    ShareInfoWindow();
                }
            }
            HideLoadingMessage();
        }
    }
}

//Share info-window with details
function ShareInfoWindow() {
    var point = new esri.geometry.Point(Number(window.location.toString().split("$point=")[1].split(",")[0]), Number(window.location.toString().split("$point=")[1].split(",")[1]), map.spatialReference);
    var query;
    if (window.location.toString().split("$displayInfo=")[1].split("$infoParcel").length > 1) {
        query = new esri.tasks.Query();
        query.where = parcelInformation.ParcelIdentification + " = '" + window.location.toString().split("$displayInfo=")[1].split("$infoParcel")[0] + "'";
        query.returnGeometry = true;
        query.outFields = ["*"];
        qTask.execute(query, function (featureset) {
            var overlapQuery = new esri.tasks.Query();
            overlapQuery.where = parcelInformation.LowParcelIdentification + " = '" + featureset.features[0].attributes[parcelInformation.LowParcelIdentification] + "'";
            overlapQuery.returnGeometry = true;
            overlapQuery.outFields = ["*"];
            qTask.execute(overlapQuery, function (featureSet) {
                if (featureSet.features.length > 1) {
                    overlapCount = 0;
                    var contentDiv = CreateContent(featureSet.features);
                    ShowOverlappingParcels(featureSet.features, contentDiv, point, featureSet.features[0].attributes[parcelInformation.ParcelIdentification]);
                }
                else {
                    ShowFeatureDetails(featureset.features[0], point);
                }
            });
        });
    } else {
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.objectIds = [window.location.toString().split("$displayInfo=")[1].split("$infoRoad")[0]];
        var roadTask = new esri.tasks.QueryTask(roadCenterLinesLayerURL);
        roadTask.execute(query, function (featureset) {
            ShowRoadDetails(featureset.features[0].attributes, point);
        });
    }
}

