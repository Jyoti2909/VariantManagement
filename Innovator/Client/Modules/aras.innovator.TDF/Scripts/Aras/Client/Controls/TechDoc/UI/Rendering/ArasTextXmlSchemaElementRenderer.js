define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElementRenderer, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasTextXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			/**
			 * @param {WrappedObject} schemaElement
			 * @param {Object} elementState
			 */
			RenderInnerContent: function (schemaElement, elementState) {
				var out = '';

				out += schemaElement._textStash.IsInitialized()
					? this._renderArasGlyphs(schemaElement)
					: '';

				return out;
			},

			GetAttributes: function (schemaElement, elementState) {
				var renderAttributes = this.inherited(arguments);
				if (
					elementState.isSelectable &&
					!elementState.isDynamic &&
					!elementState.isDynamicChild &&
					!elementState.isExternalChild &&
					this.factory._viewmodel.IsEqualEditableLevel(
						Enums.EditLevels.IgnoreExternal
					)
				) {
					renderAttributes.contentEditable = elementState.isSelectable;
				}
				return renderAttributes;
			},

			/**
			 * @param {WrappedObject} schemaElement
			 */
			_renderArasGlyphs: function (schemaElement) {
				var stash = schemaElement._textStash;
				var stashIds = stash.Stash();
				var emphsCount = stashIds.length;
				var textHighlightning = schemaElement.getTextHighlightning();
				var emphRenderData = [];
				var outputStr = '';
				var textPosition = 0;
				var highlightRanges;
				var currentRange;
				var stashItemNode;
				var stashItem;
				var stashId;
				var isLink;
				var styles;
				var styleProperties;
				var itemText;
				var renderedText;
				var emphData;
				var styleKeys;
				var stylePropertyName;
				var startPosition;
				var endPosition;
				var emphTextPosition;
				var encodeHtml = dojox.html.entities.encode;
				var i;
				var j;

				for (i = 0; i < emphsCount; i++) {
					stashId = stashIds[i];
					stashItem = stash.GetEmphObjById(stashId);
					stashItemNode = stashItem.Node();
					styles = stashItem.Style();
					isLink = stashItem.IsLink();

					styleProperties =
						(styles.bold ? 'font-weight: bold; ' : '') +
						(styles.italic ? 'font-style: italic; ' : '') +
						(styles.sub
							? 'position: relative; top: 1px; font-size: smaller; '
							: '') +
						(styles.sup
							? 'position: relative; top: -5px; font-size: smaller; '
							: '') +
						(isLink ? 'color: blue;' : '');

					if (isLink || styles.strike || styles.under) {
						styleProperties +=
							' text-decoration:' +
							(styles.strike ? ' line-through' : '') +
							(styles.under || isLink ? ' underline' : '');
					}

					styleKeys = '';
					for (stylePropertyName in styles) {
						if (styles[stylePropertyName]) {
							styleKeys += (styleKeys ? ' ' : '') + stylePropertyName;
						}
					}

					itemText = stashItem.Text();
					renderedText = '';
					highlightRanges = textHighlightning.getRangesByBounds(
						textPosition,
						textPosition + itemText.length
					);

					if (highlightRanges.length) {
						emphTextPosition = 0;

						for (j = 0; j < highlightRanges.length; j++) {
							currentRange = highlightRanges[j];
							startPosition = Math.max(0, currentRange.start - textPosition);
							endPosition = Math.min(
								itemText.length,
								currentRange.end - textPosition
							);

							renderedText += encodeHtml(
								itemText.substring(emphTextPosition, startPosition)
							);
							renderedText += this.wrapInTag(
								encodeHtml(itemText.substring(startPosition, endPosition)),
								'hlr',
								{
									rangeId: currentRange.id,
									active: currentRange.active ? true : undefined
								}
							);

							emphTextPosition = endPosition;
						}

						renderedText += encodeHtml(
							itemText.substring(endPosition, itemText.length)
						);
					} else {
						renderedText = dojox.html.entities.encode(itemText);
					}

					textPosition += itemText.length;

					emphRenderData.push({
						text: renderedText,
						attributes: {
							id: stashId,
							style: styleProperties || '',
							'data-type': stashItemNode.nodeName,
							'data-style': styleKeys
						}
					});
				}

				for (i = 0; i < emphsCount; i++) {
					emphData = emphRenderData[i];

					outputStr += this.wrapInTag(
						emphData.text,
						'span',
						emphData.attributes
					);
				}

				return outputStr;
			},

			/**
			 * @param {WrappedObject} schemaElement
			 * @param {Object} elementState
			 */
			GetTreeName: function (schemaElement, elementState) {
				var treeName = this.inherited(arguments);
				var objectText = this._getTextForTextNodeType(schemaElement);
				var escapedObjectText = dojox.html.entities.encode(objectText);

				treeName += escapedObjectText
					? ' - ' +
					  this.wrapInTag(escapedObjectText, 'span', {
							class: 'MixedContentNode'
					  })
					: '';

				return treeName;
			},

			/**
			 * @param {WrappedObject} schemaElement
			 * @param {Object} elementState
			 */
			GetTreeType: function (schemaElement, elementState) {
				return 'ArasTextXmlSchemaElement';
			},

			/**
			 * @param {WrappedObject} schemaElement
			 */
			_getTextForTextNodeType: function (schemaElement) {
				var out = '';

				if (schemaElement.is('ArasTextXmlSchemaElement')) {
					out = schemaElement.GetTextAsString();
				} else {
					if (schemaElement.is('XmlSchemaText')) {
						out += schemaElement.Text();
					} else if (schemaElement.is('XmlSchemaElement')) {
						var childItems = schemaElement.ChildItems();
						var childsCount = childItems.length();
						var childItem;
						var i;

						for (i = 0; i < childsCount; i++) {
							childItem = childItems.get(i);
							out += this._getTextForTextNodeType(childItem);
						}
					}
				}

				return out;
			},

			/**
			 * @param {WrappedObject} schemaElement
			 * @param {Object} elementState
			 */
			GetTreeStyle: function (schemaElement, elementState) {},

			getPlaceholder: function () {
				return this.ResourceString('nullText');
			}
		}
	);
});
