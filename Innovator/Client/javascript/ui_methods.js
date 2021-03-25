// (c) Copyright by Aras Corporation, 2004-2011.

///--- User Interface methods ---///
/*
 * uiShowItem
 *
 * parameters:
 * 1) itemTypeName - may be empty string if item is in client cache
 * 2) itemID       - obligatory
 * 3) viewMode     - 'tab view' or 'openFile'
 *                    if not specified aras.getVariable('viewMode') is used
 * 4) isTearOff    - true or false, if not specified aras.getVariable('TearOff') is used
 */
Aras.prototype.uiShowItem = function (
	itemTypeName,
	itemID,
	viewMode,
	isUnfocused
) {
	if (!itemID) return false;
	viewMode = viewMode || 'tab view';
	var itemNd = this.getItemById(itemTypeName, itemID, 0, undefined, '*');

	if (!itemNd) {
		this.AlertError(
			this.getResource(
				'',
				'ui_methods.access_restricted_or_not_exist',
				itemTypeName
			)
		);
		return false;
	}
	return this.uiShowItemEx(itemNd, viewMode, null, isUnfocused);
};

/*
 * uiReShowItem
 *
 * parameters:
 * 1) oldItemId- old id of item to be shown
 * 2) itemId   - id of item to be shown //usually itemId==oldItemId
 * 2) editMode - 'view' or 'edit'
 * 3) viewMode - 'tab view', ' or 'openFile'
 * 4) isTearOff- true or false.
 */
Aras.prototype.uiReShowItem = function (oldItemId, itemId, editMode, viewMode) {
	if (!oldItemId || !itemId) return false;

	var itemNd = this.getItemById('', itemId, 0);
	if (!itemNd) return false;

	if (editMode === undefined || editMode.search(/^view$|^edit$/) === -1) {
		if (
			this.isTempID(itemId) ||
			this.getNodeElement(itemNd, 'locked_by_id') === this.getCurrentUserID()
		)
			editMode = 'edit';
		else editMode = 'view';
	}

	viewMode = viewMode || 'tab view';

	return this.uiReShowItemEx(oldItemId, itemNd, viewMode);
};

Aras.prototype.uiViewXMLInFrame = function Aras_uiViewXMLInFrame(
	frame,
	xmldoc,
	expandNodes
) {
	if (!frame) return;
	var xsldoc = this.createXMLDocument();
	var baseUrl = this.getBaseURL();
	xsldoc.load(baseUrl + '/styles/default.xsl');
	try {
		//TODO: there should be a better way to check if method setProperty is supported on xsldoc
		xsldoc.setProperty(
			'SelectionNamespaces',
			'xmlns:xsl="http://www.w3.org/1999/XSL/Transform"'
		);
	} catch (excep) {}
	xsldoc
		.selectSingleNode('./xsl:stylesheet/xsl:param')
		.setAttribute('select', "boolean('" + expandNodes + "')");
	frame.document.write(xmldoc.transformNode(xsldoc));
};

Aras.prototype.uiViewXMLstringInFrame = function Aras_uiViewXMLstringInFrame(
	frame,
	string,
	expandNodes
) {
	if (!frame) return;
	var xmldoc = this.createXMLDocument();
	xmldoc.loadXML(string);

	this.uiViewXMLInFrame(frame, xmldoc, expandNodes);
};

Aras.prototype.uiFieldGetValue = function (uiField) {
	var uiForm = uiField.form;
	var name = uiField.name;
	var type = uiField.type;
	var value = null,
		i;

	if (uiField.field_type === 'item') value = uiField.internal_value;
	else if (type.search(/^text|^hidden$/) === 0) {
		if (uiField.internal_value) value = uiField.internal_value;
		else value = uiField.value;
	} else if (type === 'password') {
		if (uiField.pwdChanged === 1) value = calcMD5(uiField.value);
		else value = uiField.internal_value;
	} else if (type === 'checkbox') value = uiField.checked ? 1 : 0;
	else if (type === 'select-one') {
		if (uiField.selectedIndex !== -1)
			value = uiField.options[uiField.selectedIndex].value;
	} else if (type === 'radio') {
		///SNNicky: check!!!!!
		value = '';
		for (i = 0; i < uiForm[name].length; i++) {
			if (uiForm[name][i].checked) {
				value = uiForm[name][i].value;
				break;
			}
		}
	} else if (type === 'checkbox_group') {
		value = '';
		for (i = 0; i < uiForm[name].length; i++) {
			if (uiForm[name][i].checked) {
				if (value !== '') value += ',';
				value += uiForm[name][i].value;
			}
		}
	}
	this.AlertError(name + ':' + value, '', ''); //what does this do??
	return value;
};

Aras.prototype.getvisiblePropsForItemType = function Aras_getVisiblePropsForItemType(
	currItemType
) {
	var itemTypeName = this.getItemProperty(currItemType, 'name');
	var itemTypeId = currItemType.getAttribute('id');
	var nodes_tmp = [];
	var cols = this.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'col_order'
		),
		i;

	var visiblePropNds = currItemType.selectNodes(
		this.getVisiblePropertiesXPath(itemTypeName)
	);

	if (cols) {
		cols = cols.split(';');

		if (
			visiblePropNds.length === cols.length ||
			visiblePropNds.length + 1 === cols.length
		) {
			for (i = 0; i < visiblePropNds.length; i++) {
				var propNm = this.getItemProperty(visiblePropNds[i], 'name');
				for (var j = 0; j < cols.length; j++) {
					if (propNm + '_D' === cols[j]) {
						nodes_tmp[j] = visiblePropNds[i];
						break;
					}
				}
				if (j === cols.length) {
					cols = null;
					break;
				}
			}
		} else {
			cols = null;
		}
	}
	if (!cols) {
		visiblePropNds = this.sortProperties(visiblePropNds);
	} else {
		visiblePropNds = [];
		for (i = 0; i < nodes_tmp.length; i++) {
			if (nodes_tmp[i] !== undefined) visiblePropNds.push(nodes_tmp[i]);
		}
	}

	return visiblePropNds;
};

Aras.prototype.uiInitItemsGridSetups = function Aras_uiInitItemsGridSetups(
	currItemType,
	visibleProps
) {
	var itemTypeName = this.getItemProperty(currItemType, 'name');
	var itemTypeId = currItemType.getAttribute('id'),
		i;

	const xProperties = currItemType.selectNodes(
		"Relationships/Item[@type='xItemTypeAllowedProperty' and not(inactive='1')]/related_id/Item[@type='xPropertyDefinition']"
	);
	var propLength = xProperties.length;
	for (i = 0; i < propLength; i++) {
		var prop = xProperties[i];
		visibleProps.push(prop);
	}

	if (!itemTypeName) return null;
	var self = this;
	//  var _itemTypeName_ = itemTypeName.replace(/\s/g, '_');

	var varsHash = {};

	var gridSetups = this.sGridsSetups[itemTypeName];
	if (!gridSetups) {
		gridSetups = this.newObject();
		this.sGridsSetups[itemTypeName] = gridSetups;
	}

	var colWidths = this.getPreferenceItemProperty(
		'Core_ItemGridLayout',
		itemTypeId,
		'col_widths'
	);
	var colOrder = this.getPreferenceItemProperty(
		'Core_ItemGridLayout',
		itemTypeId,
		'col_order'
	);

	var flg =
		colWidths === null ||
		colWidths === '' ||
		colOrder === null ||
		colOrder === '' ||
		colWidths.split(';').length !== colOrder.split(';').length;

	function CheckCorrectColumnsInfo(arr, suffix) {
		if (!arr) return;

		for (var i = 0; i < arr.length; i++) {
			var colNm = self.getItemProperty(arr[i], 'name') + '_' + suffix;
			var re = new RegExp('(^|;)' + colNm + '(;|$)');
			if (colOrder.search(re) === -1) {
				flg = true;
				break;
			}
			colOrder = colOrder.replace(re, '$1$2');
		}
	}

	if (!flg) {
		//check if already saved setups are valid
		colOrder = colOrder.replace(/(^|;)L($|;)/, '$1$2');

		if (!flg) CheckCorrectColumnsInfo(visibleProps, 'D');
		if (!flg) {
			colOrder = colOrder.replace(/;/g, '');
			if (colOrder !== '') flg = true;
		}
	}

	if (flg) {
		colOrder = this.newArray();
		colWidths = this.newArray();
		colOrder[0] = 'L';
		colWidths[0] = 32;

		for (i = 0; i < visibleProps.length; i++) {
			var visibleProp = visibleProps[i];
			var name = this.getItemProperty(visibleProp, 'name') + '_D';
			var width;
			if (name.startsWith('xp-')) {
				width = 0;
			} else {
				width = parseInt(this.getItemProperty(visibleProp, 'column_width'));
				if (isNaN(width) || width === 0) width = 100;
			}

			colOrder.push(name);
			colWidths.push(width);
		}

		varsHash.col_widths = colWidths.join(';');
		varsHash.col_order = colOrder.join(';');
	} else {
		colWidths = colWidths.split(';');
		flg = false;

		//check for zero-width columns
		for (i = 0; i < colWidths.length; i++) {
			var newVal = parseInt(colWidths[i]);
			if (isNaN(newVal) || newVal < 0) {
				newVal =
					i === 0
						? 32
						: parseInt(
								this.getItemProperty(visibleProps[i - 1], 'column_width')
						  );
				if (isNaN(newVal) || newVal <= 0) newVal = 100;
				colWidths[i] = newVal;
				flg = true;
			}
		}

		if (flg) {
			varsHash.col_widths = colWidths.join(';');
		}
	}

	this.setPreferenceItemProperties('Core_ItemGridLayout', itemTypeId, varsHash);
};

Aras.prototype.uiInitRelationshipsGridSetups = function Aras_uiInitRelationshipsGridSetups(
	relationshiptypeID,
	Dprops,
	Rprops,
	grid_view
) {
	if (!grid_view) {
		grid_view = 'left';
	}

	var self = this,
		prop,
		i;

	var colWidths = this.getPreferenceItemProperty(
		'Core_RelGridLayout',
		relationshiptypeID,
		'col_widths'
	);
	var colOrder = this.getPreferenceItemProperty(
		'Core_RelGridLayout',
		relationshiptypeID,
		'col_order'
	);

	var flg =
		colWidths === null ||
		colWidths === '' ||
		colOrder === null ||
		colOrder === '' ||
		colWidths.split(';').length !== colOrder.split(';').length;

	function CheckCorrectColumnsInfo(arr, suffix) {
		if (!arr) return;

		for (var i = 0; i < arr.length; i++) {
			var colNm = self.getItemProperty(arr[i], 'name') + '_' + suffix;
			var re = new RegExp('(^|;)' + colNm + '(;|$)');
			if (colOrder.search(re) === -1) {
				flg = true;
				break;
			}
			colOrder = colOrder.replace(re, '$1$2');
		}
	}

	function getColumnDefaultWidth(colNum) {
		var colNm = colOrder[colNum];
		if (colNm === 'L') return 32;

		var DR = colNm.substr(colNm.length - 1);
		var propNm = colNm.substr(0, colNm.length - 2);

		var propArr = null;
		if (DR === 'D') propArr = Dprops;
		else if (DR === 'R') propArr = Rprops;

		if (propArr) {
			for (var i = 0; i < propArr.length; i++) {
				var prop = propArr[i];
				if (self.getItemProperty(prop, 'name') === propNm) {
					var column_width = parseInt(
						self.getItemProperty(prop, 'column_width')
					);
					if (isNaN(column_width)) {
						column_width = propNm.startsWith('xp-') ? 0 : 100;
					}
					return column_width;
				}
			}
		}

		return 100;
	}

	if (!flg) {
		//check if already saved setups are valid
		if (Rprops) colOrder = colOrder.replace(/(^|;)L($|;)/, '$1$2');

		if (!flg) CheckCorrectColumnsInfo(Dprops, 'D');
		if (!flg) CheckCorrectColumnsInfo(Rprops, 'R');
		if (!flg) {
			colOrder = colOrder.replace(/;/g, '');
			if (colOrder !== '') flg = true;
		}

		if (!flg) {
			colOrder = this.getPreferenceItemProperty(
				'Core_RelGridLayout',
				relationshiptypeID,
				'col_order'
			);
			colWidths = colWidths.split(';');
			flg = false;

			//check for zero-width columns
			for (i = 0; i < colWidths.length; i++) {
				var newVal = parseInt(colWidths[i]);
				if (isNaN(newVal) || newVal < 0) {
					newVal = getColumnDefaultWidth(i);
					colWidths[i] = newVal;
					flg = true;
				}
			}

			if (flg)
				this.setPreferenceItemProperties(
					'Core_RelGridLayout',
					relationshiptypeID,
					{ col_widths: colWidths.join(';') }
				);

			return;
		}
	}

	colOrder = this.newArray();
	colWidths = this.newArray();
	if (Rprops) {
		colOrder[0] = 'L';
		colWidths[0] = 32;
	}

	// +++ sort columns
	var Dpriority = 0,
		Rpriority = 0;
	if (grid_view === 'left') {
		//related item goes first
		Dpriority = 1;
		Rpriority = 0;
	} else if (grid_view === 'intermix') {
		Dpriority = 0;
		Rpriority = 0;
	} else {
		Dpriority = 0;
		Rpriority = 1;
	}

	var allPropsInfoArr = [];
	if (Dprops) {
		for (i = 0; i < Dprops.length; i++) {
			prop = Dprops[i];

			allPropsInfoArr.push({
				name: this.getItemProperty(prop, 'name') + '_D',
				width: this.getItemProperty(prop, 'column_width'),
				sort_order: this.getItemProperty(prop, 'sort_order'),
				default_search: this.getItemProperty(prop, 'default_search'),
				priority: Dpriority
			});
		}
	}

	if (Rprops) {
		for (i = 0; i < Rprops.length; i++) {
			prop = Rprops[i];

			allPropsInfoArr.push({
				name: this.getItemProperty(prop, 'name') + '_R',
				width: this.getItemProperty(prop, 'column_width'),
				sort_order: this.getItemProperty(prop, 'sort_order'),
				default_search: this.getItemProperty(prop, 'default_search'),
				priority: Rpriority
			});
		}
	}

	function sorterF(p1, p2) {
		var c1 = parseInt(p1.priority);
		var c2 = parseInt(p2.priority);

		if (c1 < c2) return -1;
		else if (c2 < c1) return 1;
		else {
			c1 = parseInt(p1.sort_order);
			c2 = parseInt(p2.sort_order);

			if (isNaN(c2)) return -1;
			if (isNaN(c1)) return 1;

			if (c1 < c2) return -1;
			else if (c2 < c1) return 1;
			else {
				c1 = p1.name;
				c2 = p2.name;

				if (c1 < c2) return -1;
				else if (c2 < c1) return 1;
				else return 0;
			}
		}
	}

	allPropsInfoArr = allPropsInfoArr.sort(sorterF);
	// --- sort columns

	for (i = 0; i < allPropsInfoArr.length; i++) {
		const propName = allPropsInfoArr[i].name;
		colOrder.push(propName);

		var width = parseInt(allPropsInfoArr[i].width);
		if (isNaN(width)) {
			width = propName.startsWith('xp-') ? 0 : 100;
		}
		colWidths.push(width);
	}

	this.setPreferenceItemProperties('Core_RelGridLayout', relationshiptypeID, {
		col_widths: colWidths.join(';'),
		col_order: colOrder.join(';')
	});
};

Aras.prototype.uiToggleCheckbox = function (uiField) {
	uiField.checked = uiField.checked ? false : true;
};

Aras.prototype.uiGenerateGridXML = function Aras_uiGenerateGridXML(
	inDom,
	Dprops,
	Rprops,
	typeID,
	params,
	getCached
) {
	var key = this.MetadataCache.CreateCacheKey('uiGenerateGridXML', typeID);
	if (params) {
		for (var k in params) {
			//k can be undefined in IE9 if one of param keyes was empty string, i.e. params[""] = ""
			//evaluating value by index: params[""] gives right value, but evaluating it with 'for' gives undefined value.
			if (k) {
				var additionalParam = k;
				if (params[k]) {
					if (typeof params[k] === 'object') {
						additionalParam += '=' + JSON.stringify(params[k]);
					} else {
						additionalParam += '=' + params[k];
					}
				}
				key.push(additionalParam);
			}
		}
	}

	var xsl = this.MetadataCache.GetItem(key);
	if (xsl) xsl = xsl.content;

	var mainArasObj = this.findMainArasObject();
	if (xsl && (getCached === undefined || getCached === true)) {
	} else {
		var sXsl = this.uiGenerateGridXSLT(Dprops, Rprops, params, typeID);

		xsl = mainArasObj.createXMLDocument();
		xsl.loadXML(sXsl);
		var itemTypeNd = this.getItemTypeNodeForClient(typeID, 'id');
		this.MetadataCache.SetItem(
			key,
			this.IomFactory.CreateCacheableContainer(xsl, itemTypeNd)
		);
	}
	var res = inDom.transformNode(xsl);

	//replaces VaultURL by FullFileURL
	var self = this;
	var FixVaultUrl = function (str, srcTag, vaultPrefix, fileId, fullStr) {
		var fileUrl = self.IomInnovator.getFileUrl(
			fileId,
			self.Enums.UrlType.SecurityToken
		);
		fileUrl = self.browserHelper.escapeUrl(fileUrl);
		return srcTag + fileUrl + '"';
	};

	//replaces all "src" attributes starting with "vault:///"
	var FixImageCellSrc = function (str, offsetPos, fullStr) {
		return str.replace(/(src=")(vault:\/\/\/\?fileid\=)([^"]*)"/i, FixVaultUrl);
	};

	//search all <td> elements with attribute fdt="image"
	var resultXML = res.replace(
		/<td fdt="image"[^>]*?>.*?<\/td>/gi,
		FixImageCellSrc
	);

	//if font-size property exist we should limit cell height by line-height property
	resultXML = resultXML.replace(
		/(<td [^>]*? css=.*?)(font-size)/g,
		'$1line-height:15px; $2'
	);

	return resultXML;
};

Aras.prototype.uiPrepareTableWithColumns = function Aras_uiPrepareTableWithColumns(
	inDom,
	columnObjects
) {
	//columnObjects: {name, order, width}
	this.uiPrepareDOM4GridXSLT(inDom);

	var tableNd = inDom.selectSingleNode(this.XPathResult('/table'));
	tableNd.setAttribute('editable', 'false');

	var columns = tableNd.selectSingleNode('columns');
	var inputrow = tableNd.selectSingleNode('inputrow');

	// make inputrow invisible by default.
	inputrow.setAttribute('visible', 'false');

	columnObjects.forEach(function (columnObject) {
		var column = inDom.createElement('column');
		column.setAttribute('name', columnObject.name);
		column.setAttribute('order', columnObject.order);
		column.setAttribute('width', columnObject.width);
		columns.appendChild(column);
		var td = inDom.createElement('td');
		inputrow.appendChild(td);
	});
};

Aras.prototype.uiPrepareDOM4XSLT = function Aras_uiPrepareDOM4XSLT(
	inDom,
	itemTypeID,
	RTorITPrefix,
	colWidths,
	colOrder
) {
	var prefTp = GetPrefixItemTypeName(RTorITPrefix);

	var colWidthsArr = colWidths
		? colWidths.split(';')
		: this.getPreferenceItemProperty(prefTp, itemTypeID, 'col_widths').split(
				';'
		  );
	var colOrderArr = colOrder
		? colOrder.split(';')
		: this.getPreferenceItemProperty(prefTp, itemTypeID, 'col_order').split(
				';'
		  );

	const columnObjects = colOrderArr.map(function (colOrder, i) {
		return {
			name: colOrder,
			order: i,
			width: colWidthsArr[i]
		};
	});

	this.uiPrepareTableWithColumns(inDom, columnObjects);

	function GetPrefixItemTypeName(prefix) {
		if (!prefix) prefix = 'IT_';

		var result;
		if (prefix === 'IT_') {
			result = 'Core_ItemGridLayout';
		} else {
			result = 'Core_RelGridLayout';
		}
		return result;
	}

	return columnObjects;
};

Aras.prototype.uiGenerateItemsGridXML = function Aras_uiGenerateItemsGridXML(
	inDom,
	props,
	itemtypeID,
	params
) {
	return this.uiGenerateGridXML(inDom, props, undefined, itemtypeID, params);
}; //uiGenerateItemsGridXML

Aras.prototype.uiGenerateRelationshipsGridXML = function Aras_uiGenerateRelationshipsGridXML(
	inDom,
	Dprops,
	Rprops,
	itemTypeId,
	params,
	getCached
) {
	//itemTypeId is id of "is relationship" ItemType
	return this.uiGenerateGridXML(
		inDom,
		Dprops,
		Rprops,
		itemTypeId,
		params,
		getCached
	);
}; //uiGenerateRelationshipsGridXML

Aras.prototype.uiGenerateParametersGrid = function Aras_uiGenerateParametersGrid(
	itemTypeName,
	classification
) {
	/*----------------------------------------
	 * uiGenerateParametersGrid
	 *
	 * Purpose:
	 * sends request to Innovator Server to generate xml for parameters grid for
	 * specified ItemType and classification. Returns xml string.
	 *
	 * Arguments:
	 * itemTypeName - name of ItemType
	 * classification - classification of an Item
	 */

	var res = null;
	if (itemTypeName && classification) {
		var classificationDom = this.createXMLDocument();
		classificationDom.loadXML('<Item><classification /></Item>');
		classificationDom.documentElement.setAttribute('type', itemTypeName);
		classificationDom.selectSingleNode(
			'Item/classification'
		).text = classification;
		res = this.soapSend('GenerateParametersGrid', classificationDom.xml);
		res = res.getResult().selectSingleNode('table');
	}

	if (res) {
		var tmp = res.selectSingleNode('thead');
		var pNd = tmp.selectSingleNode("th[.='Property']");
		if (pNd) pNd.text = this.getResource('', 'advanced_search.property');

		var vNd = tmp.selectSingleNode("th[.='Value']");
		if (vNd) vNd.text = this.getResource('', 'ui_methods.value');
		res = res.xml;
	} else {
		var emptyTableXML =
			"<table editable='true' font='Arial-8' draw_grid='true' enableHtml='false' enterAsTab='false' bgInvert='false' " +
			" onStart='onGridLoad' onEditCell='onParamsGridCellEdit' onXMLLoaded='onXmlLoaded' " +
			" onKeyPressed='onGridKeyPressed' >" +
			'<thead>' +
			" <th align='center'>" +
			this.getResource('', 'advanced_search.property') +
			'</th>' +
			" <th align='center'>" +
			this.getResource('', 'ui_methods.value') +
			'</th>' +
			" <th align='center'>" +
			this.getResource('', 'parametersgrid.sort_order') +
			'</th>' +
			'</thead>' +
			'<columns>' +
			" <column width='20%' edit='NOEDIT' align='left' order='0'/>" +
			" <column width='70%' edit='FIELD' align='left' order='1'/>" +
			" <column width='10%' edit='NOEDIT' align='left' order='2'/>" +
			'</columns>' +
			'</table>';

		res = emptyTableXML;
	}

	var resDom = this.createXMLDocument();
	resDom.loadXML(res);

	return resDom;
};

Aras.prototype.uiIsParamTabVisible = function Aras_uiIsParamTabVisible(
	itemNd,
	itemTypeName
) {
	var paramTabProperties = this.uiIsParamTabVisibleEx(itemNd, itemTypeName);
	return paramTabProperties.show;
};

Aras.prototype.uiGenerateRelationshipsTabbar = function Aras_uiGenerateRelationshipsTabbar(
	itemTypeName,
	itemID
) {
	var res = null;
	var itemType;
	if (itemTypeName) itemType = this.getItemTypeNodeForClient(itemTypeName);
	if (itemType && itemTypeName && itemID) {
		var cachedTabbar = this.getItemProperty(
			itemType,
			'relationships_tabbar_xml'
		);
		if (cachedTabbar && cachedTabbar.indexOf('<exclusions') < 0) {
			res = { xml: cachedTabbar };
		} else {
			res = this.soapSend(
				'GenerateRelationshipsTabbar',
				"<Item type='" + itemTypeName + "' id='" + itemID + "'/>"
			);
			res = res.getResult().selectSingleNode('tabbar');
		}
	}

	if (res) {
		res = res.xml;
	} else {
		var emptyTableXML = '<tabbar/>';

		res = emptyTableXML;
	}

	var resDom = this.createXMLDocument();
	resDom.loadXML(res);

	return resDom;
};

Aras.prototype.uiGenerateRelationshipsTable = function Aras_uiGenerateRelationshipsTable(
	itemTypeName,
	itemID,
	relationshiptypeID
) {
	var res = null;
	if (itemTypeName && itemID) {
		res = this.soapSend(
			'GenerateRelationshipsTable',
			"<Item type='" +
				itemTypeName +
				"' id='" +
				itemID +
				"' relationshiptype='" +
				relationshiptypeID +
				"'/>"
		);
		res = res.getResult().xml;
	} else {
		res = '<Result />';
	}

	var resDom = this.createXMLDocument();
	resDom.loadXML(res);

	return resDom;
};

Aras.prototype.uiPrepareDOM4GridXSLT = function Aras_uiPrepareDOM4GridXSLT(
	dom
) {
	/*
	adds <table editable="true"><columns /><inputrow/></table> to Envelope Body Result.

	removes previous entry <table> entry
	*/
	var res = dom.selectSingleNode(this.XPathResult());
	var tableNd = res.selectSingleNode('table');
	if (tableNd) res.removeChild(tableNd);

	tableNd = res.appendChild(dom.createElement('table'));
	tableNd.appendChild(dom.createElement('columns'));
	tableNd.appendChild(dom.createElement('inputrow'));
};

Aras.prototype.uiGenerateGridXSLT = function Aras_uiGenerateGridXSLT(
	DescByProps_Arr,
	RelatedProps_Arr,
	params,
	typeID
) {
	var self = this;

	if (params === undefined) {
		params = {};
	}

	const findColumnByPropertyName = function (propertyName, columnObj) {
		return propertyName === columnObj.name;
	};

	const columnObjects = params['columnObjects'];
	var itemTypeName = this.getItemTypeName(typeID);
	var showLockColumn = Boolean(
		RelatedProps_Arr === undefined || RelatedProps_Arr
	);
	var table_xpath = self.XPathResult('/table');
	var enable_links =
		params.enable_links === undefined || params.enable_links === true;
	var enableFileLinks = Boolean(params.enableFileLinks);
	var generateOnlyRows = true === params.only_rows;
	var params_bgInvert =
		params.bgInvert === undefined || params.bgInvert === false
			? 'false'
			: 'true';
	const isMultiselect = !!params.multiselect;

	var columnsXSLT = [];
	var theadXSLT = [];
	var listsXSLT = [];
	let absoluteColumnOrder = -1;

	// +++ create header row
	function AddHeaderColumn(header) {
		theadXSLT.push(
			'<th align="c">' + self.escapeXMLAttribute(header) + '</th>'
		);
	}

	function AddHeaderColumns(propsArr) {
		var f2Header = ' [...]';

		if (!propsArr) return;
		for (var i = 0; i < propsArr.length; i++) {
			var prop = propsArr[i];
			var propName = self.getItemProperty(prop, 'name');
			var header = self.getItemProperty(prop, 'label');
			if (header === '') header = propName;

			var dataType = self.getItemProperty(prop, 'data_type');
			if (dataType === 'item') {
				var propDS = self.getItemProperty(prop, 'data_source');
				if (propDS) {
					var it = self.getItemTypeName(propDS);
					if (it) header += f2Header;
				}
			} else if (
				dataType === 'date' ||
				dataType === 'text' ||
				dataType === 'image' ||
				dataType === 'formatted text' ||
				dataType === 'color'
			) {
				header += f2Header;
			}

			AddHeaderColumn(header);
		}
	}

	if (!generateOnlyRows) {
		theadXSLT.push('<thead>');

		if (showLockColumn) AddHeaderColumn('');

		AddHeaderColumns(DescByProps_Arr);

		AddHeaderColumns(RelatedProps_Arr);

		theadXSLT.push('</thead>');
		// --- create header row
	}

	var lists = this.newObject();
	var reservedListsNum = 2; //because we reserve 2 lists for special needs (e.g. build properties list for filter list pattern in relationships grid)
	var listNum = reservedListsNum - 1;
	var i;

	// +++ create columns
	function AddColumn(
		name,
		width,
		order,
		edit,
		align,
		sortStr,
		bgInvert,
		password,
		textColorInvert,
		flyWeightType,
		dataSourceName
	) {
		columnsXSLT.push('<column ');

		if (edit) {
			columnsXSLT.push("edit='" + edit + "' ");
		}
		if (align) {
			columnsXSLT.push("align='" + align + "' ");
		}
		if (bgInvert) {
			columnsXSLT.push("bginvert='" + bgInvert + "' ");
		}
		if (password) {
			columnsXSLT.push("password='" + password + "' ");
		}
		if (textColorInvert) {
			columnsXSLT.push("textcolorinvert='" + textColorInvert + "' ");
		}
		if (name) {
			columnsXSLT.push("colname='" + name + "' ");
		}
		if (flyWeightType) {
			columnsXSLT.push("type='" + flyWeightType + "' ");
		}
		if (dataSourceName) {
			columnsXSLT.push("dataSourceName='" + dataSourceName + "' ");
		}
		if (sortStr) {
			columnsXSLT.push(sortStr);
		}
		if (width !== undefined) {
			columnsXSLT.push(' width="' + width + '" ');
		}
		if (order !== undefined) {
			columnsXSLT.push('order="' + order + '" ');
		}

		columnsXSLT.push('>');
		columnsXSLT.push('</column>');
	}

	function AddColumns(propsArr, suffix) {
		if (!propsArr) return;

		let propNameWithSuffix;

		for (var i = 0; i < propsArr.length; i++) {
			absoluteColumnOrder++;
			var prop = propsArr[i],
				propName = self.getItemProperty(prop, 'name'),
				header = self.getItemProperty(prop, 'label') || propName,
				data_type = self.getItemProperty(prop, 'data_type'),
				isForeign = data_type === 'foreign',
				isInBasketTask = typeID === self.getItemTypeId('InBasket Task'),
				column_alignment = self.getItemProperty(prop, 'column_alignment'),
				locale = ' locale="' + self.getSessionContextLocale() + '"',
				bgInvert,
				textColorInvert,
				password,
				flyWeightType,
				format = '',
				sortStr = '',
				editStr = '';

			propNameWithSuffix = propName + suffix;
			let column_width;
			let column_order;
			if (columnObjects) {
				const columnObject = columnObjects.find(
					findColumnByPropertyName.bind(null, propNameWithSuffix)
				);
				column_width = columnObject.width;
				column_order = columnObject.order;
			}

			column_order = column_order || absoluteColumnOrder.toString();
			column_width =
				column_width || aras.getItemProperty(prop, 'column_width') || '100';

			column_alignment = column_alignment ? column_alignment.charAt(0) : '1';

			if (isForeign) {
				var sourceProperty = self.uiMergeForeignPropertyWithSource(prop, true);
				if (sourceProperty) {
					prop = sourceProperty;
					data_type = self.getItemProperty(prop, 'data_type');
				}
			}

			if (data_type.search(/list$/) != -1) {
				var listInfo = self.newObject();
				listInfo.listID = self.getItemProperty(prop, 'data_source');
				listInfo.listType = data_type;

				listNum++;
				lists[listNum] = listInfo;
				editStr = (data_type == 'mv_list' ? 'MV_LIST:' : 'COMBO:') + listNum;
			} else {
				editStr = 'FIELD';
			}

			let dataSourceName;
			switch (data_type) {
				case 'date':
					format = self.getItemProperty(prop, 'pattern');
					format = self.getDotNetDatePattern(format) || 'MM/dd/yyyy';
					editStr = 'dateTime';
					sortStr = 'sort="DATE" inputformat="' + format + '"' + locale;
					break;
				case 'decimal':
					format = self.getDecimalPattern(
						self.getItemProperty(prop, 'prec'),
						self.getItemProperty(prop, 'scale')
					);
					sortStr =
						'sort="NUMERIC"' +
						(format ? ' inputformat="' + format + '"' : '') +
						locale;
					break;
				case 'integer':
				case 'float':
					sortStr =
						'sort="NUMERIC"' +
						(format ? ' inputformat="' + format + '"' : '') +
						locale;
					break;
				case 'ubigint':
				case 'global_version':
					sortStr =
						'sort="UBIGINT"' +
						(format ? ' inputformat="' + format + '"' : '') +
						locale;
					break;
				case 'color list':
				case 'color':
					bgInvert = 'false';
					textColorInvert = 'true';
					break;
				case 'md5':
					password = 'true';
					break;
				case 'image':
					flyWeightType = 'IMAGE';
					break;
				case 'item':
					const dataSource = self.getItemProperty(prop, 'data_source');
					dataSourceName = dataSource ? self.getItemTypeName(dataSource) : '';

					if (dataSourceName == 'File') {
						editStr = 'File';
					} else if (!isForeign) {
						editStr = 'InputHelper';
					}
					break;
				default:
					break;
			}

			if (
				isInBasketTask &&
				('start_date' === propName || 'due_date' === propName)
			) {
				bgInvert = 'false';
				textColorInvert = 'true';
			}

			AddColumn(
				propNameWithSuffix,
				column_width,
				column_order,
				editStr,
				column_alignment,
				sortStr,
				bgInvert,
				password,
				textColorInvert,
				flyWeightType,
				dataSourceName
			);
			dataSourceName = null;
		}
	}

	if (!generateOnlyRows) {
		let lockColumnListIndex;

		columnsXSLT.push('<columns>');
		if (showLockColumn) {
			lockColumnListIndex = ++listNum;
			let lockColumnOrder;
			if (columnObjects) {
				const lockColumnInfo = columnObjects.find(
					findColumnByPropertyName.bind(null, 'L')
				);
				lockColumnOrder = lockColumnInfo.order;
			}
			AddColumn(
				'L',
				'32',
				lockColumnOrder,
				'COMBO:' + lockColumnListIndex,
				'l',
				''
			);
		}
		AddColumns(DescByProps_Arr, '_D');
		AddColumns(RelatedProps_Arr, '_R');
		columnsXSLT.push('</columns>');
		// --- create columns

		// +++ create lists
		//reserve reservedListsNum lists for special needs
		for (let idx = 0; idx < reservedListsNum; idx++) {
			listsXSLT.push('<list id="' + idx + '"/>');
		}

		if (showLockColumn) {
			const imageStyle =
				'margin-right: 4px; height: auto; width: auto; max-width: 20px; max-height: 20px;';
			const resoucePrefix = 'claimed';
			const valuesList = [
				'',
				"<img src='../images/ClaimOn.svg' style='" + imageStyle + "' />",
				"<img src='../images/ClaimOther.svg' style='" + imageStyle + "' />",
				"<img src='../images/ClaimAnyone.svg' style='" + imageStyle + "' />"
			];
			const optionsList = [
				"<span style='padding: 0 22px;'>" +
					this.getResource('', 'itemsgrid.locked_criteria_ppm.clear_criteria') +
					'</span>',
				"<img src='../images/ClaimOn.svg' align='left' style='" +
					imageStyle +
					"' />" +
					this.getResource(
						'',
						'itemsgrid.locked_criteria_ppm.' + resoucePrefix + '_by_me'
					),
				"<img src='../images/ClaimOther.svg' align='left' style='" +
					imageStyle +
					"' />" +
					this.getResource(
						'',
						'itemsgrid.locked_criteria_ppm.' + resoucePrefix + '_by_others'
					),
				"<img src='../images/ClaimAnyone.svg' align='left' style='" +
					imageStyle +
					"' />" +
					this.getResource(
						'',
						'itemsgrid.locked_criteria_ppm.' + resoucePrefix + '_by_anyone'
					)
			];

			listsXSLT.push('<list id="' + lockColumnListIndex + '">');
			for (i = 0; i < optionsList.length; i++) {
				listsXSLT.push(
					'<listitem value="' +
						this.escapeXMLAttribute(valuesList[i]) +
						'" label="' +
						this.escapeXMLAttribute(optionsList[i]) +
						'" />'
				);
			}
			listsXSLT.push('</list>');
		}
	}

	//prepare to request all lists values
	var reqListsArr = this.newArray();
	for (var listIdx in lists) {
		var listInfo = lists[listIdx];
		var relType;
		if (listInfo.listType == 'filter list') {
			relType = 'Filter Value';
		} else {
			relType = 'Value';
		}

		var listDescr = this.newObject();
		listDescr.id = listInfo.listID;
		listDescr.relType = relType;

		reqListsArr.push(listDescr);
	}

	if (reqListsArr.length > 0) {
		var resLists = this.getSeveralListsValues(reqListsArr);

		for (var listNum2 in lists) {
			var listInfo2 = lists[listNum2];

			listsXSLT.push('<list id="' + listNum2 + '">');
			if (listInfo2.listType != 'mv_list') {
				listsXSLT.push('<listitem value="" label="" />');
			}

			var listVals = resLists[listInfo2.listID];
			if (listVals) {
				for (i = 0; i < listVals.length; i++) {
					var valNd = listVals[i];
					var val = this.getItemProperty(valNd, 'value');
					var lab = this.getItemProperty(valNd, 'label');
					if (lab === '') lab = val;
					val = this.escapeXMLAttribute(val);
					lab = this.escapeXMLAttribute(lab);
					listsXSLT.push(
						'<listitem value="' + val + '" label="' + lab + '" />'
					);
				}
			}
			listsXSLT.push('</list>');
		}
	}
	// --- create lists

	var resXSLTArr = [];
	resXSLTArr.push(
		'<xsl:stylesheet version="1.0" ' +
			'xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
			'xmlns:msxsl="urn:schemas-microsoft-com:xslt" ' +
			'xmlns:aras="http://www.aras.com" '
	);

	this.browserHelper.addXSLTSpecialNamespaces(resXSLTArr);
	resXSLTArr.push('>\n');
	this.browserHelper.addXSLTCssFunctions(resXSLTArr);

	resXSLTArr.push(
		'<xsl:output method="xml" version="1.0" omit-xml-declaration="yes" cdata-section-elements="td" encoding="UTF-8"/>' +
			'<xsl:template match="text()|@*">\n' +
			'  <xsl:value-of select="."/>\n' +
			'</xsl:template>\n' +
			'<xsl:template match="/">\n' +
			'<table editable="true" ' +
			'itemTypeID="' +
			typeID +
			'" ' +
			'font="Dialog-8" enableHTML="false" ' +
			'link_func="onLink" draw_grid="true" multiselect="' +
			isMultiselect +
			'" column_draggable="true" ' +
			'enterAsTab="false" bgInvert="' +
			params_bgInvert +
			'" onClick="onSelectItem" onDoubleClick="onDoubleClick" ' +
			'onStart="onGridAppletLoad" onEditCell="onEditCell" onMenuInit="onMenuCreate" ' +
			'onMenuClick="onMenuClicked" onXMLLoaded="onXmlLoaded" onKeyPressed="onKeyPressed">' +
			'<xsl:apply-templates select="//Result" />\n' +
			'</table>\n' +
			'</xsl:template>\n' +
			'<xsl:template match="columns">\n' +
			theadXSLT.join('') +
			columnsXSLT.join('') +
			'</xsl:template>\n'
	);

	if (!generateOnlyRows) {
		resXSLTArr.push(
			'<xsl:template match="inputrow">\n' +
				'	<inputrow visible="{@visible}" bgColor="#BDDEF7">\n' +
				'		<xsl:for-each select="td">\n' +
				'			<td/>\n' +
				'		</xsl:for-each>\n' +
				'	</inputrow>\n' +
				'</xsl:template>\n'
		);
	}

	resXSLTArr.push(
		'<xsl:template match="Result">\n' +
			'	<xsl:variable name="isEditable" select="table/@editable"/>\n' +
			'	<xsl:if test="$isEditable != \'\'">\n' +
			'		<xsl:attribute name="editable">\n' +
			'			<xsl:value-of select="$isEditable"/>\n' +
			'		</xsl:attribute>\n' +
			'	</xsl:if>\n' +
			'<xsl:apply-templates select="table/columns"/>\n' +
			listsXSLT.join('') +
			'<xsl:apply-templates select="table/inputrow" />\n' +
			'<xsl:apply-templates select="Item">\n' +
			'	<xsl:with-param name="hasLockedByIdColumn" select="table/columns[count(columns) = 0] or table/columns/column[@name=\'L\']"/>\n' +
			'</xsl:apply-templates>\n' +
			'</xsl:template>\n' +
			'<xsl:template match="Item">\n' +
			'	<xsl:param name="hasLockedByIdColumn"/>\n' +
			'		<xsl:variable name="item-CSS">\n' +
			'			<xsl:choose>\n' +
			"				<xsl:when test=\"string(css) != '' or string(fed_css) != ''\">\n"
	);

	this.browserHelper.addXSLTInitItemCSSCall(
		resXSLTArr,
		'string(css)',
		'string(fed_css)'
	);

	resXSLTArr.push(
		'				</xsl:when>\n' +
			'				<xsl:otherwise>\n' +
			'					<xsl:value-of select="\'\'"/>\n' +
			'				</xsl:otherwise>\n' +
			'			</xsl:choose>\n' +
			'		</xsl:variable>\n'
	);

	if (RelatedProps_Arr) {
		resXSLTArr.push(
			'		<xsl:variable name="rItem-CSS">\n' +
				'			<xsl:choose>\n' +
				"				<xsl:when test=\"string(related_id/Item/css) != '' or string(related_id/Item/fed_css) != ''\">\n"
		);

		this.browserHelper.addXSLTInitItemCSSCall(
			resXSLTArr,
			'string(related_id/Item/css)',
			'string(related_id/Item/fed_css)'
		);

		resXSLTArr.push(
			'				</xsl:when>\n' +
				'				<xsl:otherwise>\n' +
				'					<xsl:value-of select="\'\'"/>\n' +
				'				</xsl:otherwise>\n' +
				'			</xsl:choose>\n' +
				'		</xsl:variable>\n'
		);
	}

	resXSLTArr.push(
		'<tr id="{@id}" action="{@id}">\n' +
			"	<xsl:if test=\"boolean(@action='purge' or @action='delete')\">\n" +
			'		<xsl:attribute name="textColor">\n' +
			'			<xsl:value-of select="\'#B0B0B0\'"/>\n' +
			'		</xsl:attribute>\n' +
			'		<xsl:attribute name="font">\n' +
			'			<xsl:value-of select="\'Arial-italic-8\'"/>\n' +
			'		</xsl:attribute>\n' +
			'	</xsl:if>\n'
	);

	// +++ lock icon
	if (showLockColumn) {
		resXSLTArr.push('<xsl:if test="$hasLockedByIdColumn">\n');
		resXSLTArr.push('<td>');

		if (RelatedProps_Arr) {
			resXSLTArr.push(
				"<xsl:if test=\"not(related_id/Item) and (not(related_id) or related_id='')\">&lt;img src='../images/NullRelated.svg'/&gt;</xsl:if>"
			);
			resXSLTArr.push(
				'<xsl:if test="related_id/Item"><xsl:for-each select="related_id/Item">'
			);
		}

		var currentUserID = this.getCurrentUserID();
		resXSLTArr.push(
			'<xsl:variable name="isTemp" select="boolean(@isTemp = \'1\')"/>\n' +
				'<xsl:variable name="isDirty" select="boolean(@isDirty = \'1\')"/>\n' +
				'<xsl:variable name="isEditState" select="boolean(@isEditState = \'1\')"/>\n' +
				'<xsl:variable name="locked_by_id" select="string(locked_by_id)"/>\n' +
				'<xsl:choose>\n' +
				"	<xsl:when test=\"$isTemp or $locked_by_id != '' or @discover_only='1'\">" +
				'		<xsl:choose>' +
				"			<xsl:when test=\"@discover_only='1'\">&lt;img src='../images/Blocked.svg'/&gt;</xsl:when>\n" +
				'			<xsl:otherwise>\n' +
				'				<xsl:if test="$isTemp">&lt;img src=\'../images/New.svg\'/&gt;</xsl:if>\n' +
				'				<xsl:if test="not($isTemp) and ($locked_by_id=\'' +
				currentUserID +
				"' or locked_by_id/Item[@id='" +
				currentUserID +
				'\'])">' +
				'					<xsl:if test="not($isDirty or $isEditState)">&lt;img src=\'../images/ClaimOn.svg\'/&gt;</xsl:if>' +
				'					<xsl:if test="$isDirty or $isEditState">&lt;img src=\'../images/Edit.svg\'/&gt;</xsl:if>' +
				'				</xsl:if>' +
				'				<xsl:if test="not($isTemp) and $locked_by_id != \'' +
				currentUserID +
				"' and not(locked_by_id/Item[@id='" +
				currentUserID +
				"']) and $locked_by_id != ''\">&lt;img src='../images/ClaimOther.svg'/&gt;</xsl:if>" +
				'			</xsl:otherwise>' +
				'		</xsl:choose>' +
				'	</xsl:when>' +
				"	<xsl:otherwise>&lt;img src=''/&gt;</xsl:otherwise>" +
				'</xsl:choose>'
		);

		if (RelatedProps_Arr) resXSLTArr.push('</xsl:for-each></xsl:if>');

		resXSLTArr.push('</td>\n');
		resXSLTArr.push('</xsl:if>');
	}
	// --- lock icon

	// ==== grid rows ===
	function GenerateRows(
		propsArr,
		xpath_prefix,
		special_td_attributes,
		cellCSSVariableName1
	) {
		if (!propsArr) return;

		var propItem,
			name,
			xpath,
			dataType,
			dataSource,
			dataSourceName,
			restrictedMsgCondition,
			i;

		for (i = 0; i < propsArr.length; ++i) {
			propItem = propsArr[i];
			name = self.getItemProperty(propItem, 'name');
			xpath = xpath_prefix + name;
			dataType = self.getItemProperty(propItem, 'data_type');
			restrictedMsgCondition =
				xpath +
				"[@is_null='0' and string(.)='']" +
				(xpath_prefix ? " or related_id[@is_null='0' and string(.)='']" : '');

			if ('foreign' == dataType) {
				var sourceProperty = self.uiMergeForeignPropertyWithSource(propItem);

				if (sourceProperty) {
					propItem = sourceProperty;
					dataType = self.getItemProperty(propItem, 'data_type');
				}
			}

			resXSLTArr.push(
				'<td fdt="' + dataType + '" ' + special_td_attributes + '>'
			);
			resXSLTArr.push(
				'<xsl:variable name="IsRestricted" select="boolean(' +
					restrictedMsgCondition +
					')"/>'
			);

			if (
				'item' == dataType ||
				'color' == dataType ||
				'color list' == dataType
			) {
				resXSLTArr.push('<xsl:if test="' + xpath + '">');

				if ('item' == dataType) {
					dataSource = propItem.selectSingleNode('data_source');
					dataSourceName = dataSource ? dataSource.getAttribute('name') : '';

					if (enable_links || (enableFileLinks && dataSourceName == 'File')) {
						var linkItemType = dataSourceName
							? "'" + dataSourceName + "'"
							: 'string(' + xpath + '/@type)';

						resXSLTArr.push(
							'<xsl:if test="not(' +
								xpath +
								"/@discover_only='1' or " +
								xpath +
								"/Item/@discover_only='1')\">\n" +
								'	<xsl:attribute name="link">\n' +
								'		<xsl:choose>' +
								'			<xsl:when test="' +
								xpath +
								"!='' and not(" +
								xpath +
								'/Item)">\n' +
								"				<xsl:text>'</xsl:text>\n" +
								'				<xsl:choose>\n' +
								'					<xsl:when test="' +
								xpath_prefix +
								"data_type='list' or " +
								xpath_prefix +
								"data_type='filter list' or " +
								xpath_prefix +
								"data_type='color list'\">\n" +
								'						<xsl:value-of select="\'List\'"/>\n' +
								'					</xsl:when>\n' +
								'					<xsl:when test="' +
								xpath_prefix +
								"data_type='sequence'\">\n" +
								'						<xsl:value-of select="\'Sequence\'"/>\n' +
								'					</xsl:when>\n' +
								'					<xsl:otherwise>\n' +
								'						<xsl:value-of select="' +
								linkItemType +
								'"/>\n' +
								'					</xsl:otherwise>\n' +
								'				</xsl:choose>\n' +
								"				<xsl:text>','</xsl:text>\n" +
								'				<xsl:value-of select="' +
								xpath +
								'"/>\n' +
								"				<xsl:text>'</xsl:text>\n" +
								'			</xsl:when>\n' +
								'			<xsl:when test="' +
								xpath +
								'/Item">\n' +
								"				<xsl:text>'</xsl:text>\n" +
								'				<xsl:choose>\n' +
								'					<xsl:when test="' +
								xpath_prefix +
								"data_type='list' or " +
								xpath_prefix +
								"data_type='filter list' or " +
								xpath_prefix +
								"data_type='color list'\">\n" +
								'						<xsl:value-of select="\'List\'"/>\n' +
								'					</xsl:when>\n' +
								'					<xsl:when test="' +
								xpath_prefix +
								"data_type='sequence'\">\n" +
								'						<xsl:value-of select="\'Sequence\'"/>\n' +
								'					</xsl:when>\n' +
								'					<xsl:otherwise>\n' +
								'						<xsl:value-of select="' +
								linkItemType +
								'"/>\n' +
								'					</xsl:otherwise>\n' +
								'				</xsl:choose>\n' +
								"				<xsl:text>','</xsl:text>\n" +
								'				<xsl:value-of select="' +
								xpath +
								'/Item/@id"/>\n' +
								"				<xsl:text>'</xsl:text>\n" +
								'			</xsl:when>\n' +
								'		</xsl:choose>' +
								'	</xsl:attribute>\n' +
								'</xsl:if>'
						);

						if (dataSourceName === 'File') {
							resXSLTArr.push(
								'<xsl:if test="not(' +
									xpath +
									"/@discover_only='1' or " +
									xpath +
									"/Item/@discover_only='1')\">\n" +
									'	<xsl:if test="' +
									xpath +
									'/Item">\n' +
									'		<xsl:attribute name="action">\n' +
									'			<xsl:value-of select="' +
									xpath +
									'/Item/@action"/>\n' +
									'		</xsl:attribute>\n' +
									'		<xsl:attribute name="filename">\n' +
									'			<xsl:value-of select="' +
									xpath +
									'/Item/filename"/>\n' +
									'		</xsl:attribute>\n' +
									'	</xsl:if>\n' +
									'</xsl:if>'
							);
						}
					}
				} else if ('color' == dataType || 'color list' == dataType) {
					resXSLTArr.push(
						'<xsl:variable name="goodColor" select="\'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\'"/>' +
							'<xsl:if test="starts-with(' +
							xpath +
							", '#') and string-length(translate(" +
							xpath +
							", $goodColor, '')) = 1 and string-length(" +
							xpath +
							') = 7">' +
							'	<xsl:attribute name="bgColor">' +
							'		<xsl:value-of select="' +
							xpath +
							'"/>' +
							'	</xsl:attribute>' +
							'</xsl:if>'
					);
				}

				resXSLTArr.push('</xsl:if>');
			}

			var nameCSS = name + '--CSS';
			resXSLTArr.push(
				'<xsl:if test="contains(string($' +
					cellCSSVariableName1 +
					"), '." +
					name +
					'\')">'
			);
			self.browserHelper.addXSLTGetPropertyStyleExCall(
				resXSLTArr,
				nameCSS,
				cellCSSVariableName1,
				name
			);

			resXSLTArr.push(
				'<xsl:attribute name="css">' +
				'	<xsl:value-of select="substring($' +
				nameCSS +
				', 2, string-length($' +
				nameCSS +
				') - 2)" />' + //remove first and last characters
					'</xsl:attribute>' +
					'	<xsl:if test="contains($' +
					nameCSS +
					", ';font:')\">" +
					'		<xsl:variable name="font" select="substring-before(substring-after($' +
					nameCSS +
					", ';font:'), ';')\" />" +
					'		<xsl:if test="$font!=\'\'"><xsl:attribute name="font">' +
					'			<xsl:value-of select="$font" />' +
					'		</xsl:attribute></xsl:if>' +
					'	</xsl:if>' +
					'</xsl:if>' +
					'<xsl:choose>' +
					'	<xsl:when test="$IsRestricted">' +
					'		<xsl:attribute name="textColor">' +
					'			<xsl:value-of select="\'#FF0000\'"/>' +
					'		</xsl:attribute>' +
					'		<xsl:value-of select="\'' +
					self.preserveTags(
						self.getResource('', 'common.restricted_property_warning')
					) +
					'\'" />' +
					'	</xsl:when>' +
					'	<xsl:otherwise>'
			);

			switch (dataType) {
				case 'item':
					var itemNameProperty =
						dataSourceName == 'File' ? 'filename' : 'id/@keyed_name';

					resXSLTArr.push(
						'<xsl:choose>' +
							'	<xsl:when test="' +
							xpath +
							"!='' and not(" +
							xpath +
							'/Item)">' +
							'		<xsl:choose>' +
							'			<xsl:when test="' +
							xpath +
							'/@keyed_name">' +
							'				<xsl:value-of select="' +
							xpath +
							'/@keyed_name" />' +
							'			</xsl:when>' +
							'			<xsl:otherwise>' +
							'				<xsl:value-of select="' +
							xpath +
							'" />' +
							'			</xsl:otherwise>' +
							'		</xsl:choose>' +
							'	</xsl:when>' +
							'	<xsl:when test="' +
							xpath +
							'/Item">' +
							'		<xsl:choose>' +
							'			<xsl:when test="' +
							xpath +
							'/Item/@keyed_name">' +
							'				<xsl:value-of select="' +
							xpath +
							'/Item/@keyed_name" />' +
							'			</xsl:when>' +
							'			<xsl:otherwise>' +
							'				<xsl:value-of select="' +
							xpath +
							'/Item/' +
							itemNameProperty +
							'" />' +
							'			</xsl:otherwise>' +
							'		</xsl:choose>' +
							'	</xsl:when>' +
							'</xsl:choose>'
					);
					break;
				case 'image':
					resXSLTArr.push(
						"<xsl:value-of select=\"concat('&lt;img src=&quot;', string(" +
							xpath +
							"),'&quot;/&gt;')\"/>"
					);
					break;
				case 'boolean':
					resXSLTArr.push(
						'&lt;checkbox state="' +
							'<xsl:choose>' +
							'	<xsl:when test="' +
							xpath +
							'">' +
							'		<xsl:value-of select="' +
							xpath +
							'"/>' +
							'	</xsl:when>' +
							'	<xsl:otherwise>' +
							'		<xsl:value-of select="\'0\'"/>' +
							'	</xsl:otherwise>' +
							'</xsl:choose>' +
							'"/&gt;'
					);
					break;
				case 'md5':
					resXSLTArr.push('***');
					break;
				default:
					if ('color' != dataType) {
						resXSLTArr.push('<xsl:value-of select="' + xpath + '" />');
					}
					break;
			}

			resXSLTArr.push('</xsl:otherwise>' + '</xsl:choose>' + '</td>\n');
		}
	}

	var special_td_attributes = RelatedProps_Arr ? " bgColor='#f3f3f3'" : '';
	GenerateRows(DescByProps_Arr, '', special_td_attributes, 'item-CSS');
	GenerateRows(RelatedProps_Arr, 'related_id/Item/', '', 'rItem-CSS');
	// ==== end of grid rows ===

	resXSLTArr.push('</tr>\n');
	resXSLTArr.push('</xsl:template>\n');
	resXSLTArr.push('</xsl:stylesheet>');

	return resXSLTArr.join('');
};

/*
 * uiItemTypeSelectionDialog
 *
 * parameters:
 * 1) itemTypesList - an array of objects like [{id:5, name:'Type5'}]
 */
Aras.prototype.uiItemTypeSelectionDialog = function Aras_uiItemTypeSelectionDialog(
	itemTypesList,
	wnd,
	callback
) {
	if (!itemTypesList) return;
	wnd = wnd || window;
	const args = {
		title: this.getResource('', 'itemtypeselectiondialog.select_item_type'),
		itemTypesList: itemTypesList,
		dialogWidth: 400,
		dialogHeight: 280,
		content: 'ItemTypeSelectionDialog.html',
		aras: this
	};

	const win = this.getMostTopWindowWithAras(wnd);
	const promise = win.ArasModules.Dialog.show('iframe', args).promise;
	if (callback) {
		return promise.then(callback);
	}
	return promise;
};

Aras.prototype.uiItemCanBeLockedByUser = function Aras_uiItemCanBeLockedByUser(
	itemNd,
	isRelationship,
	useSrcAccess
) {
	/*
	this function is for internal use *** only ***.
	----------------------------------------------
	isRelationship - perhaps, this parameter will be removed in future
	------------------------------------------
	full list of places where function is used:
	item_window.js: updateMenuState
	itemsGrid.html: setMenuState
	relationshipsGrid.html: updateControls, onMenuCreate
	*/
	if (itemNd) {
		if (this.getItemProperty(itemNd, 'is_current') == '0') {
			return false;
		}

		var itemTypeName = itemNd.getAttribute('type');

		if (itemTypeName != 'File' && !this.isTempEx(itemNd)) {
			var lockedByValue = this.getItemProperty(itemNd, 'locked_by_id'),
				IsMainItemLocked = true;

			if (isRelationship && useSrcAccess) {
				var sourceId = this.getItemProperty(itemNd, 'source_id'),
					sourceItem,
					sourceItemTypeName;

				if (sourceId) {
					sourceItem = itemNd.selectSingleNode(
						"parent::Relationships/parent::Item[@id='" + sourceId + "']"
					);

					if (!sourceItem) {
						sourceItemTypeName = this.getItemPropertyAttribute(
							itemNd,
							'source_id',
							'type'
						);
						sourceItem = this.getItemById(sourceItemTypeName, sourceId, 0);
					}
				} else {
					sourceItem = itemNd.selectSingleNode(
						'parent::Relationships/parent::Item'
					);
				}

				IsMainItemLocked = sourceItem ? this.isLockedByUser(sourceItem) : false;
			}

			return IsMainItemLocked && lockedByValue === '';
		}
	}

	return false;
};

Aras.prototype.getItemsOfFileProperties = function Aras_getItemsOfFileProperties(
	itemNode,
	ItemTypeNode,
	eachFileCallback
) {
	var filePropNodes = this.getPropertiesOfTypeFile(ItemTypeNode),
		filePropNodesCount = filePropNodes.length,
		files = [],
		propName,
		prop,
		file,
		i;

	for (i = 0; i < filePropNodesCount; i++) {
		propName = this.getItemProperty(filePropNodes[i], 'name');
		prop = null;
		file = null;
		if ('id' === propName) {
			file = itemNode;
		}
		if (!file) {
			file = itemNode.selectSingleNode(propName + '/Item');
		}
		if (!file) {
			prop = this.getItemProperty(itemNode, propName);
			if (prop) {
				if (eachFileCallback) {
					eachFileCallback(prop);
					continue;
				}
				file = this.getItemById('File', prop, 0);
			}
		}

		if (file) {
			files.push(file);
		}
	}

	return files;
};

Aras.prototype.uiIsCheckOutPossible = function Aras_uiIsCheckOutPossible(
	fileItems,
	ItemCanBeLockedByUser,
	ItemIsLockedByUser
) {
	/*
	this function is for internal use *** only ***.
	----------------------------------------------
	------------------------------------------
	full list of places where function is used:
	item_window.js: updateMenuState
	itemsGrid.html: setMenuState
	relationshipsGrid.html: updateControls, onMenuCreate
	*/
	if (!(ItemCanBeLockedByUser || ItemIsLockedByUser) || !fileItems)
		return false;
	var ThereAreFiles = false;
	for (var i = 0; i < fileItems.length; i++) {
		var file = fileItems[i];
		if (file) {
			ThereAreFiles = true;
			var FileIsLocked = this.isLocked(file);
			var FileIsTemp = this.isTempEx(file);
			if (FileIsLocked || FileIsTemp) return false;
		}
	}
	return ThereAreFiles; //because all rules are checked inside loop above
};

Aras.prototype.uiIsCopyFilePossible = function Aras_uiIsCopyFilePossible(
	fileItems
) {
	/*
	this function is for internal use *** only ***.
	----------------------------------------------
	*/
	var ThereAreFiles = false;
	for (var i = 0; i < fileItems.length; i++) {
		var file = fileItems[i];
		if (file && !this.isTempEx(file)) {
			ThereAreFiles = true;
		}
	}
	return ThereAreFiles; //because all rules are checked inside loop above
};

Aras.prototype.uiWriteObject = function Aras_uiWriteObject(doc, objectHTML) {
	doc.write(objectHTML);
};

// method is obsolete, it should be deleted in the major version
Aras.prototype.uiAddConfigLink2Doc4Assembly = function Aras_uiAddConfigLink2Doc4Assembly() {
	return true;
};

Aras.prototype.uiGetFilteredObject4Grid = function Aras_uiGetFilteredObject4Grid(
	itemTypeID,
	filteredPropName,
	filterValue
) {
	var resObj = this.newObject();
	resObj.hasError = false;

	var itemTypeNd;
	try {
		itemTypeNd = this.getItemTypeDictionary(this.getItemTypeName(itemTypeID))
			.node;
	} catch (ex) {}
	if (!itemTypeNd) {
		resObj.hasError = true;
		return resObj;
	}
	var fListNd = itemTypeNd.selectSingleNode(
		"Relationships/Item[@type='Property' and name='" +
			filteredPropName +
			"']/data_source"
	);
	var fListId = fListNd ? fListNd.text : null;
	if (!fListId) {
		resObj.hasError = true;
		return resObj;
	}

	var _listVals = [''];
	var _listLabels = [''];

	var optionNds = this.getListFilterValues(fListId);
	if (filterValue !== '')
		optionNds = this.uiGetFilteredListEx(optionNds, '^' + filterValue + '$');

	for (var i = 0, L = optionNds.length; i < L; i++) {
		var optionNd = optionNds[i];
		var label = this.getItemProperty(optionNd, 'label');
		var value = this.getItemProperty(optionNd, 'value');
		_listVals.push(value);
		if (label === '') _listLabels.push(value);
		else _listLabels.push(label);
	}

	resObj.values = _listVals;
	resObj.labels = _listLabels;

	return resObj;
};

/**
 * Case insensitive check whether exists such keyed_name in the ItemType.
 * Checks if there is an instance of the specified type with a specified keyed name in the DB.
 * The check is case insensitive if the DB was setup properly.
 * If instance cannot be defined uniquely - the first matched is used.
 * If instance doesn't exists in DB then boolean false is returned.
 * @param {string} itemTypeName - the ItemType name
 * @param {string} keyed_name - the keyed name
 * @param {boolean} skipDialog - skip showing the dialog (default value undefined (false))
 * @returns {boolean|Object}
 */
Aras.prototype.uiGetItemByKeyedName = function Aras_uiGetItemByKeyedName(
	itemTypeName,
	keyed_name,
	skipDialog
) {
	if (!keyed_name) {
		// keyed_name can't be empty neither null so a request is useless
		return false;
	}

	function createCacheKey(arasObj, keyed_name) {
		return arasObj.CreateCacheKey(
			'uiGetItemByKeyedName',
			itemTypeName,
			keyed_name
		);
	}

	var key = createCacheKey(this, keyed_name);
	var res = this.MetadataCache.GetItem(key);
	if (!res) {
		var q = this.newIOMItem(itemTypeName, 'get');
		q.setAttribute('select', 'keyed_name');
		q.setProperty('keyed_name', keyed_name);
		var r = q.apply();
		if (r.isError()) {
			return false;
		}

		var putInCache = false;
		if (r.isCollection()) {
			var candidates = [];
			for (var i = 0, L = r.getItemCount(); i < L; i++) {
				var candidate = r.getItemByIndex(i);
				if (candidate.getProperty('keyed_name') === keyed_name) {
					//do case sensitive check
					candidates.push(candidate);
				}
			}

			if (1 === candidates.length) {
				r = candidates[0];
				putInCache = true;
			} else {
				if (candidates.length > 1) {
					r = candidates[0];
				} else {
					r = r.getItemByIndex(0);
				}

				if (!skipDialog) {
					var param = {
						buttons: { btnOK: 'OK' },
						defaultButton: 'btnOK',
						message: this.getResource(
							'',
							'ui_methods.item_cannot_defined_uniquely'
						),
						aras: this,
						dialogWidth: 300,
						dialogHeight: 150,
						center: true,
						content: 'groupChgsDialog.html'
					};
					var win = this.getMostTopWindowWithAras(window);
					(win.main || win).ArasModules.Dialog.show('iframe', param);
				}
			}
		} else {
			putInCache = true;
		}

		res = r.node;
		if (putInCache) {
			this.MetadataCache.SetItem(key, res);

			var actual_keyed_name = r.getProperty('keyed_name');
			if (actual_keyed_name !== keyed_name) {
				//this is possible in a case when the DB is case-insensitive
				//cache mapping to correct keyed name also.
				var newKey = createCacheKey(this, actual_keyed_name);
				if (!this.MetadataCache.GetItem(newKey)) {
					this.MetadataCache.SetItem(newKey, res.cloneNode(true));
				}
			}
		}
	}

	res = res.cloneNode(true);
	return res;
};

// Retrieves window body size, the width and the height of the object including padding,
// but not including margin, border, or scroll bar.
Aras.prototype.getDocumentBodySize = function Aras_GetDocumentBodySize(
	document
) {
	var res = this.newObject();
	res.width = 0;
	res.height = 0;

	if (document) {
		res.width = document.body.clientWidth;
		res.height = document.body.clientHeight;
	}
	return res;
};

// Retrieves the width of the rectangle that bounds the text in the text field.
Aras.prototype.getFieldTextWidth = function Aras_getFieldTextWidth(field) {
	if (field) {
		var r = field.createTextRange();
		if (r !== null) return r.boundingWidth;
	} else return 0;
};

// Calculate html element coordinates on a parent window.
Aras.prototype.uiGetElementCoordinates = function Aras_uiGetElementCoordinates(
	oNode
) {
	var oCurrentNode = oNode;
	var iLeft = 0;
	var iTop = 0;
	var iScrollLeft = 0;
	var iScrollTop = 0;
	var topWindow = this.getMostTopWindowWithAras(window);
	var topOfWindow = topWindow.screenY || topWindow.screenTop || 0;
	var leftOfWindow = topWindow.screenX || topWindow.screenLeft || 0;
	var titleHeight = window.outerHeight - window.innerHeight; // calculate height of titlebar + menubar + navigation toolbar + bookmarks toolbar + tab bar; http://www.gtalbot.org/BugzillaSection/Bug195867GDR_WindowOpen.html#OuterHeightVersusHeightOrInnerHeight

	while (oCurrentNode) {
		iLeft += oCurrentNode.offsetLeft;
		iTop += oCurrentNode.offsetTop;
		iScrollLeft += oCurrentNode.scrollLeft;
		iScrollTop += oCurrentNode.scrollTop;
		if (!oCurrentNode.offsetParent) {
			var tmpFrame = null;
			try {
				oCurrentNode = oCurrentNode.ownerDocument.defaultView
					? oCurrentNode.ownerDocument.defaultView.frameElement
					: null;
			} catch (ex) {
				//access denied case
				oCurrentNode = null;
			}
		} else {
			oCurrentNode = oCurrentNode.offsetParent;
		}
	}

	//+++ IR-008672 (Date dialog is shown not near date field after scrolling)
	var readScroll;
	if (
		oNode.ownerDocument.compatMode &&
		oNode.ownerDocument.compatMode === 'CSS1Compat'
	)
		readScroll = oNode.ownerDocument.documentElement;
	else readScroll = oNode.ownerDocument.body;

	iScrollLeft += readScroll.scrollLeft;
	iScrollTop += readScroll.scrollTop;

	res = {};
	res.left = iLeft - (iScrollLeft - leftOfWindow);
	res.top = iTop - (iScrollTop - topOfWindow) + titleHeight; // add height of browser bars.
	res.scrollLeft = iScrollLeft;
	res.scrollTop = iScrollTop;
	res.screenLeft = leftOfWindow;
	res.screenTop = topOfWindow;
	res.barsHeight = titleHeight;
	//--- IR-008672 (Date dialog is shown not near date field after scrolling)

	return res;
};

// Calculate coordinates of window, that would be shown near element
Aras.prototype.uiGetRectangleToShowWindowNearElement = function Aras_uiGetRectangleToShowWindowNearElement(
	element,
	windowSize,
	rectangleInsideElement,
	eventObject,
	isGrid
) {
	if (!element) {
		throw new Error(
			1,
			this.getResource('', 'ui_methods.parameter_element_not_specified')
		);
	}

	var parentCoords = this.uiGetElementCoordinates(element);
	var dTop, dLeft, dHeight, dWidth;
	var boundHeight;

	var hackForAddProjectDialog = false;
	if (
		element.name === 'date_start_target' ||
		element.name === 'date_due_target'
	) {
		var isAddProjectForm =
			element.ownerDocument &&
			element.ownerDocument.formID === '1CF50C86BD1141A9863451B7634B2F04';
		if (isAddProjectForm && element.ownerDocument.defaultView) {
			hackForAddProjectDialog = true;
		}
	}

	if (eventObject && !window.viewMode && !hackForAddProjectDialog) {
		// for dialog windows
		var topY = eventObject.screenY - eventObject.clientY || 0;
		var leftX = eventObject.screenX - eventObject.clientX || 0;
		dTop =
			topY +
			parentCoords.top -
			parentCoords.screenTop -
			parentCoords.barsHeight;
		dLeft = leftX + parentCoords.left - parentCoords.screenLeft;
	} else {
		var keyToAvoidExplicitTopUsage = 'top';
		dTop = parentCoords[keyToAvoidExplicitTopUsage];
		dLeft = parentCoords.left;
	}

	if (rectangleInsideElement) {
		dTop += rectangleInsideElement.y;
		if (!isGrid) {
			dTop += rectangleInsideElement.height;
			dLeft += rectangleInsideElement.x;
		}
		boundHeight = rectangleInsideElement.height;
	} else if (element.offsetHeight !== undefined) {
		if (!hackForAddProjectDialog) {
			dTop += element.offsetHeight;
		}
		boundHeight = element.offsetHeight;
	}

	if (windowSize) {
		dHeight = windowSize.height !== undefined ? windowSize.height : 200;
		dWidth = windowSize.width !== undefined ? windowSize.width : 250;

		var dx = screen.availWidth - (dLeft + dWidth);
		var dy = screen.availHeight - (dTop + dHeight);
		if (dx < 0) dLeft += dx;
		if (dy < 0) dTop -= dHeight + boundHeight + parentCoords.barsHeight;
	}

	return { top: dTop, left: dLeft, width: dWidth, height: dHeight };
};

///<summary>
/// Show modal dialog from the specified URL using the specified dialog parameters, options
/// from "param" near element "child" of "parent" element
///</summary>
Aras.prototype.uiShowDialogNearElement = function Aras_uiShowDialogNearElement(
	element,
	dialogUrl,
	dialogParameters,
	dialogOptions,
	dialogSize,
	rectangleInsideElement,
	eventObject,
	isGrid
) {
	if (!element)
		throw new Error(
			1,
			this.getResource('', 'ui_methods.parameter_element_not_specified')
		);
	if (dialogOptions === undefined)
		dialogOptions = 'status:0; help:0; center:no;';
	if (dialogSize === undefined) {
		dialogSize = { width: 250, height: 200 };
		if (dialogUrl && dialogUrl.toLowerCase().indexOf('datedialog.html') > -1)
			dialogSize = { width: 257, height: 270 };
	}

	var wndRect = this.uiGetRectangleToShowWindowNearElement(
		element,
		dialogSize,
		rectangleInsideElement,
		eventObject,
		isGrid
	);
	var dialogPositionOptions =
		'dialogHeight:' +
		wndRect.height +
		'px; dialogWidth:' +
		wndRect.width +
		'px; dialogTop:' +
		wndRect.top +
		'px; dialogLeft:' +
		wndRect.left +
		'px; ';

	dialogOptions = dialogPositionOptions + dialogOptions;

	var wnd = window;
	if (element.ownerDocument && element.ownerDocument.defaultView) {
		wnd = element.ownerDocument.defaultView;
	}

	var res = wnd.showModalDialog(dialogUrl, dialogParameters, dialogOptions);
	return res;
};

Aras.prototype.uiShowControlsApiReferenceCommand = function Aras_uiShowControlsApiReferenceCommand(
	isJavaScript
) {
	if (isJavaScript) {
		const docsPath = '/docs/Innovator/index.html';
		const docsUrl = this.getBaseURL() + docsPath;
		window.open(docsUrl, '_blank', 'noopener');
		return;
	}

	var topHelpUrl = this.getTopHelpUrl();
	var re = /^(.*)[\\\/]([^\\\/]*)$/; //finds the last '\' or '/'
	if (!topHelpUrl || !re.test(topHelpUrl)) {
		this.AlertError(
			this.getResource('', 'ui_methods.cannot_determine_tophelpurl')
		);
		return;
	}

	topHelpUrl = RegExp.$1;

	window.open(
		topHelpUrl + '/APIReferenceDotNet/Html/Index.html',
		'_blank',
		'noopener'
	);
};

Aras.prototype.getNotifyByContext = function (wnd) {
	wnd = wnd || window;
	const mainWnd = this.getMainWindow();
	const topWnd = this.getMostTopWindowWithAras(wnd);
	const context = wnd === mainWnd || topWnd.frameElement ? mainWnd : topWnd;
	return context.ArasModules.notify;
};

Aras.prototype.getItemTypeColor = function (criteriaValue, criteriaName) {
	const colorXpath =
		'Relationships/Item[@type="ITPresentationConfiguration" and client="js"]/related_id/Item/color';
	const itemTypeNode = this.getItemTypeNodeForClient(
		criteriaValue,
		criteriaName
	);
	const itemTypeColor = this.getValueByXPath(colorXpath, itemTypeNode);

	if (itemTypeColor) {
		return itemTypeColor;
	}

	const defaultColor = '#5C6BC0';
	const relationshipColor = '#42A5F5';
	return this.getItemProperty(itemTypeNode, 'is_relationship') === '1'
		? relationshipColor
		: defaultColor;
};

Aras.prototype.uiShowItemLastVersion = function (itemTypeName, itemId) {
	const itemType = this.getItemTypeForClient(itemTypeName, 'name');
	if (itemType.isError()) {
		return Promise.resolve();
	}

	let itemWindow;
	const isVersionable = itemType.getProperty('is_versionable') === '1';
	if (isVersionable) {
		const itemLastVersion = this.getItemLastVersion(itemTypeName, itemId, true);
		itemWindow = itemLastVersion && this.uiShowItemEx(itemLastVersion);
		if (!itemWindow) {
			this.AlertError(
				this.getResource(
					'',
					'ui_methods.access_restricted_or_not_exist',
					itemTypeName
				)
			);
		}
	} else {
		itemWindow = this.uiShowItem(itemTypeName, itemId);
	}

	return itemWindow || Promise.resolve();
};
