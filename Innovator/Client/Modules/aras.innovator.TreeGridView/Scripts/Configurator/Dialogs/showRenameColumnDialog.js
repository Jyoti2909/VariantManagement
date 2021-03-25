define(function () {
	'use strict';
	function fetchRenameColumnDefinitionForm() {
		var renameColumnDefinitionFormId = 'AA428B7B3D9D4A5C86969D14209C5290';
		var renameColumnDefinitionForm = aras.getFormForDisplay(
			renameColumnDefinitionFormId
		);
		return renameColumnDefinitionForm;
	}
	function cloneIomItem(itemToClone) {
		var clonedItem = itemToClone.clone(false);
		// By default `iomItem.clone()` generate new ID and set action 'add'.
		clonedItem.setID(itemToClone.getID());
		clonedItem.setAction(itemToClone.getAction());
		return clonedItem;
	}
	function showRenameColumnDialog(args) {
		var clonedColumnDefinitionItem;
		return Promise.resolve()
			.then(function () {
				clonedColumnDefinitionItem = cloneIomItem(args.columnDefinitionItem);
				var renameColumnDefinitionForm = fetchRenameColumnDefinitionForm();
				var columnDefinitionItemType = aras.getItemTypeForClient(
					clonedColumnDefinitionItem.getType()
				);
				var dialogArguments = {
					title: aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'configurator.rename_column_dialog.title'
					),
					formNd: renameColumnDefinitionForm.node,
					itemTypeNd: columnDefinitionItemType.node,
					aras: aras,
					formType: 'edit',
					item: clonedColumnDefinitionItem,
					dialogWidth: 240,
					dialogHeight: 120,
					resizable: true,
					content: 'ShowFormAsADialog.html'
				};
				return ArasModules.Dialog.show('iframe', dialogArguments).promise;
			})
			.then(function (result) {
				return {
					isApplied: !!result,
					changedColumnDefinitionItem: clonedColumnDefinitionItem
				};
			});
	}
	return showRenameColumnDialog;
});
