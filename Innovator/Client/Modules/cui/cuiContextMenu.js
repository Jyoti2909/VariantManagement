import cuiMethods from './cuiMethods';

const cuiItemTypes = {
	CommandBarMenuSeparator: {
		type: 'separator'
	},
	CommandBarSeparator: {
		type: 'separator'
	}
};

function cuiContextMenu(control, location, options = {}) {
	return cuiMethods
		.initializeCuiControl(control, location, cuiItemTypes, options)
		.then(cuiMethods.adaptDataForControl)
		.then((cuiData) => {
			control.data = cuiData.dataMap;
			control.roots = cuiData.roots;

			const controlDestructor = cuiMethods.handleControlEvents(
				control,
				cuiData.events,
				options,
				itemClickHandler
			);
			controlDestructor.show = (coords, args) => {
				const data = {
					control,
					cuiItemTypes,
					dataMap: control.data,
					options: {
						...options,
						...args
					}
				};
				const contextMenuAllowed = initContextMenuItems(data);

				if (contextMenuAllowed) {
					return control.show(coords, args);
				}
			};
			return controlDestructor;
		});
}

function initContextMenuItems(cuiData) {
	let visibleItemCount = 0;
	cuiData.dataMap.forEach(function (item) {
		cuiMethods.initializeItem(item, cuiData);
		if (item.hidden || item.type === 'separator') {
			return;
		}

		visibleItemCount++;
	});

	return visibleItemCount > 0;
}

function itemClickHandler(control, options, itemId) {
	const targetItem = control.data.get(itemId);
	if (!targetItem || !targetItem.on_click_handler) {
		return;
	}

	const context = {
		currentTarget: targetItem,
		target: targetItem,
		control: control
	};
	Object.assign(options, control.args);
	cuiMethods.executeClientMethod(targetItem.on_click_handler, context, options);
}

export default cuiContextMenu;
