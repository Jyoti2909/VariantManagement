import cuiMethods from './cuiMethods';
const { wire, bind } = HyperHTMLElement;

const cuiItemTypes = {};
const cache = {
	data: new Map(),
	roots: []
};

async function cuiBackgroundPage(control, location, options = {}) {
	if (!options.renderOnly) {
		const cuiData = await cuiMethods.initializeCuiControl(
			control,
			location,
			cuiItemTypes,
			options
		);
		const { dataMap: data, roots } = cuiMethods.adaptDataForControl(cuiData);
		const newRoots = flatRoots(data, roots);
		cache.data = data;
		cache.roots = newRoots;
	}

	await Promise.resolve();
	const { data, roots } = cache;
	const tiles = createTileNodes(data, roots);
	bind(control)`
		<div
			class="aras-background-page__container"
			onclick="${(event) => eventHandler(control, data, options, event)}"
		>
			${tiles}
		</div>
	`;
}

function createImageNode(icon) {
	return ArasModules.SvgManager.createHyperHTMLNode(icon, {
		class: 'aras-tile__image'
	});
}

function createTileNodes(dataMap, roots) {
	return roots.map((id) => {
		const item = dataMap.get(id);
		const { icon, label, aria_label: ariaLabel = label } = item;
		const image = createImageNode(icon);
		return wire(item)`
			<div
				class="aras-tile"
				data-id="${id}"
			>
				<button
					aria-label="${ariaLabel}"
					class="aras-tile__button"
				>
					${image}
				</button>
				<div class="aras-tile__label">
					${label}
				</div>
			</div>
		`;
	});
}

function flatRoots(dataMap, roots) {
	const rootItems = roots.filter((id) => {
		const item = dataMap.get(id);
		const noChildren = !item.children;
		return noChildren;
	});

	const nestedItems = roots.filter((id) => {
		const item = dataMap.get(id);
		const hasChildren = !!item.children;
		return hasChildren;
	});

	const nextLevelItems = nestedItems.flatMap((id) => {
		const item = dataMap.get(id);
		return flatRoots(dataMap, item.children);
	});

	return rootItems.concat(nextLevelItems);
}

function eventHandler(control, data, options, event) {
	const target = event.target.closest('.aras-tile__button');
	if (!target) {
		return;
	}

	const tile = target.closest('.aras-tile');
	const itemId = tile.dataset.id;
	const item = data.get(itemId);
	if (item.on_click_handler) {
		const context = {
			currentTarget: item,
			target: item,
			control: control
		};
		cuiMethods.executeClientMethod(item.on_click_handler, context, options);
		return;
	}

	const tabsContainer = window.mainLayout.tabsContainer;
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
	} else if (item.itemTypeId) {
		const tabsObj = window.arasTabs;
		tabsObj.openSearch(item.itemTypeId);
	}
}

export default cuiBackgroundPage;
