define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaExternalElement'
], function (declare, XmlSchemaExternalElement) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasImageXmlSchemaElement',
		XmlSchemaExternalElement,
		{
			_aras: null,

			constructor: function (args) {
				this._aras = this.ownerDocument._aras;
				this.referenceNodeName = 'aras:image';

				this.registerType('ArasImageXmlSchemaElement');
			},

			_parseOriginInternal: function () {
				this.inherited(arguments);

				this.internal.src = this.AttributeExternal('src');
				this.ImageId(this.AttributeExternal('imageId'));
			},

			Image: function (value) {
				var aras = this._aras;

				if (value === undefined) {
					var imageId = this.internal.imageId;

					if (imageId) {
						var imageItem = aras.newIOMItem('tp_Image', 'get');

						imageItem.setID(imageId);
						imageItem = imageItem.apply();

						return !imageItem.isError() && imageItem.node;
					}
				} else {
					var isDiscoverOnly = value.getAttribute('discover_only') === '1';
					var referenceProperties = {
						isCurrent: aras.getItemProperty(value, 'is_current'),
						majorVersion: aras.getItemProperty(value, 'major_rev'),
						minorVersion: aras.getItemProperty(value, 'generation')
					};

					this.ownerDocument.SuspendInvalidation();

					try {
						this.Src(!isDiscoverOnly ? aras.getItemProperty(value, 'src') : '');
						this.ImageId(aras.getItemProperty(value, 'id'));

						if (referenceProperties.isCurrent !== '1') {
							// search for latest item version
							var latestItemVersion = aras.newIOMItem(
								'tp_Image',
								'getItemLastVersion'
							);

							latestItemVersion.setID(aras.getItemProperty(value, 'id'));
							latestItemVersion = latestItemVersion.apply();

							if (!latestItemVersion.isError()) {
								referenceProperties.latestVersionId = latestItemVersion.getID();
							}
						}

						if (isDiscoverOnly) {
							this.AttributeExternal('isBlocked', 'true');
						}

						this.internal.referenceProperties = referenceProperties;
						this.AttributeExternal(
							'referenceProperties',
							JSON.stringify(referenceProperties)
						);
					} finally {
						this.ownerDocument.ResumeInvalidation();
					}
				}
			},

			ImageId: function (value) {
				if (value === undefined) {
					return this.internal.imageId;
				} else {
					this.internal.imageId = value;
					this.Attribute('imageId', value);
					this.AttributeExternal('imageId', value);
				}
			},

			Src: function (value) {
				if (value === undefined) {
					return this.internal.src;
				} else {
					this.internal.src = value;
					this.AttributeExternal('src', value);
				}
			},

			isEmpty: function () {
				return !Boolean(this.internal.imageId);
			}
		}
	);
});
