/* Copyright by Aras Corporation, 2005-2014. */

/*
IMPORTANT NOTE: class methods and members not commented as "this is a public method" (member)

--------------  are not a part of public ConfigurableGrid API. Thus there is no guarantee
that signature of such methods will not be changed in the future
and even that such methods (members) will not be removed.
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIGURABLE GRID
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ConfigurableGrid(containerId, instanceName, cgridID, contextItemNd) {
	this.isInitialized = false;

	if (!containerId || !instanceName || !cgridID || !contextItemNd) {
		return;
	}

	this.containerId = containerId;
	this.appletContainer = document.getElementById(this.containerId);

	// +++ constants
	this.inProgressImg = '../images/Progress.gif';
	// --- constants

	this.instanceName = instanceName;
	var msgId = aras.showStatusMessage(
		'status',
		aras.getResource('', 'configurable_grid.getting_grid_metadata'),
		this.inProgressImg
	);
	var res = aras.soapSend(
		'GetConfigurableGridMetadata',
		"<Item type='Grid' id='" + cgridID + "'/>"
	);
	aras.clearStatusMessage(msgId);
	if (res.getFaultCode() != 0) {
		var resIOMError = new Innovator().newError(res.getFaultString());
		this.showError(resIOMError);
		return;
	}

	res = res.getResult();

	//+++setup grid definition
	var tmp = res.selectSingleNode('grid');
	res.removeChild(tmp);

	this.gridDefinition = new Item();
	this.gridDefinition.dom = aras.createXMLDocument();
	this.gridDefinition.node = this.gridDefinition.dom.appendChild(
		tmp.selectSingleNode('Item')
	);
	this.gridDefinition.columnDescriptors = this.gridDefinition.node.selectNodes(
		"Relationships/Item[@type='Grid Column']"
	);
	//---setup grid definition

	//+++setup xslt
	tmp = res.selectSingleNode('xslt');
	res.removeChild(tmp);
	this.cachedXSLT = tmp.selectSingleNode('*').xml;

	var XSLTStrings = [];
	aras.browserHelper.addXSLTSpecialNamespaces(XSLTStrings);
	this.cachedXSLT = this.cachedXSLT.replace(
		'xmlns:specialns="specialurl"',
		XSLTStrings.join('')
	);

	XSLTStrings.length = 0;
	aras.browserHelper.addXSLTCssFunctions(XSLTStrings);
	this.cachedXSLT = this.cachedXSLT.replace(
		/<cssfunctions_placeholder\s*\/>/,
		XSLTStrings.join('')
	);

	this.cachedXSLT = this.cachedXSLT.replace(
		/<itemcss_placeholder[^>]*\/>/gi,
		function (placeHolder) {
			var matches = placeHolder.match(/xpath="(.*)"/i),
				itemXPath = matches[1];

			if (itemXPath) {
				XSLTStrings.length = 0;
				aras.browserHelper.addXSLTInitItemCSSCall(
					XSLTStrings,
					'string(' + itemXPath + '/css)',
					'string(' + itemXPath + '/fed_css)'
				);
				return XSLTStrings.join('');
			} else {
				return '';
			}
		}
	);

	this.cachedXSLT = this.cachedXSLT.replace(
		/<propcss_placeholder[^>]*\/>/gi,
		function (placeHolder) {
			var matches = placeHolder.match(/name="(.*)"/i),
				propertyName = matches[1];

			if (propertyName) {
				XSLTStrings.length = 0;
				aras.browserHelper.addXSLTGetPropertyStyleExCall(
					XSLTStrings,
					propertyName + 'CSS',
					'item-CSS',
					propertyName
				);
				return XSLTStrings.join('');
			} else {
				return '';
			}
		}
	);
	//---setup xslt

	//+++setup columns xpaths and filter lists
	this.columnXPaths = [];
	this.cachedFilterLists = [];

	var lists = res.selectSingleNode('lists');

	tmp = res.selectSingleNode('columns');
	res.removeChild(tmp);
	tmp = tmp.selectNodes('column');
	this.columnNds = tmp;
	for (var i = 0; i < tmp.length; i++) {
		var col = tmp[i];
		this.columnXPaths[i] = col.getAttribute('xpath');

		if (col.getAttribute('data_type') == 'filter list') {
			var data_source = col.getAttribute('data_source');
			if (data_source) {
				var list = new Item();
				list.dom = lists.ownerDocument;
				list.node = lists.selectSingleNode("Item[@id='" + data_source + "']");
				this.cachedFilterLists[i] = list;
			}
		}
	}
	//---setup columns xpaths and filter lists

	this.item_typeName = contextItemNd.getAttribute('type');
	this.item_id = contextItemNd.getAttribute('id');
	this.auto_add_first_row = aras.isTempEx(contextItemNd);
	this.isEditMode = false;
	this.populateGridIsInProgress = false;
	this.cellValidationFailed = false; //this flag is used to return focus back (highlight) to edited cell
	//to indicate what cell value is invalid
	//this flag is reset to false in:
	// 1) on cell selection change (cell selection occurs inside onactivate also),
	// 2) during <Enter>, <Tab> and <Insert> processing
	this.preservedCellValue = '';
	this.lastEditableCellNum = undefined;

	this.predefinedEditResult = new Object();
	this.selectMethods = new Object();

	this.copyByRefAttrNm = 'copyByRef';

	this.cPropNmRE = /^(.*)\/([^\/]*)$/; //complex property name

	this.initHL_Cell();

	if (!this.item_typeName || !this.item_id) {
		return;
	}

	this.appletID = instanceName + '_' + cgridID;
	this.applet = undefined;

	var nameSuffix =
		'$ConfigurableGrid$' +
		this.gridDefinition.getID() +
		'$' +
		this.instanceName;
	this.oncelledit_handler_name = 'oncelledit' + nameSuffix;
	this.onkeypressed_handler_name = 'onkeypressed' + nameSuffix;
	this.onselectcell_handler_name = 'onselectcell' + nameSuffix;

	var oncelledit_handler = new Function(
		'mode',
		'id',
		'col',
		'return ' + this.instanceName + '.onCellEdit(mode, id, col);'
	);
	var onkeypressed_handler = new Function(
		'keyEvent',
		'return ' + this.instanceName + '.onKeyPressed(keyEvent);'
	);
	var onselectcell_handler = new Function(
		'cell',
		'return ' + this.instanceName + '.onSelectCell(cell);'
	);

	window[this.oncelledit_handler_name] = oncelledit_handler;
	window[this.onkeypressed_handler_name] = onkeypressed_handler;
	window[this.onselectcell_handler_name] = onselectcell_handler;

	// +++ finally setup topLeveleNode
	this.initTopLevelNode(contextItemNd);
	// --- finally setup topLeveleNode
}

ConfigurableGrid.prototype.initTopLevelNode = function ConfigurableGrid_initTopLevelNode(
	contextItemNd
) {
	//this method is for internal purposes only.
	if (this.gridIsNotFunctional) return;

	var merge_path = this.gridDefinition.getProperty('merge_path');
	var mergeInNode = contextItemNd;
	if (merge_path) {
		this.topLevelNode = mergeInNode.selectSingleNode(merge_path);
		if (!this.topLevelNode) {
			var doc = mergeInNode.ownerDocument;
			mergeInNode.appendChild(doc.createElement(merge_path));
		}
	} else {
		merge_path = '/AML';
		var storage = aras.createXMLDocument();
		storage.loadXML('<AML />');
		mergeInNode = storage;
	}

	this.topLevelNode = mergeInNode.selectSingleNode(merge_path);
};

ConfigurableGrid.prototype.start = function ConfigurableGrid_start() {
	// Need to implement following events
	// onbeforedeactivate window[this.instanceName].saveInputtedData()
	// ondeactivate window[this.instanceName].deactivateGrid()
	// onactivate window[this.instanceName].activateGrid()
	// GridStart(g) window[this.instanceName].onGridAppletLoad()
	// GridKeyPress(k) window[this.instanceName].onKeyPressed(k)
	// GridXmlLoaded(b) window[this.instanceName].onXmlLoaded()
	// GridEditCell(mode,id,col) window[this.instanceName].instanceName + ".onCellEdit(mode,id,col)
	// GridSelectCell(c) window[this.instanceName].onSelectCell(c)
	// GridInputHelperClick(id,col) window[this.instanceName].onInputHelperClick(id,col)
	// GridMenuInit(rowId, col, p) window[this.instanceName].onMenuInit(rowId, col, p)
	// GridMenuClick(menuItem, rowId, col) window[this.instanceName].onMenuClick(menuItem, rowId, col)

	var self = this,
		filePropertyManager,
		controlArgs = {
			connectId: this.containerId,
			validateCell: function (rowId, columnName, value) {
				var valueIsValid = true;
				if (!this.skipCellValidation) {
					var appletStoreIsNotEmpty = 0 < this.applet.getRowsNum(),
						columnIndex,
						cellEditor,
						customCell;

					if (appletStoreIsNotEmpty) {
						columnIndex = this.applet.getColumnIndex(columnName);
						cellEditor = new CellEditor(this, rowId, columnIndex);
						customCell = cellEditor.createCustomCell();
						customCell.setViewValue(value);

						if ('function' === typeof customCell.propertyIsValid) {
							valueIsValid = customCell.propertyIsValid();
						}
					}
				}

				return valueIsValid;
			}.bind(this)
		};

	clientControlsFactory.createControl(
		'Aras.Client.Controls.Experimental.ExternalCellWidget.ExcelFilePropertyManager',
		{ aras: aras },
		function (control) {
			filePropertyManager = control;

			clientControlsFactory.on(filePropertyManager, {
				onCanEditCheck: self.onFileWidgetCanEditCheck.bind(this),
				onApplyEdit: self.onFileWidgetApplyEdit.bind(this)
			});
		}.bind(this)
	);

	clientControlsFactory.createControl(
		'Aras.Client.Controls.Experimental.ExcelGridContainer',
		controlArgs,
		function (control) {
			control.setColumnTypeManager_Experimental('File', filePropertyManager);

			clientControlsFactory.on(control, {
				gridXmlLoaded: function (isSuccess) {
					window[this.instanceName].onXmlLoaded();
				}.bind(this),
				gridKeyPress: function (key) {
					window[this.instanceName].onKeyPressed(key);
				}.bind(this),
				gridEditCell: function (mode, id, col) {
					return window[this.instanceName].onCellEdit(mode, id, col);
				}.bind(this),
				gridSelectCell: function (cell) {
					window[this.instanceName].onSelectCell(cell);
				}.bind(this),
				onInputHelperShow_Experimental: function (id, col) {
					window[this.instanceName].onInputHelperClick(id, col);
				}.bind(this),
				gridMenuInit: function (id, col) {
					return window[this.instanceName].onMenuInit(id, col);
				}.bind(this),
				gridMenuClick: function (menuItem, id, col) {
					return window[this.instanceName].onMenuClick(menuItem, id, col);
				}.bind(this)
			});
			this.applet = control;
			this.isGridAppletLoaded = true;
			this.isInitialized = true;
		}.bind(this)
	);
};

ConfigurableGrid.prototype.onFileWidgetApplyEdit = function (
	rowId,
	columnName,
	newValue
) {
	var columnIndex = this.applet.getColumnIndex(columnName),
		fileId = newValue ? aras.getItemProperty(newValue, 'id') : '',
		cellEditor = new CellEditor(this, rowId, columnIndex);

	cellEditor.setValue(fileId);
};

ConfigurableGrid.prototype.onFileWidgetCanEditCheck = function (
	rowId,
	columnName
) {
	return this.isEditMode;
};

ConfigurableGrid.prototype.initHL_Cell = function ConfigurableGrid_initHL_Cell() {
	//this method is for internal purposes only.
	this.hl_cell = null; //highlighted cell
	this.hl_col = -1; //highlighted cell column index
	this.hl_rowId = null; //highlighted cell row id
};

// +++ just to fix IR-005000 "initial row should be created upon invoking new grid"
//         and for IR-005087 "Tab does nothing when at the last cell of a row in the grid"
function EmulateInsertPressed() {
	//this is for internal purposes only.
	return {
		keyCode: 45,
		shiftKey: false
	};
}
// --- just to fix IR-005000 "initial row should be created upon invoking new grid"
//         and for IR-005087 "Tab does nothing when at the last cell of a row in the grid"

ConfigurableGrid.prototype.onXmlLoaded = function ConfigurableGrid_onXmlLoaded() {
	//this method is for internal purposes only.
	this.onXmlLoaded2();
};

ConfigurableGrid.prototype.onXmlLoaded2 = function ConfigurableGrid_onXmlLoaded2() {
	this.applet._grid.focus.focusGridView = function () {};
	//this method is for internal purposes only.
	this.initHL_Cell();

	if (this.auto_add_first_row) {
		aras.deletePropertyFromObject(this, 'auto_add_first_row');

		if (this.applet.getRowsNum() == 0) {
			setTimeout(this.instanceName + '.addNewRootRow()', 1);
			this.populateGridIsInProgress = false;

			return;
		}
	}

	var c =
		this.predefined_hl_cell === undefined
			? this.applet.cells2(0, 0)
			: this.predefined_hl_cell;
	if (c) {
		this.predefined_hl_cell = null;

		if (this.lastEditableCellNum === undefined) {
			var lastColumnNum = this.applet.getColumnCount() - 1;
			this.lastEditableCellNum = lastColumnNum;

			for (var i = lastColumnNum; i >= 0; i--) {
				var tmpCell = this.applet.cells2(c.row, i);
				if (tmpCell && tmpCell.isEditable()) {
					this.lastEditableCellNum = i;
					break;
				} else if (i == 0) this.lastEditableCellNum = i;
			}
		}

		var cell = this.applet.cells2(c.row, c.col);
		if (cell) {
			if (c.start_edit && !cell.isCheckbox()) {
				try {
					this.applet.editCellX(cell);
				} catch (e) {}
			} else {
				try {
					this.applet.setCurCell(cell.getRowId(), cell.getColumnIndex());
				} catch (e) {}
			}
		}
	}

	this.populateGridIsInProgress = false;
};

ConfigurableGrid.prototype.rePopulateGridFewLater = function ConfigurableGrid_rePopulateGridFewLater() {
	//this method is for internal purposes only.
	//to support repopulating in user methods
	setTimeout(
		this.instanceName + '.rePopulateGridFewLater_implementation()',
		30
	);
};
ConfigurableGrid.prototype.rePopulateGridFewLater_implementation = function ConfigurableGrid_rePopulateGridFewLater_implementation() {
	//this method is for internal purposes only.
	//to support repopulating in user methods
	if (!this.userMethodRequiresRePopulating || this.populateGridIsInProgress)
		return;
	try {
		var cell = this.applet.getCurCell();
		if (cell) {
			this.predefined_hl_cell = {
				start_edit: cell.isEdited(),
				row: this.applet.getRowIndex(cell.getRowId()),
				col: cell.getColumnIndex()
			};
		}
	} catch (e) {}
	this.rePopulateGrid();
};

ConfigurableGrid.prototype.onInputHelperClick = function ConfigurableGrid_onInputHelperClick(
	rowId,
	col
) {
	this.F2KeyIsProcessed = true;
	try {
		this.saveInputtedData();
	} catch (excep) {
		throw excep;
	} finally {
		this.F2KeyIsProcessed = false;
	}

	var editor = new CellEditor(this, rowId, col);
	editor.showDialog();
};

ConfigurableGrid.prototype.onMenuInit = function ConfigurableGrid_onMenuInit(
	rowId,
	col,
	p
) {
	//this method is for internal purposes only.
	if (this.isEditMode) {
		var params = {};
		params.rowId = rowId;
		params.col = col;
		params.p = p;
		var handler = new EventHandler(this, rowId, col, this.selectedItem);
		return handler.handleEvent('onmenuinit', 'grid', params);
	}
	return false;
};

ConfigurableGrid.prototype.onMenuClick = function ConfigurableGrid_onMenuClick(
	menuItem,
	rowId,
	col
) {
	//this method is for internal purposes only.
	var params = {};
	params.menuItem = menuItem;
	params.rowId = rowId;
	params.col = col;
	var handler = new EventHandler(this, rowId, col, this.selectedItem);
	return handler.handleEvent('onmenuclick', 'grid', params);
};

ConfigurableGrid.prototype.onCopy = function ConfigurableGrid_onCopy() {
	//this method is for internal purposes only.
	var handler = new EventHandler(
		this,
		this.selectedRowId,
		this.selectedColumnNum,
		this.selectedItem
	);
	return handler.handleEvent('oncopy', 'grid', null);
};

ConfigurableGrid.prototype.onPaste = function ConfigurableGrid_onPaste() {
	//this method is for internal purposes only.
	var handler = new EventHandler(
		this,
		this.selectedRowId,
		this.selectedColumnNum,
		this.selectedItem
	);
	return handler.handleEvent('onpaste', 'grid', null);
};

ConfigurableGrid.prototype.onSelectCell = function ConfigurableGrid_onSelectCell(
	cell
) {
	//this method is for internal purposes only.
	if (!cell) return false;
	if (cell == this.hl_cell) return true;

	this.resetValidationFlag();

	var col = cell.getColumnIndex();

	this.hl_cell = cell;
	this.hl_col = col;
	this.hl_rowId = cell.getRowId();
	this.selectedColumnNum = col;

	var xpath = this.calculateXPathForColumn(col, this.hl_rowId);
	var itms = xpath ? this.selectIOMItems(xpath) : undefined;
	itms = itms && itms.getItemCount() > 0 ? itms : undefined;

	this.selectedItem =
		itms && itms.getItemCount() == 1 ? itms.getItemByIndex(0) : itms;
	this.selectedProperty = this.calculatePropNmForColumn(col);

	return true;
};

ConfigurableGrid.prototype.onCellEdit = function ConfigurableGrid_onCellEdit(
	mode,
	rowId,
	col,
	skipModifiedCheck
) {
	var editor = new CellEditor(this, rowId, col);
	return editor.switchMode(mode, skipModifiedCheck);
};

ConfigurableGrid.prototype.calculatePropNmForColumn = function ConfigurableGrid_calculatePropNmForColumn(
	col
) {
	//this method is for internal purposes only.
	var column = this.getColumnDefinition(col);
	var propNm = aras.getItemProperty(column, 'property');

	if (this.cPropNmRE.test(propNm)) {
		propNm = RegExp.$2;
	}

	return propNm;
};

ConfigurableGrid.prototype.calculateXPathForColumn = function ConfigurableGrid_calculateXPathForColumn(
	col,
	rowId
) {
	//this method is for internal purposes only.

	var xpath = this.applet.getItemId(rowId, col);
	if (xpath == '') return ''; //xpath is empty if and only if item does not exist for the selected cell

	var column = this.getColumnDefinition(col);

	if (aras.getItemProperty(column, 'starts_nested_row') == '1') {
		//do nothing
	} else {
		xpath += '/' + aras.getItemProperty(column, 'xpath');
	}

	var property = aras.getItemProperty(column, 'property');
	if (this.cPropNmRE.test(property)) {
		var addXPath = RegExp.$1;
		xpath += '/' + addXPath;
	}

	return xpath;
};

ConfigurableGrid.prototype.isTopLevelNode = function ConfigurableGrid_isTopLevelNode(
	nd
) {
	//this method is for internal purposes only.
	//this function determines if passed node is a "top_level node" for the current grid
	return nd && nd == this.topLevelNode;
};

ConfigurableGrid.prototype.calculateXPathForNode = function ConfigurableGrid_calculateXPathForNode(
	nd
) {
	//this method is for internal purposes only.

	var res = '';
	if (!nd) return res;

	while (nd) {
		var tagName = nd.nodeName;

		if (this.isTopLevelNode(nd)) break;

		var x = tagName;
		if (tagName == 'Item') {
			x += "[@type='" + nd.getAttribute('type') + "']";
			x += "[@id='" + nd.getAttribute('id') + "']";
		}
		if (res != '') x += '/';

		res = x + res;

		nd = nd.parentNode;
	}

	return res;
};

ConfigurableGrid.prototype.getRootItemTypeName = function ConfigurableGrid_getRootItemTypeName() {
	//this method is for internal purposes only.
	return this.getRootItemTypeName_res;
};

ConfigurableGrid.prototype.clearPath2RootItem = function ConfigurableGrid_clearPath2RootItem(
	xpath
) {
	//this method is for internal purposes only.

	//removes the very first node from the xpath and all @id criterias
	return xpath.replace(/^[^\/]+\/(.+)$/, '$1').replace(/\[@id='[^\']*'\]/g, '');
};

ConfigurableGrid.prototype.createItemByXPathIfPossible = function ConfigurableGrid_createItemByXPathIfPossible(
	templateXPath,
	parentXPath,
	sibling,
	where
) {
	if (sibling && sibling.isCollection()) {
		return null;
	} else {
		return this.createItemByXPath(templateXPath, parentXPath, sibling, where);
	}
};

ConfigurableGrid.prototype.setAttributesOnNewItem = function ConfigurableGrid_setAttributesOnNewItem(
	itemNd
) {
	//this method is for internal purposes only.

	itemNd.setAttribute('id', aras.generateNewGUID());
	itemNd.setAttribute('isNew', '1');
	itemNd.setAttribute('isTemp', '1');
	itemNd.setAttribute('action', 'add');
	itemNd.setAttribute('doGetItem', '0');
};

ConfigurableGrid.prototype.setUpdateActionAttributeToItem = function ConfigurableGrid_setUpdateActionAttributeToItem(
	item
) {
	//this method is for internal purposes only.

	var re = /^update$|^edit$|^create$|^add$|^version$/;
	if (!re.test(item.getAction())) {
		var newAction = aras.isLocked(item.node) ? 'update' : 'edit';
		item.setAction(newAction);
		if (!item.getAttribute('doGetItem')) {
			item.setAttribute('doGetItem', '0');
		}
	}
};

ConfigurableGrid.prototype.createItemByXPath = function ConfigurableGrid_createItemByXPath(
	templateXPath,
	parentXPath,
	sibling,
	where
) {
	//this method is for internal purposes only.
	//templateXPath should not contain path to root items (direct descendants of node defined by merge_path)

	if (this.newItemCreationDisabled) return null;

	var dom = this.topLevelNode.ownerDocument;
	var self = this;
	var notDeletedFilter = "[not(@action='delete' or @action='purge')]";

	function f(tagNm, flag, currNd, tagInfo) {
		var r = dom.createElement(tagNm);
		var t = null;

		if (flag && sibling) {
			var nd = sibling.node;

			if (nd && nd.parentNode == currNd) {
				if (where == 'before') nd = nd;
				else if (where == 'after') {
					do {
						nd = nd.nextSibling;
					} while (nd && nd.nodeType != 1);
				} else nd = null;
			} else nd = null;

			t = currNd.insertBefore(r, nd);
		} else {
			t = currNd.appendChild(r);
		}

		var itType = tagInfo.attributes.type;
		if (tagNm == 'Item') {
			if (itType) {
				t.setAttribute('type', itType);
				for (var k = 0; k < self.columnNds.length; k++) {
					var clmn = self.columnNds[k];
					if (clmn.getAttribute('source_it_name') == itType) {
						var nm = clmn.getAttribute('name');
						var d_v = clmn.getAttribute('default_value');
						if (d_v && nm) {
							var nd = t.ownerDocument.createElement(nm);
							nd = t.appendChild(nd);
							nd.text = d_v;
						}
					}
				}
			}

			self.setAttributesOnNewItem(t);

			var parentNm = currNd.nodeName;
			if (parentNm != 'Relationships' && !self.isTopLevelNode(currNd)) {
				var parentNd = currNd.parentNode;
				if (
					parentNd &&
					parentNd.nodeName == 'Item' &&
					!parentNd.getAttribute('action')
				) {
					parentNd.setAttribute('action', 'edit');
					parentNd.setAttribute('doGetItem', '0');
				}
			} else {
				var const_min_value = 0;
				var const_max_value = 2147483647; //2,147,483,647 is the max value for Integer data_type

				var min_value = const_min_value;
				var max_value = const_max_value;

				var sibling_criteria = 'Item';
				if (itType) sibling_criteria += "[@type='" + itType + "']";
				sibling_criteria += notDeletedFilter;

				var prev_sibling = t.selectSingleNode(
					'preceding-sibling::' + sibling_criteria + '[1]'
				);
				var next_sibling = t.selectSingleNode(
					'following-sibling::' + sibling_criteria + '[1]'
				);

				var tmp_min_value = '';
				var tmp_max_value = '';
				if (prev_sibling != null)
					tmp_min_value = aras.getItemProperty(prev_sibling, 'sort_order');
				if (next_sibling != null)
					tmp_max_value = aras.getItemProperty(next_sibling, 'sort_order');

				tmp_min_value = parseInt(tmp_min_value);
				tmp_max_value = parseInt(tmp_max_value);

				var DoubleStep = 256; //the step will be 128 = 256 / 2. see below

				//after tmp_min_value and tmp_max_value processing min_value and max_value must contain values
				//which limit the range of possible sort_order values not including border values
				//so, finally the following must be true: min_value < sort_order < max_value
				if (!isNaN(tmp_min_value)) {
					min_value = tmp_min_value;
					if (!isNaN(tmp_max_value)) max_value = tmp_max_value;
					else {
						max_value = min_value + DoubleStep;
						if (max_value > const_max_value) max_value = const_max_value + 1;
					}
				} else if (!isNaN(tmp_max_value)) {
					max_value = tmp_max_value;
					min_value = max_value - DoubleStep;
					if (min_value < const_min_value) min_value = const_min_value - 1;
				} else {
					min_value = const_min_value - 1;
					max_value = const_max_value + 1;
				}

				var EnumerateAllFlag = max_value - min_value <= 1;
				if (!EnumerateAllFlag) {
					var step_size = parseInt((max_value - min_value) / 2); //this just strips .5 part
					var sort_order = min_value + step_size;

					if (sort_order < const_min_value) sort_order = const_min_value;
					else if (sort_order > const_max_value) sort_order = const_max_value;

					var sort_orderNd = t.appendChild(dom.createElement('sort_order'));
					sort_orderNd.text = sort_order;
				} else {
					var Relationships = currNd.selectNodes(sibling_criteria);
					var SiblingsNumber = Relationships.length; //should never be 0;
					if (SiblingsNumber == 0)
						throw new Error(
							1,
							aras.getResource(
								'',
								'configurable_grid.relationships_number_cannot_be_0'
							)
						);

					var step_size = parseInt(
						(1 + const_max_value - const_min_value) / SiblingsNumber
					);
					var normal_step = parseInt(DoubleStep / 2);
					if (step_size > normal_step) step_size = normal_step;
					if (step_size < 1) step_size = 1;

					var TotalWidth = (SiblingsNumber - 1) * step_size + 1;
					var Start_sort_order = parseInt((const_max_value - TotalWidth) / 2);
					if (Start_sort_order < const_min_value)
						Start_sort_order = const_min_value;

					var sort_order = Start_sort_order - step_size;
					for (var i = 0; i < SiblingsNumber; i++) {
						var relationship = Relationships[i];
						var sort_orderNd = relationship.selectSingleNode('sort_order');
						if (!sort_orderNd)
							sort_orderNd = relationship.appendChild(
								dom.createElement('sort_order')
							);

						sort_order += step_size;
						if (sort_order > const_max_value) {
							//check for an overflow just for a case
							sort_order = const_max_value;
							step_size = 0;
						}

						if (sort_orderNd.text != sort_order.toString()) {
							sort_orderNd.text = sort_order;

							var siblingAction = relationship.getAttribute('action');
							if (!siblingAction || siblingAction == 'skip') {
								relationship.setAttribute('action', 'edit');
								relationship.setAttribute('doGetItem', '0');
							}
						}
					}
				}
			}
		}

		var attributes = tagInfo.attributes;
		for (var a in attributes) {
			t.setAttribute(a, attributes[a]);
		}

		var innerNodes = tagInfo.innerNodes;
		for (var n in innerNodes) {
			var el = t.appendChild(dom.createElement(n));
			el.text = innerNodes[n];
		}

		return t;
	}

	if (!parentXPath) {
		var type = this.getRootItemTypeName();
		if (!type) {
			alert(
				aras.getResource(
					'',
					'configurable_grid.type_of_root_item_cannot_be_determined'
				)
			);
			return false;
		}

		var ndInfo = { tag: 'Item', attributes: { type: type }, innerNodes: {} };
		nd = f('Item', true, this.topLevelNode, ndInfo);

		var source_id = nd.appendChild(dom.createElement('source_id'));
		source_id.text = this.item_id;

		parentXPath =
			"Item[@type='" + type + "'][@id='" + nd.getAttribute('id') + "']";
	}

	var parentNd = this.topLevelNode.selectSingleNode(parentXPath);
	if (!parentNd) {
		throw new Error('Invalid parentXPath is passed (' + parentXPath + ')');
	}

	var templateTagInfos = this.parseXPath(templateXPath); //information about tags in template xpath
	var parentTagInfos = this.parseXPath(parentXPath); //information about tags in parent xpath
	var rootTagInfo = parentTagInfos.shift();

	if (templateTagInfos.length < parentTagInfos.length) {
		throw new Error('Template xpath is shorter than parent xpath'); //which is unexpected
	}

	var currNd = this.topLevelNode.selectSingleNode(rootTagInfo.xpath);
	for (var i = 0; i < parentTagInfos.length; i++) {
		var parentTagInfo = parentTagInfos[i];
		var templateTagInfo = templateTagInfos[i];
		if (templateTagInfo.tag !== parentTagInfo.tag) {
			throw new Error(
				'Template tag (' +
					templateTagInfo.tag +
					") doesn't match parent tag (" +
					parentTagInfo.tag +
					')'
			);
		}
		var x = parentTagInfo.xpath + templateTagInfo.filters;
		currNd = currNd.selectSingleNode(x);
		if (!currNd) {
			throw new Error('The next parent tag is not found using xpath ' + x);
		}
	}

	if (currNd !== parentNd) {
		throw new Error("Specified parent node doesn't match template xpath");
	}

	var arr = templateTagInfos.slice(parentTagInfos.length); //arr will contain information about tags to create
	var lastItemPos = -1;

	for (var i = arr.length - 1; i > -1; i--) {
		if (arr[i].tag == 'Item') {
			lastItemPos = i;
			break;
		}
	}

	for (var i = 0; i < arr.length; i++) {
		var tagInfo = arr[i];
		var tagNm = tagInfo.tag;

		var x = tagInfo.xpath;
		if (tagNm == 'Item') x += notDeletedFilter;

		var t = currNd.selectSingleNode(x);
		var currNdName = currNd.nodeName;
		//only 2 Relationships and AML tags may contain several child nodes
		var allowsMultipleEntry =
			currNdName === 'Relationships' || currNdName === 'AML';
		if (!t || (i == lastItemPos && allowsMultipleEntry))
			t = f(tagNm, t, currNd, tagInfo);

		currNd = t;
	}

	return currNd;
};

ConfigurableGrid.prototype.createItemForColumn = function ConfigurableGrid_createItemForColumn(
	col,
	parentXPath,
	sibling,
	where
) {
	//this method is for internal purposes only.
	var colXPath = this.columnXPaths[col];
	return this.createItemByXPathIfPossible(
		colXPath,
		parentXPath,
		sibling,
		where
	);
};

ConfigurableGrid.prototype.selectIOMItems = function ConfigurableGrid_selectIOMItems(
	xpath
) {
	//this method is for internal purposes only.
	var item = new Item(undefined, undefined, 'simple');
	item.dom = this.topLevelNode.ownerDocument;
	item.node = undefined;
	item.nodeList = this.topLevelNode.selectNodes(xpath);
	return item;
};

ConfigurableGrid.prototype.recordLastTabTime = function ConfigurableGrid_recordLastTabTime() {
	//this method is for internal purposes only.
	this.timeStampForMouseClick = new Date().valueOf();
};

ConfigurableGrid.prototype.longTimePassedFromLastTab = function ConfigurableGrid_longTimePassedFromLastTab() {
	//this method is for internal purposes only.
	var t = new Date().valueOf();
	return (
		this.timeStampForMouseClick === undefined ||
		t - this.timeStampForMouseClick - 300 > 0
	);
};

ConfigurableGrid.prototype.validateCurrentCell = function ConfigurableGrid_validateCurrentCell() {
	//this method is for internal purposes only.
	this.resetValidationFlag();
	this.saveInputtedData();

	return !this.cellValidationFailed;
};

ConfigurableGrid.prototype.resetValidationFlag = function ConfigurableGrid_resetValidationFlag() {
	//this method is for internal purposes only.
	this.cellValidationFailed = false;
};

ConfigurableGrid.prototype.lockItemBeforeEditStart = function ConfigurableGrid_lockItemBeforeEditStart(
	iomItem //this method is for internal purposes only.
) {
	var item = iomItem;
	var notCollectionNotNew =
		!item.isCollection() &&
		!item.isNew() &&
		item.getAttribute('action') != 'add';
	var f = false; //flag which means that item is locked (and thus editable) by current user

	if (notCollectionNotNew) {
		var lockedBy = item.isLocked();
		var preservedAction = item.node.getAttribute('action');
		if (lockedBy == 2) {
			var r;
			var tmpParentNd = this.topLevelNode.parentNode;
			if (tmpParentNd) tmpParentNd.removeChild(this.topLevelNode); //this code is required to prevent redundant window refresh (REG-000283)
			try {
				r = item.unlockItem(); //for now return value is not checked here
			} finally {
				if (tmpParentNd) tmpParentNd.appendChild(this.topLevelNode); //this code is required to prevent redundant window refresh (REG-000283)
			}

			lockedBy = item.isLocked();
		}

		f = lockedBy == 1;
		if (!f) {
			var r;
			var tmpParentNd = this.topLevelNode.parentNode;
			if (tmpParentNd) tmpParentNd.removeChild(this.topLevelNode); //this code is required to prevent redundant window refresh (REG-000283)
			try {
				r = item.lockItem();
			} finally {
				if (tmpParentNd) tmpParentNd.appendChild(this.topLevelNode); //this code is required to prevent redundant window refresh (REG-000283)
			}

			f = !r.isError();
			if (f) {
				if (preservedAction) item.node.setAttribute('action', preservedAction);
				else item.node.removeAttribute('action');

				item.setProperty('locked_by_id', aras.getUserID());
			}
		} else {
			item.setProperty('locked_by_id', aras.getUserID());
		}
	}

	if (notCollectionNotNew && !f) {
		alert(
			aras.getResource(
				'',
				'configurable_grid.this_item_not_editable',
				item.getType()
			)
		);
		return false;
	}

	return true;
};

ConfigurableGrid.prototype.getColumnDefinition = function ConfigurableGrid_getColumnDefinition(
	columnIndex
) {
	//this method is for internal purposes only.
	var column = this.gridDefinition.columnDescriptors[columnIndex];
	if (!column) {
		this.showError(
			new Innovator().newError(
				aras.getResource(
					'',
					'configurable_grid.no_column_with_index_in_grid',
					col
				)
			)
		);
		return null;
	}

	return column;
};

ConfigurableGrid.prototype.disableKeybord = function ConfigurableGrid_disableKeybord() {
	//this method is for internal purposes only.
	this.disableKeyboardFlag = true;
};

ConfigurableGrid.prototype.enableKeybord = function ConfigurableGrid_enableKeybord() {
	//this method is for internal purposes only.
	this.disableKeyboardFlag = false;
};

ConfigurableGrid.prototype.disableUserInput = function ConfigurableGrid_disableUserInput() {
	//this method is for internal purposes only.
	//disables keybord input and makes underlying grid applet "read only" to partially disable mouse input
	this.disableKeybord();
	this.applet.setEditable(false);
};

ConfigurableGrid.prototype.enableUserInput = function ConfigurableGrid_enableUserInput() {
	//this method is for internal purposes only.
	//enables keybord input and makes underlying grid applet "read/write"
	this.enableKeybord();
	this.applet.setEditable(true);
};

ConfigurableGrid.prototype.onKeyPressed = function ConfigurableGrid_onKeyPressed(
	keyEvent
) {
	//this method is for internal purposes only.
	if (this.disableKeyboardFlag || this.populateGridIsInProgress) {
		return false;
	}

	var keyCodes = {
			Tab: 9,
			Enter: 13,
			Insert: 45,
			Delete: 46,
			C: 67,
			F: 70,
			I: 73,
			V: 86,
			F2: 113
		},
		isMacOS = /mac/i.test(navigator.platform),
		isCtrlPressed = isMacOS ? keyEvent.metaKey : keyEvent.ctrlKey;

	switch (keyEvent.keyCode) {
		case keyCodes.Tab:
			this.recordLastTabTime();
			var MinTimeDiff = 400,
				TimeStamp = Date.now();

			if (
				this.LastKeyPressed &&
				TimeStamp - this.LastKeyPressed < MinTimeDiff
			) {
				return false;
			} else {
				this.LastKeyPressed = TimeStamp;
			}

			if (this.isEditMode) {
				var c = this.applet.getCurCell();
				if (!this.validateCurrentCell()) {
					//to save data is being inputted
					this.resetValidationFlag();
					return false;
				}

				if (keyEvent.shiftKey) {
					return true;
				}

				if (!c) {
					return true;
				}
			}
			break;
		case keyCodes.F2:
			var rowId = this.selectedRowId,
				col = parseInt(this.selectedColumnNum);

			if (this.selectedCell && rowId && !isNaN(col)) {
				var property = this.columnNds[col];
				itemType = property.getAttribute('type');

				// this check added, cause now for Files this behavior implemented through cell widget
				if (itemType != 'File') {
					var column = this.getColumnDefinition(col),
						columnDatatype = aras.getItemProperty(column, 'datatype'),
						propertyDataType =
							columnDatatype == 'default'
								? property.getAttribute('data_type')
								: '',
						languagesCount =
							propertyDataType == 'ml_string'
								? aras
										.getLanguagesResultNd()
										.selectNodes("Item[@type='Language']").length
								: 1,
						editor;

					if (
						/^text$|^bound_select$|^unbound_select$|^unbound_multi$/.test(
							columnDatatype
						) ||
						/^text$|^color$|^formatted text$|^item$|^date$/.test(
							propertyDataType
						) ||
						(propertyDataType == 'ml_string' && languagesCount > 1)
					) {
						this.F2KeyIsProcessed = true;

						try {
							this.saveInputtedData();
						} catch (excep) {
							throw excep;
						} finally {
							this.F2KeyIsProcessed = false;
						}

						editor = new CellEditor(this, rowId, col);
						editor.showDialog();
					}
				}
			}
			break;
		case keyCodes.Delete:
			if (!this.isEditMode || this.selectedCell) {
				return true;
			}

			var columnIndex = parseInt(this.hl_col);
			if (isNaN(columnIndex)) {
				return false;
			} else if (columnIndex == -1) {
				return true; //no column is selected
			}

			var xpath = this.calculateXPathForColumn(columnIndex, this.hl_rowId);
			if (!xpath) {
				return false;
			}

			var cell = this.applet.getCurCell();
			if (!cell.isEditable()) {
				return true; //read-only cells should not allow the delete operation
			}

			var items = this.selectIOMItems(xpath),
				itemCount = items.getItemCount(),
				self = this,
				item;

			if (itemCount == 0) {
				item = null;
			} else {
				item = itemCount == 1 ? items.getItemByIndex(0) : items;
			}

			if (!item || (item.node && item.node.tagName != 'Item')) {
				return true;
			}

			var statusId = aras.showStatusMessage(
				'status',
				aras.getResource('', 'configurable_grid.deleting'),
				this.inProgressImg
			);
			var isChanged = false;
			if (item.isCollection()) {
				for (var i = 0; i < item.getItemCount(); i++) {
					var ci = item.getItemByIndex(i);
					isChanged = this.deleteItem(ci) || isChanged;
				}
			} else {
				isChanged = this.deleteItem(item);
			}

			if (isChanged) {
				this.rePopulateGrid();
			}
			aras.clearStatusMessage(statusId);

			break;
		case keyCodes.I:
			if (isMacOS && isCtrlPressed) {
				// "CMD+I" on MAC should act like "Insert" on Windows
				keyEvent.preventDefault();
			} else {
				break;
			}
		case keyCodes.Insert:
			if (this.isEditMode) {
				var where = keyEvent.shiftKey ? 'before' : 'after';
				this.onInsertRowCommand(where);
				return false;
			}
			break;
		case keyCodes.F:
			if (isCtrlPressed) {
				setTimeout(this.instanceName + '.startFindAndReplace()', 10);
				keyEvent.preventDefault();
				return false;
			}
			break;
		case keyCodes.C:
			if (!this.selectedCell) {
				if (this.isEditMode && isCtrlPressed) {
					//only Ctrl+C
					this.onCopyCommand();
					return false;
				}
			}
			break;
		case keyCodes.V:
			if (!this.selectedCell) {
				if (this.isEditMode && isCtrlPressed) {
					//only Ctrl+V
					this.onPasteCommand();
					return false;
				}
			}
			break;
	}

	return true;
};

ConfigurableGrid.prototype.deleteItem = function (item) {
	var itemNode = item.node,
		parentNode = itemNode.parentNode,
		parentName = parentNode.nodeName,
		applyAction = 'delete',
		confirmMessage,
		messageId,
		isConfirmed;

	if (parentName == 'Relationships') {
		//this relationship is deleted
	} else if (this.isTopLevelNode(parentNode)) {
		//item is deleted because the parent node is a "top_level" node
	} else {
		var levelUpNd = itemNode.selectSingleNode('../../..');

		parentName = levelUpNd ? levelUpNd.nodeName : '';

		if (parentName == 'Relationships' || this.isTopLevelNode(levelUpNd)) {
			//delete one level up relationship instead of current item. If current item is dependent then
			//it will be deleted by standard delete logic
			itemNode = itemNode.selectSingleNode('../..');
		} else {
			//for now if current item is not a relationship and "parent" instance is not
			//a relationship also then we just erase a reference to current item from parent instance.
			applyAction = 'null reference';
		}
	}

	messageId =
		applyAction == 'delete'
			? 'configurable_grid.deleting_sure'
			: 'configurable_grid.remove_form_configuration';
	confirmMessage = aras.getResource(
		'',
		messageId,
		itemNode.getAttribute('type'),
		aras.getKeyedNameEx(itemNode)
	);
	isConfirmed = window.confirm(confirmMessage);
	this.returnFocusToGrid();

	if (isConfirmed) {
		var itemAction = itemNode.getAttribute('action');

		parentNode = itemNode.parentNode;
		if (itemAction == 'add') {
			//it doesn't matter what is applyAction
			parentNode.removeChild(itemNode);
		} else {
			if (applyAction == 'delete') {
				itemNode.setAttribute('action', 'delete');
			} else {
				//null reference
				parentNode.text = '';
				parentNode = parentNode.parentNode;

				if (!parentNode.getAttribute('action')) {
					parentNode.setAttribute('action', 'edit');
				}
			}
		}
	}

	return isConfirmed;
};

ConfigurableGrid.prototype.getNearestStartsNestedColumn = function ConfigurableGrid_getNearestStartsNestedColumn(
	col
) {
	//this method is for internal purposes only.
	var NearestStartsNested = col;
	for (; NearestStartsNested > -1; NearestStartsNested--) {
		var tmpColumnDef = this.getColumnDefinition(NearestStartsNested);
		if (aras.getItemProperty(tmpColumnDef, 'starts_nested_row') == '1') break;
	}

	return NearestStartsNested;
};

ConfigurableGrid.prototype.onInsertRowCommand = function ConfigurableGrid_onInsertRowCommand(
	where,
	beforeRefreshCallback
) {
	//this method is for internal purposes only.
	var col = parseInt(this.hl_col);
	if (isNaN(col)) return false;

	if (!this.validateCurrentCell()) {
		//to save data and validate user input
		this.resetValidationFlag();
		return false;
	}

	if (col == -1) col = 0; //no column is selected default to first

	var column = this.getColumnDefinition(col, this.hl_rowId);
	if (!column) return false; //no column is found
	var datatype = aras.getItemProperty(column, 'datatype');
	if (datatype == 'federated') {
		alert(
			aras.getResource('', 'configurable_grid.inset_ignored_federated_column')
		);
		return true;
	}

	var xpath = this.calculateXPathForColumn(col, this.hl_rowId);
	if (xpath === undefined) return false;

	var item = null;
	if (xpath == '') {
		item = null;
	} else {
		var items = this.selectIOMItems(xpath);
		var c = items.getItemCount();

		if (c == 0) item = null;
		else if (c == 1) item = items.getItemByIndex(0);
		else item = items;
	}
	var parentXPath;
	if (this.newDefaultRootRow) {
		parentXPath = null;
		this.newDefaultRootRow = false;
	} else {
		parentXPath = this.applet.getParentId();
	}

	var sibling = item;

	//determine how far is the nearest starts_nested column
	var NearestStartsNested = this.getNearestStartsNestedColumn(col);

	var StayOnTheSameRow = where != 'after';
	if (sibling) {
		var self = this;
		function createNearestParent() {
			var nd = sibling.node;
			var pNd = nd.parentNode;
			if (pNd.tagName == 'Relationships') {
				//nothing to do here
				return self.calculateXPathForNode(pNd);
			} else {
				sibling = null; //there is no sibling because parent tag is not Relationships

				while (pNd.tagName != 'Relationships' && pNd.tagName != 'AML') {
					nd = pNd;
					pNd = pNd.parentNode;
				}

				var parentXPath = self.calculateXPathForNode(pNd);
				var tXPath = self.calculateXPathForNode(nd);
				var tSibling = self.selectIOMItems(tXPath);
				tSibling = tSibling.getItemByIndex(0);

				var templateXPath = '';
				if (parentXPath) {
					templateXPath =
						self.clearPath2RootItem(parentXPath) +
						"/Item[@type='" +
						tSibling.getType() +
						"']";
				}

				nd = self.createItemByXPathIfPossible(
					templateXPath,
					parentXPath,
					tSibling,
					where
				);

				return self.calculateXPathForNode(nd);
			}
		}

		// --- we don't allow grid to paste several items in one cell.
		//if there is a need to do this - use special datatype ([un]bound_multi)
		//which has ability to show special Form. Or use special method.
		//-----------------------
		//if item for cell exists already we need to "go one level up" to generate a new row
		//instead of just generating one more sibling (to handle multiple items in 1 cell user should use corresponding dialog)

		if (NearestStartsNested < col) {
			//also we have to check that it's possible to get "several items in 1 cell" here
			//this means xpath for column should contain "Relationships"
			var severalItemsArePossible = false;
			var xpath4Test =
				aras.getItemProperty(column, 'xpath') +
				'/' +
				aras.getItemProperty(column, 'property');
			var tmpArr = this.parseXPath(xpath4Test);
			for (var i = 0; i < tmpArr.length; i++) {
				if (tmpArr[i].tag == 'Relationships') {
					severalItemsArePossible = true;
					break;
				}
			}

			if (severalItemsArePossible) {
				var FirstColumnOfItem = NearestStartsNested + 1;
				var NearestParentXPath = this.applet.getItemId(
					this.hl_rowId,
					FirstColumnOfItem
				);
				var NearestParentItem = this.selectIOMItems(NearestParentXPath);
				if (NearestParentItem.getItemCount() != 1) return false;

				sibling = NearestParentItem.getItemByIndex(0);

				parentXPath = createNearestParent();
				XPathIsEnough = true;
			}
		}
		// --- we don't allow grid to paste several items in one cell.

		if (sibling && !sibling.isCollection()) {
			parentXPath = createNearestParent();
		}
	} else {
		//if there is no sibling
		if (datatype == 'bound_multi' || datatype == 'unbound_multi') {
			StayOnTheSameRow = true;
		}

		if (StayOnTheSameRow) {
			var tmpXPath = this.applet.getSelectedId();
			if (tmpXPath) parentXPath = tmpXPath;
		}
	}

	var res = this.createItemForColumn(col, parentXPath, sibling, where);
	if (!res) return false;

	var rowN = 0;
	var colN = 0;

	var c = this.applet.getCurCell();
	if (!c) {
		rowN = this.applet.getRowsNum();
		colN = 0;
	} else {
		rowN = this.applet.getRowIndex(c.getRowId());
		colN = col;

		if (!StayOnTheSameRow) {
			var cr = this.applet.getSelectedId();
			if (!cr) {
				cr = this.applet.getParentId();
				if (cr) rowN -= 1;
			}

			rowN += c.getRowSpan();
		}
	}

	this.predefined_hl_cell = {
		start_edit: true,
		row: rowN,
		col: col
	};

	if (beforeRefreshCallback) {
		var TopGeneratedNodeXPath = '';
		if (NearestStartsNested > -1)
			TopGeneratedNodeXPath = this.columnXPaths[NearestStartsNested];

		var tmpXPath = this.clearPath2RootItem(this.calculateXPathForNode(res));
		var levelsDiffStr = tmpXPath.replace(TopGeneratedNodeXPath, '');
		if (levelsDiffStr.indexOf('/') == 0)
			levelsDiffStr = levelsDiffStr.substr(1);
		var levelsDiffArr = this.parseXPath(levelsDiffStr);
		var levelsDiff = levelsDiffArr.length;

		var TopGeneratedNode = res;
		if (levelsDiff > 0) {
			tmpXPath = '..';
			for (var i = 1; i < levelsDiff; i++) tmpXPath += '/..';
			TopGeneratedNode = TopGeneratedNode.selectSingleNode(tmpXPath);
		}

		beforeRefreshCallback(TopGeneratedNode);
	}

	this.rePopulateGrid();
};

ConfigurableGrid.prototype.onCopyCommand = function ConfigurableGrid_onCopyCommand() {
	//this method is for internal purposes only.

	this.clipboardData = null;

	var cell = this.applet.getCurCell();
	if (!cell) return false;

	var col = cell.getColumnIndex();
	var xpath = this.applet.getItemId(cell.getRowId(), col);
	if (!xpath) return false;

	var nodeToCopy = this.topLevelNode.selectSingleNode(xpath);
	if (!nodeToCopy) return false;

	var statusId = aras.showStatusMessage(
		'status',
		aras.getResource('', 'configurable_grid.copying'),
		this.inProgressImg
	);

	var nds2RemoveAttr = this.topLevelNode.selectNodes(
		'.//Item[@' + this.copyByRefAttrNm + ']'
	);
	for (var i = 0; i < nds2RemoveAttr.length; i++)
		nds2RemoveAttr[i].removeAttribute(this.copyByRefAttrNm);

	if (this.onCopy() === false) {
		aras.clearStatusMessage(statusId);
		return false;
	}

	nodeToCopy = nodeToCopy.cloneNode(true);
	var deletedNodes = nodeToCopy.selectNodes(
		".//Item[@action='delete' or @action='purge']"
	);
	for (var i = 0; i < deletedNodes.length; i++) {
		var deletedNd = deletedNodes[i];
		var pNd = deletedNd.parentNode;
		if (pNd) pNd.removeChild(deletedNd);
	}

	this.clipboardData = {
		nodeToCopy: nodeToCopy,
		baseColumn: this.getNearestStartsNestedColumn(col)
	};

	aras.clearStatusMessage(statusId);
};

ConfigurableGrid.prototype.onPasteCommand = function ConfigurableGrid_onPasteCommand() {
	//this method is for internal purposes only.

	if (!this.clipboardData) {
		aras.AlertError(
			aras.getResource('', 'configurable_grid.must_copy_row_before_paste')
		);
		return false;
	}

	var cell = this.applet.getCurCell();
	if (!cell) return false;

	var col = cell.getColumnIndex();
	var baseColumn = this.getNearestStartsNestedColumn(col);
	if (baseColumn != this.clipboardData.baseColumn) {
		aras.AlertError(
			aras.getResource('', 'configurable_grid.must_select_cell_from_same_level')
		);
		return false;
	}

	var statusId = aras.showStatusMessage(
		'status',
		aras.getResource('', 'configurable_grid.pasting'),
		this.inProgressImg
	);

	if (this.onPaste() === false) {
		aras.clearStatusMessage(statusId);
		return false;
	}

	var nodeToPaste = this.clipboardData.nodeToCopy.cloneNode(true);
	var itemNds = nodeToPaste.selectNodes('descendant-or-self::Item');
	for (var i = 0; i < itemNds.length; i++) {
		var itemNd = itemNds[i];
		if (itemNd.getAttribute(this.copyByRefAttrNm) == '1') {
			itemNd.setAttribute('action', 'get');
			itemNd.removeAttribute(this.copyByRefAttrNm);
		} else this.setAttributesOnNewItem(itemNd);
	}

	var res = true;
	var self = this;

	function beforeRefreshCallback(itemNd) {
		if (!itemNd) {
			res = false;
			return;
		}

		//change source_id
		var source_idNd = itemNd.selectSingleNode('source_id');
		if (source_idNd != null) {
			var source_id_pasteNd = nodeToPaste.selectSingleNode('source_id');
			if (source_id_pasteNd == null) nodeToPaste.appendChild(source_idNd);
			else nodeToPaste.replaceChild(source_idNd, source_id_pasteNd);
		}

		//shange sort_order
		var sort_orderNd = itemNd.selectSingleNode('sort_order');
		if (sort_orderNd != null) {
			var sort_order_pasteNd = nodeToPaste.selectSingleNode('sort_order');
			if (sort_order_pasteNd == null) nodeToPaste.appendChild(sort_orderNd);
			else nodeToPaste.replaceChild(sort_orderNd, sort_order_pasteNd);
		}

		itemNd.parentNode.replaceChild(nodeToPaste, itemNd);

		self.predefined_hl_cell.start_edit = false;
	}

	this.onInsertRowCommand('after', beforeRefreshCallback);
	aras.clearStatusMessage(statusId);

	return res;
};

ConfigurableGrid.prototype.saveInputtedData = function ConfigurableGrid_saveInputtedData() {
	//this method is for internal purposes only.
	if (this.selectedCell) {
		this.applet.turnEditOff(); //to save data is being inputted
	}
};

ConfigurableGrid.prototype.deactivateGrid = function ConfigurableGrid_deactivateGrid() {
	//this method is for internal purposes only.
	if (this.hl_cell) {
		this.applet.clearCurCell(); //to unselect highlighted cell
	}
};

ConfigurableGrid.prototype.activateGrid = function ConfigurableGrid_activateGrid() {
	//this method is for internal purposes only.
	var cell = this.hl_cell;
	if (cell) {
		//cellValidationFailed will be reset to false inside onSelectCell
		this.applet.setCurCell(cell.getRowId(), cell.getColumnIndex());
	}
};

ConfigurableGrid.prototype.unselectHLCell = function ConfigurableGrid_unselectHLCell() {
	//this method is for internal purposes only.
	if (this.hl_cell) {
		this.initHL_Cell(); //reset hl_cell stored values
		this.applet.clearCurCell();
	}
};

ConfigurableGrid.prototype.addNewRootRow = function ConfigurableGrid_addNewRootRow() {
	//this method is for internal purposes only.
	this.saveInputtedData();
	this.unselectHLCell();
	var o = new EmulateInsertPressed();
	this.onKeyPressed(o);
};

ConfigurableGrid.prototype.startFindAndReplace = function ConfigurableGrid_startFindAndReplace() {
	//this method is for internal purposes only.
	var params = {
		findNext: new Function(
			'f_what',
			'match_case',
			'dlg',
			'return ' + this.instanceName + '.findNext(f_what, match_case, dlg);'
		),
		replace: new Function(
			'r_what',
			'r_with',
			'match_case',
			'dlg',
			'return ' +
				this.instanceName +
				'.replace(r_what, r_with, match_case, dlg);'
		),
		replaceAll: new Function(
			'r_what',
			'r_with',
			'match_case',
			'dlg',
			'return ' +
				this.instanceName +
				'.replaceAll(r_what, r_with, match_case, dlg);'
		),
		aras: aras,
		title: aras.getResource('', 'findandreplacedialog.replace'),
		dialogWidth: 360,
		dialogHeight: 130,
		center: true,
		help: true,
		content: 'FindAndReplaceDialog.html'
	};

	this.saveInputtedData();
	window.parent.ArasModules.Dialog.show('iframe', params);
};

ConfigurableGrid.prototype.escapeSpecialREChars = function ConfigurableGrid_escapeSpecialREChars(
	inString
) {
	//this method is for internal purposes only.
	var specialCharsArr = new Array(
			'\\',
			'$',
			'(',
			')',
			'*',
			'+',
			'.',
			'[',
			'?',
			'^',
			'{',
			'|'
		),
		specialChar,
		searchRegExp;

	for (var i = 0; i < specialCharsArr.length; i++) {
		specialChar = specialCharsArr[i];
		searchRegExp = new RegExp('\\' + specialChar, 'g');
		inString = inString.replace(searchRegExp, '\\' + specialChar);
	}

	return inString;
};

ConfigurableGrid.prototype.findNext = function ConfigurableGrid_findNext(
	searchValue,
	matchCase,
	dialog
) {
	//this method is for internal purposes only.
	if (searchValue) {
		var currCell = this.hl_cell,
			rowCount = this.applet.getRowsNum(),
			columnCount = this.applet.getColumnCount(),
			searchRegExp = new RegExp(searchValue, matchCase ? '' : 'i'),
			notFoundMessage = aras.getResource(
				'',
				'configurable_grid.no_match_found'
			),
			currRowNum,
			currColNum;

		if (!currCell) {
			if (rowCount) {
				currCell = this.applet.cells2(0, 0);
				if (!currCell) {
					alert(notFoundMessage);
					return false;
				}
				currRowNum = 0;
				currColNum = 0;
			} else {
				return true;
			}
		} else {
			currRowNum = this.applet.getRowIndex(currCell.getRowId());
			currColNum = currCell.getColumnIndex() + 1; //+1 because we want to find "next"
		}

		searchValue = this.escapeSpecialREChars(searchValue);

		for (; currRowNum < rowCount; currRowNum++) {
			for (; currColNum < columnCount; currColNum++) {
				currCell = this.applet.cells2(currRowNum, currColNum);

				if (currCell && searchRegExp.test(currCell.getValue())) {
					this.applet.setCurCell(
						currCell.getRowId(),
						currCell.getColumnIndex()
					);
					return true;
				}
			}
			currColNum = 0;
		}

		this.unselectHLCell();
		alert(notFoundMessage);
	}
	return false;
};

ConfigurableGrid.prototype.replace = function ConfigurableGrid_replace(
	searchValue,
	replaceValue,
	matchCase,
	dialog
) {
	//this method is for internal purposes only.
	var currCell = this.hl_cell;
	if (currCell) {
		searchValue = this.escapeSpecialREChars(searchValue);
		var re = new RegExp(searchValue, 'g' + (matchCase ? '' : 'i'));
		var newVal = this.replace_implementation(currCell, re, replaceValue);

		return re.test(newVal);
	}
	return false;
};

ConfigurableGrid.prototype.replace_implementation = function ConfigurableGrid_replace_implementation(
	currCell,
	re,
	replaceValue,
	silentErrors
) {
	//this method is for internal purposes only.
	var rowId = currCell.getRowId(),
		columIndex = currCell.getColumnIndex(),
		oldValue = currCell.getValue(),
		isChecksPassed = false,
		errorMessage = '';

	while (!isChecksPassed) {
		if (!currCell.isEditable()) {
			errorMessage = aras.getResource('', 'configurable_grid.field_read_only');
			break;
		}

		var column = this.getColumnDefinition(columIndex),
			dataType = aras.getItemProperty(column, 'datatype');

		if (!dataType || dataType == 'default') {
			dataType = this.columnNds[columIndex].getAttribute('data_type');
		}

		if (dataType != 'text' && dataType != 'string') {
			errorMessage = aras.getResource(
				'',
				'configurable_grid.replace_not_allowed'
			);
			break;
		}

		var xpath = this.calculateXPathForColumn(columIndex, rowId);
		if (!xpath) {
			break;
		}

		var items = this.selectIOMItems(xpath),
			itemCount = items.getItemCount();
		if (itemCount != 1) {
			errorMessage = aras.getResource(
				'',
				'configurable_grid.item_cannot_uniquely_defined'
			);
			break;
		}

		isChecksPassed = true;
	}

	// emulating cell edit cycle
	if (isChecksPassed && this.onCellEdit(0, rowId, columIndex)) {
		var newVal = oldValue.replace(re, replaceValue);

		currCell.setValue(newVal);
		this.onCellEdit(2, rowId, columIndex, true);
		this.applet.updateRow(rowId);

		return newVal;
	} else {
		if (errorMessage && !silentErrors) {
			alert(errorMessage);
		}

		return oldValue;
	}
};

ConfigurableGrid.prototype.replaceAll = function ConfigurableGrid_replaceAll(
	searchValue,
	replaceValue,
	match_case,
	dlg
) {
	//this method is for internal purposes only.
	searchValue = this.escapeSpecialREChars(searchValue);

	var searchExpression = new RegExp(searchValue, 'g' + (match_case ? '' : 'i')),
		rowCount = this.applet.getRowsNum(),
		columnCount = this.applet.getColumnCount();

	for (var r = 0; r < rowCount; r++) {
		for (var c = 0; c < columnCount; c++) {
			var currCell = this.applet.cells2(r, c);

			if (currCell && searchExpression.test(currCell.getValue())) {
				this.replace_implementation(
					currCell,
					searchExpression,
					replaceValue,
					true
				);
			}
		}
	}

	this.rePopulateGrid();
};

ConfigurableGrid.prototype.returnFocusToGrid = function ConfigurableGrid_returnFocusToGrid() {
	//this method is for internal purposes only.
	this.applet.requestFocus();
};

ConfigurableGrid.prototype.applyColumnQueryOrMethod = function ConfigurableGrid_applyColumnQueryOrMethod(
	item,
	col
) {
	//this method is for internal purposes only.

	col = parseInt(col);
	if (isNaN(col)) return null;

	var column = this.getColumnDefinition(col);
	var select_query = aras.getItemProperty(column, 'select_query');
	var select_method = aras.getItemProperty(column, 'select_method');

	var r = null;

	if (select_query) {
		var q = new Item();
		if (item) {
			select_query = select_query
				.replace(/\{itemtype\}/g, item.getType())
				.replace(/\{id\}/g, item.getID());
		}
		q.loadAML(select_query);
		r = q.apply();
	} else if (select_method) {
		var f = this.selectMethods[select_method];
		if (!f) {
			var methodNode = aras.MetadataCache.GetClientMethodNd(
				select_method,
				'id'
			);

			try {
				f = new Function(
					'item',
					aras.getItemProperty(methodNode, 'method_code')
				);
			} catch (excep) {
				this.showError(new Innovator().newError(excep.description));
				return null;
			}

			this.selectMethods[select_method] = f;
		}

		r = f(item);
	} else {
		return null;
	}

	if (r.isError()) {
		this.showError(r);
		return null;
	}

	return r;
};

ConfigurableGrid.prototype.showNothing = function ConfigurableGrid_showNothing() {
	//this method is for internal purposes only.
	this.appletContainer.style.display = 'none';
};

ConfigurableGrid.prototype.showError = function ConfigurableGrid_showError(
	err,
	showGrid
) {
	//this method is for internal purposes only.
	this.gridIsNotFunctional = true;

	if (showGrid != true) {
		this.showNothing();

		var btn = document.createElement('input');
		btn.setAttribute('type', 'button');
		btn.setAttribute(
			'value',
			aras.getResource('', 'configurable_grid.error_loading_grid')
		);

		if (this.applet) {
			btn = this.applet.parentNode.appendChild(btn);
		} else {
			document.write(
				'<input id="' +
					btn.uniqueID +
					'" type="button" value="' +
					aras.getResource('', 'configurable_grid.error_loading_grid') +
					'" >'
			);
			btn = document.getElementById(btn.uniqueID);
		}

		btn.onclick = function getErrDetails() {
			aras.AlertError(err);
		};
	} else aras.AlertError(err);
};

ConfigurableGrid.prototype.parseXPath = function ConfigurableGrid_parseXPath(
	xpath
) {
	//this method is for internal purposes only.

	var resArr = new Array();
	if (!xpath) return resArr;
	xpath = xpath.replace(/^\s+|\s+$/g, ''); //do trim

	var arr = xpath.split('/');
	var reTagNameWithCriteria = /^([^\[\]]+)((?:\[[^\[\]]*\])*)$/; //tag name with criteria. This regexp will not work properly if there are characters '[',']' inside filter.
	var reAttributeFilter = /\[\s*@(\w+)\s*=\s*["']([^'"]*)["']\s*\]/g; //This regexp will not work properly if there are characters '\'','"' inside filter.
	var reInnerNodeFilter = /\[\s*(\w+)\s*=\s*["']([^'"]*)["']\s*\]/g; //This regexp will not work properly if there are characters '\'','"' inside filter.

	for (var i = 0; i < arr.length; i++) {
		var t = arr[i];
		if (t.length === 0) {
			throw new Error("Support of '//' in xpath is not implemented");
		}
		if (t === '.') continue;
		if (t === '..') {
			resArr.pop();
			continue;
		}

		var tagInfo = {
			attributes: {},
			innerNodes: {},
			xpath: t
		};
		if (reTagNameWithCriteria.test(t)) {
			tagInfo.tag = RegExp.$1;
			var filters = RegExp.$2;
			tagInfo.filters = filters;
			var attributeFilters = filters.match(reAttributeFilter);
			if (attributeFilters) {
				for (var j = 0; j < attributeFilters.length; j++) {
					var attributeFilter = attributeFilters[j];
					reAttributeFilter.test(attributeFilter);

					tagInfo.attributes[RegExp.$1] = RegExp.$2;
				}
			}

			var innerNodeFilters = filters.match(reInnerNodeFilter);
			if (innerNodeFilters) {
				for (var j = 0; j < innerNodeFilters.length; j++) {
					var innerNodeFilter = innerNodeFilters[j];
					reAttributeFilter.test(innerNodeFilter);

					tagInfo.innerNodes[RegExp.$1] = RegExp.$2;
				}
			}
		} else {
			throw new Error(
				"Support of '[' and ']' inside filter is not implemented"
			);
		}

		resArr.push(tagInfo);
	}

	return resArr;
};

ConfigurableGrid.prototype.export2HTML = function ConfigurableGrid_export2HTML() {
	//this method is for internal purposes only.
	if (this.gridIsNotFunctional) return '';
	if (!this.isInitialized) return '';

	var self = this;
	var columns = self.gridDefinition.getRelationships('Grid Column');

	function buildXSLT() {
		if (self.export2HTML_cachedXSLT) return self.export2HTML_cachedXSLT;
		var n = columns.getItemCount();

		var resXSLT =
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">' +
			'<xsl:output method="html" encoding="UTF-8" indent="no"/>' +
			'<xsl:template name="calcRowspan">' +
			'<xsl:param name="pid"/>' +
			'<xsl:variable name="str">' +
			'<xsl:call-template name="buildStr">' +
			'<xsl:with-param name="pid" select="$pid"/>' +
			'</xsl:call-template>' +
			'</xsl:variable>' +
			'<xsl:value-of select="string-length($str)"/>' +
			'</xsl:template>' +
			'<xsl:template name="buildStr">' +
			'<xsl:param name="pid"/>' +
			'<xsl:variable name="chs" select="/Items/Item[@pid=$pid]"/>' +
			'<xsl:choose>' +
			'<xsl:when test="count($chs)=0">c</xsl:when>' +
			'<xsl:otherwise>' +
			'<xsl:for-each select="$chs">' +
			'<xsl:call-template name="buildStr">' +
			'<xsl:with-param name="pid" select="@id"/>' +
			'</xsl:call-template>' +
			'</xsl:for-each>' +
			'</xsl:otherwise>' +
			'</xsl:choose>' +
			'</xsl:template>' +
			'<xsl:template match="/">' +
			'<html xmlns:x="urn:schemas-microsoft-com:office:excel">' +
			'<head>' +
			'<base href="' +
			aras.getScriptsURL() +
			'"/>' +
			'<style type="text/css">' +
			'<xsl:comment>' +
			'table {table-layout:fixed;}' +
			'th {background-color:buttonface;}' +
			'td {mso-number-format:General; vertical-align:' +
			'top' +
			';}' +
			'pre {white-space:normal; word-wrap:break-word;}' +
			'br {mso-data-placement:same-cell;}' +
			'</xsl:comment>' +
			'</style>' +
			'</head>' +
			'<body>' +
			'<table x:str="" border="1" cellpadding="0" cellspacing="0" cols="' +
			columns.getItemCount() +
			'">' +
			'<xsl:for-each select="/Items/@*[starts-with(local-name(),\'width\')]">' +
			'<col width="{.}">' +
			'<xsl:if test=". = 0">' +
			'<xsl:attribute name="style">display:none</xsl:attribute>' +
			'</xsl:if>' +
			'</col>' +
			'</xsl:for-each>' +
			'<thead>' +
			'<tr>';

		for (var i = 0; i < n; i++) {
			resXSLT +=
				'<th>' + columns.getItemByIndex(i).getProperty('label') + '</th>';
		}

		resXSLT +=
			'</tr>' +
			'</thead>' +
			'<tbody>' +
			'<xsl:apply-templates select="/Items/Item[not(@pid)]" mode="generateTR"/>' +
			'</tbody>' +
			'</table>' +
			'</body>' +
			'</html>' +
			'</xsl:template>' +
			'<xsl:template match="Item" mode="generateTR">' +
			'<xsl:variable name="id" select="@id"/>' +
			'<xsl:variable name="rowspan">' +
			'<xsl:call-template name="calcRowspan">' +
			'<xsl:with-param name="pid" select="$id"/>' +
			'</xsl:call-template>' +
			'</xsl:variable>' +
			'<xsl:variable name="firstchild" select="/Items/Item[@pid=$id][position() = 1]"/>' +
			'<xsl:variable name="firstchildID" select="$firstchild/@id"/>' +
			'<tr>' +
			'<xsl:apply-templates select="prop">' +
			'<xsl:with-param name="rowspan" select="$rowspan"/>' +
			'</xsl:apply-templates>' +
			'<xsl:apply-templates select="$firstchild"/>' +
			'</tr>' +
			'<xsl:apply-templates mode="generateNestedRows" select="."/>' +
			'</xsl:template>' +
			'<xsl:template match="Item" mode="generateNestedRows">' +
			'<xsl:variable name="id" select="@id"/>' +
			'<xsl:apply-templates select="/Items/Item[@pid=$id][position() = 1]" mode="generateNestedRows"/>' +
			'<xsl:apply-templates select="/Items/Item[@pid=$id][position() &gt; 1]" mode="generateTR"/>' +
			'</xsl:template>' +
			'<xsl:template match="Item">' +
			'<xsl:variable name="id" select="@id"/>' +
			'<xsl:variable name="rowspan">' +
			'<xsl:call-template name="calcRowspan">' +
			'<xsl:with-param name="pid" select="$id"/>' +
			'</xsl:call-template>' +
			'</xsl:variable>' +
			'<xsl:apply-templates select="prop">' +
			'<xsl:with-param name="rowspan" select="$rowspan"/>' +
			'</xsl:apply-templates>' +
			'<xsl:apply-templates select="/Items/Item[@pid=$id][position() = 1]"/>' +
			'</xsl:template>' +
			'<xsl:template match="prop">' +
			'<xsl:param name="rowspan"/>' +
			'<td rowspan="{$rowspan}">' +
			'<xsl:variable name="ch" select="*[1]"></xsl:variable>' +
			'<xsl:choose>' +
			'<xsl:when test="not($ch)"><pre><xsl:value-of select="."/></pre></xsl:when>' +
			'<xsl:when test="local-name($ch)=\'checkbox\'">' +
			'<input type="checkbox">' +
			'<xsl:if test="$ch/@state=\'1\'">' +
			'<xsl:attribute name="checked"/>' +
			'</xsl:if>' +
			'</input>' +
			'</xsl:when>' +
			'<xsl:otherwise>' +
			'<xsl:copy-of select="$ch"/>' +
			'</xsl:otherwise>' +
			'</xsl:choose>' +
			'</td>' +
			'</xsl:template>' +
			'</xsl:stylesheet>';

		self.export2HTML_cachedXSLT = resXSLT;
		return resXSLT;
	}

	var resXSLT = buildXSLT();
	if (!resXSLT) return;

	var i = new Item();
	i.loadAML(this.applet.getXML(false));

	var r = i.dom.documentElement;
	for (var j = 0; j < columns.getItemCount(); j++) {
		r.setAttribute('width' + j, this.applet.getColWidth(j));
	}

	var resHTML = i.applyStylesheet(resXSLT, 'text');

	return resHTML;
};

ConfigurableGrid.prototype.applyIOMMethod = function ConfigurableGrid_applyIOMMethod(
	methodId,
	item
) {
	//this method is for internal purposes only.
	var methodNd = aras.MetadataCache.GetClientMethodNd(methodId, 'id'),
		methodCode;

	if (methodNd) {
		methodCode = aras.getItemProperty(methodNd, 'method_code');

		var methodNamesWithTopAras = [
				'PM_ACW_CFGGRIDSONLOAD',
				'PM_PREDECESSORCGONLOAD'
			],
			methodNameUpper = aras.getItemProperty(methodNd, 'name').toUpperCase();

		if (methodNamesWithTopAras.indexOf(methodNameUpper) !== -1) {
			methodCode = methodCode.replace(/\btop.aras\b/g, 'aras');
		}

		item.SetThisMethodImplementation(new Function(methodCode));
		res = item.ThisMethod(undefined);
		if (res === undefined) res = item;
	} else {
		var q = new Item('Method', 'get');
		q.setProperty('id', methodId);
		q.setAttribute('select', 'name,method_type,method_code');
		var m = q.apply();
		if (m.isError()) {
			this.showError(m);
			return;
		}
		var i = new Innovator();
		res = i.applyMethod(m.getProperty('name'), item.dom.xml);
	}

	return res;
};

ConfigurableGrid.prototype.rePopulateGrid = function ConfigurableGrid_rePopulateGrid() {
	//this method is for internal purposes only.
	return this.populateGrid(true);
};

ConfigurableGrid.prototype.populateGrid = function ConfigurableGrid_populateGrid(
	repopulate
) {
	//this method is for internal purposes only.
	//parameter repopulate is ignored.

	if (this.userMethodRequiresRePopulating) {
		//to support grid repopulating in user methods
		this.userMethodRequiresRePopulating = false;
	}

	this.populateGridIsInProgress = true;
	var rootItemTypeName = this.getRootItemTypeName();
	this.cachedXSLT = this.cachedXSLT.replace(
		'{$RootItemTypeName}',
		rootItemTypeName
	);

	var eventHandler = new EventHandler(this);
	if (eventHandler.getEventNodes('onpopulategrid', 'grid').length == 1) {
		eventHandler.handleEvent('onpopulategrid', 'grid');
	} else {
		var xml = aras.applyXsltString(this.topLevelNode, this.cachedXSLT);
		this.applet.reloadData(xml);
	}

	if (repopulate) this.setDirtyAttr4ParentItemIfNeed();
};

ConfigurableGrid.prototype.getDom = function ConfigurableGrid_getDom() {
	//this method is for internal purposes only.
	return this.topLevelNode;
};

ConfigurableGrid.prototype.getGridName = function ConfigurableGrid_getGridName() {
	//this method is for internal purposes only.
	if (!this.gridDefinition) return '';
	return this.gridDefinition.getProperty('name');
};

ConfigurableGrid.prototype.mergeItemRelationships = function ConfigurableGrid_mergeItemRelationships(
	oldItem,
	newItem
) {
	//this method is for internal purposes only.
	var newRelationships = newItem.selectSingleNode('Relationships');
	if (newRelationships != null) {
		var oldRelationships = oldItem.selectSingleNode('Relationships');
		if (oldRelationships == null) {
			var oldDoc = oldItem.ownerDocument;
			oldRelationships = oldItem.appendChild(
				oldDoc.createElement('Relationships')
			);
		}

		this.mergeItemsSet(oldRelationships, newRelationships);
	}
};

ConfigurableGrid.prototype.mergeItem = function ConfigurableGrid_mergeItem(
	oldItem,
	newItem
) {
	//this method is for internal purposes only.
	var allPropsXpath = "*[local-name()!='Relationships']";

	var oldAction = oldItem.getAttribute('action');
	if (!oldAction) oldAction = 'skip';

	if (oldAction == 'delete') {
		//do not merge newItem into oldSet
	} else if (oldAction == 'add') {
		//this should never happen because getItem results cannot return not saved Item. do nothing here.
	} else if (oldAction == 'update' || oldAction == 'edit') {
		//we can add only missing properties here and merge relationships
		var newProps = newItem.selectNodes(allPropsXpath);
		for (var i = 0; i < newProps.length; i++) {
			var newProp = newProps[i];

			var propNm = newProp.nodeName;
			var oldProp = oldItem.selectSingleNode(propNm);

			if (!oldProp) {
				oldItem.appendChild(newProp.cloneNode(true));
			} else {
				var oldPropItem = oldProp.selectSingleNode('Item');
				if (oldPropItem) {
					var newPropItem = newProp.selectSingleNode('Item');
					if (newPropItem) this.mergeItem(oldPropItem, newPropItem);
				}
			}
		}

		//merge relationships
		this.mergeItemRelationships(oldItem, newItem);
	} else if (oldAction == 'skip') {
		//all properties not containing Items can be replaced here.

		//process oldItem properies with * NO * Item inside
		var oldProps = oldItem.selectNodes(allPropsXpath + '[not(Item)]');
		for (var i = 0; i < oldProps.length; i++) {
			var oldProp = oldProps[i];

			var propNm = oldProp.nodeName;
			var newProp = newItem.selectSingleNode(propNm);

			if (newProp) oldItem.replaceChild(newProp.cloneNode(true), oldProp);
		}

		//process oldItem properies with Item inside
		var oldItemProps = oldItem.selectNodes(allPropsXpath + '[Item]');
		for (var i = 0; i < oldItemProps.length; i++) {
			var oldProp = oldItemProps[i];

			var propNm = oldProp.nodeName;
			var newProp = newItem.selectSingleNode(propNm);

			if (newProp) {
				var oldPropItem = oldProp.selectSingleNode('Item');
				var newPropItem = newProp.selectSingleNode('Item');
				if (newPropItem) this.mergeItem(oldPropItem, newPropItem);
				else {
					var oldPropItemAction = oldPropItem.getAttribute('action');
					if (!oldPropItemAction) oldPropItemAction = 'skip';

					if (oldPropItemAction == 'skip')
						oldItem.replaceChild(newProp.cloneNode(true), oldProp);
				}
			}
		}

		//process all newItem properties which are missing in oldItem
		var newProps = newItem.selectNodes(allPropsXpath);
		for (var i = 0; i < newProps.length; i++) {
			var newProp = newProps[i];

			var propNm = newProp.nodeName;
			var oldProp = oldItem.selectSingleNode(propNm);

			if (!oldProp) oldItem.appendChild(newProp.cloneNode(true));
		}

		//merge relationships
		this.mergeItemRelationships(oldItem, newItem);
	}
};

ConfigurableGrid.prototype.mergeItemsSet = function ConfigurableGrid_mergeItemsSet(
	oldSet,
	newSet
) {
	//this method is for internal purposes only.

	//both oldSet and newSet are nodes with Items inside. (oldSet and newSet normally are AML or Relationships nodes)
	var oldDoc = oldSet.ownerDocument;

	//we don't expect action attribute specified on Items from newSet
	var newItems = newSet.selectNodes('Item[not(@action)]');
	for (var i = 0; i < newItems.length; i++) {
		var newItem = newItems[i];
		var newId = newItem.getAttribute('id');
		var newType = newItem.getAttribute('type');

		var oldItem = oldSet.selectSingleNode(
			'Item[@id="' + newId + '"][@type="' + newType + '"]'
		);
		if (!oldItem) {
			//
			oldItem = oldSet.appendChild(oldDoc.createElement('Item'));
			oldItem.setAttribute('id', newId);
			oldItem.setAttribute('type', newType);
		}

		this.mergeItem(oldItem, newItem);
	}
};

ConfigurableGrid.prototype.hasSeparateDom = function ConfigurableGrid_hasSeparateDom() {
	//this method is for internal purposes only.
	if (this.gridIsNotFunctional) return;
	return this.topLevelNode.ownerDocument == this.topLevelNode.parentNode;
};

ConfigurableGrid.prototype.setDirtyAttr4ParentItemIfNeed = function ConfigurableGrid_setDirtyAttr4ParentItemIfNeed() {
	//this method is for internal purposes only.
	var piNd = parent.item;
	if (!piNd || this.hasSeparateDom()) return;

	var actionExists =
		piNd.selectSingleNode(
			'descendant-or-self::Item[string(@action)!="" and @action!="get" and @action!="skip" or @isDirty="1"]'
		) != null;
	if (!actionExists) return;

	if (!piNd.getAttribute('action')) piNd.setAttribute('action', 'update');

	if (piNd.getAttribute('isDirty') != '1') piNd.setAttribute('isDirty', '1');
};

////////////////////////////   ++++ public methods ++++    ////////////////////////////
ConfigurableGrid.prototype.runQuery = function ConfigurableGrid_runQuery(
	doMerge
) {
	//this is a public method
	if (this.gridIsNotFunctional) return;
	if (!this.isInitialized) return;

	if (doMerge === undefined) {
		doMerge = !this.hasSeparateDom();
	}

	if (!this.isGridAppletLoaded) {
		setTimeout(this.instanceName + '.runQuery(' + doMerge + ')', 100);
		return;
	}

	var qryRes = null;
	var query = this.gridDefinition.getProperty('query');
	if (query) {
		query = query
			.replace(/\{itemtype\}/g, this.item_typeName)
			.replace(/\{id\}/g, this.item_id);

		var i = new Item();
		i.loadAML(query);

		var msgId = aras.showStatusMessage(
			'status',
			aras.getResource('', 'configurable_grid.running_grid_query'),
			this.inProgressImg
		);
		qryRes = i.apply();
		aras.clearStatusMessage(msgId);
	} else {
		var i = new Item(this.item_typeName);
		i.setID(this.item_id);
		qryRes = i;
	}

	if (qryRes.isError()) {
		if (qryRes.getErrorWho() == 0) {
			qryRes.loadAML('<AML/>');
		} else {
			this.showNothing();
			return;
		}
	}

	// +++ convert server resonse into <AML><Item id="1" /> ... <Item id="n" /></AML> form
	var xslt =
		"<xsl:stylesheet version='1.0' xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>\n" +
		"<xsl:output omit-xml-declaration='yes' method='xml'/>\n" +
		"<xsl:template match='/'>\n" +
		'<AML>' +
		"<xsl:apply-templates select='//Result' />\n" +
		'</AML>' +
		'</xsl:template>\n' +
		"<xsl:template match='Result'>\n" +
		"<xsl:apply-templates select='@* | node()' />" +
		'</xsl:template>\n' +
		"<xsl:template match='@* | node()'>\n" +
		'<xsl:copy>\n' +
		"<xsl:apply-templates select='@* | node()' />\n" +
		'</xsl:copy>\n' +
		'</xsl:template>\n' +
		'</xsl:stylesheet>';

	var aml = qryRes.applyStylesheet(xslt, 'text');
	qryRes.loadAML(aml);
	// --- convert server resonse into <AML><Item id="1" /> ... <Item id="n" /></AML> form

	// +++ pass the AML into user-defined IOM method
	var method = this.gridDefinition.getProperty('method');
	if (method) {
		//it's up to user to return valid Item
		var msgId = aras.showStatusMessage(
			'status',
			aras.getResource('', 'configurable_grid.applying_grid_method'),
			this.inProgressImg
		);
		qryRes = this.applyIOMMethod(method, qryRes);
		aras.clearStatusMessage(msgId);
	}
	// --- pass the AML into user-defined IOM method

	// +++ initialize "root" ItemType name
	var RootItemTypeName = '';

	var nd = qryRes.dom.selectSingleNode('/AML/Item[@type]'); //will use an existing node as a template
	if (nd) {
		RootItemTypeName = nd.getAttribute('type');

		if (nd.getAttribute('CGridStub') == '1') nd.parentNode.removeChild(nd);
	} else {
		var query = this.gridDefinition.getProperty('query');
		if (query) {
			var i = new Item();
			i.loadAML(query);

			nd = i.dom.selectSingleNode('/Item[@type]');
			if (nd) RootItemTypeName = nd.getAttribute('type');
		}
	}

	this.getRootItemTypeName_res = RootItemTypeName;
	// --- initialize "root" ItemType name

	// +++ merge query results into topLevelNode
	var newSet = qryRes.dom.selectSingleNode('//AML');
	if (newSet) {
		if (!doMerge) this.topLevelNode.text = '';
		this.mergeItemsSet(this.topLevelNode, newSet);
	}
	// --- merge query results into topLevelNode

	this.populateGrid(false);
};

ConfigurableGrid.prototype.setVisible = function ConfigurableGrid_setVisible(
	doVisible
) {
	if (this.isInitialized) {
		this.appletContainer.style.display = doVisible ? 'block' : 'none';
	}
};

ConfigurableGrid.prototype.setEditMode = function ConfigurableGrid_setEditMode(
	doEditable
) {
	//this is a public method
	switch (typeof doEditable) {
		case 'boolean':
			this.isEditMode = doEditable;
			break;
		case 'string':
			this.isEditMode = doEditable == '1';
			break;
	}
};

ConfigurableGrid.prototype.getImplementationObject = function ConfigurableGrid_getImplementationObject() {
	//this is a public method.
	//However the type of returned object depends on implementation.
	//In current implementation an instance of JExcelGridApplet class is returned.

	if (!this.isInitialized) return null;
	return this.applet;
};

ConfigurableGrid.prototype.getSelectedRowId = function ConfigurableGrid_getSelectedRowId() {
	//this is a public method
	return this.selectedRowId;
};

ConfigurableGrid.prototype.getSelectedColumn = function ConfigurableGrid_getSelectedColumn() {
	//this is a public method
	return this.selectedColumnNum;
};

ConfigurableGrid.prototype.invalidateContent = function ConfigurableGrid_invalidateContent() {
	//this is a public method
	this.userMethodRequiresRePopulating = true;
};

ConfigurableGrid.prototype.showInvalidValueAlert = function ConfigurableGrid_showInvalidValueAlert(
	cell,
	msg
) {
	//this is a public method
	if (msg === undefined)
		msg = aras.getResource('', 'configurable_grid.value_invalid');

	this.cellValidationFailed = true;

	var continueEdit = confirm(msg);
	setTimeout(this.instanceName + '.returnFocusToGrid()', 1);

	return continueEdit;
};

ConfigurableGrid.prototype.markItemToCopyByRef = function ConfigurableGrid_markItemToCopyByRef(
	itm
) {
	//this is a public method

	for (var i = 0; i < itm.getItemCount(); i++) {
		var curItm = itm.getItemByIndex(i);
		var itms2NotGet = curItm.getItemsByXPath(
			"descendant-or-self::Item[@action and @action!='get' and @action!='skip']"
		);
		if (itms2NotGet.getItemCount() > 0) {
			curItm = itms2NotGet.getItemByIndex(0);
			throw new Error(
				1,
				aras.getResource(
					'',
					'configurable_grid.item_type_cannot_be_copied',
					curItm.getAttribute('type'),
					curItm.getAttribute('id'),
					curItm.getAttribute('action')
				)
			);
		}
		curItm.setAttribute(this.copyByRefAttrNm, '1');
	}
};

ConfigurableGrid.prototype.setNewItemCreationEnabled = function ConfigurableGrid_setNewItemCreationEnabled(
	isEnabled
) {
	//this is a public method
	this.newItemCreationDisabled = !isEnabled;
};

ConfigurableGrid.prototype.overrideMethod = function ConfigurableGrid_overrideMethod(
	methodName
	/*methodF, makeACopy*/
	/* or */
	/*argName0, argName1, ... argNameN, methodCode*/
) {
	//this is public method.
	/*
	 * methodName - name of the method to override (base method will be available as this.base$<methodName>).
	 * the rest of parameters may be different:
	 * 1) Pass a funtion to override the method:
	 * arguments[1] - (methodF) instance of class Function.
	 * arguments[2] - (makeACopy) Boolean. make a copy of a function (context of original function becomes unavaliable).
	 *                true by deafult.
	 *
	 * 2) Pass method code to override the method:
	 * arguments[1]...arguments[N-2] - names of parameters for the new method.
	 * arguments[N-1] - String. Method code.
	 */

	var baseMethodName = 'base$' + methodName;
	var baseMethod = this[baseMethodName];
	if (!baseMethod) {
		baseMethod = this[methodName];
		if (!baseMethod) {
			throw new Error(
				1,
				aras.getResource(
					'',
					'configurable_grid.no_method_in_configurablegrid',
					methodName
				)
			);
		}

		this[baseMethodName] = baseMethod;
	}

	var method = null;
	var methodType = 'function';
	var makeACopy = true;
	if (arguments.length > 1) {
		method = arguments[1];
		if (method) {
			methodType = typeof method;
			if (methodType == 'function') {
				makeACopy = arguments[2];
				if (makeACopy == undefined) makeACopy = true;

				//It's also possible to parse the string to get parameters list and method code.
				//Review what is better.
				if (makeACopy) {
					var functionStr = method.toString();
					//extract function arguments
					functionStr.search(/\(([^\)]*)\)/); //find "(...)"
					var args = RegExp.$1.replace(/\s/g, '').replace(/,/g, '","'); //remove all white spaces and replace [,] with [","]
					if (args.length > 0) args = '"' + args + '"';

					//extract function code
					functionStr.search(/\{([\W\w]*)\}$/);
					var methodCode = RegExp.$1;

					method = eval('new Function(' + args + ', methodCode)');
				}
			} else {
				var methodCode = arguments[arguments.length - 1];
				var args = '';
				for (var i = 1; i < arguments.length - 1; i++) {
					args += 'arguments[' + i + '],';
				}

				method = eval('new Function(' + args + ' methodCode)');
			}
		}
	}

	var newMethod = method;
	if (!newMethod) {
		//restore original base method
		newMethod = baseMethod;
	}

	this[methodName] = newMethod;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL EDITOR
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellEditor(grid, rowId, col) {
	this.grid = grid;
	this.rowId = rowId;
	this.col = parseInt(col);
	this.grid = grid;
	this.column = this.grid.getColumnDefinition(this.col);
	this.columns = this.grid.gridDefinition.columnDescriptors;
	this.datatype = aras.getItemProperty(this.column, 'datatype');
	this.property = this.grid.columnNds[this.col];
	this.data_type = this.property.getAttribute('data_type');
	this.applet = this.grid.applet;
	this.xpath = undefined;
	this.item = undefined;
	this.handler = undefined;

	this.xpath = this.grid.calculateXPathForColumn(this.col, this.rowId);

	if (this.xpath == '') {
		// create item if it not exist
		if (this.createRequiredItem()) {
			this.xpath = this.grid.calculateXPathForColumn(this.col, this.rowId);
		}
	}

	if (this.xpath) {
		// get item by xpath
		var items = this.grid.selectIOMItems(this.xpath);
		if (items.getItemCount() == 0) {
			if (this.createRequiredItem()) {
				items = this.grid.selectIOMItems(this.xpath);
			}
		}
		if (items.getItemCount() == 1) {
			this.item = items.getItemByIndex(0);
		} else if (items.getItemCount() > 1) {
			if (this.datatype == 'bound_multi' || this.datatype == 'unbound_multi')
				this.item = items;
		}
	}

	this.cell = this.applet.cells(this.rowId, this.col);
	this.propNm = this.grid.calculatePropNmForColumn(this.col);
	this.pattern =
		!this.property.getAttribute('pattern') && this.data_type == 'date'
			? 'short_date'
			: this.property.getAttribute('pattern');

	this.handler = new EventHandler(this.grid, this.rowId, this.col, this.item);
}

////////////////////////////   ++++ public methods ++++    ////////////////////////////

CellEditor.prototype.getItem = function CellEditor_getItem() {
	return this.item;
};

CellEditor.prototype.showDialog = function CellEditor_showDialog() {
	if (this.checkEditMode() && this.onEditStart()) {
		var dialog = new Dialog();

		dialog.init(
			this.applet,
			this.grid,
			this.rowId,
			this.col,
			this.cell,
			this.column,
			this.columns,
			this.property,
			this.propNm,
			this.data_type,
			this.datatype,
			this.pattern,
			this.item
		);

		var self = this;
		if (this.datatype == 'default' || this.datatype == 'text') {
			dialog.showStandardDialog(function (dialogResult) {
				if (dialogResult !== undefined) {
					var customCell = self.createCustomCell();
					customCell.setPropertyValue(dialogResult);
					customCell.save();
				}
				self.onEditFinish();
				self.grid.returnFocusToGrid();
			});
		} else if (
			this.datatype == 'bound_multi' ||
			this.datatype == 'unbound_multi' ||
			this.datatype == 'bound_select' ||
			this.datatype == 'unbound_select'
		) {
			dialog.showSelectDialog(function (dialogResult) {
				if (dialogResult) {
					var rowIndex = self.cell.grid_Experimental.focus.rowIndex, // save id of the current selected row
						cellIndex = parseInt(
							self.cell.cellNod_Experimental.getAttribute('idx')
						);

					self.predefined_hl_cell = {
						start_edit: false,
						row: rowIndex,
						col: self.col
					};
					self.grid.rePopulateGrid();
					self.cell.grid_Experimental.focus.setFocusIndex(rowIndex, cellIndex); //restore selected item after repopulate grid
				}
				self.onEditFinish();
				self.grid.returnFocusToGrid();
			});
		}
	}
};

CellEditor.prototype.switchMode = function CellEditor_switchMode(
	mode,
	skipModifiedCheck
) {
	if (this.checkEditMode()) {
		if (this.needRepopulating(mode)) return true;

		this.saveSelectedCellInfo();

		//select action by mode
		var ret;
		switch (mode) {
			case 0:
				ret = this.beginEditCell();
				break;
			case 1:
				ret = this.editCell();
				break;
			case 2:
				ret = this.endEditCell(skipModifiedCheck);
				break;
			case 10:
				ret = this.tabPressedOnCell();
				break;
			case 21:
				ret = this.enterPressedOnCell();
				break;
			default:
				debugger;
		}
		return ret;
	} else if (this.cell && this.cell.isCheckbox()) {
		this.restoreCheckBoxValue(this.cell);
	}

	return false;
};

CellEditor.prototype.setValue = function CellEditor_setValue(value) {
	var retValue = false;
	if (
		this.checkEditMode() &&
		this.datatype != 'federated' &&
		this.datatype != 'dependent'
	) {
		if (this.onEditStart()) {
			// check if 'onsetvalue' method is defined
			if (this.handler.getEventNodes('onsetvalue', 'cell').length == 1) {
				retValue = this.onSetValue(value);
			} else {
				//this.item = this.item.getItemByIndex(0);
				var customCell = this.createCustomCell();
				customCell.setPropertyValue(value);
				retValue = customCell.save();
			}
			if (retValue) {
				this.onEditFinish();
			}
		}
	}
	return retValue;
};

CellEditor.prototype.getValue = function CellEditor_getValue() {
	if (this.handler.getEventNodes('ongetvalue', 'cell').length == 1) {
		return this.onGetValue();
	} else if (this.item) {
		return this.item.getProperty(this.propNm, '');
	}
	return undefined;
};

////////////////////////////   ---- public methods ----    ////////////////////////////
////////////////////////////   ++++     events     ++++    ////////////////////////////

CellEditor.prototype.onEditStart = function CellEditor_onEditStart() {
	if (
		this.grid.lockItemBeforeEditStart(this.item) &&
		this.handler.handleEvent('oneditstart', 'cell', null)
	)
		return true;
	return false;
};

CellEditor.prototype.onEdit = function CellEditor_onEdit(
	sourceRowId,
	sourceCol,
	newValue
) {
	// sourceRowId and sourceCol is rowId and col of item that will be copied by user method
	// or is rowId and col for current item, if it is not copy operation
	var params = {};
	params.sourceRowId = sourceRowId;
	params.sourceCol = sourceCol;
	params.newValue = newValue;
	params.rowId = this.rowId;
	params.col = this.col;

	return this.handler.handleEvent('onedit', 'cell', params);
};

CellEditor.prototype.onSetValue = function CellEditor_onSetValue(newValue) {
	var params = {};
	params.rowId = this.rowId;
	params.col = this.col;
	params.newValue = newValue;
	return this.handler.handleEvent('onsetvalue', 'cell', params);
};

CellEditor.prototype.onGetValue = function CellEditor_onGetValue() {
	var params = {};
	params.rowId = this.rowId;
	params.col = this.col;
	return this.handler.handleEvent('ongetvalue', 'cell', params);
};

CellEditor.prototype.onChangeCell = function CellEditor_onChangeCell(newValue) {
	var params = {};
	params.newValue = newValue;
	return this.handler.handleEvent('onchangecell', 'cell', params);
};

CellEditor.prototype.onEditFinish = function CellEditor_onEditFinish() {
	this.grid.selectedCell = null;
	return this.handler.handleEvent('oneditfinish', 'cell', null);
};

////////////////////////////   ----     events     ----    ////////////////////////////
////////////////////////////   ++++ private methods ++++    ////////////////////////////

CellEditor.prototype.beginEditCell = function CellEditor_beginEditCell() {
	if (this.grid.predefinedEditResult[this.col] !== undefined)
		return this.grid.predefinedEditResult[this.col];

	if (!this.onEditStart()) return false;

	var customCell = this.createCustomCell();
	return customCell.load();
};

CellEditor.prototype.editCell = function CellEditor_editCell() {
	if (this.cell.isCheckbox()) {
		if (this.onEditStart()) {
			var customCell = this.createCustomCell();
			customCell.setViewValue(this.cell.isChecked() ? '1' : '0');
			var ret = customCell.save();
			this.onEditFinish();
		} else {
			this.restoreCheckBoxValue();
			return false;
		}
	}
	return true;
};

CellEditor.prototype.endEditCell = function CellEditor_endEditCell(
	skipModifiedCheck
) {
	if (!skipModifiedCheck && !this.cell.wasChanged()) {
		this.onEditFinish();
		return true;
	}
	var customCell = this.createCustomCell();
	customCell.setViewValue(this.cell.getValue());
	var ret = customCell.save();
	if (ret) {
		this.onEditFinish();
	}
	return ret;
};

CellEditor.prototype.tabPressedOnCell = function CellEditor_tabPressedOnCell() {
	//we don't want to process <tab> event here
	this.grid.recordLastTabTime();
	return true;
};

CellEditor.prototype.enterPressedOnCell = function CellEditor_enterPressedOnCell() {
	if (!this.grid.validateCurrentCell()) {
		//to save data and validate user input
		this.grid.resetValidationFlag();
		return false;
	}
	return true;
};

CellEditor.prototype.restoreCheckBoxValue = function CellEditor_restoreCheckBoxValue() {
	var propVal = this.item.getProperty(this.propNm, '');
	this.cell.setChecked(propVal == '1' ? 1 : 0);
};

CellEditor.prototype.needRepopulating = function (mode) {
	if (this.grid.userMethodRequiresRePopulating) {
		this.grid.isRedundantEditOfCell = true;
		return true;
	}
	if (this.grid.isRedundantEditOfCell) {
		if (mode == '2') {
			this.grid.isRedundantEditOfCell = false;
		}
		return true;
	}
	return false;
};

CellEditor.prototype.checkEditMode = function CellEditor_checkEditMode() {
	return this.item && this.grid.isEditMode;
};

CellEditor.prototype.createRequiredItem = function CellEditor_createRequiredItem() {
	if (!this.grid.longTimePassedFromLastTab()) {
		if (
			(this.datatype == 'default' && this.data_type == 'image') ||
			this.datatype == 'bound_multi'
		)
			return false; //if dialog will not be opened then there is no reason to generate underlying xml
	}

	res = this.grid.createItemForColumn(this.col, this.rowId);
	if (res) {
		var newRowId = this.grid.calculateXPathForNode(res);
		this.grid.predefined_hl_cell = {
			start_edit: false,
			row: this.applet.getRowIndex(this.rowId),
			col: this.col
		};

		this.grid.rePopulateGrid();
		return true;
	}

	return false;
};

CellEditor.prototype.saveSelectedCellInfo = function CellEditor_saveSelectedCellInfo() {
	this.grid.selectedItem = this.item;
	this.grid.selectedProperty = this.propNm;
	this.grid.selectedColumnNum = this.col;
	this.grid.selectedRowId = this.rowId;
	this.grid.selectedCell = this.cell;
};

CellEditor.prototype.createCombo = function CellEditor_createCombo(
	columnIndex,
	options,
	comboType
) {
	var listLabels = new Array(),
		listVals = new Array(),
		option,
		label,
		value,
		i;

	listLabels.push(' ');
	listVals.push(' ');
	for (i = 0; i < options.getItemCount(); i++) {
		option = options.getItemByIndex(i);
		label = option.getProperty('label');
		value = option.getProperty('value');
		if (label === undefined || label === '') {
			label = value;
		}
		listLabels.push(label);
		listVals.push(value);
	}
	comboType = comboType ? parseInt(comboType) : 0;
	this.cell.setComboType(comboType);
	this.cell.setCombo_Experimental(listLabels, listVals);
};

CellEditor.prototype.createTextArea = function CellEditor_createTextArea(
	columnIndex
) {
	this.applet.setColumnProperty(columnIndex, 'editableType', 'Textarea');
};

CellEditor.prototype.createCustomCell = function CellEditor_createCustomCell() {
	var customCell = undefined;
	switch (this.datatype) {
		case 'default':
			customCell = new CellDefault();
			break;
		case 'text':
			customCell = new CellText();
			break;
		case 'dependent':
			customCell = new CellDependent();
			break;
		case 'bound_select':
			customCell = new CellBoundSelectUnboundSelect();
			break;
		case 'unbound_select':
			customCell = new CellBoundSelectUnboundSelect();
			break;
		case 'bound_multi':
			customCell = new CellBoundMulti();
			break;
		case 'unbound_multi':
			customCell = new CellUnboundMulti();
			break;
		default:
			debugger;
	}
	customCell.init(
		this.applet,
		this.grid,
		this,
		this.rowId,
		this.col,
		this.cell,
		this.column,
		this.columns,
		this.property,
		this.propNm,
		this.data_type,
		this.datatype,
		this.pattern,
		this.item
	);
	return customCell;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BASE CELL
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function BaseCell() {}

BaseCell.prototype.init = function (
	applet,
	grid,
	editor,
	rowId,
	col,
	cell,
	column,
	columns,
	property,
	propNm,
	data_type,
	datatype,
	pattern,
	item
) {
	this.applet = applet;
	this.grid = grid;
	this.editor = editor;
	this.rowId = rowId;
	this.col = col;
	this.cell = cell;
	this.column = column;
	this.columns = columns;
	this.property = property;
	this.propNm = propNm;
	this.datatype = datatype;
	this.data_type = data_type;
	this.pattern = pattern;
	this.item = item;
	this.node = item.node;
	this.text = undefined; // visible value, that stored in cell and typed by user
	this.value = undefined; // property value, that stored in dom
};

BaseCell.prototype.SetInputHelperEnabled = function BaseCell_SetInputHelperEnabled(
	doEnabled
) {
	if (doEnabled) {
		this.cell.InputHelperEnabled = true;
	} else {
		if (this.cell.InputHelperEnabled) {
			this.cell.InputHelperEnabled = false;
		}
	}
};

BaseCell.prototype.load = function BaseCell_load() {
	// this method set control state before edit start: create combo, call dialogs, remember cell value ...
	this.text = this.cell.getValue();
	this.value = this.item.getProperty(this.propNm, '');
	return true;
};

BaseCell.prototype.preserveValue = function () {
	// private method that save cell text to this.grid.preservedCellValue  before edit start
	this.grid.preservedCellValue = this.text;
};

BaseCell.prototype.restoreValue = function () {
	// private method that restore cell text
	this.text = this.grid.preservedCellValue;
	this.value = this.item.getProperty(this.propNm, '');
	this.cell.setValue(this.text);
};

BaseCell.prototype.setViewValue = function (cellVal) {
	// this method set cell text and calculate property value
	this.value = cellVal;
	this.text = cellVal;
};

BaseCell.prototype.setPropertyValue = function (propVal) {
	// this method set property value and calculate cell text
	this.value = propVal;
	this.text = propVal;
};

BaseCell.prototype.save = function BaseCell_save() {
	// this method set cell text and save property value to dom

	if (this.value != undefined && this.text != undefined) {
		// save this.value to dom
		var prevVal = this.item.getProperty(this.propNm, '');
		if (this.value != prevVal) {
			this.editor.onChangeCell(this.value);
			aras.setItemProperty(this.node, this.propNm, this.value);
			this.grid.setUpdateActionAttributeToItem(this.item);
		}

		// save this.text to view
		if (this.cell.isCheckbox()) this.cell.setChecked(this.value == '1' ? 1 : 0);
		else this.cell.setValue(this.text);
	}
	return true;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL DEFAULT   datatype == default
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellDefault() {}

CellDefault.prototype = new BaseCell();

CellDefault.prototype.load = function CellDefault_load() {
	BaseCell.prototype.load.apply(this);
	this.preserveValue();

	switch (this.data_type) {
		case 'boolean':
			return false;
		case 'image':
			if (this.grid.longTimePassedFromLastTab()) {
				//show image dialog
				this.editor.onEditFinish();
				this.editor.showDialog();
			}
			return false;
		case 'filter list':
			// create combo
			var list = this.grid.cachedFilterLists[this.col];
			var vals = undefined;
			var filterName = this.pattern;
			if (filterName) {
				var filterVal = this.item.getProperty(filterName);
				if (filterVal) {
					filterVal = aras.escapeXMLAttribute(filterVal);
					vals = list.getItemsByXPath(
						"Relationships/Item[@type='Filter Value' and filter='" +
							filterVal +
							"']"
					);
				}
			}
			if (!vals)
				vals = list.getItemsByXPath("Relationships/Item[@type='Filter Value']");
			this.editor.createCombo(this.col, vals, 0);
			break;
		case 'date':
			this.text = aras.convertFromNeutral(this.value, 'date', this.pattern);
			this.cell.setValue(this.text);
			break;
		case 'text':
			this.editor.createTextArea(this.col);
			break;
		case 'decimal':
		case 'float':
		case 'integer':
		case 'string':
		case 'ml_string':
		case 'mv_list':
		case 'formatted text':
		case 'color':
		case 'color list':
		case 'list':
		case 'md5':
			// nothing special
			break;
		case 'item':
			this.SetInputHelperEnabled(true);
			break;
		default:
			debugger;
			return false;
	}
	return true;
};

CellDefault.prototype.setViewValue = function (cellVal) {
	// value sets by user input
	if (cellVal) {
		this.text = cellVal;

		switch (this.data_type) {
			case 'md5':
				this.text = '***';
				this.value = aras.calcMD5(cellVal);
				break;
			case 'item':
				var foundItem = aras.uiGetItemByKeyedName(
					this.property.getAttribute('type'),
					cellVal
				);
				if (foundItem) {
					this.value = foundItem.getAttribute('id');
				} else {
					this.value = '';
				}
				break;
			case 'date':
				this.value = aras.convertToNeutral(cellVal, 'date', this.pattern);
				break;
			case 'decimal':
				this.value = aras.convertToNeutral(cellVal, 'decimal', this.pattern);
				break;
			case 'float':
				this.value = aras.convertToNeutral(cellVal, 'float');
				break;
			default:
				this.value = cellVal;
		}
	} else {
		this.text = '';
		this.value = '';
	}
};

CellDefault.prototype.setPropertyValue = function (propertyValue) {
	// value sets by dialogs or by user coping
	if (propertyValue) {
		this.value = propertyValue;

		switch (this.data_type) {
			case 'md5':
				this.text = '***';
				break;
			case 'item':
				var itemType = this.property.getAttribute('type'),
					foundItem =
						typeof propertyValue == 'object'
							? propertyValue
							: aras.getItemById(itemType, propertyValue),
					keyedName;

				if (foundItem) {
					keyedName =
						itemType == 'File'
							? aras.getItemProperty(foundItem, 'filename')
							: aras.getItemProperty(foundItem, 'keyed_name');
					this.text = keyedName;
				} else {
					this.text = '';
				}
				break;
			case 'date':
				this.text = aras.convertFromNeutral(
					propertyValue,
					'date',
					this.pattern
				);
				break;
			case 'image': // only dialog can set image property value
				this.text =
					'<img src="' + propertyValue.replace(/\"/g, '&quot;') + '/">';
				break;
			default:
				this.text = propertyValue;
		}
	} else {
		this.text = '';
		this.value = '';
	}
};

CellDefault.prototype.save = function CellDefault_save() {
	if (this.propertyIsValid()) {
		switch (this.data_type) {
			case 'item':
				var keyedName = '',
					itemType = this.property.getAttribute('type');

				if (this.value) {
					var foundItem =
						typeof this.value == 'object'
							? this.value
							: aras.getItemById(itemType, this.value);

					if (foundItem) {
						keyedName =
							itemType == 'File'
								? aras.getItemProperty(foundItem, 'filename')
								: aras.getItemProperty(foundItem, 'keyed_name');
						this.text = keyedName;

						if (aras.isNew(foundItem)) {
							this.value = foundItem;
						}
					}
				}

				this.item.setPropertyAttribute(this.propNm, 'keyed_name', keyedName);
				this.item.setPropertyAttribute(
					this.propNm,
					'type',
					keyedName ? itemType : ''
				);
				this.SetInputHelperEnabled(false);
				break;
			case 'color':
			case 'color list':
				try {
					this.cell.setBgColor_Experimental(
						this.value ? this.value : '#ffffff'
					);
				} catch (e) {
					throw e;
				}
				break;
			case 'ml_string':
				aras.setItemPropertyAttribute(
					this.node,
					this.propNm,
					'xml:lang',
					aras.getSessionContextLanguageCode()
				);
				break;
		}
		BaseCell.prototype.save.apply(this);
		return true;
	}
	return false;
};

CellDefault.prototype.propertyIsValid = function CellDefault_propertyIsValid() {
	var isPropertyValueValid = true;

	if (this.value === undefined || this.text === undefined) {
		return false;
	}

	switch (this.data_type) {
		case 'md5':
			//don't check property if its type is md5
			break;
		case 'item':
			if (this.value !== '' || this.text !== '') {
				if (!aras.getItemById(this.property.getAttribute('type'), this.value)) {
					isPropertyValueValid = false;
				}
			}
			break;
		default:
			if (this.value !== '') {
				// empty value is valid value, don't validate it
				var propertyDef = {
					data_type: this.data_type,
					pattern: this.pattern,
					is_required: this.property.getAttribute('is_required') == '1',
					stored_length: parseInt(this.property.getAttribute('stored_length'))
				};
				isPropertyValueValid = aras.isPropertyValueValid(
					propertyDef,
					this.text,
					'invariantLocale'
				);
			}
			break;
	}

	if (!isPropertyValueValid) {
		var skipWarningAndRollbackValue = this.grid.F2KeyIsProcessed;
		if (skipWarningAndRollbackValue) {
			this.restoreValue();
			return true;
		}

		var validationMessage = aras.ValidationMsg;
		switch (this.data_type) {
			case 'item':
				validationMessage += aras.getResource(
					'',
					'configurable_grid.value_invalid_use_search_dialog',
					this.text,
					aras.getItemProperty(this.column, 'label')
				);
				break;
			case 'color':
				validationMessage += aras.getResource(
					'',
					'configurable_grid.use_f2_invoke_color_dialog'
				);
				break;
			case 'date':
				validationMessage += aras.getResource(
					'',
					'configurable_grid.use_f2_invoke_date_dialog'
				);
				break;
		}

		this.grid.applet.setErrorMessage(validationMessage);
	}

	return isPropertyValueValid;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL TEXT   datatype == text
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellText() {}

CellText.prototype = new BaseCell();

CellText.prototype.load = function CellText_load() {
	this.editor.createTextArea(this.col);
	return true;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL DEPENDENT   datatype == dependent
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellDependent() {}

CellDependent.prototype = new BaseCell();

CellDependent.prototype.load = function CellDependent_load() {
	var res = false;
	for (var i = this.col - 1; i > -1; i--) {
		var columnItem = this.columns[i];
		if (aras.getItemProperty(columnItem, 'starts_nested_row') == '1') {
			var dt = aras.getItemProperty(columnItem, 'datatype');
			res = dt == 'unbound_select' || dt == 'unbound_multi';
			break;
		}
	}
	this.grid.predefinedEditResult[this.col] = res;
	return res;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL BOUNDSELECT UNBOUNDSELECT   datatype == bound_select || datatype == unbound_select
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellBoundSelectUnboundSelect() {}

CellBoundSelectUnboundSelect.prototype = new BaseCell();

CellBoundSelectUnboundSelect.prototype.load = function CellBoundSelectUnboundSelect_load() {
	var vals = this.grid.applyColumnQueryOrMethod(this.item, this.col);
	if (vals) {
		if (this.datatype == 'unbound_select')
			this.editor.createCombo(this.col, vals, 1);
		else this.editor.createCombo(this.col, vals, 0);
		return true;
	}
	return false;
};

CellBoundSelectUnboundSelect.prototype.save = function CellBoundSelectUnboundSelect_save() {
	if (aras.getItemProperty(this.column, 'starts_nested_row') == '1') {
		var vals = this.grid.applyColumnQueryOrMethod(this.item, this.col);
		var valItem = null;
		for (var i = 0; i < vals.getItemCount(); i++) {
			var val = vals.getItemByIndex(i);
			if (val.getProperty('value', '') == this.value) {
				valItem = val;
				break;
			}
		}

		if (valItem || this.datatype == 'unbound_select') {
			for (var i = this.col + 1; i < this.columns.length; i++) {
				var columnItem = this.columns[i];
				if (aras.getItemProperty(columnItem, 'starts_nested_row') == '1') break;
				if (aras.getItemProperty(columnItem, 'datatype') == 'dependent') {
					var xpath = aras.getItemProperty(columnItem, 'xpath');
					var prop = aras.getItemProperty(columnItem, 'property');
					var nitem = this.item.getItemsByXPath(xpath);
					if (nitem.getItemCount() == 1) {
						nitem = nitem.getItemByIndex(0);
						var nvalue = valItem ? valItem.getProperty(prop, '') : '';
						nitem.setProperty(prop, nvalue);
						this.cell.setValue(nvalue);
					}
				}
			}
		}
	}
	BaseCell.prototype.save.apply(this);
	return true;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL BOUNDMULTI   datatype == bound_multi
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellBoundMulti() {}

CellBoundMulti.prototype = new BaseCell();

CellBoundMulti.prototype.load = function CellBoundMulti_load() {
	if (this.grid.longTimePassedFromLastTab()) {
		this.editor.onEditFinish();
		this.editor.showDialog(); //show showBoundMultiSelect dialog
	}
	return false;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL UNBOUNDMULTI   datatype == unbound_multi
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CellUnboundMulti() {}

CellUnboundMulti.prototype = new BaseCell();

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EVENT HANDLER
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function EventHandler(grid, rowId, col, item) {
	this.grid = grid;
	this.rowId = rowId;
	this.col = col;
	this.item = item;
}

EventHandler.prototype.getEventNodes = function EventHandler_getEventNodes(
	eventName,
	eventType
) {
	if (eventType == 'cell') {
		var column = this.grid.getColumnDefinition(this.col);
		return column.selectNodes(
			"Relationships/Item[@type='Column Event' and grid_event='" +
				eventName +
				"']"
		);
	} else if (eventType == 'grid') {
		return this.grid.gridDefinition.node.selectNodes(
			"Relationships/Item[@type='Configurable Grid Event' and grid_event='" +
				eventName +
				"']"
		);
	}
};

EventHandler.prototype.handleEvent = function EventHandler_handleEvent(
	eventName,
	eventType,
	params
) {
	//this method is for internal purposes only.
	//params.newValue - is used only for onchangecell events

	var column, propertyName, nameSuffix;

	if (eventType == 'cell') {
		column = this.grid.getColumnDefinition(this.col);
		propertyName = this.grid.calculatePropNmForColumn(this.col);
		nameSuffix = '$' + column.getAttribute('id') + '$' + this.grid.instanceName;
	} else if (eventType == 'grid') {
		nameSuffix = '$' + this.grid.instanceName;
	} else {
		return;
	}

	var eventHandlerName = eventName + nameSuffix,
		handlersQueue = window[eventHandlerName],
		eventResult,
		listOfArgumentsNames = ['item', 'propertyName', 'grid'],
		listOfArgumentsValues = [this.item, propertyName, this.grid];

	// define additional arguments
	for (paramName in params) {
		listOfArgumentsNames.push(paramName);
		listOfArgumentsValues.push(params[paramName]);
	}
	if (!params || !params['newValue']) {
		// this param is used only in onchangecell event
		listOfArgumentsNames.push('newValue');
		listOfArgumentsValues.push(undefined);
	}

	//initialize event handlers queue
	if (handlersQueue === undefined) {
		//means that handleCellEvent is called first time for the column
		var ces = this.getEventNodes(eventName, eventType),
			cellEvent,
			methodCode,
			handlersQueue = [];

		for (var i = 0; i < ces.length; i++) {
			(cellEvent = ces[i]),
				(methodCode = aras.getItemProperty(
					cellEvent,
					'related_id/Item/method_code'
				));

			try {
				//add event handler to the end of the queue.
				handlersQueue.push(new Function(listOfArgumentsNames, methodCode));
				//we assume here that handlers order is defined by data model
			} catch (excep) {
				this.showError(
					new Innovator().newError(excep.description || excep.message)
				);
				return false;
			}
		}
		window[eventHandlerName] = handlersQueue;
	}

	// call handlers
	if (this.grid.applet.isEditing()) {
		// this flag needs to avoid specific error, when grid in edit mode and eventHandler contains modal dialogs(alerts) calls
		// Explanation: if system restores focus for window after closing modal dialog, then focusin event will be fired,
		// but in "focusin" eventHandler references to objects from other windows is denied (now they exists through references to IOM Items objects,
		// which all created in main window)
		this.grid.skipCellValidation = true;
	}

	for (var i = 0; i < handlersQueue.length; i++) {
		try {
			eventResult = handlersQueue[i].apply(this.grid, listOfArgumentsValues);
			if (eventResult === false) {
				break;
			}
		} catch (excep) {
			this.grid.skipCellValidation = false;
			this.grid.showError(
				new Innovator().newError(excep.description || excep.message),
				true
			);
			return false;
		}
	}
	this.grid.skipCellValidation = false;

	if (this.grid.userMethodRequiresRePopulating) {
		this.grid.rePopulateGridFewLater();
	}

	return eventResult === undefined ? true : eventResult;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DIALOG
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Dialog() {}

Dialog.prototype.init = function (
	applet,
	grid,
	rowId,
	col,
	cell,
	column,
	columns,
	property,
	propNm,
	data_type,
	datatype,
	pattern,
	item
) {
	//this method is for internal purposes only.
	this.applet = applet;
	this.grid = grid;
	this.rowId = rowId;
	this.col = col;
	this.cell = cell;
	this.column = column;
	this.columns = columns;
	this.property = property;
	this.propNm = propNm;
	this.datatype = datatype;
	this.data_type = data_type;
	this.pattern = pattern;
	this.item = item;
	this.node = item.node;
};
Dialog.mappingDialog = {
	text: 'showTextDialog',
	image: 'showImageDialog',
	color: 'showColorDialog',
	'formatted text': 'showFormattedTextDialog',
	item: 'showItemDialog',
	date: 'showDateDialog',
	ml_string: 'showMLDialog'
};
Dialog.prototype.showStandardDialog = function Dialog_showStandardDialog(
	callback
) {
	//this method is for internal purposes only.
	this.grid.disableUserInput();

	if (this.datatype === 'default' && Dialog.mappingDialog[this.data_type]) {
		this[Dialog.mappingDialog[this.data_type]](callback);
	} else if (this.datatype === 'text') {
		this.showTextDialog(callback);
	}

	this.grid.enableUserInput();
};

var topWindow = TopWindowHelper.getMostTopWindowWithAras(window);
topWindow = topWindow.main || topWindow;

Dialog.prototype.showSelectDialog = function Dialog_showSelectDialog(callback) {
	//this method is for internal purposes only.
	var self = this,
		sourceForm = aras.getItemProperty(this.column, 'source_form'),
		param = {
			aras: aras,
			selectedItem: this.item,
			item: this.grid.applyColumnQueryOrMethod(this.item, this.col),
			gridId: gridId
		};

	this.grid.disableUserInput();
	switch (this.datatype) {
		case 'bound_multi':
			param.title = 'Bound Multi-Select';
			break;
		case 'unbound_multi':
			param.title = 'Unbound Multi-Select';
			break;
		case 'bound_select':
			param.title = 'Bound Select';
			break;
		case 'unbound_select':
			param.title = 'Unbound Select';
			break;
	}

	if (sourceForm) {
		var formItem = new Item('Form', 'get'),
			width,
			height,
			options,
			response;

		formItem.setAttribute('select', 'width,height');
		formItem.setProperty('id', sourceForm);
		response = formItem.apply();

		if (response.isError()) {
			this.grid.showError(response);
			return false;
		}

		width = response.getProperty('width') || 450;
		height = response.getProperty('height') || 700;
		param.dialogWidth = width;
		param.dialogHeight = height;
		param.resizable = true;
		param.formId = sourceForm;
		param.content = 'ShowFormAsADialog.html';

		topWindow.ArasModules.Dialog.show('iframe', param).promise.then(
			function () {
				self.grid.enableUserInput();
				callback(param.item);
			}
		);
	} else {
		this.grid.enableUserInput();
		callback(param.item);
	}
};

Dialog.prototype.showTextDialog = function Dialog_showTextDialog(callback) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, ''),
		param = {
			isEditMode: this.grid.isEditMode,
			content: prevValue === undefined ? '' : prevValue,
			aras: aras,
			type: 'Text'
		};

	topWindow.ArasModules.Dialog.show('iframe', param).promise.then(callback);
};

Dialog.prototype.showDateDialog = function Dialog_showDateDialog(callback) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, ''),
		format = aras.getDotNetDatePattern(this.pattern),
		dialogResult,
		param = {
			format: format,
			date: prevValue,
			aras: aras,
			type: 'Date'
		};

	var wndRect = aras.uiGetElementCoordinates(this.cell.cellNod_Experimental);
	var dateDialog = topWindow.ArasModules.Dialog.show('iframe', param);
	dateDialog.move(
		wndRect.left - wndRect.screenLeft,
		wndRect.top - wndRect.screenTop
	);
	dateDialog.promise.then(function (dialogResult) {
		dialogResult = aras.convertToNeutral(dialogResult, 'date', format);
		callback(dialogResult);
	});
};

Dialog.prototype.showImageDialog = function Dialog_showImageDialog(callback) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, ''),
		params = {
			aras: aras,
			image: prevValue,
			type: 'ImageBrowser'
		};
	topWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
		res
	) {
		res = res || prevValue;
		callback(res == 'set_nothing' ? '' : res);
	});
};

Dialog.prototype.showColorDialog = function Dialog_showColorDialog(callback) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, '');
	topWindow.ArasModules.Dialog.show('iframe', {
		oldColor: prevValue,
		aras: aras,
		type: 'Color'
	}).promise.then(callback);
};

Dialog.prototype.showFormattedTextDialog = function Dialog_showFormattedTextDialog(
	callback
) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, ''),
		dialogResult,
		param = {
			sHTML: prevValue,
			aras: aras,
			title: aras.getResource('', 'htmleditor.inn_formatted_text_editor'),
			type: 'HTMLEditorDialog'
		};

	window.ArasModules.Dialog.show('iframe', param).promise.then(function (
		dialogResult
	) {
		dialogResult =
			dialogResult || dialogResult === '' ? dialogResult : prevValue;
		callback(dialogResult);
	});
};

Dialog.prototype.showItemDialog = function Dialog_showItemDialog(callback) {
	//this method is for internal purposes only.
	var prevValue = this.item.getProperty(this.propNm, ''),
		data_source_name = this.property.getAttribute('type'),
		sourceItemTypeName = this.node ? this.node.getAttribute('type') : '',
		params = {
			aras: window.aras,
			itemtypeName: data_source_name,
			itemContext: undefined,
			itemSelectedID: undefined,
			sourceItemTypeName: sourceItemTypeName,
			sourcePropertyName: this.propNm,
			type: 'SearchDialog'
		};
	topWindow.ArasModules.MaximazableDialog.show('iframe', params).promise.then(
		function (res) {
			callback(res ? res.itemID : prevValue);
		}
	);
};

Dialog.prototype.showMLDialog = function Dialog_showMLDialog(callback) {
	//this method is for internal purposes only.
	const prevValue = this.item.getProperty(this.propNm, '');
	const self = this;
	const isEditMode = this.grid.isEditMode;

	aras
		.getItemPropertyTranslations(self.item.node, self.propNm)
		.then(function (translations) {
			const topWnd = aras.getMostTopWindowWithAras(window);

			return topWnd.ArasCore.Dialogs.multiLingual(translations, {
				readOnly: !isEditMode
			});
		})
		.then(function (updatedTranslations) {
			const isUpdated = aras.setItemPropertyTranslations(
				self.item.node,
				self.propNm,
				updatedTranslations
			);
			if (!isUpdated) {
				return;
			}

			const newVal = self.item.getProperty(self.propNm, '');
			self.item.setProperty(self.propNm, prevValue);

			callback(newVal);
		});
};
