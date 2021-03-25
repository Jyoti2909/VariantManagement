/* global define, arasDocumentationHelper*/
define(['dojo/_base/declare'], function (declare) {
	var aras = parent.aras;

	return declare('CMF.UI.Utils', null, {
		showEditorTearOff: function (editedItem, onCloseEditor) {
			aras.uiShowItemEx(editedItem.node).then(function () {
				var editorWindow = aras.uiFindWindowEx(editedItem.getID());
				if (editorWindow) {
					editorWindow.addEventListener('unload', function () {
						setTimeout(function () {
							onCloseEditor();
						}, 0);
					});
				} else {
					onCloseEditor();
				}
			});
		},
		showEditorDialog: function (editedItem, onCloseEditor, formId) {
			var itemTypeName = editedItem.getType();

			// get "ADD" form id if undefined
			if (!formId) {
				var itemTypeDisplay = aras.getItemTypeDictionary(itemTypeName);
				if (!itemTypeDisplay) {
					return false;
				}
				var itemTypeNd = itemTypeDisplay.node;
				if (itemTypeNd) {
					formId = aras.uiGetFormID4ItemEx(editedItem.node, 'add');
				} else {
					return false;
				}
			}

			// get corresponded form
			var formDisplay = aras.getFormForDisplay(formId);
			if (!formDisplay) {
				return false;
			}
			var formNd = formDisplay.node;
			if (!formNd) {
				return false;
			}

			var formHeight = parseInt(aras.getItemProperty(formNd, 'height')) || 300;
			var formWidth = parseInt(aras.getItemProperty(formNd, 'width')) || 400;
			// prepare dialog settings
			var dialogParams = {
				title: itemTypeName,
				aras: aras,
				isEditMode: true,
				formNd: formNd,
				item: editedItem,
				dialogWidth: formWidth,
				dialogHeight: formHeight,
				resizable: true,
				content: 'ShowFormAsADialog.html',
				onload: function (popupDialog) {
					popupDialog.onCancel = function () {
						onCloseEditor(popupDialog);
					};
				}
			};

			var dialog = aras
				.getMostTopWindowWithAras(window)
				.ArasModules.Dialog.show('iframe', dialogParams);
			dialog.promise.then(function () {
				onCloseEditor(dialog);
			});

			return true;
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
