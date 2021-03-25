function TearOffMenuController(args) {
	this.aras = args.aras;
	this.view = args.view;

	if (args.searchForMenu) {
		this.searchForMenu = args.searchForMenu;
	}
	var topWindow = this.aras.getMostTopWindowWithAras(window);
	this.mainWnd = args.window || topWindow;
	this.cui = topWindow.cui;

	var self = this;
	this.private = {
		declare: function (fieldName, func) {
			var boundFunc = func.bind(self);
			this[fieldName] = boundFunc;
		}
	};

	this.private.declare('getWindowTabbar', function () {
		var tabbar = this.mainWnd.window.relationships
			? this.mainWnd.window.relationships.relTabbar
			: null;
		return tabbar;
	});

	this.private.declare('getActiveTabWindow', function (tabbar) {
		if (!tabbar) {
			return null;
		}

		var activeTabWnd = null;
		var tabId = tabbar.GetSelectedTab();

		if (tabbar._getTab(tabId)) {
			activeTabWnd = tabbar._getTab(tabId).domNode.lastChild.contentWindow;
		}

		return activeTabWnd;
	});

	this.private.declare('wrapToDeferredFunc', function (func, deferCondition) {
		var defferableFunc = function () {
			if (deferCondition()) {
				setTimeout(function () {
					defferableFunc();
				}, 0);
			} else {
				func();
			}
		};

		return defferableFunc;
	});

	this.private.uiControlsPromises = {};
	this.private.uiControlsPromisesResolvers = {};

	this.private.declare('registerStatePromise', function (controlState) {
		this.private.uiControlsPromises[controlState] = new Promise(
			function (resolve) {
				this.private.uiControlsPromisesResolvers[controlState] = resolve;
			}.bind(this)
		);
	});

	this.private.declare('resolveStatePromise', function (
		controlState,
		resValue
	) {
		this.private.uiControlsPromisesResolvers[controlState](resValue);
	});
}

TearOffMenuController.prototype.initController = function () {
	// Calls from original onload Handler
	if (this.aras) {
		var self = this;
		this.aras.registerEventHandler(
			'PreferenceValueChanged',
			window,
			function () {
				self.onPreferenceValueChanged.apply(self, arguments);
			}
		);
	}
};

TearOffMenuController.prototype.when = function (controlState) {
	return this.private.uiControlsPromises[controlState];
};

TearOffMenuController.prototype.initSvgManager = function () {
	const icons = [
		'../images/ClaimOff.svg',
		'../images/ClaimOn.svg',
		'../images/ClaimOther.svg'
	];
	ArasModules.SvgManager.load(icons);
};

TearOffMenuController.prototype.requireToolbar = function () {
	this.private.registerStatePromise('ToolbarLoaded');
	this.private.registerStatePromise('ToolbarInitialized');

	const control = new ToolbarWrapper({
		id: 'top_toolbar',
		connectNode: document.getElementById('top'),
		useCompatToolbar: true
	});
	window.tearOffMenuController.toolbar = window.tearOffMenuController.toolbarApplet = control;
	document.toolbarApplet = document.toolbar =
		window.tearOffMenuController.toolbarApplet;
	this.cui.initToolbarEvents(control);
	this.private.resolveStatePromise('ToolbarLoaded', control);
};

TearOffMenuController.prototype.initToolbar = function (
	control,
	locationName,
	subPrefix,
	classification
) {
	var instance = this.mainWnd.window.document.getElementById('instance');
	var isWscEditor = instance && instance.contentWindow.document.WSCEditor;
	//subPrefix - Need remove sub-prefix for compatibility with previous toolbar version.
	var mainSubPrefix = isWscEditor
		? /com.aras.innovator.cui_default.twt_wsce_/g
		: /com.aras.innovator.cui_default.twt_normal_/g;
	var contextParams = {
		toolbarApplet: control,
		defaultOnClick: this.onClickItem.bind(this),
		locationName: locationName,
		item_classification: classification,
		mainSubPrefix: mainSubPrefix,
		subPrefix: subPrefix
	};
	this.private.resolveStatePromise(
		'ToolbarInitialized',
		this.cui.loadToolbarFromCommandBarsAsync(contextParams).then(
			function () {
				this.showToolbar();

				if (this.mainWnd.window.isSSVCEnabled) {
					control.getActiveToolbar().showItem('ssvc_discussion_button');
				}
				return control;
			}.bind(this)
		)
	);
};

TearOffMenuController.prototype.requireMainMenu = function () {
	this.private.registerStatePromise('MainMenuLoaded');
	this.private.registerStatePromise('MainMenuInitialized');

	var mainMenuLoaded = clientControlsFactory.createControl(
		'Aras.Client.Controls.Experimental.MainMenu',
		{ id: 'top_mainMenu', aras: this.aras }
	);
	mainMenuLoaded.then(
		function (control) {
			control.placeAt('top', 'first');
			control.startup();
			clientControlsFactory.on(control, {
				onOpenItem: function (menuItemId) {
					window.tearOffMenuController.populateAccessMenuLazyFinish(menuItemId);
				}
			});

			this.cui.initMenuEvents(control, {
				onSelect: window.tearOffMenuController.onClickItem.bind(this),
				onCheck: window.tearOffMenuController.onCheckMenu.bind(this),
				prefix: 'com.aras.innovator.cui_default.twmm_'
			});

			window.tearOffMenuController.menuApplet = document.menu = control;
			window.tearOffMenuController.menuOnActivateHandler();
		}.bind(this)
	);

	this.private.resolveStatePromise('MainMenuLoaded', mainMenuLoaded);
};

TearOffMenuController.prototype.initMainMenu = function (
	control,
	locationName
) {
	var cuiContext = { admin: this.aras.getUserType() == 'admin' };
	var promise;
	// Temp check on locationName. If statement should be deleted when StructureBrowser_menu will migrate to CUI.
	if (locationName == 'ClassStructureDialogMenu') {
		promise = ArasModules.SyncPromise.resolve({
			xmlParam: this.aras.getI18NXMLResource('StructureBrowser_menu.xml')
		});
	} else {
		control.set(
			'default_package_name_prefix',
			'com.aras.innovator.cui_default.twmm_'
		);
		promise = this.cui
			.loadMenuFromCommandBarsAsync(locationName, cuiContext)
			.then(function (xmlParam) {
				return { xmlArgType: 'xml', xmlParam: xmlParam };
			});
	}

	this.private.resolveStatePromise(
		'MainMenuInitialized',
		promise.then(
			function (args) {
				control.setXML(args.xmlParam, args.xmlArgType);
				control.showMenuBar(control._defaultMenuBarId);
				this.initMenu();

				return control;
			}.bind(this)
		)
	);
};

TearOffMenuController.prototype.toolbarApplet = null;
TearOffMenuController.prototype.toolbar = null;
TearOffMenuController.prototype.menuApplet = null;
TearOffMenuController.prototype.view = null;
TearOffMenuController.prototype.menuFrameReady = false;
TearOffMenuController.prototype.activeToolbar = null;
TearOffMenuController.prototype.__tabsShowStr = '';
TearOffMenuController.prototype.rm = null;
TearOffMenuController.prototype.searchForMenu = true;

TearOffMenuController.prototype.onPreferenceValueChanged = function (params) {
	if (!params) {
		return;
	}
	if (
		params.type == 'Core_GlobalLayout' &&
		params.propertyName == 'core_show_labels'
	) {
		var val =
			this.aras.getPreferenceItemProperty(
				params.type,
				null,
				params.propertyName
			) == 'true';
		if (val != this.menuApplet.findItem('show_text').getCheck()) {
			this.setControlState('show_text', val);
		}

		if (this.toolbar) {
			this.toolbar.showLabels(val);
		}

		var tabbar = this.private.getWindowTabbar();

		if (tabbar) {
			var iframeNode =
				window.frames.relationships.iframesCollection[tabbar.GetSelectedTab()];
			if (iframeNode && iframeNode.contentWindow.toolbar) {
				iframeNode.contentWindow.toolbar.showLabels(val);
			}
		}
	}
};

TearOffMenuController.prototype.unloadPage = function () {
	try {
		//try inserted because opener sometimes already closed when this method is called
		this.aras.unregisterEventHandler(
			'PreferenceValueChanged',
			window,
			this.onPreferenceValueChanged
		);
	} catch (excep) {}
};

TearOffMenuController.prototype.setViewMode = function () {
	window.updateMenuState();
};

TearOffMenuController.prototype.setEditMode = function () {
	window.updateMenuState();
};

TearOffMenuController.prototype.setControlEnabled = function (ctrlId, state) {
	if (state === undefined) {
		state = true;
	}
	try {
		var mi = this.menuApplet.findItem(ctrlId);
		if (mi) {
			mi.setEnabled(state);
		}
	} catch (excep) {}
};

TearOffMenuController.prototype.setControlState = function (ctrlId, state) {
	if (state === undefined) {
		state = true;
	}
	try {
		var mi = this.menuApplet.findItem(ctrlId);
		if (mi) {
			mi.setState(state);
		}
	} catch (excep) {}

	try {
		Promise.resolve(this.when('ToolbarInitialized')).then(function (toolbar) {
			var tbi = toolbar && toolbar.getActiveToolbar().getItem(ctrlId);
			if (tbi) {
				tbi.setState(state);
			}
		});
	} catch (excep) {}
};

TearOffMenuController.prototype.addActionEntry = function (
	name,
	actionId,
	active,
	bAddActionMenuLength
) {
	if (bAddActionMenuLength === undefined) {
		bAddActionMenuLength = false;
	}
	var menu = this.menuApplet.findMenu('actions_menu');
	menu.addItem(name, actionId, active);
	if (bAddActionMenuLength) {
		this.actionMenuLength++;
	}
	menu.setEnableFlag(true);
};

TearOffMenuController.prototype.addActionSeparator = function (
	bAddActionMenuLength
) {
	if (bAddActionMenuLength === undefined) {
		bAddActionMenuLength = false;
	}
	var menu = this.menuApplet.findMenu('actions_menu');
	menu.addSeparatorItem();
	if (bAddActionMenuLength) {
		this.actionMenuLength++;
	}
};

TearOffMenuController.prototype.addReportEntry = function (
	name,
	reportId,
	active,
	bAddReportMenuLength
) {
	if (bAddReportMenuLength === undefined) {
		bAddReportMenuLength = false;
	}
	var menu = this.menuApplet.findMenu('reports_menu');
	menu.addItem(name, reportId, active);
	if (bAddReportMenuLength) {
		this.reportMenuLength++;
	}
	menu.setEnableFlag(true);
};

TearOffMenuController.prototype.addReportSeparator = function (
	bAddReportMenuLength
) {
	if (bAddReportMenuLength === undefined) {
		bAddReportMenuLength = false;
	}
	var menu = this.menuApplet.findMenu('reports_menu');
	menu.addSeparatorItem();
	if (bAddReportMenuLength) {
		reportMenuLength++;
	}
};

TearOffMenuController.prototype.showToolbar = function () {
	this.toolbarApplet = this.toolbar;

	var view = this.view.toString();

	if (view == 'classStructure') {
		if (
			this.mainWnd.dialogArguments.dialogType == 'class_path' ||
			this.mainWnd.dialogArguments.dialogType == 'classification'
		) {
			this.toolbarApplet.showToolbar('structure_select_toolbar');
		}
		if (
			this.mainWnd.dialogArguments.isEditMode === false &&
			this.mainWnd.dialogArguments.dialogType == 'class_structure'
		) {
			this.toolbarApplet.showToolbar('structure_view_toolbar');
		}
		if (
			this.mainWnd.dialogArguments.isEditMode === true &&
			this.mainWnd.dialogArguments.dialogType == 'class_structure'
		) {
			this.toolbarApplet.showToolbar('structure_edit_toolbar');
		}
		this.setControlState(
			'ly' +
				this.aras.getPreferenceItemProperty(
					'Core_GlobalLayout',
					null,
					'core_structure_layout'
				),
			true
		);
	} else {
		if (view == 'whereused') {
			this.toolbarApplet.showToolbar('structure');
			this.setControlState(
				'ly' +
					this.aras.getPreferenceItemProperty(
						'Core_GlobalLayout',
						null,
						'core_structure_layout'
					),
				true
			);
		} else {
			this.toolbarApplet.showToolbar('$EmptyClassification');
		}
	}

	this.activeToolbar = this.toolbarApplet.getActiveToolbar();
};

// +++ init menu
TearOffMenuController.prototype.initMenu = function () {
	var view = this.view.toString();

	if (
		view.search(/^formtool$|^lifecycletool$|^reporttool$|^methodeditor$/) === 0
	) {
		var viewMenu = this.menuApplet.findMenu('view_menu');
		if (viewMenu) {
			viewMenu.setEnableFlag(false);
		}
	}
	// --- init menu

	if (view != 'whereused' && view != 'classStructure') {
		var itemType = window.itemType;
		var itId = itemType.getAttribute('id');
		var relshipsNd = itemType.selectSingleNode('Relationships');
		var actionMenu = relshipsNd;
		var isVersionableIT =
			this.aras.getItemProperty(itemType, 'is_versionable') == '1';
		var isTemp = this.aras.isTempEx(parent.item);
		var i;

		if (!isVersionableIT || isTemp) {
			this.setControlEnabled('revisions', true);
		}
	} else if (view == 'classStructure') {
		if (
			this.mainWnd.dialogArguments.dialogType == 'class_path' ||
			this.mainWnd.dialogArguments.dialogType == 'classification'
		) {
			this.menuApplet.showMenuBar('structure_select_menubar');
		}
		if (
			this.mainWnd.dialogArguments.isEditMode === false &&
			this.mainWnd.dialogArguments.dialogType == 'class_structure'
		) {
			this.menuApplet.showMenuBar('structure_view_menubar');
		}
		if (
			this.mainWnd.dialogArguments.isEditMode === true &&
			this.mainWnd.dialogArguments.dialogType == 'class_structure'
		) {
			this.menuApplet.showMenuBar('structure_edit_menubar');
		}
		this.setControlEnabled('save_close', true);
	} else if (view == 'whereused') {
		this.setControlEnabled('set_nothing', false);
	}

	// showLabels
	var val =
		this.aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_show_labels'
		) == 'true';
	this.setControlState('show_text', val);

	Promise.resolve(this.when('ToolbarInitialized')).then(
		function (control) {
			if (control) {
				control.showLabels(val);
			}
			this.menuFrameReady = true;
		}.bind(this)
	);

	var tmp = this.menuApplet.findItem('sort_pages');
	if (tmp) {
		tmp.setState(this.aras.getVariable('SortPages') == 'true');
	}
	tmp = this.menuApplet.findItem('append');
	if (tmp) {
		tmp.setState(
			this.aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_append_items'
			) == 'true'
		);
	}
	tmp = this.menuApplet.findItem('append');
	if (tmp) {
		tmp.setState(
			this.aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_append_items'
			) == 'true'
		);
	}
};

TearOffMenuController.prototype.allowPrivatePermission = undefined;

TearOffMenuController.prototype.populateAccessMenuLazyStart = function (
	isEditMode,
	item
) {
	this.populateAccessMenu = {};
	this.populateAccessMenu.LazyFinishWasCalled = false;
	this.populateAccessMenu.isEditModeArg = isEditMode;
	this.populateAccessMenu.itemArg = item;

	function clearAccessMenu(accessMenu) {
		var cnt = accessMenu.getItemsCount();
		for (var i = 0; i < cnt; i++) {
			accessMenu.deleteItemAt(0);
		}
	}

	if (!this.menuApplet) {
		//there is no menu in Project solution
		return;
	}

	var accessMenu = this.menuApplet.findMenu('access_menu');
	if (!accessMenu) {
		return;
	}

	accessMenu.setEnabled(false);
	var itm = this.populateAccessMenu.itemArg
		? this.populateAccessMenu.itemArg
		: parent.item;
	this.populateAccessMenu.setEnable =
		itm.getAttribute('type') !== 'Permission' ||
		this.aras.getItemProperty(itm, 'name') !== 'Permission';

	var currentPermissionId = this.aras.getItemProperty(itm, 'permission_id');
	if (!currentPermissionId) {
		clearAccessMenu(accessMenu);
		this.populateAccessMenu.LazyFinishWasCalled = true;
		return;
	}

	this.populateAccessMenu.currentPermissionId = currentPermissionId;
	this.populateAccessMenu.itemId = itm.getAttribute('id');

	accessMenu.setEnabled(this.populateAccessMenu.setEnable);
};

TearOffMenuController.prototype.populateAccessMenuLazyFinish = function (
	menuItemId
) {
	function clearAccessMenu(accessMenu) {
		var cnt = accessMenu.getItemsCount();
		for (var i = 0; i < cnt; i++) {
			accessMenu.deleteItemAt(0);
		}
	}
	function setEnableFlag(accessMenu, viewFlg, name) {
		accessMenu.addItem(name, 'view_access', viewFlg);
		var setEnable = viewFlg;
		accessMenu.setEnableFlag(setEnable);
		return setEnable;
	}
	if (
		menuItemId !== 'com.aras.innovator.cui_default.twmm_access_menu' &&
		menuItemId !== 'access_menu'
	) {
		return;
	}

	if (!this.populateAccessMenu || this.populateAccessMenu.LazyFinishWasCalled) {
		return;
	}
	this.populateAccessMenu.LazyFinishWasCalled = true;

	if (!this.menuApplet) {
		//there is no menu in Project solution
		return;
	}

	var accessMenu = this.menuApplet.findMenu('access_menu');
	if (!accessMenu) {
		return;
	}

	var itemType = window.itemType,
		itId = itemType.getAttribute('id');

	var canChangeAccess = this.aras.getPermissions(
		'can_change_access',
		this.populateAccessMenu.itemId,
		itId
	);
	if (canChangeAccess) {
		var permissionItem = this.aras.getItemFromServer(
			'Permission',
			this.populateAccessMenu.currentPermissionId,
			'is_private'
		).node;
		clearAccessMenu(accessMenu);

		this.populateAccessMenu.setEnable = setEnableFlag(
			accessMenu,
			this.populateAccessMenu.setEnable,
			this.aras.getResource('', 'common.view')
		);
		this.allowPrivatePermission =
			this.aras.getItemProperty(itemType, 'allow_private_permission') != '0';
		var createPrivateFlg =
			this.allowPrivatePermission &&
			this.aras.getItemProperty(permissionItem, 'is_private') == '0';
		var flg =
			this.populateAccessMenu.isEditModeArg !== undefined
				? this.populateAccessMenu.isEditModeArg
				: window.isEditMode;

		var q = this.aras.newIOMItem('Allowed Permission', 'get');
		q.setAttribute('levels', 0);
		q.setProperty('source_id', itId);
		var r = q.apply();

		accessMenu.addSeparatorItem();
		accessMenu.addItem(
			this.aras.getResource('', 'tearoffmenu.create_private'),
			'create_private_access',
			flg && createPrivateFlg
		);
		accessMenu.addSeparatorItem();
		this.populateAccessMenu.setEnable =
			this.populateAccessMenu.setEnable || (flg && createPrivateFlg);

		if (r.isError()) {
			return;
		}

		var allowedPermission;
		var permissionName, permissionId;
		var rItemCount = r.getItemCount();
		if (rItemCount > 0) {
			this.populateAccessMenu.setEnable =
				this.populateAccessMenu.setEnable || flg;
		}
		var i;
		for (i = 0; i < rItemCount; i++) {
			allowedPermission = r.getItemByIndex(i);
			permissionName = allowedPermission.node.selectSingleNode(
				'related_id/Item/name'
			).text;
			permissionId = allowedPermission.node.selectSingleNode(
				'related_id/Item/@id'
			).text;
			var isCurrent =
				this.populateAccessMenu.currentPermissionId == permissionId;
			permissionId = 'access:' + permissionId;
			if (allowedPermission.node.selectSingleNode('is_default').text == '1') {
				permissionName += this.aras.getResource(
					'',
					'tearoffmenu.default_permission_sfx'
				);
			}
			accessMenu.addCheckItem(permissionName, permissionId, isCurrent, flg);
		}

		accessMenu.setEnabled(this.populateAccessMenu.setEnable);
	} else {
		clearAccessMenu(accessMenu);
		setEnableFlag(
			accessMenu,
			this.populateAccessMenu.setEnable,
			this.aras.getResource('', 'common.view')
		);
	}
};

TearOffMenuController.prototype.onCheckMenu = function (menuItem) {
	var cmdID = menuItem.getId();
	if (this.menuApplet) {
		cmdID = cmdID.replace(
			this.menuApplet.get('default_package_name_prefix'),
			''
		);
	}
	var check = menuItem.getCheck();
	var check_str = check.toString();

	if (cmdID == 'show_text') {
		this.aras.setPreferenceItemProperties('Core_GlobalLayout', null, {
			core_show_labels: check_str
		});
	} else if (cmdID.search(/^access:/) === 0) {
		return window.SetAllowedAccess
			? window.SetAllowedAccess(cmdID)
			: this.SetAllowedAccess(cmdID);
	}
};

TearOffMenuController.prototype.onClickItem = function (tbItem) {
	var handleOnClickItem = function () {
		var tabbar = this.private.getWindowTabbar();
		var activeTabWnd = null;
		if (tabbar) {
			activeTabWnd = this.private.getActiveTabWindow(tabbar);
		}

		if (
			activeTabWnd &&
			activeTabWnd.grid &&
			activeTabWnd.grid.grid_Experimental
		) {
			if (activeTabWnd.grid.grid_Experimental.edit.isEditing()) {
				activeTabWnd.grid.grid_Experimental.edit.apply();
			}
		}

		var tbItemID = tbItem.getId();
		this.onClickMenuItem(tbItemID);
	}.bind(this);

	this.safeInvokeCommand(handleOnClickItem);
};

TearOffMenuController.prototype.safeInvokeCommand = function (func) {
	var invokableFunc = func;

	if (this.isClickMustBeDeferred()) {
		var deferConditionFunc = this.isClickMustBeDeferred.bind(this);
		invokableFunc = this.private.wrapToDeferredFunc(
			invokableFunc,
			deferConditionFunc
		);
	}

	invokableFunc();
};

TearOffMenuController.prototype.isClickMustBeDeferred = function () {
	var tabbar = this.private.getWindowTabbar();
	var activeTabWnd = null;
	if (tabbar) {
		activeTabWnd = this.private.getActiveTabWindow(tabbar);
	}

	if (
		activeTabWnd &&
		activeTabWnd.grid &&
		activeTabWnd.grid.grid_Experimental &&
		activeTabWnd.grid.grid_Experimental.edit
	) {
		if (activeTabWnd.grid.grid_Experimental.edit._applyStarted) {
			return true;
		}
	}

	return false;
};

TearOffMenuController.prototype.onAbout = function () {
	this.aras.AlertAbout();
};

// ================= Handlers for Actions AddItemsForChange (In Documents & Parts) =============================
function handlerForAddItemsForChange(cmdID) {
	var itemID = window.itemID;
	var tempItem = aras.isDirtyEx(item) || aras.isNew(item) ? item : null;
	var arasObj = aras;

	if (tempItem) {
		if (arasObj.confirm(arasObj.getResource('plm', 'changeitem.saveit'))) {
			window.onSaveCommand().then(function () {
				startDefaultAction();
			});
		}
	} else {
		startDefaultAction();
	}

	function startDefaultAction() {
		arr = cmdID.split(':');
		var act = arasObj.getItemFromServer(
			'Action',
			arr[1],
			'name,method(name,method_type,method_code),type,target,location,body,on_complete(name,method_type,method_code),item_query'
		);
		if (!act) {
			return;
		}
		arasObj.invokeAction(act.node, arr[2], itemID);
	}
}

//For Documents
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:B88C14B99EF449828C5D926E39EE8B89Command'
] = handlerForAddItemsForChange;
//For Parts
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:4F1AC04A2B484F3ABA4E20DB63808A88Command'
] = handlerForAddItemsForChange;
//For Cad
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:CCF205347C814DD1AF056875E0A880ACCommand'
] = handlerForAddItemsForChange;
// ================= Handlers for AddItemsForChange (In Documents & Parts) =============================

/*
 *
 *   onClickMenuItem(id, param)
 *   id - command id
 *   param - used if this function is called from mainMenu.aspx
 *
 */
TearOffMenuController.prototype.prevLY = undefined;
if (this.aras) {
	TearOffMenuController.prototype.prevLY =
		'ly' +
		this.aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_structure_layout'
		);
}
TearOffMenuController.prototype.onClickMenuItem = function (cmdID, param) {
	var view, arr, viewer;
	var arasObj = this.aras;
	const callPurgeDeleteCommandIfRequired = async (command) => {
		const isPurgeAction = command === 'purge';
		const messageResourceKey = isPurgeAction
			? 'confirm_delete.purge_message'
			: 'confirm_delete.delete_message';
		const okButtonResourceName = isPurgeAction
			? 'confirm_delete.purge'
			: 'confirm_delete.delete';
		const titleResourceName = isPurgeAction
			? 'confirm_delete.purge_title'
			: 'confirm_delete.delete_title';

		const message = arasObj.getResource(
			'',
			messageResourceKey,
			window.itemTypeLabel,
			arasObj.getKeyedNameEx(item)
		);
		const title = arasObj.getResource('', titleResourceName);
		const image = '../images/Delete.svg';
		const okButtonText = arasObj.getResource('', okButtonResourceName);
		const dialogOptions = {
			title,
			image,
			okButtonText,
			okButtonModifier: 'aras-button_secondary'
		};

		const topWindow = arasObj.getMostTopWindowWithAras(window);
		const result = await topWindow.ArasModules.Dialog.confirm(
			message,
			dialogOptions
		);
		if (result !== 'ok') {
			return;
		}

		if (command === 'delete') {
			return window.onDeleteCommand(true);
		}

		return window.onPurgeCommand(true);
	};

	if (this.menuApplet) {
		cmdID = cmdID.replace(
			this.menuApplet.get('default_package_name_prefix'),
			''
		);
	}
	if (cmdID == 'new') {
		if (window.onNewCommand) {
			return window.onNewCommand();
		}
	} else if (cmdID == 'purge') {
		if (window.onPurgeCommand) {
			return callPurgeDeleteCommandIfRequired(cmdID);
		}
	} else if (cmdID == 'delete') {
		if (window.onDeleteCommand) {
			return callPurgeDeleteCommandIfRequired(cmdID);
		}
	} else if (cmdID == 'refresh') {
		viewer = this.getSSVCViewer();
		if (viewer && viewer.markupPage && viewer.markupPage.hasNotations()) {
			if (
				this.aras.confirm(
					this.aras.getResource(
						'../Modules/aras.innovator.Viewers/',
						'mark_tb_lose_unsaved_markup'
					),
					window
				) !== true
			) {
				return;
			}
		}

		if (window.onRefresh) {
			return window.onRefresh();
		}
	} else if (cmdID == 'save') {
		if (window.onSaveCommand) {
			return window.onSaveCommand();
		}
	} else if (cmdID == 'save_close') {
		if (window.onSaveAndCloseCommand) {
			return window.onSaveAndCloseCommand();
		}
	} else if (cmdID == 'return_selected') {
		if (window.onSaveAndCloseCommand) {
			return window.onSaveAndCloseCommand();
		}
	} else if (cmdID == 'save_unlock_close') {
		if (window.onSaveUnlockAndExitCommand) {
			return window.onSaveUnlockAndExitCommand();
		}
	} else if (cmdID == 'lock') {
		if (window.onLockCommand) {
			return window.onLockCommand();
		}
	} else if (cmdID == 'unlock') {
		if (window.onUnlockCommand) {
			const isDirty = this.aras.isDirtyEx(item);

			if (isDirty) {
				const dialogParams = {
					title: this.aras.getResource('', 'common.discard_confirmationtitle')
				};

				const topWin = this.aras.getMostTopWindowWithAras(window);
				const dialogMessage = this.aras.getResource(
					'',
					'common.discard_confirmationmessage'
				);
				topWin.ArasModules.Dialog.confirm(dialogMessage, dialogParams).then(
					function (res) {
						if (res !== 'ok') {
							return;
						}

						return window.onUnlockCommand(false);
					}
				);
			} else {
				return window.onUnlockCommand();
			}
		}
	} else if (cmdID == 'edit') {
		if (window.onEditCommand) {
			return window.onEditCommand();
		}
	} else if (cmdID == 'undo') {
		if (window.onUndoCommand) {
			return window.onUndoCommand();
		}
	} else if (cmdID == 'revisions') {
		if (window.onRevisionsCommand) {
			return window.onRevisionsCommand();
		}
	} else if (cmdID == 'set_nothing') {
		if (window.onSetNothingCommand) {
			window.onSetNothingCommand();
		}
	} else if (cmdID == 'clear_selected') {
		if (window.onSetNothingCommand) {
			window.onSetNothingCommand();
		}
	} else if (cmdID == 'close') {
		if (window.onCloseCommand) {
			window.onCloseCommand();
		}
	} else if (cmdID == 'open') {
		if (window.onOpenCommand) {
			window.onOpenCommand();
		}
	} else if (cmdID == 'download') {
		if (window.onDownloadCommand) {
			window.onDownloadCommand();
		}
	} else if (cmdID == 'promote') {
		if (window.onPromoteCommand) {
			return window.onPromoteCommand();
		}
	} else if (cmdID == 'print') {
		if (window.onPrintCommand) {
			setTimeout(function () {
				window.onPrintCommand();
			}, 100);
		}
	} else if (cmdID == 'export2Excel') {
		if (window.onExport2OfficeCommand) {
			window.onExport2OfficeCommand('export2Excel');
		}
	} else if (cmdID == 'export2Word') {
		if (window.onExport2OfficeCommand) {
			window.onExport2OfficeCommand('export2Word');
		}
	} else if (cmdID == 'help_about') {
		this.onAbout();
	} else if (cmdID == 'properties') {
		this.mainWnd.ArasCore.Dialogs.properties(item, itemType, {
			aras: this.aras
		});
	} else if (cmdID == 'change_working_dir') {
		var userID = this.aras.getUserID();
		var userNd = this.aras.getLoggedUserItem();
		if (!userNd) {
			this.aras.AlertError(this.aras.getResource('', 'common.unknown_user'));
			return false;
		}
		var newDir = this.aras.vault.selectFolder();
		if (!newDir) {
			return true;
		}
		this.aras.setItemProperty(userNd, 'working_directory', newDir);
		this.aras.setUserWorkingDirectory(userID, newDir);
	} else if (cmdID === 'ssvc_discussion_button') {
		var discussionContainer = document.getElementById(
			'rightSidebarContentPane'
		);
		var ssvcSplitter = document.getElementById('ssvc-splitter');
		var discussionPanel = dijit.byId('discussion');
		var discussionFeed = dijit.byId('DiscussionFeed');
		var discussionButton = this.toolbar
			.getActiveToolbar()
			.getItem('ssvc_discussion_button');
		if (!discussionContainer || !discussionPanel || !discussionButton) {
			return false;
		}

		discussionButton = discussionButton._item_Experimental;
		var prefixResource = 'hide';
		var discussionPanelAction = 'show';
		var containerWidth = 350;
		if (discussionPanel.visible()) {
			prefixResource = 'show';
			discussionPanelAction = 'hide';
			containerWidth = 0;
			discussionContainer.style.display = 'none';
			ssvcSplitter.style.display = 'none';
		} else {
			discussionContainer.style.display = 'block';
			ssvcSplitter.style.display = 'block';
		}
		var relationshipsContainer = dijit.byId('centerMiddle');
		if (relationshipsContainer) {
			relationshipsContainer.resize();
			var evt = new CustomEvent('resize');
			window.dispatchEvent(evt);
		}
		discussionPanel[discussionPanelAction]();
		if (discussionFeed) {
			discussionFeed.refreshPanel();
		}

		var btn_title = this.aras.getResource(
			'',
			'ssvc.' + prefixResource + '_dpanel'
		);
		discussionButton.tooltip = btn_title;
		this.toolbar._toolbar.data.set(
			discussionButton.id,
			Object.assign({}, discussionButton)
		);
		dijit.Tooltip.hide();
	}

	// views commands
	else if (cmdID == 'access') {
		return window.onShowAccess ? window.onShowAccess() : this.onShowAccess();
	} else if (cmdID == 'history') {
		return window.onShowHistory ? window.onShowHistory() : this.onShowHistory();
	} else if (cmdID == 'workflow') {
		return window.onShowWorkflow
			? window.onShowWorkflow()
			: this.onShowWorkflow();
	} else if (cmdID == 'lifecycle') {
		return window.onShowLifeCycle
			? window.onShowLifeCycle()
			: this.onShowLifeCycle();
	} else if (cmdID == 'structure' || cmdID == 'where_used') {
		return Dependencies.view(
			this.aras.getItemProperty(window.itemType, 'name'),
			window.item.getAttribute('id'),
			cmdID == 'where_used',
			this.aras
		);
	} else if (cmdID == 'expandStructureItems') {
		view = this.view.toString();
		if (view == 'whereused') {
			window.onExpandAllCommand();
		}
		if (view == 'classStructure') {
			window.onExpandAllCommand();
		}
	} else if (cmdID == 'collapseStructureItems') {
		view = this.view.toString();
		if (view == 'whereused') {
			window.onCollapseAllCommand();
		}
		if (view == 'classStructure') {
			window.onCollapseAllCommand();
		}
	}
	// +++++ Where Used view commands
	else if (cmdID.search(/ly\d+/) === 0) {
		var btn = this.activeToolbar.getItem(cmdID);
		if (!btn) {
			return true;
		}
		if (!btn.getState()) {
			btn.setState(true);
			return true;
		}

		if (this.activeToolbar.getItem(prevLY)) {
			this.activeToolbar.getItem(prevLY).setState(false);
		}
		prevLY = cmdID;
		var ly = parseInt(cmdID.substring(2));
		this.aras.setPreferenceItemProperties('Core_GlobalLayout', null, {
			core_structure_layout: ly
		});

		view = this.view.toString();
		if (view == 'whereused') {
			if (window.frames.whereused) {
				window.frames.whereused.document.structure.setLayout(ly);
			}
		} else if (view == 'classStructure') {
			if (window.frames.structure) {
				window.frames.structure.document.structure.setLayout(ly);
			}
		}
	}

	// ----- Where Used view commands
	else if (cmdID.search(/^action:/) === 0) {
		arr = cmdID.split(':');
		var cmdHandlerName =
			'on' + (cmdID.substr(0, 1).toUpperCase() + cmdID.substr(1)) + 'Command';
		if (window[cmdHandlerName]) {
			window[cmdHandlerName](cmdID);
			return;
		}

		var act = this.aras.getItemFromServer(
			'Action',
			arr[1],
			'name,method(name,method_type,method_code),type,target,location,body,on_complete(name,method_type,method_code),item_query'
		);
		if (!act) {
			return;
		}
		this.aras.invokeAction(act.node, arr[2], window.itemID);
	} else if (cmdID.search(/^report:/) === 0) {
		arr = cmdID.split(':');
		// var rep = this.aras.getItemFromServer('Report',arr[1],'name,description,report_query,target,type,xsl_stylesheet,location,method(name,method_type,method_code)');
		var rep = this.aras.getItemFromServer(
			'Report',
			arr[1],
			'name,target,location,report_query'
		);
		if (!rep) {
			return;
		}
		this.aras.runReport(rep.node, arr[2], window.item);
	} else if (cmdID.search(/^userreport:/) === 0) {
		runUserReport(this.aras, cmdID, "'" + window.itemID + "'");
	} else if (cmdID === 'new_user_report') {
		this.aras.uiNewItemEx('UserReport');
	}

	//Access commands
	else if (cmdID == 'view_access') {
		return window.ViewAccess ? window.ViewAccess() : this.ViewAccess();
	} else if (cmdID == 'create_private_access') {
		return window.CreatePrivateAccess
			? window.CreatePrivateAccess()
			: this.CreatePrivateAccess();
	}
	//Help commands
	else if (cmdID == 'help_context') {
		var formFrame = window.document.getElementById('instance'),
			strItemTypeName;
		if (
			formFrame &&
			formFrame.contentWindow &&
			formFrame.contentWindow.document
		) {
			strItemTypeName = formFrame.contentWindow.document.itemTypeName;
		}
		this.aras.ShowContextHelp(strItemTypeName);
	} else if (cmdID === 'ShowControlsApiReferenceDotNet') {
		this.aras.uiShowControlsApiReferenceCommand(false);
	} else if (cmdID === 'ShowControlsApiReferenceJavaScript') {
		this.aras.uiShowControlsApiReferenceCommand(true);
	}

	// Clipboard commands
	else if (cmdID == 'copy2clipboard') {
		if (this.mainWnd.onCopy2clipboardCommand) {
			this.mainWnd.onCopy2clipboardCommand();
		} else {
			this.aras.AlertError(
				this.aras.getResource('', 'tearoffmenu.not_supported')
			);
		}
	} else if (cmdID == 'paste') {
		if (this.mainWnd.onPasteCommand) {
			this.mainWnd.onPasteCommand();
		} else {
			this.aras.AlertError(
				this.aras.getResource('', 'tearoffmenu.not_supported')
			);
		}
	} else if (cmdID == 'paste_special') {
		if (this.mainWnd.onPaste_specialCommand) {
			this.mainWnd.onPaste_specialCommand();
		} else {
			this.aras.AlertError(
				this.aras.getResource('', 'tearoffmenu.not_supported')
			);
		}
	} else if (cmdID == 'show_clipboard') {
		if (this.mainWnd.onShow_clipboardCommand) {
			this.mainWnd.onShow_clipboardCommand();
		} else {
			this.aras.AlertError(
				this.aras.getResource('', 'tearoffmenu.not_supported')
			);
		}
	} else {
		//unknown command. This situation may occur when we call this handler from mainMenu.aspx
		//and mainMenu knows more commands when this one.
		return false; //"false" means, that tearOffMenu doesn't know such command.
	}

	return true;
}; //onClickMenuItem

TearOffMenuController.prototype.getSSVCViewer = function () {
	var mainWnd;
	if (this.mainWnd && this.mainWnd.getViewersTabs) {
		mainWnd = this.mainWnd;
	} else {
		var mainWin = this.aras.getCurrentWindow();
		mainWnd = mainWin.mainWnd;
	}
	if (mainWnd && mainWnd.window && mainWnd.window.isSSVCEnabled) {
		var tabsControl = mainWnd.getViewersTabs();
		var viewerContainer = tabsControl.getTabById(tabsControl.getCurrentTabId());
		var frame = viewerContainer.getChildren()[0].viewerFrame;
		if (frame) {
			return frame.contentWindow.SSVCViewer;
		}
	}
	return null;
};
TearOffMenuController.prototype.onShowAccess = function () {};

TearOffMenuController.prototype.onShowHistory = function () {
	var arasObj = this.aras;
	ModulesManager.using(['aras.innovator.core.History/HistoryManager']).then(
		function (HistoryManager) {
			var historyManager = new HistoryManager({ aras: arasObj });
			historyManager.showItemHistory(parent.item);
		}
	);
};

TearOffMenuController.prototype.onShowWorkflow = function () {
	var workflowNds =
		window.item && window.item.xml
			? window.item.selectNodes("Relationships/Item[@type='Workflow']")
			: null;

	if (workflowNds && workflowNds.length === 0) {
		workflowNds = this.aras.getItemRelationships(
			itemTypeName,
			itemID,
			'Workflow'
		);
	}
	if (workflowNds && workflowNds.length === 1) {
		var wflProcNd = workflowNds[0].selectSingleNode(
			"related_id/Item[@type='Workflow Process']"
		);
		var wflProcId = wflProcNd
			? wflProcNd.getAttribute('id')
			: workflowNds[0].text;
		if (wflProcNd && wflProcId) {
			this.aras.uiShowItemEx(wflProcNd);
			return;
		}
	}

	var editmode = window.isEditMode ? 1 : 0;
	var relTypeID = this.aras.getRelationshipTypeId('Workflow');

	window.ArasModules.Dialog.show('iframe', {
		LocationSearch:
			'?db=' +
			this.aras.getDatabase() +
			'&WorkFlowProc=1&ITName=' +
			itemTypeName +
			'&itemID=' +
			itemID +
			'&relTypeID=' +
			relTypeID +
			'&editMode=' +
			editmode +
			'&tabbar=0&toolbar=1&where=dialog',
		aras: this.aras,
		item: item,
		dialogHeight: 500,
		dialogWidth: 1050,
		resizable: true,
		content: 'relationships.html'
	});
	if (window.isTearOff) {
		window.updateItemsGrid(item);
	}
};

TearOffMenuController.prototype.onShowLifeCycle = function () {
	var params = {
		aras: this.aras,
		item: item,
		title: this.aras.getResource(
			'',
			'lifecycledialog.lc',
			this.aras.getKeyedNameEx(item)
		),
		dialogHeight: 400,
		dialogWidth: 600,
		resizable: true,
		content: 'LifeCycleDialog.html'
	};
	window.ArasModules.MaximazableDialog.show('iframe', params).promise.then(
		function (res) {
			if (typeof res == 'string' && res == 'null') {
				if (this.mainWnd.deleteRowFromItemsGrid) {
					this.deleteRowFromItemsGrid(this.mainWnd.itemID);
				}
				window.close();
				return;
			}
			if (!res) {
				return;
			}

			if (window.isTearOff) {
				window.updateItemsGrid(res);
			}

			window.isEditMode = false;
			this.aras.uiReShowItemEx(itemID, res, viewMode);
		}.bind(this)
	);
};

// ++++++++++ Access stuff

TearOffMenuController.prototype.ViewAccess = function () {
	var PermissionNd = parent.item.selectSingleNode('permission_id');
	var PermissionItem = PermissionNd.selectSingleNode('Item');
	if (!PermissionItem) {
		PermissionId = PermissionNd.text;
		PermissionItem = this.aras.getItemById(
			'Permission',
			PermissionId,
			0,
			undefined,
			'*'
		);
	}
	this.aras.uiShowItemEx(PermissionItem, 'tab view');
};

TearOffMenuController.prototype.CreatePrivateAccess = function () {
	const self = this;
	const item = parent.getItem();

	return Promise.resolve(getOrCopyCurrentPermission(item)).then(function (
		permissionNode
	) {
		if (!permissionNode) {
			return false;
		}

		self.aras.uiShowItemEx(permissionNode, 'tab view');
		updateItem(item);
		self.setControlEnabled('create_private_access', false);

		return true;
	});

	function getOrCopyCurrentPermission(item) {
		const permission = item.selectSingleNode('permission_id/Item');
		if (permission) {
			return permission;
		}

		const originalPermissionId = item.selectSingleNode('permission_id').text;

		return Promise.resolve(originalPermissionId)
			.then(copyPermission)
			.then(removeRestrictedAccesses)
			.then(function (copyPermissionNd) {
				if (!copyPermissionNd) {
					return null;
				}
				makePermissionPrivate(copyPermissionNd);
				setPermission(item, copyPermissionNd);
				self.setControlState('access:' + originalPermissionId, false);

				return copyPermissionNd;
			});
	}

	function copyPermission(permissionId) {
		const originalPermissionNd = self.aras.getItemById(
			'Permission',
			permissionId,
			0
		);
		const copyPermissionNd = self.aras.copyItemEx(
			originalPermissionNd,
			'copy',
			false
		);
		if (!copyPermissionNd) {
			self.aras.AlertError(
				self.aras.getResource('', 'tearoffmenu.err_copyitem')
			);
			return null;
		}

		const relationshipsNodes = Array.from(
			copyPermissionNd.selectNodes('Relationships/Item')
		);
		relationshipsNodes.forEach(function (item) {
			const itemId = item.getAttribute('id');
			this.aras.setItemProperty(item, 'id', itemId);
			this.aras.setItemProperty(item, 'config_id', itemId);
		}, self);

		return copyPermissionNd;
	}
	function removeRestrictedAccesses(permissionNode) {
		if (!permissionNode) {
			return permissionNode;
		}
		const restrictedAccessesXPath =
			'Relationships/Item[@type="Access" and related_id[@is_null="0"]]';
		const restrictedAccessNodes = permissionNode.selectNodes(
			restrictedAccessesXPath
		);
		[].forEach.call(restrictedAccessNodes, function (accessNode) {
			accessNode.parentNode.removeChild(accessNode);
		});

		return Promise.resolve()
			.then(function () {
				const raiseWarning = !!restrictedAccessNodes.length;
				if (raiseWarning) {
					return ArasModules.Dialog.confirm(
						self.aras.getResource('', 'tearoffmenu.private_permissions_lose')
					);
				}

				return true;
			})
			.then(function (result) {
				if (result !== 'ok' && result !== true) {
					return null;
				}

				return permissionNode;
			});
	}

	function makePermissionPrivate(permissionNode) {
		const privatePermissionNode = self.aras.getItemFromServerByName(
			'Permission',
			'Private Permission',
			'id'
		);
		const privatePermissionId = privatePermissionNode.getID();
		self.aras.setItemProperty(
			permissionNode,
			'name',
			permissionNode.getAttribute('id')
		);
		self.aras.setItemProperty(permissionNode, 'is_private', '1');
		self.aras.setItemProperty(
			permissionNode,
			'permission_id',
			privatePermissionId
		);

		return permissionNode;
	}

	function setPermission(item, permissionNode) {
		item.selectSingleNode('permission_id').text = '';
		item.selectSingleNode('permission_id').appendChild(permissionNode);
	}

	function updateItem(item) {
		item.setAttribute('isDirty', '1');
		if (!item.getAttribute('action')) {
			item.setAttribute('action', 'update');
		}
		self.aras.updateInCache(item);
		if (window.updateRootItem2) {
			window.updateRootItem2(item);
		}
		if (window.updateItemsGrid) {
			window.updateItemsGrid(item);
		}
	}
};

TearOffMenuController.prototype.SetAllowedAccess = function (cmdID) {
	var OldPermissionId = window.item.selectSingleNode('permission_id').text;
	this.setControlState('access:' + OldPermissionId, false);
	this.setControlState(cmdID, true);
	var PermissionId = cmdID.split(':');
	PermissionId = PermissionId[1];

	var itm = parent.item;
	this.aras.setItemProperty(itm, 'permission_id', PermissionId);
	itm.selectSingleNode('permission_id').removeAttribute('keyed_name');
	if (!itm.getAttribute('action')) {
		itm.setAttribute('action', 'update');
	}
	if (this.allowPrivatePermission) {
		this.setControlEnabled('create_private_access', true);
	}
	if (window.updateItemsGrid) {
		window.updateItemsGrid(itm);
	}
};

TearOffMenuController.prototype.setEnableAccessMenu = function (isEditMode) {
	if (isEditMode && !this.allowPrivatePermission) {
		return;
	}
	var accessMenu = this.menuApplet && this.menuApplet.findMenu('access_menu');
	if (!accessMenu) {
		return;
	}
	var cnt = accessMenu.getItemsCount();
	for (var i = 3; i < cnt; i++) {
		var element = accessMenu.getItemAt(i);
		element.setEnabled(isEditMode);
	}
};

// ---------- Access stuff
TearOffMenuController.prototype.isMenuActivated = false;
TearOffMenuController.prototype.menuOnActivateHandler = function () {
	if (this.isMenuActivated) {
		return;
	}

	var view = this.view.toString();
	if (view != 'whereused' && view != 'classStructure') {
		// 'populateAccessMenuLazyStart' should be called after menu initialization because it works with menu elements
		this.when('MainMenuInitialized').then(
			function () {
				this.populateAccessMenuLazyStart();
				this.isMenuActivated = true;
			}.bind(this)
		);
	} else {
		this.isMenuActivated = true;
	}
};
