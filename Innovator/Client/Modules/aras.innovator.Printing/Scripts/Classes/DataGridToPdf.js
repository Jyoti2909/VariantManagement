define(['./IconManager'], function (iconHelper) {
	function DataGridToPdf() {}

	DataGridToPdf.prototype = {};

	/////////////////////////////////////
	// hardCode constante for our grid //
	/////////////////////////////////////
	var headerHeight = 20; // height of header row
	var rowHeight = 19; // height of header row
	var searchBarHeight = 16; // height of searchBar
	var printMargin = 19;
	var pdfDocumentWidth = 842 - 2 * printMargin; //A4 ppt coming from pdf format

	/// <summary>
	/// Printing header of grid table and return headerInfo object.
	/// </summary>
	/// <param name="headerData" type="Array">Array of objects {label, width}, width = column width(like '48px')</param>
	/// <param name="doc" type="Object">jspdf document</param>
	/// <param name="pageCount" type="int">pdf page count</param>
	/// <returns name="headerInfo" type="Object">Information about header columns</returns>
	DataGridToPdf.printHeader = function (headerData, doc, pageCount) {
		var headerInfo = internalModule.getHeaderInformation(headerData);
		for (var pageIndex = 0; pageIndex < pageCount; pageIndex++) {
			if (pageIndex !== 0) {
				doc.addPage();
			}
			internalModule.setHeaderState(doc);
			internalModule.printHeaderOnPage(doc, headerInfo);
		}
		return headerInfo;
	};

	/// <summary>
	/// Printing grid searhBar.
	/// </summary>
	/// <param name="searchBarData" type="Array">Array of object{label, widget}, widget = widget class name</param>
	/// <param name="headerInfo" type="Object">Information about header columns</param>
	/// <param name="doc" type="Object">jspdf document</param>
	/// <param name="pageCount" type="int">pdf page count</param>
	DataGridToPdf.printSearchBar = function (
		searchBarData,
		headerInfo,
		doc,
		pageCount
	) {
		for (var pageIndex = 0; pageIndex < pageCount; pageIndex++) {
			internalModule.setSearchBarState(doc);
			internalModule.printSearchBarOnPage(
				doc,
				headerInfo,
				searchBarData,
				pageIndex
			);
		}
	};

	/// <summary>
	/// Printing grid rows.
	/// </summary>
	/// <param name="rowData" type="Array">Array of object {label, link, align, bgColor, selected}</param>
	/// <param name="headerInfo" type="Object">Information about header columns</param>
	/// <param name="doc" type="Object">jspdf document</param>
	/// <param name="pageCount" type="int">pdf page count</param>
	DataGridToPdf.printGridData = function (
		rowData,
		headerInfo,
		doc,
		recordsPerPage
	) {
		var startYPositionOnPage = headerInfo.printSearchBar
			? headerHeight + searchBarHeight + printMargin
			: headerHeight + printMargin;
		var startPositionY = startYPositionOnPage;
		internalModule.setBaseGridRowState(doc);

		for (var rowIndex = 0; rowIndex < rowData.length; ++rowIndex) {
			if (rowIndex % recordsPerPage === 0) {
				startPositionY = startYPositionOnPage;
			}
			internalModule.printRowOnPage(
				doc,
				rowData,
				headerInfo,
				recordsPerPage,
				rowIndex,
				startPositionY
			);
			startPositionY += rowHeight;
		}
		internalModule.printRightMargin(doc);
	};

	////////////////////////////////////////
	// Public API for hardCode properties //
	////////////////////////////////////////

	DataGridToPdf.getHeaderHeight = function () {
		return headerHeight;
	};

	DataGridToPdf.getRowHeight = function () {
		return rowHeight;
	};

	DataGridToPdf.getSearchBarHeight = function () {
		return searchBarHeight;
	};

	DataGridToPdf.getMargin = function () {
		return printMargin;
	};

	// helper for using private functions
	var internalModule = (function () {
		return {
			// convert named color to hex
			/* jshint ignore:start */
			colourNameToHex: function (colour) {
				var colours = {
					aliceblue: '#f0f8ff',
					antiquewhite: '#faebd7',
					aqua: '#00ffff',
					aquamarine: '#7fffd4',
					azure: '#f0ffff',
					beige: '#f5f5dc',
					bisque: '#ffe4c4',
					black: '#000000',
					blanchedalmond: '#ffebcd',
					blue: '#0000ff',
					blueviolet: '#8a2be2',
					brown: '#a52a2a',
					burlywood: '#deb887',
					cadetblue: '#5f9ea0',
					chartreuse: '#7fff00',
					chocolate: '#d2691e',
					coral: '#ff7f50',
					cornflowerblue: '#6495ed',
					cornsilk: '#fff8dc',
					crimson: '#dc143c',
					cyan: '#00ffff',
					darkblue: '#00008b',
					darkcyan: '#008b8b',
					darkgoldenrod: '#b8860b',
					darkgray: '#a9a9a9',
					darkgreen: '#006400',
					darkkhaki: '#bdb76b',
					darkmagenta: '#8b008b',
					darkolivegreen: '#556b2f',
					darkorange: '#ff8c00',
					darkorchid: '#9932cc',
					darkred: '#8b0000',
					darksalmon: '#e9967a',
					darkseagreen: '#8fbc8f',
					darkslateblue: '#483d8b',
					darkslategray: '#2f4f4f',
					darkturquoise: '#00ced1',
					darkviolet: '#9400d3',
					deeppink: '#ff1493',
					deepskyblue: '#00bfff',
					dimgray: '#696969',
					dodgerblue: '#1e90ff',
					firebrick: '#b22222',
					floralwhite: '#fffaf0',
					forestgreen: '#228b22',
					fuchsia: '#ff00ff',
					gainsboro: '#dcdcdc',
					ghostwhite: '#f8f8ff',
					gold: '#ffd700',
					goldenrod: '#daa520',
					gray: '#808080',
					green: '#008000',
					greenyellow: '#adff2f',
					honeydew: '#f0fff0',
					hotpink: '#ff69b4',
					'indianred ': '#cd5c5c',
					indigo: '#4b0082',
					ivory: '#fffff0',
					khaki: '#f0e68c',
					lavender: '#e6e6fa',
					lavenderblush: '#fff0f5',
					lawngreen: '#7cfc00',
					lemonchiffon: '#fffacd',
					lightblue: '#add8e6',
					lightcoral: '#f08080',
					lightcyan: '#e0ffff',
					lightgoldenrodyellow: '#fafad2',
					lightgrey: '#d3d3d3',
					lightgreen: '#90ee90',
					lightpink: '#ffb6c1',
					lightsalmon: '#ffa07a',
					lightseagreen: '#20b2aa',
					lightskyblue: '#87cefa',
					lightslategray: '#778899',
					lightsteelblue: '#b0c4de',
					lightyellow: '#ffffe0',
					lime: '#00ff00',
					limegreen: '#32cd32',
					linen: '#faf0e6',
					magenta: '#ff00ff',
					maroon: '#800000',
					mediumaquamarine: '#66cdaa',
					mediumblue: '#0000cd',
					mediumorchid: '#ba55d3',
					mediumpurple: '#9370d8',
					mediumseagreen: '#3cb371',
					mediumslateblue: '#7b68ee',
					mediumspringgreen: '#00fa9a',
					mediumturquoise: '#48d1cc',
					mediumvioletred: '#c71585',
					midnightblue: '#191970',
					mintcream: '#f5fffa',
					mistyrose: '#ffe4e1',
					moccasin: '#ffe4b5',
					navajowhite: '#ffdead',
					navy: '#000080',
					oldlace: '#fdf5e6',
					olive: '#808000',
					olivedrab: '#6b8e23',
					orange: '#ffa500',
					orangered: '#ff4500',
					orchid: '#da70d6',
					palegoldenrod: '#eee8aa',
					palegreen: '#98fb98',
					paleturquoise: '#afeeee',
					palevioletred: '#d87093',
					papayawhip: '#ffefd5',
					peachpuff: '#ffdab9',
					peru: '#cd853f',
					pink: '#ffc0cb',
					plum: '#dda0dd',
					powderblue: '#b0e0e6',
					purple: '#800080',
					red: '#ff0000',
					rosybrown: '#bc8f8f',
					royalblue: '#4169e1',
					saddlebrown: '#8b4513',
					salmon: '#fa8072',
					sandybrown: '#f4a460',
					seagreen: '#2e8b57',
					seashell: '#fff5ee',
					sienna: '#a0522d',
					silver: '#c0c0c0',
					skyblue: '#87ceeb',
					slateblue: '#6a5acd',
					slategray: '#708090',
					snow: '#fffafa',
					springgreen: '#00ff7f',
					steelblue: '#4682b4',
					tan: '#d2b48c',
					teal: '#008080',
					thistle: '#d8bfd8',
					tomato: '#ff6347',
					turquoise: '#40e0d0',
					violet: '#ee82ee',
					wheat: '#f5deb3',
					white: '#ffffff',
					whitesmoke: '#f5f5f5',
					yellow: '#ffff00',
					yellowgreen: '#9acd32'
				};

				if (typeof colours[colour.toLowerCase()] != 'undefined') {
					return colours[colour.toLowerCase()];
				}

				return false;
			},
			/* jshint ignore:end */

			// difficult function calculate width and position columns and cells
			getHeaderInformation: function (headerData) {
				// the clippingPadding variable is contained in jspdf.plugin.text.js.
				// In this method it is used in order not to display cells of smaller width than the clippingPadding
				var clippingPadding = 1.8;
				var colSizePerPage = []; // aray of "colOnPage"
				var currentWidth = 0;
				var internalPadding = 4.4;
				var colOnPage = []; // aray of width columns on current page
				for (var i = 0; i < headerData.length; ++i) {
					var cellWidth =
						this.convertSizeToPt(headerData[i].width) + internalPadding;
					var cellLabel =
						headerData[i].label !== '&nbsp;' ? headerData[i].label : '';

					currentWidth += cellWidth;
					if (currentWidth > pdfDocumentWidth) {
						var currentPageWidth =
							(currentWidth - cellWidth) % pdfDocumentWidth;
						var widthOnPage = Math.min(
							pdfDocumentWidth - currentPageWidth,
							cellWidth
						);
						// if cell is very big, we will divide it
						if (cellWidth > pdfDocumentWidth) {
							colOnPage.push({
								width: widthOnPage,
								startPosition: 0,
								label: cellLabel,
								columnIndex: i,
								overlapping: true,
								baseWidth: cellWidth
							});
							colSizePerPage.push(colOnPage);
							colOnPage = [];
							var drawPosition = widthOnPage;
							while (drawPosition < cellWidth) {
								widthOnPage =
									cellWidth - drawPosition > pdfDocumentWidth
										? pdfDocumentWidth
										: cellWidth - drawPosition;
								colOnPage.push({
									width: widthOnPage,
									startPosition: drawPosition,
									label: cellLabel,
									columnIndex: i,
									overlapping: true,
									baseWidth: cellWidth
								});
								drawPosition += pdfDocumentWidth;
								if (drawPosition < cellWidth) {
									colSizePerPage.push(colOnPage);
									colOnPage = [];
								}
							}
						} else {
							if (Math.round(widthOnPage - clippingPadding) > 0) {
								colOnPage.push({
									width: widthOnPage,
									startPosition: 0,
									label: cellLabel,
									columnIndex: i,
									overlapping: true,
									baseWidth: cellWidth
								});
							}
							if (currentPageWidth + cellWidth > pdfDocumentWidth) {
								colSizePerPage.push(colOnPage);
								colOnPage = [];
								if (Math.round(cellWidth - widthOnPage - clippingPadding) > 0) {
									colOnPage.push({
										width: cellWidth - widthOnPage,
										startPosition: widthOnPage,
										label: cellLabel,
										columnIndex: i,
										overlapping: true,
										baseWidth: cellWidth
									});
								}
							}
						}
					} else {
						colOnPage.push({
							width: cellWidth,
							startPosition: 0,
							label: cellLabel,
							columnIndex: i
						});
					}
				}
				colSizePerPage.push(colOnPage);
				return colSizePerPage;
			},

			setSearchBarState: function (doc) {
				doc.setFillColor(221, 231, 245);
				doc.setFontSize(10);
				doc.setTextColor(68, 68, 68);
				doc.setDrawColor(204, 204, 204);
			},

			setHeaderState: function (doc) {
				doc.setFillColor(230, 230, 230);
				doc.setFontSize(10);
				doc.setTextColor(68, 68, 68);
				doc.setDrawColor(204, 204, 204);
			},

			convertSizeToPt: function (value) {
				value = value.replace('!important', '');
				if (value.indexOf('px') > -1) {
					var px = parseInt(value.replace('px', ''));
					return (px * 72) / 96;
				} else if (value.indexOf('em') > -1) {
					var em = parseFloat(value.replace('em', ''));
					return em * 9;
				} else {
					return value.replace('pt', '');
				}
			},

			// Printing Searh Bar
			printSearchBarOnPage: function (
				doc,
				headerInfo,
				searchBarData,
				pageIndex
			) {
				var startPositionY = printMargin + headerHeight;
				for (var i = 0; i < headerInfo.length; ++i) {
					var startPositionX = printMargin;
					var pageNumber = pageIndex * headerInfo.length + (i + 1);
					doc.setPage(pageNumber);
					internalModule.setSearchBarState(doc);
					for (var j = 0; j < headerInfo[i].length; ++j) {
						var cellInfo = headerInfo[i][j];
						doc.rect(
							startPositionX,
							startPositionY,
							cellInfo.width,
							searchBarHeight,
							'FD'
						);
						var label = searchBarData[cellInfo.columnIndex].label;
						var widgetName = searchBarData[cellInfo.columnIndex].widget;
						var align =
							widgetName ===
							'Aras.Client.Controls.Experimental._grid.CheckedMultiSelect'
								? 'center'
								: 'left';
						doc.drawClippedText(
							startPositionX,
							startPositionY,
							cellInfo.width - 17,
							searchBarHeight,
							label,
							align,
							true
						);

						if (cellInfo.columnIndex === 0) {
							doc.setFillColor(126, 172, 242);
							doc.triangle(
								printMargin + 8,
								startPositionY + 6,
								printMargin + 14,
								startPositionY + 6,
								printMargin + 11,
								startPositionY + 10,
								'F'
							);
							internalModule.setSearchBarState(doc);
						}

						switch (widgetName) {
							case 'dijit.form.ComboBox':
								iconHelper.drawImage(
									doc,
									'comboBox',
									startPositionX + cellInfo.width - 16,
									startPositionY,
									72
								);
								break;
							case 'dijit.form.DateTextBox':
								iconHelper.drawImage(
									doc,
									'calendar',
									startPositionX + cellInfo.width - 16,
									startPositionY,
									72
								);
								break;
							case 'dijit.form.FilteringSelect':
								iconHelper.drawImage(
									doc,
									'filter',
									startPositionX + cellInfo.width - 16,
									startPositionY,
									72
								);
								break;
							case 'Aras.Client.Controls.Experimental._grid.CheckedMultiSelect':
								iconHelper.drawImage(
									doc,
									'filter',
									startPositionX + cellInfo.width - 16,
									startPositionY,
									72
								);
								break;
						}

						startPositionX += cellInfo.width;
						internalModule.setSearchBarState(doc);
					}
				}
			},

			setBaseGridRowState: function (doc) {
				doc.setFontSize(9);
				doc.setTextColor(68, 68, 68);
				doc.setDrawColor(204, 204, 204);
			},

			setBackgroundColor: function (doc, rowIndex, color, rowColor) {
				if (color) {
					var hex;
					color = color.replace('!important', '');
					hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
					if (hex) {
						doc.setFillColor(
							parseInt(hex[1], 16),
							parseInt(hex[2], 16),
							parseInt(hex[3], 16)
						);
						return;
					} else {
						var hexColor = this.colourNameToHex(color);
						if (hexColor) {
							hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
							doc.setFillColor(
								parseInt(hex[1], 16),
								parseInt(hex[2], 16),
								parseInt(hex[3], 16)
							);
							return;
						}
					}
				}

				if (rowColor) {
					doc.setFillColor(248, 238, 192);
					return;
				}

				if (rowIndex % 2 === 0) {
					doc.setFillColor(255, 255, 255);
				} else {
					doc.setFillColor(246, 246, 246);
				}
			},

			printIcon: function (
				doc,
				startPositionX,
				startPositionY,
				width,
				hight,
				label,
				align
			) {
				var padding = 3;
				var imageSize = 13.5;
				var clippingArea = width - 2 * padding;
				var yCoordinate = hight / 2 - imageSize / 2;

				var iconName = '';
				var regex = /^<img.*?src='(.*?)'|^<img.*?src=\"(.*?)\"/;
				var srcArray = regex.exec(label);
				var src = srcArray[1] ? srcArray[1] : srcArray[2];
				var lastIndex = src.lastIndexOf('/');
				iconName = lastIndex > -1 ? src.substring(lastIndex + 1) : src;

				lastIndex = iconName.lastIndexOf('.');
				iconName = lastIndex > -1 ? iconName.substring(0, lastIndex) : iconName;

				if (align === 'center') {
					var offset = clippingArea / 2 - imageSize / 2;
					iconHelper.drawImage(
						doc,
						iconName,
						startPositionX + padding + offset,
						startPositionY + yCoordinate
					);
				} else if (align === 'right') {
					iconHelper.drawImage(
						doc,
						iconName,
						startPositionX + padding,
						startPositionY + yCoordinate
					);
				} else {
					iconHelper.drawImage(
						doc,
						iconName,
						startPositionX + padding,
						startPositionY + yCoordinate
					);
				}
			},

			printCheckBox: function (
				doc,
				startPositionX,
				startPositionY,
				width,
				hight,
				label,
				align
			) {
				var padding = 3;
				var checkBoxSize = 10.5;
				var clippingArea = width - 2 * padding;
				var yCoordinate = hight / 2 - checkBoxSize / 2;
				var name =
					label.toString() === 'true' ? 'checkBoxChecked' : 'checkBoxUnchecked';

				if (align === 'center') {
					var offset = clippingArea / 2 - checkBoxSize / 2;
					iconHelper.drawImage(
						doc,
						name,
						startPositionX + padding + offset,
						startPositionY + yCoordinate,
						52
					);
				} else if (align === 'right') {
					iconHelper.drawImage(
						doc,
						name,
						startPositionX + width - padding - checkBoxSize,
						startPositionY + yCoordinate,
						52
					);
				} else {
					iconHelper.drawImage(
						doc,
						name,
						startPositionX + padding,
						startPositionY + yCoordinate,
						52
					);
				}
			},

			printLink: function (
				doc,
				startPositionX,
				startPositionY,
				width,
				hight,
				link,
				align,
				style
			) {
				if (!style.color) {
					// set default link color (blue)
					doc.setTextColor(54, 104, 177);
				}

				// if css font-size is not found then we will use default link size for grid = 8pt
				var fontSize = style['font-size'] ? doc.internal.getFontSize() : 8;
				doc.drawLink(
					startPositionX,
					startPositionY,
					width,
					hight,
					link,
					align,
					fontSize,
					true
				);
			},

			printRightMargin: function (doc) {
				var i = 1;
				while (doc.pageExist(i)) {
					doc.setPage(i);
					doc.setFillColor(255, 255, 255);
					doc.setDrawColor(255, 255, 255);
					doc.rect(
						pdfDocumentWidth + printMargin,
						0,
						printMargin,
						doc.internal.pageSize.height,
						'F'
					);
					i++;
				}
			},

			printHeaderOnPage: function (doc, headerInfo) {
				var startPositionX;
				var startPositionY = printMargin;
				for (var i = 0; i < headerInfo.length; ++i) {
					startPositionX = printMargin;
					if (i !== 0) {
						doc.addPage();
						internalModule.setHeaderState(doc);
					}

					for (var j = 0; j < headerInfo[i].length; ++j) {
						var cellInfo = headerInfo[i][j];
						doc.rect(
							startPositionX,
							startPositionY,
							cellInfo.width,
							headerHeight,
							'FD'
						);
						var label = cellInfo.label ? cellInfo.label : '';
						doc.drawClippedText(
							startPositionX,
							startPositionY,
							cellInfo.width,
							headerHeight,
							label,
							'center',
							true
						);
						startPositionX += cellInfo.width;
						internalModule.setHeaderState(doc);
					}
				}
			},

			setStyles: function (doc, style) {
				if (style.color) {
					style.color = style.color.replace('!important', '');
					var hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
						style.color
					);
					if (hex) {
						doc.setTextColor(
							parseInt(hex[1], 16),
							parseInt(hex[2], 16),
							parseInt(hex[3], 16)
						);
					} else {
						var hexColor = this.colourNameToHex(style.color);
						if (hexColor) {
							hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
							doc.setTextColor(
								parseInt(hex[1], 16),
								parseInt(hex[2], 16),
								parseInt(hex[3], 16)
							);
						} else {
							doc.setTextColor(68, 68, 68);
						}
					}
				} else {
					doc.setTextColor(68, 68, 68);
				}

				if (style['font-size']) {
					doc.setFontSize(this.convertSizeToPt(style['font-size']));
				} else {
					doc.setFontSize(9);
				}

				try {
					if (style['font-weight']) {
						doc.setFontType(style['font-weight']);
					} else {
						if (style['font-style']) {
							doc.setFontType(style['font-style']);
						} else {
							doc.setFontType('normal');
						}
					}
				} catch (e) {
					doc.setFontType('normal');
				}
			},

			getObjectType: function (obj) {
				if (typeof obj.label === 'boolean') {
					return 'boolean';
				}

				if (typeof obj.label === 'number') {
					return 'number';
				}

				if (obj.link) {
					return 'link';
				}

				if (!obj.label) {
					return null;
				}

				if (obj.label.indexOf('<img') > -1) {
					var regex = /^<img.*?src='(.*?)'|^<img.*?src=\"(.*?)\"/;
					var src = regex.exec(obj.label);
					if (src === null) {
						return 'html';
					}
					if (!src[1] && !src[2]) {
						return 'null';
					} else {
						return 'icon';
					}
				}

				if (
					obj.label.indexOf('<html>') > -1 &&
					obj.label.indexOf('</html>') > -1
				) {
					return 'html';
				}

				return 'string';
			},

			printRowOnPage: function (
				doc,
				rowData,
				headerInfo,
				recordsPerPage,
				rowIndex,
				startPositionY
			) {
				for (var i = 0; i < headerInfo.length; ++i) {
					var startPositionX = printMargin;
					var pageIndex =
						Math.floor(rowIndex / recordsPerPage) * headerInfo.length + (i + 1);
					doc.setPage(pageIndex);

					for (var j = 0; j < headerInfo[i].length; ++j) {
						var cellInfo = headerInfo[i][j];
						var cellObj = rowData[rowIndex][cellInfo.columnIndex];
						this.setBackgroundColor(
							doc,
							rowIndex,
							cellObj.style['background-color'],
							cellObj.selected
						);
						this.setStyles(doc, cellObj.style);
						doc.rect(
							startPositionX,
							startPositionY,
							cellInfo.width,
							rowHeight,
							'FD'
						);
						var label = cellObj.label;
						var type = this.getObjectType(
							rowData[rowIndex][cellInfo.columnIndex]
						);

						switch (type) {
							case 'boolean':
								this.printCheckBox(
									doc,
									startPositionX,
									startPositionY,
									cellInfo.width,
									rowHeight,
									label,
									cellObj.align
								);
								break;
							case 'icon':
								this.printIcon(
									doc,
									startPositionX,
									startPositionY,
									cellInfo.width,
									rowHeight,
									label,
									cellObj.align
								);
								break;
							case 'link':
								this.printLink(
									doc,
									startPositionX,
									startPositionY,
									cellInfo.width,
									rowHeight,
									label,
									cellObj.align,
									cellObj.style
								);
								this.setBaseGridRowState(doc);
								break;
							case 'html':
								doc.drawClippedText(
									startPositionX,
									startPositionY,
									cellInfo.width,
									rowHeight,
									label.replace(/\n/g, ' '),
									cellObj.align,
									true
								);
								break;
							case 'null':
								break;
							case 'number':
							case 'string':
								if (cellInfo.overlapping) {
									doc.drawOverlappingText(
										startPositionX,
										startPositionY,
										cellInfo.width,
										rowHeight,
										label.toString(),
										cellObj.align,
										cellInfo.startPosition,
										'pt',
										cellInfo.baseWidth
									);
								} else {
									doc.drawClippedText(
										startPositionX,
										startPositionY,
										cellInfo.width,
										rowHeight,
										label.toString(),
										cellObj.align,
										true
									);
								}
								break;
						}

						startPositionX += cellInfo.width;
					}
				}
			}
		};
	})();
	return DataGridToPdf;
});
