var GanttXml = null;
var GanttWnd = null;
//+++ PREFERENCES
var columns = []; // hash : [column index] -> [_column object], column order position starts from 0
// --- PREFERENCES

var fldToCol = {}; // hash : [colId] -> [column index]
var fld = {}; // hash : [column name] -> [column order in initXML, also is colId]
/* default values:
fld['tree_node'] = 0;
fld['n'] = 1;
fld['predecessor'] = 2;
fld['status'] = 3;
fld['leader'] = 4;
fld['plan_start'] = 5;
fld['plan_finish'] = 6;
fld['duration'] = 7;
fld['hours'] = 8;
fld['role'] = 9;
fld['attach'] = 10;
*/

var wbsRowType = "wbs";
var actRowType = "act";
var milRowType = "mil";
var stylesFileBase = aras.getScriptsURL() + "../Solutions/Project/styles/";
var xmlFileBase = aras.getScriptsURL() + "../Solutions/Project/xml/";
var uniCache = { identities: {}, queryDom: null, xsltWbs: null, xsltWbsBranch: null };

function showGanttInternal(wbs, projectNumber) {
	var cancelled = false;
	if (GanttWnd !== null && !aras.isWindowClosed(GanttWnd)) {
		GanttWnd.focus();
		cancelled = !GanttWnd.aras.confirm(aras.getResource("project", "gantt_methods.close_chart_window_and_open_new"));
		if (!cancelled) {
			GanttWnd.close();
		}
	}

	GanttXml = generateGanttXml(wbs);

	if (!cancelled) {
		window.a = aras;
		window.xmlFileBase = xmlFileBase;
		window.GanttXml = GanttXml;
		GanttWnd = window.open(aras.getScriptsURL() + "../Solutions/Project/scripts/Gantt.html#" + projectNumber, "Gantt" + projectNumber, "width=800, height=400, resizable=yes", true);
	}
}

function generateGanttXml(wbsNode) {
	var xslFile = aras.getScriptsURL() + "../Solutions/Project/styles/gantt.xsl",
		wbsNodeCopy = aras.createXMLDocument(),
		resultNode = aras.createXMLDocument(),
		xml, i;

	function copyDocs(source, target) {
		source = source.documentElement || source;
		target.loadXML(source.cloneNode(false).xml);
		var nds = source.selectNodes("*");
		for (var i = 0; i < nds.length; i++) {
			target.documentElement.appendChild(nds[i].cloneNode(true));
		}
	}

	copyDocs(wbsNode, wbsNodeCopy);
	copyDocs(wbsNode, resultNode);

	fillNumAndPredecessor(resultNode);
	xml = aras.applyXsltFile(resultNode, xslFile);

	resultNode.loadXML(xml);
	if (window.convertDateStr && window.getDatePropertyPattern) {
		/*we know that resultNode contains the following xml:
		<project>
			<input-date-format/>
			<display-date-format/>
			<xsl:template mode="getAct" match="Item[@type='Activity2']">
				<task>
					<start-date><xsl:value-of select="date_start_sched"/></start-date>
					<end-date><xsl:value-of select="date_due_sched"/></end-date>
				</task>
			</xsl:template>
		</project>
		we have to convert start-date and end-date values into input-date-format.
		*/
		var type = "Activity2";
		var newDateFormat = aras.getDotNetDatePattern("short_date");
		resultNode.selectSingleNode("/project/input-date-format").text = newDateFormat;
		resultNode.selectSingleNode("/project/display-date-format").text = newDateFormat;

		var startDateFormat = getDatePropertyPattern(type, "date_start_sched"),
			endDateFormat = getDatePropertyPattern(type, "date_due_sched"),
			dateNodes, dateNode;

		dateNodes = resultNode.selectNodes("/project//task/start-date");
		for (i = 0; i < dateNodes.length; i++) {
			dateNode = dateNodes[i];
			dateNode.text = convertDateStr(dateNode.text, startDateFormat, newDateFormat);
		}

		dateNodes = resultNode.selectNodes("/project//task/end-date");
		for (i = 0; i < dateNodes.length; i++) {
			dateNode = dateNodes[i];
			dateNode.text = convertDateStr(dateNode.text, endDateFormat, newDateFormat);
		}
	}

	processPredecessors(resultNode.documentElement, "//wbs/task/predecessor[.!='']");

	var xsltString = uniCache.xsltWbs;
	if (!xsltString) {
		xsltString = generateXSLT("Project").xsltWbs;
		uniCache.xsltWbs = xsltString;
	}

	//Clean empty Relationships
	var emptyRels = wbsNodeCopy.selectNodes("descendant::Relationships[not(*)]");
	for (i = 0; i < emptyRels.length; i++) {
		emptyRels[i].parentNode.removeChild(emptyRels[i]);
	}

	var xml2 = aras.applyXsltString(wbsNodeCopy, xsltString);
	wbsNodeCopy.loadXML(xml2);
	processPredecessors(wbsNodeCopy.documentElement);
	processNfields(wbsNodeCopy.documentElement);

	resultNode.documentElement.appendChild(wbsNodeCopy.documentElement.cloneNode(true));  //appended to "project/table"

	wbsNodeCopy.loadXML("<clean_memory/>");

	// Remove input_row from tree xml.
	var tableNode = resultNode.selectSingleNode("/project/table");
	tableNode.setAttribute("editable", false);
	tableNode.removeChild(tableNode.selectSingleNode("inputrow"));
	tableNode.setAttribute("EXPANDALL", "true");

	return resultNode;
}

function fillActivitiesFromWbs() {
	var activities = wbs.selectNodes("descendant::Item[@type='WBS Activity2' and not(@action='delete')]/related_id/Item[@type='Activity2']");
	this.activities = {};

	for (var j = 0; j < activities.length; j++) {
		this.activities[activities[j].getAttribute("id")] = activities[j];
	}
}

function fillNumAndPredecessor(node) {
	var activityNodes = node.selectNodes("//Item[@type=\"Activity2\" and not(@action=\"delete\")]"),
		currentNode, id, preds,
		i, j;

	fillActivitiesFromWbs();

	for (i = 0; i < activityNodes.length; ++i) {
		currentNode = activityNodes[i];
		id = currentNode.getAttribute("id");
		currentNode.setAttribute("num", getActNum(id));

		preds = getPredecessors(id);
		if (preds && preds.length) {
			var p = "";
			for (j = 0; j < preds.length; ++j) {
				p += ", " + getActNum(preds[j]);
			}

			currentNode.setAttribute("predecessor", p.substring(1));
		}
	}
}

function getPredecessors(id, excludeIds) {
	var resultArray = [],
		excludeCondition = "",
		activityNode, preds,
		i;

	if (excludeIds && excludeIds.length) {
		for (i = 0; i < excludeIds.length; i++) {
			excludeCondition += "[related_id!='" + excludeIds[i] + "']";
		}
	}

	if (!this.activities || !this.activities[id]) {
		fillActivitiesFromWbs();
	}

	activityNode = this.activities[id] || queryCache.links.to[id];
	if (!activityNode) {
		var queryXml =
				"<Item type=\"Activity2\" id=\"" + id + "\" select=\"id\" action=\"get\">" +
				"	<Relationships>" +
				"		<Item type=\"Predecessor\" select=\"related_id\" related_expand=\"0\"/>" +
				"	</Relationships>" +
				"</Item>",
			qry = new aras.getMostTopWindowWithAras(window).Item(),
			results;

		qry.loadAML(queryXml);
		results = qry.apply();

		if (!results.isError()) {
			activityNode = results.getItemByIndex(0).node;
		}
		if (!activityNode) {
			aras.AlertError(aras.getResource("project", "common.can_not_find_activity2_with_id", id));
			return;
		}

		queryCache.links.to[id] = activityNode;
	}

	preds = activityNode.selectNodes("Relationships/Item[@type='Predecessor'][not(@action='delete')]" + excludeCondition);
	for (i = 0; i < preds.length; i++) {
		resultArray.push(aras.getItemProperty(preds[i], "related_id"));
	}

	return resultArray;
}

function initColumns2(RootITNm) {
	let columnItems;
	let resDom;

	if (RootITNm === "Project") {
		var preferenceSpecialId = "0A75EDA113F14432B058E781BAC5E65E",
			prefKey = aras.CreateCacheKey("Project Preference", preferenceSpecialId),
			res = aras.MetadataCache.GetItem(prefKey);

		if (res) {
			res = res.content;
		}
		else {
			const xml = '' +
			'<Item type="Preference" action="get">' +
				'<identity_id>' +
					'<Item type="Identity">' +
						'<name>World</name>' +
					'</Item>' +
				'</identity_id>' +
				'<Relationships>' +
					'<Item type="PM_ProjectGridLayout" action="get" select="name,label,width,is_system" orderBy="position">' +
						'<Relationships>' +
							'<Item type="PM_ProjectColumnDescription" select="row_type,data_source" />' +
						'</Relationships>' +
					'</Item>' +
				'</Relationships>' +
			'</Item>';
			res = aras.applyItem(xml);
			if (!res) {
				return;
			}
			resDom = aras.createXMLDocument();
			resDom.loadXML(res);
			res = resDom.selectSingleNode("//Item[@type='Preference']");
			const itm = aras.IomFactory.CreateCacheableContainer(res, res);
			aras.MetadataCache.SetItem(prefKey, itm);
		}
		columnItems = ArasModules.xml.selectNodes(res, 'Relationships/Item');
	}
	else if (RootITNm === "Project Template") {
		resDom = aras.createXMLDocument();
		resDom.load(aras.getI18NXMLResource("projectGridLayoutXML.xml", xmlFileBase + "../"));
		columnItems = ArasModules.xml.selectNodes(resDom, '//Item[@type="Preference"]/Relationships/Item');
	}
	
	const getColumnSources = function(sources, descriptionItem) {
		const rowType = aras.getItemProperty(descriptionItem, 'row_type');
		const dataSource = aras.getItemProperty(descriptionItem, 'data_source');
		sources[rowType] = {val: dataSource};

		return sources;
	};

	return columnItems.map(function(columnItem) {
		const descriptionItems = ArasModules.xml.selectNodes(columnItem, 'Relationships/Item[@type="PM_ProjectColumnDescription"]');
		return {
			is_system: aras.getItemProperty(columnItem, 'is_system') === '1',
			label: aras.getItemProperty(columnItem, 'label'),
			name: aras.getItemProperty(columnItem, 'name'),
			sources: descriptionItems.reduce(getColumnSources, {}),
			width: aras.getItemProperty(columnItem, 'width')
		};
	});
}

function _column(name, label, width, sources, is_system) {
	this.name = name;
	this.label = label;
	this.width = width;

	if (typeof (sources) === "string") {// properties, which are sources for the column, they are chosen depending on type of row
		var sources_obj = {};
		var elems = sources.split("|");

		for (var i = 0; i < elems.length; i++) {
			elem = elems[i];
			var val = elem.split(",");
			sources_obj[val[0]] = { val: val[1], xpath: null };
		}

		if (i > 0) {
			this.sources = sources_obj;
		}
		else {
			this.sources = null;
		}
	}
	else {
		this.sources = sources;
	}

	this.is_system = is_system;
}

function generateXSLT(RootITNm, columns) {
	var i, j, k;
	var column, col, th, attr;

	var xsltWbsDom = aras.createXMLDocument();
	var xsltWbsBranchDom = aras.createXMLDocument();

	if (RootITNm === "Project") {
		xsltWbsDom.load(stylesFileBase + "wbs.xsl");
		xsltWbsBranchDom.load(stylesFileBase + "wbs_branch.xsl");
	}
	else if (RootITNm === "Project Template") {
		xsltWbsDom.load(stylesFileBase + "template.xsl");
		xsltWbsBranchDom.load(stylesFileBase + "wbs_branch_template.xsl");
	}

	// reorder system columns
	var thead = xsltWbsDom.selectSingleNode("//thead");
	var ths = thead.selectNodes("th");
	var cols = xsltWbsDom.selectSingleNode("//columns");
	var inputrow = xsltWbsDom.selectSingleNode("//inputrow");
	var table = xsltWbsDom.selectSingleNode("//table");

	if (table) {
		table.setAttribute("editable", parent.isEditMode ? "true" : "false");
	}

	for (i = 0; i < ths.length; i++) {
		th = ths[i];
		fld[th.text] = i;
	}

	var lastIndex = ths.length;

	if (!columns) {
		columns = initColumns2(RootITNm);
		for (i = 0; i < columns.length; i++) {
			column = columns[i];

			for (var src in column.sources) {
				var v = column.sources[src].val;
				column.sources[src].xpath = getXPathForColumnSource(src, v);
				column.sources[src].params = getParamsForColumnSource(v);
			}
		}
	}

	//+++ inputformat attributes for plan_start and plan_finish tds are added +++
	var dateTds4SysCols = {};
	dateTds4SysCols["WBS Element"] = {};
	dateTds4SysCols.Activity2 = {};
	var doms = [xsltWbsDom, xsltWbsBranchDom];
	for (k in dateTds4SysCols) {
		dateTds4SysCols[k] = [{ tdNm: "Plan Start", inputformat: getDatePropertyPattern(k, "plan_start") }, { tdNm: "Plan Finish", inputformat: getDatePropertyPattern(k, "plan_finish") }];
	}

	if (RootITNm !== "Project Template") {
		for (k in dateTds4SysCols) {
			var arr = dateTds4SysCols[k];

			for (i = 0; i < arr.length; i++) {
				for (j = 0; j < doms.length; j++) {
					var td = doms[j].selectSingleNode("//tr[@type='" + k + "']/td[@name='" + arr[i].tdNm + "']");
					attr = doms[j].createElement("xsl:attribute");

					attr.setAttribute("name", "inputformat");
					attr.text = aras.getDotNetDatePattern(arr[i].inputformat);
					td.insertBefore(attr, td.selectSingleNode("./*"));
					attr = doms[j].createElement("xsl:attribute");
					attr.setAttribute("name", "sort");
					attr.text = "date";
					td.insertBefore(attr, td.selectSingleNode("./*"));
					attr = doms[j].createElement("xsl:attribute");
					attr.setAttribute("name", "locale");
					attr.text = aras.getSessionContextLocale();
					td.insertBefore(attr, td.selectSingleNode("./*"));
				}
			}
		}
	}
	//--- inputformat attributes for plan_start and plan_finish tds are added ---

	function addTds(dom) {
		var wbsSrc = column.sources[wbsRowType];
		var tr = dom.selectSingleNode("//tr[@type='" + getRowType(wbsRowType) + "']");
		var lastTd = tr.selectSingleNode("*[last() -1]");

		if (wbsSrc) {
			var wbsTd = getTd(wbsSrc.xpath, wbsSrc.params);
			addToTr(tr, lastTd, [{ td: wbsTd }]);
		}
		else {
			addToTr(tr, lastTd, [{ td: getTd() }]);
		}

		var actSrc = column.sources[actRowType];
		var milSrc = column.sources[milRowType];
		tr = dom.selectSingleNode("//tr[@type='" + getRowType(actRowType) + "']");
		lastTd = tr.selectSingleNode("*[last()]");
		var tds2add = [];

		if (actSrc) {
			var actTd = getTd(actSrc.xpath, actSrc.params);
			tds2add.push({ td: actTd, cond: "not(is_milestone='1')" });
		}
		else {
			tds2add.push({ td: getTd() });
		}

		if (milSrc) {
			var milTd = getTd(milSrc.xpath, milSrc.params);
			tds2add.push({ td: milTd, cond: "is_milestone='1'" });
		}
		else {
			tds2add.push({ td: getTd() });
		}
		addToTr(tr, lastTd, tds2add);

		function getTd(xpath, propParams) {
			var td = dom.createElement("td");

			if (xpath) {
				if (propParams && propParams.readonly == "1") {
					attr = dom.createElement("xsl:attribute");
					attr.setAttribute("name", "editable");
					attr.text = "false";
					td.appendChild(attr);
				}

				var valueOf;
				var doCommonPart = true;
				var ft = (propParams && propParams.field_type) ? propParams.field_type : "";

				switch (ft) {
					case "checkbox":
						valueOf = dom.createCDATASection("<checkbox state=\"");
						td.appendChild(valueOf);
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath);
						td.appendChild(valueOf);
						valueOf = dom.createCDATASection("\"/>");
						td.appendChild(valueOf);
						doCommonPart = false;
						break;
					case "item":
						var ifNode = dom.createElement("xsl:if");
						ifNode.setAttribute("test", "self::node()[ not(" + xpath + "/@is_null='1')]");
						attr = dom.createElement("xsl:attribute");
						attr.setAttribute("name", "link");
						textNode = dom.createTextNode("{");
						attr.appendChild(textNode);
						textNode = dom.createTextNode("id:\"");
						attr.appendChild(textNode);
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath);
						attr.appendChild(valueOf);
						textNode = dom.createTextNode("\",type:\"");
						attr.appendChild(textNode);
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath + "/@type");
						attr.appendChild(valueOf);
						textNode = dom.createTextNode("\"}");
						attr.appendChild(textNode);
						ifNode.appendChild(attr);
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath + "/@keyed_name");

						if (!parent.isEditMode) {
							td.appendChild(ifNode);
						}
						td.appendChild(valueOf);
						doCommonPart = false;
						break;
					case "color":
						attr = dom.createElement("xsl:attribute");
						attr.setAttribute("name", "bgColor");
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath);
						attr.appendChild(valueOf);
						td.appendChild(attr);
						doCommonPart = false;
						break;
					case "image":
						valueOf = dom.createCDATASection("<img src=\"");
						td.appendChild(valueOf);
						valueOf = dom.createElement("xsl:value-of");
						valueOf.setAttribute("select", xpath);
						td.appendChild(valueOf);
						valueOf = dom.createCDATASection("\"/>");
						td.appendChild(valueOf);
						doCommonPart = false;
						break;
					case "date":
						td.setAttribute("sort", "date");
						td.setAttribute("inputformat", aras.getDotNetDatePattern(propParams.pattern));
						break;
				}

				if (doCommonPart) {
					valueOf = dom.createElement("xsl:value-of");
					valueOf.setAttribute("select", xpath);
					td.appendChild(valueOf);
				}
			}
			else {
				td.text = " ";
				td.setAttribute("editable", "false");
			}

			return td;
		}

		function addToTr(tr, lastTd, arr) {// [{node:td node,cond:condition}]
			if (arr.length > 0) {
				var insNode;
				if (arr.length === 1 && !arr[0].cond) {
					insNode = arr[0].td;
				}
				else {// use xsl:choose
					insNode = dom.createElement("xsl:choose");
					var otherwiseNode = dom.createElement("xsl:otherwise");
					otherwiseNode.appendChild(getTd());

					for (var k = 0; k < arr.length; k++) {
						var whenNode = dom.createElement("xsl:when");
						var tmpCond = (arr[k].cond) ? arr[k].cond : "0";

						whenNode.setAttribute("test", tmpCond);
						whenNode.appendChild(arr[k].td);
						insNode.appendChild(whenNode);
					}
					insNode.appendChild(otherwiseNode);
				}

				tr.insertBefore(insNode, lastTd.nextSibling);
			}
		}
	}

	for (i = 0; i < columns.length; i++) {
		column = columns[i];

		if (column.is_system) {
			var idx = fld[column.name] + 1;
			col = cols.selectSingleNode("column[" + idx + "]");
			col.setAttribute("width", column.width);
			col.setAttribute("order", i);
			ths[idx - 1].text = column.label;
		}
		else {
			fld[column.name] = lastIndex++;

			addTds(xsltWbsDom);
			addTds(xsltWbsBranchDom);

			th = xsltWbsDom.createElement("th");
			th.setAttribute("align", "center");
			th.text = column.label;

			col = xsltWbsDom.createElement("column");
			col.setAttribute("order", i);
			col.setAttribute("width", column.width);

			thead.appendChild(th);
			cols.appendChild(col);
		}

		var inputTd = xsltWbsDom.createElement("td");
		inputTd.setAttribute("bgColor", "#BDDEF7");
		inputrow.appendChild(inputTd);
	}

	for (i = 0; i < columns.length; i++) {
		column = columns[i];
		fldToCol[fld[column.name]] = i;
	}

	var res = { xsltWbs: null, xsltWbsBranch: null };
	res.xsltWbs = xsltWbsDom.xml;
	res.xsltWbsBranch = xsltWbsBranchDom.xml;

	return res;
}

function getRowType(cellDataType) {
	var rowType;
	if (cellDataType === actRowType || cellDataType === milRowType) {
		rowType = "Activity2";
	}
	else if (cellDataType === wbsRowType) {
		rowType = "WBS Element";
	}
	else {
		aras.AlertError(aras.getResource("project", "gantt_methods.wrong_row_type", cellDataType));
		return;
	}

	return rowType;
}

// ++ actNums methods
var actNums;
function initActNums() {
	actNums = aras.createXMLDocument();
	var result = aras.applyMethod("GetActivitiesNumbers", "<rootWBS>" + wbsId + "</rootWBS>");
	actNums.loadXML(result);

	if (wbs.selectSingleNode("//Item[@action]")) {
		mergeActNums();
	}
}

function getActNum(id, rec) {
	var actNumNode = actNums.selectSingleNode("//a[@id='" + id + "']");

	if (!actNumNode && rec) {
		aras.AlertError(aras.getResource("project", "gantt_methods.no_activity_number_found_with_id", id)); return;
	}
	else if (!actNumNode && !treeIsFullyLoaded) {
		LoadFullTree_implementation();
		initActNums();
		return getActNum(id, true);
	}

	return actNumNode.getAttribute("number");
}

function checkActNum(num) {
	if (actNums.selectSingleNode("//a[@number='" + num + "']")) {
		return true;
	}
	return false;
}

function getActIdByNum(num) {
	var actNumNode = actNums.selectSingleNode("//a[@number='" + num + "']");

	if (!actNumNode) {
		aras.AlertError(aras.getResource("project", "gantt_methods.no_activity_id_found_with_num", num));
		return;
	}
	return actNumNode.getAttribute("id");
}

function mergeActNums() {
	var tmpActNums = aras.createXMLDocument();
	tmpActNums.loadXML("<Result><w id='" + wbsId + "' /></Result>");

	actNums = aras.createXMLDocument();

	var actNode = tmpActNums.selectSingleNode("//w[@id='" + wbsId + "']");
	recursiveAdd(wbs, actNode);

	var lastWs = tmpActNums.selectNodes("//w[not(*)]");
	for (var i = 0; i < lastWs.length; i++) {
		var lastW = lastWs[i];
		var id = lastW.getAttribute("id");
		var actW = actNums.selectSingleNode("//w[@id='" + id + "']");
		if (actW && !wbs.selectSingleNode("descendant::Item[@type='WBS Element'][@id='" + id + "']/Relationships/Item[@type='WBS Activity2' or @type='Sub WBS']")) {
			lastW.parentNode.replaceChild(actW.cloneNode(true), lastW);
		}
		else {
			lastW.parentNode.removeChild(lastW);
		}
	}

	actNums.loadXML(tmpActNums.xml);

	function recursiveAdd(wbsNode, actNode) {
		var treeItems = wbsNode.selectNodes("Relationships/Item[not(@action='delete')]/related_id/Item[not(@action='delete')]");

		for (var i = 0; i < treeItems.length; i++) {
			var treeItem = treeItems[i];
			var type = treeItem.getAttribute("type");
			var id = treeItem.getAttribute("id");

			if (type === "WBS Element") {
				var w = tmpActNums.createElement("w");
				w.setAttribute("id", id);
				actNode.appendChild(w);
				recursiveAdd(treeItem, w);
			}
			else if (type === "Activity2") {
				var a = tmpActNums.createElement("a");
				a.setAttribute("id", id);
				actNode.appendChild(a);
			}
		}
	}

	numberActsInOrder();
}

function numberActsInOrder() {
	var aNodes = actNums.selectNodes("/descendant::a");

	for (var i = 0; i < aNodes.length; i++) {
		aNodes[i].setAttribute("number", i + 1);
	}
}
// -- actNums methods

function sortItems(parentNode) {
	var typeXP = "[@type='WBS Activity2' or @type='Sub WBS']";
	var relationshipsNode = parentNode.selectSingleNode("Relationships");

	if (relationshipsNode) {
		var nextItem = parentNode.selectSingleNode("Relationships/Item" + typeXP + "[not(@action='delete')]/related_id/Item[not(prev_item) or prev_item='']");
		var beforeRel = relationshipsNode.firstChild;

		while (nextItem) {
			var nextRel = nextItem.parentNode.parentNode;
			if (nextItem.getAttribute("type") === "WBS Element") {
				sortItems(nextItem);
			}

			prevRel = relationshipsNode.insertBefore(nextRel, beforeRel);
			beforeRel = prevRel.nextSibling;
			prevItem = prevRel.selectSingleNode("related_id/Item");
			prevId = prevItem.getAttribute("id");
			nextItem = parentNode.selectSingleNode("Relationships/Item" + typeXP + "/related_id/Item[prev_item='" + prevId + "']");
		}
	}
}

function processPredecessors(node, xpath) {
	var predecessorTDs;
	if (xpath) {
		predecessorTDs = node.selectNodes(xpath);
	}
	else {
		predecessorTDs = node.selectNodes("descendant::tr/td[@name='Predecessor' and .!='']");
	}

	for (var i = 0; i < predecessorTDs.length; i++) {
		var predTD = predecessorTDs[i];
		var predVal = predTD.text;
		var predecessors = predVal.split(",");

		predVal = "";
		for (var j = 0; j < predecessors.length; j++) {
			var pred_content = predecessors[j].split("|"); //predecessor id | precedence type | lead lag
			var pred = pred_content[0];
			if (j !== 0) {
				predVal += ",";
			}
			var precType = (pred_content[1] !== undefined) ? pred_content[1] : "";
			var leadLag = (pred_content[2] !== undefined) ? pred_content[2] : "";
			predVal += getActNum(pred) + precType + leadLag;
		}

		predTD.text = predVal;
	}
}

function processNfields(node) {
	var nTDs = node.selectNodes("descendant::tr[@type='Activity2']/td[@name='N']");
	for (var i = 0; i < nTDs.length; i++) {
		var nTD = nTDs[i];
		var nTR = nTD.parentNode;
		var nID = nTR.getAttribute("id");

		nTD.text = getActNum(nID);
	}
}

function initColumns(step) {
	switch (step) {
		case 1:
			columns = initColumns2(RootITNm);
			break;
		case 2:
			for (var i = 0; i < columns.length; i++) {
				var column = columns[i];
				for (var src in column.sources) {
					var v = column.sources[src].val;
					column.sources[src].xpath = getXPathForColumnSource(src, v);
					column.sources[src].params = getParamsForColumnSource(v);
				}
			}
			break;
	}
}

// +++ ER

function getXPathForColumnSource(srcType, srcPath) {
	var rowType = getRowType(srcType);
	var qryDom = uniCache.queryDom;
	if (!qryDom) {
		if (!wbs) {
			return;
		}
		else {
			qryDom = wbs;
		}
	}

	var splitPath = srcPath.split("/");
	var xPath = "";
	var nextNode = qryDom.selectSingleNode("//Item[@type='" + splitPath[0] + "']");
	if (nextNode) {
		var chk = nextNode.selectSingleNode("ancestor-or-self::Item[@type='" + rowType + "']");
		if (!chk) {
			aras.AlertError(aras.getResource("project", "gantt_methods.wrong_rowtype_in_function", rowType, srcPath));
			return;
		}

		var unCycle = 100;
		while (nextNode.getAttribute("type") !== rowType) {
			xPath = "/" + xPath;
			if (nextNode.tagName === "Item") {
				xPath = "[@type='" + nextNode.getAttribute("type") + "'][not(@action='delete')]" + xPath;
			}
			xPath = nextNode.tagName + xPath;
			nextNode = nextNode.parentNode;
			if (--unCycle === 0) {
				aras.AlertError(aras.getResource("project", "gantt_methods.infinite_computational_loop"));
				return;
			}
		}
	}
	else if (splitPath[0] === "Deliverable") {
		if (rowType === "Activity2") {
			xPath = "Relationships/Item[@type='Activity2 Deliverable'][not(@action='delete')]/related_id/Item[not(@action='delete')]/";
		}
		else if (rowType === "WBS Element") {
			xPath = "Relationships/Item[@type='WBS Deliverable'][not(@action='delete')]/related_id/Item[not(@action='delete')]/";
		}
	}
	else if (splitPath[0] === "Identity") {
		xPath = "managed_by_id";
	}
	else {
		aras.AlertError(aras.getResource("project", "gantt_methods.wrong_rowtype_in_function", rowType, srcPath));
		return;
	}

	xPath += splitPath[1];
	return xPath;
}

/*
  returns new object hash: prop name -> prop value for some required properties of Item (type=Property) in item type from srcPath.
  srcPath - path to the column
*/
function getParamsForColumnSource(srcPath) {
	var requiredPropNames = new Array("data_type", "data_source", "readonly", "default_value", "name", "pattern");
	var retObj = {};
	var splitPath = srcPath.split("/");
	if (splitPath.length < 2) {
		return retObj;
	}

	var propName = splitPath[splitPath.length - 1],
		itemTypeName = splitPath[splitPath.length - 2],
		itemType = aras.getItemTypeDictionary(itemTypeName).node,
		propNd;

	if (!itemType) {
		aras.AlertError(aras.getResource("project", "gantt_methods.wrong_itemtypename_in_function"));
		return retObj;
	}

	try {
		propNd = itemType.selectSingleNode("Relationships/Item[@type='Property' and name='" + propName + "']");
	}
	catch (e) {
		aras.AlertError(aras.getResource("project", "gantt_methods.wrong_propname_in_function"));
		return retObj;
	}

	if (!propNd) {
		return retObj;
	}
	for (var i = 0; i < requiredPropNames.length; i++) {
		var cn = requiredPropNames[i];
		retObj[cn] = aras.getItemProperty(propNd, cn, null);
	}
	retObj.itemTypeName = itemTypeName;
	retObj.itemTypeId = itemType.getAttribute("id");
	retObj.field_type = aras.uiGetFieldType4Property(propNd);
	return retObj;
}