define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/StructuredDocument',
	'RE/Scripts/Classes/Helper/ActionsHelper',
	'RE/Scripts/Classes/Helper/OptionalContentHelper',
	'RE/Scripts/Classes/Helper/QueueChanges',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/TableHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/ViewModelSelection',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalContentHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/Clipboard',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasBlockXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTextXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListItemXmlSchemaElement',
	'RE/Scripts/Model/Aras/ArasTableXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasRowXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasCellXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasImageXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasItemXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaText',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/XmlSchemaHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalBlockHelper',
	'RE/Scripts/Classes/Helper/ContentGenerationHelper',
],
function(declare, TechDocStructuredDocument, ActionsHelper, OptionalContentHelper, QueueChanges,
	TableHelper, ViewModelSelection, ExternalContentHelper, Clipboard, Enums,
	ArasBlockXmlSchemaElement, ArasTextXmlSchemaElement, ArasListXmlSchemaElement,
	ArasListItemXmlSchemaElement, ArasTableXmlSchemaElement, ArasRowXmlSchemaElement,
	ArasCellXmlSchemaElement, ArasImageXmlSchemaElement, ArasItemXmlSchemaElement,
	XmlSchemaElement, XmlSchemaText, XmlSchemaHelper, ExternalBlockHelper, ContentGenerationHelper) {
	return declare('Aras.Client.Controls.RE.Model.RequirementStructuredDocument', [TechDocStructuredDocument], {
		isTreeUpdatedCompletely: false,
		_isEditMode: null,
		immutableList: {
			'Requirement-Info': true,
			'Requirement-Title': true,
			'Requirement-Number': true,
			'Requirement-Chapter': true
		},
		constructor: function(inputArguments) {
			const immutableListfromArgs = inputArguments.immutableList;
			if (immutableListfromArgs) {
				this.immutableList = immutableListfromArgs;
			}
		},

		postCreate: function(inputArguments) {
			this._isEditMode = inputArguments.isEditMode;
			this._queueChanges = new QueueChanges({viewmodel: this});
			this._externalBlockHelper = new ExternalBlockHelper({viewmodel: this});
			this.tableHelper = new TableHelper({viewmodel: this});
			this.selection = new ViewModelSelection({viewmodel: this});
			this._externalHelper = new ExternalContentHelper({viewmodel: this});
			//init optional content helper before element parsing, because helper should attach on OnRegistered and OnUnregistered events
			this._optionalContentHelper = new OptionalContentHelper({viewmodel: this, display: Enums.DisplayType.Inactive});
			this._clipboardHelper = new Clipboard({aras: this._aras});
			this._actionsHelper = new ActionsHelper({viewmodel: this, clipboard: this._clipboardHelper, aras: this._aras});

			this._InitializeStructureDocument(this._defaultLanguageCode);

			if (this.IsEditable()) {
				this._queueChanges.startTrackingChanges();
				this._queueChanges.dropChangesQueue();
			}
			this._currentLanguageCode = inputArguments.defaultLanguageCode;
		},

		GetDocumentBlockXml: function(itemId, langCode, byReferenceType) {
			var documentContent = this._aras.newIOMItem('re_Requirement', 're_GetRequirementContent');
			documentContent.setID(itemId);
			documentContent.setAttribute('language', langCode);
			documentContent = documentContent.apply();

			if (documentContent.isError()) {
				this._aras.AlertError(documentContent.getErrorString());
				return;
			}
			return documentContent.getResult();
		},

		Reload: function(newItem, optionalParameters) {
			optionalParameters = optionalParameters || {};
			this._isEditMode = optionalParameters.isEditMode;

			this._dropDocumentXml();
			this.inherited(arguments);

			this._updateTitleAndNumberElement(this._item);

			if (optionalParameters.forceInvalidate) {
				this._invalidate(this._dom);
			}
		},

		_dropDocumentXml: function() {
			this._aras.removeItemTranslation(this._item, 'document_xml', this._currentLanguageCode);
		},

		GetRequirementTitle: function() {
			return this.getDocumentProperty('req_title');
		},

		GetActiveRequirementId: function() {
			return this.getDocumentProperty('id');
		},

		_ResetSelectionAndCursor: function() {
			this.selection.Reset();
			this._initCursor();
		},

		IsEqualEditableLevel: function() {
			if (this._isEditMode) {
				const selectedItems = this.selection.GetCurrent();
				const isSelectionImmutable = selectedItems.some(function(schemaElement) {
					return this.isImmutableElement(schemaElement);
				}.bind(this));

				return !isSelectionImmutable;
			}

			return false;
		},

		ExternalBlockHelper: function() {
			return this._externalBlockHelper;
		},

		CreateElement: function(type, args) {
			var ctorOptions = args || {};
			var nodeType;
			var createdElement;

			ctorOptions.ownerDocument = this;

			if (type === 'element') {
				ctorOptions.origin = ctorOptions.origin || this._contentGenerationHelper.ConstructElementOrigin(args.type);
				if (!ctorOptions.origin) {
					return null;
				}

				nodeType = this.Schema().GetSchemaElementType(ctorOptions.origin.nodeName);

				if ((nodeType & Enums.XmlSchemaElementType.Block) == Enums.XmlSchemaElementType.Block) {
					createdElement = new ArasBlockXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.Text) == Enums.XmlSchemaElementType.Text) {
					createdElement = new ArasTextXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.ListItem) == Enums.XmlSchemaElementType.ListItem) {
					createdElement = new ArasListItemXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.List) == Enums.XmlSchemaElementType.List) {
					createdElement = new ArasListXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.Image) == Enums.XmlSchemaElementType.Image) {
					createdElement = new ArasImageXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.Item) == Enums.XmlSchemaElementType.Item) {
					createdElement = new ArasItemXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.Table) == Enums.XmlSchemaElementType.Table) {
					createdElement = new ArasTableXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.TableRow) == Enums.XmlSchemaElementType.TableRow) {
					createdElement = new ArasRowXmlSchemaElement(ctorOptions);
				} else if ((nodeType & Enums.XmlSchemaElementType.TableCell) == Enums.XmlSchemaElementType.TableCell) {
					createdElement = new ArasCellXmlSchemaElement(ctorOptions);
				} else {
					createdElement = new XmlSchemaElement(ctorOptions);
				}

				//we need to create textnode manually for editable types
				if ((nodeType & (Enums.XmlSchemaElementType.Text | Enums.XmlSchemaElementType.String)) !== 0 && !createdElement.ChildItems().length()) {
					createdElement.origin.text = '';
				}
			} else if (type === 'text') {
				ctorOptions.origin = ctorOptions.origin || this.origin.ownerDocument.createTextNode('');
				createdElement = new XmlSchemaText(ctorOptions);
			}

			createdElement.parseOrigin();

			return createdElement;
		},

		_InitializeXmlSchema: function() {
			if (!this._xmlSchemaHelper) {
				var schemaId = this.getDocumentProperty('req_document_type');
				var xmlSchemaItem = this._aras.newIOMItem('tp_XmlSchema', 'get');
				xmlSchemaItem.setAttribute('select', 'name,content,target_namespace');
				xmlSchemaItem.setID(schemaId);

				var schemaElementItem = this._aras.newIOMItem('tp_XmlSchemaElement', 'get');
				schemaElementItem.setAttribute('select', 'name,renderer(method_code),content_generator, is_content_dynamic,default_classification');

				var schemaOutputSetting = this._aras.newIOMItem('tp_XmlSchemaOutputSetting', 'get');
				schemaOutputSetting.setAttribute('select', 'target_classification,stylesheet_id(name,style_content,parent_stylesheet)');
				schemaOutputSetting.setProperty('classification', 'Editor');

				xmlSchemaItem.addRelationship(schemaElementItem);
				xmlSchemaItem.addRelationship(schemaOutputSetting);

				xmlSchemaItem = xmlSchemaItem.apply();

				if (!xmlSchemaItem.isError()) {
					this._xmlSchemaHelper = new XmlSchemaHelper({aras: this._aras, dom: this.origin.ownerDocument, schemaItem: xmlSchemaItem});

					this._contentGenerationHelper = new ContentGenerationHelper({
						viewmodel: this,
						aras: this._aras,
						contentGenerators: this._xmlSchemaHelper._contentGenerators
					});
					this._contentGenerationHelper.updateCacheFromOrigin(this._currentLanguageCode, this.origin);
				} else {
					this._aras.AlertError(xmlSchemaItem.getErrorString());
				}
			}
		},

		getLastElement: function() {
			var titleNode = this.Dom().origin.firstChild;
			var childs = titleNode.childNodes;
			var lastOrigin = childs.length != 0 ? childs[childs.length - 1] : titleNode;
			return this.GetElementsByOrigin(lastOrigin)[0];
		},

		getRootNodeUid: function() {
			var titleNodeOrigin = this.Dom().origin.firstChild;
			return this.GetElementsByOrigin(titleNodeOrigin)[0].Uid();
		},

		_ReplaceOriginFromServerIfNeed: function(langCode, forceUpdate) {
			const newXmlDom = this._GetDocumentXmlDomFromServer(langCode);
			const newOrigin = newXmlDom.documentElement;
			if (forceUpdate || (newOrigin.xml.length != this.origin.xml.length || newOrigin.xml != this.origin.xml)) {
				this.isTreeUpdatedCompletely = true;
				this.saveDocumentXml(newOrigin.xml, langCode, true);
				this._externalHelper.DropProvider(langCode);
				this._externalHelper.UpdateProvider(langCode, newXmlDom);

				this._contentGenerationHelper.clearCache();
				this._contentGenerationHelper.updateCacheFromOrigin(langCode, newXmlDom);

				this.origin = null;
				this._multilangcache[langCode] = null;

				const newDom = this._PrepareDomByOrigin(newOrigin);
				this._multilangcache[langCode] = {domObject: newDom, xmlDomOrigin: newOrigin};

				this._InitializeStructureDocument(langCode);
			}

			setTimeout(function() {
				this.isTreeUpdatedCompletely = false;
			}.bind(this));
		},

		_updateTitleAndNumberElement: function(reqItem) {
			const titleNode = reqItem.selectSingleNode('req_title');
			if (titleNode) {
				const reqId = reqItem.selectSingleNode('config_id').text;
				const titleOrigin = this.Dom().origin.selectSingleNode(
					'*[@reqId="' + reqId + '"]/*[local-name()=\"Requirement-Info\"]/*[local-name()=\"Requirement-Title\"]');
				const titleElement = this.GetElementsByOrigin(titleOrigin)[0];
				if (titleElement.GetTextAsString() !== titleNode.text) {
					const titleEmphObj = titleElement.getEmphObjectByIndex(0);
					const emphId = titleEmphObj.Id();
					titleElement.selection.From(emphId, 0);
					titleElement.selection.To(emphId, titleEmphObj.Text().length);
					titleElement.InsertText(titleNode.text);
					titleElement.parseOrigin();
				}
			}
		},

		OnInvalidate: function(sender, earg) {
			this.inherited(arguments);
			if (this.IsEditable()) {
				const invalidationList = earg.invalidationList;
				const element = invalidationList[0];
				if (element && this.isImmutableElement(element) && element.is('Requirement-Title')) {
					this._aras.setItemProperty(this._item, 'req_title', element.origin.firstChild.text);
				}
			}
		},

		isImmutableElement: function(element) {
			return this.immutableList[element.nodeName];
		}
	});
});
