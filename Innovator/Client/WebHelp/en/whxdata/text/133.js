rh._.exports({"0":["About Methods"],"1":["\n  ","\n  ","\n  ","Methods"," are scripts that perform business logic and are called in a variety of ways.  A ","Method"," item has the properties name, code, and type.  The type property defines the\n    language in which the code is written.  An Action is the end-user wrapper that enables a client interface to invoke the logic of a ","Method",".","\n  ","Developers use the ","Method"," ItemType to store the business logic in the Innovator database.  ","Methods"," may be implemented on either the client or server using Innovator APIs.\n     ","\n  ","There are several ways in which ","Methods"," can be used for both client and server invocations:","\n  ","\n    ","\n    ","\n    ","One use of ","Methods"," is to implement business logic before and after the client or server performs some action on the item.","\n    ","\n      ","\n        ","\n        ","For example, the ","onBeforeAdd"," server event can call a ","Method"," before the server “add” action is performed so that the user can do something with an item just before\n          the item is added to the database.  This provides the application programmer the means to interact with the item before the server acts on it. The method might augment the XML for the item from some external source before the server acts on\n          it.","\n        ","\n          ","\n            ","\n            ","\n            ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"2":["About Methods"],"id":"133"})