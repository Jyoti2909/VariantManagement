import gridFormatters from './formatters';
import intl from '../../core/intl';
import SvgManager from '../../core/SvgManager';

const icons = {
	blocked: '../images/Blocked.svg',
	claimed: '../images/ClaimOn.svg',
	claimOther: '../images/ClaimOther.svg',
	edit: '../images/Edit.svg',
	fileProperty: '../images/FileProperty.svg',
	filePropertyUnsaved: '../images/FilePropertyUnsaved.svg',
	new: '../images/New.svg',
	nullRelated: '../images/NullRelated.svg',
	upload: '../images/Upload.svg'
};

SvgManager.enqueue(Object.values(icons));

let RESTRICTED_RESOURCE;

const fileLink = (headId, rowId, value, grid, metadata) => {
	const svgNode = ArasModules.SvgManager.createInfernoVNode(icons.upload, {
		class: 'aras-grid-file-icon aras-grid-file-icon_select-file'
	});

	const linkTemplate = gridFormatters.link(
		headId,
		rowId,
		aras.getResource('', 'image_browser.select_file'),
		grid
	);

	return {
		attrs: {
			onClick: metadata.loadFileHandler
		},
		children: [svgNode, ...linkTemplate.children]
	};
};

const isModifideItem = (type, id, metadata) => {
	const propsOfLayout = metadata.propsOfLayout;
	if (!propsOfLayout) {
		return false;
	}
	const localChanges = propsOfLayout.localChanges;
	const itemChanges = localChanges[type]?.[id] || {};
	return Object.keys(itemChanges).length !== 0;
};

const dataTypeFormatters = {
	decimal(headId, rowId, value, grid, metadata) {
		return {
			children: [
				value || value === 0
					? intl.number.format(intl.number.parseFloat(value), {
							minimumFractionDigits: metadata.scale
					  })
					: ''
			]
		};
	},
	float(headId, rowId, value, grid) {
		return {
			children: [value || value === 0 ? intl.number.format(value) : '']
		};
	},
	file(headId, rowId, value, grid, metadata) {
		if (
			!value &&
			grid.view.defaultSettings.editable &&
			grid.checkEditAvailability(headId, rowId, grid)
		) {
			return fileLink(headId, rowId, value, grid, metadata);
		}

		if (!value) {
			return {};
		}

		const propertyName = grid.head.get(headId, 'name') || headId;
		const fileName =
			grid.rows.get(rowId, `${propertyName}@aras.keyed_name`) || value;

		if (grid.rows.get(rowId, `${propertyName}@aras.discover_only`) === '1') {
			return {
				children: [fileName]
			};
		}

		const isTemp =
			grid.rows.get(rowId, `${propertyName}@aras.action`) === 'add';
		const svgLink = isTemp ? icons.filePropertyUnsaved : icons.fileProperty;
		const svgNode = ArasModules.SvgManager.createInfernoVNode(svgLink);
		svgNode.className = 'aras-grid-file-icon';

		const linkTemplate = isTemp
			? {
					children: [<span>{fileName}</span>]
			  }
			: gridFormatters.link(headId, rowId, fileName, grid);

		linkTemplate.children.unshift(svgNode);
		return linkTemplate;
	},
	mv_list(headId, rowId, value, grid, metadata) {
		const resultString = value
			.split(',')
			.map((value) => {
				const foundElement = metadata.list.find(
					(listElement) => listElement.value === value
				);

				return foundElement ? foundElement.label : value;
			})
			.join(', ');

		return {
			children: [resultString]
		};
	},
	color(headId, rowId, value, grid) {
		return {
			style: value
				? {
						'background-color': value
				  }
				: {},
			children: null
		};
	},
	'color list'(headId, rowId, value, grid, metadata) {
		const list = gridFormatters.select(headId, rowId, value, grid, metadata);
		const color = gridFormatters.color(headId, rowId, value, grid);

		return {
			...color,
			...list
		};
	},
	date(headId, rowId, value, grid, metadata) {
		return {
			children: [
				aras.convertFromNeutral(
					value,
					'date',
					aras.getDateFormatByPattern(
						grid.head.get(headId, 'pattern') || 'short_date'
					)
				)
			]
		};
	},
	item(headId, rowId, value, grid) {
		if (!value) {
			return {};
		}

		const propertyName = grid.head.get(headId, 'name') || headId;
		const itemName =
			grid.rows.get(rowId, `${propertyName}@aras.keyed_name`) || value;

		if (
			grid.rows.get(rowId, `${propertyName}@aras.discover_only`) === '1' ||
			(grid.view.defaultSettings.editable && window.isEditMode)
		) {
			return {
				children: [itemName]
			};
		}

		return gridFormatters.link(headId, rowId, itemName, grid);
	},
	image(headId, rowId, value, grid) {
		const regExp = /\ssrc=(?:(?:'([^']*)')|(?:"([^"]*)")|([^\s]*))/i; // match src='a' OR src="a" OR src=a
		const srcMatches = value.match(regExp);
		value = srcMatches
			? srcMatches[1] || srcMatches[2] || srcMatches[3] || ''
			: value;
		return gridFormatters.img(headId, rowId, value, grid);
	},
	restricted(headId, rowId, value, grid) {
		if (!RESTRICTED_RESOURCE) {
			RESTRICTED_RESOURCE = aras.getResource(
				'',
				'common.restricted_property_warning'
			);
		}
		return {
			children: [RESTRICTED_RESOURCE],
			style: {
				color: '#ff0000'
			}
		};
	},
	md5(headId, rowId, value, grid) {
		return {
			children: ['***']
		};
	},
	'claim by'(headId, rowId, value, grid, metadata) {
		const rowInfo = grid.rows._store.get(rowId) || {};
		const isDiscoverOnly = rowInfo['@aras.discover_only'] === '1';
		const isTemp = rowInfo['@aras.isTemp'] === '1';
		const lockedById = value && typeof value === 'object' ? value.id : value;

		let icon = '';
		if (!grid.rows.has(rowId)) {
			icon = icons.nullRelated;
		} else if (isDiscoverOnly) {
			icon = icons.blocked;
		} else if (isTemp) {
			icon = icons.new;
		} else if (lockedById) {
			const lockedByUser = lockedById === metadata.currentUserId;
			if (lockedByUser) {
				const isModifide = isModifideItem(
					rowInfo['config_id@aras.type'],
					rowId,
					metadata
				);
				icon = isModifide ? icons.edit : icons.claimed;
			} else {
				icon = icons.claimOther;
			}
		}

		return gridFormatters.img(headId, rowId, icon, grid);
	},
	list: gridFormatters.select,
	'filter list': gridFormatters.select,
	current_state(headId, rowId, value, grid, metadata) {
		if (!value) {
			return {
				children: []
			};
		}
		const stateInfo = metadata.lifeCycleStates.get(value);
		const stateLabel =
			stateInfo?.label ||
			stateInfo?.name ||
			grid.rows.get(rowId, 'current_state@aras.keyed_name');

		return {
			children: [stateLabel]
		};
	}
};

export default dataTypeFormatters;
