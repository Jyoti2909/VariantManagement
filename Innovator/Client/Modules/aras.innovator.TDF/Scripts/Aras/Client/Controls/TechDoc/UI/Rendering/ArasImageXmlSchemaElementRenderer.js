define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasImageXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			constructor: function (initialArguments) {
				this.ResourceString(
					'newItemVersionExists',
					'../Modules/aras.innovator.TDF',
					'rendering.newitemversionexists'
				);
				this.ResourceString(
					'imagePlaceholder',
					'../Modules/aras.innovator.TDF',
					'rendering.imageplaceholder'
				);
			},

			RenderInnerContent: function (schemaElement, elementState) {
				var out = '';

				if (!elementState.isEmpty) {
					if (!elementState.isBlocked) {
						var imageSrc = schemaElement.Src();

						if (imageSrc.toLowerCase().indexOf('vault:///?fileid=') === 0) {
							var fileId = imageSrc.replace(/vault:\/\/\/\?fileid=/i, '');
							imageSrc = this._aras.IomInnovator.getFileUrl(
								fileId,
								this._aras.Enums.UrlType.SecurityToken
							);
						} else {
							imageSrc = '../' + imageSrc;
						}

						out += '<img src="' + imageSrc + '"/>';
					} else {
						out += 'Content is blocked';
					}
				} else {
					out +=
						'<div class="ArasElementPlaceholder">' +
						this.ResourceString('imagePlaceholder') +
						'</div>';
				}

				return out;
			},

			GetTreeName: function (schemaElement, elementState) {
				var isUpdatable = elementState.isUpdatable;
				var namePostfix = isUpdatable
					? this.wrapInTag(
							' [' +
								schemaElement.getReferenceProperty('majorVersion') +
								'.' +
								schemaElement.getReferenceProperty('minorVersion') +
								']',
							'span',
							{ style: 'font-size:smaller;' }
					  )
					: '';
				var elementName = elementState.isBlocked
					? 'Image is blocked'
					: schemaElement.nodeName;
				var treeName = this.wrapInTag(elementName + namePostfix, 'span', {
					class: 'ArasXmlSchemaElementTypeNode',
					title: isUpdatable ? this.ResourceString('newItemVersionExists') : ''
				});

				return treeName;
			},

			GetTreeType: function (schemaElement, elementState) {
				return 'ArasImageXmlSchemaElementTreeNode';
			}
		}
	);
});
