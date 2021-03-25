import cuiMethods from './cuiMethods';

const cuiItemTypes = {};

function cuiToc(control, location, options = {}) {
	return cuiMethods
		.initializeCuiControl(control, location, cuiItemTypes, options)
		.then(cuiMethods.adaptDataForControl)
		.then(function (cuiData) {
			control.dataStore.items = cuiData.dataMap;
			control.dataStore.roots = new Set(cuiData.roots);
			cuiData.events.add('keypress');
			const handleControlEvents = cuiMethods.handleControlEvents.bind(
				null,
				control,
				cuiData.events,
				options,
				eventHandler
			);
			return control.render().then(handleControlEvents);
		});
}

function eventHandler(control, options, itemId, event) {
	const item = control.data.get(itemId);
	if (
		event.type === 'keypress' &&
		![13, 32, 'Enter', 'Space', 'NumpadEnter'].includes(
			event.code || event.keyCode
		)
	) {
		return;
	}
	if (item.on_click_handler) {
		const currentTarget = control.data.get(item['parent_menu@keyed_name']);
		const context = {
			currentTarget: currentTarget || item,
			target: item,
			control: control
		};
		cuiMethods.executeClientMethod(item.on_click_handler, context, options);
		return;
	}

	const mainWindow = aras.getMainWindow();
	const tabsContainer = mainWindow.mainLayout.tabsContainer;
	const searchIconNode = event.target.closest('.aras-button.aras-nav-leaf-ico');
	if (item.formId) {
		tabsContainer.openForm(item.formId, item.icon, item.label);
	} else if (item.startPage) {
		const url = item.startPage;
		let parameters = item.parameters || '';
		if (parameters) {
			if (parameters.startsWith("'") && parameters.endsWith("'")) {
				parameters = parameters.slice(1, -1);
			}
			parameters = '?' + parameters;
		}
		tabsContainer.openPage(
			url + parameters,
			item.itemTypeId,
			item.icon,
			item.label
		);
	} else if (searchIconNode) {
		const tabsObj = mainWindow.arasTabs;
		tabsObj.openSearch(item.itemTypeId);
	}
}

export default cuiToc;
