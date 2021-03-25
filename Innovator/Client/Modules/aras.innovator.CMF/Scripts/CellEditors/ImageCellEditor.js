/* global define */
define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry'
], function (declare, TooltipDialog, on, keys, CellEditorBase) {
	var valueToReturn;

	return declare(CellEditorBase, {
		show: function (cell, onCellEditorClosed) {
			var params = {
				aras: parent.aras,
				showOnlyExternalFile: true,
				type: 'ImageBrowser'
			};

			var topWindow = parent.aras.getMostTopWindowWithAras(window);
			var createForumDialog = window.parent.ArasModules.Dialog.show(
				'iframe',
				params
			);
			createForumDialog.promise.then(function (newImg) {
				if (newImg) {
					if (newImg === 'set_nothing') {
						valueToReturn = '';
						onCellEditorClosed();
					} else {
						var fileId = newImg.replace(/vault:\/\/\/\?fileid=/i, '');
						valueToReturn = fileId;
						onCellEditorClosed();
					}
				}
			});
		},

		getValue: function () {
			return valueToReturn;
		}
	});
});
