import Tabs from '../components/tabs';

const maxItemHeight = 32;

const showUnpinDialog = async (item, tabs) => {
	const confirmResult = await ArasModules.Dialog.confirm(
		aras.getResource('', 'common.itemtype_not_available'),
		{
			title: aras.getResource('', 'common.access_denied'),
			okButtonText: aras.getResource('', 'common.unpin'),
			okButtonModifier: 'aras-button_secondary'
		}
	);

	if (confirmResult === 'ok') {
		tabs.removeTab(item.id);
		try {
			await window.favorites.delete(item.id);
		} catch (e) {
			tabs.addTab(item.id, item);
		}
	}
};

export default class NavigationPanelTabs extends Tabs {
	tooltipSettings = {
		tooltipPosition: 'right'
	};

	created() {
		this.useTooltip = true;
		this.vertical = true;
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-navigation-panel-tabs', 'aras-tabs_b');
		this.setAttribute('aria-orientation', 'vertical');
		this._resizeHandler = this.render.bind(this);
		window.addEventListener('resize', this._resizeHandler);
	}

	disconnectedCallback() {
		window.removeEventListener('resize', this._resizeHandler);
	}

	render() {
		const visibleItems = [];
		const maxVisibleItems = Math.max(
			Math.floor(this.clientHeight / maxItemHeight),
			1
		);

		this.data.forEach((item, id) => {
			if (visibleItems.length < maxVisibleItems) {
				visibleItems.push(id);
			}
		});
		this.tabs = visibleItems;

		return super.render();
	}

	selectTab(id) {
		const item = this.data.get(id);
		if (item.locked) {
			return showUnpinDialog(item, this);
		}

		this.selectedTab = id;
		return this.render().then(() => true);
	}

	formatter(id, data) {
		const item = data.get(id);
		if (!item.locked) {
			return null;
		}

		const lockIconNode = <span className="aras-navigation-panel-tabs__lock" />;
		const imageNode = this._getImage(item.image);
		const content = [lockIconNode, imageNode];

		return this._getTooltipTemplate(item, content);
	}

	_resizeHandler() {}
}

NavigationPanelTabs.define('aras-navigation-panel-tabs');
