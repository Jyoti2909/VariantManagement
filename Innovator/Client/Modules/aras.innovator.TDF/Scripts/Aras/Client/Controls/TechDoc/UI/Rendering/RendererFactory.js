define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaTextRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasBlockXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasTextXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasListXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasListItemXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasImageXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasItemXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasItemPropertyXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasTableXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasRowXmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasCellXmlSchemaElementRenderer'
], function (
	declare,
	XmlSchemaElementRenderer,
	XmlSchemaTextRenderer,
	ArasBlockXmlSchemaElementRenderer,
	ArasTextXmlSchemaElementRenderer,
	ArasListXmlSchemaElementRenderer,
	ArasListItemXmlSchemaElementRenderer,
	ArasImageXmlSchemaElementRenderer,
	ArasItemXmlSchemaElementRenderer,
	ArasItemPropertyXmlSchemaElementRenderer,
	ArasTableXmlSchemaElementRenderer,
	ArasRowXmlSchemaElementRenderer,
	ArasCellXmlSchemaElementRenderer
) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.RendererFactory',
		null,
		{
			_instances: null,
			_viewmodel: null,

			constructor: function (args) {
				var ctorArguments = { factory: this };

				this._viewmodel = args.viewmodel;
				this._instances = {
					XmlSchemaElement: new XmlSchemaElementRenderer(ctorArguments),
					XmlSchemaText: new XmlSchemaTextRenderer(ctorArguments),
					ArasBlockXmlSchemaElement: new ArasBlockXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasTextXmlSchemaElement: new ArasTextXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasListXmlSchemaElement: new ArasListXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasListItemXmlSchemaElement: new ArasListItemXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasImageXmlSchemaElement: new ArasImageXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasItemXmlSchemaElement: new ArasItemXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasItemPropertyXmlSchemaElement: new ArasItemPropertyXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasTableXmlSchemaElement: new ArasTableXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasRowXmlSchemaElement: new ArasRowXmlSchemaElementRenderer(
						ctorArguments
					),
					ArasCellXmlSchemaElement: new ArasCellXmlSchemaElementRenderer(
						ctorArguments
					)
				};
			},

			CreateRenderer: function (renderObject) {
				return renderObject
					? this._GetCustomRenderer(renderObject) ||
							this._GetDefaultRenderer(renderObject)
					: null;
			},

			_GetRendererByObjectAndType: function (renderObject, type) {
				if (!this._instances[type]) {
					var customXmlSchemaElement = this._viewmodel
						.Schema()
						.getXmlSchemaElement(type);

					if (customXmlSchemaElement && customXmlSchemaElement.renderer) {
						var defaultRenderer = this._GetDefaultRenderer(renderObject);
						/* jshint -W054 */
						var customRendererFunc = new Function(
							customXmlSchemaElement.renderer.code
						);
						/* jshint +W054 */
						var customRendererImplementation = customRendererFunc();
						var CustomRenderer = declare(
							'Aras.Client.Controls.TechDoc.UI.Rendering.' + type + 'Renderer',
							defaultRenderer.constructor,
							customRendererImplementation
						);

						this._instances[type] = new CustomRenderer({ factory: this });
					}
				}

				return this._instances[type];
			},

			_GetCustomRenderer: function (renderObject) {
				return this._GetRendererByObjectAndType(
					renderObject,
					renderObject.nodeName
				);
			},

			_GetDefaultRenderer: function (renderObject) {
				if (renderObject.is('ArasBlockXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasBlockXmlSchemaElement'
					);
				} else if (renderObject.is('ArasTextXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasTextXmlSchemaElement'
					);
				} else if (renderObject.is('ArasListItemXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasListItemXmlSchemaElement'
					);
				} else if (renderObject.is('ArasImageXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasImageXmlSchemaElement'
					);
				} else if (renderObject.is('ArasItemXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasItemXmlSchemaElement'
					);
				} else if (renderObject.is('ArasItemPropertyXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasItemPropertyXmlSchemaElement'
					);
				} else if (renderObject.is('ArasTableXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasTableXmlSchemaElement'
					);
				} else if (renderObject.is('ArasRowXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasRowXmlSchemaElement'
					);
				} else if (renderObject.is('ArasCellXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasCellXmlSchemaElement'
					);
				} else if (renderObject.is('ArasListXmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'ArasListXmlSchemaElement'
					);
				} else if (renderObject.is('XmlSchemaElement')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'XmlSchemaElement'
					);
				} else if (renderObject.is('XmlSchemaText')) {
					return this._GetRendererByObjectAndType(
						renderObject,
						'XmlSchemaText'
					);
				}
			}
		}
	);
});
