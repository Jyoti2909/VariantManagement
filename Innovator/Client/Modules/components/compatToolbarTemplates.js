import SvgManager from '../core/SvgManager';

const TOOLBAR_CLASS = 'aras-compat-toolbar';
const TOOLBAR_LABELED_CLASS = 'aras-compat-toolbar_labeled';
const CONTENT_CLASS = 'aras-compat-toolbar__content';
const CONTAINER_CLASS = 'aras-compat-toolbar__container';
const DROPDOWN_CLASS = 'aras-compat-toolbar__dropdown';
const DROPDOWN_BUTTON_CLASS =
	'aras-compat-toolbar__dropdown-button aras-icon-arrow aras-icon-arrow_down';
const DROPDOWN_LIST_CONTAINER_CLASS = 'aras-dropdown';
const DROPDOWN_OPENED_LIST_CONTAINER_CLASS = 'aras-dropdown_opened';
const DROPDOWN_LIST_CLASS = 'aras-list';

const BUTTON_CLASS = 'aras-compat-toolbar__button';
const SEPARATOR_CLASS = 'aras-compat-toolbar__separator';
const FORM_CLASS = 'aras-compat-toolbar__form aras-form';
const DATE_CLASS = 'aras-form-date';
const SINGULAR_CLASS = 'aras-form-singular';
const DISABLED_CLASS = 'aras-compat-toolbar_disabled';
const HIDDEN_CLASS = 'aras-hide';

let toolbarFormatters;

const defaultTemplates = {
	root: function (data) {
		const templatesObj = this;
		const leftContainerItems = this.items(
			data.leftContainerItems || [],
			templatesObj,
			data.options,
			data.toolbar
		);
		const rightContainerItems = this.items(
			data.rightContainerItems || [],
			templatesObj,
			data.options,
			data.toolbar
		);
		const dropdownItems = this.items(
			data.dropdownItems || [],
			templatesObj,
			data.options,
			data.toolbar
		);
		let dropdownNode;
		if (dropdownItems.length > 0) {
			const DropdownNode = this.dropdownNode;
			dropdownNode = (
				<DropdownNode items={dropdownItems} options={data.options} />
			);
		}

		const toolbarNodeClass = data.options.isToolbarLabeled
			? TOOLBAR_CLASS + ' ' + TOOLBAR_LABELED_CLASS
			: TOOLBAR_CLASS;
		return (
			<div className={toolbarNodeClass}>
				<div className={CONTENT_CLASS}>
					<div className={CONTAINER_CLASS}>{leftContainerItems}</div>
					<div className={CONTAINER_CLASS}>{rightContainerItems}</div>
				</div>
				{dropdownNode}
			</div>
		);
	},
	items: function (items, itemTemplates, options, toolbar) {
		const itemNodes = items.map(function (item) {
			item = toolbar.data.get(item);
			const ItemConstructor = toolbarFormatters[item.type];
			return (
				<ItemConstructor
					toolbar={toolbar}
					item={item}
					forceUpdate={options.forceUpdateItems}
					itemRefCallback={options.itemRefCallback}
					ref={{ ...lifecycle }}
				/>
			);
		});
		return itemNodes;
	},
	dropdownNode: function (data) {
		const items = data.items;
		const options = data.options;
		let buttonClass = DROPDOWN_BUTTON_CLASS;
		if (!items || !items.length) {
			buttonClass += ' ' + HIDDEN_CLASS;
		}

		const dropdownItemsNodes = items.map(function (item) {
			return (
				<li
					className="aras-list-item"
					data-id={item.props.item.id}
					key={item.props.item.id}
				>
					{item}
				</li>
			);
		});
		const listContainerClass = options.forceOpenDropdown
			? DROPDOWN_LIST_CONTAINER_CLASS +
			  ' ' +
			  DROPDOWN_OPENED_LIST_CONTAINER_CLASS
			: DROPDOWN_LIST_CONTAINER_CLASS;

		return (
			<aras-dropdown className={DROPDOWN_CLASS} position="bottom-right">
				<div className={buttonClass} dropdown-button="" />
				<div className={listContainerClass} style={options.dropdownStyle || ''}>
					<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
				</div>
			</aras-dropdown>
		);
	}
};

const lifecycle = {
	onComponentShouldUpdate: function (lastProps, nextProps) {
		if (lastProps.item.type === 'separator') {
			return false;
		}

		const needToUpdate = lastProps.item !== nextProps.item;
		if (needToUpdate) {
			const itemNode = lastProps.toolbar._nodesInfo.get(lastProps.item);
			nextProps.toolbar._nodesInfo.set(nextProps.item, itemNode);
		}
		return nextProps.forceUpdate || needToUpdate;
	},
	onComponentDidUpdate: function (lastProps, nextProps) {
		if (nextProps.forceUpdate) {
			const itemNode = lastProps.toolbar._nodesInfo.get(lastProps.item);
			itemNode.width = itemNode.node.clientWidth;
			nextProps.toolbar._nodesInfo.set(nextProps.item, itemNode);
		}
	},
	onComponentDidMount: function (domNode, props) {
		const item = props.item;
		const toolbar = props.toolbar;
		if (!item || item.type === 'separator') {
			return;
		}
		if (toolbar._nodesInfo.has(item)) {
			const nodeInfo = toolbar._nodesInfo.get(item);
			nodeInfo.node = domNode;
			if (props.forceUpdate) {
				nodeInfo.width = domNode.clientWidth;
			}
		} else {
			toolbar._nodesInfo.set(item, {
				node: domNode,
				width: domNode.clientWidth
			});
		}
	}
};

const defaultFormatters = {
	button: function (data) {
		const iconNode = SvgManager.createInfernoVNode(data.item.image);

		const toggleButtonClick = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, { state: !data.item.state })
			);
			data.toolbar.render();
		};
		let nodeClass = data.item.disabled
			? BUTTON_CLASS + ' ' + DISABLED_CLASS
			: BUTTON_CLASS;
		nodeClass += data.item.state ? ' aras-compat-toolbar__toggle-button' : '';
		return (
			<span
				className={nodeClass}
				onclick={data.item.state !== null ? toggleButtonClick : null}
				title={data.item.tooltip}
				data-id={data.item.id}
			>
				{iconNode}
			</span>
		);
	},
	separator: function (data) {
		return <span className={SEPARATOR_CLASS} />;
	},
	select: function (data) {
		const changeHandler = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, { value: event.target.value })
			);
			data.toolbar.render();
		};
		const optionNodes = data.item.options.map(function (option) {
			return (
				<option
					selected={data.item.value === option.value}
					value={option.value}
				>
					{option.label}
				</option>
			);
		});

		return (
			<span className={FORM_CLASS} data-id={data.item.id}>
				<span className="aras-compat-toolbar-component__label">
					{data.item.label}
				</span>
				<select
					onChange={changeHandler}
					title={data.item.tooltip}
					disabled={data.item.disabled}
				>
					{optionNodes}
				</select>
			</span>
		);
	},
	date: function (data) {
		const changeHandler = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, { value: event.target.value })
			);
			data.toolbar.render();
		};
		const style = data.item.size ? { width: data.item.size + 'rem' } : {};
		const nodeClass = data.item.disabled
			? FORM_CLASS + ' ' + DISABLED_CLASS
			: FORM_CLASS;
		return (
			<span className={nodeClass} data-id={data.item.id}>
				<span className={DATE_CLASS}>
					<input
						type="text"
						onInput={changeHandler}
						defaultValue={data.item.value}
						disabled={data.item.disabled}
						style={style}
					/>
					<span />
				</span>
			</span>
		);
	},
	singular: function (data) {
		const changeHandler = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, { value: event.target.value })
			);
			data.toolbar.render();
		};
		const nodeClass = data.item.disabled
			? FORM_CLASS + ' ' + DISABLED_CLASS
			: FORM_CLASS;

		return (
			<span
				className={nodeClass}
				data-id={data.item.id}
				title={data.item.tooltip}
			>
				<span className={SINGULAR_CLASS}>
					<input
						type="text"
						onInput={changeHandler}
						defaultValue={data.item.value}
						disabled={data.item.disabled}
					/>
					<span />
				</span>
			</span>
		);
	},
	textbox: function (data) {
		const item = data.item;
		const changeHandler = function (event) {
			const id = item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, item, { value: event.target.value })
			);
			data.toolbar.render();
		};
		const style = data.item.size ? { width: data.item.size + 'rem' } : {};
		const nodeClass = 'aras-form aras-compat-toolbar__textbox';
		return (
			<span className={nodeClass} data-id={data.item.id}>
				<span className="aras-compat-toolbar-component__label">
					{data.item.label}
				</span>
				<input
					type="text"
					autoComplete="off"
					value={data.item.value}
					title={data.item.tooltip}
					disabled={data.item.disabled}
					onInput={changeHandler}
					style={style}
				/>
			</span>
		);
	},
	dropdownSelector: function (data) {
		const itemClickHandler = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, {
					value: event.currentTarget.dataset.value
				})
			);
			const evt = new CustomEvent('change', { bubbles: true });
			event.currentTarget.dispatchEvent(evt);
			data.toolbar._doUpdateNodesInfo = true;
			data.toolbar.render();
		};
		const keys = Object.keys(data.item.options);
		const itemOptions = data.item.options;
		const checkedItemValue = itemOptions[data.item.value];
		const dropdownItemsNodes = (keys || []).map(function (key) {
			const itemValue = itemOptions[key];
			const iconClass =
				'aras-list-item__icon' +
				(itemValue === checkedItemValue ? ' aras-icon-radio' : '');
			return (
				<li
					className="aras-list-item aras-list-item_iconed"
					onclick={itemClickHandler}
					data-value={key}
				>
					<div className={iconClass} />
					<span className="aras-list__item-value">{itemValue}</span>
				</li>
			);
		});

		const nodeClass = 'aras-compat-toolbar__dropdown-selector';
		return (
			<span
				className={nodeClass}
				data-id={data.item.id}
				title={data.item.tooltip}
			>
				<span className="dropdown-selector__label-wrapper">
					<span>{data.item.text}</span>
					{data.item.value}
				</span>
				<div className={DROPDOWN_CLASS}>
					<span className={DROPDOWN_BUTTON_CLASS} tabindex={0} />
					<div
						className={DROPDOWN_LIST_CONTAINER_CLASS}
						style={data.dropdownStyle || ''}
					>
						<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
					</div>
				</div>
			</span>
		);
	},
	htmlSelector: function (data) {
		const itemClickHandler = function (event) {
			const id = data.item.id;
			data.toolbar.data.set(
				id,
				Object.assign({}, data.item, {
					value: event.currentTarget.dataset.value
				})
			);
			const evt = new CustomEvent('change', { bubbles: true });
			event.currentTarget
				.closest('.aras-compat-toolbar__html-selector')
				.dispatchEvent(evt);
			data.toolbar.render();
		};

		const selectedItemValue = data.item.value;
		let selectedItemLabel = '';
		const dropdownItemsNodes = data.item.options.map(function (option) {
			if (option.type === 'separator') {
				return <li className="separator" />;
			}

			const itemLabel = option.label;
			const itemValue = option.value;
			selectedItemLabel =
				itemValue === selectedItemValue ? itemLabel : selectedItemLabel;

			return (
				<li
					className="aras-list-item"
					onclick={itemClickHandler}
					data-value={itemValue}
				>
					{itemLabel}
				</li>
			);
		});

		const nodeClass = 'aras-compat-toolbar__html-selector';
		return (
			<span className={nodeClass} data-id={data.item.id}>
				<span className="aras-compat-toolbar-component__label">
					{data.item.label}
				</span>
				<span
					className="aras-compat-toolbar__html-selector__wrapper"
					title={data.item.tooltip}
				>
					<div className={DROPDOWN_CLASS} tabindex={0}>
						<span className="html-selector__label-wrapper">
							{selectedItemLabel}
						</span>
						<span className={DROPDOWN_BUTTON_CLASS} />
					</div>
					<div
						className={DROPDOWN_LIST_CONTAINER_CLASS}
						style={data.dropdownStyle || ''}
					>
						<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
					</div>
				</span>
			</span>
		);
	},
	dropdownButton: function (data) {
		const itemClickHandler = function (event) {
			const evt = new CustomEvent('dropDownItemClick', {
				bubbles: true,
				detail: { optionId: event.currentTarget.dataset.optionid }
			});
			event.currentTarget.dispatchEvent(evt);
		};

		const dropdownItemsNodes = data.item.options.map((option) => {
			return (
				<li
					className="aras-list-item"
					onclick={itemClickHandler}
					data-optionid={option.value}
				>
					{option.label}
				</li>
			);
		});

		return (
			<span
				className="aras-compat-toolbar__action-dropdown-button"
				data-id={data.item.id}
			>
				<div className={DROPDOWN_CLASS} tabindex={0}>
					<span className="action-dropdown-button__label-wrapper">
						{data.item.text}
					</span>
					<span className={DROPDOWN_BUTTON_CLASS} />
				</div>
				<div
					className={DROPDOWN_LIST_CONTAINER_CLASS}
					style={data.dropdownStyle || ''}
				>
					<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
				</div>
			</span>
		);
	}
};

toolbarFormatters = defaultFormatters;
const toolbarTemplates = function (customTemplates) {
	toolbarFormatters = Object.assign(toolbarFormatters, customTemplates || {});
	return Object.assign({}, defaultTemplates, customTemplates || {});
};

export { toolbarTemplates, toolbarFormatters };
