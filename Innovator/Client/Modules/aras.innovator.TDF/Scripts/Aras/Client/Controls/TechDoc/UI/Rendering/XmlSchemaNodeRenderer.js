define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.XmlSchemaNodeRenderer',
		null,
		{
			_aras: null,
			_resourceStrings: {},
			factory: null,

			constructor: function (args) {
				this.factory = args.factory;
				this._aras = this.factory._viewmodel._aras;

				this.ResourceString(
					'nullText',
					'../Modules/aras.innovator.TDF',
					'rendering.nulltext'
				);
			},

			ResourceString: function (resourceKey, solutionName, stringKey) {
				if (resourceKey) {
					if (stringKey) {
						this._resourceStrings[resourceKey] =
							this._resourceStrings[resourceKey] ||
							this._aras.getResource(solutionName, stringKey);
					} else {
						return this._resourceStrings[resourceKey];
					}
				}
			},

			RenderHtml: function (/*WrappedObject*/ renderObject) {
				throw new Error('Need to be overrided');
			},

			GetAttributes: function () {
				throw new Error('Need to be overrided');
			},

			RenderInnerContent: function () {
				throw new Error('Need to be overrided');
			},

			GetDataTypeList: function (/*WrappedObject*/ renderObject) {
				return renderObject.getTypes();
			},

			GetClassList: function (/*WrappedObject*/ renderObject) {
				return renderObject.getTypes();
			},

			RenderModel: function (/*WrappedObject*/ renderObject) {
				throw new Error('Need to be overrided');
			},

			wrapInTag: function (sourceString, tagName, tagAttributes) {
				if (tagName) {
					var attributeString = '';

					if (tagAttributes) {
						var attributeValue;
						var attributeName;

						for (attributeName in tagAttributes) {
							attributeValue = tagAttributes[attributeName];

							if (attributeValue !== undefined) {
								attributeString +=
									' ' + attributeName + '="' + attributeValue + '"';
							}
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
			}
		}
	);
});
