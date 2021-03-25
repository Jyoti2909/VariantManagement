define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaExternalElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, generateRandomUuid, XmlSchemaExternalElement, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasBlockXmlSchemaElement',
		XmlSchemaExternalElement,
		{
			_childItems: null,
			_childItemsOnChangeHandle: null,
			_aras: null,

			constructor: function (args) {
				//if current block node was just created and no other properties set, initialize it as internal block
				if (this.origin) {
					var attributeValue = this.origin.getAttribute('by-reference');

					this.ByReference(
						attributeValue
							? this._getReferenceTypeByName(attributeValue)
							: Enums.ByReferenceType.Internal
					);
				}

				this._aras = this.ownerDocument._aras;
				this.registerType('ArasBlockXmlSchemaElement');
			},

			_parseOriginInternal: function () {
				this.inherited(arguments);

				if (this.isExternal()) {
					this.internal.blockProperties = JSON.parse(
						this.AttributeExternal('blockProperties')
					);
				}

				this.internal.blockProperties = this.internal.blockProperties || {};
			},

			_getReferenceTypeByName: function (typeName) {
				switch (typeName) {
					case 'internal':
						return Enums.ByReferenceType.Internal;
					case 'external':
						return Enums.ByReferenceType.External;
					default:
						return Enums.ByReferenceType.Unknown;
				}
			},

			_getOriginToParse: function () {
				if (this.isExternal()) {
					return this.OriginExternal();
				} else {
					return this.origin;
				}
			},

			BlockId: function () {
				return this.AttributeExternal('blockId');
			},

			isExternal: function () {
				return this.internal.referenceType == Enums.ByReferenceType.External;
			},

			_BlockProperties: function (value) {
				if (this.isExternal()) {
					if (value === undefined) {
						return this.AttributeExternal('blockProperties');
					} else {
						this.AttributeExternal('blockProperties', JSON.stringify(value));
					}
				} else {
					throw new Error(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.wrongsetblocknametointernalblock'
						)
					);
				}
			},

			setReferenceProperty: function (propertyName, propertyValue) {
				if (this.isExternal()) {
					this.inherited(arguments);
				}
			},

			isUpdatable: function () {
				if (this.isExternal()) {
					return this.inherited(arguments);
				}

				return false;
			},

			GetProperty: function (propName) {
				if (this.isExternal()) {
					return this.internal.blockProperties[propName];
				}
			},

			SetProperty: function (propName, propValue) {
				if (this.isExternal()) {
					var blockProperties = this.internal.blockProperties;

					if (blockProperties[propName] !== propValue) {
						blockProperties[propName] = propValue;
						this.AttributeExternal(
							'blockProperties',
							JSON.stringify(blockProperties)
						);
					}
				}
			},

			ByReference: function (value) {
				if (value === undefined) {
					return this.internal.referenceType;
				} else {
					switch (value) {
						case Enums.ByReferenceType.External:
							this.Attribute('by-reference', 'external');
							break;
						case Enums.ByReferenceType.Internal:
							this.Attribute('by-reference', 'internal');
							break;
						default:
							throw new Error(
								this._aras.getResource(
									'../Modules/aras.innovator.TDF',
									'viewmodel.byreferenceoutofrange'
								)
							);
					}

					this.internal.referenceType = value;
					this.setReferenceAllowedFlag(this.isExternal());
				}
			},

			MakeBlockInternal: function () {
				if (this.isExternal()) {
					var newConditions = this.ownerDocument
						.OptionalContent()
						.GetElementCondition(this);
					var newNode = this.OriginExternal().cloneNode(true);
					var newInternalBlock;

					newNode.setAttribute('by-reference', 'internal');
					newNode.removeAttribute('ref-id');
					newNode.removeAttribute('blockId');
					newNode.removeAttribute('blockProperties');
					newNode.removeAttribute('referenceProperties');

					this.ownerDocument.SuspendInvalidation();
					newInternalBlock = this.ownerDocument.CreateElement('element', {
						origin: newNode
					});
					newInternalBlock = newInternalBlock.Clone();
					newNode = newInternalBlock.Origin();

					//if current block is not part of document, then nothing to replace by reference
					if (this.Parent) {
						this.Parent.Origin().replaceChild(newNode, this.Origin());
					}
					this.origin = newNode;
					this.ByReference(Enums.ByReferenceType.Internal);
					this.parseOrigin();

					this.Condition(newConditions);
					this.ownerDocument
						.ExternalBlockHelper()
						.DropValidationCache(this.Id());
					this.ownerDocument.ResumeInvalidation();
				} else {
					throw new Error(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.externalonlyinlineblocks'
						)
					);
				}
			},

			MakeBlockExternal: function (newBlockProperties) {
				var newBlockId;

				newBlockProperties = newBlockProperties || {};

				if (this.ByReference() != Enums.ByReferenceType.Internal) {
					throw new Error(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.externalonlyinlineblocks'
						)
					);
				}

				this.ownerDocument.SuspendInvalidation();

				//We have to generate new set of XML Object Model in order to not be dependant on all existing Wrapped Objects which uses old origin nodes as origins
				//Because when old-Table is unregistered it cleanups MergeMatrix on old-origin-node
				var refId = this.ownerDocument
					.OriginExternalProvider()
					.InsertExternal(this.Origin().cloneNode(true));

				//create pointer to external block which will be added as part of content
				this.ReplaceOriginByPointerForExternalBlock(refId);

				//generate new blockId if old doesn't have them. In case when external block is added it has blockId, while existing internal block doesn't have blockId
				if (newBlockProperties._blockId) {
					newBlockId = newBlockProperties._blockId;

					this.AttributeExternal('blockId', newBlockId);
					this.AttributeExternal('aras:id', newBlockId);

					delete newBlockProperties._blockId;
				} else if (!this.AttributeExternal('blockId')) {
					newBlockId = generateRandomUuid().replace(/-/g, '').toUpperCase();

					this.AttributeExternal('blockId', newBlockId);
					this.AttributeExternal('aras:id', newBlockId);
				}

				this._BlockProperties(newBlockProperties);

				this.AttributeExternal('by-reference', 'external');

				//as soon as new origin set, we have to generate it's aras:id
				this._SetUid();

				this._parseOriginInternal();
				this.ownerDocument.ExternalBlockHelper().DropValidationCache(this.Id());
				this.ownerDocument.ResumeInvalidation();
			},

			ReplaceOriginByPointerForExternalBlock: function (refId) {
				var newBlockOrigin = this.ownerDocument
					.ContentGeneration()
					.ConstructElementOrigin('aras:block');

				//if current block is not part of document, then nothing to replace by reference
				if (this.Parent) {
					this.Parent.Origin().replaceChild(newBlockOrigin, this.origin);
				}

				//now current origin become just a pointer to external content
				this.origin = newBlockOrigin;

				this.ByReference(Enums.ByReferenceType.External);
				this.ReferenceId(refId);
				this.Attribute('condition', '');
			},

			_OnCloned: function () {
				this.inherited(arguments);
			},

			_OnClonedChildItems: function () {
				// we don't have to process child items during cloning parent, because parent is an external block
				if (!this.isExternal()) {
					this.inherited(arguments);
				}
			}
		}
	);
});
