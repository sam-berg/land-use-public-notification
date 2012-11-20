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
dojo.provide("js.config");
dojo.declare("js.config", null, {
    // This file contains various configuration settings for "Public Notification Application" template
    //
    // Use this file to perform the following:
    //
    // 1.  Specify application title                  - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set path for application icon              - [ Tag(s) to look for: ApplicationIcon ]
    // 3.  Set splash screen message                  - [ Tag(s) to look for: SplashScreenMessage ]
    // 4.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    //
    // 5.  Specify URLs for basemaps                  - [ Tag(s) to look for: BaseMapLayers ]
    // 6.  Set initial map extent                     - [ Tag(s) to look for: DefaultExtent ]
    //
    // 7a. Specify URLs for operational layers        - [ Tag(s) to look for: TaxParcelLayer, RoadCenterLines ]
    // 7b. Customize info-Window settings             - [ Tag(s) to look for: InfoWindowTitle ]
    // 7c. Customize info-Popup settings              - [ Tag(s) to look for: InfoPopupFieldsCollection, InfoRoadCollectionFields ]
    // 8. Customize address search settings           - [ Tag(s) to look for: LocatorDefaultAddress, LocatorMarkupSymbolPath ]
    // 9. Set URL for geometry service                - [ Tag(s) to look for: GeometryService ]
    // 10a. Geoprocessing services for PDF creation   - [ Tag(s) to look for: ServiceTask ]
    // 10b. Geoprocessing services for CSV file       - [ Tag(s) to look for: CsvServiceTask ]
    // 11. Set the offset distance                    - [ Tag(s) to look for: MaxAllowableOffset ]
    // 12. Set the Maximum buffer distance            - [ Tag(s) to look for: MaxBufferDistance,DefaultBufferDistance ]
    // 13. Set the Rendere color                      - [ Tag(s) to look for: RendererColor ]
    // 14. Set the Address fields                     - [ Tag(s) to look for: AddressSearchFields ]
    // 15. Set the Default Query Fields               - [ Tag(s) to look for: QueryOutFields ]
    // 16. Set the Occupants Name                     - [ Tag(s) to look for: OccupantName ]
    // 17. Set the Occupants fields                   - [ Tag(s) to look for: OccupantFields ]
    // 18. Set the Fields for avery labels            - [ Tag(s) to look for: AveryFieldsCollection ]
    // 19. Set the fields for CSV files               - [ Tag(s) to look for: CsvFieldsCollection ]
    // 20. set the template for Avery labels          - [ Tag(s) to look for: AveryLabelTemplates ]
    // 21. Set the road name                          - [ Tag(s) to look for: DefaultRoadSegment ]
    // 22. Set the color for road                     - [ Tag(s) to look for: RoadLineColor ]
    // -----------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set application title
    'ApplicationName': "Land Use Public Notification",
    // Set application icon path
    'ApplicationIcon': "images/LGP_img.PNG",
    // Set splash window content - Message that appears when the application starts
    'SplashScreenMessage': "<b>Land Use Public Notification</b> <br/> <hr/> <br/>The <b>Land Use Public Notification</b> application allows local government staff to identify properties within a given distance (buffer) of a subject property or roadway and generate mailing labels and/or a structured text file for owners and occupants that fall within the buffer.<br/><br/>This application is typically used by local planning and zoning officials, but can be used by any agency looking to notify property owners and occupants of a formal action being taken. The process of public notification allows adjoining or nearby property owners and others, the opportunity to look at a proposed development, consider the likely impacts the proposal may have on them, and provide comment (either positive or negative) about the proposal prior to a decision being made.<br/><br/>",
    // Set URL of help page/portal
    'HelpURL': "help.htm",
    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    // Please note: All basemaps need to use the same spatial reference. By default, on application start the first basemap will be loaded
    'BaseMapLayers': [{
        'Key': "parcelMap",
        'ThumbnailSource': "images/Parcel map.jpg",
        'Name': "Parcel Map",
        'MapURL': "http://localgovtemplates.esri.com/ArcGIS/rest/services/ParcelPublicAccessforBloomfield/MapServer"
    }, {
        'Key': "taxMap",
        'ThumbnailSource': "images/Tax map.jpg",
        'Name': "Tax Map",
        'MapURL': "http://localgovtemplates.esri.com/ArcGIS/rest/services/ParcelIndustry/MapServer"
    }],
    // Initial map extent. Use comma (,) to separate values and don't delete the last comma
    'DefaultExtent': "-9273520,5249870,-9270620,5251510",
    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Map Services for operational layers
    'TaxParcelQueryMap': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Bloomfield/TaxParcelQuery/MapServer",
    'TaxParcelPublishingLayer': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Bloomfield/TaxParcelQuery/MapServer/0",
    'RoadCenterLines': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Bloomfield/RoadCenterlineQuery/MapServer/0",
    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-WINDOW SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    //Title for content in the infowindow.
    'InfoWindowTitle': "Site Address",
    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-POPUP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-popup is a popup dialog that gets displayed on selecting a feature
    // Set the content to be displayed on the info-Popup for parcels. Define labels, field values, field types and field formats
    'InfoPopupFieldsCollection': [{
        'DisplayText': "Parcel ID:",
        'FieldName': "PARCELID",
        'AliasField': "Parcel Identification Number"
    }, {
        'DisplayText': "Sub or Condo Name:",
        'FieldName': "CNVYNAME",
        "AliasField": "Conveyance Name"
    }, {
        'DisplayText': "Building:Unit:",
        'FieldName': "BUILDING,UNIT",
        "AliasField": "Building,Unit"
    }, {
        'DisplayText': "Owner Name:",
        'FieldName': "OWNERNME1",
        'AliasField': "Owner Name"
    }, {
        'DisplayText': "Second Owner:",
        'FieldName': "OWNERNME2",
        'AliasField': "Second Owner Name"
    }, {
        'DisplayText': "Use Description:",
        'FieldName': "USEDSCRP",
        'AliasField': "Use Description"
    }, {
        'DisplayText': "Tax District:",
        'FieldName': "CVTTXDSCRP",
        'AliasField': "Tax District Name"
    }, {
        'DisplayText': "School District:",
        'FieldName': "SCHLDSCRP",
        'AliasField': "School District Name"
    }],
    // Set the content to be displayed on the info-Popup for road. Define labels, field values, field types and field formats
    'InfoRoadCollectionFields': [{
        'DisplayText': "Road Class:",
        'FieldName': "${ROADCLASS}",
        "AliasField": "Road Class"
    }, {
        'DisplayText': "From Left:",
        'FieldName': "${FROMLEFT}",
        "AliasField": "Left From Address"
    }, {
        'DisplayText': "To Left:",
        'FieldName': "${TOLEFT}",
        "AliasField": "Left To Address"
    }, {
        'DisplayText': "From Right:",
        'FieldName': "${FROMRIGHT}",
        'AliasField': "Right From Address"
    }, {
        'DisplayText': "Zip Left:",
        'FieldName': "${ZIPLEFT}",
        'AliasField': "Zip on Left"
    }, {
        'DisplayText': "Zip Right:",
        'FieldName': "${ZIPRIGHT}",
        'AliasField': "Zip on Right"
    }],
    // Set string value to be shown for null or blank values
    'ShowNullValueAs': "N/A",
    // ------------------------------------------------------------------------------------------------------------------------
    // ADDRESS SEARCH SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set default address to search
    'LocatorDefaultAddress': "2830 W Hickory Grove Rd",
    // Set pushpin image path
    'LocatorMarkupSymbolPath': "images/Pushpin.png",
    // ------------------------------------------------------------------------------------------------------------------------
    // GEOMETRY SERVICE SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set geometry service URL
    'GeometryService': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Geometry/GeometryServer",
    //Customn Data for Public Notification Application.
    // ------------------------------------------------------------------------------------------------------------------------
    // Geoprocessing Services
    // ------------------------------------------------------------------------------------------------------------------------
    // Geoprocessing services for PDF creation
    'ServiceTask': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Planning/PublicNotification/GPServer/GenerateAveryLabelsPDF",
    // Geoprocessing services for CSV file creation
    'CsvServiceTask': "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Planning/PublicNotification/GPServer/GenerateCSV",
    // ------------------------------------------------------------------------------------------------------------------------
    // Offset distance
    // ------------------------------------------------------------------------------------------------------------------------
    //Maximum offeset
    'MaxAllowableOffset': 1,
    // ------------------------------------------------------------------------------------------------------------------------
    // Buffer distances
    // ------------------------------------------------------------------------------------------------------------------------
    //Maximum Buffer Distance
    'MaxBufferDistance': 2000,
    //Buffer Distance
    'DefaultBufferDistance': 100,
    // ------------------------------------------------------------------------------------------------------------------------
    // Renderer settings
    // ------------------------------------------------------------------------------------------------------------------------
    //Renderer Color
    'RendererColor': "#1C86EE",
    // ------------------------------------------------------------------------------------------------------------------------
    // Address settings
    // ------------------------------------------------------------------------------------------------------------------------
    //Address fields
    'AddressSearchFields': "PARCELID,SITEADDRESS",
    // ------------------------------------------------------------------------------------------------------------------------
    // Query fields
    // ------------------------------------------------------------------------------------------------------------------------
    //Fields to be dispalyed on info window.
    'QueryOutFields': "PARCELID,LOWPARCELID,OWNERNME1,OWNERNME2,SITEADDRESS,PSTLADDRESS,PSTLCITY,PSTLSTATE,PSTLZIP5,PSTLZIP4,BUILDING,UNIT,USEDSCRP,CNVYNAME,CVTTXDSCRP,SCHLDSCRP",
    //Name of the occupant
    'OccupantName': "Occupant",
    //Fields of the occupant
    'OccupantFields': "PARCELID,SITEADDRESS",
    //Fields for Avery labels
    'AveryFieldsCollection': ["PARCELID", "OWNERNME1", "OWNERNME2", "PSTLADDRESS", "PSTLCITY,PSTLSTATE,PSTLZIP5"],
    //Fields for CSV files
    'CsvFieldsCollection': ["PARCELID", "OWNERNME1", "OWNERNME2", "PSTLADDRESS", "PSTLCITY", "PSTLSTATE", "PSTLZIP5"],
    //Templeate for Avery Label
    'AveryLabelTemplates': [{
        "name": "5160",
        "value": "avery5160"
    }, {
        "name": "5193",
        "value": "avery5193"
    }],
    //Road segment name
    'DefaultRoadSegment': "Thedford Rd",
    //Road segment color
    'RoadLineColor': "#FF0000"
});
