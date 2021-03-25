define([
	'dojo/_base/declare',
	'dojo/query',
	'dojo/request/xhr',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, query, xhr, Enums) {
	return declare('Aras.Client.Controls.TechDoc.Helper.XmlSchemaHelper', null, {
		_schemaContent: null,
		_schemaItem: null,
		_dom: null,
		_aras: null,
		_xmlSchemaElements: {},
		_schemaElementInfoCache: {},
		_expectedElementsCache: {},
		_tryCandidateByNameCache: {},
		_editorSettings: null,

		constructor: function (args) {
			var xmlSchemaItem = args && args.schemaItem;

			this._aras = args.aras;

			if (xmlSchemaItem) {
				var itemsCount;
				var currentItem;
				var i;

				// base properties initialization
				this._dom = args.dom;
				this._schemaItem = xmlSchemaItem;
				this._schemaContent = xmlSchemaItem.getProperty('content');

				// schemaElement and contentGenerators initialization
				var foundItems = xmlSchemaItem.getItemsByXPath(
					'./Relationships/Item[@type="tp_XmlSchemaElement"]'
				);

				if (foundItems) {
					var schemaElementName;
					var customRendererItem;
					var contentGeneratorItem;
					var defaultClassification;

					itemsCount = foundItems.getItemCount();
					for (i = 0; i < itemsCount; i++) {
						currentItem = foundItems.getItemByIndex(i);
						schemaElementName = currentItem.getProperty('name');
						customRendererItem = currentItem.getPropertyItem('renderer');
						contentGeneratorItem = currentItem.getPropertyItem(
							'content_generator'
						);
						defaultClassification = currentItem.getProperty(
							'default_classification'
						);

						this._xmlSchemaElements[schemaElementName] = {
							elementName: schemaElementName,
							renderer: {
								item: customRendererItem,
								code:
									customRendererItem &&
									customRendererItem.getProperty('method_code')
							},
							contentGenerator: {
								item: contentGeneratorItem,
								id:
									contentGeneratorItem &&
									contentGeneratorItem.getProperty('id'),
								isDynamic: currentItem.getProperty('is_content_dynamic') == '1'
							},
							defaultClassification: defaultClassification,
							editorParameters: JSON.parse(
								currentItem.getProperty('editor_parameters') || '{}'
							)
						};
					}
				}

				// schemaSettings initialization
				this._editorSettings = this._getEditorSettingsByXmlSchemaItem(
					xmlSchemaItem
				);

				this.loadSchemaElementsInfo();
			} else {
				this._aras.AlertError(
					this._aras.getResource(
						'../Modules/aras.innovator.TDF',
						'helper.no_schemaitem'
					)
				);
			}
		},

		getSchemaItem: function () {
			return this._schemaItem;
		},

		getContentGenerators: function () {
			var contentGeneratorsHash = {};
			var schemaElementName;
			var xmlSchemaElement;

			for (schemaElementName in this._xmlSchemaElements) {
				xmlSchemaElement = this._xmlSchemaElements[schemaElementName];

				if (xmlSchemaElement.contentGenerator.id) {
					contentGeneratorsHash[schemaElementName] = {
						id: xmlSchemaElement.contentGenerator.id,
						isDynamic: xmlSchemaElement.contentGenerator.isDynamic
					};
				}
			}

			return contentGeneratorsHash;
		},

		getXmlSchemaElement: function (schemaElementName) {
			return this._xmlSchemaElements[schemaElementName];
		},

		getXmlSchemaElements: function (classificationFilter) {
			var foundElements = [];
			var currentXmlSchemaElement;
			var elementName;

			for (elementName in this._xmlSchemaElements) {
				currentXmlSchemaElement = this._xmlSchemaElements[elementName];

				if (
					!classificationFilter ||
					currentXmlSchemaElement.defaultClassification === classificationFilter
				) {
					foundElements.push(currentXmlSchemaElement);
				}
			}

			return foundElements;
		},

		getEditorSettings: function () {
			return this._editorSettings;
		},

		loadSchemaElementsInfo: function () {
			var nodeTypes = this.postSchemaHelperRequest({
				action: 'GetSchemaElementsInfo',
				defaultSchemaXml: this._schemaContent
			});

			if (nodeTypes) {
				this._schemaElementInfoCache = nodeTypes;
			}
		},

		validateSchemaElement: function (schemaElement, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (schemaElement) {
				const clonedOrigin = schemaElement.origin.cloneNode(
					Boolean(optionalParameters.validateChildren)
				);
				const allXmlNodes = clonedOrigin.selectNodes('./descendant-or-self::*');

				if (!clonedOrigin.getAttribute('xmlns:aras')) {
					clonedOrigin.setAttribute(
						'xmlns:aras',
						'http://aras.com/ArasTechDoc'
					);
				}

				// cut aras:id attribute, which is not a part of schemaset
				for (let i = 0; i < allXmlNodes.length; i++) {
					allXmlNodes[i].removeAttribute('aras:id');
				}

				return this.postSchemaHelperRequest({
					action: 'ValidateSchemaElementXml',
					defaultSchemaXml: this._schemaContent,
					schemaElementXml: clonedOrigin.xml
				});
			}
		},

		getSchemaElementInfo: function (element) {
			var nodeName = typeof element == 'string' ? element : element.nodeName;

			return this._schemaElementInfoCache[nodeName];
		},

		GetSchemaElementType: function (element) {
			var cachedInfo = this.getSchemaElementInfo(element);

			return cachedInfo && cachedInfo.schemaType;
		},

		GetSchemaElementAttributes: function (element) {
			var cachedInfo = this.getSchemaElementInfo(element);

			return cachedInfo && cachedInfo.elementAttributes;
		},

		GetSchemaExpectedElements: function (
			particleTypes,
			contextNodeXml,
			childIndexInContextNode
		) {
			var hashString =
				particleTypes.join('|') + contextNodeXml + childIndexInContextNode;
			var hash = this._aras.calcMD5(hashString);
			var expectedCache = this._expectedElementsCache;

			if (!expectedCache[hash]) {
				expectedCache[hash] = this.postSchemaHelperRequest({
					action: 'GetExpectedParticles',
					particlesType: particleTypes.join('|'),
					contextNodeXml: contextNodeXml,
					childIndexInContextNode: childIndexInContextNode,
					defaultSchemaXml: this._schemaContent
				});
			}

			return expectedCache[hash];
		},

		GetSchemaExpectedElementChilds: function (schemaElement) {
			var particleTypes = ['childs'];
			var elementType =
				typeof schemaElement == 'string'
					? schemaElement
					: schemaElement.nodeName;
			var hash = this._aras.calcMD5('childs:' + elementType);
			var expectedCache = this._expectedElementsCache;

			if (!expectedCache[hash]) {
				expectedCache[hash] = this.postSchemaHelperRequest({
					action: 'GetExpectedParticles',
					particlesType: 'childs',
					contextNodeXml:
						'<' + elementType + ' xmlns:aras="http://aras.com/ArasTechDoc"/>',
					defaultSchemaXml: this._schemaContent
				});
			}

			return expectedCache[hash].childs || [];
		},

		postSchemaHelperRequest: function (postData) {
			var response;

			if (postData) {
				xhr(
					'../../Modules/aras.innovator.TDF/HttpHandlers/XmlSchemaHelper.ashx',
					{
						handleAs: 'text',
						method: 'POST',
						data: postData,
						sync: true
					}
				).then(
					function (jsonResult) {
						response = JSON.parse(jsonResult);

						if (response === 'InvalidSchema') {
							this._aras.AlertError(
								this._aras.getResource(
									'../Modules/aras.innovator.TDF',
									'helper.invalid_schema',
									postData.action || 'Schema'
								)
							);
						}
					}.bind(this),
					function (err) {
						this._aras.AlertError(err);
					}.bind(this)
				);
			}

			return response;
		},

		IsContentMixed: function (wrappedObject) {
			var elementType = this.GetSchemaElementType(wrappedObject);

			return (elementType & Enums.XmlSchemaElementType.Mixed) !== 0;
		},

		GetExpectedElements: function (targetElement, elementType) {
			var expectedElements = targetElement.is('ArasBlockXmlSchemaElement')
				? this.getExpectedElementsForBlock(targetElement)
				: this.getExpectedElementsDefault(targetElement);
			var isFiltered = elementType !== undefined;
			var resultList = { insert: [], append: [] };
			var elementsList;
			var i;

			elementsList = expectedElements.append;
			for (i = 0; i < elementsList.length; i++) {
				if (!isFiltered || (elementsList[i].schemaType & elementType) !== 0) {
					resultList.append.push(elementsList[i].name);
				}
			}

			elementsList = expectedElements.insert;
			for (i = 0; i < elementsList.length; i++) {
				if (!isFiltered || (elementsList[i].schemaType & elementType) !== 0) {
					resultList.insert.push(elementsList[i].name);
				}
			}

			return resultList;
		},

		getExpectedElementsDefault: function (targetElement) {
			var particlesType = ['insert'];
			var contextNodeXml;
			var childIndexInContextNode;
			var expectedElements;

			if (targetElement.Parent) {
				particlesType.push('append');

				contextNodeXml = this._getElementXmlWithoutBlocks(
					targetElement.Parent,
					true
				);
				childIndexInContextNode = this._getElementIndexInParentWithoutBlocks(
					targetElement
				);
			} else {
				contextNodeXml = this._getElementXmlWithoutBlocks(targetElement, true);
				childIndexInContextNode = -1;
			}

			expectedElements =
				this.GetSchemaExpectedElements(
					particlesType,
					contextNodeXml,
					childIndexInContextNode
				) || {};
			expectedElements.insert = expectedElements.insert || [];
			expectedElements.append = expectedElements.append || [];

			return expectedElements;
		},

		getExpectedElementsForBlock: function (targetElement) {
			var expectedElements = {};
			var parent = this._getNonBlockParent(targetElement);
			var contextNodeXml;
			var childIndexInContextNode;
			var data;
			var result;

			// expected insert elements
			if (!parent.is('ArasBlockXmlSchemaElement')) {
				childIndexInContextNode = this._getElementIndexInParentWithoutBlocks(
					targetElement
				);

				if (childIndexInContextNode > 0) {
					childIndexInContextNode -= 1;
				}
			} else {
				childIndexInContextNode = 0;
			}

			contextNodeXml = this._getElementXmlWithoutBlocks(parent, true);
			result = this.GetSchemaExpectedElements(
				['append'],
				contextNodeXml,
				childIndexInContextNode
			);
			expectedElements.insert = result && result.append ? result.append : [];

			// expected append elements
			if (targetElement.Parent) {
				var lastElementInBlock = this._getLastNonBlockElement(targetElement);

				childIndexInContextNode = lastElementInBlock
					? this._getElementIndexInParentWithoutBlocks(lastElementInBlock)
					: 0;
				result = this.GetSchemaExpectedElements(
					['append'],
					contextNodeXml,
					childIndexInContextNode
				);
				expectedElements.append = result && result.append ? result.append : [];
			} else {
				expectedElements.append = [];
			}

			return expectedElements;
		},

		// inputArguments = { context: WrappedOject, values: [WrappedOject,...] mode: 'before'|'into'|'after' }
		TryCandidatesAt: function (inputArguments) {
			var values = inputArguments.values || [];
			var context = inputArguments.context;

			if (context && values.length) {
				var mode = inputArguments.mode || 'after';
				var position;
				var target;

				switch (mode) {
					case 'before':
						target = context.Parent;
						position = this._getElementIndexInParentWithoutBlocks(context);
						break;
					case 'after':
						target = context.Parent;
						position = this._getElementIndexInParentWithoutBlocks(context) + 1;
						break;
					case 'into':
						if (context.is('ArasBlockXmlSchemaElement')) {
							target = this._getNonBlockParent(context);
							position = this._getElementIndexInParentWithoutBlocks(context);
						} else {
							target = context;
							position = 0;
						}
						break;
				}

				if (target) {
					var xmlContext = this._getElementXmlWithoutBlocks(target, true);
					var xmlNode = this._prepareValuesForTryInsertCandidate(values, true);

					return this.postSchemaHelperRequest({
						action: 'TryCandidatesAt',
						xmlContext: xmlContext,
						xmlNode: xmlNode,
						position: position,
						defaultSchemaXml: this._schemaContent
					});
				}
			}

			return { isValid: false };
		},

		TryChildCandidateByName: function (parentElementName, childElementName) {
			if (parentElementName && childElementName) {
				var checkResult = this._tryCandidateByNameCache[parentElementName]
					? this._tryCandidateByNameCache[parentElementName][childElementName]
					: undefined;

				if (checkResult === undefined) {
					var xmlContext =
						'<' +
						parentElementName +
						' xmlns:aras="http://aras.com/ArasTechDoc"' +
						'></' +
						parentElementName +
						'>';
					var xmlNode =
						'<root><' +
						childElementName +
						' xmlns:aras="http://aras.com/ArasTechDoc">' +
						'></' +
						childElementName +
						'></root>';
					var validationResult = this.postSchemaHelperRequest({
						action: 'TryCandidatesAt',
						xmlContext: xmlContext,
						xmlNode: xmlNode,
						position: 0,
						defaultSchemaXml: this._schemaContent
					});

					checkResult = validationResult.isValid;
					this._tryCandidateByNameCache[parentElementName] =
						this._tryCandidateByNameCache[parentElementName] || {};
					this._tryCandidateByNameCache[parentElementName][
						childElementName
					] = checkResult;
				}

				return checkResult;
			}

			return false;
		},

		_getEditorSettingsByXmlSchemaItem: function (xmlSchemaItem) {
			var editorSettings = {};
			var foundItems = xmlSchemaItem.getItemsByXPath(
				'./Relationships/Item[@type="tp_XmlSchemaOutputSetting"]'
			);
			var i = foundItems.getItemCount() - 1;

			while (i >= 0) {
				var outputSettingItem = foundItems.getItemByIndex(i);
				var classification =
					outputSettingItem.getProperty('target_classification') || 'global';
				var styleSheetItem = outputSettingItem.getPropertyItem('stylesheet_id');

				editorSettings[classification] = [];

				while (styleSheetItem) {
					editorSettings[classification].push({
						name: styleSheetItem.getProperty('name'),
						cssStyle: styleSheetItem.getProperty('style_content')
					});

					var parentStylesheetId = styleSheetItem.getProperty(
						'parent_stylesheet'
					);
					if (!parentStylesheetId) {
						break;
					}

					styleSheetItem = this._aras.getItemFromServer(
						'tp_Stylesheet',
						parentStylesheetId,
						'name,style_content,parent_stylesheet'
					);
				}

				i--;
			}

			return editorSettings;
		},

		_getLastNonBlockElement: function (wrappedObject) {
			if (wrappedObject && wrappedObject.is('ArasBlockXmlSchemaElement')) {
				var children = wrappedObject.ChildItems();
				var lastElement = children.get(children.length() - 1);

				return this._getLastNonBlockElement(lastElement);
			} else {
				return wrappedObject;
			}
		},

		_unrollChildBlocksToList: function (wrappedObject) {
			var resultArray = [];
			var childItemCount = wrappedObject.ChildItems().length();
			var childItem;
			var i;

			for (i = 0; i < childItemCount; i++) {
				childItem = wrappedObject.ChildItems().get(i);

				if (childItem.is('ArasBlockXmlSchemaElement')) {
					resultArray = resultArray.concat(
						this._unrollChildBlocksToList(childItem)
					);
				} else {
					resultArray.push(childItem);
				}
			}

			return resultArray;
		},

		_getNonBlockParent: function (wrappedObject) {
			if (!wrappedObject.Parent) {
				return wrappedObject;
			} else if (wrappedObject.Parent.is('ArasBlockXmlSchemaElement')) {
				return this._getNonBlockParent(wrappedObject.Parent);
			} else if (wrappedObject.Parent.is('XmlSchemaElement')) {
				return wrappedObject.Parent;
			} else {
				return null;
			}
		},

		_getElementIndexInParentWithoutBlocks: function (wrappedObject) {
			var searchObject = wrappedObject;

			if (searchObject.is('XmlSchemaElement')) {
				var parentObject;
				var parentChildItems;
				var elementId;
				var i;

				if (searchObject.is('ArasBlockXmlSchemaElement')) {
					var childItems = this._unrollChildBlocksToList(searchObject);

					if (childItems.length) {
						searchObject = childItems[childItems.length - 1];
					}
				}

				parentObject = this._getNonBlockParent(searchObject);
				parentChildItems = this._unrollChildBlocksToList(parentObject);
				elementId = searchObject.Id();

				for (i = 0; i < parentChildItems.length; i++) {
					if (parentChildItems[i].Id() == elementId) {
						return i;
					}
				}
			}

			return -1;
		},

		_getElementXmlWithoutBlocks: function (
			wrappedObject,
			isStartElement,
			ignoreRootCheck
		) {
			var out = '';

			if (wrappedObject && wrappedObject.is('XmlSchemaElement')) {
				var isRootElement = !wrappedObject.Parent;
				var isBlockElement = wrappedObject.is('ArasBlockXmlSchemaElement');

				if (isBlockElement && isStartElement && !isRootElement) {
					//if selected item is aras:block then step up until we will not reach non aras:block parent
					return this._getElementXmlWithoutBlocks(
						wrappedObject.Parent,
						true,
						ignoreRootCheck
					);
				} else {
					var childItem;
					var childItemCount;
					var i;

					if (!isBlockElement || (!ignoreRootCheck && isRootElement)) {
						out +=
							'<' +
							wrappedObject.nodeName +
							(isStartElement
								? ' xmlns:aras="http://aras.com/ArasTechDoc"'
								: '') +
							'>';
					}

					childItemCount = wrappedObject.ChildItems().length();
					for (i = 0; i < childItemCount; i++) {
						childItem = wrappedObject.ChildItems().get(i);
						out += this._getElementXmlWithoutBlocks(
							childItem,
							false,
							ignoreRootCheck
						);
					}

					if (!isBlockElement || (!ignoreRootCheck && isRootElement)) {
						out += '</' + wrappedObject.nodeName + '>';
					}
				}
			} else if (wrappedObject.is('XmlSchemaText')) {
				out += 'text';
			}

			return out;
		},

		_prepareValuesForTryInsertCandidate: function (
			candidateList,
			isStartElement
		) {
			var result = '';

			for (i = 0; i < candidateList.length; i++) {
				result += this._getElementXmlWithoutBlocks(
					candidateList[i],
					isStartElement,
					true
				);
			}

			return '<root>' + result + '</root>';
		},

		lookupNamespace: function (prefix) {
			return this._dom.documentElement.getAttribute(
				prefix == 'aras' ? 'xmlns:aras' : 'xmlns'
			);
		},

		getSchemaAttribute: function (element, attributeName) {
			var attributeList = this.GetSchemaElementAttributes(element) || [];
			var elementAttribute;
			var i;

			for (i = 0; i < attributeList.length; i++) {
				elementAttribute = attributeList[i];

				if (elementAttribute.Name == attributeName) {
					return elementAttribute;
				}
			}
		},

		getDefaultAttributes: function (element, attributeName) {
			var attributeList = this.GetSchemaElementAttributes(element) || [];
			var defaultAttributes = [];
			var elementAttribute;
			var i;

			for (i = 0; i < attributeList.length; i++) {
				elementAttribute = attributeList[i];

				if (elementAttribute.Default || elementAttribute.Fixed) {
					defaultAttributes.push(elementAttribute);
				}
			}

			return defaultAttributes;
		}
	});
});
