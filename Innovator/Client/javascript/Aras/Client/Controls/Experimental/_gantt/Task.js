/*jslint plusplus: true, debug: true*/
/*global define, dojo*/
define([
	'./DateTime',
	'./Graphics',
	'./PredecessorType',
	'./pdfGanttChart/PdfRenderingUtilities'
], function (DateTime, Graphics, PredecessorType, PdfUtilities) {
	'use strict';

	var Predecessor = function (precedence, task) {
			this.precedence = precedence;
			this.task = task;
		},
		pdfUtils = new PdfUtilities(),
		Task = function (id, name, sd, ed, project, parent) {
			var index = 0,
				labelFont = null,
				labelColor = null,
				barColor = null,
				progColor = null,
				workingDuration,
				predecessor,
				num,
				assigned,
				is_milestone = 0;

			this.predecessors = {};
			this.pendingDrawList = [];
			this.redrawRequires = true;
			this.id = id;
			this.selected = false;
			this.domNode = null;
			this.containerNode = null;
			this.progressNode = null;

			this.initInstance(id, name, sd, ed, project, parent);

			this.setIndex = function (value) {
				index = value;
			};

			this.setLabelFont = function (value) {
				labelFont = value;
			};

			this.setLabelColor = function (value) {
				labelColor = value;
			};

			this.setBarColor = function (value) {
				barColor = value;
			};

			this.setProgressColor = function (value) {
				progColor = value;
			};

			this.setPercent = function (value) {
				if (value < 0) {
					value = 0;
				} else if (value > 100) {
					value = 100;
				}

				this.completionProgress = value;
			};

			this.setWorkingDuration = function (value) {
				workingDuration = value;
			};

			this.setPredecessor = function (value) {
				predecessor = value;
			};

			this.setNum = function (value) {
				num = value;
			};

			this.setAssigned = function (value) {
				assigned = value;
			};

			this.setIsMilestone = function (value) {
				is_milestone = value;
			};

			this.getIndex = function () {
				return index;
			};

			this.getPredecessor = function () {
				return predecessor;
			};

			this.getBarColor = function () {
				return barColor;
			};

			this.getLabelColor = function () {
				return labelColor;
			};

			this.getPercent = function () {
				return this.completionProgress;
			};

			this.getProgressColor = function () {
				return progColor;
			};
		};

	Task.prototype.appendPredecessor = function (type, predecessorTask) {
		this.predecessors[predecessorTask.id] = new Predecessor(
			type,
			predecessorTask
		);
		dojo.connect(predecessorTask, 'onDraw', this, this.predecessorTask_OnDraw);
	};

	Task.prototype.predecessorTask_OnDraw = function (container, sender, bound) {
		if (this.redrawRequires) {
			this.pendingDrawList.push({
				container: container,
				sender: sender,
				bound: bound
			});
			return;
		}
		this.drawDependanceLink(container, sender);
	};

	Task.prototype.initInstance = function (id, name, sd, ed, project, parent) {
		this.id = id;
		this.name = name;
		this.project = project;
		this.parent = parent;
		this.startDate = sd;
		this.earliestStartDate = sd;
		this.endDate = ed;
		this.latestEndDate = ed;
		this.duration = this.workingDuration = this.length(sd, ed);
		this.completionProgress = 0;
	};

	Task.prototype.getStartDate = function () {
		return this.startDate;
	};

	Task.prototype.getEndDate = function () {
		return this.endDate;
	};

	Task.prototype.length = function (sd, ed) {
		var diff = ed - sd;
		return diff / (1000 * 60 * 60 * 24); //Days;// warpFactor;
	};

	Task.prototype.onDraw = function (container, sender, bound) {};

	Task.prototype.setTaskBounds = function (location, height, dayWidth, absTop) {
		var xLeft = location.x,
			yTop = location.y + height / 4,
			yAbsTop = absTop + height / 4,
			endDate =
				DateTime.Date.totalDays(
					DateTime.Date.addDays(this.getEndDate(), 1) - this.getStartDate()
				) * dayWidth,
			xRight = location.x + parseInt(endDate, 10),
			yBottom = location.y + height - height / 4,
			yAbsBottom = absTop + height - height / 4;
		this.bound = {
			x: xLeft,
			y: yTop,
			width: xRight - xLeft,
			height: yBottom - yTop
		};
		this.AbsBounds = {
			x: xLeft,
			y: yAbsTop,
			width: xRight - xLeft,
			height: yAbsBottom - yAbsTop
		};
	};

	Task.prototype.setSelected = function (doSelected) {
		if (this.selected !== doSelected) {
			this.selected = doSelected;
			this.stylize();
		}
	};

	Task.prototype.setDuration = function (value) {
		this.duration = value;
	};

	Task.prototype.stylize = function (doSelected) {
		if (this.domNode) {
			this.domNode.className =
				'ganttTask' + (this.project.drawTaskHover ? ' ganttTaskHover' : '');
		}

		if (this.containerNode) {
			this.containerNode.className =
				(this.project.drawHorizontalLine ? 'ganttHorizontalLine' : '') +
				(this.selected ? ' ganttSelectedItem' : '');
		}
	};

	Task.prototype.draw = function (container, drawSettings) {
		var xLeft = drawSettings.x,
			yTop = drawSettings.y + drawSettings.height / 4,
			xRight =
				drawSettings.x +
				parseInt(
					DateTime.Date.totalDays(
						DateTime.Date.addDays(this.getEndDate(), 1) - this.getStartDate()
					) * drawSettings.dayWidth
				),
			yBottom = drawSettings.y + drawSettings.height - drawSettings.height / 4,
			taskColorCSS = !this.getBarColor()
				? ''
				: 'background-color:' +
				  Graphics.Colors.fromHexToRGBA(this.getBarColor(), 60) +
				  ';border-color:' +
				  this.getBarColor(),
			progressColorCSS = !this.getProgressColor()
				? ''
				: 'background-color:' +
				  Graphics.Colors.fromHexToRGBA(this.getProgressColor(), 60) +
				  ';',
			borderWidth = 1,
			newNode,
			width,
			taskWidth = xRight - xLeft - borderWidth,
			taskHeight = yBottom - yTop - 2 * borderWidth,
			parentDocument = container.ownerDocument,
			self = this,
			i,
			pageRelCoord,
			doc = drawSettings.doc,
			offset = drawSettings.offset,
			startX = drawSettings.startX,
			endX = drawSettings.endX,
			yOffsetHeader = drawSettings.yHeaderOffset,
			startY = drawSettings.startY,
			linksArray = drawSettings.linksArray;

		if (doc) {
			if (taskWidth <= 0) {
				taskWidth = 3;
				xRight += 3;
			}
			var page1 = startX,
				page2 = endX,
				taskPageRelCoord = pdfUtils.getPageRelCoord(
					xLeft,
					xRight,
					page1,
					page2
				),
				pdfTsk1 = taskPageRelCoord.resultX1,
				pdfTsk2 = taskPageRelCoord.resultX2;

			if (pdfTsk1 !== undefined && pdfTsk2 !== undefined) {
				pdfTsk1 += offset;
				pdfTsk2 += offset;

				var rgba;
				var clolorRegExp = /(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d\.\d)\)/g;
				var parseColorStyle = taskColorCSS.match(clolorRegExp);
				if (parseColorStyle) {
					rgba = parseColorStyle[0].split(',');
				}
				if (rgba && rgba.length === 4) {
					var taskR = rgba[0],
						taskG = rgba[1],
						taskB = rgba[2];
					doc.setDrawColorCachable(taskR, taskG, taskB);
					doc.setFillColorCachable(taskR, taskG, taskB);
				} else {
					doc.setDrawColorCachable(0, 0, 255);
					doc.setFillColorCachable(0, 0, 255);
				}

				doc.setAlphaCachable('CA06');
				doc.rect(
					pdfTsk1,
					yTop + yOffsetHeader,
					pdfTsk2 - pdfTsk1,
					taskHeight + 2,
					'FD'
				); // empty square
				doc.setAlphaCachable('CA10');
				doc.rect(
					pdfTsk1,
					yTop + yOffsetHeader,
					pdfTsk2 - pdfTsk1,
					taskHeight + 2
				);
				var needDrawDependencyLinks =
					this.predecessors &&
					(taskPageRelCoord.currentCase === 2 ||
						taskPageRelCoord.currentCase === 3);
				if (needDrawDependencyLinks) {
					for (var f in this.predecessors) {
						if (this.predecessors.hasOwnProperty(f)) {
							this.drawDependanceLink(
								undefined,
								this.predecessors[f].task,
								doc,
								offset,
								startX,
								startY,
								null,
								linksArray
							);
						}
					}
				}
			}
			if (this.project.drawCompletionProgress && this.completionProgress) {
				this.bound = {
					x: xLeft,
					y: yTop,
					width: xRight - xLeft,
					height: yBottom - yTop
				};
				yTop += 3;
				yBottom -= 2;
				width = ((xRight - xLeft) * this.getPercent()) / 100;
				var progressY = yTop - 1;
				var progressW = width && width > 0 ? width : 0;
				var progressH = yBottom - yTop + 1;
				pageRelCoord = pdfUtils.getPageRelCoord(
					xLeft,
					xLeft + progressW,
					page1,
					page2
				);
				var pdfProgress1 = pageRelCoord.resultX1;
				var pdfProgress2 = pageRelCoord.resultX2;
				if (pdfProgress1 !== undefined && pdfProgress2 !== undefined) {
					pdfProgress1 += offset;
					pdfProgress2 += offset;
					var progressWidth = pdfProgress2 - pdfProgress1;
					if (pageRelCoord && progressWidth > 0) {
						doc.setFillColorCachable(0, 0, 0);
						doc.setDrawColorCachable(0, 0, 0);
						doc.setAlphaCachable('CA06');
						doc.rect(
							pdfProgress1,
							progressY + yOffsetHeader,
							progressWidth,
							progressH,
							'F'
						); // empty square
						doc.setAlphaCachable('CA10');
						doc.rect(
							pdfProgress1,
							progressY + yOffsetHeader,
							progressWidth,
							progressH,
							'D'
						); // empty square
					}
				}
			}
			if (this.project.drawTaskFloat) {
				this.bound = {
					x: xLeft,
					y: yTop,
					width: xRight - xLeft,
					height: yBottom - yTop
				};
				yTop = this.bound.y + this.bound.height + 2;
				xLeft =
					this.bound.x -
					DateTime.Date.totalDays(this.startDate - this.earliestStartDate) *
						drawSettings.dayWidth;
				xRight =
					this.bound.x +
					this.bound.width +
					DateTime.Date.totalDays(this.latestEndDate - this.endDate) *
						drawSettings.dayWidth;
				width = parseInt(xRight - xLeft);
				pageRelCoord = pdfUtils.getPageRelCoord(
					xLeft,
					xLeft + width,
					page1,
					page2
				);
				var taskFloat1 = pageRelCoord.resultX1;
				var taskFloat2 = pageRelCoord.resultX2;
				if (taskFloat1 !== undefined && taskFloat2 !== undefined) {
					taskFloat1 += offset;
					taskFloat2 += offset;
					var pdfTaskFloatWidth = taskFloat2 - taskFloat1;
					if (pageRelCoord && pdfTaskFloatWidth > 0) {
						doc.setFillColorCachable(50, 50, 50);
						doc.rect(
							taskFloat1,
							yTop + yOffsetHeader + 2,
							pdfTaskFloatWidth,
							1,
							'F'
						);
						if (pageRelCoord.currentCase === 2) {
							//both
							doc.rect(taskFloat1, yTop + yOffsetHeader + 1, 1, 2, 'F');
							doc.rect(
								taskFloat1 + pdfTaskFloatWidth - 1,
								yTop + yOffsetHeader + 1,
								1,
								2,
								'F'
							);
						} else if (pageRelCoord.currentCase === 5) {
							//right
							doc.rect(
								taskFloat1 + pdfTaskFloatWidth - 1,
								yTop + yOffsetHeader + 1,
								1,
								2,
								'F'
							);
						} else if (pageRelCoord.currentCase === 3) {
							//left
							doc.rect(taskFloat1, yTop + yOffsetHeader + 1, 1, 2, 'F');
						}
					}
				}
			}
		} else {
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

			if (taskWidth > 0) {
				newNode = parentDocument.createElement('div');
				newNode.style.cssText =
					'height:' +
					taskHeight +
					'px;top:' +
					yTop +
					'px; left: ' +
					xLeft +
					'px; width:' +
					taskWidth +
					'px;' +
					taskColorCSS;
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
				this.bound = {
					x: xLeft,
					y: yTop,
					width: xRight - xLeft,
					height: yBottom - yTop
				};

				// draw progress bar
				if (this.project.drawCompletionProgress && this.completionProgress) {
					yTop += 3;
					yBottom -= 2;
					width = ((xRight - xLeft) * this.completionProgress) / 100;
					newNode = parentDocument.createElement('div');
					newNode.className = 'ganttTaskProgress';
					newNode.style.cssText =
						'height:' +
						(yBottom - yTop) +
						'px;top:' +
						yTop +
						'px; left: ' +
						xLeft +
						'px; width:' +
						width +
						'px;' +
						progressColorCSS;
					container.appendChild(newNode);
				}

				// draw floating bar
				if (this.project.drawTaskFloat) {
					var floatBorderWidth = 1;
					yTop = this.bound.y + this.bound.height + 2;
					xLeft =
						this.bound.x -
						DateTime.Date.totalDays(this.startDate - this.earliestStartDate) *
							drawSettings.dayWidth;
					xRight =
						this.bound.x +
						this.bound.width +
						DateTime.Date.totalDays(this.latestEndDate - this.endDate) *
							drawSettings.dayWidth;
					width = parseInt(xRight - xLeft - floatBorderWidth * 2);
					width =
						width < floatBorderWidth * 2 ? floatBorderWidth * 2 + 1 : width;
					newNode = parentDocument.createElement('div');
					newNode.className = 'ganttTaskFloat';
					newNode.style.cssText =
						'height:2px; top:' +
						yTop +
						'px; left: ' +
						xLeft +
						'px; width:' +
						width +
						'px;';
					container.appendChild(newNode);
				}

				for (i = 0; i < this.pendingDrawList.length; i++) {
					this.drawDependanceLink(container, this.pendingDrawList[i].sender);
				}
				this.pendingDrawList = [];
				this.redrawRequires = false;
			}

			this.stylize();
			this.fireOnDraw(container, this.bound);
		}
	};

	Task.prototype.fireOnDraw = function (container, bound) {
		this.onDraw(container, this, bound);
	};

	Task.prototype.drawDependanceLink = function (
		container,
		predTask,
		doc,
		offset,
		startX,
		startY,
		task,
		linksArray
	) {
		var currentTask = task ? task : this,
			canDrawPdfDl =
				doc &&
				currentTask &&
				predTask &&
				currentTask.AbsBounds &&
				predTask.AbsBounds;
		if (
			(predTask.redrawRequires || !this.project.drawDependencyLinks) &&
			!task &&
			!doc
		) {
			return;
		}

		var pred = currentTask.predecessors[predTask.id],
			points = [],
			taskRect = currentTask.bound,
			contentNode,
			i,
			predRect = predTask.bound,
			tipPoint,
			tipNode,
			nodeCssClass;

		if (doc) {
			points = canDrawPdfDl
				? this.getPointsDependencyLink(
						pred,
						currentTask.AbsBounds,
						predTask.AbsBounds,
						doc
				  )
				: [];
			if (canDrawPdfDl) {
				var tipType;
				if (
					pred.precedence === PredecessorType.FinishToFinish ||
					pred.precedence === PredecessorType.StartToFinish
				) {
					tipType = 'Left';
				} else if (pred.precedence === PredecessorType.StartToStart) {
					tipType = 'Right';
				} else if (this.AbsBounds.y > pred.task.AbsBounds.y) {
					//FinishToStart
					tipType = 'Down';
					//from "top" to "bottom"
				} else {
					tipType = 'Up';
				}
				linksArray.push({
					task: this,
					pred: pred,
					link: points,
					startX: startX,
					startY: startY,
					offset: offset,
					tipType: tipType
				});
			}
		} else {
			points = this.getPointsDependencyLink(
				pred,
				currentTask.bound,
				predTask.bound,
				0
			);
			for (i = 0; i < points.length - 1; i++) {
				contentNode = container.ownerDocument.createElement('div');
				contentNode.className = 'ganttDependenceLink';
				contentNode.style.cssText =
					'height:' +
					Math.abs(points[i + 1].y - points[i].y) +
					'px;top:' +
					(points[i].y < points[i + 1].y ? points[i].y : points[i + 1].y) +
					'px; left: ' +
					(points[i].x < points[i + 1].x ? points[i].x : points[i + 1].x) +
					'px; width:' +
					Math.abs(points[i + 1].x - points[i].x) +
					'px;';
				container.appendChild(contentNode);
			}

			tipPoint = points[points.length - 1];
			tipNode = container.ownerDocument.createElement('div');
			tipNode.style.cssText =
				'top:' + tipPoint.y + 'px; left: ' + tipPoint.x + 'px;';

			nodeCssClass = 'ganttDependenceLinkArrow';
			if (
				pred.precedence === PredecessorType.FinishToFinish ||
				pred.precedence === PredecessorType.StartToFinish
			) {
				nodeCssClass += ' arrowRight';
			} else if (pred.precedence === PredecessorType.StartToStart) {
				nodeCssClass += ' arrowLeft';
			} else if (taskRect.y > predRect.y) {
				//FinishToStart
				//from "top" to "bottom"
				nodeCssClass += ' arrowBottom';
			} else {
				nodeCssClass += ' arrowTop';
			}
			tipNode.className = nodeCssClass;
			container.appendChild(tipNode);
		}
	};

	Task.prototype.getPointsDependencyLink = function (
		pred,
		taskRect,
		predRect,
		doc
	) {
		var points = [];
		switch (pred.precedence) {
			case PredecessorType.FinishToFinish:
				points = [{}, {}, {}, {}];
				points[0].x = predRect.x + predRect.width;
				points[0].y = predRect.y + predRect.height / 2;
				if (pred.task.getEndDate() - this.getEndDate() === 0) {
					points[1].x = points[0].x + 8;
				} else {
					points[1].x = points[0].x + 5;
				}
				points[1].y = points[0].y;
				points[2].x = points[1].x;
				points[2].y = taskRect.y + taskRect.height / 2;
				points[3].x = taskRect.x + taskRect.width;
				points[3].y = points[2].y;
				break;
			case PredecessorType.StartToStart:
				points = [{}, {}, {}, {}];
				points[0].x = predRect.x;
				points[0].y = predRect.y + predRect.height / 2;
				if (pred.task.getStartDate() - this.getStartDate() === 0) {
					points[1].x = points[0].x - 8;
				} else {
					points[1].x = points[0].x - 5;
				}
				points[1].y = points[0].y;
				points[2].x = points[1].x;
				points[2].y = taskRect.y + taskRect.height / 2;
				points[3].x = taskRect.x;
				points[3].y = points[2].y;
				break;
			case PredecessorType.StartToFinish:
				points = [{}, {}, {}, {}, {}, {}];
				points[0].x = predRect.x;
				points[0].y = predRect.y + predRect.height / 2;
				points[1].x = points[0].x - 5;
				points[1].y = points[0].y;
				if (taskRect.y > predRect.y) {
					points[2].y = points[1].y + 8;
				} else {
					points[2].y = points[1].y - 8;
				}
				points[2].x = points[1].x;
				points[3].x = taskRect.x + taskRect.width + 8;
				points[3].y = points[2].y;
				points[4].x = points[3].x;
				points[4].y = taskRect.y + taskRect.height / 2;
				points[5].x = taskRect.x + taskRect.width;
				points[5].y = points[4].y;
				break;
			default:
				//FinishToStart
				var linkTaskOffset = 4,
					isTaskUnderPredecessor = predRect.y < taskRect.y,
					isTaskLater =
						predRect.x + predRect.width + linkTaskOffset < taskRect.x;

				points.push({
					x: predRect.x + predRect.width,
					y: predRect.y + predRect.height / 2
				});
				if (!isTaskLater) {
					points.push({ x: points[0].x + linkTaskOffset, y: points[0].y });
					points.push({
						x: points[1].x,
						y: isTaskUnderPredecessor
							? points[1].y + predRect.height / 2 + 2
							: points[1].y - predRect.height / 2 - 3
					});
					points.push({ x: taskRect.x, y: points[2].y });
					points.push({
						x: points[3].x,
						y: isTaskUnderPredecessor
							? taskRect.y
							: taskRect.y + taskRect.height
					});
				} else {
					points.push({ x: taskRect.x, y: points[0].y });
					points.push({
						x: points[1].x,
						y: isTaskUnderPredecessor
							? taskRect.y
							: taskRect.y + taskRect.height
					});
				}
				break;
		}
		return points;
	};
	Task.prototype.invalidate = function () {
		this.redrawRequires = true;
	};

	return Task;
});
