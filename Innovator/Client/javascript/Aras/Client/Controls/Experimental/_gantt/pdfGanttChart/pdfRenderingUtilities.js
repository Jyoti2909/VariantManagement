define(['./../PredecessorType', './pdfXObject'], function (
	predecessorType,
	pdfResources
) {
	'use strict';
	var pdfUtilities = function () {
		// private
		var getPageRelCoord = function (entityX1, entityX2, page1, page2) {
			//private
			// there are 5 variants:
			// for example need render wbs
			// 1 - wbs doesn't place in page
			// 2 - wbs wholly places in page
			// 3 - wbs partially on the left side of page
			// 4 - wbs partially in  wholly page
			// 5 - wbs partially on the right side of page
			// wbs1 = left x coordinate wbs;
			// wbs2 = right x coordinate wbs;
			// page1 = left x coordinate page;
			// page2 = right x coordinate page;
			// ∈ = (wbs1 > page1 && wbs1 < page2);(wbs2 > page1 && wbs2 < page2)
			// detect 1-situation : check wbs1 ∉ page && wbs2 ∉ page && !(wbs1 < page1 && wbs2 > page2);	=> dont draw
			// detect 2-situation : check wbs1 ∈ page && wbs2 ∈ page ;										=> pdfWbs1 = wbs1- page1; pdfWbs2 = wbs2 - page1;
			// detect 3-situation : check wbs1 ∈ page && wbs2 ∉ page ;										=> pdfWbs1 = wbs1- page1; pdfWbs2 = wbs2 - page1;
			// detect 4-situation : check wbs1 ∉ page && wbs2 ∉ page && (wbs1 < page1 && wbs2 > page2);		=> pdfWbs1 = wbs1- page1; pdfWbs2 = page2 - page1;
			// detect 5-situation : check wbs1 ∉ page && wbs2 ∈ page ;										=> pdfWbs1 = 0;		pdfWbs2 = wbs2 - page1;

			var resultX1, resultX2, currentCase;
			if (entityX1 === entityX2) {
				currentCase = 1;
				// dont draw!
			} else if (
				!(entityX1 >= page1 && entityX1 < page2) &&
				!(entityX2 > page1 && entityX2 <= page2) &&
				!(entityX1 < page1 && entityX2 > page2)
			) {
				// 1
				// dont draw!
				currentCase = 1;
			} else if (
				entityX1 >= page1 &&
				entityX1 < page2 &&
				entityX2 > page1 &&
				entityX2 <= page2
			) {
				//2
				resultX1 = entityX1 - page1;
				resultX2 = entityX2 - page1;
				currentCase = 2;
			} else if (
				entityX1 >= page1 &&
				entityX1 < page2 &&
				!(entityX2 > page1 && entityX2 <= page2)
			) {
				//3
				resultX1 = entityX1 - page1;
				resultX2 = page2 - page1;
				currentCase = 3;
			} else if (
				!(entityX1 >= page1 && entityX1 < page2) &&
				!(entityX2 > page1 && entityX2 <= page2) &&
				entityX1 < page1 &&
				entityX2 > page2
			) {
				//4
				resultX1 = 0;
				resultX2 = page2 - page1;
				currentCase = 4;
			} else if (
				!(entityX1 >= page1 && entityX1 < page2) &&
				entityX2 > page1 &&
				entityX2 <= page2
			) {
				//5
				resultX1 = 0;
				resultX2 = entityX2 - page1;
				currentCase = 5;
			}

			return {
				resultX1: resultX1,
				resultX2: resultX2,
				currentCase: currentCase
			};
		};

		var prepareToSavePdfDoc = function (doc, filename) {
			doc.setCtmForAllPages();
			doc.save(filename || 'GanttChart.pdf');
		};

		var getNumberRowHeader = function (controlsToRender) {
			var k = 0;
			for (var n = 0; n < controlsToRender.length; n++) {
				if (controlsToRender[n] && controlsToRender[n].headerRowsHeight) {
					k =
						controlsToRender[n].headerRowsHeight > k
							? controlsToRender[n].headerRowsHeight
							: k;
				}
			}
			return k;
		};

		var buildPdfDocument = function (controlsToRender, doc) {
			var rowH = 20, // todo: get row heigth form style
				rowCount = 0,
				pageW = doc.internal.pageSize.width - 40,
				pageH = doc.internal.pageSize.height - 40,
				pdfRes = new pdfResources(pageH, pageW);

			for (var c = 0; c < controlsToRender.length; c++) {
				// summary width of pdf document
				if (controlsToRender[c]) {
					controlsToRender[c].getWidth(pageW);
					var resources = controlsToRender[c].getPDFResources();
					if (resources) {
						for (var i = 0, len = resources.length; i < len; i++) {
							doc.putExtPfdResource(
								resources[i].name,
								pdfRes.getIcon('PDF', resources[i].name)
							);
						}
					}
					controlsToRender[c].getHeight(pageH, rowH);
					var currowcount = controlsToRender[c].getRowCount();
					rowCount = currowcount > rowCount ? currowcount : rowCount;
				}
			}

			//-- page building zone
			var rowsPerPage = Math.floor(pageH / rowH);
			var renderProp = {
				/*h,v , intHCountPage, rowstart, colstart, colend, treeGridPages[] array with pages info : start end V and H property, should be common for gantt and tree*/
				h: 0,
				v: 0,
				intHcountPage: 0,
				rowstart: 0,
				colstart: 0,
				colend: 0,
				pagesMetrics: {},
				doc: ''
			};

			////////////////////// rendering pdf document with pagination //////////////////
			// expected that the document can be divided into rows and columns. todo: divided by arbitrary points
			// ----renderV---// vertical page iterations
			var needPageV = true;
			doc.clearGraphicsCache();
			doc.setLineWidth(0.5);
			var v = 0;
			while (needPageV) {
				// ----renderH---// horizontal page iterations
				var needPageH = true;
				var h = 0;
				while (needPageH) {
					var k = getNumberRowHeader(controlsToRender);
					k = v > 0 ? k : 0;
					var rowStart = v * rowsPerPage - k;
					var rowEnd = (v + 1) * rowsPerPage;

					if (rowEnd > rowCount) {
						rowEnd = rowCount + 1;
						needPageV = false;
					}

					renderProp = {
						v: v,
						h: h,
						rowstart: rowStart,
						rowend: rowEnd,
						pageW: pageW,
						pageH: pageH,
						doc: doc,
						vPageCount: v,
						hPageCount: h,
						needPageV: needPageV
					};
					for (var num = 0; num < controlsToRender.length; num++) {
						if (
							controlsToRender[num] &&
							controlsToRender[num - 1] &&
							num !== 0
						) {
							renderProp.lastPagePrevControl = controlsToRender[
								num - 1
							].getLastHorizontalPage(pageW);
						}
						if (controlsToRender[num]) {
							var renderResult = controlsToRender[num].render(renderProp);
							needPageH = renderResult.needH;
						}
					}
					// if need next page add its
					h++;
					if (needPageV || needPageH) {
						doc.addPage();
						doc.clearGraphicsCache();
					}
				} // -End---renderH
				v++;
			} // -End---renderV
		};

		// public  region
		return {
			getPageRelCoord: getPageRelCoord,
			preparePdfToSave: prepareToSavePdfDoc,
			buildPdfDocument: buildPdfDocument
		};
	};
	return pdfUtilities;
});
