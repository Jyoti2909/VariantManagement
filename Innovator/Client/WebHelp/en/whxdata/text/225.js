rh._.exports({"1":["\n  ","\n  ","\n  ","Use the Parameterized Search search method to search for Items with one or more Item properties, where the properties you search for remain constant, but the values to be searched for differ. You can pre-configure the Item's properties on which the search needs to be conducted and save the search.  ","\n  ","You can use Parameterized Searches in any search mode, but they are probably most useful in Saved Searches.  This search is also useful in cases where Items with numerous properties are displayed in the main grid.  In such cases, searching for only a few properties would be inconvenient.  You can also restrict your search to certain parameters using the Parameterized Search.","\n  ","Example:  If you often search for Parts that are in a 'Released' State, but the Cost, Revision, or Part Number included in the search varies, you can use Parameterized Search.","\n  ","You can pre-define the Item's properties (parameters) to include in the search using the syntax @{","n","}, where ","n"," is a number.  There can be any number of parameters, and the numbers need not be sequential. You can also use wild-cards before or after @{","n","}.  ","\n  ","\n  ","The syntax @{","n","} is  reserved for Parameterized Search. It is always interpreted as a parameter; you cannot search for the string '@{1}.' ","\n  ","\n  ","To create and use a Parameterized Search:","\n  ","\n    ","\n      ","Log in to Aras Innovator.","\n    ","\n    ","\n      ","In the TOC, navigate to the Item you want to search for. For example, to search for Parts, navigate to ","Design --> Parts",".","\n    ","\n    ","\n      ","In the search bar, define the properties to be used in the search by specifying @{","n","} in the column.","\n    ","\n  ","\n  ","      In our example, let's use the following Item Properties:","\n  ","\n  ","Part Number",": @{1}*","\n  ","\n  ","\n  ","State",": @{2}*","\n  ","\n  ","\n  ","Changes",": @{3}","\n  ","\n  ","\n  ","\n  "," ","\n  ","\n  ","\n    ","\n      ","Navigate to ","Search --> Save Search"," to save the parameterized search. Saving the search is an optional step.","\n    ","\n    ","\n      ","Click "," to execute the search.","\n    ","\n  ","\n  ","The ","Set Parameter Value"," dialog box appears.","\n  ","\n  ","Figure 2","\n  ","\n    ","\n      ","Specify the values to be searched for. Let's search for Parts using the following criteria:","\n    ","\n  ","\n  ","\n  ","Part Numbers starting with 1000*","\n  ","\n  ","\n  ","In ","Released"," State","\n  ","\n  ","\n  ","Not included in Change Management.","\n  ","\n  ","\n  ","\n    ","\n      ","\n      "," ","\n      ","\n    ","\n  ","\n  "," ","\n  ","\n    ","Click ","OK",". The main grid displays the list of items matching your search criteria. Every time you execute the search, a search dialog displaying the Item Properties you defined appears.","\n  ","\n  "," ","\n  ","\n    ","\n      ","You can specify the values of the Item's properties you want to conduct the search for.","\n    ","\n  ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"2":["Parameterized Search"],"7":["Parameterized Search"],"id":"225"})