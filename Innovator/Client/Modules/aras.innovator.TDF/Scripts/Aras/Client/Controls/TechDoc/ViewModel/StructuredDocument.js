define([
	'dojo/_base/declare',
	'dojo/aspect',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaText',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasBlockXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTextXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListItemXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTableXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasRowXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasCellXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasImageXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasItemXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasItemPropertyXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/ViewModelCursor',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/ViewModelSelection',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/XmlSchemaHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ContentGenerationHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalBlockHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/OptionalContentHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/QueueChanges',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/TableHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalContentHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ActionsHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/Clipboard',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (
	declare,
	aspect,
	XmlSchemaElement,
	XmlSchemaText,
	ArasBlockXmlSchemaElement,
	ArasTextXmlSchemaElement,
	ArasListXmlSchemaElement,
	ArasListItemXmlSchemaElement,
	ArasTableXmlSchemaElement,
	ArasRowXmlSchemaElement,
	ArasCellXmlSchemaElement,
	ArasImageXmlSchemaElement,
	ArasItemXmlSchemaElement,
	ArasItemPropertyXmlSchemaElement,
	ViewModelCursor,
	ViewModelSelection,
	XmlSchemaHelper,
	ContentGenerationHelper,
	ExternalBlockHelper,
	OptionalContentHelper,
	QueueChanges,
	TableHelper,
	ExternalContentHelper,
	ActionsHelper,
	Clipboard,
	Enums
) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.StructuredDocument',
		null,
		{
			_aras: null,
			_item: null,
			origin: null,
			selection: null,
			_all: null,
			_allByIndex: null,
			_allIndexHash: null,
			_allEventHandlers: {},
			_invalidationList: null,
			_invalidationSuspended: [],
			_isInvalidating: null,
			_domInitializing: null,
			_cursor: null,
			_currentLanguageCode: null,
			_defaultLanguageCode: null,
			_multilangcache: null,
			_xmlSchemaHelper: null,
			_contentGenerationHelper: null,
			_optionalContentHelper: null,
			_queueChanges: null,
			_savedDocumentXml: {},
			_cursorEventHandler: null,
			_externalLinks: null,
			_registrationCounter: null,
			_dataRequestSettings: null,
			_statePromises: null,
			_additionalSettings: null,

			constructor: function (inputArguments) {
				var referenceRelationships;

				inputArguments = inputArguments || {};
				referenceRelationships =
					inputArguments.referenceRelationshipNames || {};

				this._aras = inputArguments.aras;
				this._item = inputArguments.item;
				this._classification = this.getDocumentProperty('classification');
				this.ownerDocument = this;
				this._defaultLanguageCode = inputArguments.defaultLanguageCode;
				this._multilangcache = {};
				this._externalLinks = {};
				this._statePromises = {};

				this._all = {};
				this._allByIndex = [];
				this._allIndexHash = {};
				this._invalidationList = [];
				this._isInvalidating = false;
				this._registrationCounter = 0;
				this._additionalSettings = inputArguments.additionalSettings || {};
				this._dataRequestSettings = {
					contentBuilderMethod:
						inputArguments.contentBuilderMethod || 'tp_DocumentGet',
					referenceRelationshipNames: {
						documentReference:
							referenceRelationships.documentReference || 'tp_BlockReference',
						itemReference:
							referenceRelationships.itemReference || 'tp_ItemReference',
						imageReference:
							referenceRelationships.imageReference || 'tp_ImageReference',
						linkReference:
							referenceRelationships.linkReference || 'tp_LinkReference'
					}
				};

				this.postCreate(inputArguments);
			},

			postCreate: function (inputArguments) {
				const isAsyncMode = inputArguments.asyncDataLoading;
				const languageCode =
					inputArguments.currentLanguageCode || this._defaultLanguageCode;

				this._createHelpers(inputArguments);

				if (isAsyncMode) {
					const initCompletePromise = this._InitializeStructureDocumentAsync(
						languageCode
					).then(
						function () {
							if (this.IsEditable()) {
								this._queueChanges.startTrackingChanges();
								this._queueChanges.dropChangesQueue();
							}
						}.bind(this)
					);

					this.setStatePromise('initComplete', initCompletePromise);
				} else {
					this._InitializeStructureDocument(languageCode);

					if (this.IsEditable()) {
						this._queueChanges.startTrackingChanges();
						this._queueChanges.dropChangesQueue();
					}
				}
			},

			_createHelpers: function (inputArguments) {
				this._queueChanges = new QueueChanges({ viewmodel: this });
				this._externalBlockHelper = new ExternalBlockHelper({
					viewmodel: this
				});
				this.tableHelper = new TableHelper({ viewmodel: this });
				this.selection = new ViewModelSelection({ viewmodel: this });
				this._externalHelper = new ExternalContentHelper({ viewmodel: this });
				//init optional content helper before element parsing, because helper should attach on OnRegistered and OnUnregistered events
				this._optionalContentHelper = new OptionalContentHelper({
					viewmodel: this,
					display: Enums.DisplayType.Inactive,
					optionFamilies: inputArguments.optionFamilies,
					optionFamiliesBuilderMethod:
						inputArguments.optionFamiliesBuilderMethod
				});
				this._clipboardHelper = new Clipboard({ aras: this._aras });
				this._actionsHelper = new ActionsHelper({
					viewmodel: this,
					clipboard: this._clipboardHelper,
					aras: this._aras
				});
			},

			QueueChanges: function () {
				return this._queueChanges;
			},

			_InitializeStructureDocument: function (langCode) {
				this._currentLanguageCode = langCode;
				this._ResetSelectionAndCursor();

				this._SetOriginForStructureDocument();
				this._InitializeXmlSchema();
				this._SetDomForStructureDocument();

				if (!this._multilangcache[langCode]) {
					this._multilangcache[langCode] = {
						domObject: this.Dom(),
						xmlDomOrigin: this.origin
					};
				}
			},

			_InitializeStructureDocumentAsync: function (langCode) {
				this._currentLanguageCode = langCode;
				this._ResetSelectionAndCursor();

				return Promise.resolve(this._SetOriginForStructureDocumentAsync())
					.then(
						function () {
							return this._InitializeXmlSchemaAsync();
						}.bind(this)
					)
					.then(
						function () {
							this._SetDomForStructureDocument();

							if (!this._multilangcache[langCode]) {
								this._multilangcache[langCode] = {
									domObject: this.Dom(),
									xmlDomOrigin: this.origin
								};
							}
						}.bind(this)
					);
			},

			_SetOriginForStructureDocument: function () {
				var langCode = this._currentLanguageCode;
				var langDomData = this._multilangcache[langCode];

				if (langDomData && langDomData.xmlDomOrigin) {
					this.origin = langDomData.xmlDomOrigin;
				} else {
					this.origin = this._GetXmlDomByLanguage(langCode);
				}

				this._externalLinks = this._externalHelper.getDocumentExternalLinks(
					this.origin
				);
			},

			_SetOriginForStructureDocumentAsync: function () {
				const langCode = this._currentLanguageCode;
				const langDomData = this._multilangcache[langCode];

				return Promise.resolve(
					(langDomData && langDomData.xmlDomOrigin) ||
						this._GetXmlDomByLanguageAsync(langCode)
				).then(
					function (originXml) {
						this.origin = originXml;
						this._externalLinks = this._externalHelper.getDocumentExternalLinks(
							this.origin
						);
					}.bind(this)
				);
			},

			getElementExternalLinks: function (elementUid) {
				return this._externalLinks[elementUid] || [];
			},

			_SetDomForStructureDocument: function () {
				var langCode = this._currentLanguageCode;
				var langDomData = this._multilangcache[langCode];
				var rootElement =
					langDomData && langDomData.domObject
						? langDomData.domObject
						: this._PrepareDomByOrigin(this.origin);
				var oldRootElement = this.Dom();

				if (oldRootElement) {
					rootElement.Id(oldRootElement.Id());
				}

				this.Dom(rootElement);
			},

			_PrepareDomByOrigin: function (newOrigin) {
				var rootBlockOriginNode = newOrigin.selectSingleNode(
					'aras:content/aras:block'
				);

				return this.CreateElement('element', { origin: rootBlockOriginNode });
			},

			_refreshIndexes: function () {
				if (this._registrationCounter) {
					var schemaElement;
					var i;

					this._allByIndex.length = 0;
					this._allByIndex = this._dom.getAllChilds(null, this._allByIndex);
					this._allIndexHash = {};

					for (i = 0; i < this._allByIndex.length; i++) {
						schemaElement = this._allByIndex[i];
						this._allIndexHash[schemaElement.Id()] = i;
					}

					this._registrationCounter = 0;
				}
			},

			_ResetSelectionAndCursor: function () {
				this.selection.Reset();
				this._initCursor();
				this._externalBlockHelper.Reset();
			},

			_initCursor: function () {
				if (this._cursorEventHandler) {
					this._cursorEventHandler.remove();
				}

				this._cursor = new ViewModelCursor();
				this._cursorEventHandler = aspect.after(
					this._cursor,
					'OnCursorChanged',
					this._OnCursorChanged.bind(this),
					true
				);
			},

			_InitializeXmlSchema: function () {
				if (!this._xmlSchemaHelper) {
					var schemaId = this.getDocumentProperty('xml_schema');
					var xmlSchemaItem = this._aras.newIOMItem('', '');
					var schemaAml =
						'<AML>' +
						'	<Item type="tp_XmlSchema" id="' +
						schemaId +
						'" select="name,content,target_namespace" action="get">' +
						'		<Relationships>' +
						'			<Item type="tp_XmlSchemaElement" action="get" select="name,renderer(method_code),content_generator,' +
						'is_content_dynamic,default_classification,editor_parameters" />' +
						'			<Item type="tp_XmlSchemaOutputSetting" action="get" where="tp_XmlSchemaOutputSetting.classification=\'Editor\'" ' +
						'select="target_classification,stylesheet_id(name,style_content,parent_stylesheet)"/>' +
						'		</Relationships>' +
						'	</Item>' +
						'</AML>';

					xmlSchemaItem.loadAML(schemaAml);
					xmlSchemaItem = xmlSchemaItem.apply();

					if (!xmlSchemaItem.isError()) {
						this._xmlSchemaHelper = new XmlSchemaHelper({
							aras: this._aras,
							dom: this.origin.ownerDocument,
							schemaItem: xmlSchemaItem
						});

						this._contentGenerationHelper = new ContentGenerationHelper({
							viewmodel: this,
							aras: this._aras,
							contentGenerators: this._xmlSchemaHelper._contentGenerators
						});
						this._contentGenerationHelper.updateCacheFromOrigin(
							this._currentLanguageCode,
							this.origin
						);
					} else {
						this._aras.AlertError(xmlSchemaItem.getErrorString());
					}
				}
			},

			_InitializeXmlSchemaAsync: function () {
				if (!this._xmlSchemaHelper) {
					var schemaId = this.getDocumentProperty('xml_schema');
					var xmlSchemaItem = this._aras.newIOMItem('', '');
					var schemaAml =
						'<AML>' +
						'	<Item type="tp_XmlSchema" id="' +
						schemaId +
						'" select="name,content,target_namespace" action="get">' +
						'		<Relationships>' +
						'			<Item type="tp_XmlSchemaElement" action="get" select="name,renderer(method_code),content_generator,' +
						'is_content_dynamic,default_classification,editor_parameters" />' +
						'			<Item type="tp_XmlSchemaOutputSetting" action="get" where="tp_XmlSchemaOutputSetting.classification=\'Editor\'" ' +
						'select="target_classification,stylesheet_id(name,style_content,parent_stylesheet)"/>' +
						'		</Relationships>' +
						'	</Item>' +
						'</AML>';

					xmlSchemaItem.loadAML(schemaAml);

					return xmlSchemaItem.applyAsync().then(
						function (responceItem) {
							if (!responceItem.isError()) {
								this._xmlSchemaHelper = new XmlSchemaHelper({
									aras: this._aras,
									dom: this.origin.ownerDocument,
									schemaItem: responceItem
								});

								this._contentGenerationHelper = new ContentGenerationHelper({
									viewmodel: this,
									aras: this._aras,
									contentGenerators: this._xmlSchemaHelper._contentGenerators
								});
								this._contentGenerationHelper.updateCacheFromOrigin(
									this._currentLanguageCode,
									this.origin
								);
							} else {
								this._aras.AlertError(responceItem.getErrorString());
							}
						}.bind(this)
					);
				}
			},

			Reload: function (newItem, optionalParameters) {
				optionalParameters = optionalParameters || {};

				var wasDirty = this._item.getAttribute('isDirty');
				var isDirty = newItem.getAttribute('isDirty');
				var wasLocked = this._aras.isLockedByUser(this._item);
				var isLocked = this._aras.isLockedByUser(newItem);
				var langCode = this._currentLanguageCode;
				var isReplaceFromServerRequired = false;

				if (optionalParameters.languageCode) {
					this._currentLanguageCode = langCode =
						optionalParameters.languageCode;
				}

				this._item = newItem;

				var classification = this.getDocumentProperty('classification');
				if (classification !== this._classification) {
					this._classification = classification;
					this.OnClassificationChanged();
				}

				if (wasLocked) {
					if ((isLocked && !wasDirty) || (!isLocked && wasDirty)) {
						isReplaceFromServerRequired = true;
					}
				} else {
					isReplaceFromServerRequired = true;
				}

				if (isReplaceFromServerRequired || optionalParameters.forceReload) {
					// hard clear all changes
					this._ReplaceOriginFromServerIfNeed(langCode);
				} else {
					this._GetXmlDomByLanguage(langCode);
					this._invalidate(this._dom);
				}

				if (wasLocked && !isLocked) {
					this._queueChanges.stopTrackingChanges();
					this._queueChanges.dropChangesQueue();
				} else if (isLocked && (!wasLocked || !isDirty)) {
					this._queueChanges.startTrackingChanges();
					this._queueChanges.dropChangesQueue();
				}

				this.selection.Refresh();
			},

			GetDocumentBlockXml: function (blockId, langCode, byReferenceType) {
				var documentContent = this._aras.newIOMItem('', '');
				var builderMethodName = this._dataRequestSettings.contentBuilderMethod;
				var byReference =
					byReferenceType === Enums.ByReferenceType.External
						? 'external'
						: 'internal';
				var itemTypeName = this._item.getAttribute('type');

				documentContent.loadAML(
					'<AML><Item action="' +
						builderMethodName +
						'" type="' +
						itemTypeName +
						'" id="' +
						blockId +
						'" language="' +
						langCode +
						'" by-reference="' +
						byReference +
						'"/></AML>'
				);
				documentContent = documentContent.apply();

				if (documentContent.isError()) {
					this._aras.AlertError(documentContent.getErrorString());
				} else {
					return documentContent.getResult();
				}
			},

			GetDocumentBlockXmlAsync: function (blockId, langCode, byReferenceType) {
				var documentContent = this._aras.newIOMItem('', '');
				var builderMethodName = this._dataRequestSettings.contentBuilderMethod;
				var byReference =
					byReferenceType === Enums.ByReferenceType.External
						? 'external'
						: 'internal';
				var itemTypeName = this._item.getAttribute('type');

				documentContent.loadAML(
					'<AML><Item action="' +
						builderMethodName +
						'" type="' +
						itemTypeName +
						'" id="' +
						blockId +
						'" language="' +
						langCode +
						'" by-reference="' +
						byReference +
						'"/></AML>'
				);

				return documentContent.applyAsync().then(
					function (responceItem) {
						if (responceItem.isError()) {
							this._aras.AlertError(responceItem.getErrorString());
						} else {
							return responceItem.getResult();
						}
					}.bind(this)
				);
			},

			_GetXmlDomByLanguage: function (langCode) {
				var newXmlDom = this._GetDocumentXmlDomFromServer(langCode);
				var oldXmlDom = this._GetDocumentXmlDomFromClient(langCode);
				var resultXml;

				if (oldXmlDom) {
					this._externalHelper.UpdateProvider(langCode, oldXmlDom);
				}

				this._externalHelper.UpdateProvider(langCode, newXmlDom);

				if (this._contentGenerationHelper) {
					this._contentGenerationHelper.updateCacheFromOrigin(
						langCode,
						newXmlDom
					);
				}

				resultXml = oldXmlDom
					? oldXmlDom.documentElement
					: newXmlDom.documentElement;
				this.saveDocumentXml(resultXml.xml, langCode, true);

				return resultXml;
			},

			_GetXmlDomByLanguageAsync: function (langCode) {
				var oldXmlDom = this._GetDocumentXmlDomFromClient(langCode);

				if (oldXmlDom) {
					this._externalHelper.UpdateProvider(langCode, oldXmlDom);
				}

				return Promise.resolve(
					this._GetDocumentXmlDomFromServerAsync(langCode)
				).then(
					function (serverXmlDom) {
						this._externalHelper.UpdateProvider(langCode, serverXmlDom);

						if (this._contentGenerationHelper) {
							this._contentGenerationHelper.updateCacheFromOrigin(
								langCode,
								serverXmlDom
							);
						}

						const resultXml = oldXmlDom
							? oldXmlDom.documentElement
							: serverXmlDom.documentElement;
						this.saveDocumentXml(resultXml.xml, langCode, true);

						return resultXml;
					}.bind(this)
				);
			},

			_ReplaceOriginFromServerIfNeed: function (langCode) {
				var newXmlDom = this._GetDocumentXmlDomFromServer(langCode);
				var newOrigin = newXmlDom.documentElement;
				var newDom;

				if (
					newOrigin.xml.length != this.origin.xml.length ||
					newOrigin.xml != this.origin.xml
				) {
					this.saveDocumentXml(newOrigin.xml, langCode, true);
					this._externalHelper.DropProvider(langCode);
					this._externalHelper.UpdateProvider(langCode, newXmlDom);

					this._contentGenerationHelper.clearCache();
					this._contentGenerationHelper.updateCacheFromOrigin(
						langCode,
						newXmlDom
					);

					newDom = this._PrepareDomByOrigin(newOrigin);
					this._multilangcache[langCode] = {
						domObject: newDom,
						xmlDomOrigin: newOrigin
					};

					this._InitializeStructureDocument(langCode);
				} else {
					this._invalidate(this._dom);
				}
			},

			_GetDocumentXmlDomFromServer: function (langCode, blockId) {
				var newDocumentXml = this.GetDocumentBlockXml(
					blockId || this._item.getAttribute('id'),
					langCode,
					Enums.ByReferenceType.Internal
				);
				var newDocumentXmlDom = new XmlDocument();

				// preserve whitespace = true IR-029141
				newDocumentXmlDom.preserveWhiteSpace = true;
				newDocumentXmlDom.loadXML(newDocumentXml);

				if (this._aras.Browser.isIe()) {
					newDocumentXmlDom.setProperty(
						'SelectionNamespaces',
						'xmlns:aras="http://aras.com/ArasTechDoc"'
					);
				} else {
					newDocumentXmlDom.documentElement.setAttribute(
						'xmlns:aras',
						'http://aras.com/ArasTechDoc'
					);
				}

				return newDocumentXmlDom;
			},

			_GetDocumentXmlDomFromServerAsync: function (langCode, blockId) {
				return Promise.resolve(
					this.GetDocumentBlockXmlAsync(
						blockId || this._item.getAttribute('id'),
						langCode,
						Enums.ByReferenceType.Internal
					)
				).then(
					function (documentXml) {
						var newDocumentXmlDom = new XmlDocument();

						// preserve whitespace = true IR-029141
						newDocumentXmlDom.preserveWhiteSpace = true;
						newDocumentXmlDom.loadXML(documentXml);

						if (this._aras.Browser.isIe()) {
							newDocumentXmlDom.setProperty(
								'SelectionNamespaces',
								'xmlns:aras="http://aras.com/ArasTechDoc"'
							);
						} else {
							newDocumentXmlDom.documentElement.setAttribute(
								'xmlns:aras',
								'http://aras.com/ArasTechDoc'
							);
						}

						return newDocumentXmlDom;
					}.bind(this)
				);
			},

			_GetDocumentXmlDomFromClient: function (langCode) {
				var thisDocumentXml = this.getSavedDocumentXml(langCode);

				if (
					thisDocumentXml &&
					this.IsEqualEditableLevel(Enums.EditLevels.IgnoreExternal)
				) {
					var thisDocumentXmlDom = new XmlDocument();

					// preserve whitespace = true IR-029141
					thisDocumentXmlDom.preserveWhiteSpace = true;
					thisDocumentXmlDom.loadXML(thisDocumentXml);

					if (dojo.isIE || this._aras.Browser.isIe()) {
						thisDocumentXmlDom.setProperty(
							'SelectionNamespaces',
							'xmlns:aras="http://aras.com/ArasTechDoc"'
						);
					} else {
						thisDocumentXmlDom.documentElement.setAttribute(
							'xmlns:aras',
							'http://aras.com/ArasTechDoc'
						);
					}

					return thisDocumentXmlDom;
				}
			},

			OriginExternalHelper: function () {
				return this._externalHelper;
			},

			OriginExternalProvider: function () {
				return this._externalHelper.GetProvider(this.CurrentLanguageCode());
			},

			ItemClassification: function () {
				return this._classification;
			},

			SwitchLanguage: function (targetLangCode) {
				if (targetLangCode !== this._currentLanguageCode) {
					this._InitializeStructureDocument(targetLangCode);
				}
			},

			Dom: function (value) {
				if (value === undefined) {
					return this._dom;
				} else {
					this._domInitializing = true;
					this.SuspendInvalidation();

					if (this._dom) {
						this._dom.unregisterDocumentElement();
					}

					this._dom = value;
					this._dom.registerDocumentElement();
					this._invalidate(this._dom);

					this.ResumeInvalidation();
					this._domInitializing = false;
				}
			},

			isDomInitializing: function () {
				return this._domInitializing;
			},

			IsEqualEditableLevel: function (levelType, targetElements) {
				const isLocked = this._aras.isEditStateEx(this._item);
				const isDefaultLanguageSelected =
					this._defaultLanguageCode === this._currentLanguageCode;

				if (!isLocked || !isDefaultLanguageSelected) {
					return false;
				} else {
					const selectedItems = targetElements
						? Array.isArray(targetElements)
							? targetElements
							: [targetElements]
						: this.GetSelectedItems();
					const isExternalBelongs = this._externalBlockHelper.isExternalBlockContains(
						selectedItems
					);
					const isDynamicBelongs =
						this._contentGenerationHelper &&
						this._contentGenerationHelper.isDynamicElementBelongs(
							selectedItems
						);

					switch (levelType) {
						case Enums.EditLevels.IgnoreExternal:
							return true;
						case Enums.EditLevels.FullAllow:
							return !isExternalBelongs && !isDynamicBelongs;
						case Enums.EditLevels.AllowExternal:
							return isExternalBelongs && !isDynamicBelongs;
						case Enums.EditLevels.FullDeny:
							return isExternalBelongs && isDynamicBelongs;
					}
				}
			},

			IsEditable: function () {
				return this.IsEqualEditableLevel(Enums.EditLevels.FullAllow);
			},

			isDocumentElement: function (targetElement) {
				return (
					targetElement &&
					typeof targetElement.Id === 'function' &&
					targetElement === this.GetElementById(targetElement.Id())
				);
			},

			isAppendAllowed: function (targetElement) {
				const isElementBelongsDynamic = targetElement.hasDynamicParent();
				const isElementBelongsExternal = targetElement.hasExternalParent();

				if (!isElementBelongsDynamic && !isElementBelongsExternal) {
					const isDocumentClassified = this.hasClassificationBindedElements();

					return (
						!isDocumentClassified ||
						!this.isRootElementContained([targetElement, targetElement.Parent])
					);
				}

				return false;
			},

			isInsertAllowed: function (targetElement) {
				const isElementDynamic =
					targetElement.isDynamic() || targetElement.hasDynamicParent();
				const isElementExternal =
					targetElement.isExternal() || targetElement.hasExternalParent();

				if (!isElementDynamic && !isElementExternal) {
					const isDocumentClassified = this.hasClassificationBindedElements();

					return (
						!isDocumentClassified || !this.isRootElementContained(targetElement)
					);
				}

				return false;
			},

			CurrentLanguageCode: function () {
				return this._currentLanguageCode;
			},

			DefaultLanguageCode: function () {
				return this._defaultLanguageCode;
			},

			Schema: function () {
				return this._xmlSchemaHelper;
			},

			ContentGeneration: function () {
				return this._contentGenerationHelper;
			},

			OptionalContent: function () {
				return this._optionalContentHelper;
			},

			ActionsHelper: function () {
				return this._actionsHelper;
			},

			Clipboard: function () {
				return this._clipboardHelper;
			},

			ExternalBlockHelper: function () {
				return this._externalBlockHelper;
			},

			_RegisterElement: function (wrappedObject) {
				var elementId = wrappedObject.Id();

				this._all[elementId] = wrappedObject;
				this._registrationCounter++;
				this.OnElementRegistered(this, { registeredObject: wrappedObject });
			},

			OnElementRegistered: function (sender, earg) {},

			_OnElementChanged: function (targetElement) {
				this._OnStructureChanged(targetElement);
			},

			_UnregisterElement: function (wrappedObject) {
				var elementId = wrappedObject.Id();

				delete this._all[elementId];
				this._registrationCounter++;
				this.OnElementUnregistered(this, { unregisteredObject: wrappedObject });
			},

			OnElementUnregistered: function (sender, earg) {},

			Cursor: function () {
				return this._cursor;
			},

			_OnCursorChanged: function (sender, earg) {
				const commonAncestor = sender && sender.commonAncestor;
				if (commonAncestor && commonAncestor.is('ArasTextXmlSchemaElement')) {
					commonAncestor.InvalidRange(sender);
				}
				this._fireInvalidationEvent();
			},

			SetSelectedItems: function (target) {
				this.selection.Set(target);
			},

			GetSelectedItems: function () {
				return this.selection.GetCurrent();
			},

			focusElement: function (targetElement, lowerestChild) {
				if (targetElement) {
					// searching for lowest targetElement child
					if (!targetElement.isDynamic() && lowerestChild) {
						var childItems = targetElement.ChildItems();

						while (childItems && childItems.length() > 0) {
							targetElement = childItems.get(0);
							childItems = targetElement.ChildItems
								? targetElement.ChildItems()
								: null;
						}
					}

					// changing selection and cursor position
					this.SetSelectedItems(targetElement);
					this._cursor.Set(targetElement, 0, targetElement, 0);
				}
			},

			_getElementEventsCache: function (elementId, createIfRequred) {
				if (createIfRequred && !this._allEventHandlers[elementId]) {
					this._allEventHandlers[elementId] = {};
				}

				return this._allEventHandlers[elementId];
			},

			GetElementById: function (id) {
				return this._all[id];
			},

			getElementByIndex: function (elementIndex) {
				if (elementIndex >= 0 && elementIndex < this._allByIndex.length) {
					return this._allByIndex[elementIndex];
				}
			},

			getElementIndex: function (targetElement) {
				var elementId =
					typeof targetElement == 'object' ? targetElement.Id() : targetElement;
				var elementIndex = elementId
					? this._allIndexHash[elementId]
					: undefined;

				return !isNaN(elementIndex) ? elementIndex : -1;
			},

			getAllElements: function () {
				return this._allByIndex.slice();
			},

			getElementsCount: function () {
				return this._allByIndex.length;
			},

			setDataRequestSetting: function (settingName, settingValue) {
				this._dataRequestSettings[settingName] = settingValue;
			},

			getDataRequestSetting: function (settingName) {
				return this._dataRequestSettings[settingName];
			},

			isRootElementContained: function (selectedItems) {
				if (Array.isArray(selectedItems)) {
					var i;

					for (i = 0; i < selectedItems.length; i++) {
						if (!selectedItems[i].Parent) {
							return true;
						}
					}

					return false;
				} else {
					return selectedItems ? !selectedItems.Parent : false;
				}
			},

			hasClassificationBindedElements: function () {
				if (this._classification) {
					var bindedXmlSchemaElements = this._xmlSchemaHelper.getXmlSchemaElements(
						this._classification
					);

					return bindedXmlSchemaElements.length > 0;
				}

				return false;
			},

			GetElementsByOrigin: function (origin) {
				var elements = [];
				var elementId;
				var schemaElement;

				for (elementId in this._all) {
					schemaElement = this._all[elementId];

					if (schemaElement.origin === origin) {
						elements.push(schemaElement);
					}
				}

				return elements;
			},

			GetElementsByUid: function (uid) {
				var elements = [];
				var elementId;
				var schemaElement;

				for (elementId in this._all) {
					schemaElement = this._all[elementId];

					if (
						schemaElement.is('XmlSchemaElement') &&
						schemaElement.Uid() === uid
					) {
						elements.push(schemaElement);
					}
				}

				return elements;
			},

			getElementIdPath: function (elementId) {
				var targetElement =
					typeof elementId == 'object' ? elementId : this._all[elementId];
				var idPath;

				if (targetElement) {
					var parentElement = targetElement.Parent;

					idPath = [targetElement.Id()];

					while (parentElement) {
						idPath.push(parentElement.Id());
						parentElement = parentElement.Parent;
					}
					idPath.reverse();
				}

				return idPath;
			},

			getElementUidPath: function (elementId) {
				var targetElement =
					typeof elementId == 'object' ? elementId : this._all[elementId];
				var uidPath;

				if (targetElement) {
					var parentElement = targetElement.Parent;

					uidPath = [targetElement.Uid()];

					while (parentElement) {
						uidPath.push(parentElement.Uid());
						parentElement = parentElement.Parent;
					}
					uidPath.reverse();
				}

				return uidPath;
			},

			getChildElementsByType: function (targetElement, childType) {
				var resultInfo = { elements: [], count: 0 };

				if (targetElement && childType) {
					var childItems = targetElement.ChildItems();
					var childsCount = childItems.length();
					var childElement;
					var blockChilds;
					var i;

					for (i = 0; i < childsCount; i++) {
						childElement = childItems.get(i);

						if (childElement.is('ArasBlockXmlSchemaElement')) {
							blockChilds = this.getChildElementsByType(
								childElement,
								childType
							);

							if (blockChilds.count) {
								resultInfo.elements.concat(blockChilds.elements);
								resultInfo.count += blockChilds.count;
							}
						} else if (childElement.nodeName == childType) {
							resultInfo.elements.push(childElement);
							resultInfo.count += 1;
						}
					}
				}

				return resultInfo;
			},

			getAllChildElementsByType: function (targetElement, resultHash) {
				if (targetElement) {
					var childItems = targetElement.ChildItems();
					var childsCount = childItems.length();
					var childElement;
					var elementName;
					var typedChilds;
					var i;

					for (i = 0; i < childsCount; i++) {
						childElement = childItems.get(i);

						if (childElement.is('ArasBlockXmlSchemaElement')) {
							resultHash = this.getAllChildElementsByType(
								childElement,
								resultHash
							);
						} else {
							elementName = childElement.nodeName;

							typedChilds = resultHash[elementName] || {
								elements: [],
								count: 0
							};
							typedChilds.elements.push(childElement);
							typedChilds.count += 1;

							resultHash[elementName] = typedChilds;
						}
					}
				}

				return resultHash;
			},

			GetElementsByReferenceId: function (referenceId) {
				var foundElements = [];
				var schemaElement;
				var elementId;

				for (elementId in this._all) {
					schemaElement = this._all[elementId];

					if (
						schemaElement.ReferenceId &&
						schemaElement.ReferenceId() === referenceId
					) {
						foundElements.push(schemaElement);
					}
				}

				return foundElements;
			},

			GetAncestorOrSelfInteractiveElement: function (targetElement) {
				if (targetElement.is('XmlSchemaText')) {
					return this.GetAncestorOrSelfInteractiveElement(targetElement.Parent);
				} else if (targetElement.is('XmlSchemaElement')) {
					var elementType = this.Schema().GetSchemaElementType(targetElement);

					if (
						(elementType & Enums.XmlSchemaElementType.InteractiveElement) !==
						0
					) {
						return targetElement;
					} else {
						return this.GetAncestorOrSelfInteractiveElement(
							targetElement.Parent
						);
					}
				}
			},

			GetAncestorOrSelfElement: function (targetElement) {
				return targetElement.is('XmlSchemaElement')
					? targetElement
					: this.GetAncestorOrSelfElement(targetElement.Parent);
			},

			GetNotMixedAncestorOrSelfElement: function (targetElement) {
				if (targetElement.is('XmlSchemaElement')) {
					if (
						!targetElement.Parent ||
						this._xmlSchemaHelper.IsContentMixed(targetElement.Parent) === false
					) {
						// test that current wrappedObject is not part of mixed content, but it can have inner mixed content
						return targetElement;
					}
				}

				return this.GetNotMixedAncestorOrSelfElement(targetElement.Parent);
			},

			CreateElement: function (type, args) {
				var ctorOptions = args || {};
				var nodeType;
				var createdElement;

				ctorOptions.ownerDocument = this;

				if (type === 'element') {
					ctorOptions.origin =
						ctorOptions.origin ||
						this._contentGenerationHelper.ConstructElementOrigin(args.type);
					if (!ctorOptions.origin) {
						return null;
					}

					nodeType = this.Schema().GetSchemaElementType(
						ctorOptions.origin.nodeName
					);

					if (
						(nodeType & Enums.XmlSchemaElementType.Block) ==
						Enums.XmlSchemaElementType.Block
					) {
						createdElement = new ArasBlockXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.Text) ==
						Enums.XmlSchemaElementType.Text
					) {
						createdElement = new ArasTextXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.ListItem) ==
						Enums.XmlSchemaElementType.ListItem
					) {
						createdElement = new ArasListItemXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.List) ==
						Enums.XmlSchemaElementType.List
					) {
						createdElement = new ArasListXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.Image) ==
						Enums.XmlSchemaElementType.Image
					) {
						createdElement = new ArasImageXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.Item) ==
						Enums.XmlSchemaElementType.Item
					) {
						createdElement = new ArasItemXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.Table) ==
						Enums.XmlSchemaElementType.Table
					) {
						createdElement = new ArasTableXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.TableRow) ==
						Enums.XmlSchemaElementType.TableRow
					) {
						createdElement = new ArasRowXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.TableCell) ==
						Enums.XmlSchemaElementType.TableCell
					) {
						createdElement = new ArasCellXmlSchemaElement(ctorOptions);
					} else if (
						(nodeType & Enums.XmlSchemaElementType.ItemProperty) ==
						Enums.XmlSchemaElementType.ItemProperty
					) {
						createdElement = new ArasItemPropertyXmlSchemaElement(ctorOptions);
					} else {
						createdElement = new XmlSchemaElement(ctorOptions);
					}

					//we need to create textnode manually for editable types
					if (
						(nodeType &
							(Enums.XmlSchemaElementType.Text |
								Enums.XmlSchemaElementType.String)) !==
							0 &&
						!createdElement.ChildItems().length()
					) {
						createdElement.origin.text = '';
					}
				} else if (type === 'text') {
					ctorOptions.origin =
						ctorOptions.origin || this.origin.ownerDocument.createTextNode('');
					createdElement = new XmlSchemaText(ctorOptions);
				}

				createdElement.parseOrigin();

				return createdElement;
			},

			_OnStructureChanged: function (sender) {
				var origin = sender.origin;
				var referencedElements = this.GetElementsByOrigin(origin);
				var referencedElement;
				var i;

				this.SuspendInvalidation();
				for (i = 0; i < referencedElements.length; i++) {
					referencedElement = referencedElements[i];

					if (referencedElement !== sender) {
						referencedElement.parseOrigin();
					}

					this._invalidate(referencedElement);
				}
				this.ResumeInvalidation();
			},

			_invalidate: function (element) {
				if (this._invalidationList.indexOf(element) == -1) {
					this._invalidationList.push(element);
				}

				this._fireInvalidationEvent();
			},

			isInvalidating: function () {
				return this._isInvalidating;
			},

			_fireInvalidationEvent: function () {
				if (!this._invalidationSuspended.length && !this._isInvalidating) {
					this._isInvalidating = true;

					this.OnInvalidate(this, {
						invalidationList: this._invalidationList,
						cursor: this.Cursor(),
						selection: this.selection
					});
					this._refreshIndexes();
					this._invalidationList.length = 0;

					if (this.selectionChangeEventSuspended) {
						this.fireSelectionChangeEvent();
					}

					this._isInvalidating = false;
				}
			},

			fireSelectionChangeEvent: function () {
				if (!this._invalidationSuspended.length) {
					this.onSelectionChanged(this, this.selection.GetCurrent());
					this.selectionChangeEventSuspended = false;
				} else {
					this.selectionChangeEventSuspended = true;
				}
			},

			SuspendInvalidation: function () {
				this._invalidationSuspended.push(true);
			},

			ResumeInvalidation: function () {
				this._invalidationSuspended.pop();
				this._fireInvalidationEvent();
			},

			OnInvalidate: function (sender, earg) {},

			OnClassificationChanged: function () {},

			onSelectionChanged: function (sender, selectedItems) {},

			findElementByUidPath: function (uidPath) {
				if (uidPath && uidPath.length) {
					var elementsUidHash = {};
					var schemaElement;
					var id;
					var elementUid;
					var pathPart;
					var returnCandidates;
					var currentAncestors;
					var nextAncestors;
					var currentElement;
					var parentElement;
					var i;
					var j;

					for (id in this._all) {
						schemaElement = this._all[id];

						if (schemaElement.is('XmlSchemaElement')) {
							elementUid = schemaElement.Uid();

							elementsUidHash[elementUid] = elementsUidHash[elementUid] || [];
							elementsUidHash[elementUid].push({
								index: elementsUidHash[elementUid].length,
								element: schemaElement
							});
						}
					}

					returnCandidates = elementsUidHash[uidPath[uidPath.length - 1]];
					if (returnCandidates) {
						currentAncestors = returnCandidates.slice();

						for (i = uidPath.length - 2; i >= 0; i--) {
							pathPart = uidPath[i];
							nextAncestors = [];

							for (j = 0; j < currentAncestors.length; j++) {
								currentElement = currentAncestors[j];
								parentElement = currentElement.element.Parent;

								if (parentElement && parentElement.Uid() == pathPart) {
									nextAncestors.push({
										index: currentElement.index,
										element: parentElement
									});
								}
							}

							currentAncestors = nextAncestors;
						}

						return currentAncestors.length == 1
							? returnCandidates[currentAncestors[0].index].element
							: undefined;
					}
				}
			},

			getSavedDocumentXml: function (languageCode) {
				var foundDocumentXml = this._savedDocumentXml[languageCode];

				if (!foundDocumentXml) {
					foundDocumentXml = this._aras.getItemTranslation(
						this._item,
						'document_xml',
						languageCode
					);

					if (foundDocumentXml) {
						this.saveDocumentXml(foundDocumentXml, languageCode, true);
					}
				}

				return foundDocumentXml;
			},

			saveDocumentXml: function (
				documentXml,
				languageCode,
				skipPropertyUpdate
			) {
				var prevDocumentXml = this._savedDocumentXml[languageCode];

				if (documentXml && prevDocumentXml) {
					if (
						prevDocumentXml.length != documentXml.length ||
						prevDocumentXml !== documentXml
					) {
						if (!skipPropertyUpdate) {
							this._aras.setItemTranslation(
								this._item,
								'document_xml',
								documentXml,
								languageCode
							);
						}

						this._savedDocumentXml[languageCode] = documentXml;
					}
				} else {
					this._savedDocumentXml[languageCode] = documentXml;
				}
			},

			getDocumentItem: function () {
				return this._item;
			},

			getStatePromise: function (stateName) {
				return this._statePromises[stateName] || Promise.resolve();
			},

			setStatePromise: function (stateName, statePromise) {
				if (stateName) {
					this._statePromises[stateName] = statePromise;
				}
			},

			getDocumentProperty: function (propertyName) {
				return propertyName
					? this._aras.getItemProperty(this._item, propertyName)
					: '';
			},

			getAdditionalSetting: function (settingName) {
				return this._additionalSettings[settingName];
			},

			setAdditionalSetting: function (settingName, settingValue) {
				if (settingName) {
					this._additionalSettings[settingName] = settingValue;
				}
			},

			removeGeneratedContentNode: function (documentXml) {
				const generatedContentNodeXPath = 'aras:document/aras:generatedContent';

				const xmlDoc = new XmlDocument();
				xmlDoc.preserveWhiteSpace = true;
				xmlDoc.loadXML(documentXml);
				xmlDoc.documentElement.setAttribute(
					'xmlns:aras',
					'http://aras.com/ArasTechDoc'
				);
				const generatedContentNode = xmlDoc.selectSingleNode(
					generatedContentNodeXPath
				);

				if (generatedContentNode) {
					generatedContentNode.parentNode.removeChild(generatedContentNode);
				}

				return xmlDoc.xml || '';
			}
		}
	);
});
