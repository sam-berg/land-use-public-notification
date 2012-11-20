/** @license
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
var isSpanClicked = false; //flag setting for tooltip
var polyLine; // flag set to identify the graphic geometry

//Function for displaying Help window
function ShowHelp() {
    window.open(helpURL, "helpwindow");
    var helpbutton = dijit.byId('imgHelp');
    helpbutton.attr("checked", false);
}

//function for adding graphic to a layer.
function AddGraphic(layer, symbol, point, attr) {
    var graphic = new esri.Graphic(point, symbol, attr, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    layer.add(featureSet.features[0]);
}

//Function For Clearing All Graphics
function ClearAll(evt) {
    map.infoWindow.hide();
    map.graphics.clear()
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

//function for clearing buffer layer
function ClearBuffer() {
    var layer = map.getLayer(tempBufferLayer);
    if (layer) {
        layer.clear();
    }
}

//function to create a image object from img src
function CreateImage(imageSrc) {
    var imgLocate = document.createElement("img");
    imgLocate.style.width = '20px';
    imgLocate.style.height = '20px';
    imgLocate.style.cursor = 'pointer';
    imgLocate.src = imageSrc;
    imgLocate.title = 'Click to Locate';
    return imgLocate;
}

//Function triggered for animating address container
function AnimateAdvanceSearch(rowCount) {
    var node = dojo.byId('divAddressContainer');
    if (node.style.display == "none") {
        WipeInControl(node, 0, 500);
    }
}

function HideAddressContainer() {
    var node = dojo.byId('divAddressContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}

function CloseAddressContainer() {
    var node = dojo.byId('divAddressContainer');
    node.style.display = 'none';
}

//Dojo function to animate(wipe in) address container
function WipeInControl(node, height, duration) {
    var animation = dojo.fx.wipeIn({
        node: node,
        height: height,
        duration: duration
    }).play();
}

//Dojo function to animate(wipe out) address container
function WipeOutControl(node, duration) {
    dojo.fx.wipeOut({
        node: node,
        duration: duration
    }).play();
}

//Function for refreshing address container div
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}

//Function for displaying Standby text
function ShowLoadingMessage(loadingMessage) {
    dojo.byId('divLoadingIndicator').style.display = 'block';
    dojo.byId('loadingMessage').innerHTML = loadingMessage;
}

//Function for hiding Standby text
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//Function for toggling the search according to service request or address
function ToggleSearch(control) {
    HideAddressContainer();

    if (control.id == 'spanAddress') {
        SetSearchControlFields(dojo.byId('spanRoadSegment'), control, 'Enter an Address or Parcel ID to locate', dojo.byId("txtAddress").defaultText, 'rbAddress');

    }
    else {
        polygon = false;
        interactiveParcel = false;
        SetSearchControlFields(dojo.byId('spanAddress'), control, 'Enter a road or street name to locate', defaultRoadSegment, 'rbRoadSegment');
    }
}

//function to set search controls
function SetSearchControlFields(spandisabled, spanenabled, title, value, rbControl) {
    spandisabled.className = "disabledText";
    spanenabled.className = "text";
    dojo.byId("txtAddress").title = title;
    dojo.byId("txtAddress").value = value;
    dojo.byId(rbControl).checked = true;
    dojo.byId("txtAddress").select();
}

//function to teggle search from radio button click
function RadioButtonClicked(rbControl) {
    HideAddressContainer();

    if (rbControl.id == "rbAddress") {
        SetSearchControlFields(dojo.byId('spanRoadSegment'), dojo.byId('spanAddress'), 'Enter an Address or Parcel ID to locate', dojo.byId("txtAddress").defaultText, 'rbAddress');
    }
    else {
        SetSearchControlFields(dojo.byId('spanAddress'), dojo.byId('spanRoadSegment'), 'Enter a road or street name to locate', defaultRoadSegment, 'rbRoadSegment');
    }
}

//Function for positioning searchlist exactly below search textbox dynamically.
function PositionAddressList() {
    var coords = dojo.coords('txtAddress');
    var imgBaseMapCoords = dojo.coords('imgBaseMap');
    var screenCoords = dojo.coords('divMainContainer');
    var span = dojo.byId('divAddressContainer');
    //locating searchlist dynamically.
    dojo.style(span, {
        left: (coords.x - 1) + "px",
        top: parseInt(coords.h) + parseInt(coords.y) + 1.5 + "px"
    });

    //locating SwitchBaseMap dynamically.
    var spanBaseMap = dojo.byId('divBaseMapTitleContainer');
    dojo.style(spanBaseMap, {
        right: (parseFloat(screenCoords.w) - parseFloat(imgBaseMapCoords.x) - parseFloat(imgBaseMapCoords.w) - 55) + "px",
        top: parseInt(coords.h) + parseInt(coords.y) + 6 + "px"
    });
}

//function to set text to span control
function ShowErrorMessage(control, message, color) {
    var ctl = dojo.byId(control);
    ctl.style.display = 'block';
    ctl.innerHTML = message;
    ctl.style.color = color;
}

//function to blink text
function BlinkNode(control) {
    var fadeout = dojo.fadeOut({ node: control, duration: 100 });
    var fadein = dojo.fadeIn({ node: control, duration: 250 });
    dojo.fx.chain([fadeout, fadein, fadeout, fadein]).play();
}

//function for getting template formats from config.txt
function GetAveryTemplates() {
    var selectAvery = dijit.byId('selectAvery');
    var averyTypes = { identifier: 'id', items: [] };
    for (var i = 0; i < averyTemplates.length; i++) {
        averyTypes.items[i] = { id: averyTemplates[i].value, name: averyTemplates[i].name };
    }
    var store = new dojo.data.ItemFileReadStore({ data: averyTypes });
    selectAvery.store = store;
    selectAvery.searchAttr = 'name';
    dojo.byId("selectAvery").readOnly = "readonly";
}

//function for validating avery format
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

//function for validating the road distance
function IsRoadDistance(dist) {
    var isValid = true;
    var length = parseFloat(dist);
    if ((length < 1) || (length > defaultRoadBufferDistance)) {
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

//function to submit Geo-Processing task
function ExecuteGPTask(pdf, csv, strAveryParam, strCsvParam) {
    ShowLoadingMessage('Download in progress...');
    if (pdf) {
        var params = { "Enter_Label_Name": averyFormat, "Enter_Address_Items": strAveryParam };
        esri.config.defaults.io.alwaysUseProxy = true;
        gpTaskAvery.submitJob(params, CompleteGPJob, StatusCallback, ErrCallback);
        esri.config.defaults.io.alwaysUseProxy = false;
    }
    if (csv) {
        var csvParams = { "Enter_String": strCsvParam };
        esri.config.defaults.io.alwaysUseProxy = true;
        gpTaskCsv.submitJob(csvParams, CompleteCsvGPJob, StatusCallback);
        esri.config.defaults.io.alwaysUseProxy = false;
    }
}

//Pdf generation callback completion event handler
function CompleteGPJob(jobInfo) {
    if (jobInfo.jobStatus != "esriJobFailed") {
        gpTaskAvery.getResultData(jobInfo.jobId, "AveryLabels_pdf", DownloadFile);
        HideLoadingMessage();
    }
}

//Csv generation callback completion event handler
function CompleteCsvGPJob(jobInfo) {
    if (jobInfo.jobStatus != "esriJobFailed") {
        gpTaskCsv.getResultData(jobInfo.jobId, "Address_csv", DownloadCSVFile);
        HideLoadingMessage();
    }
}

//function for calling when the error exists
function ErrCallback(err) {
    HideLoadingMessage();
    ShowDialog("Error", err.message);
}

//Pdf generation status callback event handler
function StatusCallback(jobInfo) {
    var status = jobInfo.jobStatus;
    if (status == "esriJobFailed") {
        HideLoadingMessage();
        ShowDialog("Error", "Data not available for this particular location");
    }
}

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
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

//Function to show data of find task in infowindow
function ShowFindTaskData(feature, mapPoint) {
    var windowPoint = map.toScreen(mapPoint);

    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container1";
    scrollbar_container.className = "scrollbar_container";
    scrollbar_container.style.height = "175px";
    detailsTab.appendChild(scrollbar_container);

    var scrollContent = document.createElement('div');
    scrollContent.id = "scrollList1";
    scrollContent.style.display = "block";
    scrollContent.className = 'scrollbar_content';
    scrollContent.style.height = "175px";
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

    var mainTabContainer = CreateContentTabs(detailsTab);
    map.infoWindow.setContent(mainTabContainer.domNode);
    map.infoWindow.resize(350, 298);
    var infoTitle = feature.attributes[infoWindowTitle];
    if (infoTitle != "Null") {
        if (infoTitle.length > 25) {
            var title = infoTitle.trimString(25);
            map.infoWindow.setTitle("<span title='" + infoTitle + "' style='color:white; font-size:11px; font-family:Verdana;'> " + title + " </span>");
        }
        else {
            map.infoWindow.setTitle("<span title='" + infoTitle + "' style='color:white; font-size:11px; font-family:Verdana;'> " + infoTitle + " </span>");
        }
    }
    else {
        map.infoWindow.setTitle("<span style='color:white; font-size:11px; font-family:Verdana;'>" + showNullAs + "</span>");
    }
    var windowPoint_test = map.toScreen(mapPoint);
    map.infoWindow.show(mapPoint, GetInfoWindowAnchor(windowPoint_test, 350));
    mainTabContainer.resize();
}

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//function to query polygons
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

//fuction for displaying the results in infowindow
function ShowResults(result) {
    var features = result.features;
    DrawPolygon(features);
    HideLoadingMessage();
}

//function to create the tabs
function CreateContentTabs(divDetails) {
    var tabContainer = document.createElement('div');
    tabContainer.id = 'divTab';

    var tabPan = document.createElement('div');
    tabPan.id = 'divPan';

    var tabs = new dijit.layout.TabContainer({
        style: "width: 339px; height:270px; ",
        tabPosition: "bottom"
    }, dojo.byId('divTab'));

    var detailsTab = new dijit.layout.ContentPane({
        title: "<span style='font-size:11px;'><b>Details</b></span>",
        style: "overflow:hidden; width: 350px; height:270px; background-color:#474747;",
        content: divDetails
    }, dojo.byId('divPan'));

    tabs.addChild(detailsTab);

    var notifyTab = new dijit.layout.ContentPane({
        title: "<span style='font-size:11px;'><b>Notify</b></span>",
        style: "overflow:hidden;width: 350px; height:270px; background-color:#474747;",
        content: dojo.byId("divNotifyNeighborsContainer")
    }, dojo.byId('divPan'));
    tabs.addChild(notifyTab);
    dojo.connect(notifyTab, "onShow", function (child) {
        //Clearing Contents of Notify Components
        dojo.byId('txtBuffer').value = defaultBufferDistance;
        var combo = dijit.byId('selectAvery');
        combo.store.fetch({ query: { name: "5160" }, onComplete: function (items) {
            combo.setDisplayedValue(items[0].name[0]);
            combo.item = items[0];
        }
        });
        dijit.byId('chkOwners').setChecked("");
        dijit.byId('chkOccupants').setChecked("");
        dijit.byId('chkPdf').setChecked("");
        dijit.byId('chkCsv').setChecked("");
        dojo.byId('spanFileUploadMessage').style.display = 'none';
    });
    tabs.startup();
    return tabs;
}

//function called to show details of feature while clicked on graphic layer
function ShowFeatureDetails(feature, mapPoint) {
    if (feature.attributes.PARCELID || feature.attributes["Parcel Identification Number"]) {
        ShowUniqueParcel(feature, mapPoint);
    }
    else {
        overlapCount = 0;
        var contentDiv = CreateContentForGraphics(feature);
        ShowOverlappingParcels(feature, contentDiv, mapPoint); //third parameter is set to true if details are for graphic
    }
}

//Function triggered when highlighted features are clicked
function ShowUniqueParcel(feature, mapPoint) {
    if (mapPoint.ctrlKey) {
        if (dijit.byId('toolTipDialog')) {
            map.infoWindow.hide();
            if (!map.getLayer(roadCenterLinesLayerID).graphics.length) {
                map.getLayer(queryGraphicLayer).remove(feature);
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
        var windowPoint = mapPoint.screenPoint;
        var detailsTab = document.createElement("div");
        detailsTab.style.width = "100%";
        detailsTab.style.height = "100%";

        var scrollbar_container = document.createElement('div');
        scrollbar_container.id = "scrollbar_container1";
        scrollbar_container.className = "scrollbar_container";
        scrollbar_container.style.height = "175px";
        detailsTab.appendChild(scrollbar_container);

        var scrollContent = document.createElement('div');
        scrollContent.id = "scrollList1";
        scrollContent.style.display = "block";
        scrollContent.className = 'scrollbar_content';
        scrollContent.style.height = "175px";
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
            if (feature.attributes.PARCELID) {
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
        var mainTabContainer = CreateContentTabs(detailsTab);
        map.infoWindow.setContent(mainTabContainer.domNode);
        map.infoWindow.resize(350, 298);
        if (feature.attributes.SITEADDRESS) {
            if (feature.attributes.SITEADDRESS.length > 25) {
                var title = feature.attributes.SITEADDRESS;
                map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + title.substring(0, 10) + "... </span>");
            }
            else {
                map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + feature.attributes.SITEADDRESS + " </span>");
                map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(windowPoint));
                mainTabContainer.resize();
                return;
            }
        }
        else {
            map.infoWindow.setTitle("<span style='color:white; font-size:11px; font-family:Verdana;'>" + showNullAs + "</span>");
        }

        if (feature.attributes["Site Address"]) {
            if (feature.attributes["Site Address"].length > 25) {
                var title = feature.attributes["Site Address"];
                map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + title.substring(0, 10) + "... </span>");
            }
            else {
                map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + feature.attributes["Site Address"] + " </span>");
            }
        }
        else {
            map.infoWindow.setTitle("<span style='color:white; font-size:11px; font-family:Verdana;'>" + showNullAs + "</span>");
        }

        map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(windowPoint));
        mainTabContainer.resize();
    }
}


//function for dispalying tooltip for road
function ShowMapTipForRoad(evt) {
    if (map.getLayer(roadCenterLinesLayerID).graphics.length) {
        if (isSpanClicked) {
            HideMapTip();
            var dialog = new dijit.TooltipDialog({
                id: "toolTipDialog",
                content: 'Press Ctrl + Map click to select road<br>Click on a selected road when done',
                style: "position: absolute; z-index:1000;"
            });
            dialog.startup();
            dojo.style(dialog.domNode, "opacity", 0.80);
            dijit.placeOnScreen(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["TL", "TR"], { x: 5, y: 5 });
        }
    }
}

//function for dispalying tooltip for parcels
function ShowMapTipForParcels(evt) {
    if (map.getLayer(queryGraphicLayer).graphics.length) {
        if (isSpanClicked) {
            HideMapTip();

            var dialog = new dijit.TooltipDialog({
                id: "toolTipDialog",
                content: 'Press Ctrl + Map click to select parcel<br>Click on a selected parcel when done',
                style: "position: absolute; z-index:1000;"
            });
            dialog.startup();
            dojo.style(dialog.domNode, "opacity", 0.80);
            dijit.placeOnScreen(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["TL", "TR"], { x: 5, y: 5 });
        }
    }
}

//Function for hiding alert dialog
function HideMapTip() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//Function for sorting comments according to date
function SortResultFeatures(a, b) {
    var x = a.attributes.SUBMITDT;
    var y = b.attributes.SUBMITDT;
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//Function triggered when layer with multiple parcels is clicked
function ShowOverlappingParcels(feature, contentDiv, evt) {
    if (evt.ctrlKey) {
        if (dijit.byId('toolTipDialog')) {
            map.infoWindow.hide();
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
        var windowPoint = evt.screenPoint;
        map.infoWindow.setTitle("<span  style='color:white; font-size:11px; font-family:Verdana;'>" + overlapCount + " Parcels found at this location</span>");
        var mainTabContainer = CreateContentTabs(contentDiv);
        map.infoWindow.setContent(mainTabContainer.domNode);
        map.infoWindow.resize(350, 298);
        map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(windowPoint));
        mainTabContainer.resize();
        var container = dojo.byId('scrollbar_container');
        var content = dojo.byId('divParcelList');
        CreateScrollbar(container, content);
    }
    HideLoadingMessage();
}

//Creating dynamic scrollbar within container for target content
function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;

    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        if (dojo.byId(container.id + 'scrollbar_track')) {
            container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
        }
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
    if (container.id == 'address_container') {
        scrollbar_track.style.height = (containerHeight.h - 15) + "px";
        scrollbar_track.style.top = containerHeight.t + 'px';
        scrollbar_track.style.right = 1 + 'px';
    }
    else {
        scrollbar_track.style.height = (containerHeight.h - 20) + "px";
        scrollbar_track.style.top = containerHeight.t + 'px';
        scrollbar_track.style.right = 1 + 'px';
    }

    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";

    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);

    if (content.scrollHeight <= content.offsetHeight) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;

        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }

        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

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
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components
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

    //Attaching events to scrollbar components
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
            console.log("inside mousemove");
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
}

//Function for creating popup content for overlapping parcels
function CreateContentForGraphics(featureList) {
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container";
    scrollbar_container.className = "scrollbar_container";

    var divParcelList = document.createElement('div');
    divParcelList.id = "divParcelList";
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
        divParcelId.innerHTML = attributes.PARCELID;
        divParcelId.style.textDecoration = 'underline';
        divParcelId.onclick = function () {
            ShowParcelDetail(featureList.attributes[this.innerHTML]);
        }
        td1.appendChild(divParcelId);
        td1.className = 'tdParcel';
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.innerHTML = attributes.SITEADDRESS;
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

//Function for creating popup content for overlapping parcels
function CreateContent(featureList) {
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container";
    scrollbar_container.className = "scrollbar_container";

    var divParcelList = document.createElement('div');
    divParcelList.id = "divParcelList";
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
    for (var i = 0; i < featureList.length; i++) {
        overlapCount++;
        var attributes = featureList[i].attributes;
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");

        var divParcelId = document.createElement("div");
        divParcelId.innerHTML = attributes.PARCELID;
        divParcelId.style.textDecoration = 'underline';

        divParcelId.id = i;

        divParcelId.onclick = function () {
            ShowParcelDetail(featureList[this.id].attributes);
        }
        td1.appendChild(divParcelId);
        td1.className = 'tdParcel';
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.innerHTML = attributes.SITEADDRESS;
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

//function for displaying the particular road details in infowindow
function ShowRoadDetails(attributes, mapPoint) {

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
    var windowPoint = map.toScreen(mapPoint);
    var detailsTab = document.createElement("div");
    detailsTab.style.width = "100%";
    detailsTab.style.height = "100%";

    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "scrollbar_container1";
    scrollbar_container.className = "scrollbar_container";
    scrollbar_container.style.height = "175px";
    detailsTab.appendChild(scrollbar_container);

    var scrollContent = document.createElement('div');
    scrollContent.id = "scrollList1";
    scrollContent.style.display = "block";
    scrollContent.className = 'scrollbar_content';
    scrollContent.style.height = "175px";
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

    var mainTabContainer = CreateContentTabs(detailsTab);
    map.infoWindow.setContent(mainTabContainer.domNode);
    map.infoWindow.resize(350, 298);
    map.infoWindow.setTitle("<span style='color:white; font-size:11px; font-family:Verdana;'> " + attributes.FULLNAME + " </span>");
    map.infoWindow.show(mapPoint, map.getInfoWindowAnchor(windowPoint));
    mainTabContainer.resize();
}


// Query, select, and show roads matching txtAddress contents
function FindAndShowRoads() {
    defaultRoadSegment = dojo.byId("txtAddress").value;
    var query = new esri.tasks.Query();
    query.where = "UPPER(FULLNAME) LIKE '" + dojo.byId("txtAddress").value.trim().toUpperCase() + "%'";
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").value.trim();
    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, ShowSelectedRoads);
    polygon = true;
}

// Show selected roads
function ShowSelectedRoads() {
    polyLine = new esri.geometry.Polyline(map.spatialReference);
    var numSegments = map.getLayer(roadCenterLinesLayerID).graphics.length;
    if(0 < numSegments) {
        for (var j = 0; j < numSegments; j++) {
            polyLine.addPath(map.getLayer(roadCenterLinesLayerID).graphics[j].geometry.paths[0]);
        }
        map.setExtent(polyLine.getExtent().expand(1.9));
        var point = polyLine.getPoint(0, 0);
        ShowRoadDetails(map.getLayer(roadCenterLinesLayerID).graphics[0].attributes, point)
    }
}

function HideRoad(roadname) {
    ShowLoadingMessage('Deselecting Adjacent Road....');
    HideMapTip();
    var query = new esri.tasks.Query();
    query.maxAllowableOffset = maxAllowableOffset;
    query.where = "UPPER(FULLNAME) LIKE '" + roadname.graphic.attributes.FULLNAME.toUpperCase() + "%'";
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    query.returnGeometry = true;
    map.getLayer(roadCenterLinesLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_SUBTRACT, function (featureset) {

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


//Function for showing details of selected parcel.
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
    if (attr.SITEADDRESS) {
        if (attr.SITEADDRESS.length > 25) {
            var title = attr.SITEADDRESS;
            map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + title.substring(0, 10) + "... </span>");
        }
        else {
            map.infoWindow.setTitle("<span title='" + title + "' style='color:white; font-size:11px; font-family:Verdana;'> " + attr.SITEADDRESS + " </span>");
        }
    }
    else {
        map.infoWindow.setTitle("<span style='color:white; font-size:11px; font-family:Verdana;'>" + showNullAs + "</span>");
    }

}

//Function for showing back to parcel list
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
    map.infoWindow.setTitle("<span  style='color:white; font-size:11px; font-family:Verdana;'>" + overlapCount + " Parcels found at this location</span>");
    this.content = divParcelList;
    CreateScrollbar(scrollbar_container, content);
}

//Function for hiding tooltip dialog
function CloseTooltipDialog() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//Function for displaying Alert messages
function ShowDialog(title, message) {
    HideMapTip();

    dojo.byId('divMessage').innerHTML = message;
    dojo.byId('divMessage').style.color = "White";
    dojo.byId('divMessage').style.fontSize = "11px";
    var dialog = dijit.byId('dialogAlertMessage');
    dialog.titleNode.innerHTML = title;
    dialog.show();
}

//Function for hiding Alert messages
function CloseDialog() {
    dijit.byId('dialogAlertMessage').hide();
}

//Function for showing print window
function ShowModal(map) {
    ShowLoadingMessage("Loading print window");
    HideAddressContainer();

    window.showModalDialog("printMap.htm", window);
    HideLoadingMessage();
    var printbutton = dijit.byId('imgPrint');
    printbutton.attr("checked", false);
}

//Function for getting current map extent
function GetPrintExtent() {
    return map.extent;
}

//Function for getting current active URL
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

//Function for getting current instance of graphic layer(selected parcel)
function GetParcelLayer() {
    var parcelLayer = map.getLayer(queryGraphicLayer);
    return parcelLayer;
}

//Function for getting current instance of buffer layer(buffer region)
function GetBufferLayer() {
    var bufferlayer = map.getLayer(tempBufferLayer);
    return bufferlayer;
}

//Function for getting current instance of graphic layer(push pin)
function GetGraphicLayer() {
    var graLayer = map.getLayer(tempGraphicLayer);
    return graLayer;
}

//function to hide BaseMapWidget onmouseout
function HideBaseMapWidget() {
    dijit.byId('imgBaseMap').attr("checked", false);
    var node = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}

var customMouseHandler =
{
    evtHash: [],

    ieGetUniqueID: function (_elem) {
        if (_elem === window) { return 'theWindow'; }
        else if (_elem === document) { return 'theDocument'; }
        else { return _elem.uniqueID; }
    },

    addEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.addEventListener != 'undefined') {
            if (_evtName == 'mouseenter')
            { _elem.addEventListener('mouseover', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else if (_evtName == 'mouseleave')
            { _elem.addEventListener('mouseout', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else
            { _elem.addEventListener(_evtName, _fn, _useCapture); }
        }
        else if (typeof _elem.attachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt_' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined')
            { return; }

            f = function () {
                _fn.call(_elem);
            };

            customMouseHandler.evtHash[key] = f;
            _elem.attachEvent('on' + _evtName, f);

            // attach unload event to the window to clean up possibly IE memory leaks
            window.attachEvent('onunload', function () {
                _elem.detachEvent('on' + _evtName, f);
            });

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
        else
        { _elem['on' + _evtName] = _fn; }
    },

    removeEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.removeEventListener != 'undefined')
        { _elem.removeEventListener(_evtName, _fn, _useCapture); }
        else if (typeof _elem.detachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined') {
                _elem.detachEvent('on' + _evtName, f);
                delete customMouseHandler.evtHash[key];
            }

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
    },

    mouseEnter: function (_pFn) {
        return function (_evt) {
            var relTarget = _evt.relatedTarget;
            if (this == relTarget || customMouseHandler.isAChildOf(this, relTarget))
            { return; }

            _pFn.call(this, _evt);
        }
    },

    isAChildOf: function (_parent, _child) {
        if (_parent == _child) { return false };

        while (_child && _child != _parent)
        { _child = _child.parentNode; }

        return _child == _parent;
    }
};

//function to hide splash screen container
function HideSplashScreenMessage() {
    if (dojo.isIE < 9) {
        dojo.byId("divSplashScreenContent").style.display = "none";
    }
    dojo.addClass('divSplashScreenContainer', "opacityHideAnimation");
    dojo.replaceClass("divSplashScreenContent", "hideContainer", "showContainer");
}
