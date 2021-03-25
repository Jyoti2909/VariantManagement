/*jslint plusplus: true, nomen: true, debug: true*/
/*global define, dojo*/
define([
	'dojo/string',
	'./DateTime',
	'./Times_Fields',
	'./Graphics',
	'./Wbs',
	'./Task',
	'./pdfGanttChart/PdfXObject',
	'./pdfGanttChart/PdfRenderingUtilities',
	'./pdfGanttChart/pdfGanttChart',
	'./pdfGanttChart/pdfTreeGrid'
], function (
	StringModule,
	DateTime,
	Times_Fields,
	Graphics,
	Wbs,
	Task,
	PdfXobject,
	PdfUtilities,
	PdfGanttChart,
	PdfTreeGrid
) {
	'use strict';
	var classExtend,
		IntervalType,
		KnotMeter,
		BaseKnotMeterViewer,
		ShortFormatKnotViewer,
		LongFormatKnotViewer,
		ChartFormatKnotViewer,
		GanttChart,
		pdfvisibleItems = {},
		pdfEntityList = [],
		gtimeCorrection = 0;
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
			return ((date - this.minDate) / (60 * 60 * 1000 * 24)) * width;
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
			((date - this.minDate) / (60 * 60 * 1000 * 24)) * width,
			10
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
			ganttWidth,
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
				contentNode,
				isDocAndNotFirstIteration = false,
				topBorderHeight = 1; //px;
			this.shiftDateToBefore(firstVisibleDay);
			while (this.date <= lastVisibleDay) {
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				var nextDay = this.getNext();
				xRight = this.getDateX(nextDay, width);
				var shortCellWidth = this.getWidth(xLeft, xRight);
				this.getNext();
				if (xRight > ganttWidth) {
					xRight = ganttWidth;
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
					contentNode = dojo.create('div', {
						vAlign: 'top',
						//TODO: try to use object
						style:
							'height:' +
							(height - 2) +
							'px; top:' +
							yTop +
							'px;z-index:2; left: ' +
							xLeft +
							'px; width:' +
							this.getWidth(xLeft, xRight) +
							'px; text-align:' +
							textAlign +
							';border-color:' +
							setup.gridColor,
						class: this.cssClass,
						innerHTML: this.headerDateToString(this.date, itype)
					});
					container.appendChild(contentNode);
				}
				this.date = this.getNext();
				if (isExit) {
					return;
				}
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
		BaseKnotMeterViewer.call(this, knotMeter, offset);

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
				contentNode,
				topBorderHeight = 1; //px
			this.shiftDateToBefore(firstVisibleDay);
			while (this.date <= lastVisibleDay) {
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				xRight = this.getDateX(this.getNext(), width);
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
					contentNode = dojo.create('div', {
						vAlign: 'top',
						//TODO: try to use object
						style:
							'height:' +
							(offsetHeight - topBorderHeight) +
							'px; z-index:2;top:' +
							yTop +
							'px; left: ' +
							xLeft +
							'px; width:' +
							this.getWidth(xLeft, xRight) +
							'px;' +
							'overflow:hidden; white-space: nowrap; text-align:' +
							textAlign +
							';border-color:' +
							setup.gridColor,
						class: this.cssClass,
						innerHTML: this.headerDateToString(this.date, itype)
					});
					container.appendChild(contentNode);
				}

				this.date = this.getNext();
				if (isExit) {
					return;
				}
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
		BaseKnotMeterViewer.call(this, knotMeter, offset);

		this.cssClass = 'chartFormatKnot';

		this.draw = function (
			container,
			yTop,
			ganttWidth,
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
				cellwidth,
				contentNode;
			this.shiftDateToBefore(firstVisibleDay);

			while (this.date <= lastVisibleDay) {
				xLeft = this.getDateX(this.date, width);
				xLeft = xLeft < 0 ? 0 : xLeft;
				xRight = this.getDateX(this.getNext(), width);
				cellwidth = this.getWidth(xLeft, xRight);
				if (xRight > ganttWidth) {
					xRight = ganttWidth;
					isExit = true;
				}
				if (doc) {
					if (delta === Times_Fields.MONTH) {
						doc.setDrawColorCachable(155, 155, 155);
						doc.setDashStyleCachable('1 1', '1');
						doc.line(xLeft + offset, yTop, xLeft + offset, yTop + height);
					}
				} else {
					contentNode = dojo.create('div', {
						vAlign: 'top',
						//TODO: try to use object
						style:
							'height:100%; top:' +
							yTop +
							'px; left: ' +
							xLeft +
							'px; width:' +
							cellwidth +
							'px;border-color:' +
							setup.gridColor,
						class: this.cssClass
					});
					container.appendChild(contentNode);
				}
				//draw holidays
				if (
					delta === Times_Fields.DAY &&
					(knotMeter.date.getDay() === DateTime.Date.DayOfWeek.Saturday ||
						knotMeter.date.getDay() === DateTime.Date.DayOfWeek.Sunday)
				) {
					if (doc) {
						doc.setAlphaCachable('CA05');
						doc.setFillColorCachable(180, 180, 180);
						doc.rect(xLeft + offset, yTop, cellwidth, height, 'F'); // empty square
						doc.setAlphaCachable('CA10');
					} else {
						contentNode.style.backgroundColor = Graphics.Colors.fromHexToRGBA(
							setup.weekendColor,
							60
						);
					}
				}
				if (isExit) {
					return;
				}
				this.date = this.getNext();
			}
		};
	};

	classExtend(ChartFormatKnotViewer, BaseKnotMeterViewer);
	GanttChart = function (tree) {
		var setup = {},
			rowsIntervalTypes = [],
			projectTree = tree,
			project = tree.getProject(),
			dayWidth = 20,
			gridKnotMeters = [],
			self = this;

		this.width = 0;
		this.container = tree.ganttContainer;
		this.arasObj = tree.arasObj;

		setup.gridColor = project.getGridColor();
		setup.wbsColor = Graphics.Colors.Black;
		setup.taskColor = project.getBarColor();
		setup.progressColor = project.getProgressColor();
		setup.weekendColor = project.getWeekendColor();
		setup.dependencyColor = project.getDependencyColor();

		dojo.connect(tree.treeGrid, 'gridXmlLoaded', tree, function () {
			self.refreshLayout();
		});
		tree.treeGrid.addOnScrollListener_Experimental(function (scrollTop) {
			self.render();
		});
		dojo.connect(this.container, 'resize', this, function () {
			this.render();
		});
		dojo.connect(tree.treeGrid, 'onToggleRow', this, function () {
			this.render();
		});

		this.initializeCSS = function (doc) {
			var style = doc.createElement('style'),
				headElt = doc.getElementsByTagName('head')[0],
				css = '';
			style.type = 'text/css';
			//add color of dependency link tips
			css = StringModule.substitute(
				'${0}\n.tipRight::after { border-color:transparent ${1} transparent  transparent ; }',
				[css, setup.dependencyColor]
			);
			css = StringModule.substitute(
				'${0}\n.tipLeft::after { border-color:transparent transparent transparent ${1}; }',
				[css, setup.dependencyColor]
			);
			css = StringModule.substitute(
				'${0}\n.tipTop::after { border-color:transparent transparent ${1} transparent; }',
				[css, setup.dependencyColor]
			);
			css = StringModule.substitute(
				'${0}\n.tipBottom::after { border-color:${1} transparent transparent transparent; }',
				[css, setup.dependencyColor]
			);
			//add color of dependency links
			css = StringModule.substitute(
				'${0}\n.ganttDependenceLink { border-color:${1}}',
				[css, setup.dependencyColor]
			);
			css = StringModule.substitute(
				'${0}\n.ganttDependenceLinkArrow { border-color:${1}}',
				[css, setup.dependencyColor]
			);
			//add default task color
			css = StringModule.substitute(
				'${0}\n.ganttTask { border-color:${1}; background-color:${2}}',
				[
					css,
					setup.taskColor,
					Graphics.Colors.fromHexToRGBA(setup.taskColor, 60)
				]
			);
			//add default color for task progress
			css = StringModule.substitute(
				'${0}\n.ganttTaskProgress { background-color:${1}}',
				[css, Graphics.Colors.fromHexToRGBA(setup.progressColor, 60)]
			);
			style.appendChild(doc.createTextNode(css));
			headElt.appendChild(style);
		};

		this.vScrollTo = function (pos) {
			dojo.setStyle(
				this.bodyContainer,
				'top',
				(2 * tree.getRowHeaderHeight() - pos).toString() + 'px'
			);
			dojo.setStyle(
				this.bodyContainer,
				'height',
				this.container.domNode.offsetHeight -
					2 * tree.getRowHeaderHeight() +
					pos +
					'px'
			);
		};

		this.updateWidth = function () {
			this.container.domNode.scrollLeft = 0;
			if (
				dayWidth +
					parseInt(
						((this.getMaxChartDate() - this.minDate) / (60 * 60 * 1000 * 24)) *
							dayWidth,
						10
					) >
				this.container.domNode.clientWidth
			) {
				this.width =
					dayWidth +
					parseInt(
						((this.getMaxChartDate() - this.minDate) / (60 * 60 * 1000 * 24)) *
							dayWidth,
						10
					);
				this.container.domNode.style.setProperty(
					'overflow-x',
					'visible',
					'important'
				);
			} else {
				this.width =
					this.container.domNode.clientWidth -
					(this.container.domNode.clientWidth % dayWidth);
				if (dojo.getStyle(this.container.domNode, 'width') !== this.width) {
					dojo.setStyle(this.container.domNode, 'width', this.width + 1 + 'px');
				}
				this.container.domNode.style.setProperty(
					'overflow-x',
					'hidden',
					'important'
				);
			}
		};

		this.getKnotMeter = function (interval) {
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
		};

		this.getMinChartDate = function () {
			var minChartDate = project.getMinDate(),
				indentToRight = 40; //px;
			if (minChartDate === DateTime.Date.DateTimeNull) {
				minChartDate = DateTime.Date.today();
			}
			return DateTime.Date.addDays(
				minChartDate,
				-Math.ceil(indentToRight / dayWidth)
			);
		};

		this.getMaxChartDate = function () {
			var maxChartDate = project.getMaxDate(),
				indentToLeft = 40; //px;
			if (maxChartDate === DateTime.Date.DateTimeNull) {
				maxChartDate = DateTime.Date.today();
			}
			return DateTime.Date.addDays(
				maxChartDate,
				Math.ceil(indentToLeft / dayWidth)
			);
		};

		this.getMaxVisibleDays = function (maxVisibleX) {
			return DateTime.Date.addDays(
				this.getMaxChartDate(),
				Math.floor(
					(maxVisibleX -
						dayWidth -
						parseInt(
							((this.getMaxChartDate() - this.minDate) /
								(60 * 60 * 1000 * 24)) *
								dayWidth,
							10
						)) /
						dayWidth
				)
			);
		};

		this.fillDrawWbsList = function (wbs, visibleItems, entityList) {
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
		};

		this.drawHeader = function (doc, startDate, endDate, offset) {
			var rowNum,
				rowHeight = doc ? 21 : projectTree.getRowHeaderHeight(), //todo: use rowHeaderHeight for pdf doc
				y,
				viewer,
				firstVisibleDay,
				lastVisibleDay,
				knotMeter;
			this.minDate = this.getMinChartDate();
			for (rowNum = 0; rowNum < 2; rowNum++) {
				firstVisibleDay = startDate ? startDate : this.minDate;
				lastVisibleDay = endDate ? endDate : this.getMaxVisibleDays(this.width); // this.getMaxChartDate();
				knotMeter = gridKnotMeters[rowNum];
				knotMeter.minDate = firstVisibleDay;
				knotMeter.maxDate = this.getMaxChartDate();
				y = rowHeight * rowNum;
				if (0 === rowNum) {
					viewer = new LongFormatKnotViewer(
						knotMeter,
						this.arasObj,
						doc,
						offset
					);
					viewer.draw(
						this.container.domNode,
						y,
						rowHeight,
						this.width,
						setup,
						dayWidth,
						firstVisibleDay,
						lastVisibleDay,
						rowsIntervalTypes[rowNum]
					);
				} else {
					viewer = new ShortFormatKnotViewer(knotMeter, doc, offset);
					viewer.draw(
						this.container.domNode,
						y,
						rowHeight,
						this.width,
						setup,
						dayWidth,
						firstVisibleDay,
						lastVisibleDay,
						rowsIntervalTypes[rowNum]
					);
				}
			}
		};

		this.drawChart = function (doc, renderArgs) {
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
				vertPageCount,
				horizPageCount,
				gridPages,
				linksArray,
				intHCountPage;
			if (doc && renderArgs) {
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
				project.invalidate(project.rootWbs);
			}
			if (doc && v === 0 && h === intHCountPage) {
				pdfvisibleItems = {};
				pdfvisibleItems = (function (treegrid) {
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
				})(project.treeGrid);
			} else {
				visibleItems = project.treeGrid.getVisibleRowsIds_Experimental(
					true /*result as dictionary*/
				);
			}
			var entityList = [],
				i,
				y,
				entity,
				location,
				contentNode,
				yHeaderOffset = v === 0 ? 2 * 20 : 0,
				//+++++ graw vertical lines and weekend bold lines
				firstVisibleDay = doc ? startDay : this.minDate,
				lastVisibleDay = doc ? endDay : this.getMaxVisibleDays(this.width), //this.getMaxChartDate();
				knotMeter = gridKnotMeters[1],
				viewer = new ChartFormatKnotViewer(knotMeter, doc),
				firstVisibleRow,
				rowOffsetHeight,
				curOffsetTop;
			knotMeter.minDate = firstVisibleDay;
			knotMeter.maxDate = this.getMaxChartDate();
			viewer.draw(
				this.bodyContainer,
				v === 0 ? 40 : 0,
				this.width,
				setup,
				dayWidth,
				this.delta,
				firstVisibleDay,
				lastVisibleDay,
				(rowEnd - rowStart) * 20,
				offset
			);
			var relativeOffsetTop;
			if (!doc) {
				this.fillDrawWbsList(project.rootWbs, visibleItems, entityList);
			} else {
				if (v === 0 && h === intHCountPage) {
					pdfEntityList = [];
					this.fillDrawWbsList(project.rootWbs, pdfvisibleItems, pdfEntityList);
					var topVar = 0;
					for (var e = 0; e < pdfEntityList.length; e++) {
						entity = pdfEntityList[e];
						if (entity instanceof Task) {
							var startDateX = this.getDateX(entity.getStartDate(), dayWidth);
							relativeOffsetTop =
								e * rowOffsetHeight - rowStart * rowOffsetHeight;
							var relativeLocation = { x: startDateX, y: relativeOffsetTop };
							entity.setTaskBounds(relativeLocation, 20, dayWidth, topVar);
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
			} else {
				firstVisibleRow = project.treeGrid.getRowByItemId_Experimental(
					entityList[0].id
				);
				if (!firstVisibleRow) {
					return;
				}
				rowOffsetHeight = firstVisibleRow.offsetHeight;
				curOffsetTop =
					project.treeGrid.getElementOffsetTop_Experimental(firstVisibleRow) -
					project.treeGrid.getTreeGridOffsetTop_Experimental();
			}
			if (doc) {
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
					var startPageLocationX = this.getDateX(startDay, dayWidth);
					var endPageLocationX = this.getDateX(endDay, dayWidth);

					var drawSettings = {
						x: null,
						y: null,
						width: this.width,
						height: rowOffsetHeight,
						dayWidth: dayWidth,
						color: setup.progressColor,
						doc: doc,
						offset: offset,
						startX: startPageLocationX,
						endX: endPageLocationX,
						yHeaderOffset: yHeaderOffset,
						startY: 20,
						linksArray: linksArray
					};

					if (entity instanceof Wbs) {
						location = {
							x: this.getDateX(entity.getMinDate(), dayWidth),
							y: relativeOffsetTop
						};
						drawSettings.x = location.x;
						drawSettings.y = location.y;
						entity.draw(this.bodyContainer, drawSettings);
					}
					if (entity instanceof Task) {
						location = {
							x: this.getDateX(entity.getStartDate(), dayWidth),
							y: relativeOffsetTop
						};
						drawSettings.x = location.x;
						drawSettings.y = location.y;
						entity.draw(this.bodyContainer, drawSettings);
					}
				}
			} else {
				for (var w = 0; w < entityList.length; w++) {
					entity = entityList[w];

					if (entity instanceof Wbs) {
						location = {
							x: this.getDateX(entity.getMinDate(), dayWidth),
							y: curOffsetTop
						};
						entity.draw(this.bodyContainer, {
							x: location.x,
							y: location.y,
							width: this.width,
							height: rowOffsetHeight,
							dayWidth: dayWidth,
							color: setup.wbsColor
						});
					} else if (entity instanceof Task) {
						location = {
							x: this.getDateX(entity.getStartDate(), dayWidth),
							y: curOffsetTop
						};
						entity.draw(this.bodyContainer, {
							x: location.x,
							y: location.y,
							width: this.width,
							height: rowOffsetHeight,
							dayWidth: dayWidth,
							color: setup.progressColor
						});
					}
					curOffsetTop += rowOffsetHeight;
				}
			}
		};

		this.getDateX = function (date, width) {
			return parseInt(DateTime.Date.totalDays(date - this.minDate) * width, 10);
		};

		this.getAllEntities = function (wbs, entityList) {
			var tmpEntity,
				subEntites = wbs.getSubEntities();
			entityList.push(wbs);
			for (var s = 0; s < subEntites.length; s++) {
				tmpEntity = subEntites[s];
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
		};

		this.setDelta = function (idelta) {
			this.delta = idelta;
			//calculate dates lines in chart header
			switch (idelta) {
				case Times_Fields.DAY:
					rowsIntervalTypes[0] = IntervalType.Week;
					rowsIntervalTypes[1] = IntervalType.Day;
					dayWidth = 20;
					break;
				case Times_Fields.WEEK:
					rowsIntervalTypes[0] = IntervalType.Month;
					rowsIntervalTypes[1] = IntervalType.Week;
					dayWidth = 20.0 / 7;
					break;
				case Times_Fields.MONTH:
					rowsIntervalTypes[0] = IntervalType.Quarter;
					rowsIntervalTypes[1] = IntervalType.Month;
					dayWidth = 30.0 / (365.0 / 12);
					break;
				case Times_Fields.QUARTER:
					rowsIntervalTypes[0] = IntervalType.Year;
					rowsIntervalTypes[1] = IntervalType.Quarter;
					dayWidth = 20.0 / (365 / 4);
					break;
				case Times_Fields.YEAR:
					rowsIntervalTypes[0] = IntervalType.Year;
					rowsIntervalTypes[1] = IntervalType.HalfYear;
					dayWidth = 20.0 / (365 / 2);
					break;
			}
			gridKnotMeters[0] = this.getKnotMeter(rowsIntervalTypes[0]);
			gridKnotMeters[1] = this.getKnotMeter(rowsIntervalTypes[1]);
			this.render();
		};

		this.renderPDf = function (/* todo: add print properties from UI or config: paper orientation, size...' unit*/) {
			this.setDelta(project.getDelta());
			var gantt = this,
				treegrid = tree.treeGrid,
				treegridpdf = new PdfTreeGrid(
					{
						treegrid: treegrid,
						startY: 20
					} /*shift grid row to  ganttChart row Y level */
				),
				ganttchart = new PdfGanttChart({
					gantt: gantt,
					treegrid: treegrid,
					dayWidth: dayWidth
				}),
				controlsToRender = [treegridpdf, ganttchart]; // render confrols left to right, we can change order if need

			var printGantChart = function (jsPDF) {
				var pdfOption = {
					unit: 'pt',
					compress: true,
					orientation: 'l',
					lineWidth: 0.5,
					format: 'a4'
				};
				var doc = new jsPDF(pdfOption);
				var documentProperties = {
					// todo: fill actual properties from solution
					title: 'Project',
					subject: 'GanttChart',
					author: 'GanttChart',
					keywords: 'gantt',
					creator: 'Aras Innovator Project Solution'
				};
				doc.setProperties(documentProperties);
				doc.setDrawColor(0, 0, 0);
				doc.setLineWidth(0.5);
				doc.setFontSize(8); // todo: get font size from grid style
				var langDir = dojoConfig.arasContext.languageDirection;
				doc.setLangDir(langDir);
				var utils = new PdfUtilities();
				utils.buildPdfDocument(controlsToRender, doc);
				utils.preparePdfToSave(doc);
				tree.treeGrid.grid_Experimental.scrollTo(0, 0);
			};
			require(['Printing/Scripts/Classes/JsPdfLoader'], function (loader) {
				loader.loadScripts(printGantChart, [
					'jspdf.plugin.text.js',
					'jspdf.plugin.bidi.js',
					'jspdf.plugin.graphics.js'
				]);
			});
		};

		this.render = function () {
			dojo.empty(this.container.domNode);
			this.bodyContainer = dojo.create('div', {
				//TODO: try to use object
				style:
					'height:100%;top:' +
					2 * tree.getRowHeaderHeight() +
					'px; left:0px; overflow-y:visible; width: 100%; position:absolute;z-index:0;',
				id: 'bodyContainer'
			});
			this.container.domNode.appendChild(this.bodyContainer);
			dojo.connect(this.container.domNode, 'contextmenu', function (evt) {
				dojo.stopEvent(evt);
			});
			this.updateWidth();
			this.drawHeader();
			this.drawChart();
		};

		this.refreshLayout = function () {
			tree.treeGrid.grid_Experimental.domNode.style.marginTop =
				tree.getRowHeaderHeight() + 'px';
			tree.treeContainer.resize();
			this.render();
		};

		this.setDelta(project.getDelta());
		this.refreshLayout();
	};
	return GanttChart;
});
