// @flow

const updateLayoutData = (layoutId: string, data: Object): Object => ({
	type: 'updateLayoutData',
	payload: { layoutId, data }
});

const removeLayout = (layoutId: string): Object => ({
	type: 'removeLayout',
	payload: { layoutId }
});

export default { updateLayoutData, removeLayout };
