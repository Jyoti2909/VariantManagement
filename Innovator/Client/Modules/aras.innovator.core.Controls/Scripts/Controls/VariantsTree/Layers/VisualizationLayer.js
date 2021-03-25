define('Controls/VariantsTree/Layers/VisualizationLayer', [
	'dojo/_base/declare',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, Eventable) {
	return declare(Eventable, {
		domNode: null,
		contentNode: null,
		ownerControl: null,
		layerData: null,
		isVisible: true,
		visualization: {},
		_classedContainerNode: null,
		_classedNodeHash: null,
		_maxLayerBounds: null,
		id: null,
		_uniqueIdCounter: { count: 1 },

		constructor: function (initialArguments) {
			initialArguments = initialArguments || {};

			this._initializeProperties(initialArguments);

			this.setOwner(initialArguments.owner);
			this.setData(initialArguments.data);
		},

		_initializeProperties: function (initialArguments) {
			this.id =
				(initialArguments.id && initialArguments.id.toString()) ||
				'Layer_' + this._getNextUniqueId();

			if (initialArguments.visualization) {
				for (var parameterName in initialArguments.visualization) {
					this.visualization[parameterName] =
						initialArguments.visualization[parameterName];
				}
			}
		},

		_getNextUniqueId: function () {
			return this._uniqueIdCounter.count++;
		},

		isRegistered: function () {
			return Boolean(this.ownerControl);
		},

		setOwner: function (targetControl) {
			if (this.ownerControl) {
				this.ownerControl.removeLayer(this);
			}

			this.ownerControl = targetControl;
		},

		setData: function (layerData) {
			this.layerData = this._preprocessData(layerData);

			if (this.isVisible) {
				this.renderLayer();
			}
		},

		_preprocessData: function (layerData) {
			return layerData;
		},

		createDomNode: function () {
			if (!this.domNode && this.ownerControl) {
				var ownerDocument = this.ownerControl.domNode.ownerDocument;

				this.domNode = ownerDocument.createElementNS(
					'http://www.w3.org/2000/svg',
					'g'
				);
				this.domNode.setAttributeNS(null, 'groupType', 'layer');

				this.ownerControl.domNode.appendChild(this.domNode);
			}

			return this.domNode;
		},

		renderLayer: function () {
			if (this.preRenderHandler()) {
				var ownerDocument = this.domNode.ownerDocument;
				var newContentNode = ownerDocument.createElementNS(
					'http://www.w3.org/2000/svg',
					'g'
				);
				var newClassedContainerNode = ownerDocument.createElementNS(
					'http://www.w3.org/2000/svg',
					'g'
				);

				// remove old contentNode from dom and creating new one
				this.cleanupLayer();
				this.contentNode = newContentNode;

				// classed container node should be appended to dom before rendering
				newClassedContainerNode.style.visibility = 'hidden';
				this._classedContainerNode = newClassedContainerNode;
				this.domNode.appendChild(newClassedContainerNode);

				this.renderHandler();

				// attach new contentNode to dom only when rendering is finished
				this.domNode.appendChild(newContentNode);
				this.raiseEvent('onRenderLayer');
			}
		},

		renderHandler: function (contentNode) {},

		_renderItems: function (dataItems, optionalParamenters) {
			dataItems = dataItems
				? Array.isArray(dataItems)
					? dataItems
					: [dataItems]
				: [];
			optionalParamenters = optionalParamenters || {};

			if (dataItems.length) {
				var renderMethod = optionalParamenters.renderMethod;

				if (renderMethod) {
					var tempSvgContainer = this.contentNode.ownerDocument.createElement(
						'div'
					);
					var ownerNode = optionalParamenters.containerNode || this.contentNode;
					var nodesContent = '';
					var nodeSelector = optionalParamenters.nodeSelector;
					var containerNode;
					var i;

					for (i = 0; i < dataItems.length; i++) {
						nodesContent += renderMethod.call(
							this,
							dataItems[i],
							optionalParamenters.nearParentPosition
						);
					}

					// parsing nodesContent and appending to layer contentNode
					tempSvgContainer.innerHTML = '<svg><g>' + nodesContent + '</g></svg>';
					containerNode = tempSvgContainer.firstChild.firstChild;
					ownerNode.appendChild(containerNode);

					return optionalParamenters.nodeSelector
						? containerNode.querySelector(optionalParamenters.nodeSelector)
						: Array.prototype.slice.call(containerNode.childNodes);
				}
			}
		},

		_getClassedTextLength: function (
			nodeClasses,
			textElementClasses,
			textContent
		) {
			if (textContent) {
				var combinedClass = nodeClasses + ' ' + textElementClasses;
				var nodesHash = this._classedNodeHash;
				var classedNodeInfo = nodesHash[combinedClass];
				var stringLength;

				if (!classedNodeInfo) {
					var classedDomNode = this._renderItems(
						{
							data: {
								containerClasses: nodeClasses,
								textClasses: textElementClasses
							}
						},
						{
							containerNode: this._classedContainerNode,
							renderMethod: this._buildClassedNodeContent,
							skipEventHandling: true
						}
					);

					nodesHash[combinedClass] = classedNodeInfo = {
						node: classedDomNode,
						lengthHash: {}
					};
				}

				stringLength = classedNodeInfo.lengthHash[textContent];

				if (!stringLength) {
					var textElementSelector = textElementClasses
						? '.' + textElementClasses.replace(' ', '.')
						: 'text';

					stringLength = classedNodeInfo.node
						.select(textElementSelector)
						.text(textContent)
						.node()
						.getComputedTextLength();
					classedNodeInfo.lengthHash[textContent] = stringLength;
				}

				return stringLength;
			}

			return 0;
		},

		_buildClassedNodeContent: function (dataItem) {
			var itemData = dataItem.data || {};
			var nodeCssClasses = itemData.cssClasses || '';
			var textCssClasses = itemData.textClasses || '';
			var resultHTML = '';

			resultHTML += this.wrapInTag('', 'text', { class: textCssClasses });
			resultHTML = this.wrapInTag(resultHTML, 'g', { class: nodeCssClasses });

			return resultHTML;
		},

		preRenderHandler: function () {
			return this.domNode || this.createDomNode();
		},

		cleanupLayer: function () {
			if (this.domNode) {
				this._maxLayerBounds = null;

				this._removeContentNode();
				this._removeClassedContainerNode();
			}
		},

		_removeContentNode: function () {
			if (this.contentNode) {
				this.domNode.removeChild(this.contentNode);
				this.contentNode = null;
			}
		},

		_removeClassedContainerNode: function () {
			if (this._classedContainerNode) {
				this.domNode.removeChild(this._classedContainerNode);

				this._classedContainerNode = null;
				this._classedNodeHash = {};
			}
		},

		getActualLayerBounds: function () {
			return this._normalizeObject(this.contentNode.getBBox());
		},

		_updateMaxLayerBounds: function () {
			// this method should be called in moments, when layer has max size,
			// enough for all layer visual elements placement
			this._maxLayerBounds = this.getActualLayerBounds();
		},

		getMaxLayerBounds: function () {
			if (!this._maxLayerBounds) {
				this._updateMaxLayerBounds();
			}

			return this._maxLayerBounds;
		},

		_normalizeObject: function (targetObject) {
			if (targetObject) {
				var nomalizedObject = {};
				var propertyName;

				for (propertyName in targetObject) {
					nomalizedObject[propertyName] = targetObject[propertyName];
				}

				return nomalizedObject;
			}

			return targetObject;
		},

		showLayer: function () {
			if (!this.isVisible) {
				this.isVisible = true;

				this.domNode.style.display = '';
				this.renderLayer();
			}
		},

		hideLayer: function () {
			if (this.isVisible) {
				this.isVisible = false;
				this.domNode.style.display = 'none';
				this.cleanupLayer();
			}
		},

		toggleNodeCssClass: function (targetNode, className, addClass) {
			if (targetNode && className) {
				if (targetNode.classList) {
					if (addClass) {
						targetNode.classList.add(className);
					} else {
						targetNode.classList.remove(className);
					}
				} else {
					if (addClass) {
						targetNode.className.baseVal =
							targetNode.className.baseVal + ' ' + className;
					} else {
						targetNode.className.baseVal = targetNode.className.baseVal.replace(
							className,
							''
						);
					}
				}
			}
		},

		wrapInTag: function (sourceString, tagName, tagAttributes) {
			if (tagName) {
				var attributeString = '';

				if (tagAttributes) {
					for (var attributeName in tagAttributes) {
						attributeString +=
							' ' + attributeName + '="' + tagAttributes[attributeName] + '"';
					}
				}

				return (
					'<' +
					tagName +
					attributeString +
					'>' +
					sourceString +
					'</' +
					tagName +
					'>'
				);
			} else {
				return sourceString;
			}
		},

		normalizeText: function (textContent, maxLength) {
			return textContent
				? textContent.length > maxLength
					? textContent.substring(0, maxLength) + '\u2026'
					: textContent
				: '';
		},

		destroy: function () {
			this.layerData = null;
			this.cleanupLayer();
			this.setOwner(null);
		}
	});
});
