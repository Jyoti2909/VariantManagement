/*global define, XmlDocument*/
/*jslint nomen: true,  plusplus: true,  continue: true */
define([
	'Aras/Client/Controls/Public/TreeGridContainer',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	'./_gantt/Graphics',
	'./_gantt/DateTime',
	'./_gantt/Times_Fields',
	'./_gantt/Project',
	'./_gantt/GanttChart',
	'./_gantt/PredecessorType'
], function (
	TreeGridContainer,
	BorderContainer,
	ContentPane,
	Graphics,
	DateTime,
	Times_Fields,
	Project,
	GanttChart,
	PredecessorType
) {
	'use strict';

	var GanttChartContainer = function (contentNode, arasObj) {
		this.content = contentNode;
		this.arasObj = arasObj;
		this.allLinks = [];
		var self = this,
			default_input_date_format = 'MM/DD/YY',
			default_display_date_format = 'MM/DD/YY',
			default_column_titles =
				'Task,N,Pred,Assigned,Start Date,End Date,Duration,Progress',
			default_column_titles_count = 8,
			allWbs = [],
			project = null,
			getNodeValue = function (currentNode, nodeName) {
				var tmpNd = currentNode.selectSingleNode(nodeName);
				if (!tmpNd) {
					return null;
				}
				return tmpNd.text;
			},
			getNodeValueOrDefault = function (currentNode, nodeName, defaultValue) {
				var res = getNodeValue(currentNode, nodeName);
				if (!res) {
					res = defaultValue;
				}
				return res;
			},
			getDateNodeValue = function (currentNode, nodeName) {
				var tmpNd = currentNode.selectSingleNode(nodeName);
				if (!tmpNd) {
					return null;
				}

				return tmpNd.getAttribute('value');
			},
			getFontNodeValue = function (currentNode, nodeName) {
				var defaultFontFamily = 'Helvetica',
					defaultFontSize = 8,
					tmpStr,
					isBolt = false,
					isItalic = false,
					fontFamily = defaultFontFamily,
					fontSize = defaultFontSize,
					fontNode = currentNode.selectSingleNode(nodeName);
				if (fontNode) {
					fontFamily = getNodeValueOrDefault(
						fontNode,
						'@family | family',
						defaultFontFamily
					);
					tmpStr = getNodeValueOrDefault(
						fontNode,
						'@size | size',
						defaultFontSize.toString()
					);
					fontSize = parseInt(tmpStr, 10);
					tmpStr = getNodeValueOrDefault(fontNode, '@bold | bold', '0');
					if (tmpStr === '1') {
						isBolt = true;
					}
					tmpStr = getNodeValueOrDefault(fontNode, '@italic | italic', '0');
					if (tmpStr === '1') {
						isItalic = true;
					}
				}
				return new Graphics.Font(fontFamily, fontSize, isBolt, isItalic);
			},
			getDateTimeNodeValue = function (dateValue) {
				var dateArray = dateValue.substr(0, dateValue.indexOf('T')).split('-');
				return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
			},
			loadSubTask = function (wbs, taskNode) {
				var taskNumber = 0,
					taskId = taskNode.getAttribute('id'),
					//parse "start-date" and "end-date"
					startDate = DateTime.Date.DateTimeNull,
					endDate = DateTime.Date.DateTimeNull,
					tmpStr = getDateNodeValue(taskNode, 'start-date'),
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
				if (tmpStr) {
					startDate = getDateTimeNodeValue(tmpStr);
				}
				tmpStr = getDateNodeValue(taskNode, 'end-date');
				if (tmpStr) {
					endDate = getDateTimeNodeValue(tmpStr);
				}
				// parse "duration"
				tmpStr = getNodeValueOrDefault(taskNode, 'duration', '0');
				duration = parseInt(tmpStr, 10);
				if (duration < 0) {
					throw 'Invalid duration value is specified for Task "' + taskId + '"';
				}
				// parse "working-duration"
				tmpStr = getNodeValueOrDefault(taskNode, 'working-duration', '0');
				workingDuration = parseInt(tmpStr, 10);
				label = getNodeValueOrDefault(
					taskNode,
					'label',
					'Task ' + taskNumber.toString()
				);

				tmpStr = getNodeValueOrDefault(taskNode, 'progress', '0');
				progress = parseInt(tmpStr, 10);

				tmpStr = getNodeValueOrDefault(taskNode, 'is_milestone', '0');
				is_milestone = parseInt(tmpStr, 10);
				predecessor = getNodeValueOrDefault(taskNode, 'predecessor', '');
				assigned = getNodeValueOrDefault(taskNode, 'assigned', ' ');
				num = getNodeValueOrDefault(taskNode, 'num', ' ');

				taskLabelFont = getFontNodeValue(taskNode, 'label-font');
				taskLabelColor = getNodeValueOrDefault(taskNode, 'label-color', null);
				taskBarColor = getNodeValueOrDefault(taskNode, 'bar-color', null);
				taskProgressColor = getNodeValueOrDefault(
					taskNode,
					'progress-color',
					null
				);
				//create and initialize Task instance
				task = wbs.createTask(taskId, label, startDate, endDate, duration);
				task.setIndex(-1);
				task.setLabelFont(taskLabelFont);
				task.setLabelColor(taskLabelColor);
				task.setBarColor(taskBarColor);
				task.setProgressColor(taskProgressColor);
				task.setPercent(progress);

				tmpStr = getDateNodeValue(taskNode, 'earliest-start-date');
				task.earliestStartDate = tmpStr
					? Date.parse(tmpStr)
					: DateTime.DateTimeNull;

				tmpStr = getDateNodeValue(taskNode, 'latest-finish-date');
				task.latestEndDate = tmpStr
					? Date.parse(tmpStr)
					: DateTime.DateTimeNull;

				if (workingDuration >= 0) {
					task.setWorkingDuration(workingDuration);
				}
				task.setPredecessor(predecessor);
				task.setNum(num);
				task.setAssigned(assigned);
				task.setIsMilestone(is_milestone);
				taskNumber++;
			},
			loadSubWbs = function (currentNode, parentWbs) {
				var i, entityNode, id, label, wbs;
				for (i = 0; i < currentNode.childNodes.length; i++) {
					entityNode = currentNode.childNodes[i];
					if ('wbs' === entityNode.tagName) {
						id = entityNode.getAttribute('id');
						label = getNodeValue(entityNode, 'label');
						wbs = !parentWbs
							? project.createWbs(id, label)
							: parentWbs.addSubWbs(id, label);
						loadSubWbs(entityNode, wbs);
					} else if ('task' === entityNode.tagName) {
						loadSubTask(parentWbs, entityNode);
					}
				}
			},
			loadPredecessors = function (Wbses) {
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
					task,
					predString;
				for (i = 0; i < Wbses.length; i++) {
					wbs = Wbses[i];
					for (j = 0; j < wbs.getTasks().length; j++) {
						task = wbs.getTasks()[j];
						predString = task.getPredecessor();
						if (!predString) {
							continue;
						}
						predsList = predString.split(',');
						for (k = 0; k < predsList.length; k++) {
							pred = predsList[k];
							res = regExp.exec(pred);
							if (res) {
								predNum = parseInt(res[1], 10);
								predTask = project.getTaskByNumber(predNum);
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
					loadPredecessors(wbs.getSubWbs());
				}
			},
			createTree = function (tableElement) {
				self.treeGrid = new TreeGridContainer({ connectId: 'projectTree' });
				self.treeGrid.InitXML(tableElement.parentNode, true);
				self.container.resize();
			},
			initializeContainers = function () {
				self.container = new BorderContainer(
					{ design: 'sidebar' },
					self.content
				);
				self.ganttContainer = new ContentPane({
					region: 'center',
					style: 'overflow:hidden; height:100%;padding:0;',
					id: 'ganttContainer'
				});
				self.container.addChild(self.ganttContainer);
				self.treeContainer = new ContentPane({
					region: 'leading',
					style: 'width:30%; height:100%; padding:0;background-color:inherit;',
					splitter: true,
					id: 'projectTree'
				});
				self.container.addChild(self.treeContainer);
				self.container.startup();
			};

		this.getProject = function () {
			return project;
		};

		this.getRowHeaderHeight = function () {
			return this.treeGrid.grid_Experimental.viewsHeaderNode.offsetHeight;
		};

		this.setDelta = function (value) {
			if (!value) {
				value = 'day';
			}
			value = value.trim().toLowerCase();

			var idelta = Times_Fields.DAY;
			switch (value) {
				case 'week':
					idelta = Times_Fields.WEEK;
					break;
				case 'month':
					idelta = Times_Fields.MONTH;
					break;
				case 'quarter':
					idelta = Times_Fields.QUARTER;
					break;
				case 'year':
					idelta = Times_Fields.YEAR;
					break;
				default:
					//"day"
					idelta = Times_Fields.DAY;
					break;
			}
			if (project) {
				project.setDelta(idelta);
			}
			if (this.ganttChart) {
				this.ganttChart.setDelta(idelta);
			}
		};

		this.expandAll = function () {
			this.treeGrid.expandAll(true);
		};

		this.collapseAll = function () {
			this.treeGrid.expandAll(false);
		};

		this.focus = function () {
			this.content.focus();
		};

		this.load = function (xml, node) {
			//resets all "global" variables
			var xDoc = new XmlDocument(),
				projectNode;
			project = null;
			this.ganttchart = null;
			this.input_date_format = default_input_date_format;

			if (!xml) {
				return;
			}

			xDoc.loadXML(xml);
			projectNode = xDoc.selectSingleNode('/project');
			if (projectNode === null) {
				return;
			}
			this.input_date_format = getNodeValueOrDefault(
				projectNode,
				'input-date-format',
				default_input_date_format
			);

			initializeContainers();

			createTree(projectNode.selectSingleNode('table'));
			project = new Project(this.treeGrid);
			this.setDelta(getNodeValue(projectNode, 'delta'));

			//setup project colors
			project.setBackgroundColor(
				getNodeValueOrDefault(projectNode, 'bg-color', Graphics.Colors.White)
			);
			project.setColor(
				getNodeValueOrDefault(projectNode, 'color', Graphics.Colors.DarkGray)
			);
			project.setGridColor(
				getNodeValueOrDefault(
					projectNode,
					'grid-color',
					Graphics.Colors.DarkGray
				)
			);
			project.setWeekendColor(
				getNodeValueOrDefault(
					projectNode,
					'week-color',
					Graphics.Colors.LightGray
				)
			);
			project.setDependencyColor(
				getNodeValueOrDefault(
					projectNode,
					'dependency-color',
					Graphics.Colors.Blue
				)
			);
			project.setBarColor(
				getNodeValueOrDefault(
					projectNode,
					'bar-color',
					Graphics.Colors.DarkGray
				)
			);
			project.setFont(getFontNodeValue(projectNode, 'font'));
			project.setProgressColor(
				getNodeValueOrDefault(
					projectNode,
					'progress-color',
					Graphics.Colors.Blue
				)
			);

			this.backColor = project.getBackgroundColor();

			//setup project calendar
			project.setCalendarFont(getFontNodeValue(projectNode, 'calendar-font'));
			project.setCalendarFormat(
				getNodeValueOrDefault(
					projectNode,
					'display-date-format',
					default_display_date_format
				)
			);
			project.setCalendarColor(
				getNodeValueOrDefault(
					projectNode,
					'calendar-color',
					Graphics.Colors.Black
				)
			);

			project.setColumnTitles(
				getNodeValueOrDefault(
					projectNode,
					'column-titles',
					default_column_titles
				)
			);
			if (project.getColumnTitles().length !== default_column_titles_count) {
				this.project.setColumnTitles(default_column_titles);
			}

			loadSubWbs(projectNode, null);
			loadPredecessors(project.getAllWbs());
			this.ganttChart = new GanttChart(this);
			this.ganttChart.initializeCSS(document);
			this.expandAll();
		};
	};

	return GanttChartContainer;
});
