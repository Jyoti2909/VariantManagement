define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElementRenderer, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasTableXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			RenderInnerContent: function (rowList, elementState) {
				var out = '';
				var rowItem;
				var i;

				for (i = 0; i < rowList.length; i++) {
					rowItem = rowList[i];
					out += this.factory
						.CreateRenderer(rowItem)
						.RenderHtml(rowItem, elementState);
				}

				return out;
			},

			RenderHtml: function (schemaElement, parentState) {
				var out = '';

				if (schemaElement.Display() != Enums.DisplayType.Hidden) {
					var elementState = this.prepareElementState(
						schemaElement,
						parentState
					);
					var rowList = schemaElement.GetRowsList();

					out +=
						'<table id="' +
						schemaElement.Id() +
						'" class="' +
						this.GetClassList(schemaElement, elementState).join(' ') +
						'" ' +
						this._getAttributesStringArray(
							this.GetAttributes(schemaElement, elementState)
						).join(' ') +
						'>' +
						this._DrawColsForSetWidth(schemaElement) +
						this.RenderInnerContent(rowList, elementState) +
						'</table>';
				}

				return out;
			},

			_DrawColsForSetWidth: function (tableObject) {
				var widthList = tableObject.ColsWidth();
				var colStr = '';
				var i;

				for (i = 0; i < widthList.length; i++) {
					colStr += '<col width="' + widthList[i] + '%" />';
				}

				return colStr;
			},

			GetTreeType: function (schemaElement, elementState) {
				return 'ArasTableXmlSchemaElementTreeNode';
			}
		}
	);
});
