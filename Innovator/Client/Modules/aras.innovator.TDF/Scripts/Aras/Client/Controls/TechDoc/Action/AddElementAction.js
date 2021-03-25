define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.AddElementAction',
		ActionBase,
		{
			constructor: function (args) {},

			Execute: function (/*Object*/ args) {
				var contextObject = args.context;
				var direction = args.direction;
				var newElementName = args.elementName;
				var newElement = null;
				var schemaHelper = this._viewmodel.Schema();

				if (newElementName == 'External Content') {
					var searchNames = [];
					var expectedElements = schemaHelper.GetExpectedElements(
						contextObject
					);

					switch (direction) {
						case 'append':
							searchNames = expectedElements.append;
							break;
						case 'insert':
							searchNames = expectedElements.insert;
							break;
					}

					this._SearchBlock(
						searchNames,
						function (/*Array*/ selectedBlockIds) {
							if (selectedBlockIds && selectedBlockIds.length) {
								var currentDocumentItemNode = this._viewmodel.getDocumentItem();
								var currentSchemaId = this._viewmodel.getDocumentProperty(
									'xml_schema'
								);
								var documentItemType = currentDocumentItemNode.getAttribute(
									'type'
								);
								var blockId;
								var documentItemNode;
								var i;

								for (i = 0; i < selectedBlockIds.length; i++) {
									blockId = selectedBlockIds[i];
									documentItemNode = this.aras.getItemById(
										documentItemType,
										blockId
									);

									if (
										this.aras.getItemProperty(
											documentItemNode,
											'xml_schema'
										) === currentSchemaId
									) {
										newElement = this._GetArasBlockElement(blockId);

										if (newElement) {
											var tryMode = direction == 'insert' ? 'into' : 'after';
											var validationResult = schemaHelper.TryCandidatesAt({
												context: contextObject,
												values: [newElement],
												mode: tryMode
											});

											if (validationResult.isValid) {
												this._addElement(contextObject, newElement, direction);
											} else {
												newElement.unregisterDocumentElement();

												this.aras.AlertError(
													this.aras.getResource(
														'../Modules/aras.innovator.TDF',
														'action.cannotaddexternalblock',
														newElement.GetProperty('name')
													)
												);
											}
										}
									} else {
										this.aras.AlertError(
											this.aras.getResource(
												'../Modules/aras.innovator.TDF',
												'action.externalwithdifferentschema',
												this.aras.getItemProperty(documentItemNode, 'name')
											)
										);
									}
								}
							}
						}.bind(this)
					);

					return;
				} else if (newElementName == '#text') {
					newElement = this._viewmodel.CreateElement('text', {});

					this._addElement(contextObject, newElement, direction);
				} else {
					var elementType = schemaHelper.GetSchemaElementType(newElementName);

					if (
						(elementType & Enums.XmlSchemaElementType.Table) ==
						Enums.XmlSchemaElementType.Table
					) {
						this.actionsHelper.executeAction('tableactions', {
							action: 'table',
							createHelper: {
								direction: direction,
								newElementName: newElementName,
								updateClassification: this._updateClassification.bind(this),
								contextObject: contextObject
							}
						});
					} else if (
						(elementType & Enums.XmlSchemaElementType.Image) ==
							Enums.XmlSchemaElementType.Image ||
						(elementType & Enums.XmlSchemaElementType.Item) ==
							Enums.XmlSchemaElementType.Item
					) {
						var contentHelper = this._viewmodel.ContentGeneration();
						var elementOrigin = contentHelper.ConstructDefaultOrigin(
							newElementName
						);

						if (
							(elementType & Enums.XmlSchemaElementType.Image) ==
							Enums.XmlSchemaElementType.Image
						) {
							this._SearchImage(
								function (result) {
									this._updateClassification({
										newElementName: newElementName,
										contextObject: contextObject,
										xmlSchemaElements: schemaHelper._xmlSchemaElements
									}).then(
										function () {
											var externalProvider = this._viewmodel.OriginExternalProvider();
											var refId = externalProvider.GetRefIdByImageId(
												result.image.getAttribute('id')
											);
											if (refId) {
												elementOrigin.setAttribute(
													externalProvider.referenceAttributeName,
													refId
												);
											}

											newElement = this._viewmodel.CreateElement('element', {
												origin: elementOrigin
											});
											newElement.Image(result.image);

											this._addElement(contextObject, newElement, direction);

											if (
												newElement.ContentType() ==
												Enums.ElementContentType.Static
											) {
												contentHelper.refreshStaticContent(newElement);
											}
										}.bind(this)
									);
								}.bind(this)
							);
						} else {
							//It is required that customer set fixed value for typeId on node that inherits arasItemType behavior.
							//We need to find this typeId value in order to preset it for search dialog;
							var typeIdAttribute = schemaHelper.getSchemaAttribute(
								newElementName,
								'typeId'
							);
							var typeId = typeIdAttribute
								? typeIdAttribute.Fixed
								: 'DE828FBA99FF4ABB9E251E8A4118B397';

							this._SearchItem(
								typeId,
								function (result) {
									var resItem = result.item;

									//we have to get original item type because tp_Item doesn't have all required properties in order to perform custom rendering if it exists
									if (typeId == 'DE828FBA99FF4ABB9E251E8A4118B397') {
										// tp_Item
										var itemQuery = this.aras.newIOMItem();
										var itemId = this.aras.getItemProperty(resItem, 'id');

										itemQuery.setAttribute(
											'typeId',
											'DE828FBA99FF4ABB9E251E8A4118B397'
										);
										itemQuery.setID(itemId);
										itemQuery.setAction('get');
										resItem = itemQuery.apply().node;
									}

									this._updateClassification({
										newElementName: newElementName,
										contextObject: contextObject,
										xmlSchemaElements: schemaHelper._xmlSchemaElements
									}).then(
										function () {
											newElement = this._viewmodel.CreateElement('element', {
												origin: elementOrigin
											});
											newElement.Item(resItem);

											this._addElement(contextObject, newElement, direction);

											if (
												newElement.ContentType() ==
												Enums.ElementContentType.Static
											) {
												contentHelper.refreshStaticContent(newElement);
											}
										}.bind(this)
									);
								}.bind(this)
							);
						}
					} else {
						newElement = this._viewmodel.CreateElement('element', {
							type: newElementName
						});
						if (!newElement) {
							return;
						}

						this._viewmodel.SuspendInvalidation();

						this._updateClassification({
							newElementName: newElementName,
							contextObject: contextObject,
							xmlSchemaElements: schemaHelper._xmlSchemaElements
						}).then(
							function () {
								var isChrome = this.aras.Browser.isCh();

								this._addElement(contextObject, newElement, direction);
								if (isChrome) {
									// Chrome has bug where no selection.
									// It's required to add Text Node for bugfixing in chrome,
									// which gens "There is no selection..." exception
									// At once appended Text Node to form Selection object,
									// then removed one.
									var textNode = document.createTextNode('');

									this.actionsHelper.editor.editNode.appendChild(textNode);
									this.actionsHelper.editor.focus();
									this.actionsHelper.editor.editNode.removeChild(textNode);
								} else {
									this.actionsHelper.editor.focus();
								}

								this._viewmodel.ResumeInvalidation();
							}.bind(this)
						);
					}
				}
			},

			_updateClassification: function (args) {
				var elements = args.xmlSchemaElements;
				var xmlSchemaElement = elements[args.newElementName];

				var isDefinedClassification = !!this._viewmodel._item.classification;
				var isRootSelected = this._viewmodel.isRootElementContained(
					args.contextObject
				);
				var hasOneChild = this._viewmodel.getElementsCount() === 1;
				var classification =
					xmlSchemaElement && xmlSchemaElement.defaultClassification;

				if (
					isDefinedClassification ||
					!isRootSelected ||
					!hasOneChild ||
					!classification
				) {
					return Promise.resolve();
				}

				var correspondingElements = Object.keys(elements).filter(function (
					key
				) {
					return !!(
						typeof elements[key] === 'object' &&
						elements[key].defaultClassification === classification
					);
				});

				if (correspondingElements.length !== 1) {
					return Promise.resolve();
				}

				return this._confirmClassification(classification);
			},

			_confirmClassification: function (classification) {
				const topWindow = this.actionsHelper.topWindow;

				return topWindow.ArasModules.Dialog.show('iframe', {
					buttons: {
						btnYes: this.aras.getResource('', 'common.ok'),
						btnCancel: this.aras.getResource('', 'common.cancel')
					},
					defaultButton: 'btnCancel',
					aras: this.aras,
					dialogHeight: 180,
					dialogWidth: 400,
					message: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.confirmclassification',
						classification
					),
					content: 'groupChgsDialog.html'
				}).promise.then(
					function (confirmResult) {
						if (confirmResult === 'btnYes') {
							const editorWindow = window;
							const documentItem = this._viewmodel.getDocumentItem();
							const saveHandler = function () {
								topWindow.onSaveCommand();
								editorWindow.removeEventListener(
									'change:item',
									saveHandler,
									false
								);
							};

							editorWindow.addEventListener('change:item', saveHandler, false);

							this.aras.setItemProperty(
								documentItem,
								'classification',
								classification
							);
						}
					}.bind(this)
				);
			},

			_addElement: function (contextObject, newElement, direction) {
				this._viewmodel.SuspendInvalidation();

				switch (direction) {
					case 'insert':
						this._insertElement(contextObject, newElement);
						break;
					case 'append':
						this._appendElement(contextObject, newElement);
						break;
				}
				this._viewmodel.focusElement(newElement, true);
				this._viewmodel.ResumeInvalidation();
			},

			_appendElement: function (appendContext, newElement) {
				var indexInParent = appendContext.Parent.ChildItems().index(
					appendContext
				);

				appendContext.Parent.ChildItems().insertAt(
					indexInParent + 1,
					newElement
				);
			},

			_insertElement: function (insertContext, newElement) {
				insertContext.ChildItems().insertAt(0, newElement);
			},

			_GetArasBlockElement: function (blockId) {
				var documentXml = this._viewmodel.GetDocumentBlockXml(
					blockId,
					this._viewmodel.DefaultLanguageCode(),
					Enums.ByReferenceType.External
				);
				var documentXmlDom = new XmlDocument();
				var externalProvider = this._viewmodel.OriginExternalProvider();
				var rootNode;
				var newReferencesNode;
				var newBlockNode;
				var newBlockElement;

				if (!documentXml) {
					return;
				}
				// preserve whitespace = true IR-029141
				documentXmlDom.preserveWhiteSpace = true;
				documentXmlDom.loadXML(documentXml);
				rootNode = documentXmlDom.documentElement;

				if (this.aras.Browser.isIe()) {
					documentXmlDom.setProperty(
						'SelectionNamespaces',
						"xmlns:aras='http://aras.com/ArasTechDoc'"
					);
				} else {
					rootNode.setAttribute('xmlns:aras', 'http://aras.com/ArasTechDoc');
				}

				//we need to merge reference blocks of new block first for furthure CreateElement, it will resolve external refs in new block
				newReferencesNode = rootNode.selectSingleNode('aras:references');
				externalProvider.Update(newReferencesNode);

				newBlockNode = rootNode.selectSingleNode('aras:content/aras:block');
				newBlockNode = this._viewmodel.origin.ownerDocument.importNode(
					newBlockNode,
					true
				);
				newBlockElement = this._viewmodel.CreateElement('element', {
					origin: newBlockNode
				});

				return newBlockElement;
			},

			_SearchBlock: function (searchNames, searchCallback) {
				var documentItem = this._viewmodel._item;
				var schemaItem = this._viewmodel.Schema().getSchemaItem();
				var isDirty = documentItem.getAttribute('isDirty') == '1';
				var itemTypeName = documentItem.getAttribute('type');

				if (isDirty) {
					//do not display this block in search result because it is modified
					documentItem.removeAttribute('isDirty');
				}

				this.showSearchDialog({
					aras: this.aras,
					type: 'SearchDialog',
					itemtypeName: itemTypeName,
					multiselect: true,
					sourceItemTypeName: itemTypeName,
					sourcePropertyName: 'root_element_name',
					itemContext: {
						item: this._viewmodel,
						searchNames: searchNames,
						predefinedSearchData: {
							xml_schema: {
								filterValue: schemaItem.getPropertyAttribute(
									'id',
									'keyed_name'
								),
								isFilterFixed: true
							}
						}
					}
				}).promise.then(
					function (searchResult) {
						if (isDirty) {
							//restore initial value of isDirty attribute which was removed before opening searchDialog
							documentItem.setAttribute('isDirty', '1');
						}

						searchCallback(searchResult);
					}.bind(this)
				);
			},

			_SearchImage: function (searchCallback) {
				this.showSearchDialog({
					aras: this.aras,
					type: 'SearchDialog',
					multiselect: false,
					itemtypeName: 'tp_Image'
				}).promise.then(function (searchResult) {
					if (searchResult && searchResult.item) {
						searchCallback({ image: searchResult.item });
					}
				});
			},

			showSearchDialog: function (params) {
				return this.actionsHelper.topWindow.ArasModules.MaximazableDialog.show(
					'iframe',
					params
				);
			},

			_SearchItem: function (typeId, searchCallback) {
				this.showSearchDialog({
					aras: this.aras,
					type: 'SearchDialog',
					multiselect: false,
					itemtypeID: typeId,
					sourceItemTypeName: 'tp_Item',
					sourcePropertyName: 'is_current'
				}).promise.then(function (searchResult) {
					if (searchResult && searchResult.item) {
						searchCallback({ item: searchResult.item });
					}
				});
			}
		}
	);
});
