// @flow
import { produce } from '../../../vendors/immer';

export type LocalChangesState = {
	[itemType: string]: {
		[itemId: string]: Object
	}
};

const createItemLocalChangesRecord = (
	state: LocalChangesState,
	payload: { itemType: string, itemId: string }
): LocalChangesState => {
	const { itemType, itemId } = payload;

	if (state[itemType]?.[itemId]) {
		return state;
	}

	const newState = produce(state, (draft) => {
		draft[itemType] = draft[itemType] || {};
		draft[itemType][itemId] = {};
	});
	return newState;
};

const resetItemLocalChangesRecord = (
	state: LocalChangesState,
	payload: { itemType: string, itemId: string }
): LocalChangesState => {
	const { itemType, itemId } = payload;

	if (!state[itemType]?.[itemId]) {
		return state;
	}

	const newState = produce(state, (draft) => {
		draft[itemType][itemId] = {};
	});
	return newState;
};

const deleteItemLocalChangesRecord = (
	state: LocalChangesState,
	payload: { itemType: string, itemId: string }
): LocalChangesState => {
	const { itemType, itemId } = payload;

	if (!state[itemType]?.[itemId]) {
		return state;
	}

	const newState = produce(state, (draft) => {
		delete draft[itemType][itemId];
	});
	return newState;
};

const changeItem = (
	state: LocalChangesState,
	payload: { itemType: string, itemId: string, changes: Object }
): LocalChangesState => {
	const { itemType, itemId, changes } = payload;

	const newState = produce(state, (draft) => {
		draft[itemType] = draft[itemType] || {};
		draft[itemType][itemId] = draft[itemType][itemId] || {};

		Object.assign(draft[itemType][itemId], changes);
	});

	return newState;
};

export default {
	changeItem,
	createItemLocalChangesRecord,
	resetItemLocalChangesRecord,
	deleteItemLocalChangesRecord
};
