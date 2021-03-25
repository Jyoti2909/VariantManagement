function initializeFormToolFunctions(container) {
	container.loadFieldTools = function (args) {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.ToolBar',
			{ id: 'form_toolbar', connectId: 'toolbarContainer' },
			function (control) {
				arasToolbar = control;
				clientControlsFactory.on(arasToolbar, {
					onClick: args.onButtonClick,
					onDropDownItemClick: args.onPPMClick
				});
				arasToolbar.loadXml(
					aras.getI18NXMLResource(
						'field_toolbar.xml',
						aras.getScriptsURL() + '../'
					)
				);
				arasToolbar.showToolbar('fieldbar');
			}
		);
	};

	container.getFormNdForView = function () {
		var xmlObj = aras.createXMLDocument();
		var formNd = xmlObj.importNode(currFormNd, true);
		var bodyRelshipNd = formNd.selectSingleNode(
			"Relationships/Item[@type='Body']/Relationships"
		);

		if (bodyRelshipNd) {
			var deletedFieldsNds = bodyRelshipNd.selectNodes(
				"Item[@type='Field' and (@action='delete' or @action='purge')]"
			);
			if (deletedFieldsNds) {
				for (var i = 0; i < deletedFieldsNds.length; i++) {
					bodyRelshipNd.removeChild(deletedFieldsNds[i]);
				}
			}
		}

		return formNd;
	};

	container.updateFormItem = function () {
		currFormNd = parent.item;
		currBodyNd = currFormNd.selectSingleNode(
			"Relationships/Item[@type='Body']"
		);

		if (!currBodyNd) {
			var frm = aras.getItemById('Form', currFormId, 0);
			if (frm) {
				var tmp = aras.getFormForDisplay(currFormId);
				aras.mergeItemRelationships(frm, tmp.node);

				var frmBodyNd = frm.selectSingleNode(
					"Relationships/Item[@type='Body']"
				);
				if (frmBodyNd) {
					var relshipsNd = currFormNd.selectSingleNode('Relationships');
					if (!relshipsNd)
						relshipsNd = currFormNd.appendChild(
							currFormNd.ownerDocument.createElement('Relationships')
						);
					relshipsNd.appendChild(frmBodyNd.cloneNode(true));
				}

				aras.mergeItem(currFormNd, frm);
				currBodyNd = currFormNd.selectSingleNode(
					"Relationships/Item[@type='Body']"
				);
			}
		}
	};

	container.setViewMode = function () {
		container.setFlag('propsFReady', false);
		container.setFlag('toolsFReady', false);
		container.setFlag('canvasFReady', false);

		isEditMode = false;
		container.updateFormItem();

		var fields = fieldGrid;
		var tools = document.getElementById('tools').contentWindow;
		var tabs = document.getElementById('tabs').contentWindow;
		var canvas = document.getElementById('canvas').contentWindow;
		fields.emptyGrid();
		fields.populateGrid();

		tools.modifyAvailDataSources();
		document.getElementById('toolbarContainer').style.display = 'none';
		container.setFlag('toolsFReady', true);

		var tabID = tabs.currTabID;
		tabs.currTabID = '';
		tabs.onTabSelect(tabID);
		container.setFlag('propsFReady', true);
		aras.uiShowItemInFrameEx(
			canvas,
			undefined,
			'view_form',
			0,
			currFormNd,
			itemType
		);
		fields.selectField(fields.currFldID);
		container.setFlag('canvasFReady', true);

		container.removeFormFromCache();
		container.refreshMenuState();
	};

	container.setEditMode = function () {
		container.setFlag('propsFReady', false);
		container.setFlag('toolsFReady', false);
		container.setFlag('canvasFReady', false);

		isEditMode = true;
		container.updateFormItem();

		var fields = fieldGrid;
		var tools = document.getElementById('tools').contentWindow;
		var tabs = document.getElementById('tabs').contentWindow;
		var canvas = document.getElementById('canvas').contentWindow;
		fields.emptyGrid();
		fields.populateGrid();

		tools.modifyAvailDataSources();
		document.getElementById('toolbarContainer').style.display = '';
		container.setFlag('toolsFReady', true);

		var tabID = tabs.currTabID;
		tabs.currTabID = '';
		tabs.onTabSelect(tabID);
		container.setFlag('propsFReady', true);
		aras.uiShowItemInFrameEx(
			canvas,
			undefined,
			'edit_form',
			0,
			currFormNd,
			itemType
		);
		fields.selectField(fields.currFldID);
		container.setFlag('canvasFReady', true);

		container.removeFormFromCache();
		container.refreshMenuState();
		tools.RefreshToolbar();
	};

	container.removeFormFromCache = function () {
		aras.deletePropertyFromObject(
			aras.commonProperties.formsCacheById,
			currFormId + '_default'
		);
		aras.deletePropertyFromObject(
			aras.commonProperties.formsCacheById,
			currFormId + '_view'
		);
		aras.deletePropertyFromObject(
			aras.commonProperties.formsCacheById,
			currFormId + '_edit'
		);
		aras.deletePropertyFromObject(
			aras.commonProperties.formsCacheById,
			currFormId + '_print'
		);
	};

	container.refreshMenuState = function () {
		var topWindow = aras.getMostTopWindowWithAras(window);
		if (topWindow.cui) {
			topWindow.cui.callInitHandlers('UpdateTearOffWindowState');
		}
	};

	container.setFlag = function (flgName, state) {
		window[flgName] = state;
		isBusy = !(tabsFReady && propsFReady && toolsFReady && canvasFReady);
	};

	container.setupToolOnLoad = function () {
		if (isBusy) {
			setTimeout(container.setupToolOnLoad, 10);
			return;
		}

		if (!aras.isEditStateEx(currFormNd) && isEditMode) {
			window.aras.setItemEditStateEx(currFormNd, true);
		}

		clientControlsFactory.createControl(
			'Aras.Client.Frames.fieldGrid',
			aras,
			function (control) {
				fieldGrid = control;
			}
		);

		var tabs = document.getElementById('tabs').contentWindow,
			propertiesFrame = document.getElementById('properties');

		if (isEditMode) {
			var tools = document.getElementById('tools').contentWindow;
			tools.modifyAvailDataSources();
		} else {
			document.getElementById('toolbarContainer').style.display = 'none';
		}

		tabs.onTabSelect('fieldType');
		if (fieldGrid.currFldNode) {
			tabs.tabbarApplet.selectTab('fieldType');
			fieldGrid.selectField(fieldGrid.currFldID);
		} else {
			tabs.tabbarApplet.selectTab('formProperties');
		}

		propertiesFrame.isFormTool = true;
		parent.ITEM_WINDOW.registerStandardShortcuts(window, true);
	};

	container.pageY = function (elem) {
		return elem.offsetParent
			? elem.offsetTop + container.pageY(elem.offsetParent)
			: elem.offsetTop;
	};

	container.resizeCanvasIframe = function () {
		var height =
			window.innerHeight ||
			document.body.clientHeight ||
			document.documentElement.clientHeight;
		height -= container.pageY(document.getElementById('canvas')) + buffer;
		height = height < 0 ? 0 : height;
		document.getElementById('canvas').style.height = height + 'px';
	};

	container.createTabBar = function (onTabSelect) {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Experimental.SimpleTabbar',
			undefined,
			function (control) {
				tabbarApplet = control;
				clientControlsFactory.on(tabbarApplet, 'onClick', onTabSelect);
			}
		);
	};
}
