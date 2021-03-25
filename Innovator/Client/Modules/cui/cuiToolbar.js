import cuiMethods from './cuiMethods';

const cuiItemTypes = {
	CommandBarButton: {
		type: 'button'
	},
	CommandBarDropDown: {
		clickEventType: 'change',
		type: 'select'
	},
	CommandBarEdit: {
		clickEventType: 'input',
		type: 'textbox'
	},
	CommandBarMenu: {
		type: 'dropdownMenu'
	},
	CommandBarMenuCheckbox: {
		type: 'checkbox'
	},
	CommandBarMenuSeparator: {
		type: 'separator'
	},
	CommandBarSeparator: {
		type: 'separator'
	}
};

function cuiToolbar(control, location, options = {}) {
	return cuiMethods
		.initializeCuiControl(control, location, cuiItemTypes, options)
		.then(function (cuiData) {
			control.data = cuiData.dataMap;
			const handleControlEvents = cuiMethods.handleControlEvents.bind(
				null,
				control,
				cuiData.events,
				options,
				cuiMethods.defaultEventHandler
			);
			return control.render().then(handleControlEvents);
		});
}

export default cuiToolbar;
