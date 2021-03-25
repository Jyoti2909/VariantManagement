define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement'
], function (declare, XmlSchemaElement) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.XmlSchemaExternalElement',
		XmlSchemaElement,
		{
			referenceNodeName: null,
			externalReferenceAllowed: null,

			constructor: function (args) {
				this.referenceNodeName = this.nodeName;
				this.setReferenceAllowedFlag(true);

				this.registerType('XmlSchemaExternalElement');
			},

			_parseOriginInternal: function () {
				if (this.externalReferenceAllowed) {
					var referenceId = this.Attribute('ref-id');
					var referenceProvider = this.ownerDocument.OriginExternalProvider();
					var attributeValue;

					// if reference id doesn't set, then create new reference
					if (!referenceId) {
						var newReferenceNode = this.ownerDocument
							.ContentGeneration()
							.ConstructElementOrigin(this.referenceNodeName);

						referenceId = referenceProvider.InsertExternal(newReferenceNode);
						this.Attribute('ref-id', referenceId);
					}

					this.internal.referenceId = referenceId;
					referenceProvider.Connect(referenceId, this.Id());

					attributeValue = this.AttributeExternal('referenceProperties');
					this.internal.referenceProperties = attributeValue
						? JSON.parse(attributeValue)
						: {};
					this.internal.conditionExternal = this.AttributeExternal(
						'aras:condition'
					);
				} else {
					this.internal.referenceProperties = {};
					this.internal.conditionExternal = '';
				}

				this.inherited(arguments);
			},

			OriginExternal: function () {
				return this.externalReferenceAllowed
					? this.ownerDocument
							.OriginExternalProvider()
							.GetExternalNodeByRefId(this.ReferenceId())
					: undefined;
			},

			ReferenceId: function (value) {
				if (this.externalReferenceAllowed) {
					if (value === undefined) {
						return this.internal.referenceId;
					} else {
						this.internal.referenceId = value;
						this.Attribute('ref-id', value);
					}
				}
			},

			isBlocked: function () {
				return this.AttributeExternal('isBlocked') === 'true';
			},

			isUpdatable: function () {
				if (this.externalReferenceAllowed) {
					var referenceProperties = this.internal.referenceProperties;
					var ignoreAllVersions =
						referenceProperties.ignoreAllVersions &&
						referenceProperties.ignoreAllVersions == '1';
					var isCurrent =
						!referenceProperties.isCurrent ||
						referenceProperties.isCurrent == '1';

					if (!ignoreAllVersions && !isCurrent) {
						var ignoredVersionId = referenceProperties.ignoredVersionId;

						return (
							!ignoredVersionId ||
							ignoredVersionId !== referenceProperties.latestVersionId
						);
					}
				}

				return false;
			},

			isExternal: function () {
				return true;
			},

			getReferenceProperty: function (propName) {
				return this.internal.referenceProperties[propName];
			},

			setReferenceProperty: function (propertyName, propertyValue) {
				if (this.externalReferenceAllowed && propertyName) {
					var referenceProperties = this.internal.referenceProperties;

					if (referenceProperties[propertyName] !== propertyValue) {
						referenceProperties[propertyName] = propertyValue;
						this.AttributeExternal(
							'referenceProperties',
							JSON.stringify(referenceProperties)
						);
					}
				}
			},

			setReferenceAllowedFlag: function (isAllowed) {
				this.externalReferenceAllowed = Boolean(isAllowed);
				this.internal.uidPrefix = this.externalReferenceAllowed
					? this.Uid() + ':'
					: '';
			},

			AttributeExternal: function (attributeName, newValue) {
				if (this.externalReferenceAllowed) {
					if (newValue === undefined) {
						return this._GetAttribute(this.OriginExternal(), attributeName);
					} else {
						this._SetAttribute(this.OriginExternal(), attributeName, newValue);
					}
				}
			},

			ConditionExternal: function () {
				return this.internal.conditionExternal;
			}
		}
	);
});
