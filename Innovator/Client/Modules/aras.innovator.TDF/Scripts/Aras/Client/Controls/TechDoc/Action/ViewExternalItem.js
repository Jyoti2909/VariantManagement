define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const targetElement = executionArguments.selectedItem;
			let itemTypeName;
			let itemId;

			if (targetElement.is('ArasBlockXmlSchemaElement')) {
				itemTypeName = this._viewmodel.getDocumentItem().getAttribute('type');
				itemId = targetElement.BlockId();
			} else if (targetElement.is('ArasItemXmlSchemaElement')) {
				itemTypeName = targetElement.ItemType();
				itemId = targetElement.ItemId();
			}

			if (itemTypeName && itemId) {
				this.aras.uiShowItem(itemTypeName, itemId).then(() => {
					this.OnExecuted(targetElement);
				});
			}
		},

		Validate: function (executionArguments) {
			const selectedElement = executionArguments.selectedItem;

			if (selectedElement) {
				if (
					selectedElement.is('ArasBlockXmlSchemaElement') &&
					selectedElement.isExternal() &&
					!selectedElement.isBlocked()
				) {
					return true;
				} else if (
					selectedElement.is('ArasItemXmlSchemaElement') &&
					!selectedElement.isEmpty() &&
					!selectedElement.isBlocked()
				) {
					return true;
				}
			}

			return false;
		}
	});
});
