define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(ActionBase, {
		formId: '68962F55F96E4583AD53676C3BEF91EC', // tp_ChangeBlockCondition Form

		Execute: function (executionArguments) {
			const viewModel = this._viewmodel;
			const optionalContent = viewModel.OptionalContent();
			const targetElement = executionArguments.selectedElement;
			const isDisabled = !viewModel.IsEqualEditableLevel(
				Enums.EditLevels.FullAllow,
				targetElement
			);
			const isExternalBlock =
				targetElement.is('ArasBlockXmlSchemaElement') &&
				targetElement.isExternal();
			const dialogSettings = {
				isDisabled: isDisabled,
				title: this.aras.getResource(
					'../Modules/aras.innovator.TDF',
					isDisabled
						? 'action.viewelementcondition'
						: 'action.changeelementcondition'
				),
				formId: this.formId,
				aras: this.aras,
				isEditMode: true,
				condition: JSON.parse(targetElement.Condition()),
				externalcondition: isExternalBlock
					? optionalContent.GetElementCondition(
							targetElement,
							Enums.ByReferenceType.External
					  )
					: {},
				optionFamilies: optionalContent.OptionFamilies(),
				dialogWidth: 322,
				dialogHeight: 375,
				content: 'ShowFormAsADialog.html'
			};

			this.actionsHelper.topWindow.ArasModules.Dialog.show(
				'iframe',
				dialogSettings
			).promise.then((result) => {
				if (result) {
					targetElement.Condition(result);

					this.OnExecuted(targetElement, result);
				}
			});
		}
	});
});
