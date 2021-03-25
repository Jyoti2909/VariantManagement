function ItemTypeXPropertyRelationshipsGrid() {}

ItemTypeXPropertyRelationshipsGrid.prototype.canEditCell = function (
	readonly,
	isEditMode,
	isDescBy,
	propInfo,
	lockedStatusStr,
	hasRelatedItem,
	isTemp,
	hasEditState,
	rowId,
	cellIndex
) {
	return propInfo.DRL === 'D';
};
