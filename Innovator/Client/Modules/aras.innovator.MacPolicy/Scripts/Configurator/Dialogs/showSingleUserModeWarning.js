define(function () {
	'use strict';
	function showSingleUserModeWarning() {
		const confirmDialogParams = {
			buttons: {
				btnYes: aras.getResource('', 'common.ok'),
				btnCancel: aras.getResource('', 'common.cancel')
			},
			defaultButton: 'btnCancel',
			message: aras.getResource(
				'../Modules/aras.innovator.MacPolicy/',
				'policy.single_user_mode_error'
			),
			aras: aras,
			dialogWidth: 400,
			dialogHeight: 200,
			center: true,
			content: 'groupChgsDialog.html'
		};
		return window.ArasModules.Dialog.show(
			'iframe',
			confirmDialogParams
		).promise.then(function (res) {
			if (res == 'btnYes') {
				return true;
			}
			return false;
		});
	}
	return showSingleUserModeWarning;
});
