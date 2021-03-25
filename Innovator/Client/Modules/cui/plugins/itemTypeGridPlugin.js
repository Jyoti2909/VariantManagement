import { adaptGridHeader } from './adaptGridHeader';
import parseCssString from './parseCssString';
import itemTypeMetadata from '../../metadata/itemType';

const itemTypeGridPlugin = {
	events: [
		{
			type: 'click',
			element: 'cell',
			name: 'gridLink',
			method(payload) {
				const [headId, rowId, event] = payload.data;
				this.gridLinkClick(headId, rowId, event);
			}
		},
		{
			type: 'dblclick',
			element: 'cell',
			name: 'onRowDblClick',
			method(payload) {
				const [, rowId, event] = payload.data;
				const altMode = event.ctrlKey || event.metaKey;

				window.ItemTypeGrid.onDoubleClick(rowId, altMode);
			}
		},
		{
			type: 'focusCell',
			name: 'onFocusSearchCell',
			method(payload) {
				const [event] = payload.data;

				if (this._oldSearchHeadId) {
					const rowId = 'input_row';
					const field = this._oldSearchHeadId;
					this._oldSearchHeadId = null;

					this.resetFilterListValueIfNeed(field);
					window.applyCellEditCommon.call(
						this.options.gridWrapper,
						rowId,
						field
					);
				}

				if (event.detail && event.detail.indexRow === 'searchRow') {
					this._oldSearchHeadId = this.grid.settings.focusedCell.headId;
				}
			}
		}
	],

	async init() {
		await this.initGridHeader();

		this.grid.rows = new Map();
		this.grid.settings.indexRows = [];
		this.grid.settings.selectedRows = [];
		this.setDefaultFrozenColumns();
		this.setFrozenColumns();

		this.grid.on('keydown', this.getKeyDownHandler(), 'cell');

		this.options.gridWrapper._itemType = await itemTypeMetadata.getItemType(
			this.options.itemTypeId,
			'id'
		);

		this.cachedRowStyles = new Map();
		this.currentUserId = aras.getCurrentUserID();
	},

	async initGridHeader() {
		this.gridHeaderInfo = await this.adaptHeader();
		const { columnsOrder, headMap, indexHead } = this.gridHeaderInfo;
		this.grid.head = headMap;
		this.grid.settings.indexHead = indexHead;
		this.options.gridWrapper.grid_Experimental.order = columnsOrder;
	},

	async adaptHeader() {
		return await adaptGridHeader(
			this.options.itemTypeId,
			this.options.userPreferences
		);
	},

	resetFilterListValueIfNeed(changedCellHeadId) {
		const grid = this.options.gridWrapper;
		const { head, settings } = this.grid;
		const visibleColumns = settings.indexHead;
		const changedPropertyName = head.get(changedCellHeadId, 'name');

		for (const headId of visibleColumns) {
			const propertyPattern = head.get(headId, 'pattern');
			if (propertyPattern !== changedPropertyName) {
				continue;
			}

			const columnIndex = grid.getColumnIndex(changedCellHeadId);
			const propXpath = window.searchContainer.getPropertyXPathByColumnIndex(
				columnIndex
			);
			const searchProperty = window.currentSearchMode.currQryItem.dom.selectSingleNode(
				propXpath
			);
			const previousSearchValue = searchProperty?.text || '';
			const currentSearchValue =
				head.get(changedCellHeadId, 'searchValue') || '';
			if (previousSearchValue === currentSearchValue) {
				continue;
			}

			head.set(headId, '', 'searchValue');
			window.applyCellEditCommon.call(grid, 'input_row', headId);
		}
	},

	setDefaultFrozenColumns() {
		this.defaultFrozenColumns = 1;
	},

	setFrozenColumns() {
		if (this.grid.view.defaultSettings.freezableColumns) {
			const frozenColumns = aras.getItemProperty(
				this.options.userPreferences,
				'frozen_columns',
				this.defaultFrozenColumns
			);
			this.grid.settings.frozenColumns = parseInt(frozenColumns);
		}
	},

	isPropertyRestricted(itemId, headId) {
		const { head, rows } = this.grid;
		const propertyName = head.get(headId, 'name') || headId;
		return rows.get(itemId, `${propertyName}@aras.restricted`);
	},

	getCellType(result, headId, itemId, value, type, rowId) {
		if (headId !== 'L' && this.isPropertyRestricted(itemId, headId, rowId)) {
			return 'restricted';
		}

		return this.grid.head.get(headId, 'dataType');
	},

	getCustomStyles(headId, itemId, rowStyles) {
		const { head } = this.grid;
		const propertyName = head.get(headId, 'name') || headId;
		const cellStyles = {
			'background-color': 'transparent'
		};

		return Object.assign(cellStyles, rowStyles.get(propertyName) || {});
	},

	getCellStyles(result, headId, itemId) {
		const { rows } = this.grid;
		const styleString =
			(rows.get(itemId, 'fed_css') || '') + (rows.get(itemId, 'css') || '');
		const rowStyles =
			this.cachedRowStyles.get(styleString) || parseCssString(styleString);
		this.cachedRowStyles.set(styleString, rowStyles);

		return this.getCustomStyles(headId, itemId, rowStyles);
	},

	getFilteredList(headId, list) {
		const { head, settings } = this.grid;
		const propertyName = head.get(headId, 'pattern');
		const propertyColumnName = settings.indexHead.find((columnName) =>
			columnName.startsWith(propertyName)
		);
		const filterValue = head.get(propertyColumnName, 'searchValue') || '';
		this.resetFilterListValueIfNeed(propertyColumnName);
		if (filterValue) {
			return list.filter((option) => option.filter === filterValue);
		}

		return list;
	},

	getMetadataHeadList(headInfo, type) {
		const { metadata } = this.gridHeaderInfo;
		let list = metadata.headLists[headInfo.dataSource] || [];
		if (type === 'classification') {
			list = metadata.classStructure.get(metadata.itemTypeName);
		}
		return list;
	},

	getCellMetadata(result, headId, itemId, type) {
		const { head, rows, settings } = this.grid;
		const { gridWrapper, getPropsOfLayout } = this.options;
		const headInfo = head._store.get(headId);
		const defaultPattern = type === 'date' ? 'short_date' : '';
		const pattern = headInfo.pattern || defaultPattern;
		let metadataList = this.getMetadataHeadList(headInfo, type);
		if (itemId === 'searchRow' && headInfo.dataType === 'filter list') {
			metadataList = this.getFilteredList(headId, metadataList);
		}
		return {
			list: metadataList,
			lifeCycleStates: this.gridHeaderInfo.metadata.lifeCycleStates,
			currentUserId: this.currentUserId,
			format: itemId === 'searchRow' ? defaultPattern : pattern,
			itemType: headInfo.dataSourceName,
			scale: headInfo.scale,
			precision: headInfo.precision,
			maxLength: headInfo.maxLength,
			propsOfLayout: getPropsOfLayout(),
			loadFileHandler: async () => {
				const parentRowId = settings.focusedCell.rowId;
				const file = await aras.vault.selectFile();
				const selectedFile = aras.newItem('File', file);

				if (selectedFile) {
					aras.itemsCache.addItem(selectedFile);

					const cellName = head.get(headId, 'name');
					const itemFileJson = ArasModules.xmlToODataJson(selectedFile);
					const currentRow = rows._store.get(itemId);

					currentRow[cellName] = itemFileJson.id;
					currentRow[cellName + '@aras.action'] = itemFileJson['@aras.action'];
					currentRow[cellName + '@aras.keyed_name'] = itemFileJson.filename;

					rows._store.set(itemId, currentRow);

					window.onWidgetApplyEdit(parentRowId, headId, selectedFile);
				}
			},
			openManagerFileDialog: (fileId) => {
				gridWrapper.fileManager.open(
					headId,
					this.getRowDataId(itemId, headId),
					fileId
				);
			},
			editorClickHandler: () => {
				const rowId = settings.focusedCell.rowId;
				gridWrapper._grid.cancelEdit();
				gridWrapper.onInputHelperShow_Experimental(rowId, headInfo.layoutIndex);
			},
			handler: () => {
				gridWrapper.onInputHelperShow_Experimental(
					itemId,
					headInfo.layoutIndex
				);
			}
		};
	},

	getFileEditAvailability(rowId) {
		const { gridWrapper } = this.options;
		return gridWrapper.isEditable();
	},

	checkEditAvailability(result, headId, rowId) {
		const { head, rows } = this.grid;

		if (head.get(headId, 'dataType') === 'file') {
			return this.getFileEditAvailability(rowId, headId);
		}

		if (
			headId === 'L' ||
			head.get(headId, 'isForeign') ||
			head.get(headId, 'isReadOnly')
		) {
			return false;
		}

		const itemAction = rows.get(rowId, '@aras.action');
		if (itemAction === 'delete' || itemAction === 'purge') {
			return false;
		}

		return true;
	},

	getRowDataId(rowId) {
		return rowId;
	},

	getKeyDownHandler() {
		const { gridWrapper } = this.options;

		return (headId, rowId, event) => {
			const dataType = this.grid.head.get(headId, 'dataType');
			const availabelKey = ['F2', 'Enter', 'NumpadEnter'];

			if (dataType !== 'file' || !availabelKey.includes(event.code)) {
				return;
			}

			const metadata = this.grid.getCellMetadata(headId, rowId);
			const propName = this.grid.head.get(headId, 'name');
			const dataId = this.getRowDataId(rowId, headId);
			const fileId = this.grid.rows.get(dataId, propName);

			if (!fileId) {
				metadata.loadFileHandler();
				return;
			}

			switch (event.code) {
				case 'F2': {
					metadata.openManagerFileDialog(fileId);
					break;
				}
				case 'Enter':
				case 'NumpadEnter': {
					const isAdd =
						this.grid.rows.get(dataId, `${propName}@aras.action`) === 'add';
					if (fileId && !isAdd) {
						const link = `'File','${fileId}'`;
						gridWrapper.gridLinkClick(link);
					}
					break;
				}
			}
		};
	},

	gridLinkClick(headId, rowId, event) {
		const { rows, head } = this.grid;
		let rowInfo = rows._store.get(rowId);
		const headInfo = head._store.get(headId);
		if (headInfo.linkProperty) {
			rowInfo = rows._store.get(rowInfo[headInfo.linkProperty]) || {};
		}
		const propertyName = headInfo.name || headId;
		let action = rowInfo.id || rowInfo.uniqueId;
		let link = '';
		const currentProperty = rowInfo[propertyName];
		if (
			currentProperty &&
			rowInfo[propertyName + '@aras.discover_only'] !== '1'
		) {
			const dataSourceName = headInfo.dataSourceName;
			const isFile = dataSourceName === 'File';
			const typeOfLists = ['list', 'filter list', 'color list', 'mv_list'];

			if (typeOfLists.includes(headInfo.dataType)) {
				link = "'List',";
			} else if (headInfo.dataType === 'sequence') {
				link = "'Sequence',";
			} else {
				link =
					"'" + (dataSourceName || rowInfo[propertyName + '@aras.type']) + "',";
			}

			action = isFile ? rowInfo[propertyName + '@aras.action'] : action;
			link += "'" + currentProperty + "'";
		}

		const { gridLinkClick, fileManager } = this.options.gridWrapper;
		if (
			event.target.classList &&
			event.target.classList.contains('aras-grid-link') &&
			action !== 'add'
		) {
			gridLinkClick(link, event.ctrlKey || event.metaKey);
		}
		if (
			event.target.closest('.aras-grid-file-icon') &&
			!event.target.closest('.aras-grid-file-icon_select-file')
		) {
			const fileId = link.replace(/'/g, '').split(',')[1];
			fileManager.open(headId, rowInfo.id, fileId);
		}
	},

	async sort() {
		const { head, settings } = this.grid;
		if (window.aras.getVariable('SortPages') === 'true') {
			const currentSearchMode = window.currentSearchMode;
			// set new orderBy statement into currentSearchMode
			// to synchronize ordering of search item with grid ordering
			currentSearchMode.setSortOrderByGridInfo(head, settings.orderBy);

			// run search
			// search results will be output to grid with correct ordering
			currentSearchMode.searchContainer.runSearch();

			return;
		}

		return await this.grid._sort(settings.indexRows);
	}
};

export default itemTypeGridPlugin;
