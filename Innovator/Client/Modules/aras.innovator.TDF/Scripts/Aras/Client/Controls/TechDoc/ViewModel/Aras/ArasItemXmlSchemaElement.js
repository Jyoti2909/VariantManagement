define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaExternalElement'
], function (declare, XmlSchemaExternalElement) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasItemXmlSchemaElement',
		XmlSchemaExternalElement,
		{
			_aras: null,
			_itemModifiedAttributeName: 'isItemModified',
			_initialValueAttributeName: 'initialValue',
			_newValueAttributeName: 'newValue',

			constructor: function (args) {
				this._aras = this.ownerDocument._aras;
				this.referenceNodeName = 'aras:item';

				this.registerType('ArasItemXmlSchemaElement');
			},

			_parseOriginInternal: function () {
				this.inherited(arguments);

				const referenceNode = this.OriginExternal();

				this.internal.referenceNode = referenceNode;
				this.internal.itemNode = referenceNode && referenceNode.firstChild;

				this.Attribute('itemId', this.ItemId());
			},

			_getPropertyNode: function (propertyName) {
				const itemNode = this.internal.itemNode;
				return (
					itemNode && propertyName && itemNode.selectSingleNode(propertyName)
				);
			},

			_dropItemModifiedAttribute: function () {
				if (this.isItemModified()) {
					const itemNode = this.internal.itemNode;
					const modifiedPropertyNodes = itemNode.selectNodes(
						'*[@' +
							this._initialValueAttributeName +
							' or @' +
							this._newValueAttributeName +
							']'
					);

					if (!modifiedPropertyNodes.length) {
						this.AttributeExternal(this._itemModifiedAttributeName, null);
					}
				}
			},

			_dropPropertyNodeChanges: function (propertyName) {
				const propertyNode = this._getPropertyNode(propertyName);

				if (propertyNode) {
					if (
						propertyNode.getAttribute(this._initialValueAttributeName) !== null
					) {
						const itemNode = this.internal.itemNode;
						const initialValue = propertyNode.getAttribute(
							this._initialValueAttributeName
						);

						this._aras.setItemProperty(itemNode, propertyName, initialValue);
						propertyNode.removeAttribute(this._initialValueAttributeName);

						return true;
					} else if (
						propertyNode.getAttribute(this._newValueAttributeName) !== null
					) {
						propertyNode.parentNode.removeChild(propertyNode);
						return true;
					}
				}
			},

			_echoItemElementsMethodCall: function (optionalParameters) {
				const callerMethod = arguments.callee.caller;

				optionalParameters = optionalParameters || {};

				if (callerMethod) {
					const callArguments = Array.prototype.slice.call(
						callerMethod.arguments
					);
					const lastArgument =
						callArguments.length && callArguments[callArguments.length - 1];

					if (typeof lastArgument !== 'object' || !lastArgument.echoCall) {
						const methodName = callerMethod.name || callerMethod.nom;

						if (methodName) {
							const itemElements = this.getElementsWithItemId();
							const notifiedReferences = {};

							while (callArguments.length < callerMethod.length) {
								callArguments.push(undefined);
							}

							callArguments.push({
								echoCall: true
							});

							notifiedReferences[this.ReferenceId()] = true;

							for (let i = 0; i < itemElements.length; i++) {
								const itemElement = itemElements[i];
								const referenceId = itemElement.ReferenceId();

								if (!notifiedReferences[referenceId]) {
									itemElement[methodName].apply(itemElement, callArguments);
									notifiedReferences[referenceId] = true;
								}

								if (optionalParameters.notifyChangedAll) {
									itemElement.NotifyChanged();
								}
							}
						}
					}
				}
			},

			getElementsWithItemId: function (itemId) {
				const allElements = this.ownerDocument.getAllElements();

				itemId = itemId || this.ItemId();

				return allElements.filter(function (documentElement) {
					return (
						documentElement.is('ArasItemXmlSchemaElement') &&
						documentElement.ItemId() === itemId
					);
				});
			},

			Item: function (value) {
				if (value === undefined) {
					return this.internal.itemNode;
				} else {
					var aras = this._aras;
					var referenceNode = this.internal.referenceNode;
					var isDiscoverOnly = value.getAttribute('discover_only') === '1';
					var itemNode = referenceNode.ownerDocument.importNode(value, true);
					var referenceProperties = {
						isCurrent: aras.getItemProperty(value, 'is_current'),
						majorVersion: aras.getItemProperty(value, 'major_rev'),
						minorVersion: aras.getItemProperty(value, 'generation')
					};

					this.ownerDocument.SuspendInvalidation();

					try {
						var currentItemNode = this.internal.itemNode;

						itemNode.setAttribute('xmlns', '');
						this.internal.itemNode = !isDiscoverOnly
							? itemNode
							: itemNode.cloneNode(false);

						if (currentItemNode) {
							referenceNode.replaceChild(
								this.internal.itemNode,
								currentItemNode
							);
						} else {
							referenceNode.appendChild(this.internal.itemNode);
						}

						this.Attribute('itemId', this.ItemId());

						if (referenceProperties.isCurrent !== '1') {
							// search for latest item version
							var latestItemVersion = aras.newIOMItem(
								aras.getItemProperty(value, 'type'),
								'getItemLastVersion'
							);

							latestItemVersion.setID(aras.getItemProperty(value, 'id'));
							latestItemVersion = latestItemVersion.apply();

							if (!latestItemVersion.isError()) {
								referenceProperties.latestVersionId = latestItemVersion.getID();
							}
						}

						this.internal.referenceProperties = referenceProperties;
						this.AttributeExternal(
							'referenceProperties',
							JSON.stringify(referenceProperties)
						);

						if (isDiscoverOnly) {
							this.AttributeExternal('isBlocked', 'true');
						}
					} finally {
						this.ownerDocument.ResumeInvalidation();
					}
				}
			},

			ItemId: function () {
				return !this.isEmpty() ? this.Item().getAttribute('id') : '';
			},

			ItemType: function () {
				return !this.isEmpty() ? this.Item().getAttribute('type') : '';
			},

			ItemTypeId: function () {
				return !this.isEmpty() ? this.Item().getAttribute('typeId') : '';
			},

			GetProperty: function (propname, defaultValue) {
				return !this.isEmpty()
					? this._aras.getItemProperty(this.Item(), propname, defaultValue)
					: '';
			},

			SetProperty: function (propertyName, propertyValue) {
				if (
					propertyName &&
					propertyValue !== undefined &&
					this.isItemEditable()
				) {
					const currentPropertyValue = this.GetProperty(propertyName);

					if (propertyValue !== currentPropertyValue) {
						const itemNode = this.Item();
						const propertyNode = this._getPropertyNode(propertyName);
						const isExistingProperty = Boolean(propertyNode);
						const initialValue =
							propertyNode &&
							(propertyNode.getAttribute(this._initialValueAttributeName) ||
								propertyNode.getAttribute(this._newValueAttributeName));

						this.ownerDocument.SuspendInvalidation();

						this._aras.setItemProperty(itemNode, propertyName, propertyValue);
						this.AttributeExternal(this._itemModifiedAttributeName, 'true');

						if (initialValue === null || initialValue === undefined) {
							this._aras.setItemPropertyAttribute(
								itemNode,
								propertyName,
								isExistingProperty
									? this._initialValueAttributeName
									: this._newValueAttributeName,
								isExistingProperty ? currentPropertyValue : true
							);
						}

						this._echoItemElementsMethodCall({ notifyChangedAll: true });
						this.ownerDocument.ResumeInvalidation();

						return true;
					}
				}
			},

			isEmpty: function () {
				return !Boolean(this.internal.itemNode);
			},

			isItemModified: function () {
				const referenceNode = this.internal.referenceNode;

				return (
					referenceNode &&
					referenceNode.getAttribute(this._itemModifiedAttributeName) !== null
				);
			},

			isItemEditable: function () {
				const isCurrent = this.getReferenceProperty('isCurrent') === '1';

				return isCurrent;
			},

			isItemPropertyModified: function (propertyName) {
				const propertyNode =
					this.isItemModified() && this._getPropertyNode(propertyName);

				return Boolean(
					propertyNode &&
						(propertyNode.getAttribute(this._initialValueAttributeName) !==
							null ||
							propertyNode.getAttribute(this._newValueAttributeName) !== null)
				);
			},

			dropItemPropertiesChanges: function (propertiesList) {
				if (this.isItemModified()) {
					const itemNode = this.internal.itemNode;
					const propertyNodes = itemNode.selectNodes(
						'*[@' +
							this._initialValueAttributeName +
							' or @' +
							this._newValueAttributeName +
							']'
					);
					const dropAllProperties = propertiesList === undefined;

					propertiesList = propertiesList
						? Array.isArray(propertiesList)
							? propertiesList
							: [propertiesList]
						: [];

					for (let i = 0; i < propertyNodes.length; i++) {
						const propertyNode = propertyNodes[i];
						const propertyName = propertyNode.nodeName;

						if (
							dropAllProperties ||
							propertiesList.indexOf(propertyName) > -1
						) {
							this._dropPropertyNodeChanges(propertyNode.nodeName);
						}
					}

					this.ownerDocument.SuspendInvalidation();
					this._dropItemModifiedAttribute();
					this._echoItemElementsMethodCall({ notifyChangedAll: true });
					this.ownerDocument.ResumeInvalidation();
				}
			}
		}
	);
});
