import { combineReducers } from '../../vendors/redux';
import localChangesReducers from './reducers/localChanges';
import layoutReducers from './reducers/layout';
import initialState from './initialState';

const reducers = {
	layout: layoutReducers,
	localChanges: localChangesReducers
};
const reducersAreas = Object.keys(reducers);

export default combineReducers(
	reducersAreas.reduce((acc, reducerArea) => {
		acc[reducerArea] = (state = initialState[reducerArea], action) => {
			const reducer = reducers[reducerArea][action.type];
			return reducer ? reducer(state, action.payload) : state;
		};
		return acc;
	}, {})
);
