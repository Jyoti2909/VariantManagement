import { adaptGridRowsFromXml, adaptGridRowFromStore } from './adaptGridRows';

const getLocalChangesForItemTypes = (itemTypes, state) => {
	const localChanges = itemTypes.reduce(
		(acc, watchedItemType) => {
			if (state.localChanges[watchedItemType]) {
				acc.localChanges[watchedItemType] = state.localChanges[watchedItemType];
			}
			return acc;
		},
		{ localChanges: {} }
	);
	return localChanges;
};

const setLocalChangesToGrid = (
	prevChanges = {},
	changes = {},
	grid,
	options = {}
) => {
	const headMap = grid.head;
	const indexHead = grid.settings.indexHead;
	const prevChangesCopy = { ...prevChanges };

	Object.keys(changes).forEach((itemId) => {
		delete prevChangesCopy[itemId];
		if (!grid.rows.has(itemId)) {
			return;
		}

		let rowChanges = { ...changes[itemId] };
		rowChanges = adaptGridRowFromStore(rowChanges, headMap);
		const prevRowChanges = prevChanges[itemId];

		if (prevRowChanges && prevRowChanges !== changes[itemId]) {
			let cachedItem = window.aras.getFromCache(itemId);
			if (!cachedItem && rowChanges.related_id) {
				cachedItem = window.item.selectSingleNode(
					`Relationships/Item[@id='${itemId}']`
				);
			}
			if (cachedItem) {
				const originalRow = adaptGridRowsFromXml(
					`<Result>${cachedItem.xml}</Result>`,
					{
						headMap,
						indexHead,
						linkPropertyToBeProcessed: options.linkPropertyToBeProcessed
					}
				);
				const originalRowValues = originalRow.rowsMap.get(itemId);

				const relatedId = originalRowValues.related_id;
				if (relatedId && !grid.rows.has(relatedId)) {
					grid.rows._store.set(relatedId, originalRow.rowsMap.get(relatedId));
				}

				rowChanges = {
					...originalRowValues,
					...rowChanges
				};
			}
		}

		grid.rows.set(itemId, {
			...grid.rows.get(itemId),
			...rowChanges
		});
	});

	Object.keys(prevChangesCopy).forEach((itemId) => {
		if (!grid.rows.has(itemId)) {
			return;
		}
		const cachedItem = window.aras.getFromCache(itemId);
		if (!cachedItem) {
			return;
		}
		const originalRow = adaptGridRowsFromXml(
			`<Result>${cachedItem.xml}</Result>`,
			{
				headMap,
				indexHead,
				linkPropertyToBeProcessed: options.linkPropertyToBeProcessed
			}
		);
		const originalRowValues = originalRow.rowsMap.get(itemId);
		grid.rows.set(itemId, {
			...grid.rows.get(itemId),
			...originalRowValues
		});
	});
};

const syncLocalChangesWithGrid = (
	prevLocalChanges,
	nextLocalChanges,
	grid,
	options = {}
) => {
	const { relatedTypeName } = options;

	Object.keys(nextLocalChanges).forEach((type) => {
		const options = {};
		if (type === relatedTypeName) {
			options.linkPropertyToBeProcessed = 'related_id';
		}

		setLocalChangesToGrid(
			prevLocalChanges[type],
			nextLocalChanges[type],
			grid,
			options
		);
	});
};
export { getLocalChangesForItemTypes, syncLocalChangesWithGrid };
