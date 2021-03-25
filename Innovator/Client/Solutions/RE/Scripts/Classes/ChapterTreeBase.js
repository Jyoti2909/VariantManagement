define([
	'dojo/_base/declare',
	'dojo/aspect'
],

function(declare, aspect) {
	return declare('Aras.Client.Controls.RequirementDocument.ChapterTreeBase', null, {
		_rowsById: null,
		_rowIndexes: null,
		_domNode: null,
		_tree: null,
		_label: null,
		_lockStatusSplitter: null,
		_lockColumnWidth: null,
		_reqColumnWidth: null,
		viewmodel: null,
		isChapterTreeInitialized: false,
		aras: null,
		_actionsHelper: null,
		_requirementsHelper: null,

		constructor: function(args) {
			this._rowsById = {};
			this._rowIndexes = [];
			this._domNode = args.domNode;
			this._label = args.label;
			this.viewmodel = args.viewmodel;
			this._lockColumnWidth = 25;
			this._reqColumnWidth = 273;
			this.aras = args.aras;
			this._actionsHelper = this.viewmodel.ActionsHelper();
			this._requirementsHelper = this.viewmodel.getRequirementsHelper();
			this.init();
		},

		init: function() {
			this._tree = new TreeGrid(this._domNode, {
				multiSelect: false,
				resizable: false,
				search: false,
				editable: false,
				sortable: false,
				draggableColumns: false
			});

			this._tree.view.defaultSettings.levelPaddingMultiplier = 24;
			this._fixWidthCalculation();
			this._disableSorting();
			this._addLockStatusSplitter();
			this._setupFormatters();

			var treeData = this._getTreeData();
			this._applyTreeData(treeData);

			this.isChapterTreeInitialized = true;
		},

		_applyTreeData: function(treeData) {
			var rows = treeData.rows;
			var rootName = 'root';
			rows.set(rootName, {
				'requirement': '',
				'children': treeData.roots,
				'reqId': 0,
				'chapter': '0',
				'state': ''
			});

			this._tree.head = treeData.head;
			this._tree.rows = rows;
			this._tree.roots = [rootName];
			this._tree.settings.treeHeadView = treeData.treeHeadView;

			this._tree.expand(rootName).then(function() {
				this.viewmodel._invalidate(this.viewmodel.Dom());
			}.bind(this));
		},

		_fixWidthCalculation: function() {
			var originalGetHeadRangeWidth = this._tree.view._getHeadRangeWidth.bind(this._tree.view);
			this._tree.view._getHeadRangeWidth = function(from, to) {
				// "4" - is a value that set at "transform" for viewport. Because of that tree is "jumping"
				return originalGetHeadRangeWidth(from, to) - 4;
			};
		},

		_disableSorting: function() {
			this._tree.sort = function() {
				return Promise.resolve();
			};
		},

		_addLockStatusSplitter: function() {
			var filterAddHandler = aspect.after(this._tree.view, '_render', function() {
				if (this._tree.view && this._tree.view.scroller) {
					var container = this._tree.view.scroller;
					this._lockStatusSplitter = document.createElement('span');
					this._lockStatusSplitter.id = 'lockStatusSplitter';
					container.appendChild(this._lockStatusSplitter);

					this._defineLockStatusSplitterSize();

					var observer = new MutationObserver(function() {
						this._defineLockStatusSplitterSize();
					}.bind(this));
					observer.observe(container, {attributes: true});
				}

				filterAddHandler.remove();
			}.bind(this));
		},

		_defineLockStatusSplitterSize: function() {
			var gridBody = document.getElementsByClassName('aras-grid-body')[0];
			var gridBodyStyle = getComputedStyle(gridBody);
			if (gridBodyStyle) {
				var scrollerStyle = getComputedStyle(this._tree.view.scroller);
				var gridBodyStyleHeight = parseInt(gridBodyStyle.height);
				if (parseInt(scrollerStyle.height) < gridBodyStyleHeight) {
					if (this._lockStatusSplitter.style.height != gridBodyStyle.height) {
						this._lockStatusSplitter.style.height = gridBodyStyleHeight + 'px';
						// "17" - is a value that is equal to scroll bar width.
						if (parseInt(gridBodyStyle.width) - parseInt(scrollerStyle.width) > 17) {
							this.resizeHead(1, 17);
						}
					}
				} else if (this._lockStatusSplitter.style.height != '100%') {
					this._lockStatusSplitter.style.height = '100%';
					if (parseInt(gridBodyStyle.width) - parseInt(scrollerStyle.width) < 17) {
						this.resizeHead(1, -17);
					}
				}
			}
		},

		resizeHead: function(indexHead, delta) {
			const resizeEvent = new CustomEvent('resizeHead', {
				detail: {
					index: indexHead,
					delta: delta
				}
			});
			this._tree.dom.dispatchEvent(resizeEvent);
		},

		_setupFormatters: function() {
			if (this._tree) {
				this._tree.getCellType = function(headId, rowId, value, nativeType) {
					return headId == 'lock_state' ? 'lockState' : 'iconText';
				};

				Grid.formatters.iconText = (function(headId, rowId, value, grid) {
					var row = grid.rows.get(rowId);
					var formatter = {
						children: [{
							tag: 'span',
							children: [row.chapter + ' - '],
						}, {
							tag: 'span',
							children: [value],
							attrs: {
								reqId: row.reqId
							}
						}]
					};

					var scriptURL = this.aras.getScriptsURL();
					if (row.icon) {
						formatter.children.unshift({
							tag: 'img',
							className: 'aras-form-icon',
							attrs: {
								src: scriptURL + row.icon
							}
						});
					}
					return formatter;
				}).bind(this);

				Grid.formatters.lockState = (function(headId, rowId, value, grid) {
					var formatter = {
						children: []
					};

					var row = grid.rows.get(rowId);
					var scriptURL = this.aras.getScriptsURL();
					var icon = grid.rows.get(rowId, 'lockStateImg');
					formatter.children.unshift({
						tag: 'img',
						className: 'aras-lockstate-icon',
						attrs: {
							src: icon ? scriptURL + icon : '',
							reqId: 'icon_' + row.reqId
						}
					});
					return formatter;
				}).bind(this);

				this._tree.getRowClasses = function(rowId) {
					return rowId != 'root' ? '' : 'aras-tree-chaptertree';
				};
			}
		},

		_getTreeData: function() {
			var roots = [];
			var rows = new Map();
			var head = new Map();
			var mapping = {};
			var sectionRowDictionary = {};
			const requirementsCache = this._requirementsHelper.getRequirementsCache();
			let requirementIndex = 0;

			for (var configId in requirementsCache) {
				const req = requirementsCache[configId];

				rows.set(requirementIndex, {
					'requirement': req.title,
					'chapter': req.chapter,
					'icon': '../Solutions/RE/Images/Requirement.svg?req=2',
					'lockStateImg': '',
					'children': false,
					'reqId': configId,
					'state': '',
					'parentIndex': null
				});
				this._setRowsById(configId, requirementIndex);

				const section = req.chapter || '-1';
				var fragmentedSection = section.split('.');
				var sectionDepth = fragmentedSection.length;
				var parentSection = fragmentedSection.slice(0, -1).join('.');
				var info = {index: requirementIndex, section: section, parentSection: parentSection};
				if (!mapping[sectionDepth]) {
					mapping[sectionDepth] = [];
				}

				mapping[sectionDepth].push(info);

				sectionRowDictionary[section] = requirementIndex;
				requirementIndex++;
			}

			var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
			var levelsCount = Object.keys(mapping).length;
			for (var levelIndex = 1; levelIndex <= levelsCount; levelIndex++) {
				var level = mapping[levelIndex];
				level.sort(function(a, b) {
					return collator.compare(a.section, b.section);
				});

				for (var leafIndex = 0; leafIndex < level.length; leafIndex++) {
					var leafInfo = level[leafIndex];
					const childRow = rows.get(leafInfo.index);

					if (leafInfo.parentSection) {
						var parentIndex = sectionRowDictionary[leafInfo.parentSection];
						var row = rows.get(parentIndex);
						if (!Array.isArray(row.children)) {
							row.children = [];
						}
						row.children.push(leafInfo.index);
						childRow.parentIndex = parentIndex;
					} else {
						roots.push(leafInfo.index);
						childRow.parentIndex = 'root';
					}
				}
			}

			head.set('lock_state', {
				label: '',
				width: this._lockColumnWidth,
				resize: false,
				sortable: false
			});
			head.set('requirement', {
				label: this._label,
				width: this._reqColumnWidth,
				resize: false,
				sortable: false
			});

			return {roots: roots, head: head, rows: rows, treeHeadView: 'requirement'};
		},

		_setRowsById: function(id, index) {
			this._rowsById[id] = index;
			this._rowIndexes.push(index);
		},

		_getNewRowIndex: function() {
			return this._rowIndexes.length ? Math.max.apply(null, this._rowIndexes) + 1 : 0;
		},

		_removeRowIndexById: function(id) {
			var rowIndex = this._rowsById[id];
			var rowIndexPosition = this._rowIndexes.indexOf(rowIndex);
			this._rowIndexes.splice(rowIndexPosition, 1);
			delete this._rowsById[id];
		},

		_getRowIndexById: function(id) {
			return this._rowsById[id];
		},

		setNewStateIcon: function(id, iconPath) {
			var rowId = this._getRowIndexById(id);
			var row = this._tree.rows.get(rowId);
			row.lockStateImg = iconPath;
			this._tree.rows.set(rowId, row);
		},

		setNewState: function(reqId, state) {
			const rowIndex = this._getRowIndexById(reqId);
			const row = this._tree.rows.get(rowIndex);

			if (row) {
				row.state = state;
				this._tree.rows.set(rowIndex, row);
			}
		},

		updateTitlesForReqsList: function(reqsIdsList) {
			const requirementsCache = this._requirementsHelper.getRequirementsCache();
			for (let idIndex = 0; idIndex < reqsIdsList.length; idIndex++) {
				const rowId = this._getRowIndexById(reqsIdsList[idIndex]);
				const row = this._tree.rows.get(rowId);
				row.requirement = requirementsCache[row.reqId].title;
				this._tree.rows.set(rowId, row);
			}
		},

		getRequirementIdByRowId: function(rowId) {
			var row = this._tree.rows.get(rowId);
			if (row && row.reqId) {
				return row.reqId;
			}
		}
	});
});
