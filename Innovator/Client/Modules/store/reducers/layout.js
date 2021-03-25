import { produce } from '../../../vendors/immer';

// @flow

const updateLayoutData = (
	state: Object,
	payload: { layoutId: string, data: Object }
): Object => {
	const { layoutId, data } = payload;
	return { ...state, [layoutId]: data };
};

const removeLayout = (state: Object, payload: { layoutId: string }): Object => {
	const { layoutId } = payload;

	const newState = produce(state, (draft) => {
		delete draft[layoutId];
	});
	return newState;
};

export default {
	updateLayoutData,
	removeLayout
};
