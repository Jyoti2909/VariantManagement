rh._.exports({"0":["Access Rights"],"1":["\n  ","\n  ","\n  ","Access rights are defined in an Item Permission as a set of grants to identities. Each grant enables an identity to perform a corresponding set of actions on items. The following grants are available in a Permission:","\n  ","\n    ","Get ","to search and open items in Viewing Mode.","\n    ","Update ","to claim and edit Items.","\n    ","Delete ","to delete Items from Aras Innovator.","\n    ","Can Discover"," to search for Items and see a limited set of properties in the Search Grid.","\n    ","Show Permission Warning ","to show a warning message if access is restricted to the identity.","\n    ","Can Change Access"," to change an Item's Permissions.","\n  ","\n  ","The Aras Administrator creates and manages Identities. There are several identities available in Aras Innovator.","\n  ","Certain ItemTypes, such as Parts, Documents, and CAD Documents have the following identities which can be tied to permissions:","\n  ","\n    ","Manager ","is responsible for the management, usage, and review of the Item and assigns the Designated User property on the Item View.","\n    ","\n    ","Owner ","is the Item owner who has the Assigned Creator property on the Item View. This property is optional.","\n    ","\n    ","Creator ","is the creator of the Item who is in the Created By property on the Item view. It is automatically assigned and cannot be changed.","\n  ","\n  ","The Aras PLM system role represents the change management process and does not contain any individuals. Its permissions should not be changed.","\n  ","Item types can have different permissions based on their Life Cycle states. For example, an Item has different permissions for its Preliminary, In Review, and Released states. When the Item enters a certain state, it is assigned a Permission defined by that state. An Administrator can adjust these permissions if necessary.","\n  ","A new Item is assigned the Preliminary state and has the New Item Permissions assigned. When In Review, the Item has the In Review Item Permission.","\n  ","\n  ","The Item has the Released Item Permissions when it is in a released state.","\n  ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"2":["Access Rights"],"id":"53"})