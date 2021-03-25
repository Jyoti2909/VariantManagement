define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasTextHighlightning'
], function (declare, XmlSchemaElement, ArasTextHighlightning) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.ArasItemPropertyXmlSchemaElement',
		XmlSchemaElement,
		{
			_propertyAttributeName: 'property',
			_modeAttributeName: 'mode',
			_propertyInfoCache: {},
			_localizationInfo: null,
			aras: null,

			constructor: function () {
				this.aras = this.ownerDocument._aras;
				this._textHighlightning = new ArasTextHighlightning(this);

				this.registerType('ArasItemPropertyXmlSchemaElement');
			},

			_parseOriginInternal: function () {
				this.inherited(arguments);

				// read source item property name
				this.internal.itemPropertyData = this._parsePropertyAttribute();
				this.internal.itemPropertyMode = this._parseModeAttribute();
			},

			_SetAttribute: function (node, name, value) {
				switch (name) {
					case this._propertyAttributeName:
						this.internal.itemPropertyData = this._parsePropertyAttribute(
							value
						);
						break;
					case this._modeAttributeName:
						this.internal.itemPropertyMode = this._parseModeAttribute(value);
						break;
				}

				this.inherited(arguments);
			},

			_parseModeAttribute: function (attributeValue) {
				attributeValue =
					attributeValue || this.Attribute(this._modeAttributeName) || '';

				return attributeValue === 'write' ? attributeValue : 'read';
			},

			_isValidPropertyName: function (propertyName) {
				try {
					return Boolean(document.createElement(propertyName));
				} catch (createException) {
					return false;
				}
			},

			_parsePropertyAttribute: function (attributeValue) {
				attributeValue =
					attributeValue || this.Attribute(this._propertyAttributeName) || '';

				const valueParts = attributeValue.split(':');
				const isExtendedFormat = valueParts.length === 2;
				let propertyName = isExtendedFormat ? valueParts[1] : valueParts[0];

				if (propertyName && !this._isValidPropertyName(propertyName)) {
					this.aras.AlertError(
						this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'itemproperty.invalidpropertyname'
						)
					);
					propertyName = '';
				}

				return {
					source: isExtendedFormat ? valueParts[0] : 'item',
					name: propertyName
				};
			},

			_locateSourceItem: function () {
				let parentElement = this.Parent;
				let sourceItem;

				while (parentElement) {
					if (parentElement.is('ArasItemXmlSchemaElement')) {
						sourceItem = parentElement;
						break;
					}

					parentElement = parentElement.Parent;
				}

				this.internal.itemData = {
					item: sourceItem,
					type:
						sourceItem &&
						sourceItem.ItemTypeId() &&
						this.aras.getItemTypeForClient(sourceItem.ItemTypeId(), 'id')
				};
			},

			registerDocumentElement: function () {
				this.isRegistering = true;

				this.inherited(arguments);
				this._locateSourceItem();

				this.isRegistering = false;
			},

			getTextHighlightning: function () {
				return this._textHighlightning;
			},

			getSourceItem: function () {
				const itemData = this.internal.itemData;
				return itemData && itemData.item;
			},

			getSourceItemType: function () {
				const itemData = this.internal.itemData;
				return itemData && itemData.type;
			},

			getSourceType: function () {
				const propertyData = this.internal.itemPropertyData;
				return propertyData && propertyData.source;
			},

			getPropertyValue: function () {
				const propertyData = this.internal.itemPropertyData;

				if (propertyData.name) {
					switch (propertyData.source) {
						case 'item':
							const sourceItem = this.getSourceItem();
							return sourceItem && sourceItem.GetProperty(propertyData.name);
						case 'itemtype':
							const sourceItemType = this.getSourceItemType();
							return (
								sourceItemType && sourceItemType.getProperty(propertyData.name)
							);
					}
				}

				return '';
			},

			getPropertyLocalValue: function () {
				const propertyValue = this.getPropertyValue();
				let localizationInfo = this._localizationInfo;

				if (!localizationInfo || localizationInfo.value !== propertyValue) {
					localizationInfo = null;

					if (propertyValue) {
						const propertyDataType = this.getPropertyInfo('data_type');
						const propertyPattern = this.getPropertyInfo('pattern');
						const localizedValue = this.aras.convertFromNeutral(
							propertyValue,
							propertyDataType,
							propertyPattern
						);

						localizationInfo = {
							value: propertyValue,
							localValue: localizedValue
						};
					}

					this._localizationInfo = localizationInfo;
				}

				return localizationInfo ? localizationInfo.localValue : propertyValue;
			},

			setPropertyValue: function (propertyValue) {
				if (propertyValue !== undefined && this.isEditable()) {
					const sourceItemElement = this.getSourceItem();

					if (sourceItemElement) {
						const propertyName = this.getPropertyName();
						const isItemSource = this.getSourceType() === 'item';

						if (propertyName && isItemSource) {
							return sourceItemElement.SetProperty(propertyName, propertyValue);
						}
					}
				}
			},

			isEditable: function () {
				return this.internal.itemPropertyMode === 'write';
			},

			isItemEditable: function () {
				const sourceItemElement = this.getSourceItem();
				return Boolean(sourceItemElement && sourceItemElement.isItemEditable());
			},

			isPropertyModified: function () {
				const sourceItemElement = this.getSourceItem();
				const isItemSource = this.getSourceType() === 'item';

				return Boolean(
					sourceItemElement &&
						isItemSource &&
						sourceItemElement.isItemPropertyModified(this.getPropertyName())
				);
			},

			getPropertyName: function () {
				const propertyData = this.internal.itemPropertyData;
				return propertyData && propertyData.name;
			},

			getPropertyMode: function () {
				return this.internal.itemPropertyMode;
			},

			getPropertyInfo: function (infoPropertyName) {
				const propertyName = this.getPropertyName();
				const sourceItemElement = this.getSourceItem();
				let propertyInfo = '';

				if (propertyName && sourceItemElement) {
					const sourceType = this.getSourceType();
					const itemTypeName =
						sourceType === 'item' ? sourceItemElement.ItemType() : 'ItemType';
					const infoKey =
						itemTypeName + '|' + propertyName + '|' + infoPropertyName;
					const propertyInfoCache = this._propertyInfoCache;

					propertyInfo = propertyInfoCache[infoKey];

					if (!propertyInfo) {
						switch (sourceType) {
							case 'item':
								itemTypeDescriptor = this.getSourceItemType();
								break;
							case 'itemtype':
								itemTypeDescriptor = this.aras.getItemTypeForClient(
									itemTypeName,
									'name'
								);
								break;
						}

						if (itemTypeDescriptor) {
							const dataTypeNode = itemTypeDescriptor.node.selectSingleNode(
								'Relationships/Item[@type="Property"][name="' +
									propertyName +
									'"]/' +
									infoPropertyName
							);

							propertyInfo = dataTypeNode && dataTypeNode.text;
							propertyInfoCache[infoKey] = propertyInfo;
						}
					}
				}

				return propertyInfo;
			},

			getReadonlyReason: function () {
				const isReadonly = this.getPropertyMode() === 'read';
				const isItemTypeSource = this.getSourceType() === 'itemtype';
				const sourceItemElement = this.getSourceItem();
				let reasonKey = '';

				if (isReadonly) {
					reasonKey = 'itemproperty.isreadonly';
				} else if (isItemTypeSource) {
					reasonKey = 'itemproperty.isitemtypesource';
				} else if (!sourceItemElement) {
					reasonKey = 'itemproperty.nosourceitem';
				} else {
					const isItemEditable = sourceItemElement.isItemEditable();

					if (!isItemEditable) {
						reasonKey = 'itemproperty.itemnoteditable';
					} else {
						const updatePermission = this.aras.getPermissions(
							'can_update',
							sourceItemElement.ItemId(),
							sourceItemElement.ItemTypeId()
						);

						if (!updatePermission) {
							reasonKey = 'itemproperty.noupdatepermission';
						}
					}
				}

				return (
					reasonKey &&
					this.aras.getResource('../Modules/aras.innovator.TDF', reasonKey)
				);
			}
		}
	);
});
