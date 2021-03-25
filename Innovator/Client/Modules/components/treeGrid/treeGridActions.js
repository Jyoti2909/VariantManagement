import GridActions from '../grid/actions';

const getRemoveCount = function (indexTreeRows, indexRowsItem, expanded) {
	return (indexTreeRows[indexRowsItem] || []).reduce(function (
		removeCount,
		childId
	) {
		const res = removeCount + 1;
		if (expanded.has(childId)) {
			return res + getRemoveCount(indexTreeRows, childId, expanded);
		}
		return res;
	},
	0);
};
const getElementsToAdd = function (indexTreeRows, indexRowsItem, expanded) {
	return (indexTreeRows[indexRowsItem] || []).reduce(function (array, childId) {
		array.push(childId);
		if (expanded.has(childId)) {
			return array.concat(getElementsToAdd(indexTreeRows, childId, expanded));
		}
		return array;
	}, []);
};

class TreeGridActions extends GridActions {
	constructor(grid) {
		super(grid);
		this._addHandlers([
			{
				target: grid,
				action: 'expand',
				handler: this._expandHandler.bind(this)
			}
		]);
	}
	_expandHandler(e) {
		const rowId = this.grid.settings.indexRows[e.detail.index];
		return this._toggleExpanded(rowId);
	}
	async _toggleExpanded(rowId) {
		const grid = this.grid;
		const sourceItem = grid._rows.get(rowId);
		if (!sourceItem || !sourceItem.children) {
			return;
		}

		let expanded;
		if (sourceItem.children === true && !grid.settings.expanded.has(rowId)) {
			grid.settings.expanded.add(rowId);
			grid.render();
			expanded = await grid._buildBranchData(rowId);
		} else {
			expanded = grid.settings.expanded.has(rowId);
		}

		const rowIndex = grid.settings.indexRows.indexOf(rowId);
		if (rowIndex === -1) {
			return expanded;
		}

		if (expanded) {
			grid.settings.expanded.delete(rowId);
			const removeCount = getRemoveCount(
				grid.settings.indexTreeRows,
				rowId,
				grid.settings.expanded
			);
			grid.settings.indexRows.splice(rowIndex + 1, removeCount);
		} else {
			grid.settings.expanded.add(rowId);
			if (!grid.settings.indexTreeRows[rowId]) {
				const rowChildren = grid.rows.get(rowId, 'children');
				grid.settings.indexTreeRows[rowId] = [...rowChildren];
				if (grid.settings.orderBy.length) {
					grid.settings.indexTreeRows[rowId].sort(
						grid.actions._sortFn.bind(grid)
					);
				}
			}
			const argumentsArr = [rowIndex + 1, 0].concat(
				getElementsToAdd(
					grid.settings.indexTreeRows,
					rowId,
					grid.settings.expanded
				)
			);
			grid.settings.indexRows.splice(...argumentsArr);
		}
		grid.render();
		return expanded;
	}
	_calcIndexRows(indexRows = []) {
		let i = 0;
		const settings = this.grid.settings;
		const indexTreeRows = settings.indexTreeRows;
		const expanded = settings.expanded;
		const calcBranchIndex = (branchId) => {
			for (const rowId of indexTreeRows[branchId]) {
				indexRows[i++] = rowId;
				if (indexTreeRows[rowId] && expanded.has(rowId)) {
					calcBranchIndex(rowId);
				}
			}
		};

		calcBranchIndex('roots');
		return indexRows;
	}
	_calcRowsMetadata(indexTreeRows, rowId) {
		const metadata = {};
		const calcMetadataFunc = function (key, parent) {
			indexTreeRows[key].forEach(function (child, idx, arr) {
				const lastOne = idx === arr.length - 1;
				metadata[child] = {
					className: lastOne ? 'aras-grid-row_lastChild' : '',
					isLastChildOnLevel: lastOne
				};
				if (parent) {
					const levelLines = (parent.levelLines || []).slice();
					levelLines.push(parent.isLastChildOnLevel ? 0 : 1);
					metadata[child].levelLines = levelLines;
				}

				if (indexTreeRows[child]) {
					calcMetadataFunc(child, metadata[child]);
				}
			});
		};
		const rowMetadata = this.grid.metadata[rowId];
		const rootId = rowMetadata ? rowId : 'roots';
		calcMetadataFunc(rootId, rowMetadata);
		return metadata;
	}
	_sortFn(a, b) {
		const orderBy = this.settings.orderBy;
		for (let i = 0; i < orderBy.length; i++) {
			const prop = orderBy[i].headId;
			const reverse = orderBy[i].desc;
			const result = this.actions._sortRows(a, b, prop, reverse);
			if (result !== 0) {
				return result;
			}
		}
		return 0;
	}

	_sortRows(rowAId, rowBId, prop, reverse) {
		const valueA = this.grid.rows.get(rowAId, prop);
		const valueB = this.grid.rows.get(rowBId, prop);

		if (
			'bigInt' in window &&
			bigInt.isInstance(valueA) &&
			bigInt.isInstance(valueB)
		) {
			const result = valueA.compare(valueB);
			if (result !== 0) {
				return reverse ? -1 * result : result;
			}
		}
		if (valueA < valueB) {
			return reverse ? 1 : -1;
		}
		if (valueA > valueB) {
			return reverse ? -1 : 1;
		}
		return 0;
	}
}

export default TreeGridActions;
