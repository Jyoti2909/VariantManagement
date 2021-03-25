import { createStore } from '../../vendors/redux';

export default function configureStore(reducer, initialState, enhancers) {
	const store = createStore(reducer, initialState, enhancers);
	return store;
}
