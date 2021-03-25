import intl from '../core/intl';
import SvgManager from '../core/SvgManager';
import getResource from '../core/resources';

const icons = {
	calendar: '../images/InputCalendar.svg'
};

SvgManager.enqueue(Object.values(icons));

const TOOLBAR_CLASS = 'aras-toolbar';
const TOOLBAR_OVERFLOWED_CLASS = 'aras-toolbar_overflow_expanded';
const TOOLBAR_ITEM_CLASS = 'aras-toolbar__item';
const TOOLBAR_ITEM_HIDDEN_CLASS = 'aras-toolbar__item_hidden';
const DROPDOWN_CLASS = 'aras-toolbar__dropdown';
const DROPDOWN_BUTTON_CLASS =
	'aras-toolbar__dropdown-button aras-icon-arrow aras-icon-arrow_down';
const DROPDOWN_LIST_CONTAINER_CLASS = 'aras-dropdown';
const DROPDOWN_LIST_CLASS = 'aras-list';
const RIGHT_CONTAINER_CLASS = 'aras-toolbar__right-container';
const DIVIDER_CLASS = 'aras-toolbar__divider';

const ICON_CLASS = 'aras-icon';
const BUTTON_CLASS = 'aras-button';
const BUTTON_ICON_CLASS = 'aras-button__icon';
const SELECT_CLASS = 'aras-select';
const SELECT_CONTAINER_CLASS = 'aras-select__container';
const SEPARATOR_CLASS = 'aras-toolbar__separator';
const FORM_CLASS = 'aras-toolbar__form aras-form';
const SINGULAR_CLASS = 'aras-singular';
const SINGULAR_CONTAINER_CLASS = SINGULAR_CLASS + '__container';
const SINGULAR_BUTTON_CLASS = SINGULAR_CLASS + '__button';
const DISABLED_MODIFIER = '_disabled';
const CORPORATE_TIME_CLASS = 'aras-input aras-toolbar__corporate-time';
const TEXT_CLASS = 'aras-toolbar__text';
const IMAGE_CLASS = 'aras-toolbar__image';
const INPUT_CLASS = 'aras-input';
const INPUT_INVALID_CLASS = INPUT_CLASS + '_invalid';

const ItemConstructorWrapper = function ({ item, ...options }) {
	const node = options.formatter(item, options);
	node.props = {
		...item.attributes,
		...node.props
	};
	node.className = [
		TOOLBAR_ITEM_CLASS,
		options.isHidden ? TOOLBAR_ITEM_HIDDEN_CLASS : '',
		node.className,
		item.cssClass
	]
		.filter((className) => className)
		.join(' ');

	const itemStyle = item.cssStyle || '';
	if (typeof itemStyle === 'object') {
		node.props.style = {
			...itemStyle,
			order: options.flexOrder
		};
	} else {
		node.props.style = `order:${options.flexOrder}; ${itemStyle}`;
	}

	return node;
};

const defaultTemplates = {
	root: function (data) {
		const leftContainerItemsData = data.leftContainerItems || [];
		const leftContainerItems = this.items(
			leftContainerItemsData,
			data.options,
			data.toolbar
		);
		const rightContainerItems = this.items(
			data.rightContainerItems || [],
			data.options,
			data.toolbar,
			true
		);
		const rightContainerOrder =
			data.options.rightContainerOrder === undefined
				? leftContainerItemsData.length
				: data.options.rightContainerOrder;
		const isOverflowVisible = data.options.isOverflowVisible;
		const isOverflowAllowed = data.options.isOverflowAllowed;
		const isExpandButtonHidden =
			data.options.isExpandButtonHidden ||
			rightContainerOrder >= leftContainerItemsData.length - 1;
		let toolbarOverflowToggleButton = null;

		if (isOverflowAllowed) {
			const defaultClass = `${TOOLBAR_ITEM_CLASS} ${BUTTON_CLASS}`;
			const hiddenClass = isExpandButtonHidden ? TOOLBAR_ITEM_HIDDEN_CLASS : '';
			const overflowClass = isOverflowVisible
				? `${BUTTON_CLASS}_toggled-on`
				: '';
			const className = `${defaultClass} ${hiddenClass} ${overflowClass} ${TOOLBAR_CLASS}__expand-button`;
			const resourceKey = isOverflowVisible
				? 'toolbar.hide_overflow'
				: 'toolbar.show_overflow';
			const title = getResource(resourceKey);
			const isFocusNodeInOverflow = leftContainerItems.some(
				(item) => item.props.focused && item.props.isHidden
			);
			const tabIndex =
				data.options.isToolbarRole && !isFocusNodeInOverflow ? -1 : 0;
			// Safari and FF on MacOS doesn't focus button after click
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
			// Used <span> for fix it (+event keyup and role=button for accessibility)
			const attrs = {
				onclick: data.toolbar._toggleToolbarExpandState,
				onkeyup: function (e) {
					if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
						return;
					}
					if (['Space', 'Enter', 'NumpadEnter'].includes(e.code)) {
						this.click();
					}
				},
				className,
				title,
				tabIndex,
				role: 'button'
			};
			toolbarOverflowToggleButton = (
				<span {...attrs}>
					<span className={`${BUTTON_ICON_CLASS} ${ICON_CLASS}-expand`}></span>
				</span>
			);
		}

		return (
			<div
				className={`${TOOLBAR_CLASS} ${
					isOverflowVisible ? TOOLBAR_OVERFLOWED_CLASS : ''
				}`}
			>
				{[...leftContainerItems]}
				<div
					style={{ order: rightContainerOrder }}
					className={RIGHT_CONTAINER_CLASS}
					key="aras_toolbar_rightContainerNode"
				>
					{toolbarOverflowToggleButton}
					<div className={DIVIDER_CLASS} key="aras_toolbar_dividerNode" />
					{[...rightContainerItems]}
				</div>
			</div>
		);
	},
	items: function (items, options, toolbar, isRightContainerItem) {
		const itemNodes = items.reduce(function (acc, item, index) {
			item = toolbar.data.get(item);
			if (!item.hidden && defaultFormatters[item.type]) {
				acc.push(
					<ItemConstructorWrapper
						key={item.id}
						toolbar={toolbar}
						item={item}
						formatter={defaultFormatters[item.type]}
						focused={toolbar.focusedItemId === item.id}
						itemRefCallback={options.itemRefCallback}
						ref={{ ...lifecycle }}
						isToolbarRole={options.isToolbarRole}
						flexOrder={isRightContainerItem ? null : index}
						isHidden={
							!isRightContainerItem &&
							!options.isOverflowVisible &&
							options.rightContainerOrder < index
						}
					/>
				);
			}

			return acc;
		}, []);
		return itemNodes;
	}
};

function CreateSelectNode(data) {
	return (
		<select
			onChange={data.changeHandler}
			title={data.tooltip_template}
			disabled={data.disabled}
			selectedIndex={data.selectedIndex}
			tabindex={data.tabindex}
		>
			{data.optionNodes}
		</select>
	);
}

const lifecycle = {
	onComponentShouldUpdate: function (lastProps, nextProps) {
		return (
			lastProps.item !== nextProps.item ||
			lastProps.isToolbarRole !== nextProps.isToolbarRole ||
			lastProps.focused !== nextProps.focused ||
			lastProps.flexOrder !== nextProps.flexOrder ||
			lastProps.isHidden !== nextProps.isHidden
		);
	}
};

const CreateMenu = function (props) {
	return props.spinner ? (
		<div className={DROPDOWN_LIST_CONTAINER_CLASS}>
			<div className="aras-spinner aras-dropdown-spinner" />
		</div>
	) : (
		<aras-menu
			className={DROPDOWN_LIST_CONTAINER_CLASS}
			onContextMenu={(e) => e.preventDefault()}
			ref={(node) => {
				props.data &&
					props.data.size &&
					node &&
					node.applyData(props.data, props.roots);
			}}
		/>
	);
};

const defaultFormatters = {
	corporateTime: function (item, options) {
		const { toolbar } = options;
		const currentDate = intl.date.parse(item.value);
		const date = intl.date.format(currentDate, 'longDate');
		const time = intl.date.format(currentDate, 'shortTime');
		const dateNodeId = `${item.id}_date`;
		const timeNodeId = `${item.id}_time`;
		const describedByAttribute = `${dateNodeId} ${timeNodeId}`;

		return (
			<span
				aria-label={item.aria_label || item.tooltip_template}
				aria-describedby={describedByAttribute}
				className={CORPORATE_TIME_CLASS}
				data-id={item.id}
				tabindex={toolbar._getItemTabindex(item.id)}
				title={item.tooltip_template}
			>
				<span id={dateNodeId}>{date}</span>
				<span id={timeNodeId}>{time}</span>
			</span>
		);
	},
	button: function (item, options) {
		const { toolbar } = options;
		const contentNodes = [];
		const { image } = item;
		let label = item.label;

		if (image) {
			const iconNode = SvgManager.createInfernoVNode(image, {
				class: BUTTON_ICON_CLASS
			});

			contentNodes.push(iconNode);
		} else if (!label) {
			label = getResource('common.no_label');
		}

		if (label) {
			contentNodes.push(
				<span className={BUTTON_CLASS + '__text'}>{label}</span>
			);
		}

		let nodeClass = BUTTON_CLASS;
		nodeClass += item.state ? ' ' + BUTTON_CLASS + '_toggled-on' : '';
		const disabledAttribute = toolbar._getDisabledAttributeName();
		const props = {
			tabindex: toolbar._getItemTabindex(item.id),
			title: item.tooltip_template,
			'data-id': item.id,
			'aria-label': item.aria_label,
			[disabledAttribute]: !!item.disabled
		};
		if (item.state !== undefined) {
			props['aria-pressed'] = Boolean(item.state);
		}

		// Click handler attached only for enabled button with state property
		if (!item.disabled && item.state !== undefined) {
			const toggleButtonClick = function (event) {
				toolbar.data.set(
					item.id,
					Object.assign({}, item, { state: !item.state })
				);
				toolbar.render();
			};

			if (item.clickEventType === 'mousedown') {
				props.onmousedown = toggleButtonClick;
			} else {
				props.onclick = toggleButtonClick;
			}
		}
		return (
			<button {...props} className={nodeClass}>
				{contentNodes}
			</button>
		);
	},
	separator: function (item, options) {
		return <span className={SEPARATOR_CLASS} role="separator" />;
	},
	select: function (item, options) {
		const { toolbar, selectedIndex } = options;
		const changeHandler = function (event) {
			toolbar.data.set(
				item.id,
				Object.assign({}, item, {
					value: event.target.value
				})
			);
			toolbar.render();
		};
		const optionNodes = (item.options || []).map(function (option) {
			return (
				<option value={option.value} selected={item.value === option.value}>
					{option.label}
				</option>
			);
		});

		const selectNode = (
			<CreateSelectNode
				tabindex={toolbar._getItemTabindex(item.id)}
				tooltip_template={item.tooltip_template}
				selectedIndex={item.selectedIndex}
				disabled={item.disabled}
				optionNodes={optionNodes}
				changeHandler={changeHandler}
				ref={{
					onComponentDidMount: function (dom, { item, ...options }) {
						if (
							selectedIndex !== undefined &&
							selectedIndex !== dom.selectedIndex
						) {
							dom.selectedIndex = selectedIndex;
						}
					}
				}}
			/>
		);

		return (
			<span
				className={
					SELECT_CLASS +
					(item.disabled ? ' ' + SELECT_CLASS + DISABLED_MODIFIER : '')
				}
				data-id={item.id}
			>
				{item.label && (
					<span className={SELECT_CLASS + '__text'}>{item.label}</span>
				)}
				<span className={SELECT_CONTAINER_CLASS}>
					{selectNode}
					<span className={SELECT_CLASS + '__button'} />
				</span>
			</span>
		);
	},
	date: function (item, options) {
		const { toolbar } = options;
		const { id } = item;
		const changeHandler = function (event) {
			toolbar.data.set(
				id,
				Object.assign({}, item, { value: event.target.value })
			);
			toolbar.render();
		};
		const style = item.size ? { width: item.size } : {};
		Object.assign(style, item.disabled ? {} : { cursor: 'pointer' });

		const nodeClass =
			SINGULAR_CLASS +
			(item.disabled ? ` ${SINGULAR_CLASS + DISABLED_MODIFIER}` : '');
		const buttonClass =
			SINGULAR_BUTTON_CLASS + (item.disabled ? ` ${ICON_CLASS}_grayscale` : '');
		const iconNode = SvgManager.createInfernoVNode(icons.calendar, {
			class: ICON_CLASS
		});

		let value = getResource('itemsgrid.today');
		if (item.value) {
			const parsedValue = intl.date.parse(item.value);
			value = parsedValue
				? intl.date.format(parsedValue, 'shortDateTime')
				: item.value;
		}
		return (
			<span className={nodeClass} data-id={id}>
				<span className={SINGULAR_CONTAINER_CLASS}>
					<input
						type="text"
						onInput={changeHandler}
						defaultValue={value}
						disabled={item.disabled}
						style={style}
						tabindex={toolbar._getItemTabindex(id)}
						title={item.tooltip_template}
						className="aras-input"
					/>
					<span className={buttonClass}>{iconNode}</span>
				</span>
			</span>
		);
	},
	singular: function (item, options) {
		const { id } = item;
		const { toolbar } = options;
		const changeHandler = function (event) {
			toolbar.data.set(
				id,
				Object.assign({}, item, { value: event.target.value })
			);
			toolbar.render();
		};

		const nodeClass =
			FORM_CLASS + (item.disabled ? ' ' + FORM_CLASS + DISABLED_MODIFIER : '');

		return (
			<span className={nodeClass} data-id={id}>
				<span className={SINGULAR_CLASS}>
					<input
						tabindex={toolbar._getItemTabindex(id)}
						type="text"
						onInput={changeHandler}
						defaultValue={item.value}
						disabled={item.disabled}
					/>
					<span />
				</span>
			</span>
		);
	},
	textbox: function (item, options) {
		const { toolbar } = options;
		const { id, label } = item;
		const children = [];
		const changeHandler = function (event) {
			toolbar.data.set(
				id,
				Object.assign({}, item, { value: event.target.value })
			);
			toolbar.render();
		};
		const style = item.size ? { width: item.size + 'rem' } : {};
		const textboxInput = (
			<input
				aria-invalid={item.invalid || null}
				type="text"
				autoComplete="off"
				className={
					INPUT_CLASS + (item.invalid ? ' ' + INPUT_INVALID_CLASS : '')
				}
				value={item.value}
				title={item.tooltip_template}
				disabled={item.disabled}
				onInput={changeHandler}
				style={style}
				tabindex={toolbar._getItemTabindex(id)}
			/>
		);
		if (label) {
			children.push(
				<span className="aras-toolbar-component__label">{label}</span>
			);
		}
		if (item.image) {
			const iconNode = SvgManager.createInfernoVNode(item.image, {
				class: 'aras-input-icon',
				attrs: { 'aria-hidden': true }
			});
			children.push(
				<span className="aras-input-icon-wrapper">
					{textboxInput}
					{iconNode}
				</span>
			);
		} else {
			children.push(textboxInput);
		}
		const nodeClass = 'aras-toolbar__textbox aras-tooltip';
		const nodeAttributes = {
			'data-tooltip-show': item.invalid ? 'focuswithin' : false,
			'data-tooltip': getResource(
				item.validationMessageResource || 'components.value_invalid'
			),
			'data-tooltip-pos': item.tooltip_pos || 'right'
		};
		return (
			<span className={nodeClass} data-id={id} {...nodeAttributes}>
				{children}
			</span>
		);
	},
	dropdownMenu: function (item, options) {
		const { toolbar } = options;
		const createButtonContent = function (item) {
			const contentNodes = [];

			if (item.image) {
				const iconNode = SvgManager.createInfernoVNode(item.image, {
					class: BUTTON_ICON_CLASS
				});
				contentNodes.push(iconNode);
			}

			if (item.label) {
				contentNodes.push(
					<span className={BUTTON_CLASS + '__text'}>{item.label}</span>
				);
			}

			// Dropdown arrow node always rendered
			contentNodes.push(
				<span className={`${BUTTON_ICON_CLASS} ${BUTTON_CLASS}__menu-arrow`} />
			);

			return contentNodes;
		};

		const buttonFormatter = defaultFormatters[item.buttonFormatter];
		const nodeClass =
			BUTTON_CLASS + (item.buttonCssClass ? ' ' + item.buttonCssClass : '');

		const buttonRenderFunc = buttonFormatter || createButtonContent;
		let buttonContentNodes = buttonRenderFunc(item, options);
		const disabledAttribute = toolbar._getDisabledAttributeName();
		const noItems = !item.data || !item.data.size;
		const buttonNodeAttributes = {
			'aria-label': item.aria_label,
			tabindex: toolbar._getItemTabindex(item.id),
			title: item.tooltip_template,
			[disabledAttribute]:
				item.disabled === undefined ? noItems : !!item.disabled,
			'dropdown-button': '',
			'aria-haspopup': 'menu'
		};

		if (buttonContentNodes) {
			buttonContentNodes = Array.isArray(buttonContentNodes)
				? buttonContentNodes
				: [buttonContentNodes];
		} else {
			buttonContentNodes = [];
		}

		return (
			<aras-dropdown
				className="aras-dropdown-container"
				data-id={item.id}
				position={item.menuPosition}
				closeonclick=""
			>
				<button className={nodeClass} {...buttonNodeAttributes}>
					{buttonContentNodes}
				</button>
				<CreateMenu
					id={item.id}
					data={item.data}
					roots={item.roots}
					spinner={item.spinner}
				/>
			</aras-dropdown>
		);
	},
	dropdownSelector: function (item, options) {
		const { id } = item;
		const { toolbar, dropdownStyle } = options;
		const itemClickHandler = function (event) {
			toolbar.data.set(
				id,
				Object.assign({}, item, {
					value: event.currentTarget.dataset.value
				})
			);
			const evt = new CustomEvent('change', { bubbles: true });
			event.currentTarget.dispatchEvent(evt);
			toolbar.render();
		};
		const keys = Object.keys(item.options);
		const itemOptions = item.options;
		const checkedItemValue = itemOptions[item.value];
		const dropdownItemsNodes = (keys || []).map(function (key) {
			const itemValue = itemOptions[key];
			const iconClass =
				'aras-list-item__icon' +
				(itemValue === checkedItemValue ? ' aras-icon-radio' : '');
			return (
				<li onclick={itemClickHandler} data-value={key}>
					<div className={iconClass} />,
					<span className="aras-list__item-value">{itemValue}</span>
				</li>
			);
		});

		const nodeClass = 'aras-toolbar__dropdown-selector';
		return (
			<span className={nodeClass} data-id={id} title={item.tooltip_template}>
				<span className="dropdown-selector__label-wrapper">
					<span>{item.text}</span>
					{item.value}
				</span>
				<div className={DROPDOWN_CLASS}>
					<span
						className={DROPDOWN_BUTTON_CLASS}
						tabindex={toolbar._getItemTabindex(id)}
					/>
					<div
						className={DROPDOWN_LIST_CONTAINER_CLASS}
						style={dropdownStyle || ''}
					>
						<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
					</div>
				</div>
			</span>
		);
	},
	htmlSelector: function (item, options) {
		const { id } = item;
		const { toolbar, dropdownStyle } = options;
		const itemClickHandler = function (event) {
			toolbar.data.set(
				id,
				Object.assign({}, item, {
					value: event.currentTarget.dataset.value
				})
			);
			const evt = new CustomEvent('change', { bubbles: true });
			event.currentTarget
				.closest('.aras-toolbar__html-selector')
				.dispatchEvent(evt);
			toolbar.render();
		};

		const selectedItemValue = item.value;
		let selectedItemLabel = '';

		const dropdownItemsNodes = item.options.map(function (option) {
			if (option.type === 'separator') {
				return <li className="separator" />;
			}

			const itemLabel = option.label;
			const itemValue = option.value;
			selectedItemLabel =
				itemValue === selectedItemValue ? itemLabel : selectedItemLabel;

			return (
				<li onclick={itemClickHandler} data-value={itemValue}>
					{itemLabel}
				</li>
			);
		});

		return (
			<span className="aras-toolbar__html-selector" data-id={id}>
				<span className="aras-toolbar-component__label">{item.label}</span>
				<span
					className="aras-toolbar__html-selector__wrapper"
					title={item.tooltip_template}
				>
					<div
						className={DROPDOWN_CLASS}
						tabindex={toolbar._getItemTabindex(id)}
					>
						<span className="html-selector__label-wrapper">
							{selectedItemLabel}
						</span>
						<span className={DROPDOWN_BUTTON_CLASS} />
					</div>
					<div
						className={DROPDOWN_LIST_CONTAINER_CLASS}
						style={dropdownStyle || ''}
					>
						<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
					</div>
				</span>
			</span>
		);
	},
	dropdownButton: function (item, options) {
		const { dropdownStyle, toolbar } = options;
		const itemClickHandler = function (event) {
			const evt = new CustomEvent('dropDownItemClick', {
				bubbles: true,
				detail: { optionId: event.currentTarget.dataset.optionid }
			});
			event.currentTarget.dispatchEvent(evt);
		};

		const dropdownItemsNodes = item.options.map((option) => {
			return (
				<li onclick={itemClickHandler} data-optionid={option.value}>
					{option.label}
				</li>
			);
		});

		return (
			<span className="aras-toolbar__action-dropdown-button" data-id={item.id}>
				<div
					className={DROPDOWN_CLASS}
					tabindex={toolbar._getItemTabindex(item.id)}
				>
					<span className="action-dropdown-button__label-wrapper">
						{item.text}
					</span>
					<span className={DROPDOWN_BUTTON_CLASS} />
				</div>
				<div
					className={DROPDOWN_LIST_CONTAINER_CLASS}
					style={dropdownStyle || ''}
				>
					<ul className={DROPDOWN_LIST_CLASS}>{dropdownItemsNodes}</ul>
				</div>
			</span>
		);
	},
	image: function (item, options) {
		const { toolbar } = options;
		const imageClass = IMAGE_CLASS;
		return (
			<span
				className={imageClass}
				data-id={item.id}
				tabindex={toolbar._getItemTabindex(item.id)}
			>
				{SvgManager.createInfernoVNode(item.image, {
					alt: item.tooltip_template
				})}
			</span>
		);
	},
	text: function (item, options) {
		const textClass = TEXT_CLASS;
		const { toolbar } = options;
		return (
			<span
				className={textClass}
				data-id={item.id}
				tabindex={toolbar._getItemTabindex(item.id)}
				title={item.tooltip_template}
			>
				{item.label}
			</span>
		);
	}
};

export { defaultTemplates, defaultFormatters as toolbarFormatters };
