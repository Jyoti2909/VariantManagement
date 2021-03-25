define([], function () {
	'use strict';
	var pdfTreeGrid = function (argsObj) {
		var pdfDoc,
			treegrid = argsObj.treegrid,
			startY = argsObj.startY,
			treeGridPages = [],
			startYPdfGrid = startY ? startY : 0; // todo: get font size from styles

		const styleGrid = treegrid.grid_Experimental.styleGrid;
		const layoutCells = treegrid.columns_Experimental.grid.layout.cells;
		const openedItems = new Set(treegrid.GetOpenedItems());

		var getItemPathLength = function (targetItem, itemsDict) {
				var pathLength = 0;
				var parentItem = itemsDict[targetItem.parent];
				while (parentItem) {
					pathLength++;
					if (itemsDict[parentItem.parent]) {
						// if parent has parent
						parentItem = itemsDict[parentItem.parent]; // next level to find last child
					} else {
						break;
					}
				}
				return pathLength;
			},
			getListOfLevelLine = function (targetItem, itemsDict) {
				var pathLength = getItemPathLength(targetItem, itemsDict);
				var listOfLevelLine = {};
				var parentItem = itemsDict[targetItem.parent];
				for (var k = pathLength - 1; k !== 0; k--) {
					if (parentItem && itemsDict[parentItem.parent]) {
						// if parent has parent
						var parentOfParent = itemsDict[parentItem.parent]; // find parent of parent
						var lastChildOfParentOfParent =
							parentOfParent.children[parentOfParent.children.length - 1]; // fing last child parent of parent
						listOfLevelLine[k] =
							lastChildOfParentOfParent.uniqueId !== parentItem.uniqueId; // if last child parent of parent == targetItem.parent then draw vert.line
						parentItem = itemsDict[parentItem.parent]; // next level to find last child
					} else {
						break;
					}
				}
				return listOfLevelLine;
			},
			drawMinus = function (x, y, isLastChild, isRoot) {
				//todo: calculate all coordinates using rowH
				pdfDoc.rect(x + 7, y + 7, 6, 6); // rectangle of plus/minus
				pdfDoc.line(x + 9, y + 10, x + 11, y + 10); // minus, horizontal line
				pdfDoc.setDashStyleCachable('1 1', '1');
				// set dash pattern
				pdfDoc.line(x + 13, y + 10, x + 23, y + 10);
				pdfDoc.line(x + 30, y + 15, x + 30, y + 20);
				if (!isRoot) {
					if (!isLastChild) {
						pdfDoc.line(x + 10, y + 13, x + 10, y + 20);
					}
					pdfDoc.line(x + 10, y, x + 10, y + 7);
				}
				pdfDoc.setDashStyleCachable('', '0');
			},
			drawPlus = function (x, y, isLastChild, isRoot) {
				//todo: calculate all coordinates using rowH
				pdfDoc.rect(x + 7, y + 7, 6, 6); // rectangle of plus/minus
				pdfDoc.line(x + 9, y + 10, x + 11, y + 10); // minus, horizontal line
				pdfDoc.line(x + 10, y + 9, x + 10, y + 11); //  vartical line
				pdfDoc.setDashStyleCachable('1 1', '1');
				// set dash pattern
				pdfDoc.line(x + 13, y + 10, x + 23, y + 10);
				if (!isRoot) {
					if (!isLastChild) {
						pdfDoc.line(x + 10, y + 13, x + 10, y + 20);
					}
					pdfDoc.line(x + 10, y, x + 10, y + 7);
				}
				pdfDoc.setDashStyleCachable('', '0');
			},
			drawTLine = function (x, y) {
				//todo: calculate all coordinates using rowH
				pdfDoc.setLineWidthCachable(0.5);
				pdfDoc.setDashStyleCachable('1 1', '1');
				pdfDoc.line(x, y, x, y + 20);
				pdfDoc.line(x, y + 10, x + 13, y + 10);
				pdfDoc.setDashStyleCachable('', '0');
			},
			drawLLine = function (x, y) {
				//todo: calculate all coordinates using rowH
				pdfDoc.setLineWidthCachable(0.5);
				pdfDoc.setDashStyleCachable('1 1', '1');
				pdfDoc.line(x, y, x, y + 10);
				pdfDoc.line(x, y + 10, x + 13, y + 10);
				pdfDoc.setDashStyleCachable('', '0');
			},
			drawTreeGridPdf = function (renderArgs) {
				var startrow = renderArgs.rowStart,
					treeGrid = renderArgs.treeGrid,
					endrow = renderArgs.rowEnd,
					startColumns = renderArgs.colStart,
					endColumns = renderArgs.colEnd,
					pageH = renderArgs.pageH,
					columns = renderArgs.columns,
					itemsDict = renderArgs.itemsDict,
					rowCount = renderArgs.rowCount,
					startDrawRow = startrow ? startrow : 0,
					rowmaxNumber = endrow ? endrow : rowCount + 1,
					rowH = 20, //todo: get rowHigth from grid
					headerHeight = startrow === 0 ? startYPdfGrid : 0, // todo; get headerHeight from grid
					shiftY = startrow !== 0 ? startYPdfGrid : 0,
					offsetY = startDrawRow * rowH + shiftY, //negative offset Y
					offsetX = startColumns ? columns[startColumns].xOffset : 0; // from 1 to startColumns width

				endColumns =
					endColumns && endColumns < columns.length
						? endColumns
						: columns.length;
				const startCol = startColumns || 0;

				pdfDoc = renderArgs.doc;
				//////// render rows
				for (var i = startDrawRow; i < rowmaxNumber; i++) {
					var cellX = 0, // x coordiante for cell of grid
						item,
						textColor;
					if (i !== 0) {
						item = treeGrid.grid_Experimental.getItem(i - 1);
					}

					cellX = columns[startCol].xOffset; // startCol ? startCol * 90 : cellX;
					/////// render cells of rows (columns)

					for (var j = startCol; j < endColumns; j++) {
						var bgColor = null,
							pdfBgColor = null,
							pdfDarkGg = null,
							cell,
							isLink = { link: false, colomnsChecked: false },
							treeXShift = 0; // for tree grid the child level text must be shift right
						const colW = columns[j].colW;

						if (i % 2 === 0) {
							pdfDoc.setAlphaCachable('CA02');
							pdfDoc.setFillColorCachable(220, 220, 220);
							pdfDoc.rect(
								cellX - offsetX,
								headerHeight + i * rowH - offsetY,
								colW,
								rowH,
								'F'
							); // empty square
							pdfDoc.setAlphaCachable('CA10');
						} else {
							if (i === 0) {
								// grid header color
								pdfDoc.setAlphaCachable('CA03');
								pdfDoc.setFillColorCachable(230, 230, 230);
								pdfDoc.rect(
									cellX - offsetX,
									headerHeight + i * rowH - offsetY,
									colW,
									rowH,
									'F'
								); // empty square
								pdfDoc.setAlphaCachable('CA10');
							}
						}
						if (item) {
							cell = treeGrid.cells_Experimental(
								item.uniqueId,
								columns[j].layoutIndex,
								true
							);
							if (!isLink.colomnsChecked) {
								isLink.link = treeGrid.grid_Experimental.store.getValue(
									cell.cell_Experimental,
									layoutCells[cell.indexColumn_Experimental].field + 'link'
								);
								isLink.colonsChecked = true;
							}

							var rowStyle = styleGrid[item.uniqueId];
							textColor = rowStyle.styleRow.color;
							var cellStyle = rowStyle[columns[j].columnName];

							if (cellStyle) {
								bgColor = cellStyle['background-color'];
							}

							if (bgColor) {
								var colorRegExp = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/;
								var parseColorStyle = bgColor.match(colorRegExp);
								if (parseColorStyle && parseColorStyle.length === 4) {
									var taskR = parseInt(parseColorStyle[1], 16),
										taskG = parseInt(parseColorStyle[2], 16),
										taskB = parseInt(parseColorStyle[3], 16);
									pdfDoc.setDrawColorCachable(taskR, taskG, taskB); // todo:
									pdfDoc.setFillColorCachable(taskR, taskG, taskB);
									pdfBgColor = [
										(taskR / 255).toFixed(2),
										(taskG / 255).toFixed(2),
										(taskB / 255).toFixed(2),
										'rg'
									].join(' ');
									pdfDarkGg = [
										(taskR - 30 / 255).toFixed(2),
										(taskG - 30 / 255).toFixed(2),
										(taskB - 30 / 255).toFixed(2),
										'rg'
									].join(' ');
									pdfDoc.rect(
										cellX - offsetX,
										headerHeight + i * rowH - offsetY,
										colW,
										rowH,
										'F'
									); // empty square
								}
							}
						}

						pdfDoc.setDrawColorCachable(160, 160, 160);
						pdfDoc.rect(
							cellX - offsetX,
							headerHeight + i * rowH - offsetY,
							colW,
							rowH
						);
						pdfDoc.saveGC(); // save curent garaphics context

						if (columns[j].isTree && item) {
							pdfDarkGg = pdfDarkGg
								? pdfDarkGg
								: [
										(250 / 255).toFixed(2),
										(250 / 255).toFixed(2),
										(250 / 255).toFixed(2),
										'rg'
								  ].join(' ');
							var bgGColor = i % 2 === 0 ? pdfDarkGg : pdfBgColor;
							pdfDoc.setClipRect(
								cellX - offsetX + 1,
								headerHeight + i * rowH - offsetY + 1,
								colW - 2,
								rowH - 2,
								bgGColor ? bgGColor : ''
							);
							var hasParent = item.parent[0] !== '',
								hasChild = item.children && item.children.length > 0,
								lastChild,
								parentItem = itemsDict[item.parent];
							if (parentItem) {
								var lastChildId =
									parentItem.children[parentItem.children.length - 1].uniqueId;
								lastChild = lastChildId === item.uniqueId;
							}

							treeXShift = getItemPathLength(item, itemsDict) * rowH;

							const thisItemOpened = openedItems.has(item.uniqueId[0]);
							var xPoint = cellX - 2 + treeXShift - offsetX;
							var yPoint = headerHeight + i * rowH - offsetY;
							if (!hasParent) {
								// ROOT . Root node may by open or closed(minus or plus)
								if (thisItemOpened) {
									drawMinus(xPoint, yPoint, lastChild, true);
								} else {
									drawPlus(xPoint, yPoint, lastChild, true);
								}
							} else if (hasChild) {
								if (thisItemOpened) {
									drawMinus(xPoint, yPoint, lastChild);
								} else {
									drawPlus(xPoint, yPoint, lastChild);
								}
							} else {
								if (!lastChild) {
									drawTLine(xPoint + 10, yPoint);
								} else {
									drawLLine(xPoint + 10, yPoint);
								}
							}
							treeXShift += rowH;
							if (item.icon[0]) {
								var outArray = [];
								outArray.push(
									'q 1 0 0 -1 0 ' + (pageH - 16 + 40) + ' cm -100 Tz'
								); // matrix [scaleX  rotateX  rotateY  scaleY  positionX  positionY],  q - save context cm- conte
								var icon = '';
								switch (item.icon[0]) {
									case '../images/WBSElement.svg':
										icon = ' cm  /Wbs Do Q'; // Q -restor context
										break;
									case '../images/Activity2.svg':
										icon = ' cm  /Activ Do Q';
										break;
									case '../images/Milestone.svg':
										icon = ' cm /Mil Do Q';
										break;
								}
								outArray.push(
									'0.18 0 0 -0.18 ' +
										(cellX - offsetX + treeXShift + 2) +
										' ' +
										(headerHeight + i * rowH - offsetY) +
										icon
								); // 0.0172 - Hight transform, -0.0152 Width transfporm
								// transform matrix need for convert the screen coordinate system of svg icons to pdf coordinate system. ([0.2 0 0 -0.2 x y] content matrix [scaleX  rotateX rotateeY scaleY positionX positionY] )
								pdfDoc.drawExtResource('', '', '', outArray);
							}
							treeXShift += rowH;
							var parent = itemsDict[item.parent];
							if (parent && parent.parent[0] !== '') {
								var listOfLevelLine = getListOfLevelLine(item, itemsDict);
								if (listOfLevelLine) {
									var pathLength = getItemPathLength(item, itemsDict);
									for (var l = 0; l < pathLength; l++) {
										if (listOfLevelLine[l]) {
											pdfDoc.setDashStyleCachable('1 1', '1');
											var xLinePoint =
													cellX - offsetX - 2 + l * rowH + rowH / 2,
												yTopLinePoint = headerHeight + i * rowH - offsetY,
												yBottomLinePoint =
													headerHeight + (i + 1) * rowH - offsetY;
											pdfDoc.line(
												xLinePoint,
												yTopLinePoint,
												xLinePoint,
												yBottomLinePoint
											);
											pdfDoc.setDashStyleCachable('', '0');
										}
									}
								}
							}
						}

						pdfDoc.setTextColorCachable(0, 0, 0);
						if (textColor) {
							pdfDoc.setTextColorCachable(textColor);
						}

						var cellstyle = layoutCells[j].styles ? layoutCells[j].styles : '',
							headerstyle = layoutCells[j].headerStyles
								? layoutCells[j].headerStyles
								: '',
							cellValue,
							summaryOffset = cellX - offsetX + treeXShift,
							reg = /.*(text-align:)\s*(\w+)\s*(;).*/,
							cellAlign = cellstyle.replace(reg, '$2'),
							headeralign = headerstyle.replace(reg, '$2');
						var fontSize = cellstyle['font-size']
							? doc.internal.getFontSize()
							: 8;
						pdfDoc.setFontSizeCachable(fontSize);
						if (item) {
							cellValue = cell.getText();
							if (
								cellValue === '<img src="../images/Deliverable.svg">' ||
								cellValue === "<img src='../images/Deliverable.svg'>"
							) {
								var out = [];
								out.push('q 1 0 0 -1 0 ' + (pageH - 16 + 40) + ' cm -100 Tz');
								var dlvIcon = ' cm  /Dlv Do Q';
								out.push(
									'0.18 0 0 -0.18 ' +
										(cellX - offsetX + treeXShift + 2) +
										' ' +
										(headerHeight + i * rowH - offsetY) +
										dlvIcon
								);
								pdfDoc.drawExtResource('', '', '', out);
							} else if (isLink.link) {
								pdfDoc.setTextColorCachable(54, 104, 177);
								pdfDoc.drawLink(
									summaryOffset,
									headerHeight + i * rowH - offsetY,
									colW,
									20,
									cellValue,
									cellAlign,
									fontSize,
									true
								);
							} else {
								pdfDoc.drawClippedText(
									summaryOffset,
									headerHeight + i * rowH - offsetY,
									colW,
									20,
									cellValue,
									cellAlign,
									true,
									'px',
									true
								);
							}
						} else {
							summaryOffset = cellX - offsetX;
							pdfDoc.drawClippedText(
								summaryOffset,
								headerHeight + i * rowH - offsetY,
								colW,
								20,
								columns[j].columnName,
								headeralign,
								true,
								'px',
								true
							);
						}
						cellX += colW;
						pdfDoc.restoreGC(); // restore graphics context to state that was before setting the clipping rectangle area;
					}
				}
				//		pdfDoc.restoreGC();// --clip all grid
			},
			gridExperimentalLayoutCells = treegrid.grid_Experimental.layout.cells,
			getColumns = function (pageW) {
				var cols = [],
					colsGrid = gridExperimentalLayoutCells,
					colCount = colsGrid.length,
					gridContainerWidth =
						treegrid.grid_Experimental.domNode.clientWidth * 0.75;
				for (var ind = 0; ind < colCount; ind++) {
					var colWidth = colsGrid[ind].unitWidth
						? (parseInt(colsGrid[ind].unitWidth.replace('px', ''), 10) + 5) *
						  0.75
						: 100;
					if (pageW) {
						colWidth = colWidth > pageW ? pageW - 1 : colWidth;
					}

					var thisOffset =
						ind > 0 ? cols[ind - 1].xOffset + cols[ind - 1].colW : 0;
					cols.push({
						columnName: colsGrid[ind].name ? colsGrid[ind].name : '',
						colW: colWidth,
						styles: colsGrid[ind].styles,
						isTree: colsGrid[ind].layoutIndex === 0,
						inputformat: colsGrid[ind].inputformat
							? colsGrid[ind].inputformat
							: '',
						layoutIndex: colsGrid[ind].layoutIndex,
						xOffset: thisOffset
					});
					if (thisOffset + colWidth > gridContainerWidth) {
						cols[ind].colW = -thisOffset + gridContainerWidth;
						break;
					}
				}
				return cols;
			},
			columns = getColumns(),
			rowCount = treegrid.getRowCount(),
			getItemsDict = function () {
				var result = {};
				for (var i = 0; i <= rowCount; i++) {
					var row = treegrid.grid_Experimental.getItem(i);
					if (row) {
						var id = row.uniqueId;
						if (id) {
							result[id] = row;
						}
					}
				}
				return result;
			},
			itemsDict = getItemsDict(),
			calculateTreeGridLastHPage = function (
				pageW /* startOffset todo: impl. startOffset using*/
			) {
				var gridPages = [];
				columns = getColumns(pageW);
				var treePageCount = 0,
					startColumn = 0,
					columnsCount = columns.length,
					column,
					prevW,
					currentTreeGridW,
					overlapping = 0,
					nextColumn,
					nextPage = true;
				while (nextPage) {
					column = startColumn;
					prevW = 0;
					nextColumn = true;
					while (nextColumn) {
						var page = {
							startColumn: startColumn,
							endColumn: 0,
							columnsOfThisPage: [],
							number: 0
						};

						var colW = parseInt(columns[column].colW, 10);
						if (colW > pageW) {
							colW = pageW;
						}
						currentTreeGridW = prevW + colW;
						if (currentTreeGridW > pageW) {
							startColumn = column - overlapping > 0 ? column - overlapping : 0;
							treePageCount++;
							page.endColumn = column + 1;
							page.number = treePageCount;
							page.itEndPage = false;
							gridPages.push(page);
							nextColumn = false;
							prevW = currentTreeGridW;
						} else if (column + 1 === columnsCount) {
							//end calculate
							nextPage = false;
							nextColumn = false;
							treePageCount++;
							page.endColumn = column + 1;
							page.number = treePageCount;
							page.itEndPage = true;
							page.offset = currentTreeGridW;
							gridPages.push(page);
						} else {
							page.columnsOfThisPage.push(columns[column]);
							column++;
							prevW = currentTreeGridW;
							nextColumn = true;
						}
					} // end columns cycle
				} // end pageCycle
				return gridPages;
			},
			renderPdfTreeGrid = function (renderProp) {
				var v = renderProp.v,
					h = renderProp.h,
					rowstart = renderProp.rowstart,
					rowend = renderProp.rowend,
					//	offset = renderProp.lastPagePrevControl ? renderProp.lastPagePrevControl.hOffset : 0, //todo: it will be if treegrid not first control in pdf doc
					intHCountPage = renderProp.lastPagePrevControl
						? renderProp.lastPagePrevControl.lastPageNumber
						: 0,
					pageW = renderProp.pageW,
					pageH = renderProp.pageH,
					doc = renderProp.doc;
				treeGridPages = calculateTreeGridLastHPage(pageW);

				if (
					treeGridPages &&
					treeGridPages.length !== 0 &&
					h < treeGridPages.length
				) {
					var colStart = treeGridPages[h].startColumn,
						colEnd = treeGridPages[h].endColumn,
						renderArgs = {
							v: v,
							h: h,
							rowStart: rowstart,
							rowEnd: rowend,
							colStart: colStart,
							colEnd: colEnd,
							pageW: pageW,
							pageH: pageH,
							columns: columns,
							gridPages: intHCountPage,
							doc: doc,
							itemsDict: itemsDict,
							rowCount: rowCount,
							treeGrid: treegrid
						};
					drawTreeGridPdf(renderArgs);
				}
				return {
					needH: treeGridPages.length > h + 1
				};
			},
			getTreeGridWidth = function (columnsArray) {
				var result = 0;
				for (var i = 0; i < columnsArray.length; i++) {
					result += parseInt(columnsArray[i].colW, 10);
				}
				return result;
			},
			pdfIcons = function () {
				// get name and type from pdfXObject.js
				return [
					{ name: 'Mil', type: 'PDF' },
					{ name: 'Activ', type: 'PDF' },
					{ name: 'Wbs', type: 'PDF' },
					{ name: 'Dlv', type: 'PDF' }
				];
			},
			gridHeigth = function () {
				var rowCount = treegrid.getRowCount();
				return (rowCount + 2) * 20; // todo: get rowhieght from initSettings treegrid
			},
			treeGridWidth = function () {
				return getTreeGridWidth(columns);
			},
			getRowCountTree = function () {
				return treegrid.getRowCount();
			},
			gatlastPageProp = function (pageW /*required*/, preOffset /*optional*/) {
				var startOffset = preOffset || 0,
					treeGridPages = calculateTreeGridLastHPage(pageW, startOffset),
					countTreeGridPages = treeGridPages.length,
					intCountPage = countTreeGridPages - 1, // count horizontal page ot treeGrid
					hoffset = treeGridPages[intCountPage].offset + 1.8; // gap between treegrid and chart
				return {
					lastPageNumber: intCountPage,
					hOffset: hoffset
				};
			};

		// public api region
		return {
			// interface of each Control to pdf rendering
			render: renderPdfTreeGrid,
			getPagesMetricArray: '',
			getWidth: treeGridWidth,
			getHeight: gridHeigth,
			getPDFResources: pdfIcons,
			getRowCount: getRowCountTree,
			getLastHorizontalPage: gatlastPageProp,
			headerRowsHeight: 1
		};
	};
	return pdfTreeGrid;
});
