define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaNode',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/ArrayWrapper'
], function (declare, generateRandomUuid, Enums, XmlSchemaNode, ArrayWrapper) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.XmlSchemaElement',
		XmlSchemaNode,
		{
			_childItems: null,
			isRegistering: null,
			internal: null,

			NotificationMessageType: {
				VisibilityChanged: 0
			},

			constructor: function (args) {
				this.internal = {
					uid: '',
					uidParentPrefix: (args && args.uidPrefix) || '',
					uidPrefix: '',
					externalLinks: [],
					contentType: this.ownerDocument
						.ContentGeneration()
						.getElementContentType(this),
					display: Enums.DisplayType.Active,
					inactiveContentCollapsed: true
				};
				this.isRegistering = false;
				this._SetUid();
				this.ExternalLinks(
					this.ownerDocument.getElementExternalLinks(this.Uid())
				);

				this.registerType('XmlSchemaElement');
			},

			_parseOriginInternal: function () {
				var elementsArray = [];
				var originForParse = this._getOriginToParse();
				var originChilds = originForParse.childNodes;
				var schemaHelper = this.ownerDocument.Schema();
				var currentChildren = this.ChildItems();
				var childNode;
				var newElement;
				var i;

				if (currentChildren) {
					currentChildren.unregisterElements();
				}

				if (originChilds.length) {
					for (i = 0; i < originChilds.length; i++) {
						childNode = originChilds[i];

						if (childNode.nodeType === document.TEXT_NODE) {
							newElement = this.ownerDocument.CreateElement('text', {
								origin: childNode
							});
							elementsArray.push(newElement);
						} else if (childNode.nodeType === document.ELEMENT_NODE) {
							newElement = this.ownerDocument.CreateElement('element', {
								origin: childNode,
								uidPrefix:
									this.internal.uidParentPrefix + this.internal.uidPrefix
							});
							elementsArray.push(newElement);
						}
					}
				}

				if (schemaHelper.IsContentMixed(this)) {
					// if first child of the element with mixed content is not "text" element, then create it
					if (!elementsArray.length || !elementsArray[0].is('XmlSchemaText')) {
						newElement = this.ownerDocument.CreateElement('text');
						originForParse.insertBefore(
							newElement.origin,
							originForParse.firstChild
						);

						elementsArray.unshift(newElement);
					}
				}

				this.ChildItems(
					new ArrayWrapper({ owner: this, origin: null, array: elementsArray })
				);

				// init condition property
				this.internal.condition = this.Attribute('aras:condition');
			},

			_getOriginToParse: function () {
				if (this.internal.contentType == Enums.ElementContentType.Dynamic) {
					return (
						this.ownerDocument.ContentGeneration().getDynamicContent(this) ||
						this.origin
					);
				} else {
					return this.origin;
				}
			},

			ContentType: function () {
				return this.internal.contentType;
			},

			registerDocumentElement: function () {
				var childElements = this.ChildItems();

				this.isRegistering = true;
				this.inherited(arguments);

				if (childElements) {
					childElements.registerElements();
				}

				this.isRegistering = false;
			},

			isUpdatable: function () {
				return false;
			},

			isHidden: function () {
				if (this.internal.display == Enums.DisplayType.Hidden) {
					return true;
				}

				return this.Parent ? this.Parent.isHidden() : false;
			},

			isInactive: function () {
				if (this.internal.display == Enums.DisplayType.Inactive) {
					return true;
				}

				return this.Parent ? this.Parent.isInactive() : false;
			},

			isEmpty: function () {
				return false;
			},

			isSelectable: function () {
				return true;
			},

			isDynamic: function () {
				return this.internal.contentType == Enums.ElementContentType.Dynamic;
			},

			isBlocked: function () {
				return false;
			},

			hasDynamicParent: function () {
				const parentElement = this.Parent;

				return Boolean(
					parentElement &&
						(parentElement.isDynamic() || parentElement.hasDynamicParent())
				);
			},

			isExternal: function () {
				return false;
			},

			hasExternalParent: function () {
				const parentElement = this.Parent;

				return Boolean(
					parentElement &&
						(parentElement.isExternal() || parentElement.hasExternalParent())
				);
			},

			isExternallyLinked: function () {
				return this.internal.externalLinks.length > 0;
			},

			isContentCollapsed: function () {
				return this.internal.inactiveContentCollapsed;
			},

			collapseInactiveContent: function (makeCollapsed) {
				if (this.internal.inactiveContentCollapsed !== makeCollapsed) {
					this.internal.inactiveContentCollapsed = makeCollapsed;
					this.NotifyChanged();
				}
			},

			unregisterDocumentElement: function () {
				var childElements = this.ChildItems();

				this.inherited(arguments);

				if (childElements) {
					childElements.unregisterElements();
				}
			},

			ChildItems: function (value) {
				if (value === undefined) {
					return this._childItems;
				} else {
					if (this._childItems) {
						this._childItems.unregisterElements();
					}

					this._childItems = value;
					if (this.isRegistered()) {
						this._childItems.registerElements();
					}
				}
			},

			_SetAttribute: function (node, name, value) {
				if (value === null) {
					node.removeAttribute(name);
				} else {
					node.setAttribute(name, value);
				}

				this.NotifyChanged();
			},

			_GetAttribute: function (node, name) {
				return node.getAttribute(name);
			},

			Attribute: function (name, value) {
				if (!name) {
					throw new Error('Argument name is undefined');
				}

				if (value === undefined) {
					return this._GetAttribute(this.Origin(), name);
				} else {
					this._SetAttribute(this.Origin(), name, value);
				}
			},

			Uid: function () {
				return this.internal.uid;
			},

			_SetUid: function () {
				var node = this.origin;

				if (node.attributes) {
					var elementUid = node.getAttribute('aras:id');

					if (!elementUid) {
						elementUid = generateRandomUuid().replace(/-/g, '').toUpperCase();
						node.setAttribute('aras:id', elementUid);
					}

					this.internal.uid = this.internal.uidParentPrefix + elementUid;
				}
			},

			ExternalLinks: function (/*Objects Array*/ value) {
				if (value === undefined) {
					return this.internal.externalLinks;
				} else {
					this.internal.externalLinks = value;
				}
			},

			_DropUid: function () {
				var node = this.origin;

				if (node.attributes) {
					var uid = node.getAttribute('aras:id');

					if (uid) {
						node.removeAttribute('aras:id');
					}
				}

				this.internal.uid = '';
			},

			_OnCloned: function () {
				this.inherited(arguments);

				this._OnClonedItem();
				this._OnClonedChildItems();
			},

			_OnClonedItem: function () {
				//regenerate Uid
				this._DropUid();
				this._SetUid();
			},

			_OnClonedChildItems: function () {
				var childs = this.ChildItems();

				if (childs) {
					for (var i = 0, count = childs.length(); i < count; i++) {
						childs.get(i)._OnCloned();
					}
				}
			},

			_onChildItemsChanged: function () {
				this.NotifyChanged();
			},

			NotifyChilds: function (/*Object*/ notificationMessage) {
				var allChilds = this._childItems;
				var childsCount = allChilds.length();

				if (childsCount) {
					var currentChild;
					var i;

					for (i = 0; i < childsCount; i++) {
						currentChild = allChilds.get(i);
						currentChild.processNotificationEvent(notificationMessage);
					}
				}
			},

			Condition: function (/*String | Object*/ value) {
				if (value === undefined) {
					return this.internal.condition || '{}';
				} else {
					var belongsToExternalBlock = this.ownerDocument
						.ExternalBlockHelper()
						.isExternalBlockContains(this);

					if (!belongsToExternalBlock) {
						var wasChanged = true;
						var parsedCondition;

						value = value || {};
						parsedCondition =
							typeof value == 'string' ? JSON.parse(value) : value;

						// if new condition is not empty, then
						if (Object.keys(parsedCondition).length) {
							var stringifiedCondition =
								typeof value == 'string' ? value : JSON.stringify(value);

							if (this.internal.condition != stringifiedCondition) {
								this.internal.condition = stringifiedCondition;
								this.Attribute('aras:condition', stringifiedCondition);
							} else {
								wasChanged = false;
							}
						} else {
							this.internal.condition = null;
							this.Attribute('aras:condition', null);
						}

						if (wasChanged && this.isRegistered()) {
							// NotifyChanged already was called during attribute "Attribute" method call, so skip it
							this.ownerDocument.OptionalContent().trackConditionHandler(this);
						}
					}
				}
			},

			haveCondition: function () {
				return Boolean(this.internal.condition);
			},

			Display: function (/*Enums.DisplayType*/ value) {
				if (value === undefined) {
					return this.internal.display;
				} else if (this.internal.display != value) {
					this.internal.display = value;

					if (this.Parent) {
						this.Parent.NotifyChanged();
					} else {
						this.NotifyChanged();
					}

					this.NotifyChilds(
						this.createNotificationMessage(
							this.NotificationMessageType.VisibilityChanged,
							value
						)
					);
				}
			},

			getAllChilds: function (targetElement, foundElements) {
				targetElement = targetElement || this;
				foundElements = foundElements || [];

				if (targetElement) {
					foundElements.push(targetElement);

					if (targetElement.ChildItems) {
						var childItems = targetElement.ChildItems();
						var childItemsList =
							childItems.length() > 0 ? childItems.List() : [];
						var i;

						for (i = 0; i < childItemsList.length; i++) {
							this.getAllChilds(childItemsList[i], foundElements);
						}
					}
				}

				return foundElements;
			},

			processNotificationEvent: function (notificationMessage) {
				this.inherited(arguments);
				this.NotifyChilds(notificationMessage);
			},

			createNotificationMessage: function (eventType, eventData) {
				return { sender: this, event: eventType, data: eventData };
			}
		}
	);
});
