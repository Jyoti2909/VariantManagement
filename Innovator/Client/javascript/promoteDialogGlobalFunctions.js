function initializePromoteDialogGlobalFunctions(container) {
	container.promoteData = {};

	container.initPromoteData = () => {
		var trans = aras.getItemNextStates(itemTypeName, itemID);
		if (!trans) {
			container.closeWindow();
			return false;
		}
		trans = trans.selectNodes("//Item[@type='Life Cycle Transition']");
		if (trans.length == 0) {
			setTimeout(function () {
				var topWnd = aras.getMostTopWindowWithAras();

				topWnd.aras.AlertError(
					aras.getResource('', 'promotedlg.no_promotions_available')
				);
				container.closeWindow();
			}, 0);

			return false;
		}

		for (var i = 0; i < trans.length; i++) {
			var transNd = trans[i];
			var toState = transNd.selectSingleNode('to_state/Item');
			if (!toState) {
				continue;
			}
			var stName = aras.getItemProperty(toState, 'name');
			if (!stName) {
				continue;
			}
			var stLabel = aras.getItemProperty(toState, 'label');

			container.promoteData[i] = {};
			container.promoteData[i].label = stLabel;
			container.promoteData[i].name = stName;
			container.promoteData[i].comment =
				aras.getItemProperty(transNd, 'get_comment') == '1';
		}

		if (!container.promoteData[0]) {
			container.closeWindow();
			return false;
		}

		return true;
	};

	container.initControls = () => {
		if (!container.initPromoteData()) {
			return;
		}

		container.toolbar = null;
		container.grid = null;
		container.statusbar = null;

		clientControlsFactory.createControl(
			'Aras.Client.Controls.Experimental.StatusBar',
			{
				id: 'bottom_statusBar',
				aras: aras,
				resourceUrl: aras.getI18NXMLResource(
					'defaultstatusbar.xml',
					aras.getBaseURL()
				)
			},
			function (control) {
				const statusbarCtrl = control;
				var bottomNode = document.getElementById('bottom');
				bottomNode.appendChild(statusbarCtrl.domNode);
				statusbarCtrl.startup();
				container.statusbar = clientControlsFactory.createControl(
					'Aras.Client.Frames.StatusBar',
					{ aras: aras, statusbar: statusbarCtrl }
				);
			}
		);

		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.ToolBar',
			{ id: 'top_toolbar', connectId: 'top' },
			function (control) {
				container.toolbar = control;
				clientControlsFactory.on(toolbar, {
					onClick: onClickItem
				});
				container.loadToolbar();
			}
		);

		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.GridContainer',
			undefined,
			function (control) {
				container.grid = control;
				clientControlsFactory.on(grid, {
					gridDoubleClick: onDoubleClick
				});
				container.initGrid();
			}
		);
	};

	container.initGrid = () => {
		container.grid.setLayout_Experimental([
			{
				field: 'state',
				name: aras.getResource('', 'promotedlg.to_state'),
				width: '100%',
				styles: 'text-align: center;',
				headerStyles: 'text-align: center;'
			}
		]);

		var items = [];
		for (var i in container.promoteData) {
			items.push({
				uniqueId: i,
				state: aras.preserveTags(
					container.promoteData[i].label == ''
						? container.promoteData[i].name
						: container.promoteData[i].label
				)
			});
		}
		container.grid.setArrayData_Experimental(items);
	};

	container.onDoubleClick = (rowId) => {
		container.promoteTo(rowId);
	};

	container.onClickItem = (btn) => {
		btn.setEnabled(false);
		var cmdID = btn.getId();

		if (cmdID == 'promote') {
			var selectedRowId = container.grid.getSelectedId();
			if (!selectedRowId) {
				parent.aras.AlertError(aras.getResource('', 'promotedlg.select_state'));
				container.toolbar
					.getActiveToolbar()
					.getItem('promote')
					.setEnabled(true);
				return false;
			} else {
				container.promoteTo(selectedRowId);
			}
		}
	};

	container.closeWindow = (value) => {
		if (dialogArguments.dialog) {
			dialogArguments.dialog.close(value);
		} else {
			window.returnValue = value;
			window.close();
		}
	};

	container.promoteTo = (rowId) => {
		var state = container.promoteData[rowId].name,
			comment = container.promoteData[rowId].comment;
		if (comment) {
			aras
				.prompt(aras.getResource('', 'promotedlg.comment'), '', window.parent)
				.then(function (comments) {
					if (!comments && comments !== '') {
						comments = null;
					}
					container.promoteWithComments(state, comments); // from promoteDialog.js
				});
		} else {
			container.promoteWithComments(state, ''); // from promoteDialog.js
		}
	};

	container.loadToolbar = () => {
		container.toolbar.showLabels(
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_show_labels'
			) == 'true'
		);
		container.toolbar.loadXml(aras.getI18NXMLResource('promote_toolbar.xml'));
		container.toolbar.show();
	};
}
