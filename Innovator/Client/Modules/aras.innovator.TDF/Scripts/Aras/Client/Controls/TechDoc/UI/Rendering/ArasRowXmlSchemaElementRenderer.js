define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElementRenderer, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasRowXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			constructor: function (initialArguments) {
				this.ResourceString(
					'wrongCellCount',
					'../Modules/aras.innovator.TDF',
					'rendering.wrongnumberofcells'
				);
			},

			RenderHtml: function (schemaElement, parentState) {
				var out = '';

				if (schemaElement.Display() != Enums.DisplayType.Hidden) {
					var elementState = this.prepareElementState(
						schemaElement,
						parentState
					);
					var table = schemaElement.GetTable();
					var isBrokenRow;

					if (!schemaElement.IsRowHidden()) {
						isBrokenRow =
							table && table.IsBrokenCellsCount(schemaElement) ? true : false;

						out +=
							'<tr id="' +
							schemaElement.Id() +
							'" class="' +
							this.GetClassList(schemaElement, elementState).join(' ') +
							'" ' +
							this._getAttributesStringArray(
								this.GetAttributes(schemaElement, elementState)
							).join(' ') +
							'>' +
							(isBrokenRow
								? this._DrawBrokenRow(table, schemaElement)
								: this.RenderInnerContent(schemaElement, elementState)) +
							'</tr>';
					}

					out = table ? out : this._WrapInTable(out);
				}

				return out;
			},

			_DrawBrokenRow: function (table, row) {
				var colCount = table.ColsCount();
				var cellObj = row.ChildItems().get(0);

				return (
					'<td id="' +
					cellObj.Id() +
					'" class="ArasBrokenCellXmlSchemaElement" colspan="' +
					colCount +
					'">' +
					this.ResourceString('wrongCellCount') +
					'</td>'
				);
			},

			_WrapInTable: function (rowStr) {
				return (
					'<table class="ArasFakeTableXmlSchemaElement">' + rowStr + '</table>'
				);
			},

			GetTreeType: function (schemaElement, elementState) {
				return 'ArasRowXmlSchemaElementTreeNode';
			}
		}
	);
});
