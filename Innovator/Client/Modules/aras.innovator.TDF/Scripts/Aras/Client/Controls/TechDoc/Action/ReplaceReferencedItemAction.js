define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		_defaultItemTypeName: 'tp_Item',
		_imageItemTypeName: 'tp_Image',

		Execute: async function (executionArguments) {
			executionArguments = executionArguments || {};

			const targetElement = executionArguments.selectedElement;
			const replaceMode = executionArguments.mode || 'element';
			const isItemElement = targetElement.is('ArasItemXmlSchemaElement');
			let selectedItem;

			switch (replaceMode) {
				case 'element':
					const sourceItemTypeName = isItemElement && this._defaultItemTypeName;
					let itemTypeName = !isItemElement && this._imageItemTypeName;

					if (isItemElement) {
						const schemaHelper = this._viewmodel.Schema();
						const typeIdAttribute = schemaHelper.getSchemaAttribute(
							targetElement.nodeName,
							'typeId'
						);

						itemTypeName =
							(typeIdAttribute &&
								this.aras.getItemTypeName(typeIdAttribute.Fixed)) ||
							this._defaultItemTypeName;
					}

					selectedItem = await this._selectItem(
						itemTypeName,
						sourceItemTypeName
					);
					break;
				case 'newitem':
					selectedItem = await this._createItem(targetElement.nodeName);
					break;
			}

			if (selectedItem) {
				return Promise.resolve(
					isItemElement &&
						targetElement.isItemModified() &&
						this._showDropChangesConfirmation(targetElement)
				).then(() => {
					const selectedItemId = selectedItem.getAttribute('id');
					const itemId = isItemElement
						? targetElement.ItemId()
						: targetElement.ImageId();

					if (selectedItemId !== itemId) {
						if (isItemElement) {
							targetElement.Item(selectedItem);
						} else {
							targetElement.Image(selectedItem);
						}

						this.OnExecuted(targetElement, selectedItem);
					}
				});
			}
		},

		Validate: function (executionArguments) {
			executionArguments = executionArguments || {};

			const targetElement = executionArguments.selectedElement;

			return Boolean(
				targetElement &&
					(targetElement.is('ArasItemXmlSchemaElement') ||
						targetElement.is('ArasImageXmlSchemaElement'))
			);
		},

		_showDropChangesConfirmation: function (targetElement) {
			return new Promise((resolve, reject) => {
				const dialogSettings = {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.replacereferenceditem'
					)
				};
				const dialogMessage = this.aras.getResource(
					'',
					'common.discard_confirmationmessage'
				);

				this.actionsHelper.topWindow.ArasModules.Dialog.confirm(
					dialogMessage,
					dialogSettings
				).then((result) => {
					if (result === 'ok') {
						if (targetElement.is('ArasItemXmlSchemaElement')) {
							targetElement.dropItemPropertiesChanges();
						}

						resolve();
					} else {
						reject();
					}
				});
			});
		},

		_selectItem: function (itemTypeName, sourceItemTypeName) {
			const arasModules = this.actionsHelper.topWindow.ArasModules;

			return arasModules.MaximazableDialog.show('iframe', {
				aras: this.aras,
				type: 'SearchDialog',
				multiselect: false,
				itemtypeName: itemTypeName,
				sourceItemTypeName: sourceItemTypeName,
				sourcePropertyName: 'is_current'
			}).promise.then((searchResult) => {
				const resultItem = searchResult && searchResult.item;

				if (resultItem) {
					return this.aras.getItemById(
						resultItem.getAttribute('type'),
						resultItem.getAttribute('id')
					);
				}
			});
		},

		_createItem: async function (elementName) {
			if (elementName) {
				return this.actionsHelper
					.executeAction('appendnewitem', {
						elementName: elementName,
						skipElementCreation: true
					})
					.then((createResult) => {
						return createResult && createResult.itemNode;
					});
			}
		}
	});
});
