// (c) Copyright by Aras Corporation, 2005-2010.
/*
This js uses global projectPlanView.html and treePanel.html variables:
---------
a
wbs
projectItem

and functions:
---------
seekInArray
getItemForEdit
*/
var arasObj = aras;
if (!arasObj) {
	arasObj = parent.parent.aras;
}
var turnOffCalendarExcpetions = false; //this flag is for debug purposes only (to run unit tests independently from DB)

/*****************
tests data (assumption: no day offs except weekends):
12/31/2005 - Saturday
01/01/2006 - Sunday
01/03/2006 - Tuesday
02/01/2006 - Wednesday
02/04/2006 - Saturday
02/05/2006 - Sunday
02/06/2006 - Monday
2006 year is not a leap-year
03/01/2006 - Wednesday
12/01/2006 - Friday
12/31/2006 - Sunday
01/01/2007 - Monday
working days in 2007 year: 23+20+22+21+23+21+22+23+20+23+22+21=261
01/01/2008 - Tuesday
2008 year is a leap-year
02/29/2008 - Friday
03/03/2008 - Monday
-----------------
/** /
alert("Important: Unit tests are turned ON.");
turnOffCalendarExcpetions = true;
var commonTestsData =
[
{dt1:"2005-12-29T00:00:00+0000", dt2:"2005-12-30T00:00:00+0000", diff:1},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-01T00:00:00+0000", diff:0},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-02T00:00:00+0000", diff:1},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-03T00:00:00+0000", diff:2},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-06T00:00:00+0000", diff:3},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-07T00:00:00+0000", diff:4},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-02-15T00:00:00+0000", diff:10},
{dt1:"2006-02-01T00:00:00+0000", dt2:"2006-03-01T00:00:00+0000", diff:20},
{dt1:"2006-12-01T00:00:00+0000", dt2:"2007-01-01T00:00:00+0000", diff:21},
{dt1:"2006-12-29T00:00:00+0000", dt2:"2007-01-01T00:00:00+0000", diff:1},
{dt1:"2007-01-01T00:00:00+0000", dt2:"2008-01-01T00:00:00+0000", diff:261},
{dt1:"2006-12-01T00:00:00+0000", dt2:"2008-01-01T00:00:00+0000", diff:282},
{dt1:"2008-02-01T00:00:00+0000", dt2:"2008-03-03T00:00:00+0000", diff:21}
];
/*****************/

/*****************
tests for incDate:
/** /
var incDateTestsData =
[
{dt1:"2005-12-31T00:00:00+0000", dt2:"2006-01-03T00:00:00+0000", diff:1}
];
incDateTestsData = commonTestsData.concat(incDateTestsData);

var incDateTestsResult = "";
for (var i=0; i<incDateTestsData.length; i++)
{
var test = incDateTestsData[i];
var testCode = 'incDate("' + test.dt1 + '",' + test.diff + ')=="' + test.dt2 + '"';
incDateTestsResult += testCode + ": " + eval(testCode) + "\n";
}
alert("incDate Tests Results:\n" + incDateTestsResult);
/************************/
function incDate(sdate, sdays) {
	return addWorkDays(sdate, sdays);
}

/*****************
tests for decDate:
/** /
var decDateTestsData =
[
{dt1:"2005-12-29T00:00:00+0000", dt2:"2006-01-01T00:00:00+0000", diff:2}
];
decDateTestsData = commonTestsData.concat(decDateTestsData);

var decDateTestsResult = "";
for (var i=0; i<decDateTestsData.length; i++)
{
var test = decDateTestsData[i];
var testCode = 'decDate("' + test.dt2 + '",' + test.diff + ')=="' + test.dt1 + '"';
decDateTestsResult += testCode + ": " + eval(testCode) + "\n";
}
alert("decDate Tests Results:\n" + decDateTestsResult);
/************************/
function decDate(sdate, sdays) {
	return addWorkDays(sdate, -Number(sdays));
}

function decDateToFirstWorking(date) {
	var test_date = decDate(date, 1);
	if (test_date === undefined) {
		return;
	}
	test_date = incDate(test_date, 1);
	if (test_date === undefined) {
		return;
	}
	if (compareDates(test_date, date) < 0) {
		return test_date;
	}
	else {
		return decDate(date, 1);
	}
}

function incDateToFirstWorking(date) {
	var test_date = incDate(date, 1);
	if (test_date === undefined) {
		return;
	}
	test_date = decDate(test_date, 1);
	if (test_date === undefined) {
		return;
	}
	if (compareDates(test_date, date) > 0) {
		return test_date;
	}
	else {
		return incDate(date, 1);
	}
}

function addWorkDays(dt, days2Add) {
	return getResultFromServerBusinessCalendar(dt, days2Add, "add");
}

function getResultFromServerBusinessCalendar(arg1, arg2, mode) {
	var dtAddMethodNm = "PM_handleWorkDays";
	var aml = "<Item type='Method' action='" + dtAddMethodNm + "'>";
	aml += "<mode>" + mode + "</mode>";
	aml += "<date>" + arg1 + "</date>";
	aml += (mode === "add" ? "<days2add>" + arg2 + "</days2add>" : "<date2>" + arg2 + "</date2>");
	aml += "</Item>";
	var r = arasObj.soapSend("ApplyItem", aml);
	if (r.getFaultCode() !== 0) {
		arasObj.AlertError(r);
		return;
	}
	r = r.getResponseText();
	var i1 = r.indexOf("<r>");
	i1 += 3;
	var i2 = r.indexOf("</r>");
	r = r.substr(i1, i2 - i1);
	return r;
}

/*****************
tests for diffDates:
/** /
var diffDatesTestsData =
[
{dt1:"2005-12-29T00:00:00+0000", dt2:"2006-01-01T00:00:00+0000", diff:2},
{dt1:"2005-12-31T00:00:00+0000", dt2:"2006-01-03T00:00:00+0000", diff:1},
{dt1:"2005-12-31T00:00:00+0000", dt2:"2006-01-01T00:00:00+0000", diff:0}
];
diffDatesTestsData = commonTestsData.concat(diffDatesTestsData);

var diffDatesTestsResult = "";
for (var i=0; i<diffDatesTestsData.length; i++)
{
var test = diffDatesTestsData[i];
var testCode = 'diffDates("' + test.dt1 + '","' + test.dt2 + '")==' + test.diff;
diffDatesTestsResult += testCode + ": " + eval(testCode) + "\n";
}
alert("diffDates Tests Results:\n" + diffDatesTestsResult);
/************************/

// sdate1 < sdate2 return > 0
function diffDates(sdate1, sdate2) {
	//returns differnce between sdate2 and sdate1 in working days.
	//if sdate1 < sdate2 then return value is positive
	//else return value is negative or zero.

	var r = getResultFromServerBusinessCalendar(sdate1, sdate2, "diff");
	r = parseInt(r);
	if (isNaN(r)) {
		return;
	}
	return r;
}

/*
* compareDates()
* params:
* sdate1,sdate2 - string properties of type 'Date'
* returns:
* 1  if sdate1 > sdate2
* -1 if sdate1 < sdate2
* 0  if sdate1 == sdate2
*/

function compareDates(sdate1, sdate2) {
	var date1 = getDate(sdate1);
	var date2 = getDate(sdate2);
	if (date1 > date2) {
		return 1;
	}
	else if (date1 < date2) {
		return -1;
	}
	else {
		return 0;
	}

	function getDate(s) {
		if (!s) {
			return null;
		}
		if (s.indexOf("T") === -1) {
			s += "T00:00:00";
		}
		var arr = s.split("T");
		var dt = arr[0].split("-");
		var tm = arr[1].split(":");
		if (dt.length !== 3 || tm.length < 3) {
			return null;
		}
		var h = {};
		h.yyyy = dt[0];
		h.MM = dt[1];
		h.dd = dt[2];
		h.hh = tm[0];
		h.mm = tm[1];
		h.ss = tm[2].substr(0, 2);
		for (var k in h) {
			h[k] = parseInt(h[k], 10);
		}
		return new Date(h.yyyy, h.MM, h.dd, h.hh, h.mm, h.ss);
	}
}

function parseToDate(si) {
	// 'MM/dd/yyyy';
	if (!si) {
		return null;
	}
	var ar = si.split("/");
	if (ar.length !== 3) {
		return null;
	}
	var dt = new Date(Date.UTC(parseInt(ar[2], 10), parseInt(ar[0], 10) - 1, parseInt(ar[1], 10)));
	return dt;
}

function parseFromDate(d) {
	// 'MM/dd/yyyy';
	var month = d.getUTCMonth() + 1;
	var day = d.getUTCDate();
	var year = d.getUTCFullYear();
	var str = (month >= 10 ? "" : "0") + month + "/" + (day >= 10 ? "" : "0") + day + "/" + year;
	return str;
}
//--- Common functions ---

var DefaultDateFormat = "short_date";

function convertDateStr(dt, oldPattern, newPattern) {
	if (!dt) {
		return dt;
	}
	var res = arasObj.convertFromNeutral(dt, "date", newPattern);
	return res;
}

function getDatePropertyPattern(itemTypeName, propertyName) {
	switch (propertyName) {
		case "plan_finish":
			if (itemTypeName === "WBS Element") {
				propertyName = "rollup_date_sched_due";
			}
			else {
				propertyName = "date_due_sched";
			}
			break;

		case "plan_start":
			if (itemTypeName === "WBS Element") {
				propertyName = "rollup_date_sched_start";
			}
			else {
				propertyName = "date_start_sched";
			}
			break;
	}

	var it = arasObj.getItemTypeForClient(itemTypeName).node;
	if (!it) {
		return DefaultDateFormat;
	}

	var propNd = it.selectSingleNode("Relationships/Item[@type='Property' and name='" + propertyName + "']");
	if (!propNd) {
		return DefaultDateFormat;
	}

	var res = arasObj.getItemProperty(propNd, "pattern");
	if (!res) {
		return DefaultDateFormat;
	}

	return res;
}

function getCamelCased(value) {
	return value.replace(/_\w/g, function(match) {
		return match[1].toUpperCase();
	});
}

function getCamelCasedDatePropertyPattern(itemTypeName, propertyName) {
	var pattern = getDatePropertyPattern(itemTypeName, propertyName);
	return getCamelCased(pattern);
}

function getSnakeCased(value) {
	return value.replace(/[A-Z]/g, function(match) {
		return '_' + match[0].toLowerCase();
	});
}
