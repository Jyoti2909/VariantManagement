define(function () {
	'use strict';
	var DialogHelper = (function () {
		function DialogHelper(aras) {
			this._arasObject = aras;
		}
		DialogHelper.prototype.createParamsForGroupDialog = function (
			defaultValue,
			title,
			message
		) {
			return {
				buttons: {
					btnYes: aras.getResource('', 'common.ok'),
					btnCancel: aras.getResource('', 'common.cancel')
				},
				title: 'Create group',
				defaultButton: 'btnCancel',
				aras: this._arasObject,
				dialogHeight: 150,
				dialogWidth: 300,
				message: 'Please, enter the group name',
				content:
					'../Modules/aras.innovator.TreeGridView/Views/CreateGroupDialog.html',
				defValue: defaultValue
			};
		};
		return DialogHelper;
	})();
	return DialogHelper;
});
