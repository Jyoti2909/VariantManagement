define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/AddElementAction',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemCreator',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/FormDialogItemInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/CoreLocalFileImageInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/SequenceItemInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/CoreBrowserFileImageInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (
	declare,
	AddElementAction,
	BaseItemCreator,
	BaseItemInitializer,
	FormDialogItemInitializer,
	CoreLocalFileImageInitializer,
	SequenceItemInitializer,
	CoreBrowserFileImageInitializer,
	Enums
) {
	return declare(AddElementAction, {
		_itemCreator: null,
		// By default, all items which can be referenced from technical document
		// are belongs to the 'tp_Item' polymorphic ItemType
		_defaultItemTypeName: 'tp_Item',
		_imageItemTypeName: 'tp_Image',

		constructor: function () {
			this._itemInitializers = {
				base: new BaseItemInitializer({
					aras: this.aras
				}),
				formDialog: new FormDialogItemInitializer({
					aras: this.aras
				}),
				coreLocalFileImage: new CoreLocalFileImageInitializer({
					aras: this.aras
				}),
				sequence: new SequenceItemInitializer({
					aras: this.aras
				}),
				coreBrowserFileImage: new CoreBrowserFileImageInitializer({
					aras: this.aras
				})
			};
			this._itemCreator = new BaseItemCreator({
				aras: this.aras,
				actionsHelper: this.actionsHelper,
				itemInitializer: this._itemInitializers.formDialog
			});
		},

		_saveAndUnlockItem: function (targetItem) {
			const itemNode = targetItem && targetItem.node;

			if (this.aras.isNew(itemNode) || this.aras.isDirtyEx(itemNode)) {
				return new Promise(
					function (resolve) {
						const topWindow = this.actionsHelper.topWindow;

						this.aras.browserHelper.toggleSpinner(topWindow.document, true);

						setTimeout(
							function () {
								// Item have action 'add' and should be applied first
								resolve(
									this.aras.saveItemExAsync(itemNode).then(
										function (savedItemNode) {
											let unlockedItem;

											if (savedItemNode) {
												// It should be unlocked after save
												const unlockedItemNode = this.aras.unlockItemEx(
													savedItemNode
												);

												if (unlockedItemNode) {
													unlockedItem = this.aras.newIOMItem();
													unlockedItem.node = unlockedItemNode;
													unlockedItem.dom = unlockedItemNode.ownerDocument;
												}
											}

											if (!unlockedItem) {
												this.aras.browserHelper.toggleSpinner(
													topWindow.document,
													false
												);
											}

											return unlockedItem;
										}.bind(this)
									)
								);
							}.bind(this),
							100
						);
					}.bind(this)
				);
			}

			return targetItem;
		},

		_getItemInitializer: function (itemInitializerType) {
			return (
				this._itemInitializers[itemInitializerType] ||
				this._itemInitializers.base
			);
		},

		Execute: function (inputParameters) {
			const newElementName = inputParameters.elementName;
			const skipElementCreation = inputParameters.skipElementCreation;
			const schemaHelper = this._viewmodel.Schema();
			const elementType = schemaHelper.GetSchemaElementType(newElementName);
			const isItemElement =
				(elementType & Enums.XmlSchemaElementType.Item) ===
				Enums.XmlSchemaElementType.Item;
			const isImageElement =
				(elementType & Enums.XmlSchemaElementType.Image) ===
				Enums.XmlSchemaElementType.Image;
			let itemTypeName;

			if (isItemElement) {
				const typeIdAttribute = schemaHelper.getSchemaAttribute(
					newElementName,
					'typeId'
				);
				const typeId =
					typeIdAttribute && (typeIdAttribute.Fixed || typeIdAttribute.Default);

				itemTypeName = typeId
					? this.aras.getItemTypeName(typeId)
					: this._defaultItemTypeName;
			} else if (isImageElement) {
				itemTypeName = this._imageItemTypeName;
			}

			if (itemTypeName) {
				const schemaXmlElementDescriptor = schemaHelper.getXmlSchemaElement(
					newElementName
				);
				const schemaEditorParameters =
					(schemaXmlElementDescriptor &&
						schemaXmlElementDescriptor.editorParameters) ||
					{};
				const itemCreationParameters = Object.assign(
					{
						initializerType: 'formDialog'
					},
					schemaEditorParameters.itemCreation
				);
				// Default initializer for images is 'sequence' with coreLocalFileImage and formDialog , if some of customers want to use
				// another initializer then this line of code should be updated and 'sequence' replaced on correct one
				const initializerType =
					inputParameters.initializerType ||
					(isImageElement
						? 'sequence'
						: itemCreationParameters.initializerType);
				const creatorParameters = {
					itemInitializer: this._getItemInitializer(initializerType),
					initializerParameters: Object.assign(
						{
							onBeforeInit: itemCreationParameters.onBeforeInit,
							onAfterInit: itemCreationParameters.onAfterInit,
							formId: itemCreationParameters.formId,
							contextParameters: {
								documentItem: this._viewmodel.getDocumentItem(),
								viewModel: this._viewmodel
							},
							onBeforeApply: function (targetItem) {
								return this._saveAndUnlockItem(targetItem);
							}.bind(this),
							initializersSequence: isImageElement
								? [
										this._getItemInitializer('coreLocalFileImage'),
										this._getItemInitializer('formDialog')
								  ]
								: undefined
						},
						inputParameters.initializerParameters
					)
				};

				return this._itemCreator
					.createItem(itemTypeName, creatorParameters)
					.then(this._saveAndUnlockItem.bind(this))
					.then(
						function (savedItem) {
							const itemNode = savedItem && savedItem.node;
							const topWindow = this.actionsHelper.topWindow;
							const browserHelper = this.aras.browserHelper;
							const creationResult = {
								schemaElement: null,
								itemNode: itemNode
							};

							browserHelper.toggleSpinner(topWindow.document, false);

							// Create document XmlSchemaItemElement based on created innovator item
							if (itemNode) {
								this.aras.itemsCache.addItem(itemNode);

								if (!skipElementCreation) {
									const contextObject = inputParameters.context;
									const xmlSchemaElements = schemaHelper
										.getXmlSchemaElements()
										.reduce((elementsHash, elementDescriptor) => {
											const elementName = elementDescriptor.elementName;
											elementsHash[elementName] = elementDescriptor;

											return elementsHash;
										}, {});

									this._updateClassification({
										newElementName: newElementName,
										contextObject: contextObject,
										xmlSchemaElements: xmlSchemaElements
									}).then(() => {
										browserHelper.toggleSpinner(topWindow.document, true);

										const contentHelper = this._viewmodel.ContentGeneration();
										const elementOrigin = contentHelper.ConstructDefaultOrigin(
											newElementName
										);
										const newElement = this._viewmodel.CreateElement(
											'element',
											{
												origin: elementOrigin
											}
										);
										creationResult.schemaElement = newElement;

										if (isItemElement) {
											newElement.Item(itemNode);
										} else if (isImageElement) {
											newElement.Image(itemNode);
										}

										this._addElement(
											contextObject,
											newElement,
											inputParameters.direction
										);

										if (
											newElement.ContentType() ===
											Enums.ElementContentType.Static
										) {
											contentHelper.refreshStaticContent(newElement);
										}

										browserHelper.toggleSpinner(topWindow.document, false);
									});
								}
							}

							return creationResult;
						}.bind(this)
					);
			}
		}
	});
});
