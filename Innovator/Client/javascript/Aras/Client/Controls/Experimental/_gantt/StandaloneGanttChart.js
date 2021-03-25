/*jslint plusplus: true, nomen: true, debug: true*/
/*global define, dojo*/
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/string',
	'./DateTime',
	'./Times_Fields',
	'./Graphics',
	'./Project',
	'./Wbs',
	'./Task',
	'./PredecessorType'
], function (
	declare,
	connect,
	StringModule,
	DateTime,
	Times_Fields,
	Graphics,
	Project,
	Wbs,
	Task,
	PredecessorType
) {
	'use strict';
	var classExtend,
		IntervalType,
		KnotMeter,
		BaseKnotMeterViewer,
		ShortFormatKnotViewer,
		LongFormatKnotViewer,
		ChartFormatKnotViewer,
		gtimeCorrection = 0,
		pdfvisibleItems = {},
		pdfEntityList = [];

	IntervalType = {
		Day: 1,
		Week: 2,
		Month: 3,
		Quarter: 4,
		HalfYear: 5,
		Year: 6
	};

	KnotMeter = function (someDate, shiftDays, shiftMonth, shiftYears) {
		this.date = new Date(someDate);
		this.shiftDays = shiftDays;
		this.shiftMonth = shiftMonth;
		this.shiftYears = shiftYears;
		this.minDate = null;
		this.maxDate = null;

		this.getNext = function () {
			var result = DateTime.Date.addDays(this.date, this.shiftDays);
			result = DateTime.Date.addMonths(result, this.shiftMonth);
			result = DateTime.Date.addYears(result, this.shiftYears);
			return result;
		};

		this.getPrev = function () {
			var result = DateTime.Date.addDays(this.date, -1 * this.shiftDays);
			result = DateTime.Date.addMonths(result, -1 * this.shiftMonth);
			result = DateTime.Date.addYears(result, -1 * this.shiftYears);
			return result;
		};

		this.shiftDateToBefore = function (beaconDate) {
			if (this.date >= beaconDate) {
				while (this.date >= beaconDate) {
					this.date = this.getPrev();
				}
			} else {
				var curDate = this.date;
				while (curDate < beaconDate) {
					this.date = curDate;
					curDate = this.getNext();
				}
			}
		};

		this.getDateX = function (date, width) {
			return parseInt(
				((date - this.minDate) / 86400000) /*(60 * 60 * 1000 * 24)*/ * width
			);
		};
	};

	classExtend = function (Child, Parent) {
		var Fn = function () {};
		Fn.prototype = Parent.prototype;
		Child.prototype = new Fn();
		Child.prototype.constructor = Child;
		Child.superclass = Parent.prototype;
	};

	BaseKnotMeterViewer = function (knotMeter) {
		this.knotMeter = knotMeter;
	};

	BaseKnotMeterViewer.prototype.getNext = function () {
		return this.knotMeter.getNext();
	};

	BaseKnotMeterViewer.prototype.getPrev = function () {
		return this.knotMeter.getPrev();
	};

	BaseKnotMeterViewer.prototype.shiftDateToAfter = function (beaconeDate) {
		this.knotMeter.shiftDateToAfter(beaconeDate);
	};

	BaseKnotMeterViewer.prototype.shiftDateToBefore = function (beaconeDate) {
		this.knotMeter.shiftDateToBefore(beaconeDate);
	};

	Object.defineProperty(BaseKnotMeterViewer.prototype, 'date', {
		get: function () {
			return this.knotMeter.date;
		},
		set: function (value) {
			this.knotMeter.date = value;
		}
	});

	Object.defineProperty(BaseKnotMeterViewer.prototype, 'minDate', {
		get: function () {
			return this.knotMeter.minDate;
		},
		set: function (value) {
			this.knotMeter.minDate = value;
		}
	});

	Object.defineProperty(BaseKnotMeterViewer.prototype, 'maxDate', {
		get: function () {
			return this.knotMeter.maxDate;
		},
		set: function (value) {
			this.knotMeter.maxDate = value;
		}
	});

	BaseKnotMeterViewer.prototype.getDateX = function (date, width) {
		return parseInt(
			((date - this.minDate) / 86400000) /*(60 * 60 * 1000 * 24)*/ * width
		);
	};

	BaseKnotMeterViewer.prototype.headerDateToString = function (date, itype) {
		throw 'Abstract method "headerDateToString" doesn\'t implement!';
	};

	BaseKnotMeterViewer.prototype.draw = function (
		container,
		myTop,
		setup,
		width,
		firstVisibleDay,
		lastVisibleDay,
		itype
	) {
		throw 'Abstract method "draw" doesn\'t implement!';
	};

	BaseKnotMeterViewer.prototype.getWidth = function (xLeft, xRight) {
		if (xLeft < 0) {
			return xRight + Math.abs(xLeft);
		}
		return xRight - xLeft;
	};

	BaseKnotMeterViewer.prototype.cssClass = '';

	ShortFormatKnotViewer = function (knotMeter, doc, offset) {
		BaseKnotMeterViewer.call(this, knotMeter, doc, offset);

		this.cssClass = 'shortFormatKnot';

		this.draw = function (
			container,
			yTop,
			height,
			availableWidth,
			setup,
			width,
			firstVisibleDay,
			lastVisibleDay,
			itype
		) {
			var textAlign = 'center',
				isExit = false,
				xLeft,
				xRight,
				nextDate,
				ownerDocument,
				newNode,
				topBorderHeight = doc ? 1 : 2,
				isDocAndNotFirstIteration = false,
				constCssStyle =
					'height:' +
					(height - topBorderHeight) +
					'px; top:' +
					yTop +
					'px; z-index:2; text-align:' +
					textAlign +
					'; border-color:' +
					setup.gridColor +
					';';

			this.shiftDateToBefore(firstVisibleDay);

			while (this.date <= lastVisibleDay && !isExit) {
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				nextDate = this.getNext();
				xRight = this.getDateX(nextDate, width);
				var shortCellWidth = this.getWidth(xLeft, xRight);
				this.getNext();
				if (xRight > availableWidth) {
					xRight = availableWidth;
					isExit = true;
				}
				if (doc) {
					if (!isDocAndNotFirstIteration) {
						isDocAndNotFirstIteration = true;
						gtimeCorrection = shortCellWidth;
					}
					doc.rect(
						xLeft + offset,
						yTop - 1,
						shortCellWidth,
						height - topBorderHeight
					); // empty square
					doc.setDrawColorCachable(155, 155, 155);
					doc.setTextColorCachable(68, 68, 68);
					if (this.getDateX(this.date, width) >= 0) {
						doc.setFontSizeCachable(9);
						doc.drawClippedText(
							xLeft + offset,
							yTop,
							shortCellWidth,
							height - topBorderHeight,
							this.headerDateToString(this.date, itype),
							'center',
							true,
							'px',
							true
						);
						doc.setFontSizeCachable(8);
					}
				} else {
					ownerDocument = container.ownerDocument;
					newNode = ownerDocument.createElement('div');
					newNode.className = this.cssClass;
					newNode.style.cssText =
						constCssStyle +
						'left: ' +
						xLeft +
						'px; width:' +
						this.getWidth(xLeft, xRight) +
						'px;';
					newNode.innerHTML = this.headerDateToString(this.date, itype);
					container.appendChild(newNode);
				}
				this.date = nextDate;
			}
		};

		this.headerDateToString = function (date, itype) {
			var result;
			switch (itype) {
				case IntervalType.Day:
					result = date.getDate().toString();
					break;
				case IntervalType.Week:
					result = date.getDate().toString();
					break;
				case IntervalType.Month:
					result = DateTime.Date.Months[date.getMonth()].substring(0, 3);
					break;
				case IntervalType.Quarter:
					result = 'Q' + ((date.getMonth() - 1) / 3 + 1).toString();
					break;
				case IntervalType.HalfYear:
					result = 'H' + ((date.getMonth() - 1) / 6 + 1).toString();
					break;
				case IntervalType.Year:
					result = date.getFullYear().toString();
					break;
				default:
					result = date.getFullYear().toString();
					break;
			}
			return result;
		};
	};

	classExtend(ShortFormatKnotViewer, BaseKnotMeterViewer);

	LongFormatKnotViewer = function (knotMeter, arasObj, doc, offset) {
		BaseKnotMeterViewer.call(this, knotMeter, doc, offset);

		this.cssClass = 'longFormatKnot';

		this.draw = function (
			container,
			yTop,
			offsetHeight,
			ganttWidth,
			setup,
			width,
			firstVisibleDay,
			lastVisibleDay,
			itype
		) {
			var textAlign = 'start',
				isExit = false,
				xLeft,
				xRight,
				ownerDocument,
				newNode,
				nextDate,
				topBorderHeight = 1,
				constCssStyle =
					'height:' +
					(offsetHeight - topBorderHeight) +
					'px; z-index:2;top:' +
					yTop +
					'px; overflow:hidden; white-space: nowrap; text-align:' +
					textAlign +
					';border-color:' +
					setup.gridColor +
					';';

			this.shiftDateToBefore(firstVisibleDay);
			while (this.date <= lastVisibleDay && !isExit) {
				nextDate = this.getNext();
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				xRight = this.getDateX(nextDate, width);
				if (xRight > ganttWidth) {
					xRight = ganttWidth;
					isExit = true;
				}
				if (doc) {
					doc.setDrawColorCachable(155, 155, 155);
					doc.setTextColorCachable(68, 68, 68);
					doc.rect(
						xLeft + offset,
						yTop,
						this.getWidth(xLeft, xRight),
						offsetHeight - topBorderHeight
					); // empty square
					doc.setFontSizeCachable('8');
					if (this.getWidth(xLeft, xRight) >= 0 && xLeft !== xRight) {
						doc.setFontSizeCachable(9);
						doc.drawClippedText(
							xLeft + offset,
							yTop,
							this.getWidth(xLeft, xRight),
							offsetHeight - topBorderHeight,
							this.headerDateToString(this.date, itype),
							'left',
							true,
							'px',
							true
						);
						doc.setFontSizeCachable(8);
					}
				} else {
					ownerDocument = container.ownerDocument;
					newNode = ownerDocument.createElement('div');
					newNode.className = this.cssClass;
					newNode.style.cssText =
						constCssStyle +
						'left: ' +
						xLeft +
						'px; width:' +
						this.getWidth(xLeft, xRight) +
						'px;';
					newNode.innerHTML = this.headerDateToString(this.date, itype);
					container.appendChild(newNode);
				}
				this.date = nextDate;
			}
		};

		this.headerDateToString = function (date, itype) {
			var result;
			switch (itype) {
				case IntervalType.Day:
					result = date.getDay().toString();
					break;
				case IntervalType.Week:
					result =
						DateTime.Date.Months[date.getMonth()].substring(0, 3) +
						' ' +
						date.getDate() +
						"'" +
						date.getFullYear().toString().substring(2);
					break;
				case IntervalType.Month:
					result =
						DateTime.Date.Months[date.getMonth()].substring(0, 3) +
						"'" +
						date.getFullYear().toString().substring(2);
					break;
				case IntervalType.Quarter:
					result = arasObj.getResource(
						'Project',
						'gantt.quarter_header_label',
						((date.getMonth() - 1) / 3 + 1).toString(),
						date.getFullYear().toString()
					);
					break;
				case IntervalType.HalfYear:
					result = arasObj.getResource(
						'Project',
						'gantt.halfyear_header_label',
						((date.getMonth() - 1) / 6 + 1).toString(),
						date.getFullYear().toString()
					);
					break;
				case IntervalType.Year:
					result = date.getFullYear().toString();
					break;
				default:
					result = date.getFullYear().toString();
					break;
			}
			return result;
		};
	};

	classExtend(LongFormatKnotViewer, BaseKnotMeterViewer);

	ChartFormatKnotViewer = function (knotMeter, doc, offset) {
		BaseKnotMeterViewer.call(this, knotMeter, doc, offset);

		this.cssClass = 'chartFormatKnot';

		this.draw = function (
			container,
			yTop,
			availableWidth,
			setup,
			width,
			delta,
			firstVisibleDay,
			lastVisibleDay,
			height,
			offset
		) {
			var isExit = false,
				xLeft,
				xRight,
				newNode,
				dayOfWeek,
				nextDate,
				cellwidth,
				holidayColor = Graphics.Colors.fromHexToRGBA(setup.weekendColor, 60),
				constCssStyle =
					'height:100%; top:' +
					yTop +
					'px; border-color:' +
					setup.gridColor +
					';';
			this.shiftDateToBefore(firstVisibleDay);
			while (this.date <= lastVisibleDay && !isExit) {
				nextDate = this.getNext();
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				xRight = this.getDateX(nextDate, width);
				if (xRight > availableWidth) {
					xRight = availableWidth;
					isExit = true;
				}
				if (doc) {
					cellwidth = this.getWidth(xLeft, xRight);
					if (delta === Times_Fields.MONTH) {
						doc.setDrawColorCachable(155, 155, 155);
						doc.setDashStyleCachable('1 1', '1');
						doc.line(xLeft + offset, yTop, xLeft + offset, yTop + height);
					}
					//draw holidays
					if (
						delta === Times_Fields.DAY &&
						(knotMeter.date.getDay() === DateTime.Date.DayOfWeek.Saturday ||
							knotMeter.date.getDay() === DateTime.Date.DayOfWeek.Sunday)
					) {
						doc.setAlphaCachable('CA05');
						doc.setFillColorCachable(180, 180, 180);
						doc.rect(xLeft + offset, yTop, cellwidth, height, 'F'); // empty square
						doc.setAlphaCachable('CA10');
					}
				} else {
					var ownerDocument = container.ownerDocument;
					newNode = ownerDocument.createElement('div');
					newNode.className = this.cssClass;
					newNode.style.cssText =
						constCssStyle +
						'left: ' +
						xLeft +
						'px; width:' +
						this.getWidth(xLeft, xRight) +
						'px;';
					container.appendChild(newNode);
					// draw holidays
					dayOfWeek = knotMeter.date.getDay();
					if (
						delta === Times_Fields.DAY &&
						(dayOfWeek === DateTime.Date.DayOfWeek.Saturday ||
							dayOfWeek === DateTime.Date.DayOfWeek.Sunday)
					) {
						newNode.style.backgroundColor = holidayColor;
					}
				}
				this.date = nextDate;
			}
		};
	};

	classExtend(ChartFormatKnotViewer, BaseKnotMeterViewer);

	return declare(
		'Aras.Client.Controls.Experimental._gantt.StandaloneGanttChart',
		null,
		{
			setup: {},
			rowsIntervalTypes: [],
			dayWidth: 20,
			gridKnotMeters: [],
			isDomCreated: false,
			isProjectLoaded: false,
			renderInterval: 20,
			visualSettings: {
				dependencyLinks: true,
				completionProgress: false,
				taskFloat: true
			},

			constructor: function (/*object {aras, xml, domNode} */ configSettings) {
				if (configSettings) {
					this.aras = configSettings.aras;
					this.width = 0;

					if (configSettings.xml) {
						this.initProject(configSettings.xml);
					}
					this.createGanttDom(configSettings.domNode);
				}
			},

			attachToGrid: function (gridControl) {
				var self = this;

				this.grid = gridControl;
				this.grid.addOnScrollListener_Experimental(function (scrollTop) {
					self.requestRendering();
				});
				dojo.connect(
					this.grid.grid_Experimental,
					'onToggleRow',
					this,
					function () {
						this.requestRendering();
					}
				);
				dojo.connect(this.grid, 'gridXmlLoaded', this.grid, function () {
					self.requestRendering();
				});

				this.updateGanttDomLayout();
				this.requestRendering();
			},

			requestRendering: function () {
				var self = this;

				this.clearRenderTimer();
				this.renderTimer = setTimeout(function () {
					self.render();
				}, this.renderInterval);
			},

			clearRenderTimer: function () {
				if (this.renderTimer) {
					clearTimeout(this.renderTimer);
					this.renderTimer = null;
				}
			},

			initProject: function (projectXml) {
				var projectNode = projectXml.selectSingleNode('/project');

				if (projectNode) {
					this.isProjectLoaded = false;

					this.project = new Project();
					//setup project colors
					this.project.setBackgroundColor(
						this.getNodeValue(projectNode, 'bg-color', Graphics.Colors.White)
					);
					this.project.setColor(
						this.getNodeValue(projectNode, 'color', Graphics.Colors.DarkGray)
					);
					this.project.setGridColor(
						this.getNodeValue(
							projectNode,
							'grid-color',
							Graphics.Colors.DarkGray
						)
					);
					this.project.setWeekendColor(
						this.getNodeValue(
							projectNode,
							'week-color',
							Graphics.Colors.LightGray
						)
					);
					this.project.setDependencyColor(
						this.getNodeValue(
							projectNode,
							'dependency-color',
							Graphics.Colors.Blue
						)
					);
					this.project.setBarColor(
						this.getNodeValue(
							projectNode,
							'bar-color',
							Graphics.Colors.DarkGray
						)
					);
					//this.project.setFont(getFontNodeValue(projectNode, "font"));
					this.project.setProgressColor(
						this.getNodeValue(
							projectNode,
							'progress-color',
							Graphics.Colors.Blue
						)
					);

					this.setup.gridColor = this.project.getGridColor();
					this.setup.wbsColor = Graphics.Colors.Black;
					this.setup.taskColor = this.project.getBarColor();
					this.setup.progressColor = this.project.getProgressColor();
					this.setup.weekendColor = this.project.getWeekendColor();
					this.setup.dependencyColor = this.project.getDependencyColor();

					this.loadSubWbs(projectNode);
					this.loadPredecessors(this.project.getAllWbs());
					this.setDelta(this.getNodeValue(projectNode, 'delta'));
					this.project.drawDependencyLinks = this.visualSettings.dependencyLinks;
					this.project.drawCompletionProgress = this.visualSettings.completionProgress;
					this.project.onItemClick = this.onItemClick;

					this.isProjectLoaded = true;
					this.requestRendering();
				}
			},

			showDependencyLinks: function (doVisible) {
				this.visualSettings.dependencyLinks = Boolean(doVisible);

				if (this.isProjectLoaded) {
					this.project.drawDependencyLinks = this.visualSettings.dependencyLinks;
					this.render();
				}
			},

			showCompletionProgress: function (doVisible) {
				this.visualSettings.completionProgress = Boolean(doVisible);

				if (this.isProjectLoaded) {
					this.project.drawCompletionProgress = this.visualSettings.completionProgress;
					this.render();
				}
			},

			showTaskFloat: function (doVisible) {
				this.visualSettings.taskFloat = Boolean(doVisible);

				if (this.isProjectLoaded) {
					this.project.drawTaskFloat = this.visualSettings.taskFloat;
					this.render();
				}
			},

			loadSubWbs: function (currentNode, parentWbs) {
				var i, entityNode, id, label, wbs;

				for (i = 0; i < currentNode.childNodes.length; i++) {
					entityNode = currentNode.childNodes[i];

					if ('wbs' === entityNode.tagName) {
						id = entityNode.getAttribute('id');
						label = this.getNodeValue(entityNode, 'label');
						wbs = !parentWbs
							? this.project.createWbs(id, label)
							: parentWbs.addSubWbs(id, label);

						this.loadSubWbs(entityNode, wbs);
					} else if ('task' === entityNode.tagName) {
						this.loadSubTask(parentWbs, entityNode);
					}
				}
			},

			loadSubTask: function (wbs, taskNode) {
				var taskNumber = 0,
					taskId = taskNode.getAttribute('id'),
					startDate,
					endDate,
					earliestStart,
					latestFinish,
					tmpStr,
					duration,
					workingDuration,
					label,
					progress,
					is_milestone,
					predecessor,
					assigned,
					num,
					taskLabelFont,
					taskLabelColor,
					taskBarColor,
					taskProgressColor,
					task;

				tmpStr = this.getDateNodeValue(taskNode, 'start-date');
				startDate = tmpStr ? Date.parse(tmpStr) : DateTime.DateTimeNull;

				tmpStr = this.getDateNodeValue(taskNode, 'end-date');
				endDate = tmpStr ? Date.parse(tmpStr) : DateTime.DateTimeNull;

				tmpStr = this.getDateNodeValue(taskNode, 'earliest-start-date');
				earliestStart = tmpStr ? Date.parse(tmpStr) : DateTime.DateTimeNull;

				tmpStr = this.getDateNodeValue(taskNode, 'latest-finish-date');
				latestFinish = tmpStr ? Date.parse(tmpStr) : DateTime.DateTimeNull;

				// parse "duration"
				tmpStr = this.getNodeValue(taskNode, 'duration', '0');
				duration = parseInt(tmpStr);
				if (duration < 0) {
					throw 'Invalid duration value is specified for Task "' + taskId + '"';
				}
				// parse "working-duration"
				tmpStr = this.getNodeValue(taskNode, 'working-duration', '0');
				workingDuration = parseInt(tmpStr);
				label = this.getNodeValue(
					taskNode,
					'label',
					'Task ' + taskNumber.toString()
				);

				tmpStr = this.getNodeValue(taskNode, 'progress', '0');
				progress = parseInt(tmpStr);

				tmpStr = this.getNodeValue(taskNode, 'is_milestone', '0');
				is_milestone = parseInt(tmpStr);
				predecessor = this.getNodeValue(taskNode, 'predecessor', '');
				assigned = this.getNodeValue(taskNode, 'assigned', ' ');
				num = this.getNodeValue(taskNode, 'num', ' ');

				taskLabelFont = this.getFontNodeValue(taskNode, 'label-font');
				taskLabelColor = this.getNodeValue(taskNode, 'label-color', null);
				taskBarColor = this.getNodeValue(taskNode, 'bar-color', null);
				taskProgressColor = this.getNodeValue(taskNode, 'progress-color', null);

				//create and initialize Task instance
				task = wbs.createTask(taskId, label, startDate, endDate, duration);
				task.setIndex(-1);
				task.setLabelFont(taskLabelFont);
				task.setLabelColor(taskLabelColor);
				task.setBarColor(taskBarColor);
				task.setProgressColor(taskProgressColor);
				task.setPercent(progress);
				task.earliestStartDate = earliestStart;
				task.latestEndDate = latestFinish;

				if (workingDuration >= 0) {
					task.setWorkingDuration(workingDuration);
				}
				task.setPredecessor(predecessor);
				task.setNum(num);
				task.setAssigned(assigned);
				task.setIsMilestone(is_milestone);
				taskNumber++;
			},

			loadPredecessors: function (Wbses) {
				//TODO: check
				var i,
					j,
					k,
					wbs,
					regExp = /^([0-9]+)(SS|SF|FS|FF)?((\+|\-)[0-9]+)?$/,
					predsList,
					pred,
					res,
					predNum,
					predTask,
					predType,
					wbsTasks,
					task,
					predString;

				for (i = 0; i < Wbses.length; i++) {
					wbs = Wbses[i];
					wbsTasks = wbs.getTasks();

					for (j = 0; j < wbsTasks.length; j++) {
						task = wbsTasks[j];
						predString = task.getPredecessor();
						if (!predString) {
							continue;
						}
						predsList = predString.split(',');

						for (k = 0; k < predsList.length; k++) {
							pred = predsList[k];
							res = regExp.exec(pred);

							if (res) {
								predNum = parseInt(res[1]);
								predTask = this.project.getTaskByNumber(predNum);
								predType = res[2];

								switch (predType) {
									case 'SS':
										task.appendPredecessor(
											PredecessorType.StartToStart,
											predTask
										);
										break;
									case 'SF':
										task.appendPredecessor(
											PredecessorType.StartToFinish,
											predTask
										);
										break;
									case 'FF':
										task.appendPredecessor(
											PredecessorType.FinishToFinish,
											predTask
										);
										break;
									default:
										task.appendPredecessor(
											PredecessorType.FinishToStart,
											predTask
										);
										break;
								}
							} else {
								throw 'Invalid predecessor format: "' + pred + '"';
							}
						}
					}
				}
			},

			getNodeValue: function (currentNode, nodeName, defaultValue) {
				var tempNode = currentNode.selectSingleNode(nodeName);
				if (!tempNode) {
					return defaultValue;
				}
				return tempNode.text;
			},

			getFontNodeValue: function (currentNode, nodeName) {
				var defaultFontFamily = 'Helvetica',
					defaultFontSize = 8,
					tmpStr,
					isBolt = false,
					isItalic = false,
					fontFamily = defaultFontFamily,
					fontSize = defaultFontSize,
					fontNode = currentNode.selectSingleNode(nodeName);

				if (fontNode) {
					fontFamily = this.getNodeValue(
						fontNode,
						'@family | family',
						defaultFontFamily
					);
					tmpStr = this.getNodeValue(
						fontNode,
						'@size | size',
						defaultFontSize.toString()
					);
					fontSize = parseInt(tmpStr);
					tmpStr = this.getNodeValue(fontNode, '@bold | bold', '0');

					if (tmpStr === '1') {
						isBolt = true;
					}
					tmpStr = getNodeValue(fontNode, '@italic | italic', '0');
					if (tmpStr === '1') {
						isItalic = true;
					}
				}
				return new Graphics.Font(fontFamily, fontSize, isBolt, isItalic);
			},

			getDateNodeValue: function (currentNode, nodeName) {
				var tmpNd = currentNode.selectSingleNode(nodeName);
				if (!tmpNd) {
					return null;
				}

				return tmpNd.getAttribute('value');
			},

			getDateTimeNodeValue: function (dateValue) {
				var dateArray = dateValue.substr(0, dateValue.indexOf('T')).split('-');
				return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
			},

			initializeCSS: function (doc) {
				var style = doc.createElement('style'),
					headElt = doc.getElementsByTagName('head')[0],
					css = '';
				style.type = 'text/css';
				//add color of dependency link tips
				css = StringModule.substitute(
					'${0}\n.tipRight::after { border-color:transparent ${1} transparent  transparent ; }',
					[css, this.setup.dependencyColor]
				);
				css = StringModule.substitute(
					'${0}\n.tipLeft::after { border-color:transparent transparent transparent ${1}; }',
					[css, this.setup.dependencyColor]
				);
				css = StringModule.substitute(
					'${0}\n.tipTop::after { border-color:transparent transparent ${1} transparent; }',
					[css, this.setup.dependencyColor]
				);
				css = StringModule.substitute(
					'${0}\n.tipBottom::after { border-color:${1} transparent transparent transparent; }',
					[css, this.setup.dependencyColor]
				);
				//add color of dependency links
				css = StringModule.substitute(
					'${0}\n.ganttDependenceLink { border-color:${1}}',
					[css, this.setup.dependencyColor]
				);
				css = StringModule.substitute(
					'${0}\n.ganttDependenceLinkArrow { border-color:${1}}',
					[css, this.setup.dependencyColor]
				);
				//add default task color
				css = StringModule.substitute(
					'${0}\n.ganttTask { border-color:${1}; background-color:${2}}',
					[
						css,
						this.setup.taskColor,
						Graphics.Colors.fromHexToRGBA(this.setup.taskColor, 60)
					]
				);
				//add default color for task progress
				css = StringModule.substitute(
					'${0}\n.ganttTaskProgress { background-color:${1}}',
					[css, Graphics.Colors.fromHexToRGBA(this.setup.progressColor, 60)]
				);
				style.appendChild(doc.createTextNode(css));
				headElt.appendChild(style);
			},

			vScrollTo: function (pos) {
				dojo.setStyle(
					this.contentNode,
					'top',
					(2 * this.getGridHeaderHeight() - pos).toString() + 'px'
				);
				dojo.setStyle(
					this.contentNode,
					'height',
					this.domNode.offsetHeight -
						2 * this.getGridHeaderHeight() +
						pos +
						'px'
				);
			},

			updateWidth: function () {
				this.domNode.scrollLeft = 0;
				if (
					this.dayWidth +
						parseInt(
							((this.getMaxChartDate() - this.getMinChartDate()) /
								(60 * 60 * 1000 * 24)) *
								this.dayWidth
						) >
					this.domNode.clientWidth
				) {
					this.width =
						this.dayWidth +
						parseInt(
							((this.getMaxChartDate() - this.getMinChartDate()) /
								(60 * 60 * 1000 * 24)) *
								this.dayWidth
						);
					this.domNode.style.setProperty('overflow-x', 'visible', 'important');
				} else {
					this.width =
						this.domNode.offsetWidth -
						(this.domNode.offsetWidth % this.dayWidth);
					this.domNode.style.setProperty('overflow-x', 'hidden', 'important');
				}
			},

			getKnotMeter: function (interval) {
				var cur = this.getMinChartDate(),
					cultureShift,
					firstDayOfWeek;
				switch (interval) {
					case IntervalType.Day:
						return new KnotMeter(cur, 1, 0, 0);
					case IntervalType.Week:
						//TODO: necessary to implement localization
						firstDayOfWeek = DateTime.Date.DayOfWeek.Monday;
						switch (firstDayOfWeek) {
							case DateTime.Date.DayOfWeek.Tuesday:
								cultureShift = 1;
								break;
							case DateTime.Date.DayOfWeek.Wednesday:
								cultureShift = 2;
								break;
							case DateTime.Date.DayOfWeek.Thursday:
								cultureShift = 3;
								break;
							case DateTime.Date.DayOfWeek.Friday:
								cultureShift = 4;
								break;
							case DateTime.Date.DayOfWeek.Saturday:
								cultureShift = 5;
								break;
							case DateTime.Date.DayOfWeek.Sunday:
								cultureShift = 6;
								break;
							case DateTime.Date.DayOfWeek.Monday:
								cultureShift = 0;
								break;
						}
						switch (cur.getDay()) {
							case DateTime.Date.DayOfWeek.Tuesday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 1),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Wednesday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 2),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Thursday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 3),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Friday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 4),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Saturday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 5),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Sunday:
								return new KnotMeter(
									DateTime.Date.addDays(cur, cultureShift - 6),
									7,
									0,
									0
								);
							case DateTime.Date.DayOfWeek.Monday:
								return new KnotMeter(cur, 7, 0, 0);
						}
						break;
					case IntervalType.Month:
						return new KnotMeter(new Date(cur.getFullYear(), 1, 1), 0, 1, 0);
					case IntervalType.Quarter:
						return new KnotMeter(new Date(cur.getFullYear(), 1, 1), 0, 3, 0);
					case IntervalType.HalfYear:
						return new KnotMeter(new Date(cur.getFullYear(), 1, 1), 0, 6, 0);
					case IntervalType.Year:
						return new KnotMeter(new Date(cur.getFullYear(), 1, 1), 0, 0, 1);
				}
			},

			getMinChartDate: function () {
				var minChartDate = this.project.getMinDate(),
					indentToRight = 40; //px;

				if (minChartDate === DateTime.DateTimeNull) {
					minChartDate = DateTime.Date.today();
				}
				return DateTime.Date.addDays(
					minChartDate,
					-Math.ceil(indentToRight / this.dayWidth)
				);
			},

			getMaxChartDate: function () {
				var maxChartDate = this.project.getMaxDate(),
					indentToLeft = 40; //px;

				if (maxChartDate === DateTime.DateTimeNull) {
					maxChartDate = DateTime.Date.today();
				}
				return DateTime.Date.addDays(
					maxChartDate,
					Math.ceil(indentToLeft / this.dayWidth)
				);
			},

			getMaxVisibleDays: function (maxVisibleX) {
				return DateTime.Date.addDays(
					this.getMaxChartDate(),
					Math.floor(
						(maxVisibleX -
							this.dayWidth -
							parseInt(
								((this.getMaxChartDate() - this.getMinChartDate()) /
									(60 * 60 * 1000 * 24)) *
									this.dayWidth
							)) /
							this.dayWidth
					)
				);
			},

			fillDrawWbsList: function (wbs, visibleItems, entityList) {
				if (visibleItems.length === 0) {
					return;
				}
				if (visibleItems[wbs.id]) {
					entityList.push(wbs);
				}
				var i, childEntity;
				for (i = 0; i < wbs.getSubEntities().length; i++) {
					childEntity = wbs.getSubEntities()[i];
					if (childEntity instanceof Wbs) {
						this.fillDrawWbsList(childEntity, visibleItems, entityList);
					} else if (childEntity instanceof Task) {
						if (visibleItems[childEntity.id]) {
							entityList.push(childEntity);
						}
					}
				}
			},

			drawHeader: function (doc, startDate, endDate, offset) {
				var rowNum,
					rowHeight = 21,
					y,
					viewer,
					firstVisibleDay,
					lastVisibleDay,
					knotMeter;

				if (doc) {
					this.minDate = this.getMinChartDate();
					for (rowNum = 0; rowNum < 2; rowNum++) {
						firstVisibleDay = startDate;
						lastVisibleDay = endDate; // this.getMaxChartDate();
						knotMeter = this.gridKnotMeters[rowNum];
						knotMeter.minDate = startDate;
						knotMeter.maxDate = endDate;
						y = rowHeight * rowNum;
						if (0 === rowNum) {
							viewer = new LongFormatKnotViewer(
								knotMeter,
								this.aras,
								doc,
								offset
							);
							viewer.draw(
								null,
								y,
								rowHeight,
								this.width,
								this.setup,
								this.dayWidth,
								firstVisibleDay,
								lastVisibleDay,
								this.rowsIntervalTypes[rowNum]
							);
						} else {
							viewer = new ShortFormatKnotViewer(knotMeter, doc, offset);
							viewer.draw(
								null,
								y,
								rowHeight,
								this.width,
								this.setup,
								this.dayWidth,
								firstVisibleDay,
								lastVisibleDay,
								this.rowsIntervalTypes[rowNum]
							);
						}
					}
				} else {
					var headerHeight = this.getGridHeaderHeight(),
						headerRowCount = 2,
						shortKnotHeight = 12,
						minChartDate = this.getMinChartDate(),
						maxChartDate = this.getMaxChartDate();
					lastVisibleDay = this.getMaxVisibleDays(this.width);
					this.minDate = minChartDate;
					for (var i = 0; i < headerRowCount; i++) {
						knotMeter = this.gridKnotMeters[i];
						knotMeter.minDate = this.minDate;
						knotMeter.maxDate = maxChartDate;
						if (i === 0) {
							viewer = new LongFormatKnotViewer(knotMeter, this.aras);
							viewer.draw(
								this.headerNode,
								0,
								headerHeight - shortKnotHeight,
								this.width,
								this.setup,
								this.dayWidth,
								minChartDate,
								lastVisibleDay,
								this.rowsIntervalTypes[i]
							);
						} else {
							viewer = new ShortFormatKnotViewer(knotMeter);
							viewer.draw(
								this.headerNode,
								headerHeight - shortKnotHeight,
								shortKnotHeight,
								this.width,
								this.setup,
								this.dayWidth,
								minChartDate,
								lastVisibleDay,
								this.rowsIntervalTypes[i]
							);
						}
					}
				}
			},

			drawChart: function (doc, renderArgs) {
				var treeGridWidth,
					offset,
					startDay,
					endDay,
					rowStart,
					rowEnd,
					v,
					h,
					pageW,
					pageH,
					treeGrid,
					gridPages,
					linksArray,
					intHCountPage;
				if (doc && renderArgs) {
					treeGrid = this.grid; // renderArgs.treeGrid;
					treeGridWidth = renderArgs.treeGridWidth;
					offset = renderArgs.offsetforChartAfterGrid;
					startDay = renderArgs.startDay;
					endDay = renderArgs.endDay;
					rowStart = renderArgs.rowStart;
					rowEnd = renderArgs.rowEnd - 1;
					v = renderArgs.v;
					h = renderArgs.h;
					pageW = renderArgs.pageW;
					pageH = renderArgs.pageH;
					gridPages = renderArgs.gridPages;
					linksArray = renderArgs.linksArray;
					intHCountPage = renderArgs.intHCountPage;
				}
				var visibleItems;
				if (!doc || (doc && v === 0 && h === intHCountPage)) {
					this.project.invalidate(this.project.rootWbs);
				}

				if (doc && v === 0 && h === intHCountPage) {
					pdfvisibleItems = {};
					pdfvisibleItems = (function (treeGrid) {
						var result = {};
						result.length = 0;
						for (var i = 0, count = treeGrid.getRowCount(); i <= count; i++) {
							var row = treeGrid.grid_Experimental.getItem(i);
							if (row) {
								var id = row.uniqueId;
								if (id) {
									result[id] = row;
									result.length++;
								}
							}
						}
						return result;
					})(treeGrid);
				} else {
					visibleItems = this.grid.getVisibleRowsIds_Experimental(
						true /*result as dictionary*/
					);
				}
				var entityList = [],
					entity,
					yHeaderOffset = v === 0 ? 2 * 20 : 0,
					//+++++ graw vertical lines and weekend bold lines
					firstVisibleDay = doc ? startDay : this.minDate,
					lastVisibleDay = doc ? endDay : this.getMaxVisibleDays(this.width), //this.getMaxChartDate();
					knotMeter = this.gridKnotMeters[1],
					viewer = new ChartFormatKnotViewer(knotMeter, doc),
					rowOffsetHeight,
					curOffsetTop;
				knotMeter.minDate = firstVisibleDay;
				knotMeter.maxDate = this.getMaxChartDate();
				viewer.draw(
					this.contentNode,
					v === 0 ? 40 : 0,
					this.width,
					this.setup,
					this.dayWidth,
					this.delta,
					firstVisibleDay,
					lastVisibleDay,
					(rowEnd - rowStart) * 20,
					offset
				);
				var relativeOffsetTop;
				if (!doc) {
					this.fillDrawWbsList(this.project.rootWbs, visibleItems, entityList);
				} else {
					if (v === 0 && h === intHCountPage) {
						pdfEntityList = [];
						this.fillDrawWbsList(
							this.project.rootWbs,
							pdfvisibleItems,
							pdfEntityList
						);
						var topVar = 0;
						for (var e = 0; e < pdfEntityList.length; e++) {
							entity = pdfEntityList[e];
							if (entity instanceof Task) {
								var startDateX = this.getDateX(
									entity.getStartDate(),
									this.dayWidth
								);
								relativeOffsetTop =
									e * rowOffsetHeight - rowStart * rowOffsetHeight;
								var relativeLocation = { x: startDateX, y: relativeOffsetTop };
								entity.setTaskBounds(
									relativeLocation,
									20,
									this.dayWidth,
									topVar
								);
							}
							topVar += 20;
						}
					}
				}
				if (
					(!doc && (!entityList || entityList.length === 0)) ||
					(doc && (!pdfEntityList || pdfEntityList.length === 0))
				) {
					return;
				}

				if (doc) {
					rowOffsetHeight = 20;
					var timeGridOffset = offset || 0;
					var outArray = [];
					var tGrd = 'cm /tGrd Do Q ';
					var vLine = 'cm /vLnG Do Q ';
					var hLine = 'cm /hLng Do Q ';
					var yGrd = rowStart > 0 ? 40 : 0;
					if (this.delta === Times_Fields.DAY) {
						outArray.push(
							'q 1 0 0 1 ' + timeGridOffset + ' ' + yGrd + ' ' + tGrd
						);
					} else {
						outArray.push(
							'q 1 0 0 1 ' + timeGridOffset + ' ' + yGrd + ' ' + hLine
						);
						if (this.delta !== Times_Fields.MONTH) {
							outArray.push(
								'q 1 0 0 1 ' +
									(timeGridOffset + gtimeCorrection) +
									' ' +
									yGrd +
									' ' +
									vLine
							);
						}
					}
					doc.drawExtResource('', '', '', outArray);

					const startPageLocationX = this.getDateX(startDay, this.dayWidth);
					const endPageLocationX = this.getDateX(endDay, this.dayWidth);
					for (var r = rowStart; r < rowEnd; r++) {
						// horizontal time lines
						var startY = rowStart * rowOffsetHeight;
						relativeOffsetTop = r * rowOffsetHeight - startY;
						entity = pdfEntityList[r];

						if (r === rowEnd - 1) {
							doc.setDrawColorCachable(155, 155, 155);
							doc.setDashStyleCachable('', '0');
							doc.line(
								offset,
								relativeOffsetTop + yHeaderOffset + rowOffsetHeight,
								this.width + offset,
								relativeOffsetTop + yHeaderOffset + rowOffsetHeight
							);
						}

						const drawSettings = {
							x: null,
							y: relativeOffsetTop,
							width: this.width,
							height: rowOffsetHeight,
							dayWidth: this.dayWidth,
							color: this.setup.progressColor,
							doc: doc,
							offset: offset,
							startX: startPageLocationX,
							endX: endPageLocationX,
							yHeaderOffset: yHeaderOffset,
							startY: 20,
							linksArray: linksArray
						};

						if (entity instanceof Wbs) {
							drawSettings.x = this.getDateX(
								entity.getMinDate(),
								this.dayWidth
							);
							entity.draw(this.contentNode, drawSettings);
						}
						if (entity instanceof Task) {
							drawSettings.x = this.getDateX(
								entity.getStartDate(),
								this.dayWidth
							);
							entity.draw(this.contentNode, drawSettings);
						}
					}
				} else {
					let location;
					const treeGridOffsetTop = this.grid.getTreeGridOffsetTop_Experimental();
					for (let w = 0; w < entityList.length; w++) {
						entity = entityList[w];
						const row = this.grid.getRowByItemId_Experimental(entity.id);
						if (!row) {
							continue;
						}

						rowOffsetHeight = row.offsetHeight;
						curOffsetTop =
							this.grid.getElementOffsetTop_Experimental(row) -
							treeGridOffsetTop;

						if (entity instanceof Wbs) {
							location = {
								x: this.getDateX(entity.getMinDate(), this.dayWidth),
								y: curOffsetTop
							};
							entity.draw(this.contentNode, {
								x: location.x,
								y: location.y,
								width: this.width,
								height: rowOffsetHeight,
								dayWidth: this.dayWidth,
								color: this.setup.wbsColor,
								onClick: this.onItemClick
							});
						} else if (entity instanceof Task) {
							location = {
								x: this.getDateX(entity.getStartDate(), this.dayWidth),
								y: curOffsetTop
							};
							entity.draw(this.contentNode, {
								x: location.x,
								y: location.y,
								width: this.width,
								height: rowOffsetHeight,
								dayWidth: this.dayWidth,
								color: this.setup.progressColor,
								onClick: this.onItemClick
							});
						}
					}
				}
			},

			getDateX: function (date, width) {
				return parseInt(
					DateTime.Date.totalDays(date - this.getMinChartDate()) * width
				);
			},

			getAllEntities: function (wbs, entityList) {
				var subEntites = wbs.getSubEntities(),
					tmpEntity,
					i;

				entityList.push(wbs);
				for (i = 0; i < subEntites.length; i++) {
					tmpEntity = subEntites[i];
					if (tmpEntity instanceof Wbs) {
						//TODO: necessary to implement later
						//if (!projectTree.IsWbsVisible(visibleItems, tmpWbs)) continue;
						this.getAllEntities(tmpEntity, entityList);
					}
					if (tmpEntity instanceof Task) {
						//TODO: necessary to implement later
						//if (!projectTree.IsTaskVisible(visibleItems, tmpTask)) continue;
						entityList.push(tmpEntity);
					}
				}
			},

			setDelta: function (newValue) {
				var timeDelta = Times_Fields.DAY;

				newValue = newValue || 'day';
				newValue = newValue.trim().toLowerCase();

				switch (newValue) {
					case 'week':
						timeDelta = Times_Fields.WEEK;
						break;
					case 'month':
						timeDelta = Times_Fields.MONTH;
						break;
					case 'quarter':
						timeDelta = Times_Fields.QUARTER;
						break;
					case 'year':
						timeDelta = Times_Fields.YEAR;
						break;
					default:
						//"day"
						timeDelta = Times_Fields.DAY;
						break;
				}

				if (this.project) {
					this.project.setDelta(timeDelta);
				}

				this.setGanttDelta(timeDelta);
				this.requestRendering();
			},

			setGanttDelta: function (timeDelta) {
				this.delta = timeDelta;
				//calculate dates lines in chart header
				switch (timeDelta) {
					case Times_Fields.DAY:
						this.rowsIntervalTypes[0] = IntervalType.Week;
						this.rowsIntervalTypes[1] = IntervalType.Day;
						this.dayWidth = 20;
						break;
					case Times_Fields.WEEK:
						this.rowsIntervalTypes[0] = IntervalType.Month;
						this.rowsIntervalTypes[1] = IntervalType.Week;
						this.dayWidth = 20.0 / 7;
						break;
					case Times_Fields.MONTH:
						this.rowsIntervalTypes[0] = IntervalType.Quarter;
						this.rowsIntervalTypes[1] = IntervalType.Month;
						this.dayWidth = 30.0 / (365.0 / 12);
						break;
					case Times_Fields.QUARTER:
						this.rowsIntervalTypes[0] = IntervalType.Year;
						this.rowsIntervalTypes[1] = IntervalType.Quarter;
						this.dayWidth = 20.0 / (365 / 4);
						break;
					case Times_Fields.YEAR:
						this.rowsIntervalTypes[0] = IntervalType.Year;
						this.rowsIntervalTypes[1] = IntervalType.HalfYear;
						this.dayWidth = 20.0 / (365 / 2);
						break;
				}

				this.gridKnotMeters[0] = this.getKnotMeter(this.rowsIntervalTypes[0]);
				this.gridKnotMeters[1] = this.getKnotMeter(this.rowsIntervalTypes[1]);
			},

			render: function () {
				this.clearRenderTimer();

				if (this.grid && this.isDomCreated && this.isProjectLoaded) {
					this.cleanBodyContainer();

					this.updateWidth();
					this.drawHeader();
					this.drawChart();
				}
			},

			createGanttDom: function (domNode) {
				if (domNode) {
					var ownerDocument = domNode.ownerDocument;

					this.headerNode = ownerDocument.createElement('div');
					this.headerNode.style.cssText =
						'position:absolute; top:0; height: ' +
						this.getGridHeaderHeight() +
						'px; left:0; right:0; z-index:1;';

					this.contentNode = ownerDocument.createElement('div');
					this.contentNode.style.cssText =
						'position:absolute; top:' +
						this.getGridHeaderHeight() +
						'px; bottom:0; left:0; right:0; z-index:0;';

					this.domNode = domNode;
					this.domNode.innerHTML = '';
					this.domNode.appendChild(this.headerNode);
					this.domNode.appendChild(this.contentNode);
					dojo.connect(this.domNode, 'contextmenu', function (evt) {
						dojo.stopEvent(evt);
					});
					dojo.connect(this.domNode, 'resize', this, function () {
						this.requestRendering();
					});

					this.isDomCreated = true;
				}
			},

			cleanBodyContainer: function () {
				this.headerNode.innerHTML = '';
				this.contentNode.innerHTML = '';
			},

			updateGanttDomLayout: function () {
				if (this.isDomCreated) {
					var headerHeight = this.getGridHeaderHeight();

					this.headerNode.style.bottom = headerHeight + 'px';
					this.contentNode.style.top = headerHeight + 'px';
				}
			},

			getGridHeaderHeight: function () {
				var resultHeight = 0;
				if (this.grid) {
					resultHeight = this.grid.grid_Experimental.viewsHeaderNode
						.offsetHeight;
				}
				return resultHeight;
			},

			onItemClick: function (/*string*/ itemId) {
				//event handler: raised when user clicks on item in gantt
			}
		}
	);
});
