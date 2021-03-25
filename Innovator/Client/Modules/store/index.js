import { bindActionCreators } from '../../vendors/redux';
import reducer from './reducer';
import initialState from './initialState';
import configureStore from './configureStore';
import localChangesActionCreators from './actionCreators/localChanges';
import layoutActionCreators from './actionCreators/layout';
import { enableMapSet } from '../../vendors/immer';

enableMapSet();
const mainWindow = window.aras ? window.aras.getMainWindow() : window;
let store = mainWindow.store;
if (!store) {
	const reduxDevTools =
		mainWindow.__REDUX_DEVTOOLS_EXTENSION__ &&
		mainWindow.__REDUX_DEVTOOLS_EXTENSION__();
	const reduxStore = configureStore(reducer, initialState, reduxDevTools);

	const boundActionCreators = bindActionCreators(
		{
			...localChangesActionCreators,
			...layoutActionCreators
		},
		reduxStore.dispatch
	);

	store = {
		getState: reduxStore.getState,
		subscribe: reduxStore.subscribe,
		boundActionCreators
	};
	mainWindow.store = store;
}

export default store;
