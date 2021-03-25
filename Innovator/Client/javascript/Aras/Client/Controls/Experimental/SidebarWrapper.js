const widgetIds = [
	'dac-editor',
	'mp-editor',
	'dr-editor',
	'xClass-editor',
	'QueryBuilderEditorContainer',
	'tgv-editor',
	'editor_container',
	'pp_viewer',
	'ebom_viewer',
	'mbom_viewer'
];

class SidebarWrapper {
	constructor(viewersTabs) {
		this.id = 'sidebar';
		this.tabs = this.domNode = viewersTabs;
		dijit.registry.add(this);
	}

	addChild(widget, insertIndex) {
		const { id, label, disabledButtonImage, iconClass } = widget;
		const image = disabledButtonImage || this._getTabImageByClass(iconClass);
		const tab = {
			id,
			image,
			label
		};
		this.tabs.addTab(id, tab, insertIndex);
	}

	getButtonWidgetById(id) {
		return {
			id,
			domNode: {
				style: {}
			}
		};
	}

	getChildren() {
		return this.tabs.tabs.map((tabId) => this.getButtonWidgetById(tabId));
	}

	onloaded() {}

	removeChild(widget = {}) {
		this.tabs.removeTab(widget.id);
	}

	resize() {}

	async setWidgetSelected(widget = {}) {
		const id = widget.id === 'formTab' ? 'show_form' : widget.id;
		const isSelected = await this.tabs.selectTab(id);
		if (isSelected || widgetIds.includes(id)) {
			return;
		}

		await this.tabs.selectTab(null);
	}

	switchSidebarButton(id, image, enabled) {
		if (!enabled) {
			return;
		}

		const item = this.tabs.data.get(id);
		if (!item || item.image_additional) {
			return;
		}

		this.tabs.setTabContent(id, { image_additional: image });
	}

	_getTabImageByClass(iconClass) {
		const images = {
			sidebarButtonHoopsIcon: '../images/3DViewerOff.svg',
			sidebarButtonDynamicHoopsIcon: '../images/Dynamic3DViewerOff.svg',
			sidebarButtonImageIcon: '../images/ImageViewerOff.svg',
			sidebarButtonPdfIcon: '../images/PDFViewerOff.svg',
			sidebarButtonAdvancedImageIcon: '../images/AdvancedImageViewerOff.svg',
			sidebarIconComparison: '../images/ComparisonViewerOn.svg'
		};

		return images[iconClass];
	}
}
