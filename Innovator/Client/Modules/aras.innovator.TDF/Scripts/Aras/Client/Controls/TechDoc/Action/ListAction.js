define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		Execute: function (executeParameters) {
			const modelSelection = this._viewmodel.GetSelectedItems();
			const selectedElement = modelSelection.length === 1 && modelSelection[0];

			executeParameters = executeParameters || {};

			if (selectedElement) {
				const listElement = selectedElement.is('ArasListXmlSchemaElement')
					? selectedElement
					: selectedElement.is('ArasListItemXmlSchemaElement') &&
					  selectedElement.List();

				if (listElement) {
					listElement.SetNewStyleOfList(executeParameters.listtype);

					this.OnExecuted(listElement, executeParameters.listtype);
				}
			}
		}
	});
});
