/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_Container',
	'dijit/layout/_LayoutWidget',
	'dojo/dom-style',
	'Aras/Client/Controls/Experimental/LazyLoaderBase',
	'Controls/Tab',
	'dojo/dom-class'
], function (
	declare,
	_WidgetBase,
	_Container,
	_LayoutWidget,
	domStyle,
	LazyLoaderBase,
	Tab,
	domClass
) {
	return declare(
		'SimpleTabContainer',
		[_WidgetBase, _Container, _LayoutWidget, LazyLoaderBase],
		{
			args: null,
			_tabIds: [],
			_tabs: {},
			_currentTabId: null,

			constructor: function (args) {
				this.args = args;
			},

			postCreate: function () {
				this.inherited(arguments);
				domClass.add(this.domNode, 'simpleTabContainer');
			},

			startup: function () {
				this.inherited(arguments);
				var children = this.getChildren();
				for (var i = 0, l = children.length; i < l; i++) {
					var child = children[i];
					var id = child.id;
					this._tabIds[i] = id;
					this._tabs[id] = child;
					if (child.selected) {
						this._currentTabId = id;
					}
				}
			},

			getCurrentTabId: function () {
				return this._currentTabId;
			},

			selectTab: function (id, callback) {
				var stop = this.onPreSelectTab(this, { id: id });
				if (stop) {
					return false;
				}
				var currentTab =
					this._tabs[this._currentTabId] !== null
						? this._tabs[this._currentTabId]
						: this.getTabById('formTab');
				var selectedTab = this._tabs[id];
				var sidebar = getSidebar();

				if (currentTab && currentTab.domNode) {
					currentTab.hide();
				}

				if (!selectedTab || !selectedTab.domNode) {
					id = 'formTab';
					selectedTab = this._tabs[id];
				}
				selectedTab.show();

				this._currentTabId = id;
				if (!this.get('noSidebar') && sidebar) {
					sidebar.setWidgetSelected(selectedTab);
				}
				if (callback) {
					callback(selectedTab);
				}

				if (id !== 'formTab') {
					windowStateObject.setHidden();
				} else if (windowStateObject.state === 'tabs off') {
					windowStateObject.setNormal();
				} else {
					windowStateObject.setVisible();
				}

				this.onSelectTab(this, { id: id });

				this._dispatchOnSelectSidebarTabEvent(selectedTab);

				return true;
			},

			hasTab: function (id) {
				return this._tabs[id] !== undefined;
			},

			getTabIds: function () {
				return [].concat(this._tabsIds);
			},

			getTabById: function (id) {
				return this._tabs[id];
			},

			closeTab: function (id) {
				this.removeChild(this._tabs[id]);
				delete this._tabs[id];
			},

			createTab: function (widget, id) {
				var newTab = new Tab({ id: id });
				newTab.addChild(widget);
				this.addChild(newTab);
				this._tabIds.push(id);
				this._tabs[id] = newTab;
			},

			onSelectTab: function (sender, args) {},

			onPreSelectTab: function (sender, args) {},

			_dispatchOnSelectSidebarTabEvent: function (selectedTab) {
				var evnt = document.createEvent('Event');
				const selectedTabChildren = selectedTab.getChildren();
				if (!selectedTabChildren.length) {
					return;
				}
				evnt.selectedTabType = selectedTabChildren[0].declaredClass;
				evnt.initEvent('onSelectSidebarTab', true, true);
				document.dispatchEvent(evnt);
			}
		}
	);
});
