/*jslint plusplus: true*/
/*global define, dojo*/
define([
	'./DateTime',
	'./Task',
	'./pdfGanttChart/PdfRenderingUtilities'
], function (DateTime, Task, PdfUtilities) {
	'use strict';

	var pdfUtils = new PdfUtilities();
	var Wbs = function (id, name, project) {
		if (project) {
			this.project = project;
		}
		this.id = id;
		this.name = name;
		this.selected = false;
		this.domNode = null;
		this.containerNode = null;

		var subWbs = [],
			tasks = [],
			subEntities = [];

		this.getSubWbs = function () {
			return subWbs;
		};

		this.getTasks = function () {
			return tasks;
		};

		this.addSubWbs = function (id, label) {
			var wbs = new Wbs(id, label, this.project);

			wbs.parent = this;
			subWbs.push(wbs);
			this.project.allWbs.push(wbs);
			subEntities.push(wbs);
			return wbs;
		};

		this.createTask = function (id, name, startDate, endDate, duration) {
			var t = new Task(id, name, startDate, endDate, this.project, this);
			if (endDate === DateTime.DateTimeNull) {
				t.setDuration(duration);
			}
			tasks.push(t);
			this.project.tasks.push(t);
			subEntities.push(t);
			return t;
		};

		this.getMinDate = function () {
			var res = DateTime.DateTimeNull,
				j,
				entity,
				candidate;

			for (j = 0; j < tasks.length; j++) {
				entity = tasks[j];
				candidate = entity.getStartDate() || DateTime.DateTimeNull;

				if (
					candidate !== DateTime.DateTimeNull &&
					(res === DateTime.DateTimeNull || candidate < res)
				) {
					res = candidate;
				}
			}

			for (j = 0; j < subWbs.length; j++) {
				entity = subWbs[j];
				candidate = entity.getMinDate() || DateTime.DateTimeNull;

				if (
					candidate !== DateTime.DateTimeNull &&
					(res === DateTime.DateTimeNull || candidate < res)
				) {
					res = candidate;
				}
			}
			return res;
		};

		this.getMaxDate = function () {
			var res = DateTime.DateTimeNull,
				entity,
				candidate,
				j;

			for (j = 0; j < tasks.length; j++) {
				entity = tasks[j];
				candidate = entity.getEndDate() || DateTime.DateTimeNull;

				if (
					candidate !== DateTime.DateTimeNull &&
					(res === DateTime.DateTimeNull || candidate > res)
				) {
					res = candidate;
				}
			}

			for (j = 0; j < subWbs.length; j++) {
				entity = subWbs[j];
				candidate = entity.getMaxDate() || DateTime.DateTimeNull;

				if (
					candidate !== DateTime.DateTimeNull &&
					(res === DateTime.DateTimeNull || candidate > res)
				) {
					res = candidate;
				}
			}
			return res;
		};

		this.getSubEntities = function () {
			return subEntities;
		};

		this.stylize = function () {
			if (this.domNode) {
				//styling taskNode
				this.domNode.className =
					'ganttWbs' + (this.project.drawTaskHover ? ' ganttTaskHover' : '');
			}

			if (this.containerNode) {
				//styling containerNode
				this.containerNode.className =
					(this.project.drawHorizontalLine ? 'ganttHorizontalLine' : '') +
					(this.selected ? ' ganttSelectedItem' : '');
			}
		};

		this.setSelected = function (doSelected) {
			if (doSelected !== this.selected) {
				this.selected = doSelected;
				this.stylize();
			}
		};
	};

	Wbs.prototype.draw = function (container, drawSettings) {
		var xLeft = drawSettings.x,
			yTop = drawSettings.y + parseInt(drawSettings.height / 2.5),
			xRight =
				drawSettings.x +
				parseInt(
					DateTime.Date.totalDays(
						DateTime.Date.addDays(this.getMaxDate(), 1) - this.getMinDate()
					) * drawSettings.dayWidth
				),
			yBottom =
				drawSettings.y +
				drawSettings.height -
				parseInt(drawSettings.height / 2.5),
			borderWidth = 1,
			wbsWidth = xRight - xLeft + borderWidth,
			parentDocument = container.ownerDocument,
			self = this,
			newNode,
			doc = drawSettings.doc,
			offset = drawSettings.offset,
			startX = drawSettings.startX,
			endX = drawSettings.endX,
			yOffset = drawSettings.yHeaderOffset;
		if (doc) {
			var docyTop = yTop + yOffset;
			var page1 = startX,
				page2 = endX,
				wbs1 = xLeft,
				wbs2 = xRight,
				pdfWbs1,
				pdfWbs2,
				currentCase;
			var wbsPageRel = pdfUtils.getPageRelCoord(wbs1, wbs2, page1, page2);
			pdfWbs1 = wbsPageRel.resultX1;
			pdfWbs2 = wbsPageRel.resultX2;
			currentCase = wbsPageRel.currentCase;

			if (pdfWbs1 !== undefined && pdfWbs2 !== undefined) {
				pdfWbs1 += offset;
				pdfWbs2 += offset;
				doc.setDrawColorCachable(0, 0, 0);
				doc.setFillColorCachable(0, 0, 0);
				if (currentCase !== 1) {
					doc.rect(
						pdfWbs1,
						docyTop,
						pdfWbs2 - pdfWbs1,
						yBottom - yTop + 1,
						'F'
					);
				}
				if (currentCase === 3) {
					doc.triangle(
						pdfWbs1,
						docyTop,
						pdfWbs1,
						docyTop + 10,
						pdfWbs1 + 10,
						docyTop,
						'F'
					);
				}
				if (currentCase === 5) {
					doc.triangle(
						pdfWbs2 - 10,
						docyTop,
						pdfWbs2,
						docyTop,
						pdfWbs2,
						docyTop + 10,
						'F'
					);
				}
				if (currentCase === 2) {
					doc.triangle(
						pdfWbs1,
						docyTop,
						pdfWbs1,
						docyTop + 10,
						pdfWbs1 + 10,
						docyTop,
						'F'
					);
					doc.triangle(
						pdfWbs2 - 10,
						docyTop,
						pdfWbs2,
						docyTop,
						pdfWbs2,
						docyTop + 10,
						'F'
					);
				}
			}
		} else {
			newNode = parentDocument.createElement('div');
			newNode.style.cssText =
				'height:' +
				(yBottom - yTop) +
				'px;top:' +
				yTop +
				'px; left: ' +
				xLeft +
				'px; width:' +
				wbsWidth +
				'px;' +
				';background-color:' +
				drawSettings.color +
				'; border-color:' +
				drawSettings.color;
			newNode.title = this.name;
			container.appendChild(newNode);
			this.domNode = newNode;
			if (drawSettings.onClick) {
				this.domNode.addEventListener(
					'click',
					function () {
						drawSettings.onClick(self.id);
					},
					false
				);
			}
			// draw horizontal line
			newNode = parentDocument.createElement('div');
			newNode.style.cssText =
				'height:' +
				(drawSettings.height - 1) +
				'px; top:' +
				drawSettings.y +
				'px; left: 0px; width: ' +
				drawSettings.width +
				'px;border-color:' +
				this.project.gridColor;
			container.appendChild(newNode);
			this.containerNode = newNode;
			this.stylize();
		}
	};

	Wbs.prototype.parent = null;

	Wbs.prototype.project = null;

	return Wbs;
});
