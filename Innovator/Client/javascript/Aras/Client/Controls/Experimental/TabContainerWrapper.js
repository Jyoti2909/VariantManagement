require(['Controls/Tab', 'dijit/dijit'], function (Tab) {
	class TabContainerWrapper {
		constructor(sidebarSwitcher) {
			this.switcher = this.domNode = sidebarSwitcher;
			this.widgets = new Map();
			this.id = 'viewers';

			if (dijit) {
				if (dijit.byId(this.id)) {
					dijit.registry.remove(this.id);
				}
				dijit.registry.add(this);
			}
		}
		createTab(widget, id) {
			if (this.widgets.has(id)) {
				return;
			}

			let tab = dijit.byId(id);
			if (!tab) {
				tab = new Tab({ id });
				tab.addChild(widget);
			}
			this.widgets.set(id, tab);
			const node = tab.domNode || tab;
			node.setAttribute('switcher-pane-id', id);
			if (node.parentElement !== this.switcher) {
				this.switcher.appendChild(node);
			}
			if (widget.selected) {
				this.switcher.setAttribute('active-pane-id', id);
			}
			if (tab.startup) {
				tab.startup();
				const destroyRecursive = tab.destroyRecursive;
				tab.destroyRecursive = () => {
					destroyRecursive && destroyRecursive.call(tab);
					this.closeTab(id);
				};
			}
		}
		closeTab(id) {
			const widget = this.widgets.get(id);
			if (widget && widget.domNode) {
				this.switcher.removeChild(widget.domNode);
			}
			this.widgets.delete(id);
		}
		selectTab(id, callback) {
			const prevent = this.onPreSelectTab(this, { id });
			if (prevent) {
				return false;
			}

			const prevTabId = this.switcher.getAttribute('active-pane-id');
			const prevTab = this.widgets.get(prevTabId);
			prevTab && prevTab.hide();

			let nextTab = this.widgets.get(id);
			if (!nextTab || !nextTab.domNode) {
				id = 'formTab';
				nextTab = this.widgets.get(id);
			}
			this.switcher.setAttribute('active-pane-id', id);
			nextTab && nextTab.show();

			const sidebar = window.getSidebar && window.getSidebar();
			if (sidebar) {
				sidebar.setWidgetSelected(nextTab);
			}

			callback && callback(nextTab);

			const state = window.windowStateObject;
			if (id !== 'formTab') {
				state.setHidden();
			} else if (state.state === 'tabs off') {
				state.setNormal();
			} else {
				state.setVisible();
			}

			this.onSelectTab && this.onSelectTab(this, { id });

			if (nextTab && nextTab.getChildren().length) {
				const selectEvent = new CustomEvent('onSelectSidebarTab');
				selectEvent.selectedTabType = nextTab.getChildren()[0].declaredClass;
				document.dispatchEvent(selectEvent);
			}

			return true;
		}
		hasTab(id) {
			return this.widgets.has(id);
		}
		getChildren() {
			return Array.from(this.widgets.values());
		}
		getCurrentTabId() {
			return this.switcher.getAttribute('active-pane-id');
		}
		getTabById(id) {
			return this.widgets.get(id);
		}
		startup() {}
		onPreSelectTab() {}
	}
	window.TabContainerWrapper = TabContainerWrapper;
});
