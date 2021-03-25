define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasCellXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			RenderInnerContent: function (drawingItemsList, elementState) {
				let out = '';

				if (!drawingItemsList || !drawingItemsList.length) {
					out += '\uFEFF';
				} else {
					let blockRenderer;

					for (let i = 0; i < drawingItemsList.length; i++) {
						const childItem = drawingItemsList[i];
						const rowItem = childItem.Parent.Parent;
						const blockList = this._GetBlocksBetweenTableAndRow(rowItem);
						let contentPrefix = '';
						let contentPostfix = '';

						if (blockList.length) {
							blockRenderer =
								blockRenderer || this.factory.CreateRenderer(blockList[0]);

							for (let j = 0; j < blockList.length; j++) {
								const blockElement = blockList[j];

								contentPrefix += blockRenderer.RenderStartHtmlElement(
									blockElement,
									elementState
								);
								contentPostfix += blockRenderer.RenderEndHtmlElement(
									blockElement,
									elementState
								);
							}
						}

						out +=
							contentPrefix +
							this.factory
								.CreateRenderer(childItem)
								.RenderHtml(childItem, elementState) +
							contentPostfix;
					}
				}

				return out;
			},

			RenderHtml: function (schemaElement, parentState) {
				const elementState = this.prepareElementState(
					schemaElement,
					parentState
				);
				const tableElement = schemaElement.GetTable();
				const cellAttributes = this.GetAttributes(schemaElement, elementState);
				const isValidParent =
					schemaElement.Parent &&
					schemaElement.Parent.is('ArasRowXmlSchemaElement');
				let additionsClasses = '';
				let out = '';
				let childList;

				if (tableElement) {
					const drawingItemsContainer = tableElement.GetChildsOfCellForDrawing(
						schemaElement
					);
					const valign = schemaElement.Attribute('valign');
					const align = schemaElement.Attribute('align');

					if (drawingItemsContainer.height > 1) {
						cellAttributes.rowspan = drawingItemsContainer.height;
					}

					if (drawingItemsContainer.width > 1) {
						cellAttributes.colspan = drawingItemsContainer.width;
					}

					additionsClasses += valign ? ' valign_' + valign : '';
					additionsClasses += align ? ' align_' + align : '';
					childList = drawingItemsContainer.list;
				} else {
					childList = schemaElement.ChildItems().List();
					cellAttributes.width =
						(isValidParent
							? (100 / schemaElement.Parent.ChildItems().length()) | 0
							: '100') + '%';
				}

				if (!this._IsHiddenCell(tableElement, schemaElement)) {
					const tagName = isValidParent ? 'td' : 'div';
					// Validate if cell is merged to up or left cell
					out +=
						'<' +
						tagName +
						' id="' +
						schemaElement.Id() +
						'" class="' +
						this.GetClassList(schemaElement, elementState).join(' ') +
						additionsClasses +
						'" ' +
						this._getAttributesStringArray(cellAttributes).join(' ') +
						'>' +
						this.RenderInnerContent(childList, elementState) +
						'</' +
						tagName +
						'>';
				}

				return out;
			},

			_IsHiddenCell: function (tableElement, cellObject) {
				if (tableElement) {
					const rowObject = cellObject.Parent;
					const rowIndex = tableElement._GetRowIndex(rowObject);
					const cellIndex = rowObject.ChildItems().index(cellObject);

					return rowIndex !== null
						? tableElement
								._GetMergeMatrix()
								.ValidateMergeDraw(rowIndex, cellIndex)
						: false;
				}
			},

			_GetBlocksBetweenTableAndRow: function (rowObject) {
				const blocks = [];
				let parent = rowObject.Parent;

				while (parent && !parent.is('ArasTableXmlSchemaElement')) {
					blocks.push(parent);
					parent = parent.Parent;
				}

				return blocks.reverse();
			},

			GetTreeType: function (schemaElement, elementState) {
				return 'ArasCellXmlSchemaElementTreeNode';
			}
		}
	);
});
