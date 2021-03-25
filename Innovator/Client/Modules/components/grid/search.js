import utils from '../../core/utils';

const GridSearch = {
	text: function (head, headId, value, grid, metadata) {
		return {
			children: [
				{
					tag: 'input',
					className: 'aras-form-input',
					events: {
						oninput: function (e) {
							const index = e.target.closest('.aras-grid-search-row-cell')
								.dataset.index;
							const headId = grid.settings.indexHead[index];
							grid.head.set(headId, e.target.value, 'searchValue');
							grid.dom.dispatchEvent(new CustomEvent('filter'));
						},
						onfocus: function () {
							grid.settings.focusedCell = {
								headId: headId,
								rowId: 'searchRow'
							};
						},
						onkeydown: function (e) {
							if (e.key === 'F2' && metadata && metadata.handler) {
								metadata.handler();
							}
						}
					},
					attrs: {
						type: 'text'
					},
					ref: function (dom) {
						if (!dom || dom.value === value) {
							return;
						}
						dom.value = value;
					}
				}
			]
		};
	},
	disabled: function (head, headId, value, grid, metadata) {
		return {
			children: [
				{
					tag: 'input',
					className: 'aras-form-input',
					attrs: {
						type: 'text',
						disabled: true,
						value: value
					}
				}
			]
		};
	},
	dropDownIcon: function (head, headId, value, grid) {
		let icon = '';
		const currentValue = head.searchValue;
		const roots = [];
		const data = new Map();

		for (const item of head.options) {
			if (!icon && item.value === currentValue) {
				icon = item.icon;
			}

			roots.push(item.label);
			data.set(item.label, item);
		}

		const className = `aras-grid-dropdown-icon__button ${
			currentValue ? '' : 'aras-icon-arrow aras-icon-arrow_down'
		}`;
		const buttonIconElement = ArasModules.SvgManager.createInfernoVNode(icon);

		return {
			children: [
				<aras-dropdown className="aras-grid-dropdown-icon" closeonclick="">
					<span
						className={className}
						tabindex="0"
						dropdown-button=""
						role="button"
						aria-label={aras.getResource(
							'',
							'itemsgrid.claimed_by_dropdown_button'
						)}
						aria-haspopup="menu"
					>
						{buttonIconElement}
					</span>
					<aras-menu
						className="aras-dropdown"
						ref={(node) => {
							if (node && !node.state.roots.length) {
								node.on('click', (id) => {
									const searchValue = node.state.data.get(id).value;
									grid.head.set(headId, searchValue, 'searchValue');
								});
								node.applyData(data, roots);
							}
						}}
					/>
				</aras-dropdown>
			]
		};
	},
	date: function (head, headId, value, grid, metadata) {
		const pattern = aras.getDotNetDatePattern('short_date');
		if (head.searchValue === null) {
			value = head.invalidValue;
		} else {
			value = aras.convertFromNeutral(value, 'date', pattern);
			head.invalidValue = '';
		}
		const invalid = head.invalidValue ? ' aras-form-input_invalid' : '';
		return {
			className: 'aras-form',
			children: [
				{
					tag: 'div',
					className: 'aras-form-date' + invalid,
					children: [
						{
							tag: 'input',
							className: 'aras-form-calendar',
							attrs: {
								type: 'text'
							},
							ref: function (dom) {
								if (!dom || dom.value === value) {
									return;
								}
								dom.value = value;
							},
							events: {
								onfocus: function () {
									grid.settings.focusedCell = {
										headId: headId,
										rowId: 'searchRow'
									};
								},
								onkeydown: function (e) {
									if (e.key === 'F2') {
										metadata.handler();
									}
								},
								oninput: function (e) {
									const index = e.target.closest('.aras-grid-search-row-cell')
										.dataset.index;
									const headId = grid.settings.indexHead[index];
									const value = e.target.value;
									const win = aras.getMostTopWindowWithAras();
									const aml = win.ArasCore.searchConverter.simpleToAml(
										value,
										headId,
										{ type: 'date' }
									);
									const head = grid.head.get(headId);
									const searchValue = aml ? value : null;
									const invalidValue = aml ? '' : value;
									const updates = { searchValue, invalidValue };
									grid.head.set(headId, Object.assign(head, updates));
								}
							}
						},
						{
							tag: 'span',
							className: 'aras-filter-list-icon aras-icon-error'
						},
						{
							tag: 'span',
							events: {
								onmousedown: function (e) {
									metadata.handler();
									e.stopPropagation();
								}
							}
						}
					]
				}
			]
		};
	},
	singular: function (head, headId, value, grid, metadata) {
		if (!head.componentData) {
			head.componentData = {
				ref: function (dom) {
					if (!dom) {
						delete head.componentData;
						return;
					}

					dom.setState({
						itemType: metadata.itemType,
						value: head.searchValue
					});

					const originKeydown = dom._onKeyDownHandler.bind(dom);
					dom._onKeyDownHandler = function (e) {
						if (e.key === 'F2') {
							metadata.handler();
						}
						originKeydown(e);
					};
				}
			};
		}

		return {
			children: [
				{
					tag: 'aras-item-property',
					ref: head.componentData.ref,
					events: {
						onchange: function () {
							head.searchValue = this.state.value;
						},
						oninput: function () {
							head.searchValue = this.state.value;
						},
						onclick: function (e) {
							if (e.target.closest('.aras-filter-list__button')) {
								metadata.handler();
								e.stopPropagation();
							}
						}
					},
					attrs: {
						value: head.searchValue
					}
				}
			]
		};
	},
	filterList: function (head, headId, value, grid, { list = [] }) {
		const isEmptyExist = list.some(
			(item) => item.value === '' && item.label === ''
		);
		list = isEmptyExist
			? list
			: [
					{
						value: '',
						label: ''
					},
					...list
			  ];

		const store = grid.head._store;
		const props = {
			tag: 'aras-filter-list',
			state: {
				list,
				value: head.searchValue
			},
			props: {
				onchange: function () {
					const head = store.get(headId);
					head.searchValue = this.state.value;
					head.inputLabel = null;
				},
				oninput: function () {
					const head = store.get(headId);
					if (this.inputValidate()) {
						head.searchValue = this.state.value;
					} else {
						head.searchValue = null;
						head.inputLabel = this.state.label;
					}
				}
			}
		};

		return {
			children: [
				utils.createWebComponentFunction(props, (domNode) =>
					domNode.setState(props.state)
				)
			]
		};
	},
	classification: function (head, headId, value, grid, metadata) {
		let comp = head.componentData;
		if (!comp || comp.type !== 'classification') {
			Object.defineProperty(head, 'searchValue', {
				get: function () {
					const comp = this.componentData;
					return comp.value || comp.label;
				},
				set: function (newValue) {
					const comp = this.componentData;
					if (!newValue || newValue.indexOf('/') > -1) {
						comp.value = newValue;
						comp.label = null;
					} else {
						comp.value = null;
						comp.label = newValue;
					}
				},
				configurable: true
			});
			comp = {
				label: null,
				value: null,
				type: 'classification'
			};
			head.componentData = comp;
			head.searchValue = value;
		}

		if (!comp.ref) {
			comp.ref = function (dom) {
				if (!dom) {
					delete comp.ref;
					return;
				}

				dom.setState({
					list: metadata.list,
					value: comp.value,
					label: comp.label
				});
			};
		}

		return {
			children: [
				{
					tag: 'aras-classification-property',
					ref: comp.ref,
					events: {
						onchange: function () {
							comp.value = this.state.value;
							comp.label = this.state.label;
						},
						oninput: function () {
							if (this.inputValidate()) {
								comp.value = this.state.value;
								comp.label = null;
							} else {
								comp.value = null;
								comp.label = this.state.label;
							}
						},
						onkeydown: function (e) {
							if (e.key === 'F2') {
								metadata.handler();
							}
						},
						onclick: function (e) {
							if (e.target.closest('.aras-filter-list__button')) {
								metadata.handler();
							}
						}
					},
					attrs: {
						value: comp.value,
						label: comp.label
					}
				}
			]
		};
	},
	multiValueList: function (head, headId, value, grid, metadata) {
		const items = (metadata.list || []).map(function (item) {
			return {
				tag: 'li',
				className: 'aras-list-item aras-list-item_shown',
				attrs: {
					'data-value': item.value
				},
				children: [
					{
						tag: 'label',
						className: 'aras-form-boolean',
						children: [
							{
								tag: 'input',
								attrs: {
									type: 'checkbox',
									checked:
										head.searchValue.indexOf(item.value) > -1 ? true : false
								}
							},
							{
								tag: 'span'
							},
							item.label
						]
					}
				]
			};
		});

		return {
			children: [
				{
					tag: 'aras-dropdown',
					className:
						'aras-filter-list aras-dropdown-container aras-grid-multi-list',
					attrs: {
						position: 'bottom-left'
					},
					children: [
						{
							tag: 'span',
							className: 'aras-filter-list__input aras-form-input',
							children: [
								aras.getResource(
									'',
									'common.options_select',
									head.searchValue.length
								)
							]
						},
						{
							tag: 'button',
							attrs: {
								'dropdown-button': ''
							},
							className:
								'aras-filter-list__button aras-btn aras-icon-arrow aras-icon-arrow_down'
						},
						{
							tag: 'div',
							className: 'aras-filter-list__dropdown aras-dropdown',
							style: '',
							children: [
								{
									tag: 'ul',
									className: 'aras-list',
									children: items,
									events: {
										onclick: function (event) {
											const listNode = event.target.closest('.aras-list-item');
											if (!listNode) {
												return;
											}

											const clickValue = listNode.dataset.value;
											const indexInCheckedList = this.head.searchValue.indexOf(
												clickValue
											);

											if (indexInCheckedList === -1) {
												this.head.searchValue.push(clickValue);
											} else {
												this.head.searchValue.splice(indexInCheckedList, 1);
											}
											event.preventDefault();
											this.grid.render();
										}.bind({ head: head, grid: grid })
									}
								}
							]
						}
					]
				}
			]
		};
	}
};

export default GridSearch;
