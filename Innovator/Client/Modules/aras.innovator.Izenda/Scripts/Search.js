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
			forced: null,

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

			runReportSearch: function () {
				if (this.treeControlSearch && this.searchId) {
					var searchText = this.escapeSpecSymbols(
						document.getElementById(this.searchId).value
					);
					var regEx = new RegExp('.*' + searchText + '.*', 'i');
					var root = this.treeControlSearch.GetAllItems()[0];
					var firstLevelRows = root.children;

					if (!searchText) {
						this.clearSearch();
						return;
					}

					this.treeControlSearch.ExpandAll();
					for (var i = 0, length = firstLevelRows.length; i < length; i++) {
						if (firstLevelRows[i].children.length === 0) {
							this.searchAndOperate(firstLevelRows[i], regEx);
						} else if (
							this.operateChildren(regEx, firstLevelRows[i].children)
						) {
							this.showHideRow(true, firstLevelRows[i].id);
						} else {
							this.showHideRow(false, firstLevelRows[i].id);
						}
					}
				}
				return;
			},

			escapeSpecSymbols: function (searchText) {
				var specArr = [
					':',
					';',
					'(',
					')',
					'[',
					']',
					'{',
					'}',
					'<',
					'>',
					'!',
					'@',
					'#',
					'$',
					'%',
					'^',
					'-',
					'_',
					'=',
					'+',
					'"',
					'\\',
					'|',
					'/',
					'`',
					'~',
					'.',
					'*'
				];
				var result = '';
				for (var i = 0; i < searchText.length; i++) {
					var letter = searchText[i];
					var pos = specArr.indexOf(letter);
					if (pos !== -1) {
						letter = '\\' + letter;
					}
					result += letter;
				}

				return result;
			},

			clearSearch: function () {
				if (this.treeControlSearch && this.searchId) {
					var items = this.treeControlSearch.GetAllItems();

					for (var i = 0, length = items.length; i < length; i++) {
						this.showHideRow(true, items[i].id);
					}
					this.treeControlSearch.CollapseAll();
				}
			},

			handleSearchKey: function (event) {
				if (event.which == 13 || event.keyCode == 13) {
					//handle enter key
					this.runReportSearch();
				}
			},

			searchAndOperate: function (element, regEx) {
				if (element.label.search(regEx) >= 0) {
					this.showHideRow(true, element.id);
					return true;
				} else {
					this.showHideRow(false, element.id);
					return false;
				}
			},

			showHideRow: function (isVisible, id) {
				var display = isVisible ? '' : 'none';
				var rows = this.treeControlSearch._tree.getNodesByItem(id);
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					if (row && this.forced.indexOf(id) === -1) {
						row.domNode.style.display = display;
					}
				}
			},

			operateChildren: function (regEx, children) {
				var isThereVisibleChildren = false;

				for (var i = 0, length = children.length; i < length; i++) {
					isThereVisibleChildren =
						this.searchAndOperate(children[i], regEx) || isThereVisibleChildren;
				}

				return isThereVisibleChildren;
			}
		}
	);
});
