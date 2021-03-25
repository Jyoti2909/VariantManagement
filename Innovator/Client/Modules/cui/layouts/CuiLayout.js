import getControlMetadata from './../cuiControls';
import cuiMethods from './../cuiMethods';
import CuiObserver from './../CuiObserver';
import store from '../../store/index';
import { produce } from '../../../vendors/immer';

const normalizeControlData = (control) => {
	const result = {
		...control,
		...control.additional_data
	};
	if (result.roots) {
		result.children = result.roots;
		delete result.data;
		delete result.roots;
	}

	return result;
};

const collectControlsData = (controls) => {
	const topToolbarsNode = document.getElementById('top-toolbars');
	const firstNonToolbarControlIndex = topToolbarsNode
		? controls.findIndex((control) => {
				return control['control_type'] !== 'ToolbarControl';
		  })
		: 0;
	return controls.reduce(
		(controlsData, control, index) => {
			const {
				dataMap,
				firstNonToolbarControlIndex,
				otherControls,
				topToolbars
			} = controlsData;
			const { data, name } = control;
			if (
				index < firstNonToolbarControlIndex ||
				firstNonToolbarControlIndex === -1
			) {
				topToolbars.push(name);
			} else {
				otherControls.push(name);
			}

			if (data) {
				data.forEach((child) => {
					dataMap.set(child.name, normalizeControlData(child));
				});
			}
			dataMap.set(name, normalizeControlData(control));

			return controlsData;
		},
		{
			dataMap: new Map(),
			firstNonToolbarControlIndex,
			otherControls: [],
			topToolbars: []
		}
	);
};

export default class CuiLayout {
	deferredLocations = [];
	observer = new CuiObserver();
	#state = null;
	#props = null;
	#storeLayoutId;
	#subscriptions = [];
	#unloadHandler;

	constructor(dom, location = '', options = {}) {
		this.dom = dom;
		this.location = location;
		this.options = options;
		this.options.notifyObserver = (eventType) =>
			this.observer.notify(eventType);

		this.#storeLayoutId = `${this.constructor.name}_${
			this.location
		}_${Date.now()}`;

		this.#unloadHandler = () => {
			throw new Error(`
				CUI Layout ${this.#storeLayoutId}
				was not destroyed properly. Please call .destroy() to avoid
				memory leaks and forgotten kept data.
			`);
		};

		setTimeout(() => {
			window.addEventListener('unload', this.#unloadHandler);
		}, 0);
	}

	initializePropsAndState() {
		this._initializeState();
		this._initializeProps();

		if (this.#state || this.#props) {
			this._initializeStoreSubscription();
		}
	}

	async init() {
		this.initializePropsAndState();

		const controls = await this._getCuiControls();
		const { dataMap, otherControls, topToolbars } = collectControlsData(
			controls
		);
		const controlsMap = new Map();
		if (topToolbars.length) {
			HyperHTMLElement.bind(
				document.getElementById('top-toolbars')
			)`${topToolbars.map((controlName) =>
				this._initCuiControl(controlName, { dataMap, controlsMap })
			)}`;
		}

		if (otherControls.length) {
			HyperHTMLElement.bind(this.dom)`${otherControls.map((controlName) =>
				this._initCuiControl(controlName, { dataMap, controlsMap })
			)}`;
		}

		const initializedControlsPromises = [];
		let defferedEvents = new Set();

		controlsMap.forEach((component, componentData) => {
			const { control_type: type, children = [] } = componentData;
			const { eventHandler, initControl } = getControlMetadata(type);

			if (eventHandler) {
				const unsubscribe = this.observer.subscribe((eventType) => {
					if (!defferedEvents) {
						eventHandler(component, eventType, this.options);
					} else {
						defferedEvents.add(eventType);
					}
				});
				this.#subscriptions.push(unsubscribe);
			}

			if (initControl) {
				const childrenData = children.map((childName) =>
					dataMap.get(childName)
				);
				const data = { componentData, childrenData };
				const nodes = {
					component,
					children: childrenData.map((childData) => controlsMap.get(childData))
				};
				const initPromise = initControl(nodes, data, this.options);
				initializedControlsPromises.push(initPromise);
			}
		});
		this._preloadDeferredLocations();

		await Promise.all(initializedControlsPromises);
		const setEvents = defferedEvents;
		defferedEvents = null;
		setEvents.forEach((eventType) => this.observer.notify(eventType));
	}

	get state() {
		return this.#state;
	}

	get props() {
		return this.#props;
	}

	_initializeStoreSubscription() {
		const unsubscribeFromStore = store.subscribe(() => {
			if (this.#subscriptions.length === 0) {
				return;
			}
			const prevProps = this.#props;
			const prevState = this.#state;

			const state = store.getState();
			const nextDerivedState = state.layout[this.#storeLayoutId];
			this.#state = nextDerivedState;

			const nextProps = this.mapStateToProps(state);
			this.#props = nextProps;

			if (this.shouldLayoutUpdate(prevProps, prevState)) {
				this.updateLayout(prevProps, prevState);
			}
		});

		this.#subscriptions.push(unsubscribeFromStore);
	}

	_initializeState() {
		if (!this.initialState) {
			return;
		}

		this.#state = this.initialState;
		this.setState();
	}

	_initializeProps() {
		const initialProps = this.mapStateToProps(store.getState());

		this.#props = initialProps;
	}

	setState(handler = () => {}) {
		const data = produce(this.#state, (draft) => handler(draft));
		store.boundActionCreators.updateLayoutData(this.#storeLayoutId, data);
	}

	shouldLayoutUpdate(prevProps, prevState) {
		return this.#props !== prevProps || this.#state !== prevState;
	}

	mapStateToProps(state) {}

	updateLayout(prevProps, prevState) {}

	_getCuiControls() {
		const requestParams = cuiMethods.getRequestParams(
			this.location,
			this.options
		);
		return aras.MetadataCacheJson.GetConfigurableUIControls(requestParams);
	}

	_initCuiControl(controlName, data) {
		const { dataMap, controlsMap } = data;
		const control = dataMap.get(controlName);
		const { children = [], control_type: type } = control;
		const childNodes = children.map((childName) =>
			this._initCuiControl(childName, data)
		);
		const controlMetadata = getControlMetadata(type);
		const nodes = controlMetadata.constructor(
			control,
			childNodes,
			controlMetadata
		);
		const controlNode = Array.isArray(nodes) ? nodes[0] : nodes;
		controlsMap.set(control, controlNode);
		return nodes;
	}

	_preloadDeferredLocations() {
		const preload = (location) =>
			cuiMethods.getConfigurableUi(location, this.options);
		const preloadedLocations = this.deferredLocations.map(preload);
		return Promise.all(preloadedLocations);
	}

	destroy() {
		this.#subscriptions.forEach((unsubscribe) => unsubscribe());
		this.#subscriptions = [];

		if (this.#state) {
			store.boundActionCreators.removeLayout(this.#storeLayoutId);
		}

		window.removeEventListener('unload', this.#unloadHandler);
	}
}
