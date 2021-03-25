define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(
		'Aras.Client.Controls.TDF.Action.AddFromTemplateAction',
		ActionBase,
		{
			Execute: function (executionParameters) {
				executionParameters = executionParameters || {};

				return this._selectDocument()
					.then(
						function (selectedItem) {
							const documentId = selectedItem && selectedItem.itemID;

							this.aras.browserHelper.toggleSpinner(
								this.actionsHelper.topWindow.document,
								true
							);
							return this._getDocumentContent(documentId);
						}.bind(this)
					)
					.then(
						function (documentContent) {
							const addedElements = this._appendTemplateContent(
								documentContent,
								executionParameters.selectedElement,
								executionParameters.direction
							);

							this.aras.browserHelper.toggleSpinner(
								this.actionsHelper.topWindow.document,
								false
							);

							if (addedElements) {
								this._viewmodel.SetSelectedItems(addedElements);
								return this._tryAdjustDocumentClassification(addedElements);
							}
						}.bind(this)
					)
					.catch(
						function () {
							// spinner should be turned off if something goes wrong
							this.aras.browserHelper.toggleSpinner(
								this.actionsHelper.topWindow.document,
								false
							);
						}.bind(this)
					);
			},

			_selectDocument: function () {
				const viewModel = this._viewmodel;
				const documentItem = viewModel.getDocumentItem();
				const documentItemType = documentItem.getAttribute('type');
				const schemaHelper = viewModel.Schema();
				const schemaItem = schemaHelper.getSchemaItem();
				const arasModules = this.actionsHelper.topWindow.ArasModules;
				const dialogParameters = {
					aras: this.aras,
					type: 'SearchDialog',
					itemtypeName: documentItemType,
					multiselect: false,
					sourceItemTypeName: documentItemType,
					sourcePropertyName: 'root_element_name',
					dialogWidth: 800,
					dialogHeight: 600,
					itemContext: {
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
				};

				return arasModules.Dialog.show('iframe', dialogParameters).promise;
			},

			_getDocumentContent: function (documentId) {
				if (documentId) {
					const viewModel = this._viewmodel;

					return viewModel.GetDocumentBlockXmlAsync(
						documentId,
						viewModel.CurrentLanguageCode()
					);
				}
			},

			_appendTemplateContent: function (
				templateContent,
				targetElement,
				direction
			) {
				const templateXml = this._prepareTemplateXml(templateContent);

				if (templateXml) {
					const viewModel = this._viewmodel;
					const externalProvider = viewModel.OriginExternalProvider();
					const rootNode = templateXml.documentElement;
					const newReferencesNode = rootNode.selectSingleNode(
						'aras:references'
					);
					const insertContent = direction === 'insert';
					let contentBlockNode = rootNode.selectSingleNode(
						'aras:content/aras:block'
					);

					contentBlockNode = viewModel.origin.ownerDocument.importNode(
						contentBlockNode,
						true
					);
					// need to merge references from template document
					externalProvider.Update(newReferencesNode);

					const newElement = viewModel.CreateElement('element', {
						origin: contentBlockNode
					});

					if (newElement) {
						const tryMode = insertContent ? 'into' : 'after';
						const schemaHelper = viewModel.Schema();
						const validationResult = schemaHelper.TryCandidatesAt({
							context: targetElement,
							values: [newElement],
							mode: tryMode
						});

						if (validationResult.isValid) {
							const contentElements = newElement.ChildItems().List();
							const containerElement = insertContent
								? targetElement
								: targetElement.Parent;
							const siblingElements = containerElement.ChildItems();
							const insertPosition = insertContent
								? 0
								: siblingElements.index(targetElement) + 1;

							viewModel.SuspendInvalidation();
							siblingElements.insertAt(insertPosition, contentElements);
							viewModel.ResumeInvalidation();

							return contentElements;
						} else {
							newElement.unregisterDocumentElement();

							this.aras.AlertError(
								this.aras.getResource(
									'../Modules/aras.innovator.TDF',
									'action.addfromtemplate.schemavalidationfailed'
								)
							);
						}
					}
				}
			},

			_prepareTemplateXml: function (templateContent) {
				let templateXml = this._createDocumentXmlFromString(templateContent);

				if (this._isValidContent(templateXml)) {
					templateContent = this._changeElementUids(
						templateContent,
						templateXml
					);

					return this._createDocumentXmlFromString(templateContent);
				}
			},

			_isValidContent: function (contentXml) {
				if (contentXml) {
					const blockNode = contentXml.selectSingleNode(
						'//aras:content/aras:block'
					);

					if (blockNode) {
						const isContentBlocked = blockNode.getAttribute('isBlocked');
						const isContentEmpty = !blockNode.hasChildNodes();

						if (isContentBlocked) {
							this.aras.AlertError(
								this.aras.getResource(
									'../Modules/aras.innovator.TDF',
									'action.addfromtemplate.contentisblocked'
								)
							);
						} else if (isContentEmpty) {
							this.aras.AlertError(
								this.aras.getResource(
									'../Modules/aras.innovator.TDF',
									'action.addfromtemplate.contentisempty'
								)
							);
						} else {
							return true;
						}
					}
				}
			},

			_changeElementUids: function (inputContent, sourceDocument) {
				if (inputContent) {
					const documentXml =
						sourceDocument || this._createDocumentXmlFromString(inputContent);
					const rootNode = documentXml.documentElement;
					const contentNode = rootNode.selectSingleNode('aras:content');
					const elementNodes = contentNode.selectNodes('.//*[@aras:id]');
					const replacementCache = {};
					let resultContent = inputContent;

					for (let i = 0; i < elementNodes.length; i++) {
						const currentNode = elementNodes[i];
						const elementUid = currentNode.getAttribute('aras:id');

						if (!replacementCache[elementUid]) {
							const replaceValue = (replacementCache[
								elementUid
							] = this.aras.generateNewGUID());
							const searchRegExp = new RegExp(elementUid, 'g');

							resultContent = resultContent.replace(searchRegExp, replaceValue);
						}
					}

					return resultContent;
				}
			},

			_createDocumentXmlFromString: function (xmlString) {
				if (xmlString) {
					const resultDocument = new XmlDocument();

					resultDocument.preserveWhiteSpace = true;
					resultDocument.loadXML(xmlString);

					if (this.aras.Browser.isIe()) {
						resultDocument.setProperty(
							'SelectionNamespaces',
							'xmlns:aras="http://aras.com/ArasTechDoc"'
						);
					} else {
						resultDocument.documentElement.setAttribute(
							'xmlns:aras',
							'http://aras.com/ArasTechDoc'
						);
					}

					return resultDocument;
				}
			},

			_tryAdjustDocumentClassification: function (newElements) {
				const viewModel = this._viewmodel;
				const currentClassification = viewModel.getDocumentProperty(
					'classification'
				);
				const candidateElement =
					newElements && newElements.length === 1 && newElements[0];

				// if classification was not set before and only one element was added, then potentially classification of the document can be changed
				if (!currentClassification && candidateElement) {
					const rootDocumentElement = viewModel.Dom();

					// if new element is a single first-level child in the document
					if (
						candidateElement.Parent === rootDocumentElement &&
						rootDocumentElement.ChildItems().length() === 1
					) {
						const schemaHelper = viewModel.Schema();
						const schemaElementDescriptor = schemaHelper.getXmlSchemaElement(
							candidateElement.nodeName
						);
						const appropriateClassification =
							schemaElementDescriptor &&
							schemaElementDescriptor.defaultClassification;

						if (appropriateClassification) {
							return this._confirmClassificationChange(
								appropriateClassification
							);
						}
					}
				}
			},

			_confirmClassificationChange: function (classification) {
				return this.actionsHelper.topWindow.ArasModules.Dialog.show('iframe', {
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
							const documentItem = this._viewmodel.getDocumentItem();

							this.aras.setItemProperty(
								documentItem,
								'classification',
								classification
							);
							this.actionsHelper.topWindow.onSaveCommand();
						}
					}.bind(this)
				);
			}
		}
	);
});
