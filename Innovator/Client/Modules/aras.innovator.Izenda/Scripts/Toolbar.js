var arasToolbar;

function loadViewerToolbar(callback, hideButtons, disableButtons) {
	require(['Aras/Client/Controls/Public/ToolBar']);
	clientControlsFactory.createControl(
		'Aras.Client.Controls.Public.ToolBar',
		{ id: 'toolbar', connectId: 'viewer_toolbar' },
		function (control) {
			arasToolbar = control;
			clientControlsFactory.on(arasToolbar, {
				onClick: callback,
				onChange: callback
			});

			arasToolbar.loadXml(
				this.aras.getI18NXMLResource(
					'report_viewer_toolbar.xml',
					aras.getScriptsURL() + '../Modules/aras.innovator.Izenda/'
				)
			);
			arasToolbar.show();

			var results = arasToolbar.getElement('results');
			if (results) {
				results.SetSelected('100');
			}

			refreshToolbar(hideButtons, disableButtons);
		}
	);
}

function prepareToolbar(reportId, callback, accessRights) {
	var report = aras.newIOMItem('SelfServiceReport', 'get');
	report.setID(reportId);
	report = report.apply();
	if (report.isError()) {
		aras.AlertError(report.getErrorString());
	}

	var node = report.node;
	var isLocked = aras.isLocked(node);
	var isLockedByUser = aras.isLockedByUser(node);

	function hideDisableHandler(hideButtons, disableButtons) {
		if (arasToolbar) {
			refreshToolbar(hideButtons, disableButtons);
		} else {
			loadViewerToolbar(callback, hideButtons, disableButtons);
		}
	}

	if (report.getProperty('created_by_id') == aras.getUserID()) {
		accessRights = 'full';
	}
	switch (accessRights) {
		case 'full':
			if (isLocked && !isLockedByUser) {
				hideDisableHandler(
					[],
					[
						{ id: 'edit_report', isEnabled: false },
						{ id: 'delete_report', isEnabled: false }
					]
				);
			} else {
				hideDisableHandler([], []);
			}
			break;
		case 'readonly':
			hideDisableHandler(['edit_report', 'delete_report'], []);
			break;
		case 'viewonly':
		case 'locked':
			hideDisableHandler(
				['edit_report', 'delete_report', 'save_as_report'],
				[]
			);
			break;
	}
}

function refreshToolbar(hideButtons, disableButtons) {
	for (var i = 0; i < hideButtons.length; i++) {
		arasToolbar.hideItem(hideButtons[i]);
	}

	for (var j = 0; j < disableButtons.length; j++) {
		var btnObj = disableButtons[j];
		var button = arasToolbar.getElement(btnObj.id);
		if (button) {
			button.SetEnabled(btnObj.isEnabled);
		}
	}
}

function deleteReportWrapper(reportId) {
	function refreshData() {
		const myReportsWnd = Izenda.Utils.GetMyReportsWindow();
		if (myReportsWnd) {
			myReportsWnd.updateReports();
		} else {
			//SSR grid
			const mainWnd = aras.getMainWindow();
			if (mainWnd.work.grid) {
				mainWnd.work.setMenuState(mainWnd.work.grid.getRowId(0));
			}
		}
		window.close();
	}
	return Izenda.ToolbarMethods.deleteReport(reportId, null, refreshData);
}

function saveAsReportWrapper(reportId) {
	Izenda.ToolbarMethods.saveAsReport(aras, reportId);
	const myReportsWnd = Izenda.Utils.GetMyReportsWindow();
	if (myReportsWnd) {
		myReportsWnd.updateReports();
	}
}

function editReportWrapper(reportId) {
	Izenda.ToolbarMethods.editReport(reportId);
}

function createNewReport() {
	Izenda.ToolbarMethods.createNewReport();
}
