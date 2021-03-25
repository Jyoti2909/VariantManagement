rh._.exports({"0":["Activity"],"1":["Comments,Time Record,Deliverable,Template,Task,Activity,Project"],"2":["﻿\n\n\n\n  ","\n  ","\n  ","\n  ","\n  ","\n  ","\n    /*<![CDATA[*/\n    p.Copyright_Footer {\n      font-family: Tahoma;\n      font-size: 8pt;\n      border-top-style: None;\n      border-bottom-style: None;\n      background-color: #555555;\n      color: #ffffff;\n      margin-top: 6pt;\n      margin-bottom: 6pt;\n    }\n    /*]]>*/\n  ","\n\n\n  ","\n  ","\n  ","An Activity, or an Activity2 is a basic building block of the Project Plan. An activity has a list of tasks associated with it, a time period or duration during which these tasks are to be completed, and a list of deliverables to be submitted. A milestone is an activity, except with zero duration. Aside from the information appearing in the Project Plan tab of the project, there is also a detail dialog for each activity. Let's look at a Design Project and its tree of activities:","\n  ","\n  "," ","\n  ","Note the highlighted activity, Needs Analysis. We will use this activity as an example.","\n  ","To take a more detailed look at the activity, you can either select View/Edit Selected Item from the right-mouse-click pop-up menu, or by clicking the View/Edit Selected item Icon ",". The Activity2 Detail Dialog is then displayed. Notice that this dialog does not have any of the typical Save, Exit, or Unlock icons. All information that is changed on this dialog is automatically saved when the dialog is closed. The information on this dialog is connected to the information for the activity on Project Plan tab. No matter where the information is changed, it is updated in both places.","\n  ","\n  "," ","\n  ","Let's take a look at the properties and tabs of this dialog.","\n  ","There are three areas in the header of this dialog:","\n  ","For Use By Project Manager"," - all the following properties are to be filled out by the Project Manager identity of this project:","\n  ","\n    ","\n        ","Deliv Required"," - boolean to indicate if the activity requires a deliverable to be complete. If checked, the activity cannot be completed until the deliverable is attached by the responsible assignee.","\n    ","\n        ","Deliv Type"," - the Item Type of the Deliverable. This applies only if the activity requires a deliverable, but even in this case, specifying the type of deliverable is not required..","\n    ","Description"," - the description of the activity","\n    ","Is Required"," - a boolean to indicate if this activity is required. This applies if the project was created from a template where an activity can be marked as required. In the case of a required activity, the check box will be checked, and the property is read only (set by the template).","\n    ","Work Est"," - the estimated number of hours to complete the activity.","\n    ","Expected Duration"," - the duration of the activity, transferred here from the Project Plan tab.","\n    ","Date Due Shed"," - the scheduled due date for the activity. The Project Manager can select a date between the early finish date (Date Ef) and the late finish date (Date Lf), as long as the scheduled start date plus duration will equal Date Due.","\n    ","Date Start Sched"," - the scheduled start date for the activity. The Project Manager can select a date between the early start date (Date Es) and late start date (Date Ls) which are calculated by the scheduler. When these dates are the same date, the Project Manager has no choice.","\n    ","Project Manager"," - the manager of the project","\n    ","Name"," - the name of the activity","\n    ","System Managed"," - these properties are managed by Aras Innovator. The values shown here are all read only.","\n    ","State"," - the state of the activity, could be one of two - active or pending. An active state is reached when the project is promoted to the active state, and the scheduled start date for the activity is today or earlier.","\n    ","Status"," - the traffic light indicator of the activity, as well as the rolled up % complete of all the underlying tasks.\n      ","\n        ","No color"," - the activity is pending, meaning the scheduled start date has not been reached","\n        ","Green"," - the activity is active (i.e. the start date is today or earlier), and the number of days between today and the planned finish date of the activity is greater than 7.","\n        ","Yellow"," - the activity is active (i.e. the start date is today or earlier), and the number of days between today and the planned finish date of the activity is less than or equal to 6, but greater than or equal to 1.","\n        ","Red"," - the activity is active (i.e. the start date is today or earlier), and the planned finish date of the activity is today or earlier.","\n        ","Date Activated"," - the date this activity was started. It may have been started earlier than the scheduled date.","\n        ","Date Due Original"," - The original due date, which may be used later in tracking and metrics to indicate the accuracy of planning and predicting project success.","\n        ","Date Es"," - the earliest possible start date calculated by the date propagation algorithm.","\n        ","Date Ls"," - the latest possible start date calculated by the date propagation algorithm.","\n        ","Date Ef"," - the earliest possible finish date calculated by the date propagation algorithm.","\n        ","Date Lf"," - the latest possible finish date calculated by the date propagation algorithm.","\n        ","For Use By Assignee"," - properties that are under the control of the identity assigned to complete the activity. These properties echo the values entered in the ","Activity Completion Worksheet",". So when an assignee updates the Worksheet, the new values are reflected here as well.\n          ","\n            ","Date Start Act"," - the actual date that the activity was started.","\n            ","Date Due Act"," - the actual date that the activity was completed","\n            ","Complete"," - % complete at the point when the assignee chooses to update this information.","\n          ","\n        ","\n      ","\n    ","\n  ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"3":["Basic Page"],"4":["Activity/Milestone"],"id":"30"})