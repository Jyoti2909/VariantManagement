var treeControl;
var userReports;
var preview;
var _accessRights;

window.onload = function onLoadHandler() {
	userReports = setupUserReports();
	setupTree(userReports);
	selectItemInReportTree();
	window.addEventListener('resize', resizeTreeContainer);
	document.getElementById(
		'myreportsTitle'
	).innerHTML = Izenda.Utils.GetResource('myreports.my_reports');

	function setupTree() {
		createTreeControl(loadTreeData);

		function loadTreeData(tree) {
			initializeTree(tree, userReports);
			setupContextMenu(tree.contextMenu);
		}

		function createTreeControl(callback) {
			require(['Aras/Client/Controls/Experimental/Tree']);
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Experimental.Tree',
				{
					id: 'reportTree',
					IconPath: '../cbin/',
					allowEmptyIcon: true,
					contextMenuCallback: function (event, closeContextMenu, evt) {
						var aWidget = dijit.getEnclosingWidget(evt.target);
						var id = aWidget && aWidget.item ? aWidget.getIdentity() : '';
						var item = this._model.fetchItemByIdentity(id);
						var mouseButtonWasClicked = evt.pageX && evt.pageY;
						if (item) {
							this.contextMenu.rowId = item.id;
							if (
								mouseButtonWasClicked &&
								this.menuInit(item.id, aWidget.item.userdata)
							) {
								dijit.popup.open({
									popup: this.contextMenu.menu,
									parent: this._tree,
									x: evt.pageX,
									y: evt.pageY
								});
								this.contextMenu.menu.domNode.focus();
							} else {
								closeContextMenu();
							}
						}
						event.stop(evt);
					}
				},
				function (control) {
					var treeApplet = control;
					var container = document.getElementById('treeContainer');
					container.appendChild(treeApplet._tree.domNode);

					var search = new Izenda.UI.Tree.Search({
						control: control,
						id: 'searchBox'
					});
					search.setEvents('searchBox', 'searchBtn');

					clientControlsFactory.on(treeApplet, {
						menuInit: onMenuInit,
						menuClick: onMenuClick,
						itemSelect: onItemSelect,
						itemDoubleClick: onItemDoubleClick
					});
					if (callback) {
						treeControl = treeApplet;
						callback(treeApplet);
					}
				}
			);
		}
	}
};

function onNewCommand() {
	aras.uiNewItemEx('SelfServiceReport');
}

function initializeTree(tree, userReports) {
	if (!tree) {
		tree = treeControl;
	}

	if (!userReports) {
		return;
	}

	var userReportsItems = userReports.getItemsByXPath(
		"//Item[@type='SelfServiceReport']"
	);
	for (var i = 0; i < userReportsItems.getItemCount(); i++) {
		var currentReport = userReportsItems.getItemByIndex(i);
		currentReport.setAttribute(
			'currentUser',
			Izenda.Utils.getAras().getUserID()
		);
	}

	var treeXml = Izenda.Utils.getAras().applyXsltFile(
		userReports.dom,
		Izenda.Utils.getAras().getScriptsURL() +
			'../Modules/aras.innovator.Izenda/Styles/reportsTree.xslt'
	);
	treeXml = treeXml.replace(/&lt;/gi, '&amp;lt;').replace(/&gt;/gi, '&amp;gt;');
	tree.initXML(treeXml);
	resizeTreeContainer();
}

function resizeTreeContainer() {
	var reportsTreeDom = document.getElementById('reportsTree');
	if (reportsTreeDom) {
		var newHeight = reportsTreeDom.clientHeight - 60;
		var dom = document.getElementsByClassName('dijitTreeContainer');
		if (dom) {
			var treeContainer = dom[0];
			treeContainer.style.height = newHeight + 'px';
		}
	}
}

function setupUserReports() {
	var reports = Izenda.Utils.getAras().newIOMItem(
		'Method',
		'GetSelfServiceReports'
	);
	return reports.apply();
}

function getReportsAndReinitializeTree() {
	userReports = setupUserReports();
	initializeTree(treeControl, userReports);
}

function selectItemInReportTree(id) {
	//TODO: id should be set in Reports Preferences
	if (!id) {
		id = 'createdbyme';
	}

	if (treeControl.isItemExists(id)) {
		var userdata = treeControlSelectItemImpl(id);
		onItemSelect(id, false, userdata);
	}
}

function treeControlSelectItemImpl(rowID) {
	if (
		treeControl._tree.selectedItem &&
		treeControl._tree.selectedItem.id === rowID
	) {
		return;
	}
	var _getAncestorsAndSelf = function (childRowId, _chain) {
		_chain = _chain || [];
		_chain.unshift(treeControl._model.fetchItemByIdentity(childRowId));
		var parentRowId = treeControl.getParentId(childRowId);
		if (parentRowId) {
			_getAncestorsAndSelf.call(treeControl, parentRowId, _chain);
		}
		return _chain;
	};
	var ancestorsAndSelf = _getAncestorsAndSelf.call(treeControl, rowID);
	var userdata;
	if (preview && preview.category) {
		var catId = '';
		switch (preview.category) {
			case 'createdbyme':
				catId = 0;
				break;
			case 'sharedwithme':
				catId = 1;
				break;
			case 'recent':
				catId = 2;
				break;
			default:
				catId = 2;
				break;
		}

		ancestorsAndSelf[1] = ancestorsAndSelf[0].children[catId];
		var reportsByCategory = ancestorsAndSelf[1].children;
		for (var i = 0; i < reportsByCategory.length; i++) {
			if (reportsByCategory[i].id === rowID) {
				userdata = reportsByCategory[i].userdata;
				break;
			}
		}
	}

	treeControl._tree.set('path', ancestorsAndSelf);
	return userdata;
}

function onItemSelect(selectedId, isMult, userdata) {
	if (userdata) {
		_accessRights = userdata['access_rights'];
		if (_accessRights === 'inherited') {
			var item = getItemFirstEntry(selectedId);
			if (item && item.userdata) {
				_accessRights = item.userdata['access_rights'];
			}
		}
	}

	var nodes = treeControl._tree.getNodesByItem(selectedId);
	var type = treeControl.GetUserData(selectedId, 'type');
	if (!nodes[0].isExpanded && !type) {
		treeControl._tree._expandNode(nodes[0]);
	}

	if (!type || (preview && userdata && preview.category !== userdata.type)) {
		var criteria = !type ? selectedId : userdata.type;
		preview = new Preview(userReports, criteria);
		if (criteria !== selectedId) {
			preview.previewItemSelectImpl(selectedId);
		}
	} else if (preview) {
		preview.previewItemSelectImpl(selectedId);
	}
}

function onItemDoubleClick(selectedId) {
	var type = treeControl.GetUserData(selectedId, 'type');
	if (type) {
		onMenuClick('runReport', selectedId);
	}
}

function highlightRowInTree(item) {
	function getParentId(thisitem) {
		if (thisitem) {
			var allItems = treeControl._model._items;
			for (var i = 0; i < allItems.length; i++) {
				if (-1 < allItems[i].children.indexOf(thisitem)) {
					return allItems[i].id;
				}
			}
		}
	}

	if (
		treeControl._tree.selectedItem &&
		treeControl._tree.selectedItem.userdata &&
		treeControl._tree.selectedItem.id === item.id &&
		treeControl._tree.selectedItem.userdata.type === item.userdata.type
	) {
		return;
	}

	var _getAncestorsAndSelf = function (item, childRowId, _chain) {
		_chain = _chain || [];
		item = item || treeControl._model.fetchItemByIdentity(childRowId);
		_chain.unshift(item);
		var parentRowId = getParentId(item);
		if (parentRowId) {
			_getAncestorsAndSelf.call(treeControl, undefined, parentRowId, _chain);
		}
		return _chain;
	};
	var ancestorsAndSelf = _getAncestorsAndSelf.call(treeControl, item);
	treeControl._tree.set('path', ancestorsAndSelf);
}

function setupContextMenu(menu, index) {
	index = index || '';
	var menuItems = [
		{
			id: 'runReport' + index,
			name: Izenda.Utils.GetResource('myreports.context_menu.run_report')
		},
		{
			id: 'editReport' + index,
			name: Izenda.Utils.GetResource('myreports.context_menu.edit_report')
		},
		{
			id: 'deleteReport' + index,
			name: Izenda.Utils.GetResource('myreports.context_menu.delete_report')
		}
	];
	menu.addRange(menuItems);
}

function onMenuInit(selectedId, userdata, menu, index) {
	if (
		!userdata ||
		selectedId === 'createdbyme' ||
		selectedId === 'sharedwithme' ||
		selectedId === 'recent'
	) {
		return false;
	}
	index = index || '';
	menu = menu || treeControl.contextMenu;

	var item = getItemFirstEntry(selectedId, userdata.type);
	highlightRowInTree(item);
	onItemSelect(selectedId, false, userdata);

	function prepareMenu(accessRights, inherited) {
		if (!accessRights) {
			return false;
		}
		var report = userReports.getItemsByXPath(
			"//Item[@id='{0}']".Format(selectedId)
		);
		var lockedById = report.getProperty('locked_by_id');
		if (lockedById && lockedById != Izenda.Utils.getAras().getUserID()) {
			menu.setHide('editReport' + index, true);
			menu.setHide('deleteReport' + index, true);
			return true;
		}

		_accessRights = accessRights;
		switch (accessRights) {
			case 'full':
				menu.setHide('editReport' + index, false);
				menu.setHide('deleteReport' + index, false);
				return true;
			case 'readonly':
			case 'viewonly':
			case 'locked':
				menu.setHide('editReport' + index, true);
				menu.setHide('deleteReport' + index, true);
				return true;
			case 'inherited':
				var item = getItemFirstEntry(selectedId);
				if (item && item.userdata && !inherited) {
					return prepareMenu(item.userdata['access_rights'], true);
				}
				return false;
			default:
				return false;
		}
	}

	return prepareMenu(userdata['access_rights']);
}

function getItemFirstEntry(id, userdataType) {
	var items = treeControl._model._items;
	for (var i = 0; i < items.length; i++) {
		if (items[i].id === id) {
			if (!userdataType) {
				return items[i];
			}
			if (items[i].userdata && userdataType == items[i].userdata.type) {
				return items[i];
			}
		}
	}
	return undefined;
}

function updateReports() {
	getReportsAndReinitializeTree();
	selectItemInReportTree();
}

function onMenuClick(commandId, selectedId) {
	var report = userReports.getItemsByXPath(
		"//Item[@id='{0}']".Format(selectedId)
	);

	switch (commandId) {
		case 'runReport':
			runUserReport(selectedId, report);
			break;
		case 'editReport': // similar to ItemsGrid OnEditCommand
			var aras = Izenda.Utils.getAras();
			if (hasExcludedProperties(report, aras)) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.Izenda/',
						'servicereporting.report_contains_restricted_data'
					)
				);
				break;
			}
			Izenda.ToolbarMethods.editReport(
				selectedId,
				runUserReport.bind(this, selectedId, report)
			);
			break;
		case 'deleteReport':
			return deleteReport(selectedId, report);
		default:
			return;
	}

	function runUserReport(selectedId, report) {
		runUserReportCommon(selectedId, report, Izenda.Utils.getAras(), '');
	}

	function deleteReport(selectedId, report) {
		return Izenda.ToolbarMethods.deleteReport(
			selectedId,
			report,
			updateReports
		);
	}
}
