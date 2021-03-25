define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const groupElement = executionArguments.selectedElement;
			const parentElement = groupElement.Parent;

			if (parentElement) {
				const viewModel = this._viewmodel;
				const siblingElements = parentElement.ChildItems();
				let groupPosition = siblingElements.index(groupElement);

				if (groupPosition > -1) {
					const groupedElements = groupElement.ChildItems().List();

					viewModel.SuspendInvalidation();

					siblingElements.splice(groupPosition, 1);
					siblingElements.insertAt(groupPosition, groupedElements);

					viewModel.SetSelectedItems(groupedElements);
					viewModel.ResumeInvalidation();

					this.OnExecuted(parentElement, groupPosition, groupedElements);
				}
			} else {
				this.aras.AlertError(
					this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.couldntapplyforrootblock'
					)
				);
			}
		},

		Validate: function (executionArguments) {
			const selectedElement =
				executionArguments && executionArguments.selectedElement;

			return Boolean(
				selectedElement &&
					selectedElement.Parent &&
					selectedElement.is('ArasBlockXmlSchemaElement') &&
					selectedElement.ByReference() === Enums.ByReferenceType.Internal
			);
		}
	});
});
