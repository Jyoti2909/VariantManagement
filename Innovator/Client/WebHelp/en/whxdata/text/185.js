rh._.exports({"1":["\n  ","\n  ","\n    ","\n    ","Discovery Privilege provides the capability to further restrict access to items in your Aras Innovator database.  Discovery privilege determines whether identities are allowed to learn that an item exists in the Aras Innovator database.  This feature can be used to restrict a development or supply chain partner to only discover the items in your Aras Innovator database that they are responsible for.  In this case, only items for which “Can Discover” access is set will be returned in searches even if other items match the search criteria. ","\n    ","Discover and Get Access Behaviors","\n    "," ","\n    ","\n      ","\n        ","\n          ","\n            ","Access Type","\n          ","\n          ","\n            ","Aras Innovator Behavior","\n          ","\n        ","\n        ","\n          ","\n            ","No Get or Discover","\n            ","(No Access)","\n          ","\n          ","\n            ","\n            ","Items ","will not"," be returned in main grid or relationship grid even if they match the search criteria","\n            ","\n            ","\n            ","Warning will be displayed in the status bar indicating a permission restriction if “Show Permissions ","Warning” is set and there are items missing from the result due to insufficient privilege","\n            ","\n          ","\n        ","\n        ","\n          ","\n            ","Discover Only Access","\n          ","\n          ","\n            ","\n            ","Items ","will"," be returned in main grid and relationship grid when they match the search criteria","\n            ","\n            ","\n            ","Users will be restricted to viewing only the information returned in the grid and will not have the ability to open the form","\n            ","\n            ","\n            ","A warning will be displayed in the lock status column of the main grid ","\n            ","\n            ","\n            ","A warning will be displayed in the status bar indicating a permission restriction if “Show Permissions Warning” is set and there are items missing from the result due to insufficient  privilege                                                                                                                                                                                                    ","\n            ","\n          ","\n        ","\n        ","\n          ","\n            ","Get Access","\n          ","\n          ","\n            ","\n            ","No changes here","\n            ","\n            ","\n            ","Users will be allowed to view all information and open forms","\n            ","\n          ","\n        ","\n      ","\n    ","\n    "," ","\n    ","Aras Innovator can be configured to alert the user that there are items not shown due to permission restrictions.","\n    ","Discover and Get Access Scenario","\n    ","The following scenario demonstrates how to restrict the “All Suppliers” Identity from discovering preliminary parts.  In this example, the “New Part” and “Released Part” permissions have been edited as shown.","\n    ","\n    ","\n    "," ","\n    ","\n    ","Results when “Get” Access is defined","\n    ","Search Screen Results when logged in as a member of the “All Employees” Identity","\n    ","\n    ","This Identity has “Get” access to both of these items","\n    ","\n    ","\n    ","No warnings are displayed","\n    ","\n    ","\n    ","\n    "," ","\n    ","\n    ","Results when only “Discover” access is defined","\n    ","Search Screen Results when logged in as a member of the “All Suppliers” Identity","\n    ","\n    ","This Identity has “Discover”  but not “Get” access to one of these items","\n    ","\n    ","\n    ","This Identity has no access to one of these items (it is not displayed in the results)","\n    ","\n    ","\n    ","Discover Only Icon is displayed in the first column","\n    ","\n    ","\n    ","Warnings are displayed in the status bar indicating that there are additional items","\n    ","\n    ","\n    ","\n    "," ","\n    ","\n    ","The primary function of a “Discover” privilege is to allow the user to search for items and view limited information about them, but not view the detailed information that would be present on the item form.  This feature provides a certain level of access control over sensitive information.","\n  ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"2":["About Discovery Privilege"],"7":["Discovery Privilege"],"id":"185"})