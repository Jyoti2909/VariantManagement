define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, generateRandomUuid, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTextXmlSchemaElement.ArasEmphText',
		null,
		{
			_node: null,
			_text: null,
			_style: null,
			_isLink: null,
			_linkData: null,
			_uid: null,
			_owner: null,
			_aras: null,

			constructor: function (arasTextObj, node) {
				this._owner = arasTextObj;
				this._aras = this._owner._aras;
				this._uid = generateRandomUuid();

				if (node) {
					this._node = node;
					this._text =
						node.nodeName == '#text'
							? node.nodeValue
							: node.firstChild
							? node.firstChild.nodeValue
							: '';

					if (node.getAttribute('link')) {
						var linkValid = false;

						this._refId = node.getAttribute('ref-id');

						if (this._refId) {
							var linkNode = this._GetLinkNode();

							if (linkNode) {
								this._linkData = {
									type: Enums.LinkTypes.ExternalDocument,
									blockId: linkNode.getAttribute('targetBlock'),
									elementId: linkNode.getAttribute('targetElement')
								};
								linkValid = true;
							} else {
								this._owner.AlertError(
									this._aras.getResource(
										'../Modules/aras.innovator.TDF',
										'viewmodel.linknodenotfound'
									)
								);
							}
						} else {
							var linkType = node.getAttribute('linktype');
							var urlAttributeValue = node.getAttribute('url');

							switch (linkType) {
								case 'url':
									this._linkData = {
										type: Enums.LinkTypes.Url,
										url: urlAttributeValue
									};
									linkValid = true;
									break;
								case 'internalelement':
									this._linkData = {
										type: Enums.LinkTypes.InternalElement,
										elementId: urlAttributeValue
									};
									linkValid = true;
									break;
								default:
									if (urlAttributeValue) {
										this._linkData = {
											type: Enums.LinkTypes.Url,
											url: urlAttributeValue
										};
										linkValid = true;
									}
									break;
							}
						}

						this._isLink = linkValid;
					}

					this._style = this._getStylesObj();
				} else {
					this._node = null;
					this._text = '';
					this._style = { normal: true };
				}
			},

			/* Public Properies */
			Text: function (text) {
				if (text === undefined) {
					return this._text;
				} else {
					this._text = text;
				}
			},

			Id: function () {
				return this._uid;
			},

			Style: function (style, value) {
				if (style === undefined) {
					return this._style;
				} else {
					value = value || false;
					this._style[style] = value;
				}
			},

			Node: function () {
				return this._node;
			},

			/*Public API*/
			Invalidate: function (isTextOnly) {
				var emphObjNode = this._node;

				if (!emphObjNode) {
					this._initNodeForEmphInstance();
					emphObjNode = this._node;
					this.onAdd(this, this._beforeId);
					delete this._beforeId;
				}

				if (emphObjNode.nodeName == '#text') {
					emphObjNode.nodeValue = this._text;
				} else {
					if (!emphObjNode.firstChild) {
						if (typeof this._text === 'string' && this._text.length !== 0) {
							var contentNode = this._owner.origin;
							var _domObj = contentNode.ownerDocument;
							var contentTextNode = _domObj.createTextNode(this._text);
							emphObjNode.appendChild(contentTextNode);
						}
					} else {
						emphObjNode.firstChild.nodeValue = this._text;
					}
				}

				if (!isTextOnly) {
					if (emphObjNode.attributes || this._style) {
						var style = this._style;
						var allStyles = this._owner._allowedStyles;
						var name;

						for (name in allStyles) {
							if (name != 'normal') {
								if (style[name] && !emphObjNode.getAttribute(name)) {
									emphObjNode.setAttribute(name, 'true');
								} else if (!style[name] && emphObjNode.getAttribute(name)) {
									emphObjNode.removeAttribute(name);
									delete style[name];
								} else if (!style[name]) {
									delete style[name];
								}
							}
						}
					}

					this._updateLinkAttributes();
				}
			},

			_updateLinkAttributes: function () {
				this._cleanupLinkAttributes();

				if (this._isLink) {
					this._node.setAttribute('link', 'true');

					switch (this._linkData.type) {
						case Enums.LinkTypes.ExternalDocument:
							var linkNode;

							if (!this._refId) {
								this._refId = generateRandomUuid()
									.replace(/-/g, '')
									.toUpperCase();
								this._node.setAttribute('ref-id', this._refId);
							}

							linkNode = this._GetLinkNode() || this._CreateLinkNode();
							linkNode.setAttribute('ref-id', this._refId);
							linkNode.setAttribute('targetBlock', this._linkData.blockId);
							linkNode.setAttribute('targetElement', this._linkData.elementId);
							linkNode.setAttribute(
								'path',
								this._linkData.blockId + '/' + this._linkData.elementId
							);
							this._SetLinkNode(linkNode);
							break;
						case Enums.LinkTypes.InternalElement:
							this._node.setAttribute('linktype', 'internalelement');
							this._node.setAttribute('url', this._linkData.elementId);
							break;
						case Enums.LinkTypes.Url:
							this._node.setAttribute('linktype', 'url');
							this._node.setAttribute('url', this._linkData.url);
							break;
					}
				}
			},

			_cleanupLinkAttributes: function () {
				var linkAttributesExist = this._node.getAttribute('link');

				if (linkAttributesExist) {
					this._node.removeAttribute('link');
					this._node.removeAttribute('ref-id');
					this._node.removeAttribute('url');

					this._refId = null;
				}
			},

			TextLength: function () {
				return this._text ? this._text.length : 0;
			},

			AppendText: function (text) {
				this._text += text;
			},

			CutText: function (fromPoint, toPoint) {
				var text = this._text;
				var textLength = text ? text.length : 0;

				toPoint = toPoint !== undefined ? toPoint : textLength;

				if (fromPoint > -1 && toPoint <= textLength) {
					var leftText = fromPoint > 0 ? text.slice(0, fromPoint) : '';
					var centerText =
						toPoint <= textLength ? text.slice(fromPoint, toPoint) : '';
					var rightText = text.slice(toPoint);

					this._text = leftText + rightText;
					if (this._text.length === 0) {
						this.Delete();
					} else {
						this.Invalidate(true);
					}

					return centerText;
				}
			},

			Delete: function () {
				this._dropNodeFromOwner();
				this.onDelete(this);
			},

			Clone: function () {
				var newEmph = this._owner.CreateNewEmphObject();

				newEmph.Text(this._text);
				newEmph._style = this.CloneStyleObj();
				if (this._isLink) {
					newEmph.setLink(this._linkData.type, this._linkData);
				}
				return newEmph;
			},

			Link: function () {
				return this._isLink ? this._linkData : { type: Enums.LinkTypes.None };
			},

			LinkType: function () {
				return this._isLink ? this._linkData.type : Enums.LinkTypes.None;
			},

			setLink: function (linkType, linkData) {
				if (linkData) {
					switch (linkType) {
						case Enums.LinkTypes.ExternalDocument:
							if (linkData.blockId) {
								this._linkData = {
									type: linkType,
									blockId: linkData.blockId,
									elementId: linkData.elementId || linkData.blockId
								};
								this._isLink = true;
							}
							break;
						case Enums.LinkTypes.InternalElement:
							if (linkData.elementId) {
								this._linkData = {
									type: linkType,
									elementId: linkData.elementId
								};
								this._isLink = true;
							}
							break;
						case Enums.LinkTypes.Url:
							if (linkData.url) {
								this._linkData = { type: linkType, url: linkData.url };
								this._isLink = true;
							}
							break;
					}
				}
			},

			DeleteLink: function () {
				this._isLink = false;
				this._linkData = null;
			},

			IsLink: function () {
				return this._isLink;
			},

			/* NOTE If all text is cut emph will delete */
			Break: function (/*int*/ position) {
				if (position === undefined || this._text.length < position) {
					this._owner.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.positioniswrong'
						)
					);
					return;
				}

				var rightText = this.CutText(position);

				if (rightText.length) {
					var clonedEmph = this.Clone();
					var nextEmph;

					clonedEmph.Text(rightText);
					nextEmph = this._owner.GetNextEmphObject(this.Id());

					if (nextEmph) {
						clonedEmph.SetBefore(nextEmph.Id());
					}

					this.SetBefore(clonedEmph.Id());
					clonedEmph.Invalidate();
					this.Invalidate();

					return clonedEmph;
				}

				return null;
			},

			SetBefore: function (uid) {
				this._beforeId = uid;
			},

			/*Private Methods*/
			_getStylesObj: function () {
				var styles = {};
				var attrs = this._node.attributes;

				styles.normal = true;

				if (attrs) {
					var attr;
					var i;

					for (i = 0; i < attrs.length; i++) {
						attr = attrs[i];

						if (attr.value == '1' || attr.value == 'true') {
							styles[attr.name] = true; // Note This true if  Emph node has style attr with values = 1 or true
						}
					}
				}

				return styles;
			},

			_initNodeForEmphInstance: function () {
				var contentNode = this._owner.origin;
				var uid = this._beforeId;
				var _domObj = contentNode.ownerDocument;
				var contentTextNode = _domObj.createTextNode(this._text);
				var elementNode = _domObj.createElement('aras:emph');
				var setBeforeEmph = uid ? this._owner.GetEmphObjectById(uid) : null;

				if (setBeforeEmph) {
					contentNode.insertBefore(elementNode, setBeforeEmph.Node());
				} else {
					contentNode.appendChild(elementNode);
				}

				elementNode.appendChild(contentTextNode);
				this._node = elementNode;
			},

			_dropNodeFromOwner: function () {
				this._owner.origin.removeChild(this._node);
			},

			CloneStyleObj: function () {
				var style = this._style;
				var clone = {};
				var key;

				for (key in style) {
					clone[key] = style[key];
				}
				return clone;
			},

			_GetLinkNode: function () {
				var parentDocument = this._owner.ownerDocument;

				return parentDocument
					? parentDocument
							.OriginExternalProvider()
							.GetExternalNodeByRefId(this._refId)
					: null;
			},

			_CreateLinkNode: function () {
				return this._owner.ownerDocument
					.ContentGeneration()
					.ConstructElementOrigin('aras:link');
			},

			_SetLinkNode: function (xmlLinkNode) {
				var parentDocument = this._owner.ownerDocument;

				if (parentDocument) {
					parentDocument
						.OriginExternalProvider()
						.UpdateReferenceNode(xmlLinkNode);
				}
			},

			/*Event*/
			onDelete: function (emph) {
				this._owner._onEmphDelete(emph);
			},

			onAdd: function (emph, setBeforeId) {
				this._owner._onEmphAdd(emph, setBeforeId);
			}
		}
	);
});
