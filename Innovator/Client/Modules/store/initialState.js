// @flow
import type { LocalChangesState } from './reducers/localChanges';

type State = {
	localChanges: LocalChangesState,
	layout: Object
};

const initialState: State = {
	localChanges: {},
	layout: {}
};

export default initialState;
