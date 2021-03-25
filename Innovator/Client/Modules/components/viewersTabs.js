import Tabs from './tabs';

const createMenu = function (item, tabs) {
	const buttonClass = 'aras-dropdown__button';
	const buttonImage = tabs._updateImage(item);
	const template = tabs._getTooltipTemplate(item, buttonImage, {
		'dropdown-button': ''
	});
	const hasTooltip = template !== buttonImage;
	let button = null;

	if (hasTooltip) {
		button = template;
		button.className = `${button.className} ${buttonClass}`;
	} else {
		button = (
			<span className={buttonClass} dropdown-button="">
				{buttonImage}
			</span>
		);
	}

	return (
		<aras-dropdown
			className="aras-dropdown-container"
			closeonclick=""
			position="right-top"
		>
			{button}
			<aras-menu
				className="aras-dropdown"
				ref={(node) => {
					if (!node) {
						return;
					}

					node.formatter = (id, item) => {
						return (
							<div class="aras-list-item__names">
								<span className="aras-list-item__file-name">{item.label}</span>
								<span className="aras-list-item__keyed-name">
									{item.holderKeyedName}
								</span>
							</div>
						);
					};
					node.applyData(item.data, item.roots);
				}}
			/>
		</aras-dropdown>
	);
};

export default class ViewersTabs extends Tabs {
	_unsubscribeOnClick = null;
	tooltipSettings = {
		tooltipPosition: 'right'
	};
	selectedMenuItem = null;

	created() {
		this.vertical = true;
		this.useTooltip = true;
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-viewers-tabs', 'aras-tabs_b');
	}

	_selectMenuItem(fileId) {
		let lastCheckedItemData = {};
		let nextCheckedItemData = {};
		let nextCheckedTab = null;

		for (const [tabId, tab] of this.data) {
			if (!tab.data) {
				continue;
			}
			if (tab.data.has(this.selectedMenuItem)) {
				lastCheckedItemData = tab.data.get(this.selectedMenuItem);
			}
			if (tab.data.has(fileId)) {
				nextCheckedItemData = tab.data.get(fileId);
				nextCheckedTab = tabId;
			}
		}
		if (!nextCheckedTab && fileId !== null) {
			return false;
		}

		lastCheckedItemData.checked = false;
		nextCheckedItemData.checked = true;

		this.selectedTab = this.focusedTab = nextCheckedTab;
		this.selectedMenuItem = fileId;
		return true;
	}

	async selectTab(id) {
		const item = this.data.get(id);
		if (item) {
			const isMenu = item.type === 'menu' && item.data?.size > 0;
			if (isMenu) {
				return false;
			}
			this._selectMenuItem(null);
			return super.selectTab(id);
		}

		const result = this._selectMenuItem(id);
		if (this.switcher && result) {
			this.switcher.activePaneId = this.selectedMenuItem;
		}
		await this.render();
		return result;
	}

	formatter(id, data) {
		const item = data.get(id);
		const isMenu = item.type === 'menu' && item.data?.size > 0;
		if (isMenu) {
			return {
				children: createMenu(item, this),
				cssClass: 'aras-tabs__tab_viewing'
			};
		}

		const image = this._updateImage(item);
		return this._getTooltipTemplate(item, image);
	}

	_updateImage(item) {
		const image =
			!item.image_additional || this.selectedTab !== item.id
				? item.image
				: item.image_additional;
		return this._getImage(image);
	}
}
