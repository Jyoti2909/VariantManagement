import { executeLegacyMethod, isLegacyMethod } from './compatCuiMethods';

const cuiMethods = {
	collectCuiData: function (items, initialData) {
		const data = Object.assign({}, initialData, {
			dataMap: new Map(),
			events: new Set(['click']),
			images: [],
			roots: []
		});

		return items.reduce(function (data, item) {
			item = cuiMethods.initializeItem(item, data);
			if (item.data) {
				const itemsMap = new Map();
				item.data.forEach(function (childItem) {
					childItem = cuiMethods.initializeItem(childItem, data, item);
					cuiMethods.addItemPropertiesToCuiData(data, childItem);
					itemsMap.set(childItem.id, childItem);
				});
				item.data = itemsMap;
			}
			cuiMethods.addItemPropertiesToCuiData(data, item);
			data.dataMap.set(item.id, item);
			data.roots.push(item.name);
			return data;
		}, data);
	},
	addItemPropertiesToCuiData: function (cuiData, item) {
		if (item.clickEventType) {
			if (item.clickEventType === 'mousedown') {
				cuiData.events.add('keydown');
			}
			cuiData.events.add(item.clickEventType);
		}
		if (item.image) {
			cuiData.images.push(item.image);
		}
		if (item.image_additional) {
			cuiData.images.push(item.image_additional);
		}
	},
	destroyMethodsCollection: new WeakMap(),
	destroyMethodFactory: function (control, detachEventListenersArray) {
		const detachEventListeners = function () {
			(detachEventListenersArray || []).forEach(function (fn) {
				fn();
			});
		};
		return {
			destroy: detachEventListeners
		};
	},
	defaultEventHandler: function (control, options, itemId, event) {
		let parentItem;
		let targetItem;
		const menuItemNode = event.target.closest('li[data-index]');
		if (menuItemNode) {
			parentItem = control.data.get(itemId);
			const targetId = menuItemNode.dataset.index;
			targetItem = parentItem.data.get(targetId);
		} else {
			targetItem = control.data.get(itemId);
		}

		const handler =
			targetItem &&
			(targetItem.on_click_handler || targetItem.on_keydown_handler);
		if (!handler) {
			return;
		}

		const clickEventType = targetItem.clickEventType;
		const eventType = event.type;
		const context = {
			currentTarget: parentItem || targetItem,
			target: targetItem,
			control: control
		};

		if (
			targetItem['@type'] === 'CommandBarButton' &&
			clickEventType === 'mousedown' &&
			['keydown'].includes(eventType) &&
			['Enter', 'NumpadEnter', 'Space', 13, 32].includes(
				event.code || event.keyCode
			)
		) {
			cuiMethods.executeClientMethod(handler, context, options);
			return;
		}

		if (
			clickEventType === eventType ||
			(!clickEventType && eventType === 'click')
		) {
			cuiMethods.executeClientMethod(handler, context, options);
		}
	},
	executeClientMethod: function (methodId, context, options) {
		if (!methodId) {
			return;
		}

		const methodNd = aras.MetadataCache.GetClientMethodNd(methodId, 'id');
		if (!methodNd) {
			const notify = aras.getNotifyByContext(window);
			notify(aras.getResource('', 'cui.failed_to_execute_method', methodId), {
				type: 'error'
			});
			return;
		}

		Object.assign(context, options);
		const methodCode = methodNd.selectSingleNode('method_code').text;
		const isLegacy = isLegacyMethod(methodCode);
		try {
			if (isLegacy) {
				return executeLegacyMethod(methodId, methodCode, context);
			}

			const method = new Function('control', 'target', 'options', methodCode); // jshint ignore:line
			return method(context.control, context.target, context);
		} catch (e) {
			aras.AlertError(
				aras.getResource(
					'',
					'aras_object.method_failed',
					aras.getItemProperty(methodNd, 'name')
				),
				aras.getResource(
					'',
					'aras_object.aras_object',
					e.number,
					e.description || e.message
				),
				aras.getResource('', 'common.client_side_err')
			);
		}
	},
	getConfigurableUi: function (location, options) {
		const requestParams = cuiMethods.getRequestParams(location, options);
		return aras.MetadataCacheJson.GetConfigurableUiAsync(requestParams);
	},
	getRequestParams: (location, options) => {
		const {
			itemId = '',
			itemTypeName = '',
			item_classification: itemClassification = ''
		} = options;

		const itemTypeId = itemTypeName ? aras.getItemTypeId(itemTypeName) : '';

		return {
			item_id: isPresentableItem(itemTypeId) ? itemId : '',
			item_type_id: itemTypeId,
			location_name: location,
			item_classification: itemClassification
		};
	},
	handleControlEvents: function (control, events, options, handler) {
		if (!handler) {
			return;
		}
		if (cuiMethods.destroyMethodsCollection.has(control)) {
			throw new Error('The event handler for this control is already defined.');
		}

		const detachEventListenersArray = [];
		events.forEach(function (eventName) {
			const removeListenerFn = control.on(eventName, (...args) => {
				const controlData = cuiMethods.destroyMethodsCollection.get(control);
				const handlerOptions = controlData.options;

				return handler(control, handlerOptions, ...args);
			});
			detachEventListenersArray.push(removeListenerFn);
		});

		const destroyObject = cuiMethods.destroyMethodFactory(
			control,
			detachEventListenersArray
		);

		cuiMethods.destroyMethodsCollection.set(control, {
			...destroyObject,
			options
		});

		return {
			...destroyObject,
			updateOptions: (newOptions) => {
				const controlData = cuiMethods.destroyMethodsCollection.get(control);
				cuiMethods.destroyMethodsCollection.set(control, {
					...controlData,
					options: newOptions
				});
			}
		};
	},
	initializeCuiControl: function (control, location, cuiItemTypes, options) {
		const destroyMethodsCollection = cuiMethods.destroyMethodsCollection;
		if (destroyMethodsCollection.has(control)) {
			destroyMethodsCollection.get(control).destroy();
			destroyMethodsCollection.delete(control);
		}

		return cuiMethods
			.getConfigurableUi(location, options)
			.then(function (items) {
				const cuiData = cuiMethods.collectCuiData(items, {
					control,
					cuiItemTypes,
					options
				});
				ArasModules.SvgManager.load(cuiData.images);
				return cuiData;
			});
	},
	initializeItem: function (item, cuiData, rootItem) {
		const context = {
			control: cuiData.control,
			currentTarget: rootItem || item,
			target: item
		};
		const type = item['@type'];
		const itemTypeMetadata = cuiData.cuiItemTypes[type];
		const initHandlerResult = cuiMethods.executeClientMethod(
			item.on_init_handler,
			context,
			cuiData.options
		);
		Object.assign(
			item,
			itemTypeMetadata,
			item.additional_data,
			initHandlerResult
		);

		item.id = item.name;
		return item;
	},
	reinitControlItems: function (control, eventType, options) {
		const context = {
			control: control
		};
		const reinitAllItems = function (data, rootItem) {
			data.forEach(function (item) {
				const events = item.include_events;
				if (events && events.indexOf(eventType) !== -1) {
					initItem(data, item, rootItem);
				}
			});
		};
		const initItem = function (data, item, rootItem) {
			Object.assign(context, {
				currentTarget: rootItem || item,
				target: item
			});
			const optionsForInit =
				options || cuiMethods.destroyMethodsCollection.get(control).options;
			const initHandlerResult = cuiMethods.executeClientMethod(
				item.on_init_handler,
				context,
				optionsForInit
			);
			const newItem = Object.assign(
				{},
				item,
				item.additional_data,
				initHandlerResult
			);
			data.set(item.id, newItem);

			if (item.data) {
				reinitAllItems(item.data, item);
			}
		};

		reinitAllItems(control.data);
		control.render();
	},
	adaptDataForControl: function (cuiData) {
		const data = cuiData.dataMap;
		data.forEach(function (item) {
			if (item.image) {
				item.icon = item.image;
				delete item.image;
			}
			if (!item.data) {
				return;
			}
			item.data.forEach(function (child) {
				data.set(child.id, child);
			});
			item.children = item.roots;
			delete item.data;
			delete item.roots;
		});
		return cuiData;
	}
};

const isPresentableItem = (itemTypeId) => {
	if (!itemTypeId) {
		return false;
	}

	const item = aras.getItemTypeForClient('PresentableItems', 'name');
	const morphaeList = aras.getMorphaeList(item.node);
	return morphaeList.some((item) => item.id === itemTypeId);
};

export default cuiMethods;
