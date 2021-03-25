const propertiesPlugin = {
	init() {
		this.dateFormatsList = null;
		this.dateListNodes = null;
	},
	events: [
		{
			type: 'click',
			element: 'cell',
			name: 'gridLink',
			method(payload) {
				this.gridLinkClick(payload);
			}
		}
	],
	getCellMetadata: function (cellMetaData, headId, rowId) {
		const head = this.grid.head;
		const rows = this.grid.rows;

		let resultList;
		const dataTypePropertyValue = rows.get(rowId, 'data_type');
		const propertyName = head.get(headId, 'name');
		if (
			propertyName !== 'pattern' ||
			(dataTypePropertyValue !== 'date' &&
				dataTypePropertyValue !== 'filter list')
		) {
			return cellMetaData;
		}

		if (dataTypePropertyValue === 'date') {
			this.dateFormatsList =
				this.dateFormatsList ||
				aras.getItem(
					'List',
					'name="DateFormats"',
					'<name>DateFormats</name>',
					1
				);
			if (!this.dateFormatsList) {
				return cellMetaData;
			}

			this.dateListNodes =
				this.dateListNodes ||
				Array.from(
					this.dateFormatsList.selectNodes("Relationships/Item[@type='Value']")
				);
			resultList = this.dateListNodes.map(function (listNode) {
				return {
					value: aras.getItemProperty(listNode, 'value'),
					label: aras.getItemProperty(listNode, 'label')
				};
			});

			const currentPatternValue = rows.get(rowId, 'pattern');
			if (currentPatternValue) {
				const isExistValue = resultList.some(function (listInfo) {
					return listInfo.value === currentPatternValue;
				});
				if (!isExistValue) {
					resultList.push({
						value: currentPatternValue,
						label: currentPatternValue
					});
				}
			}
		} else {
			const properties = Array.from(
				window.item.selectNodes(
					'Relationships/Item[@type="Property" and (not(@action) or (@action!="delete" and @action!="purge"))]'
				)
			);
			resultList = properties.map(function (propertyNode) {
				const propertyName = aras.getItemProperty(propertyNode, 'name');
				return {
					value: propertyName,
					label: propertyName
				};
			});
			resultList.sort(function (listA, listB) {
				const labelA = listA.label;
				const labelB = listB.label;

				if (labelA === labelB) {
					return 0;
				}

				return labelA > labelB ? 1 : -1;
			});
		}

		return Object.assign(cellMetaData, {
			list: resultList
		});
	},
	getCellType: function (result, headId, rowId) {
		const head = this.grid.head;
		const rows = this.grid.rows;
		const propertyName = head.get(headId, 'name');

		if (propertyName === 'pattern') {
			const dataTypePropertyValue = rows.get(rowId, 'data_type');
			if (
				dataTypePropertyValue === 'date' ||
				dataTypePropertyValue === 'filter list'
			) {
				return 'list';
			}
		}

		return result;
	},
	gridLinkClick: function (payload) {
		const [headId, rowId, event] = payload.data;
		if (!event.target.classList.contains('aras-grid-link')) {
			return;
		}

		const headName = this.grid.head.get(headId, 'name');
		const dataType = this.grid.rows.get(rowId, 'data_type');
		const rowInfo = this.grid.rows.get(rowId);

		const propertyName = headName || headId;
		const currentProperty = rowInfo[propertyName];
		const { gridWrapper } = this.options;
		const typeOfLists = ['list', 'filter list', 'color list', 'mv_list'];
		let link = '';

		const linkClick = function () {
			link += "'" + currentProperty + "'";
			gridWrapper.gridLinkClick(link, event.ctrlKey || event.metaKey);
			payload.break();
		};

		if (headName === 'data_source' && currentProperty) {
			if (typeOfLists.includes(dataType)) {
				link = "'List',";
				linkClick();
			}

			if (dataType === 'sequence') {
				link = "'Sequence',";
				linkClick();
			}
		}
	}
};

export default propertiesPlugin;
