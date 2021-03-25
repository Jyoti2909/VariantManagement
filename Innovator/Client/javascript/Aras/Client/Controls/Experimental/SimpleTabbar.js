define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/layout/TabContainer',
	'dijit/layout/TabController',
	'dijit/layout/ContentPane'
], function (declare, connect, TabContainer, TabController, ContentPane) {
	return declare(
		'Aras.Client.Controls.Experimental.SimpleTabbar',
		TabContainer,
		{
			_hiddentabs: null,
			useMenu: false,

			constructor: function () {
				// Initialise array to hold hidden tabs
				this._hiddentabs = [];

				this.tabs = document.getElementById('tabs-container');
				this.tabs.parentSelectTab = this.tabs.selectTab;
				var _self = this;
				this.tabs.selectTab = function (id) {
					const result = this.parentSelectTab(id);
					_self.selectChild(_self._getTab(id));
					return result;
				};
			},

			postMixInProperties: function () {
				this.controllerWidget = TabController;
			},

			startup: function () {},

			_getTab: function (tabID) {
				var children = this.getChildren();
				for (var i = 0; i < children.length; i++) {
					if (children[i].tabID == tabID) {
						return children[i];
					}
				}
				return null;
			},

			_getHiddenTab: function (tabID) {
				for (var i = 0; i < this._hiddentabs.length; i++) {
					if (this._hiddentabs[i].tabID == tabID) {
						return this._hiddentabs[i];
					}
				}
				return null;
			},

			_addHiddenTab: function (tab) {
				if (this._getHiddenTab(tab.tabID)) {
					return;
				}
				// Store current index
				tab._hiddenIndex = this.tabs.tabs.indexOf(tab.tabID);
				// Add Tab to Hidden Array
				this._hiddentabs.push(tab);
				this._hideChild(tab);
			},

			_removeHiddenTab: function (tab) {
				var index = this._hiddentabs.indexOf(tab);

				if (index != -1) {
					// Reset _hiddenIndex
					this._hiddentabs[index]._hiddenIndex = null;
					// Remove tab from Hidden Array
					this._hiddentabs.splice(index, 1);
					this._showChild(tab);
				}
			},

			_getTabIdByLabel: function (label) {
				var items = this.tabs.tabs;
				var data = this.tabs.data;
				for (var i = 0; i < items.length; i++) {
					if (data.get(items[i]).label === label) {
						return items[i];
					}
				}
			},

			selectChild: function (page, animate) {
				if (page) {
					// Need to override selectChild from StackContainer to check if tab is disabled
					var dis = page.get('disabled');

					if (this.selectedChildWidget != page && !dis) {
						// Deselect old page and select new one
						var d = this._transition(page, this.selectedChildWidget, animate);
						this._set('selectedChildWidget', page);
					}
				}
			},

			onStart: function () {
				// Trigger Event to show started
			},

			onClick: function (tabID) {
				// When show ContentPane;
			},

			selectTab: function (tabID) {
				var tab = this._getTab(tabID);
				if (tab) {
					tab._wrapper = tab.domNode;
					this.selectChild(tab);
				}
				this.tabs.selectTab(tabID);
			},

			GetSelectedTab: function () {
				return this.selectedChildWidget ? this.selectedChildWidget.tabID : null;
			},

			SetTabOrderByLabel: function (tabOrder, separator) {
				// Default separator to comma if not specified - original C# control did not allow separator to be specified
				if (!separator) {
					separator = ',';
				}
				// Split labels with separator
				var labels = tabOrder.split(separator);
				var newOrder = labels.map(
					function (item) {
						return this._getTabIdByLabel(item);
					}.bind(this)
				);

				this.tabs.tabs = newOrder;
				return this.tabs.render();
			},

			addTab: function (tabID, label) {
				var tab = new ContentPane({
					tabID: tabID,
					title: label,
					style: 'padding: 0;'
				});
				var self = this;
				this._started = false;
				this.addChild(tab);
				connect.connect(tab, 'onShow', function () {
					self.onClick(this.tabID);
				});
				this.tabs.addTab(tabID);
				this.tabs.setTabContent(tabID, { label: label });
			},

			RemoveTab: function (tabID) {
				var tab = this._getTab(tabID);
				if (tab != null) {
					this.removeChild(tab);
					tab.destroy();
					this.tabs.removeTab(tabID);
				}
			},

			removeTabByLabel: function (label) {
				var tabID = this._getTabIdByLabel(label);
				if (tabID) {
					return this.RemoveTab(tabID);
				}
			},

			setTabEnabled: function (tabID, enabled) {
				this.SetTabEnabled(tabID, enabled);
			},

			SetTabEnabled: function (tabID, enabled) {
				var tab = this._getTab(tabID);
				if (tab) {
					tab.set('disabled', !enabled);
					this.tabs.setTabContent(tabID, { disabled: !enabled });
				}
			},

			setTabVisible: function (tabID, visible) {
				this.SetTabVisible(tabID, visible);
			},

			SetTabVisible: function (tabID, visible) {
				if (visible) {
					if (this._getTab(tabID) !== null) {
						// Check for tab in hiddentabs
						var hiddentab = this._getHiddenTab(tabID);

						if (hiddentab) {
							this._started = false;
							this.tabs.addTab(tabID, { label: hiddentab.title });
							this.MoveTab(tabID, hiddentab._hiddenIndex);

							this._removeHiddenTab(hiddentab);
						}
					}
				} else {
					var tab = this._getTab(tabID);
					if (tab) {
						// Add to Hidden Tabs
						this._addHiddenTab(tab);
						// Remove Tab
						this.tabs.removeTab(tabID);
					}
				}
			},

			getTabOrder: function (separator) {
				// Check separator is specified
				if (!separator) {
					separator = ',';
				}
				// Get an array of Tab ID's
				var tabids = this.getChildren().map(function (child) {
					return child.tabID;
				});

				return tabids.join(separator);
			},

			GetTabOrder: function (separator) {
				return this.getTabOrder(separator);
			},

			SetTabOrder: function (tabOrder, separator) {
				// Default separator to comma if not specified
				if (!separator) {
					separator = ',';
				}

				// Split ids with separator
				var ids = tabOrder.split(separator);
				this.tabs.tabs = ids;
				return this.tabs.render();
			},

			MoveTab: function (TabID, newIndex) {
				if (this.tabs.tabs.indexOf(TabID) > -1) {
					var oldIndex = this.tabs.tabs.indexOf(TabID);
					this.tabs.tabs.splice(oldIndex, 1);
					var left = this.tabs.tabs.splice(0, newIndex);
					this.tabs.tabs = left.concat(TabID, this.tabs.tabs);
					this.tabs.render();
				}
			},

			GetTabId: function (label) {
				return this._getTabIdByLabel(label) || null;
			},

			GetTabLabel: function (tabID) {
				var tab = this.tabs.data.get(tabID);
				return tab ? tab.label : null;
			},

			clear: function () {
				var children = this.getChildren();
				for (var i = 0; i < children.length; i++) {
					if (!children[i].selected) {
						var iframe = children[i].domNode.firstChild;
						if (iframe) {
							iframe.src = 'about:blank';
						}
						this.removeChild(children[i]);
						children[i].destroyRecursive(false);
						this.tabs.removeTab(children[i].tabID);
					}
				}
				var widget = this.selectedChildWidget;
				if (!widget) {
					return;
				}

				if (widget.domNode.childNodes.length) {
					widget.domNode.childNodes[0].src = 'about:blank';
				}
				this.removeChild(widget);
				widget.destroyRecursive(false);
				this.tabs.removeTab(widget.tabID);
			}
		}
	);
});
