define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(ActionBase, {
		typeSystemAttributes: null,
		formId: '2B586AB158144FEB999E6812C9657647', // tp_EditAttributesDialog form

		constructor: function () {
			this.typeSystemAttributes = [
				{
					type: 'ArasImageXmlSchemaElement',
					systemAttributes: ['id', 'src', 'ref-id']
				},
				{
					type: 'ArasItemXmlSchemaElement',
					systemAttributes: ['id', 'ref-id', 'typeId']
				},
				{
					type: 'ArasBlockXmlSchemaElement',
					systemAttributes: ['by-reference', 'condition', 'id', 'ref-id']
				},
				{
					type: 'ArasListXmlSchemaElement',
					systemAttributes: ['type']
				},
				{
					type: 'ArasTableXmlSchemaElement',
					systemAttributes: ['MergeMatrix', 'ColWidth']
				},
				{
					type: 'ArasCellXmlSchemaElement',
					systemAttributes: ['valign', 'align']
				}
			];
		},

		isSystemAttibute: function (targetElement, attributeName) {
			if (targetElement && attributeName) {
				for (let i = 0; i < this.typeSystemAttributes.length; i++) {
					const typeData = this.typeSystemAttributes[i];

					if (
						targetElement.is(typeData.type) &&
						typeData.systemAttributes.indexOf(attributeName) > -1
					) {
						return true;
					}
				}
			}

			return false;
		},

		_getNonSystemAttributes: function (targetElement) {
			const attributesList = this._viewmodel
				.Schema()
				.GetSchemaElementAttributes(targetElement);

			return attributesList
				? attributesList.filter(
						(attribute) => !this.isSystemAttibute(targetElement, attribute.Name)
				  )
				: [];
		},

		Validate: function (executionArguments) {
			const targetElement = executionArguments.selectedElement;
			const nonSystemAttributes = this._getNonSystemAttributes(targetElement);

			return Boolean(nonSystemAttributes.length);
		},

		Execute: function (executionArguments) {
			const targetElement = executionArguments.selectedElement;
			const nonSystemAttributes = this._getNonSystemAttributes(targetElement);

			if (nonSystemAttributes.length) {
				const dialogArguments = {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.attributesdialog'
					),
					aras: this.aras,
					isEditMode: true,
					isDisabled: !this._viewmodel.IsEqualEditableLevel(
						Enums.EditLevels.FullAllow
					),
					formId: this.formId,
					attrlist: nonSystemAttributes,
					wrappedObj: targetElement,
					dialogWidth: 375,
					dialogHeight: 410,
					content: 'ShowFormAsADialog.html'
				};

				return this.actionsHelper.topWindow.ArasModules.Dialog.show(
					'iframe',
					dialogArguments
				)
					.promise.then((selectedValues) => {
						if (selectedValues) {
							this._viewmodel.SuspendInvalidation();

							for (let attributeName in selectedValues) {
								targetElement.Attribute(
									attributeName,
									selectedValues[attributeName] || null
								);
							}

							this._viewmodel.ResumeInvalidation();

							this.OnExecuted(targetElement, selectedValues);
						}
					})
					.catch((exception) => {
						this.aras.AlertError(exception);
					});
			}
		}
	});
});
