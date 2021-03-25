var toolbar;
function loadToolbar() {
	var toolbarStr =
		'<toolbarapplet buttonsize="26,25">' +
		'	<toolbar id="toolbar1" />' +
		'</toolbarapplet>';
	toolbar.loadToolbarFromStr(toolbarStr);
	toolbar.show();
	var tooltip = aras.getResource(
		'../Modules/aras.innovator.TreeGridView',
		'parameters_toolbar.toolbarbutton_apply_tooltip'
	);
	toolbar.addButton_Experimental('apply', {
		image: '../images/SaveUnlockClose.svg',
		tooltip: tooltip
	});
	tooltip = aras.getResource(
		'../Modules/aras.innovator.TreeGridView',
		'parameters_toolbar.toolbarbutton_cancel_tooltip'
	);
	toolbar.addButton_Experimental('cancel', {
		image: '../images/Delete.svg',
		tooltip: tooltip
	});
}

clientControlsFactory.createControl(
	'Aras.Client.Controls.Public.Toolbar',
	{ id: 'parameters_toolbar', connectId: 'toolbarContainer' },
	function (control) {
		toolbar = control;
		clientControlsFactory.on(toolbar, {
			onClick: function (tbItem) {
				var cmdId = tbItem.getId();
				switch (cmdId) {
					case 'apply':
						apply();
						break;
					case 'cancel':
						cancel();
						break;
				}
			}
		});
		loadToolbar();
	}
);

function apply() {
	args.dialog.close({ isApplyClicked: true });
}

function cancel() {
	args.dialog.close({});
}
