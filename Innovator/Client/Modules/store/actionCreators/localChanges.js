// @flow
const createItemLocalChangesRecord = (
	itemType: string,
	itemId: string
): Object => ({
	type: 'createItemLocalChangesRecord',
	payload: { itemType, itemId }
});

const resetItemLocalChangesRecord = (
	itemType: string,
	itemId: string
): Object => ({
	type: 'resetItemLocalChangesRecord',
	payload: { itemType, itemId }
});

const deleteItemLocalChangesRecord = (
	itemType: string,
	itemId: string
): Object => ({
	type: 'deleteItemLocalChangesRecord',
	payload: { itemType, itemId }
});

const changeItem = (
	itemType: string,
	itemId: string,
	changes: Object
): Object => ({
	type: 'changeItem',
	payload: { itemType, itemId, changes }
});

export default {
	createItemLocalChangesRecord,
	resetItemLocalChangesRecord,
	deleteItemLocalChangesRecord,
	changeItem
};
