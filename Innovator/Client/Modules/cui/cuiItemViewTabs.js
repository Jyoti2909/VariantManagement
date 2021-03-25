import cuiMethods from './cuiMethods';

const solutionsTabs = {
	mpp_show_pp_view: '../images/ProcessPlanEditor.svg',
	mpp_show_ebom_view: '../images/EBOM.svg',
	mpp_show_mbom_view: '../images/MBOM.svg',
	requirement_show_editor: '../Solutions/RE/Images/RequirementEditOn.svg'
};

const cuiItemTypes = {
	CommandBarMenu: {
		type: 'menu'
	}
};

const adaptData = (data) => {
	data.forEach((item) => {
		includeEvents(item);
		removeLabels(item);
		updateSolutionsImages(item);
	});

	return data;
};

const includeEvents = (item) => {
	if (item.viewerType) {
		return item;
	}

	const includeEvents = item.include_events;
	const itemEvents = includeEvents ? includeEvents.split(',') : [];
	const uniqueEvents = new Set([...itemEvents, 'UpdateTearOffWindowState']);
	item.include_events = [...uniqueEvents].join(',');
	return item;
};

const removeLabels = (item) => {
	if (!item.tooltip_template && item.label) {
		item.tooltip_template = item.label;
	}
	delete item.label;

	return item;
};

const updateSolutionsImages = (item) => {
	if (item.image_additional) {
		return item;
	}

	if (item.enabledButtonImage) {
		item.image_additional = item.enabledButtonImage;
		return item;
	}

	const image = solutionsTabs[item.id];
	if (image) {
		item.image_additional = image;
	}

	return item;
};

async function cuiItemViewTabs(control, location, options = {}) {
	const { dataMap, events } = await cuiMethods.initializeCuiControl(
		control,
		location,
		cuiItemTypes,
		options
	);

	const data = adaptData(dataMap);
	control.data = data;
	control.tabs = [...data.keys()];
	const renderPromise = control.render();

	const handleControlEvents = cuiMethods.handleControlEvents(
		control,
		events,
		options,
		cuiMethods.defaultEventHandler
	);
	await renderPromise;

	return {
		...handleControlEvents,
		subscribeToLayoutObserver(observer) {
			observer.subscribe((eventType) => {
				cuiMethods.reinitControlItems(control, eventType);
			});
		}
	};
}

export default cuiItemViewTabs;
