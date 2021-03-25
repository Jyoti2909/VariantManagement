// === varibles section =======
var GanttXml = null;
var GanttWnd = null;

var fldToCol = {}; // hash : [colId] -> [column index]
var fld = {}; // hash : [column name] -> [column order in initXML, also is colId]
/* default values:
0  - fld['tree_node']
1  - fld['n']
2  - fld['predecessor']
3  - fld['status']
4  - fld['leader']
5  - fld['plan_start']
6  - fld['plan_finish']
7  - fld['duration']
8  - fld['hours']
9  - fld['role']
10 - fld['attach']
*/

var wbsRowType = "wbs";
var actRowType = "act";
var milRowType = "mil";
var stylesFileBase = aras.getScriptsURL() + "../Solutions/Project/styles/";
var xmlFileBase = aras.getScriptsURL() + "../Solutions/Project/xml/";
var uniCache = { identities: {}, queryDom: null, xsltWbs: null, xsltWbsBranch: null };
var dateFormats = new Map();
dateFormats.set('planStartWBS Element', getCamelCasedDatePropertyPattern('WBS Element', 'plan_start'));
dateFormats.set('planStartActivity2', getCamelCasedDatePropertyPattern('Activity2', 'plan_start'));
dateFormats.set('planFinishWBS Element', getCamelCasedDatePropertyPattern('WBS Element', 'plan_finish'));
dateFormats.set('planFinishActivity2', getCamelCasedDatePropertyPattern('Activity2', 'plan_finish'));
// === end of varibles section =======

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

function generateSimpleGanttXml(wbsNode) {
	var resultNode = aras.createXMLDocument(),
		xml;

	copyDocs(wbsNode, resultNode);
	fillNumAndPredecessor(resultNode);
	xml = aras.applyXsltString(resultNode, viewShare.properties.xsltGantt);

	resultNode.loadXML(xml);
	processPredecessors(resultNode.documentElement, "//wbs/task/predecessor[.!='']");
	return resultNode;
}

function copyDocs(source, target) {
	source = source.documentElement || source;
	target.loadXML(source.cloneNode(false).xml);
	var nds = source.selectNodes("*");
	for (var i = 0; i < nds.length; i++) {
		target.documentElement.appendChild(nds[i].cloneNode(true));
	}
}

function generateGanttXml(wbsNode) {
	var resultNode = aras.createXMLDocument(),
		xml, i;

	copyDocs(wbsNode, resultNode);
	fillNumAndPredecessor(resultNode);
	xml = aras.applyXsltString(resultNode, viewShare.properties.xsltGantt);

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
		const generatedXSLT = generateXSLT('Project', ProjectPlan.columns);

		xsltString = generatedXSLT.xsltWbs;
		uniCache.xsltWbs = generatedXSLT.xsltWbs;
		uniCache.xsltWbsBranch = generatedXSLT.xsltWbsBranch;
	}

	var treeNode = aras.createXMLDocument();
	copyDocs(wbsNode, treeNode);

	//Clean empty Relationships
	var emptyRels = treeNode.selectNodes("descendant::Relationships[not(*)]");
	for (i = 0; i < emptyRels.length; i++) {
		emptyRels[i].parentNode.removeChild(emptyRels[i]);
	}

	var xml2 = aras.applyXsltString(treeNode, xsltString);
	treeNode.loadXML(xml2);
	processPredecessors(treeNode.documentElement);
	processNfields(treeNode.documentElement);

	resultNode.documentElement.appendChild(treeNode.documentElement.cloneNode(true));  //appended to "project/table"

	treeNode.loadXML("<clean_memory/>");

	// Remove input_row from tree xml.
	var tableNode = resultNode.selectSingleNode("/project/table");
	tableNode.setAttribute("editable", false);
	tableNode.removeChild(tableNode.selectSingleNode("inputrow"));
	tableNode.setAttribute("EXPANDALL", "true");

	return resultNode;
}

function fillActivitiesFromWbs() {
	if (!viewShare.properties.wbs) {
		return;
	}
	var activities = viewShare.properties.wbs.selectNodes("descendant::Item[@type='WBS Activity2' and not(@action='delete')]/related_id/Item[@type='Activity2']"),
		i;

	this.activities = {};

	for (i = 0; i < activities.length; i++) {
		this.activities[activities[i].getAttribute("id")] = activities[i];
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

function getDateFormat(headId, itemType){
	return dateFormats.has(headId + itemType) ? dateFormats.get(headId + itemType) : dateFormats.get(headId);
}

function generateXSLT(rootItemName, columns, customTreeGrid) {
	var xsltWbsDom = aras.createXMLDocument();
	var xsltWbsBranchDom = aras.createXMLDocument();

	if (rootItemName === "Project") {
		xsltWbsDom.load(stylesFileBase + "wbs.xsl");
		xsltWbsBranchDom.load(stylesFileBase + "wbs_branch.xsl");
	}
	else if (rootItemName === "Project Template") {
		xsltWbsDom.load(stylesFileBase + "template.xsl");
		xsltWbsBranchDom.load(stylesFileBase + "wbs_branch_template.xsl");
	}

	// reorder system columns
	var thead = xsltWbsDom.selectSingleNode("//thead"),
		ths = thead.selectNodes("th"),
		columnsNode = xsltWbsDom.selectSingleNode("//columns"),
		inputrow = xsltWbsDom.selectSingleNode("//inputrow"),
		table = xsltWbsDom.selectSingleNode("//table"),
		lastIndex = ths.length,
		column, columnNode, columnIndex, columnSource, columnSourceValue,
		tdNode, newNode,
		dateTds4SysCols = { "WBS Element": {}, "Activity2": {} },
		doms = [xsltWbsDom, xsltWbsBranchDom],
		th, i, j, k;

	if (table) {
		table.setAttribute("editable", parent.isEditMode ? "true" : "false");
	}

	for (i = 0; i < ths.length; i++) {
		th = ths[i];
		fld[th.text] = i;
	}

	//+++ inputformat attributes for plan_start and plan_finish tds are added +++

	if (customTreeGrid) {
		for (k in dateTds4SysCols) {
			dateTds4SysCols[k] = [
				{ tdName: "Plan Start", inputformat: getDatePropertyPattern(k, "plan_start") },
				{ tdName: "Plan Finish", inputformat: getDatePropertyPattern(k, "plan_finish") }
			];
		}

		if (rootItemName !== "Project Template") {
			for (k in dateTds4SysCols) {
				var arr = dateTds4SysCols[k];
	
				for (i = 0; i < arr.length; i++) {
					for (j = 0; j < doms.length; j++) {
						tdNode = doms[j].selectSingleNode("//tr[@type='" + k + "']/td[@name='" + arr[i].tdName + "']");

						newNode = doms[j].createElement("xsl:attribute");
						newNode.setAttribute("name", "inputformat");
						newNode.text = arr[i].inputformat;
						tdNode.insertBefore(newNode, tdNode.selectSingleNode("./*"));

						newNode = doms[j].createElement("xsl:attribute");
						newNode.setAttribute("name", "sort");
						newNode.text = "date";
						tdNode.insertBefore(newNode, tdNode.selectSingleNode("./*"));

						newNode = doms[j].createElement("xsl:attribute");
						newNode.setAttribute("name", "locale");
						newNode.text = aras.getSessionContextLocale();
						tdNode.insertBefore(newNode, tdNode.selectSingleNode("./*"));
					}
				}
			}
		}
	}
	//--- inputformat attributes for plan_start and plan_finish tds are added ---

	for (i = 0; i < columns.length; i++) {
		column = columns[i];

		if (column.isSystem) {
			columnIndex = fld[column.name] + 1;
			columnNode = columnsNode.selectSingleNode("column[" + columnIndex + "]");

			columnNode.setAttribute("width", column.width);
			columnNode.setAttribute("order", i);
			ths[columnIndex - 1].text = column.label;
		}
		else {
			fld[column.name] = lastIndex++;

			newNode = xsltWbsDom.createElement("column");
			newNode.setAttribute("order", i);
			newNode.setAttribute("width", column.width);
			newNode.setAttribute("name", column.name);
			newNode.setAttribute("align", "center");
			columnsNode.appendChild(newNode);

			var options = {
				columnName: column.name,
				columnNode: newNode,
				singleSource: Object.keys(column.sources).length === 1,
				sourceTypes: [],
				dropdownComboId: i + 2, // The COMBO ID number must start at 2, because COMBO:0 and COMBO:1 will be assigned later
				notSameTypeCheck: function(sourceTypeName) {
					return !this.sourceTypes.every(function(type) {
						return sourceTypeName === type;
					});
				}
			};

			xsltAddTds(xsltWbsDom, column, options); 
			xsltAddTds(xsltWbsBranchDom, column);

			newNode = xsltWbsDom.createElement("th");
			newNode.text = column.label;
			thead.appendChild(newNode);
		}

		var inputTd = xsltWbsDom.createElement("td");
		inputTd.setAttribute("bgColor", "#BDDEF7");
		inputrow.appendChild(inputTd);
	}

	for (i = 0; i < columns.length; i++) {
		column = columns[i];
		fldToCol[fld[column.name]] = i;
	}

	return { xsltWbs: xsltWbsDom.xml, xsltWbsBranch: xsltWbsBranchDom.xml };
}

function xsltAddTds(dom, column, options) {
	var wbsSource = column.sources[wbsRowType],
		activitySource = column.sources[actRowType],
		milestoneSource = column.sources[milRowType],
		trNode, tdNode, lastTd,
		tdArray = [];

	trNode = dom.selectSingleNode("//tr[@type='" + getRowType(wbsRowType) + "']");
	lastTd = trNode.selectSingleNode("*[last() -1]");

	if (wbsSource) {
		tdNode = xsltCreateTd(dom, wbsSource, options);
		xsltAddToTr(dom, trNode, lastTd, [{ td: tdNode }]);
	}
	else {
		xsltAddToTr(dom, trNode, lastTd, [{ td: xsltCreateTd(dom) }]);
	}

	trNode = dom.selectSingleNode("//tr[@type='" + getRowType(actRowType) + "']");
	lastTd = trNode.selectSingleNode("*[last()]");

	if (activitySource) {
		tdNode = xsltCreateTd(dom, activitySource, options);
		tdArray.push({ td: tdNode, cond: "not(is_milestone='1')" });
	}
	else {
		tdArray.push({ td: xsltCreateTd(dom) });
	}

	if (milestoneSource) {
		tdNode = xsltCreateTd(dom, milestoneSource, options);
		tdArray.push({ td: tdNode, cond: "is_milestone='1'" });
	}
	else {
		tdArray.push({ td: xsltCreateTd(dom) });
	}

	xsltAddToTr(dom, trNode, lastTd, tdArray);
}

function xsltCreateTd(dom, source, options) {
	var tdNode = dom.createElement("td");
	var xpath = source ? source.xpath: undefined;
	if (xpath) {
		var propParams = source.params;
		var fieldType = (propParams && propParams.field_type) ? propParams.field_type : "",
			doCommonPart = true,
			valueOfNode, attributeNode, ifNode, textNode;

		if (propParams && propParams.readonly == "1") {
			attributeNode = dom.createElement("xsl:attribute");
			attributeNode.setAttribute("name", "editable");
			attributeNode.text = "false";

			tdNode.appendChild(attributeNode);
		}

		if (options) {
			options.sourceTypes.push(fieldType);
		}

		switch (fieldType) {
			case "checkbox":
				valueOfNode = dom.createCDATASection("<checkbox state=\"");
				tdNode.appendChild(valueOfNode);

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath);
				tdNode.appendChild(valueOfNode);

				valueOfNode = dom.createCDATASection("\"/>");
				tdNode.appendChild(valueOfNode);

				doCommonPart = false;
				break;
			case "item":
				ifNode = dom.createElement("xsl:if");
				ifNode.setAttribute("test", "self::node()[ not(" + xpath + "/@is_null='1')]");

				attributeNode = dom.createElement("xsl:attribute");
				attributeNode.setAttribute("name", "link");

				textNode = dom.createTextNode("{");
				attributeNode.appendChild(textNode);

				textNode = dom.createTextNode('"id":"');
				attributeNode.appendChild(textNode);

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath);
				attributeNode.appendChild(valueOfNode);

				textNode = dom.createTextNode('","type":"');
				attributeNode.appendChild(textNode);

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath + "/@type");
				attributeNode.appendChild(valueOfNode);

				textNode = dom.createTextNode("\"}");
				attributeNode.appendChild(textNode);
				ifNode.appendChild(attributeNode);

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath + "/@keyed_name");

				tdNode.appendChild(ifNode);
				tdNode.appendChild(valueOfNode);

				doCommonPart = false;

				if (options) {
					options.columnNode.setAttribute('edit', 'InputHelper');
					options.columnNode.setAttribute('dataSourceName', aras.getItemTypeName(propParams.data_source));
				}
				break;
			case "color":
				attributeNode = dom.createElement("xsl:attribute");
				attributeNode.setAttribute("name", "bgColor");

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath);

				attributeNode.appendChild(valueOfNode);
				tdNode.appendChild(attributeNode);

				if (options) {
					options.columnNode.setAttribute('edit', 'color');
				}

				doCommonPart = false;
				break;
			case "image":
				valueOfNode = dom.createCDATASection("<img src=\"");
				tdNode.appendChild(valueOfNode);

				valueOfNode = dom.createElement("xsl:value-of");
				valueOfNode.setAttribute("select", xpath);
				tdNode.appendChild(valueOfNode);

				valueOfNode = dom.createCDATASection("\"/>");
				tdNode.appendChild(valueOfNode);

				doCommonPart = false;
				break;
			case "date":
				var inputformat = propParams.pattern || getDatePropertyPattern(propParams.itemTypeName, xpath);
				tdNode.setAttribute("inputformat", inputformat);
				tdNode.setAttribute("sort", "date");
				if (options) {
					options.columnNode.setAttribute('edit', 'dateTime');
					options.columnNode.setAttribute('sort', 'DATE');
					dateFormats.set(options.columnName + propParams.itemTypeName, getCamelCased(inputformat));
				}
				break;
			case "dropdown":
				if (options) {
					var columnsNode = options.columnNode.parentNode;
					var tableNode = columnsNode.parentNode;
					var listNode = tableNode.selectSingleNode('./list[@sourceid="' + propParams.data_source + '"]');
					if (!listNode) {
						options.columnNode.setAttribute('edit', 'COMBO:' + options.dropdownComboId);
						listNode = dom.createElement('list');
						listNode.setAttribute('id', options.dropdownComboId);
						listNode.setAttribute('sourceid', propParams.data_source);
						tableNode.insertBefore(listNode, columnsNode);
					} else {
						options.columnNode.setAttribute('edit', 'COMBO:' + listNode.getAttribute('id'));
					}
				}
				break;
		}

		if (options && options.notSameTypeCheck(fieldType)) {
			options.columnNode.removeAttribute('edit');
		}

		if (doCommonPart) {
			valueOfNode = dom.createElement("xsl:value-of");
			valueOfNode.setAttribute("select", xpath);
			tdNode.appendChild(valueOfNode);
		}
	}
	else {
		tdNode.text = " ";
		tdNode.setAttribute("editable", "false");
	}

	return tdNode;
}

function xsltAddToTr(dom, trNode, lastTd, arr) {// [{node:td node,cond:condition}]
	if (arr.length > 0) {
		var insertNode;

		if (arr.length === 1 && !arr[0].cond) {
			insertNode = arr[0].td;
		}
		else {// use xsl:choose
			var otherwiseNode = dom.createElement("xsl:otherwise"),
				whenNode, whenCondition,
				i;

			insertNode = dom.createElement("xsl:choose");
			otherwiseNode.appendChild(xsltCreateTd(dom));

			for (i = 0; i < arr.length; i++) {
				whenNode = dom.createElement("xsl:when");
				whenCondition = (arr[i].cond) ? arr[i].cond : "0";

				whenNode.setAttribute("test", whenCondition);
				whenNode.appendChild(arr[i].td);
				insertNode.appendChild(whenNode);
			}
			insertNode.appendChild(otherwiseNode);
		}

		trNode.insertBefore(insertNode, lastTd.nextSibling);
	}
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

var cachedActNums = {};

function prepareActNums() {
	cachedActNums = {};
	var nodes = actNums.selectNodes('//a');
	var length = nodes.length;
	for (var i = 0; i < length; i++) {
		var node = nodes[i];
		cachedActNums[node.getAttribute("id")] = node.getAttribute("number");
	}
}

function getActNum(id, rec) {
	return cachedActNums[id] || '';
}

function checkActNum(num) {
	return !!getActIdOrNullByNum(num);
}

function getActIdOrNullByNum(num) {
	var keys = Object.keys(cachedActNums);
	return keys.find(function(element) {
		return cachedActNums[element] === num;
	});
}

function getActIdByNum(num) {
	var actId = getActIdOrNullByNum(num);

	if (!actId) {
		aras.AlertError(aras.getResource("project", "gantt_methods.no_activity_id_found_with_num", num));
		return;
	}
	return actId;
}

function mergeActNums() {
	var tempActNums, rootItemNode, lastWBSNodes,
		itemNode, oldItemNode, itemId, i;

	tempActNums = aras.createXMLDocument();
	tempActNums.loadXML("<Result><w id='" + wbsId + "' /></Result>");

	rootItemNode = tempActNums.selectSingleNode("//w[@id='" + wbsId + "']");
	recursiveAdd(viewShare.properties.wbs, rootItemNode);

	lastWBSNodes = tempActNums.selectNodes("//w[not(*)]");
	for (i = 0; i < lastWBSNodes.length; i++) {
		itemNode = lastWBSNodes[i];
		itemId = itemNode.getAttribute("id");
		oldItemNode = actNums.selectSingleNode("//w[@id='" + itemId + "']");

		if (oldItemNode && !viewShare.properties.wbs.selectSingleNode("descendant::Item[@type='WBS Element'][@id='" + itemId + "']/Relationships/Item[@type='WBS Activity2' or @type='Sub WBS']")) {
			itemNode.parentNode.replaceChild(oldItemNode.cloneNode(true), itemNode);
		}
		else {
			itemNode.parentNode.removeChild(itemNode);
		}
	}

	actNums = aras.createXMLDocument();
	actNums.loadXML(tempActNums.xml);

	numberActsInOrder();
}

function recursiveAdd(wbsNode, targetNode) {
	var wbsItems = wbsNode.selectNodes("Relationships/Item[not(@action='delete')]/related_id/Item[not(@action='delete')]"),
		itemNode, itemType, itemId,
		newNode, i;

	for (i = 0; i < wbsItems.length; i++) {
		itemNode = wbsItems[i];
		itemType = itemNode.getAttribute("type");
		itemId = itemNode.getAttribute("id");

		if (itemType === "WBS Element") {
			newNode = targetNode.ownerDocument.createElement("w");
			newNode.setAttribute("id", itemId);
			targetNode.appendChild(newNode);

			recursiveAdd(itemNode, newNode);
		}
		else if (itemType === "Activity2") {
			newNode = targetNode.ownerDocument.createElement("a");
			newNode.setAttribute("id", itemId);
			targetNode.appendChild(newNode);
		}
	}
}

function numberActsInOrder() {
	var aNodes = actNums.selectNodes("/descendant::a"),
		i;

	for (i = 0; i < aNodes.length; i++) {
		aNodes[i].setAttribute("number", i + 1);
	}
}
// -- actNums methods

function sortItems(parentNode) {
	var typesFilter = "[@type='WBS Activity2' or @type='Sub WBS']",
		relationshipsNode = parentNode.selectSingleNode("Relationships");

	if (relationshipsNode) {
		var nextItem = parentNode.selectSingleNode("Relationships/Item" + typesFilter + "[not(@action='delete')]/related_id/Item[not(prev_item) or prev_item='']"),
			beforeRel = relationshipsNode.firstChild,
			nextRel;

		while (nextItem) {
			nextRel = nextItem.parentNode.parentNode;

			if (nextItem.getAttribute("type") === "WBS Element") {
				sortItems(nextItem);
			}

			prevRel = relationshipsNode.insertBefore(nextRel, beforeRel);
			beforeRel = prevRel.nextSibling;
			prevItem = prevRel.selectSingleNode("related_id/Item");
			prevId = prevItem.getAttribute("id");
			nextItem = parentNode.selectSingleNode("Relationships/Item" + typesFilter + "/related_id/Item[prev_item='" + prevId + "']");
		}
	}
}

var cachedPredecessors = new Map();
function initPredecessors(rows, isAddRows) {
	if (!isAddRows) {
		cachedPredecessors.clear();
	}
	ArasModules.xml.selectNodes(viewShare.properties.wbs, '//Item[@type="Activity2"]/Relationships/Item[@type="Predecessor" and not(@action="delete")]/../..')
		.forEach(function (pred) {
			var rowId = pred.getAttribute('id');
			if (!rows.has(rowId)) { 
				return;
			}

			var row = rows.get(rowId);
			var nodeText = row.predecessor.split(',')
				.reduce(function(predString, predecessor) {
					var predecessorData = predecessor.split('|');
					var predNum = getActNum(predecessorData[0]);
					if (!predNum) {
						return predString;
					}

					var precedenceType = predecessorData[1] ? predecessorData[1] : '';
					var leadLag = predecessorData[2] ? predecessorData[2] : '';

					return predString + (predString.length ? ',' : '') + predNum + precedenceType + leadLag;
				}, '');

			cachedPredecessors.set(rowId, nodeText);
		});
}

function setPredecessorValue(itemId, value) {
	cachedPredecessors.set(itemId, value);
}

function getPredecessorValue(itemId) {
	return cachedPredecessors.get(itemId) || '';
}

function processPredecessors(node, xpath) {
	var predecessorTDs, tdNode, nodeText,
		predecessors, predecessorData, id, precedenceType, leadLag,
		i, j;

	if (xpath) {
		predecessorTDs = node.selectNodes(xpath);
	}
	else {
		predecessorTDs = node.selectNodes("descendant::tr/td[@name='Predecessor' and .!='']");
	}

	for (i = 0; i < predecessorTDs.length; i++) {
		tdNode = predecessorTDs[i];
		nodeText = tdNode.text;
		predecessors = nodeText.split(",");

		nodeText = "";
		for (j = 0; j < predecessors.length; j++) {
			predecessorData = predecessors[j].split("|"); //predecessor: id | precedence type | lead lag

			id = predecessorData[0];
			precedenceType = (predecessorData[1] !== undefined) ? predecessorData[1] : "";
			leadLag = (predecessorData[2] !== undefined) ? predecessorData[2] : "";

			nodeText += (j > 0 ? "," : "") + getActNum(id) + precedenceType + leadLag;
		}

		tdNode.text = nodeText;
	}
}

function processNfields(node) {
	var tdNodes = node.selectNodes("descendant::tr[@type='Activity2']/td[@name='N']"),
		tdNode, trNode, nodeId, i;

	for (i = 0; i < tdNodes.length; i++) {
		tdNode = tdNodes[i];
		trNode = tdNode.parentNode;
		nodeId = trNode.getAttribute("id");

		tdNode.text = getActNum(nodeId);
	}
}

// +++ ER
function getXPathForColumnSource(srcType, srcPath) {
	var qryDom = uniCache.queryDom || viewShare.properties.wbs;

	if (!qryDom) {
		return;
	}

	var rowType = getRowType(srcType),
		splitPath = srcPath.split("/"),
		xPath = "",
		nextNode = qryDom.selectSingleNode("//Item[@type='" + splitPath[0] + "']");

	if (nextNode) {
		var itemNode = nextNode.selectSingleNode("ancestor-or-self::Item[@type='" + rowType + "']"),
			cycleCounter = 100;

		if (!itemNode) {
			aras.AlertError(aras.getResource("project", "gantt_methods.wrong_rowtype_in_function", rowType, srcPath));
			return;
		}

		while (nextNode.getAttribute("type") !== rowType) {
			xPath = "/" + xPath;

			if (nextNode.tagName === "Item") {
				xPath = "[@type='" + nextNode.getAttribute("type") + "'][not(@action='delete')]" + xPath;
			}

			xPath = nextNode.tagName + xPath;
			nextNode = nextNode.parentNode;

			if (--cycleCounter === 0) {
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
	var requiredPropNames = ["data_type", "data_source", "readonly", "default_value", "name", "pattern"],
		resultObject = {},
		splitPath = srcPath.split("/");

	if (splitPath.length >= 2) {
		var propName = splitPath[splitPath.length - 1],
			itemTypeName = splitPath[splitPath.length - 2],
			itemType = aras.getItemTypeDictionary(itemTypeName).node,
			propNd, columnName, i;

		if (!itemType) {
			aras.AlertError(aras.getResource("project", "gantt_methods.wrong_itemtypename_in_function"));
			return resultObject;
		}

		try {
			propNd = itemType.selectSingleNode("Relationships/Item[@type='Property' and name='" + propName + "']");
		}
		catch (e) {
			aras.AlertError(aras.getResource("project", "gantt_methods.wrong_propname_in_function"));
			return resultObject;
		}

		if (propNd) {
			for (i = 0; i < requiredPropNames.length; i++) {
				columnName = requiredPropNames[i];
				resultObject[columnName] = aras.getItemProperty(propNd, columnName, null);
			}

			resultObject.itemTypeName = itemTypeName;
			resultObject.itemTypeId = itemType.getAttribute("id");
			resultObject.field_type = aras.uiGetFieldType4Property(propNd);
		}
	}

	return resultObject;
}