export default {
	LayoutType: {
		Force: 10,
		Horizontal: 20,
		Vertical: 30
	},

	getLayoutTypeById(layoutId) {
		let selectedLayout;

		switch (layoutId) {
			case 'vertical_layout':
				selectedLayout = this.LayoutType.Vertical;
				break;
			case 'horizontal_layout':
				selectedLayout = this.LayoutType.Horizontal;
				break;
			default:
				selectedLayout = this.LayoutType.Force;
				break;
		}

		return selectedLayout;
	},

	getLayoutIdByType(layoutType) {
		let selectedId;

		switch (layoutType) {
			case this.LayoutType.Vertical:
				selectedId = 'vertical_layout';
				break;
			case this.LayoutType.Horizontal:
				selectedId = 'horizontal_layout';
				break;
			default:
				selectedId = 'force_layout';
				break;
		}

		return selectedId;
	}
};
