define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	var toolbarHeightInPx = 28;

	function beforeOnloadFormDialog(dialogWindow) {
		dialogWindow.isTdfPopupDialog = true;
		//insert iframe with toolbar
		var iframe = dialogWindow.document.createElement('iframe');
		iframe.id = 'toolbar';
		iframe.width = '100%';
		iframe.height = toolbarHeightInPx + 'px';
		iframe.frameBorder = '0';
		iframe.src = '../Modules/aras.innovator.TDF/HtmlPages/Toolbar.html';
		dialogWindow.document.body.insertBefore(
			iframe,
			dialogWindow.document.body.childNodes[0]
		);
		//insert script to handle toolbar clicks
		var script = dialogWindow.document.createElement('script');
		script.src =
			'../Modules/aras.innovator.TDF/Scripts/FormDialogToolbarHandlers.js';
		dialogWindow.document.head.appendChild(script);
	}

	return declare(
		'Aras.Client.Controls.TechDoc.Action.MakeExternalAction',
		ActionBase,
		{
			_externalIomItem: null,
			_context: null,

			Execute: function (/*Object*/ context) {
				var documentNode = this._viewmodel.getDocumentItem();

				if (
					this.aras.getPermissions(
						'can_add',
						documentNode.getAttribute('typeId')
					)
				) {
					var validationResult = this._getAllowedMakeExternal(
						context.selectedItems
					);

					if (validationResult.isValid) {
						this._context = context;
						this._externalIomItem = this._createExternalDocumentItem();

						this._showFormDialog(this._externalIomItem);
					} else {
						this.aras.AlertWarning(
							this.aras.getResource(
								'../Modules/aras.innovator.TDF',
								'action.schemarestrictionmakeexternal',
								validationResult.errorList.join(', ')
							)
						);
					}
				} else {
					this.aras.AlertError(
						this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'action.nocanaddpermissions'
						)
					);
				}
			},

			_convertIomItemToDictionary: function (iomItem) {
				var result = {};
				var propertyNode = iomItem.node.firstChild;
				var propertyName;
				var propertyValue;
				var isMultilingual;
				var languageCode;
				var nodeName;

				while (propertyNode) {
					nodeName = propertyNode.nodeName;
					isMultilingual = propertyNode.prefix === 'i18n';

					if (isMultilingual) {
						languageCode = propertyNode.getAttribute('xml:lang');
						nodeName = nodeName.substr(5);

						propertyName = nodeName + ':' + languageCode;
						propertyValue = this.aras.getItemTranslation(
							iomItem.node,
							nodeName,
							languageCode,
							''
						);
					} else {
						propertyName = nodeName;
						propertyValue = iomItem.getProperty(nodeName);
					}

					result[propertyName] = propertyValue;
					propertyNode = propertyNode.nextSibling;
				}

				return result;
			},

			_getAllowedMakeExternal: function (selectedItems) {
				var parent = selectedItems[0].Parent;
				var expectedChildsTypes = this._viewmodel
					.Schema()
					.GetSchemaExpectedElementChilds(parent);
				var existingChildsTypes = this._viewmodel.getAllChildElementsByType(
					parent,
					{}
				);
				var validationResult = { isValid: true, errorList: [] };
				var childDescriptor;
				var typeName;
				var filterByType;
				var selectedChildsCount;
				var i;

				filterByType = function (item) {
					return item.nodeName === typeName;
				};

				for (i = 0; i < expectedChildsTypes.length; i++) {
					childDescriptor = expectedChildsTypes[i];
					typeName = childDescriptor.name;

					if (existingChildsTypes[typeName] && childDescriptor.minOccurs) {
						// if "minOccurs" attribute is set for this child type,
						// then we need to check that after "Make External" action
						// childs count wouldn't be lower of that value
						selectedChildsCount = selectedItems.filter(filterByType).length;

						if (
							existingChildsTypes[typeName].count - selectedChildsCount <
							childDescriptor.minOccurs
						) {
							validationResult.isValid = false;
							validationResult.errorList.push(typeName);
						}
					}
				}

				return validationResult;
			},

			_OnExecuteDialog: function () {
				var selectedItems = this._context.selectedItems;
				var savedItem = this._externalIomItem.apply();

				if (savedItem.isError()) {
					this.aras.AlertError(savedItem.getErrorString());
				} else {
					var newBlockProperties = this._convertIomItemToDictionary(
						this._externalIomItem
					);
					var targetElement = selectedItems.length == 1 && selectedItems[0];
					var targetDocumentXml;

					targetElement =
						targetElement && targetElement.is('ArasBlockXmlSchemaElement')
							? targetElement
							: this.actionsHelper.executeAction('group', this._context);
					targetDocumentXml = this._createDocumentXmlForContent(
						targetElement,
						savedItem.getId()
					);

					savedItem.setAction('edit');
					savedItem.setProperty(
						'document_xml',
						targetDocumentXml,
						this._viewmodel.CurrentLanguageCode()
					);
					savedItem = savedItem.apply();

					if (savedItem.isError()) {
						this.aras.AlertError(savedItem.getErrorString());

						// delete created document, if there was an error during content save
						savedItem.setAction('delete');
						savedItem.apply();
					} else {
						newBlockProperties._blockId = savedItem.getId();
						targetElement.MakeBlockExternal(newBlockProperties);
					}
				}
			},

			_createDocumentXmlForContent: function (targetElement, documentId) {
				var clonedDocument = this._viewmodel.origin.cloneNode(true);
				var clonedElementContent = targetElement.origin.cloneNode(true);
				var contentNode = clonedDocument.selectSingleNode('aras:content');

				contentNode.removeChild(contentNode.firstChild);
				clonedElementContent.setAttribute('blockId', documentId);
				contentNode.appendChild(clonedElementContent);

				return clonedDocument.xml;
			},

			_createExternalDocumentItem: function () {
				var documentItemNode = this._viewmodel.getDocumentItem();
				var externalDocumentItem = this.aras.newIOMItem(
					documentItemNode.getAttribute('type'),
					'add'
				);

				externalDocumentItem.setProperty(
					'xml_schema',
					this._viewmodel.getDocumentProperty('xml_schema')
				);
				this._setItemDefaultPropertyValues(externalDocumentItem);

				return externalDocumentItem;
			},

			_setItemDefaultPropertyValues: function (targetItem) {
				if (targetItem) {
					var itemType = targetItem.getType();
					var itemTypeDescriptor = this.aras.getItemTypeDictionary(itemType);

					if (itemTypeDescriptor) {
						var propertiesWithDefaultValue = itemTypeDescriptor.getItemsByXPath(
							'Relationships/Item[@type="Property"][default_value[not(@is_null)]]'
						);
						var propertiesCount = propertiesWithDefaultValue.getItemCount();
						var propertyItem;
						var propertyName;
						var i;

						for (i = 0; i < propertiesCount; i++) {
							propertyItem = propertiesWithDefaultValue.getItemByIndex(i);
							propertyName = propertyItem.getProperty('name');

							if (!targetItem.getProperty(propertyName)) {
								targetItem.setProperty(
									propertyName,
									propertyItem.getProperty('default_value')
								);
							}
						}
					}
				}
			},

			_showFormDialog: function (targetItem) {
				var formId = this.aras.uiGetFormID4ItemEx(targetItem.node, 'add');
				var formNd = this.aras.getFormForDisplay(formId).node;
				var formHeight =
					parseInt(this.aras.getItemProperty(formNd, 'height')) || 300;
				var formWidth =
					parseInt(this.aras.getItemProperty(formNd, 'width')) || 400;
				var dialogParams = {
					title: 'Make External',
					aras: this.aras,
					isEditMode: true,
					editType: 'add',
					formNd: formNd,
					item: targetItem,
					dialogWidth: formWidth,
					dialogHeight: formHeight + toolbarHeightInPx,
					resizable: true,
					content: 'ShowFormAsADialog.html',
					beforeOnload: this.manageClassification.bind(this)
				};
				var showDialogResult;

				showDialogResult = new this.actionsHelper.topWindow.ArasModules.Dialog.show(
					'iframe',
					dialogParams
				);
				showDialogResult.promise.then(
					function (result) {
						if (result && result.isConvertClicked) {
							this._OnExecuteDialog();
						}
					}.bind(this)
				);

				return true;
			},

			manageClassification: function (dialogWindow) {
				var dissallowedClassifications = [];
				var schemaHelper = this._viewmodel.Schema();
				var schemaElement;
				var schemaElementName;
				var foundClassification;
				var schemaElementsWithFoundClaffication;

				if (this._context.selectedItems.length === 1) {
					schemaElementName = this._context.selectedItems[0].nodeName;
					schemaElement = schemaHelper.getXmlSchemaElement(schemaElementName);

					if (schemaElement && schemaElement.defaultClassification) {
						schemaElementsWithFoundClaffication = schemaHelper.getXmlSchemaElements(
							schemaElement.defaultClassification
						);

						if (schemaElementsWithFoundClaffication.length === 1) {
							foundClassification = schemaElement.defaultClassification;
							this._externalIomItem.setProperty(
								'classification',
								foundClassification
							);
						}
					}
				}

				schemaHelper.getXmlSchemaElements().map(function (xmlSchemaElement) {
					if (
						xmlSchemaElement.defaultClassification &&
						dissallowedClassifications.indexOf(
							xmlSchemaElement.defaultClassification
						) === -1 &&
						xmlSchemaElement.defaultClassification !== foundClassification
					) {
						dissallowedClassifications.push(
							xmlSchemaElement.defaultClassification
						);
					}
				});
				dialogWindow.dissallowedClassifications = dissallowedClassifications;

				beforeOnloadFormDialog(dialogWindow);
			}
		}
	);
});
