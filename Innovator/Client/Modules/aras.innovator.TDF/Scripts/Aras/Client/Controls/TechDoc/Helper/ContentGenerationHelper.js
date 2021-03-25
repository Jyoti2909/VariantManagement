define([
	'dojo/_base/declare',
	'dojo/aspect',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, aspect, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.Helper.ContentGenerationHelper',
		null,
		{
			aras: null,
			viewmodel: null,
			_contentGenerators: null,

			constructor: function (args) {
				var viewModel = args && args.viewmodel;

				if (viewModel) {
					this.aras = args.aras;
					this.viewmodel = viewModel;
					this._contentGenerators = viewModel.Schema().getContentGenerators();
					this._dynamicContentCache = {};

					aspect.before(
						viewModel,
						'OnInvalidate',
						this.onViewModelInvalidate.bind(this)
					);
				} else {
					this.aras.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'helper.no_viewmodel'
						)
					);
				}
			},

			onViewModelInvalidate: function (sender, earg) {
				var invalidationList = earg.invalidationList || [];

				if (!this.viewmodel.isDomInitializing() && invalidationList.length) {
					var dynamicElements = [];
					var elementsIdHash = {};
					var schemaElement;
					var parentElement;
					var isParentInvalidated;
					var i;

					for (i = 0; i < invalidationList.length; i++) {
						elementsIdHash[invalidationList[i].Id()] = true;
					}

					for (i = 0; i < invalidationList.length; i++) {
						schemaElement = invalidationList[i];
						isParentInvalidated = false;

						// check that one of parents also updated
						parentElement = schemaElement.Parent;
						while (parentElement) {
							if (elementsIdHash[parentElement.Id()]) {
								isParentInvalidated = true;
								break;
							}

							parentElement = parentElement.Parent;
						}

						if (!isParentInvalidated) {
							this.searchDynamicElements(schemaElement, dynamicElements);
						}
					}

					this.refreshDynamicContent(dynamicElements);
				}
			},

			hasContentGenerator: function (elementName) {
				return Boolean(this._contentGenerators[elementName]);
			},

			sendContentGenerationRequest: function (actionName, requestProperties) {
				if (actionName && requestProperties) {
					var documentItem = this.viewmodel.getDocumentItem();
					var methodItem = this.aras.newIOMItem(
						'Method',
						'tp_GenerateElementContent'
					);
					var schemaId = this.aras.getItemProperty(documentItem, 'xml_schema');
					var currentLanguage = this.viewmodel.CurrentLanguageCode();
					var propertyNames = Object.getOwnPropertyNames(requestProperties);
					var propertyName;
					var i;

					methodItem.setProperty('generationAction', actionName);
					methodItem.setProperty('xml_schema', schemaId);
					methodItem.setProperty('language_code', currentLanguage);
					//Added to enable access to Document Id
					methodItem.setProperty(
						'document_id',
						this.viewmodel.getDocumentProperty('id')
					);
					methodItem.setProperty(
						'documentItemType',
						documentItem.getAttribute('type')
					);

					// Needed for generators, that require whole document content
					methodItem.setProperty(
						'contentBuilderMethod',
						this.viewmodel.getDataRequestSetting('contentBuilderMethod')
					);

					for (i = 0; i < propertyNames.length; i++) {
						propertyName = propertyNames[i];
						methodItem.setProperty(
							propertyName,
							requestProperties[propertyName]
						);
					}

					methodItem = methodItem.apply();

					if (!methodItem.isError()) {
						var resultString = methodItem.getResult();
						var resultXml = new XmlDocument();

						if (this.aras.Browser.isIe()) {
							resultXml.setProperty(
								'SelectionNamespaces',
								'xmlns:aras="http://aras.com/ArasTechDoc"'
							);
						}

						if (resultXml.loadXML(resultString)) {
							var contentNode = resultXml.selectSingleNode(
								'aras:document/aras:content'
							);
							var referencesNode = resultXml.selectSingleNode(
								'aras:document/aras:references'
							);
							var generatedContentNode = resultXml.selectSingleNode(
								'aras:document/aras:generatedContent'
							);

							this.viewmodel.OriginExternalProvider().Update(referencesNode);

							// if there is information about dynamic content, then update dynamic content cache
							if (
								generatedContentNode &&
								generatedContentNode.hasChildNodes()
							) {
								var contentCache = this.getContentCache(
									this.viewmodel.CurrentLanguageCode()
								);
								var childNode;
								var nodeUid;

								generatedContentNode = this.viewmodel.origin.ownerDocument.importNode(
									generatedContentNode,
									true
								);

								for (i = 0; i < generatedContentNode.childNodes.length; i++) {
									childNode = generatedContentNode.childNodes[i];
									nodeUid = childNode.getAttribute('aras:id');

									contentCache[nodeUid] = childNode;
								}
							}

							return contentNode;
						}
					} else {
						this.aras.AlertError(methodItem.getErrorString());
					}
				}
			},

			ConstructElementOrigin: function (elementName) {
				return this.hasContentGenerator(elementName)
					? this.ConstructCustomOrigin(elementName)
					: this.ConstructDefaultOrigin(elementName);
			},

			ConstructCustomOrigin: function (elementName) {
				if (elementName) {
					var generatedContent = this.sendContentGenerationRequest('new', {
						element_name: elementName
					});

					return generatedContent && generatedContent.firstChild;
				}
			},

			ConstructDefaultOrigin: function (elementName) {
				var schemaHelper = this.viewmodel.Schema();
				var originDocument = this.viewmodel.origin.ownerDocument;
				var namespaceURI = schemaHelper.lookupNamespace(
					elementName.indexOf('aras:') === 0 ? 'aras' : ''
				);
				var originNode = originDocument.createNode(
					1,
					elementName,
					namespaceURI
				);
				var defaultAttributes = schemaHelper.getDefaultAttributes(elementName);
				var elementAttribute;
				var i;

				// setting default element attributes
				for (i = 0; i < defaultAttributes.length; i++) {
					elementAttribute = defaultAttributes[i];

					originNode.setAttribute(
						elementAttribute.Name,
						elementAttribute.Default || elementAttribute.Fixed
					);
				}

				//IsContentMixed
				// IR-029276 "Orio: insert #text automaticaly" for Mixed Elements
				if (schemaHelper.IsContentMixed(elementName)) {
					originNode.appendChild(originDocument.createTextNode(''));
				} else {
					var expectedChilds = schemaHelper.GetSchemaExpectedElementChilds(
						elementName
					);
					var childDescriptor;
					var j;

					for (i = 0; i < expectedChilds.length; i++) {
						childDescriptor = expectedChilds[i];

						if (childDescriptor.minOccurs) {
							for (j = 0; j < childDescriptor.minOccurs; j++) {
								originNode.appendChild(
									this.ConstructElementOrigin(childDescriptor.name)
								);
							}
						}
					}
				}

				return originNode;
			},

			searchDynamicElements: function (targetElement, foundElements) {
				var allChildElements = targetElement.is('XmlSchemaElement')
					? targetElement.getAllChilds()
					: [targetElement];
				var contentGenerator;
				var childElement;
				var i;

				foundElements = foundElements || [];

				for (i = 0; i < allChildElements.length; i++) {
					childElement = allChildElements[i];
					contentGenerator = this._contentGenerators[childElement.nodeName];

					if (contentGenerator && contentGenerator.isDynamic) {
						foundElements.push(childElement);
					}
				}

				return foundElements;
			},

			refreshStaticContent: function (/*Object*/ targetElement) {
				if (targetElement) {
					var childNodes = targetElement.getAllChilds();
					var referenceNodeXmls = [];
					var clonedNode;
					var i;

					for (i = 0; i < childNodes.length; i++) {
						currentChild = childNodes[i];

						if (
							currentChild.is('XmlSchemaExternalElement') &&
							!currentChild.isEmpty()
						) {
							clonedNode = currentChild.OriginExternal().cloneNode(true);
							referenceNodeXmls.push(clonedNode.xml);
						}
					}

					clonedNode = targetElement.Origin().cloneNode(true);
					updatedNode = this.sendContentGenerationRequest('static', {
						element_node: clonedNode.xml,
						reference_nodes: JSON.stringify(referenceNodeXmls)
					});

					// after that just force dynamic elements invalidation
					if (updatedNode) {
						var currentOrigin = targetElement.origin;
						var newOrigin = this.viewmodel.origin.ownerDocument.importNode(
							updatedNode.firstChild.cloneNode(true),
							true
						);

						currentOrigin.parentNode.replaceChild(newOrigin, currentOrigin);
						targetElement.origin = newOrigin;
						targetElement.parseOrigin();
					}
				}
			},

			refreshDynamicContent: function (/*Object|Array*/ targetElements) {
				if (targetElements && targetElements.length) {
					var elementNodeXmls = [];
					var referenceNodeXmls = [];
					var generatedContent;
					var currentElement;
					var clonedNode;
					var i;

					for (i = 0; i < targetElements.length; i++) {
						currentElement = targetElements[i];
						clonedNode = currentElement.Origin().cloneNode(false);
						elementNodeXmls.push(clonedNode.xml);

						if (
							currentElement.is('XmlSchemaExternalElement') &&
							(!currentElement.isEmpty() || currentElement.isBlocked())
						) {
							clonedNode = currentElement.OriginExternal().cloneNode(true);
							referenceNodeXmls.push(clonedNode.xml);
						}
					}

					// in this case request will update dynamic content cache
					this.sendContentGenerationRequest('dynamic', {
						element_nodes: JSON.stringify(elementNodeXmls),
						reference_nodes: JSON.stringify(referenceNodeXmls)
					});

					// after that just force dynamic elements invalidation
					for (i = 0; i < targetElements.length; i++) {
						targetElements[i].parseOrigin();
					}
				}
			},

			updateCacheFromOrigin: function (languageCode, originDocument) {
				if (languageCode && originDocument) {
					var rootElement =
						originDocument.nodeType === Node.DOCUMENT_NODE
							? originDocument.documentElement
							: originDocument;
					var generatedContentRoot =
						rootElement &&
						rootElement.selectSingleNode('./aras:generatedContent');

					if (generatedContentRoot) {
						var contentCache = this.getContentCache(languageCode);
						var contentNode;
						var nodeUid;
						var i;

						for (i = 0; i < generatedContentRoot.childNodes.length; i++) {
							childNode = generatedContentRoot.childNodes[i];

							nodeUid = childNode.getAttribute('aras:id');
							contentCache[nodeUid] = childNode;
						}
					}
				}
			},

			getContentCache: function (languageCode) {
				var contentCache = this._dynamicContentCache[languageCode];

				if (!contentCache) {
					contentCache = {};
					this._dynamicContentCache[languageCode] = contentCache;
				}

				return contentCache;
			},

			getElementContentType: function (targetElement) {
				var contentGenerator = this._contentGenerators[targetElement.nodeName];

				if (contentGenerator) {
					return contentGenerator.isDynamic
						? Enums.ElementContentType.Dynamic
						: Enums.ElementContentType.Static;
				} else {
					return Enums.ElementContentType.Common;
				}
			},

			getDynamicContent: function (targetElement) {
				var elementUid =
					typeof targetElement == 'string'
						? targetElement
						: targetElement.Uid();
				var contentCache = this.getContentCache(
					this.viewmodel.CurrentLanguageCode()
				);

				return contentCache[elementUid];
			},

			isDynamicElementBelongs: function (targetElements) {
				var currentElement;
				var i;

				for (i = 0, count = targetElements.length; i < count; i++) {
					currentElement = targetElements[i];

					if (
						currentElement.is('XmlSchemaElement') &&
						currentElement.hasDynamicParent()
					) {
						return true;
					}
				}

				return false;
			},

			clearCache: function () {
				this._dynamicContentCache = {};
			}
		}
	);
});
