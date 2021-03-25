rh._.exports({"0":["Editing Activity Dates"],"2":["﻿\n\n\n\n  ","\n  ","\n  ","\n  ","\n  ","\n  ","\n    /*<![CDATA[*/\n    p.Copyright_Footer {\n      font-family: Tahoma;\n      font-size: 8pt;\n      border-top-style: None;\n      border-bottom-style: None;\n      background-color: #555555;\n      color: #ffffff;\n      margin-top: 6pt;\n      margin-bottom: 6pt;\n    }\n    /*]]>*/\n  ","\n\n\n  ","\n  ","\n  ","The project manager can edit the planned dates of activities, but when he does so the changes made are interpreted only within the context of the activity. When the project is saved and scheduled the plan dates may be affected by the scheduling calculation.","\n  "," ","\n  ","\n  ","\n    ","Plan Start, Plan Finish and Duration are all linked together. Changing one of these values in the Project Tree or the Activity2 Form changes one of the other two, this behavior is always the same.","\n    ","If Plan Start is changed it is assumed that you wish to keep the same Duration and change the Plan Finish date. New Plan Finish = New Plan Start + Duration.","\n    ","If Duration is changed it is assumed that you wish to keep the same Plan Start and change the Plan Finish date. New Plan Finish = Plan Start + New Duration.","\n    ","If Plan Finish is changed it is assumed that you wish to keep the same Plan Start and change the Duration. Duration = New Plan Finish – Plan Start. Also if Target Start is not null it is assumed that as you changed the Duration you wish to change the Target Finish. New Target Finish = Target Start + New Duration.","\n    ","When one of these values is changed no other validation or checking of dates with any other part of the project schedule occurs. The reason for this behavior is that activities plan dates may be affected by other activities, the entire schedule needs to be evaluated, see “Critical Path Method”","\n    ","When the project is saved or scheduled the entire project schedule is recalculated from project target dates, scheduling type, and activity durations and precedence. Scheduling will accommodate the Plan Start and Plan finish you selected if possible, otherwise the closest available dates will be selected. See “Scheduling of Plan Start and Finish Dates”. Plan Finish always = Plan Start + Duration, even when Plan dates are changed by scheduling.","\n  ","\n  ","\n  ","\n    ","Target Start and Finish dates and Duration are also linked together. The purpose of Activity Target dates is to propose preferred dates that scheduling will adopt as Plan Start and Finish Dates if possible, otherwise the closest available date will be selected. See “Scheduling of Plan Start and Finish Dates”","\n    ","Activity Target dates are on the Activity2 Window but not in the Project Tree.","\n    ","If Target Start is changed it is assumed that you wish to keep the same Duration and set or change the Target Finish date, New Target Finish = New Target Star + Duration","\n    ","If Target Finish is changed it is assumed that you wish to keep the same Duration and set or change the Target Start. New Target Start = New Target Finish – Duration.","\n    ","If Duration is changed and Target Date is not null, it is assumed that you wish to keep the same Target Start and change the Target Finish date. New Target Finish = Target Start + New Duration.","\n    ","If Target Start of Target Finish is deleted then it is assumed that you wish to delete both Target dates.","\n  ","\n\n","\n  ","\n    "," ","\n    ","©2020 Aras Corporation - All Rights Reserved","\n  ","\n\n"],"3":["Basic Page"],"4":["Editing Activity Dates"],"5":["Planned Dates","Target Dates"],"id":"23"})