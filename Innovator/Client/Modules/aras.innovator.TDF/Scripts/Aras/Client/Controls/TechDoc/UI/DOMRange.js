define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.UI.DOMRange', null, {
		constructor: function (args) {
			this._window = args.window;
			this._domapi = args.domapi;
			this._viewmodel = args.viewmodel;

			this.start = null;
			this.startOffset = -1;
			this.end = null;
			this.endOffset = -1;
			this.commonAncestor = null;
			this.collapsed = undefined;
		},

		_getAllTextNodes: function (containerNode) {
			var textNodes = [];

			if (containerNode) {
				var ownerDocument = containerNode.ownerDocument;
				var nodeWalker = ownerDocument.createTreeWalker(
					containerNode,
					NodeFilter.SHOW_TEXT,
					null,
					false
				);

				while (nodeWalker.nextNode()) {
					textNodes.push(nodeWalker.currentNode);
				}
			}

			return textNodes;
		},

		_getActualNodeAndOffset: function (containerNode, offsetValue) {
			var textNodes = this._getAllTextNodes(containerNode);
			var resultData;

			if (textNodes.length) {
				var lastTextNode = textNodes[textNodes.length - 1];

				switch (offsetValue) {
					case 'begin':
					case 0:
						resultData = { node: textNodes[0], offset: 0 };
						break;
					case 'end':
						resultData = {
							node: lastTextNode,
							offset: lastTextNode.textContent.length
						};
						break;
					default:
						var textNodeIndex = 0;
						var currentNode = textNodes[0];

						while (
							currentNode &&
							textNodeIndex < textNodes.length &&
							currentNode.textContent.length < offsetValue
						) {
							offsetValue -= currentNode.textContent.length;
							currentNode = textNodes[++textNodeIndex];
						}

						resultData = currentNode
							? { node: currentNode, offset: offsetValue }
							: { node: lastTextNode, offset: lastTextNode.textContent.length };
						break;
				}
			} else {
				switch (offsetValue) {
					case 'begin':
						offsetValue = 0;
						break;
					case 'end':
						offsetValue = containerNode.childNodes.length;
						break;
					default:
						offsetValue = Math.min(
							containerNode.childNodes.length,
							offsetValue
						);
						break;
				}

				resultData = {
					node: containerNode,
					offset: offsetValue
				};
			}

			return resultData;
		},

		setCursorTo: function (fromElement, startOffset, toElement, endOffset) {
			if (fromElement && toElement) {
				var startNodeContainer = this._domapi.getNode(fromElement);
				var endNodeContainer =
					fromElement !== toElement
						? this._domapi.getNode(toElement)
						: startNodeContainer;

				if (startNodeContainer && endNodeContainer) {
					var selection = this._window.getSelection();
					var newrange = this._window.document.createRange();

					let normalizedTextPosition = this._getNormalizedTextPosition(
						fromElement,
						startNodeContainer,
						startOffset
					);
					newrange.setStart(
						normalizedTextPosition.node,
						normalizedTextPosition.offset
					);

					normalizedTextPosition = this._getNormalizedTextPosition(
						toElement,
						endNodeContainer,
						endOffset
					);
					newrange.setEnd(
						normalizedTextPosition.node,
						normalizedTextPosition.offset
					);

					// HACK: Workaroung for IE11, where removeAllRanges method call could throw the exception with 800a025e error code
					try {
						if (selection.rangeCount) {
							selection.removeAllRanges();
						}
					} finally {
						selection.addRange(newrange);
					}

					if (endNodeContainer.ownerDocument.hasFocus()) {
						if (endNodeContainer.focus) {
							var activeElement = this._window.document.activeElement;

							// sometimes the elements can't receive focus (the div without contenteditable)
							if (activeElement !== endNodeContainer) {
								//http://tjvantoll.com/2013/08/30/bugs-with-document-activeelement-in-internet-explorer/
								if (activeElement.nodeName.toLowerCase() !== 'body') {
									activeElement.blur();
								}

								endNodeContainer.focus();
							}
						}
					}

					this.refresh();
				}
			}
		},

		_getNormalizedTextPosition: function (targetElement, targetNode, offset) {
			if (!targetElement.is('ArasTextXmlSchemaElement')) {
				const firstChildElement =
					targetElement.ChildItems && targetElement.ChildItems().get(0);
				const isTextNode =
					(firstChildElement && firstChildElement.nodeName === '#text') ||
					targetElement.nodeName === '#text';
				if (!isTextNode) {
					return {
						offset: 0,
						node: targetNode
					};
				}
			}
			return this._getActualNodeAndOffset(targetNode, offset);
		},

		_getActualTextOffset: function (node, offset) {
			var hasChildren = node.hasChildNodes();
			var result;

			if (hasChildren || node.nodeName === '#text') {
				var currentNode = node;
				var sibling;

				result = hasChildren ? 0 : offset;

				if (hasChildren) {
					for (i = 0; i < offset; i++) {
						childNode = node.childNodes[i];
						result += childNode.textContent.length;
					}
				}

				while (
					!currentNode.className ||
					currentNode.className.indexOf('XmlSchemaNode') === -1
				) {
					sibling = currentNode.previousSibling;

					while (sibling) {
						result += sibling.textContent.length;
						sibling = sibling.previousSibling;
					}

					currentNode = currentNode.parentNode;
				}
			} else {
				result = offset;
			}

			return result;
		},

		refresh: function () {
			var selection = this._window.getSelection();

			if (selection.rangeCount) {
				var nodeRange = selection.getRangeAt(0);
				var startRangeObject = this._domapi.getObject(nodeRange.startContainer);
				var endRangeObject = this._domapi.getObject(nodeRange.endContainer);

				if (startRangeObject && endRangeObject) {
					this.start = startRangeObject;
					this.startOffset = this._getActualTextOffset(
						nodeRange.startContainer,
						nodeRange.startOffset
					);
					this.end = endRangeObject;
					this.endOffset = this._getActualTextOffset(
						nodeRange.endContainer,
						nodeRange.endOffset
					);
					this.commonAncestor = this._domapi.getObject(
						nodeRange.commonAncestorContainer
					);
					this.collapsed = nodeRange.collapsed;
					// this is check required because in IE11 it's very expensive operation
					this.plainText = !nodeRange.collapsed ? nodeRange.toString() : '';

					this.onRefresh(this);
				}
			} else {
				this.onRefresh(this);
			}
		},

		cloneContents: function () {
			if (this.commonAncestor) {
				if (this.commonAncestor.is('ArasTextXmlSchemaElement')) {
					var singleObject = this.start;

					if (singleObject.IsHasEmphes()) {
						var startPos = singleObject.selection.From();
						var endPos = singleObject.selection.To();
						var emphRange = singleObject.GetEmphRange(startPos.id, endPos.id);
						var cloneEmphRange = [];
						var i;

						// cloning emph range
						for (i = 0; i < emphRange.length; i++) {
							cloneEmphRange.push(emphRange[i].Clone());
						}

						if (cloneEmphRange.length === 1) {
							var tmp = cloneEmphRange[0]
								.Text()
								.substring(startPos.offset, endPos.offset);

							cloneEmphRange[0].Text(tmp);
						} else {
							var tmpFirstText = cloneEmphRange[0]
								.Text()
								.substring(startPos.offset);
							var tmpLastText = cloneEmphRange[cloneEmphRange.length - 1]
								.Text()
								.substring(0, endPos.offset);

							cloneEmphRange[0].Text(tmpFirstText);
							cloneEmphRange[cloneEmphRange.length - 1].Text(tmpLastText);
						}

						return {
							data: {
								formattedText: cloneEmphRange,
								plainText: this.plainText
							},
							type: 'ArasTextXmlSchemaElement'
						};
					}
				} else if (
					this.commonAncestor.is('XmlSchemaText') &&
					this.start === this.end
				) {
					// for one level element
					var text = this.commonAncestor.Text();
					var selection = text.substring(this.startOffset, this.endOffset);

					return { data: selection, type: 'Text' };
				}
			}

			return null;
		},

		onRefresh: function (/*DOMRange*/ sender) {
			// Event to refresh viewmodel  cursor object
		}
	});
});
