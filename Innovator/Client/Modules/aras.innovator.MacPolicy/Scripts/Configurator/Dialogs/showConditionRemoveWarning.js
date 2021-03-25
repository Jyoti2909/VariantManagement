define(function () {
	'use strict';
	function showConditionRemoveWarning(message) {
		return Promise.resolve()
			.then(function () {
				const confirmDialogParams = {
					buttons: {
						btnYes: aras.getResource('', 'common.yes'),
						btnNo: aras.getResource('', 'common.no')
					},
					defaultButton: 'btnNo',
					message: message,
					aras: aras,
					dialogWidth: 400,
					dialogHeight: 200,
					center: true,
					content: 'groupChgsDialog.html'
				};
				return window.ArasModules.Dialog.show(
					'iframe',
					confirmDialogParams
				).promise;
			})
			.then(function (res) {
				return res === 'btnYes';
			});
	}
	return showConditionRemoveWarning;
});
