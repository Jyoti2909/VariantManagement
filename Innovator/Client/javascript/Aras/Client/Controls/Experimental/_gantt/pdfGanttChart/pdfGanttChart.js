define([
	'./../PredecessorType',
	'./PdfRenderingUtilities',
	'./../DateTime'
], function (predecessorType, pdfUtilities, dateTime) {
	'use strict';

	var pdfGanttChart = function (argsObj) {
		// private
		var treeGridWidth = 0,
			gantt = argsObj.gantt,
			treegrid = argsObj.treegrid,
			dayWidth = argsObj.dayWidth,
			visualSettings = gantt.visualSettings,
			rowH = 20, // todo: get row heigth form style
			startDay,
			endDay,
			pagesPropsLink,
			previosLastDay,
			lastGanttDay,
			firstGanttDay,
			pageOffset,
			linksOfPages = [],
			pdfUtils = pdfUtilities(),
			visibleItems = (function (treegrid) {
				var result = {};
				result.length = 0;
				for (var i = 0, count = treegrid.getRowCount(); i <= count; i++) {
					var row = treegrid.grid_Experimental.getItem(i);
					if (row) {
						var id = row.uniqueId;
						if (id) {
							result[id] = row;
							result.length++;
						}
					}
				}
				return result;
			})(treegrid),
			// -- Dependency link rendering region
			dependencyLinkPdfArrow = function (doc, arrowType, tipPoint) {
				var tipType = {
					Right: function () {
						doc.triangle(
							tipPoint.x - 5,
							tipPoint.y - 3,
							tipPoint.x - 5,
							tipPoint.y + 3,
							tipPoint.x,
							tipPoint.y,
							'FD'
						);
					},
					Left: function () {
						doc.triangle(
							tipPoint.x + 5,
							tipPoint.y - 3,
							tipPoint.x + 5,
							tipPoint.y + 3,
							tipPoint.x,
							tipPoint.y,
							'FD'
						);
					},
					Down: function () {
						doc.triangle(
							tipPoint.x - 3,
							tipPoint.y - 5,
							tipPoint.x + 3,
							tipPoint.y - 5,
							tipPoint.x,
							tipPoint.y,
							'FD'
						);
					},
					Up: function () {
						doc.triangle(
							tipPoint.x - 3,
							tipPoint.y + 5,
							tipPoint.x + 3,
							tipPoint.y + 5,
							tipPoint.x,
							tipPoint.y,
							'FD'
						);
					}
				};

				tipType[arrowType]();
			},
			checkBound = function (start, end, value) {
				//for debug
				if (value <= start) {
					return start;
				} else if (value >= end) {
					return end;
				} else {
					return value;
				}
			},
			setDepLinksDrawProp = function (doc) {
				doc.setDrawColor(0, 0, 255);
				doc.setFillColor(0, 0, 255);
			},
			drawLinksByPoints = function (
				ganttChart,
				linkPoints,
				doc,
				horizPageCount,
				vertPageCount,
				intCountPage,
				pageH,
				pageW,
				links
			) {
				var points = linkPoints.link;

				for (var i = 0; i < points.length - 1; i++) {
					var typeLine;
					if (points[i].x === points[i + 1].x) {
						typeLine = 'vertical';
					} else if (points[i].y === points[i + 1].y) {
						typeLine = 'horizontal';
					}

					var hLine1 =
						points[i].x < points[i + 1].x ? points[i].x : points[i + 1].x;
					var hLine2 = hLine1 + Math.abs(points[i + 1].x - points[i].x);

					var vLine1 =
						points[i].y < points[i + 1].y ? points[i].y : points[i + 1].y;
					var vLine2 = vLine1 + Math.abs(points[i + 1].y - points[i].y);

					var tipType;
					var pnumber = 1;
					for (var pv = 0; pv < vertPageCount; pv++) {
						for (var ph = 0; ph < horizPageCount; ph++) {
							// there are pages that haven't chart and pages that have chart with width = pageW - gridW
							// document pages have pageXStart pageXEnd and chart has xstart xend
							var startXByPageNumber = links[pnumber - 1].startPageLocationX;
							var startYBypageNumber = links[pnumber - 1].rowStart;
							var vPage1 = startYBypageNumber * 20, // y 1
								vPage2 = vPage1 + pageH, // y 2
								hPage1 = startXByPageNumber, // + linkPoints.offset; // x 1
								hPage2 = startXByPageNumber + pageW, // x 2
								pdfHLine1,
								pdfHLine2,
								pdfVLine1,
								pdfVLine2,
								isNotGridPage = ph >= intCountPage,
								offset =
									ph === links.pageOffset.lastPageNumber
										? links.pageOffset.hOffset
										: 0;

							if (
								isNotGridPage &&
								typeLine === 'vertical' &&
								points[i].x >= hPage1 &&
								points[i].x <= hPage2
							) {
								var yPageRelCoord = pdfUtils.getPageRelCoord(
									vLine1,
									vLine2,
									vPage1,
									vPage2
								);
								pdfVLine1 = yPageRelCoord.resultX1;
								pdfVLine2 = yPageRelCoord.resultX2;
								if (yPageRelCoord.currentCase !== 1) {
									pdfVLine1 = pv === 0 ? pdfVLine1 + 2 * 20 : pdfVLine1;
									pdfVLine2 = pv === 0 ? pdfVLine2 + 2 * 20 : pdfVLine2;
									doc.setPage(pnumber);
									if (!pagesPropsLink[pnumber]) {
										setDepLinksDrawProp(doc, pnumber);
										pagesPropsLink[pnumber] = true;
									}
									var x = points[i].x - hPage1 + offset;
									pdfVLine1 = checkBound(0, pageH, pdfVLine1); // check bound for debug;
									pdfVLine2 = checkBound(0, pageH, pdfVLine2);
									doc.line(x, pdfVLine1, x, pdfVLine2);
									if (points.length - 2 === i) {
										tipType = linkPoints.tipType;
										if (
											tipType === 'Up' &&
											(yPageRelCoord.currentCase === 3 ||
												yPageRelCoord.currentCase === 2)
										) {
											dependencyLinkPdfArrow(doc, linkPoints.tipType, {
												x: x,
												y: pdfVLine1
											});
										} else if (
											tipType === 'Down' &&
											(yPageRelCoord.currentCase === 5 ||
												yPageRelCoord.currentCase === 2)
										) {
											dependencyLinkPdfArrow(doc, linkPoints.tipType, {
												x: x,
												y: pdfVLine2
											});
										}
									}
									pdfVLine1 = undefined;
									pdfVLine1 = undefined;
								}
							} else if (
								isNotGridPage &&
								typeLine === 'horizontal' &&
								vPage2 >= points[i].y &&
								points[i].y >= vPage1
							) {
								var xPageRelCoord = pdfUtils.getPageRelCoord(
									hLine1 + offset,
									hLine2 + offset,
									hPage1,
									hPage2
								);
								pdfHLine1 = xPageRelCoord.resultX1;
								pdfHLine2 = xPageRelCoord.resultX2;
								if (xPageRelCoord.currentCase !== 1) {
									doc.setPage(pnumber);
									if (!pagesPropsLink[pnumber]) {
										setDepLinksDrawProp(doc, pnumber);
										pagesPropsLink[pnumber] = true;
									}
									pdfHLine2 = pdfHLine2 > hPage2 ? hPage2 : pdfHLine2;
									var y = points[i].y - vPage1;
									y = pv === 0 ? y + 2 * 20 : y;
									pdfHLine1 = checkBound(0, pageW, pdfHLine1);
									pdfHLine2 = checkBound(0, pageW, pdfHLine2);
									doc.line(pdfHLine1, y, pdfHLine2, y);
									if (points.length - 2 === i) {
										tipType = linkPoints.tipType;
										if (
											tipType === 'Left' &&
											(xPageRelCoord.currentCase === 3 ||
												xPageRelCoord.currentCase === 2)
										) {
											var taskFinish =
													linkPoints.task.AbsBounds.x +
													linkPoints.task.AbsBounds.width,
												predFinish =
													linkPoints.pred.task.AbsBounds.x +
													linkPoints.pred.task.AbsBounds.width,
												xTip =
													linkPoints.pred.precedence ===
														predecessorType.FinishToFinish &&
													predFinish < taskFinish
														? pdfHLine2
														: pdfHLine1;
											dependencyLinkPdfArrow(doc, linkPoints.tipType, {
												x: xTip,
												y: y
											});
										} else if (
											tipType === 'Right' &&
											(xPageRelCoord.currentCase === 5 ||
												xPageRelCoord.currentCase === 2)
										) {
											dependencyLinkPdfArrow(doc, linkPoints.tipType, {
												x: pdfHLine2,
												y: y
											});
										}
									}
									pdfHLine1 = undefined;
									pdfHLine2 = undefined;
								}
							}
							pnumber++;
						}
					} // end H page
				}
			},
			drawDependencyLinkToPdf = function (
				ganttChart,
				links,
				doc,
				horizPageCount,
				vertPageCount,
				intCountPage,
				pageW,
				pageH
			) {
				ganttChart.renderedLinks = {};
				pagesPropsLink = [];
				for (var numPages = 0; numPages < links.length; numPages++) {
					if (links[numPages].linksArray.length > 0) {
						for (
							var linkPoints = 0;
							linkPoints < links[numPages].linksArray.length;
							linkPoints++
						) {
							var isTaskVisible =
								visibleItems[links[numPages].linksArray[linkPoints].task.id];
							var isPredVisible =
								visibleItems[
									links[numPages].linksArray[linkPoints].pred.task.id
								];
							if (isTaskVisible && isPredVisible) {
								var link = links[numPages].linksArray[linkPoints];
								drawLinksByPoints(
									ganttChart,
									link,
									doc,
									horizPageCount,
									vertPageCount,
									intCountPage,
									pageH,
									pageW,
									linksOfPages
								);
							}
						}
					}
				}
			},
			// -- END Dependency link rendering region

			getGanttWidth = function () {
				firstGanttDay = gantt.getMinChartDate();
				lastGanttDay = gantt.getMaxChartDate();
				var currentdate = new Date(firstGanttDay),
					gwidth = 0,
					countDays = 0;
				while (currentdate <= lastGanttDay) {
					gwidth += dayWidth;
					countDays++;
					currentdate = dateTime.Date.addDays(currentdate, 1);
				}
				return gwidth;
			},
			renderPdfGanttChart = function (renderProp) {
				pageOffset = renderProp.lastPagePrevControl;
				var v = renderProp.v,
					h = renderProp.h,
					doc = renderProp.doc,
					rowStart = renderProp.rowstart,
					rowEnd = renderProp.rowend,
					pageW = renderProp.pageW,
					pageH = renderProp.pageH,
					tempOffset = pageOffset ? pageOffset.hOffset : 0,
					intHCountPage = pageOffset ? pageOffset.lastPageNumber : 0,
					firstGanttDay = gantt.getMinChartDate(),
					vertPageCount = renderProp.vPageCount,
					horizPageCount = renderProp.hPageCount,
					needPageV = renderProp.needPageV;

				linksOfPages.pageOffset = pageOffset;

				var getGanttEndDateByWidth = function (startDate, width) {
					var currentdate = new Date(startDate);
					// todo: for other intervals. this only for day
					currentdate = dateTime.Date.addDays(
						currentdate,
						Math.ceil(width / dayWidth)
					);
					return currentdate;
				};

				var chartWidth = pageW - tempOffset;
				var timeConstant = 0;
				var timeStep = 20; // todo: from gantt setup properties
				if (chartWidth % timeStep < timeStep / 2) {
					timeConstant = -1;
				}

				// draw header
				if (v === 0) {
					// header only for first pages from first row pages
					if (h === intHCountPage) {
						// it means that we have to render ganttchart from this page with offset
						startDay = firstGanttDay;
						endDay = getGanttEndDateByWidth(startDay, chartWidth);
					} else if (h > intHCountPage) {
						tempOffset = 0;
						startDay = previosLastDay ? previosLastDay : startDay;
						endDay = getGanttEndDateByWidth(startDay, pageW);
					}
					if (startDay && endDay) {
						// ----render gantt header
						gantt.drawHeader(doc, startDay, endDay, tempOffset);
					}
				}
				// end draw header

				// draw chart
				if (h === intHCountPage) {
					// it means that we have to render ganttchart from it page with offset
					startDay = firstGanttDay;
					endDay = getGanttEndDateByWidth(startDay, chartWidth);
				} else if (h > intHCountPage) {
					tempOffset = 0;
					startDay = previosLastDay ? previosLastDay : startDay;
					endDay = getGanttEndDateByWidth(startDay, pageW);
				}
				previosLastDay = dateTime.Date.addDays(endDay, -1 + timeConstant);
				// ---- render chart
				var startPageLocationX = gantt.getDateX(startDay, dayWidth);
				var endPageLocationX = gantt.getDateX(endDay, dayWidth);
				var linksArray = [];
				linksOfPages.push({
					pageV: v,
					pageH: h,
					linksArray: linksArray,
					startDay: startDay,
					endDay: endDay,
					startPageLocationX: startPageLocationX,
					endPageLocationX: endPageLocationX,
					rowStart: rowStart,
					rowEnd: rowEnd
				});
				if (
					startDay !== undefined &&
					endDay !== undefined &&
					h >= intHCountPage
				) {
					var renderArgs = {
						vertPageCount: vertPageCount,
						horizPageCount: horizPageCount,
						pageH: pageH,
						pageW: pageW,
						h: h,
						v: v,
						rowEnd: rowEnd,
						rowStart: rowStart,
						treeGridWidth: treeGridWidth,
						offsetforChartAfterGrid: tempOffset,
						startDay: startDay,
						endDay: endDay,
						linksArray: linksArray,
						intHCountPage: intHCountPage,
						treeGrid: treegrid
					};
					gantt.drawChart(doc, renderArgs);
				}

				var needH = h < intHCountPage || lastGanttDay > previosLastDay;

				var headerOffset = rowStart > 0 ? 0 : 2;
				if (rowEnd - rowStart + headerOffset < Math.floor(pageH / 20)) {
					doc.saveGC();
					doc.setClipRect(
						tempOffset,
						(rowEnd - rowStart - 1) * 20 + 1 + headerOffset * 20,
						pageW,
						pageH
					);
					doc.restoreGC();
				}

				if (!needH && gantt.width < pageW) {
					doc.saveGC();
					doc.setClipRect(tempOffset + gantt.width + 1, 0, pageW, pageH);
					doc.restoreGC();
				}

				// end draw chart

				// draw dependency links
				var drawDependencyLinks = visualSettings
					? visualSettings.dependencyLinks
					: true;
				if (drawDependencyLinks && !needH && !needPageV) {
					drawDependencyLinkToPdf(
						gantt,
						linksOfPages,
						doc,
						h + 1,
						v + 1,
						intHCountPage,
						pageW,
						pageH
					);
				}

				// end gantt
				return {
					needH: needH,
					needV: true
				};
			},
			calcPagesMetrics = function () {
				//  to return array of pages for rendering where will metrics for rendering with pagination
				// NOT IMPLEMENTED
			},
			ganttHeigth = function () {
				var rowCount = treegrid.getRowCount();
				return (rowCount + 2) * rowH;
			},
			pdfIcons = function () {
				// get name and type from pdfXObject.js
				return [
					{ name: 'tGrd', type: 'PDF' },
					{ name: 'vLnG', type: 'PDF' },
					{ name: 'hLng', type: 'PDF' }
				];
			},
			getRowCountGantt = function () {
				return treegrid.getRowCount();
			},
			gatlastPageProp = function (pageW /*required*/, preOffset /*optional*/) {
				//	NOT IMPLEMENTED!!!
			};

		// public api  region
		return {
			//shared interface of each Control to pdf rendering
			render: renderPdfGanttChart,
			getPagesMetricArray: calcPagesMetrics,
			getHeight: ganttHeigth,
			getPDFResources: pdfIcons,
			getWidth: getGanttWidth,
			getRowCount: getRowCountGantt,
			getLastHorizontalPage: gatlastPageProp,
			headerRowsHeight: 2
		};
	};
	return pdfGanttChart;
});
