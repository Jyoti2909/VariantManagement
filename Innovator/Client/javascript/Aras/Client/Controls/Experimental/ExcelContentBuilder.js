define([
	'dojo/_base/declare',
	'dojo/_base/config',
	'dojox/grid/_Builder',
	'dojox/grid/util',
	'./GridModules'
], function (declare, config, _Builder, util, GridModules) {
	return declare(
		'Aras.Client.Controls.Experimental.ExcelContentBuilder',
		_Builder._Builder,
		{
			update: function () {
				this.prepareHtml();
			},

			prepareHtml: function () {
				var row = this.view.structure.cells[0];
				for (var i = 0, cell; (cell = row[i]); i++) {
					if (!this.grid.editable && cell.editable) {
						this.grid.editable = true;
					}
				}
			},

			_formatCellForEdit: function (
				tdNode,
				value,
				column,
				inRowIndex,
				cellIndex
			) {
				column.needFormatNode(value, inRowIndex);

				var child = tdNode.ownerDocument.createElement('div');
				tdNode.appendChild(child);
			},

			_formatCellDefault: function (
				tdNode,
				value,
				column,
				inRowIndex,
				cellIndex
			) {
				// if you need implement some new functionality see GridModules.formatter method
				var cellTopIndent = 4,
					cellBottomIndent = 4,
					defaultValue = '...',
					i;

				if (
					column.externalWidget &&
					column.externalWidget.functionalFlags.render
				) {
					column.externalWidget.appendWidgetHTML(
						tdNode,
						column,
						inRowIndex,
						cellIndex,
						value
					);
				} else if (/^<checkbox\ state\=\"\d?\"\/>$/.test(value)) {
					var isChecked =
							value.match(/^<checkbox\ state\=\"(\d?)\"\/>$/)[1] === '1'
								? true
								: false,
						containerNode = tdNode.ownerDocument.createElement('div'),
						checkBoxNode = tdNode.ownerDocument.createElement('input');

					containerNode.setAttribute('class', 'checkBoxContainer');
					checkBoxNode.setAttribute('type', 'checkbox');
					checkBoxNode.setAttribute('class', 'arasCheckboxOrRadio prop_bool');
					checkBoxNode.setAttribute(
						'onclick',
						'( function(e){ e.target.isCheckBox = true; e.preventDefault(); return false;} )(event)'
					);
					if (isChecked) {
						checkBoxNode.setAttribute('checked', 'checked');
					}

					containerNode.appendChild(checkBoxNode);
					containerNode.appendChild(
						tdNode.ownerDocument.createElement('label')
					);
					tdNode.appendChild(containerNode);
				} else if (/^[&lt;<]img src=["']([^'"]*)['"]/.test(value)) {
					var img = tdNode.ownerDocument.createElement('img'),
						defaultRowHeight = 26,
						maxSize = defaultRowHeight - (cellTopIndent + cellBottomIndent);

					value = value
						.substring(value.indexOf('"'), value.length - 3)
						.replace('"', '');
					styleImg =
						'margin: 0px; max-height: ' +
						maxSize +
						'px; max-width: ' +
						maxSize +
						'px;';
					if (value) {
						img.setAttribute('style', styleImg);
						var vaultReg = new RegExp('vault:///\\?fileid\\=', 'i');
						var imgSrc;
						if (vaultReg.exec(value)) {
							var fileId = value.replace(vaultReg, '');
							imgSrc = aras.IomInnovator.getFileUrl(
								fileId,
								aras.Enums.UrlType.SecurityToken
							);
						} else {
							imgSrc = value.replace(
								/((?!http[s]*:\/\/))/,
								'$1' + config.baseUrl + '../../cbin/'
							);
						}
						img.setAttribute('src', imgSrc);
						tdNode.appendChild(img);
					}
				} else if (column.optionsLables && column.optionsLables.length) {
					if ('CheckedMultiSelect' === column.editableType) {
						if (value && value !== '') {
							var valueArray = value.split(',');

							tdNode.text =
								column.optionsLables[column.options.indexOf(valueArray[0])];
							for (i = 1; i < valueArray.length; i++) {
								tdNode.text +=
									', ' +
									column.optionsLables[column.options.indexOf(valueArray[i])];
							}
						} else {
							tdNode.text = '';
						}
					} else {
						tdNode.text =
							column.optionsLables[column.options.indexOf(value)] || value;
					}
				} else if (column.sort === 'NUMERIC' || column.sort === 'DATE') {
					tdNode.text = column.convertFromNeutral(value);
				} else if (typeof value == 'undefined') {
					tdNode.text = defaultValue;
				} else {
					var textLines = value.split('\n'),
						textNode;

					for (i = 0; i < textLines.length; i++) {
						textNode = tdNode.ownerDocument.createElement('div');
						textNode.setAttribute(
							'class',
							i === 0 ? 'cellFirstMultilineNode' : 'cellMultilineNode'
						);
						textNode.text = textLines[i] || '\u200B';
						tdNode.appendChild(textNode);
					}
				}
			},

			generateHtml: function (inDataIndex, inRowIndex) {
				var cells = this.grid.layout.cells,
					editInfo = this.grid.edit.info,
					item = this.grid.getItem(inRowIndex),
					itemXML = this.grid.store.getValue(item, 'rowItemXML', ''),
					countRowsInRows = this.grid.map.getRowsCountInCurrentRow(inRowIndex),
					tableNode,
					trNode,
					inputDom = new XmlDocument(),
					outputDom = new XmlDocument(),
					inlineStyle = '',
					self = this,
					idx = 0;

				function rec(parentItem, columnIndex) {
					var rowSpan = 0,
						tdNodes = [],
						properties = parentItem.selectNodes('./prop'),
						property,
						propertyName,
						propertyValue,
						value,
						cell,
						isCellEditing,
						isCellFocused,
						cellCssClasses,
						cellCssStyles,
						tdNode,
						i;

					for (i = 0; i < properties.length; i++) {
						cell = cells[columnIndex];
						tdNode = outputDom.createElement('td');
						property = properties[i];
						value = property.text;
						isCellEditing =
							cell.editable &&
							editInfo.rowIndex === inRowIndex &&
							editInfo.cellIndex === idx;
						isCellFocused =
							self.grid.focus.rowIndex === inRowIndex &&
							self.grid.focus.cellIndex === idx;
						cellCssClasses = 'dojoxGridCell';
						cellCssClasses += isCellFocused
							? ' ' + self.grid.focus.focusClass
							: '';

						if (isCellEditing) {
							self._formatCellForEdit(
								tdNode,
								editInfo.value || value,
								cell,
								inRowIndex,
								idx
							);
						} else {
							self._formatCellDefault(tdNode, value, cell, inRowIndex, idx);
						}

						if (cell.customClasses) {
							cellCssClasses += ' ' + cell.customClasses;
						}

						tdNode.setAttribute('tabIndex', '-1');
						tdNode.setAttribute('role', 'gridcell');
						if (self.grid.editable && !cell.editable) {
							tdNode.setAttribute('aria-readonly', 'true');
						}

						tdNode.setAttribute('class', cellCssClasses);
						tdNode.setAttribute('idx', idx);
						tdNode.setAttribute('col', columnIndex);

						// cell style settings
						var tdStyle = cell.hidden
							? 'width: 0px; display: none;'
							: 'width: ' + cell.unitWidth + ';';
						cellCssStyles = isCellEditing
							? {}
							: GridModules._parseCSS(property.getAttribute('css'));

						// editing cell should keep default style
						if (isCellEditing) {
							cellCssStyles['background-color'] = '#FFFFFF';
						} else {
							var styleAttribute = property.getAttribute('bgColor');

							if (styleAttribute) {
								cellCssStyles['background-color'] = styleAttribute;
							}

							styleAttribute = property.getAttribute('textColor');
							if (styleAttribute) {
								cellCssStyles.color = styleAttribute;
							}

							styleAttribute = property.getAttribute('font');
							if (styleAttribute) {
								var fontParts = font.split('-'),
									fontProperty;

								if (fontParts.length > 1) {
									//this code was added for supporting a font string like Name-style-size [examples: Courier-bold-12]
									//as it was implemented in XControls\TreeTable\Cell.cs
									delete cellCssStyles.font;

									cellCssStyles['font-family'] = fontParts[0];
									fontProperty = fontParts[fontParts.length - 1];
									cellCssStyles['font-size'] = !isNaN(parseFloat(fontProperty))
										? fontProperty + 'pt'
										: cellCssStyles['font-size'];

									fontProperty = fontParts[1];
									cellCssStyles['font-style'] =
										fontProperty.indexOf('italic') > -1
											? 'italic'
											: cellCssStyles['font-style'];
									cellCssStyles['font-weight'] =
										fontProperty.indexOf('bold') > -1
											? 'bold'
											: cellCssStyles['font-weight'];
								}
							}
						}

						for (propertyName in cellCssStyles) {
							propertyValue = cellCssStyles[propertyName];
							if (propertyValue) {
								propertyValue +=
									propertyValue.indexOf('!important') == -1
										? ' !important'
										: '';
								tdStyle += propertyName + ':' + propertyValue + ';';
							}
						}

						var tdChildNode = tdNode.childNodes[0];
						if (tdChildNode && tdChildNode.tagName == 'div') {
							tdChildNode.setAttribute('style', tdStyle);
						}

						tdNode.setAttribute('style', tdStyle);
						trNode.appendChild(tdNode);
						tdNodes.push(tdNode);
						idx++;
						columnIndex++;
					}

					var childItems = parentItem.selectNodes('./Item');
					if (childItems.length === 0) {
						return 1;
					} else {
						for (i = 0; i < childItems.length; i++) {
							if (i > 0) {
								trNode = outputDom.createElement('tr');
								tableNode.appendChild(trNode);
							}
							rowSpan += rec(childItems[i], columnIndex);
						}
					}

					if (rowSpan > 1) {
						for (i = 0; i < tdNodes.length; i++) {
							tdNodes[i].setAttribute('rowspan', rowSpan);
						}
					}
					return rowSpan;
				}

				util.fire(this.view, 'onBeforeRow', [inRowIndex, cells]);

				if (countRowsInRows !== 0) {
					inlineStyle = ' style="height: ' + 26 * countRowsInRows + 'px;"';
				}
				outputDom.loadXML(
					'<table' +
						inlineStyle +
						' class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"></table>'
				);

				tableNode = outputDom.firstChild;
				trNode = outputDom.createElement('tr');
				tableNode.appendChild(trNode);

				inputDom.loadXML(itemXML);
				rec(inputDom.firstChild, 0);

				return outputDom.xml;
			},

			decorateEvent: function (e) {
				e.rowNode = this.findRowTarget(e.target);
				if (!e.rowNode) {
					return false;
				}
				e.rowIndex = e.rowNode[util.rowIndexTag];
				this.baseDecorateEvent(e);
				var colIndex = this.grid.map.getColumnIndexByStoreRowIndexAndStoreCellIndex(
					e.rowIndex,
					e.cellIndex
				);
				e.cell = this.grid.getCell(colIndex);
				return true; // Boolean
			}
		}
	);
});
