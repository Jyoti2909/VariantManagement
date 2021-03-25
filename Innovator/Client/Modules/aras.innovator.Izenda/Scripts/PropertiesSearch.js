require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!Izenda/Views/Tabs/BaseTab.html',
	'dojo/query'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template,
	query
) {
	declare(
		'Izenda.UI.Tree.Search',
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			templateString: template,
			searchId: null,
			treeControlSearch: null,

			constructor: function (args) {
				this.args = args;
				this.treeControlSearch = args.control;
				this.searchId = args.id;
				this.forced = args.forced || [];
			},

			init: function () {
				this.startup();
			},

			setEvents: function (inputId, btnId) {
				var bindRunReportSearch = this.runReportSearch.bind(this);
				var bindHandleSearchKey = this.handleSearchKey.bind(this);
				var searchEvents = {
					id: 'searchEvents',
					onClick: bindRunReportSearch,
					onKeyDown: bindHandleSearchKey
				};

				query('#' + btnId).on('click', searchEvents.onClick);
				query('#' + inputId).on('keydown', searchEvents.onKeyDown);
			},

			runReportSearch: function (noDataFound) {
				this.forced = [];
				this.emptyReportSearchResult = false;
				this.treeControlSearch.collapseAll();
				initializeTree(this.treeControlSearch, true);
				if (this.treeControlSearch && this.searchId) {
					var searchText = document.getElementById(this.searchId).value;
					if (!searchText) {
						return;
					}

					var regEx = new RegExp('.*' + searchText + '.*', 'i');
					var firstLevelRows = this.treeControlSearch._store
						? this.treeControlSearch._store._arrayOfTopLevelItems
						: [];

					if (!firstLevelRows.length && !noDataFound) {
						initializeTree(this.treeControlSearch, true);
						this.runReportSearch(true);
					}

					for (var i = 0, length = firstLevelRows.length; i < length; i++) {
						this.searchAndOperate(firstLevelRows[i], regEx);
					}
					if (this.forced.length === 0) {
						this.emptyReportSearchResult = true;
						this.treeControlSearch.removeAllRows();
					}
					initializeTree(this.treeControlSearch, true);
				}
				return;
			},

			clearSearch: function () {
				this.forced = [];
				initializeTree(this.treeControlSearch);
			},

			handleSearchKey: function (event) {
				if (event.which == 13 || event.keyCode == 13) {
					//handle enter key
					this.runReportSearch();
				}
			},

			searchAndOperate: function (element, regEx) {
				var label = element.label[0];
				var id = element.uniqueId[0];
				if (label.search(regEx) >= 0) {
					this.forced.push(id);
					this.showHideRow(true, id);
					return true;
				} else {
					this.showHideRow(false, id);
					return false;
				}
			},

			showHideRow: function (isVisible, id) {
				var display = isVisible ? '' : 'none';
				var row = this.treeControlSearch['GetRowByItemId_Experimental'](id);
				if (row && this.forced.indexOf(id) === -1) {
					row.style.display = display;
				}
			}
		}
	);
});
