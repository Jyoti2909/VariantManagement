/*jslint plusplus: true*/
/*global dojo, define, dijit*/
define([
	'./Graphics',
	'./DateTime',
	'./Wbs',
	'./Task',
	'./Times_Fields'
], function (Graphics, DateTime, Wbs, Task, Times_Fields) {
	'use strict';
	var Project = function (treeGrid, deltaVal) {
		if (!deltaVal) {
			deltaVal = Times_Fields.DAY;
		}
		var columnTitles = null,
			bgColor = Graphics.Colors.White,
			color = Graphics.Colors.Black,
			font = new Graphics.Font('Helvetica', 10, false),
			gridColor = Graphics.Colors.DarkGray,
			weekendColor = Graphics.Colors.LightGray,
			barColor = Graphics.Colors.DarkGray,
			depColor = Graphics.Colors.Blue,
			progColor = Graphics.Colors.Black,
			calFormat = 'DD-MM-YYYY',
			calFont = new Graphics.Font('Helvetica', 10, true),
			calColor = Graphics.Colors.Black,
			delta = deltaVal,
			self = this;

		this.visibleItems = {};
		this.allWbs = [];
		this.tasks = [];
		this.links = [];
		this.treeGrid = treeGrid;
		this.drawDependencyLinks = true;
		this.drawCompletionProgress = false;
		this.drawTaskFloat = true;
		this.drawTaskHover = true;
		this.drawHorizontalLine = true;

		this.setBackgroundColor = function (value) {
			bgColor = value;
		};

		this.setColor = function (value) {
			color = value;
		};

		this.setGridColor = function (value) {
			gridColor = value;
		};

		this.setWeekendColor = function (value) {
			weekendColor = value;
		};

		this.setDependencyColor = function (value) {
			depColor = value;
		};

		this.setBarColor = function (value) {
			barColor = value;
		};

		this.setProgressColor = function (value) {
			progColor = value;
		};

		this.setFont = function (value) {
			font = value;
		};

		this.setCalendarFont = function (value) {
			calFont = value;
		};

		this.setCalendarFormat = function (value) {
			calFormat = value;
		};

		this.setCalendarColor = function (value) {
			calColor = value;
		};

		this.setColumnTitles = function (value) {
			columnTitles = value;
		};

		this.setDelta = function (value) {
			delta = value;
		};

		this.getDelta = function () {
			return delta;
		};

		this.getBackgroundColor = function () {
			return bgColor;
		};

		this.getColumnTitles = function () {
			if (!columnTitles) {
				return [];
			}
			return columnTitles.split(',');
		};

		this.getGridColor = function () {
			return gridColor;
		};

		this.getAllWbs = function () {
			return this.allWbs;
		};

		this.getTaskByNumber = function (pos) {
			return this.tasks[pos - 1];
		};

		this.getTaskById = function (taskId) {
			if (taskId) {
				var task, i;

				for (i = 0; i < this.tasks.length; i++) {
					task = this.tasks[i];

					if (task.id === taskId) {
						return task;
					}
				}
			}
		};

		this.getBarColor = function () {
			return barColor;
		};

		this.getProgressColor = function () {
			return progColor;
		};

		this.getDependencyColor = function () {
			return depColor;
		};

		this.getMinDate = function () {
			if (this._getMinDateCached) {
				return this._getMinDateCached;
			}
			var res = this.rootWbs
				? this.rootWbs.getMinDate()
				: DateTime.DateTimeNull;
			this._getMinDateCached = res;
			return res;
		};

		this.getMaxDate = function () {
			if (this._getMaxDateCached) {
				return this._getMaxDateCached;
			}
			var res = this.rootWbs
				? this.rootWbs.getMaxDate()
				: DateTime.DateTimeNull;
			this._getMaxDateCached = res;
			return res;
		};

		this.getWeekendColor = function () {
			return weekendColor;
		};

		this.createWbs = function (id, label) {
			var wbs = new Wbs(id, label, this);
			if (this.allWbs.length === 0) {
				this.rootWbs = wbs;
			}

			this.allWbs.push(wbs);
			return wbs;
		};

		this.setSelectedItems = function (/*string or array*/ itemsIds) {
			itemsIds = typeof itemsIds === 'string' ? [itemsIds] : itemsIds.slice();

			var projectEntities = this.allWbs.slice(),
				selectionExists = Boolean(itemsIds.length),
				isItemSelected,
				currentItem,
				foundIndex,
				i;

			Array.prototype.push.apply(projectEntities, this.tasks);
			// update selected state for project items
			for (i = 0; i < projectEntities.length; i++) {
				currentItem = projectEntities[i];
				isItemSelected = false;

				if (selectionExists) {
					foundIndex = itemsIds.indexOf(currentItem.id);

					if (foundIndex > -1) {
						isItemSelected = true;
						itemsIds.splice(foundIndex, 1);
						selectionExists = itemsIds.length > 0;
					}
				}

				currentItem.setSelected(isItemSelected);
			}
		};
	};

	Project.prototype.invalidate = function (wbs) {
		var i, childEntity;
		for (i = 0; i < wbs.getSubEntities().length; i++) {
			childEntity = wbs.getSubEntities()[i];
			if (childEntity instanceof Wbs) {
				this.invalidate(childEntity);
			}
			if (childEntity instanceof Task) {
				childEntity.invalidate();
			}
		}
	};
	//----- Specific implementation
	return Project;
});
