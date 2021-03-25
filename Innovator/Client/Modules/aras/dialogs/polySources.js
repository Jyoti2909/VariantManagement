import Dialog from '../../core/Dialog';
import { createButton } from '../../components/dialogCommonApi';
import alertModule from '../../components/alert';
import SvgManager from '../../core/SvgManager';
import getResource from '../../core/resources';
import itemTypeMetadata from '../../metadata/itemType';

const cssClass = 'aras-dialog_polysources';
const activeItemClassName = 'aras-chip_active';

export default async (itemTypeId) => {
	const itemType = await itemTypeMetadata.getItemType(itemTypeId, 'id');
	const morphaeList = itemType.Morphae || [];
	const requestPromises = morphaeList.map((itemTypeInfo) => {
		const name = itemTypeInfo['related_id@aras.name'];
		return itemTypeMetadata.getItemType(name, 'name');
	});

	const itemTypes = await Promise.all(requestPromises);
	const items = itemTypes
		.filter(itemTypeMetadata.isAllowToAdd)
		.map((itemTypeInfo) => {
			return {
				id: itemTypeInfo.id,
				name: itemTypeInfo.name,
				label: itemTypeInfo.label || itemTypeInfo.name,
				icon: itemTypeInfo.open_icon || '../images/DefaultItemType.svg'
			};
		})
		.sort((a, b) => {
			return a.label.toUpperCase() > b.label.toUpperCase() ? 1 : -1;
		});

	if (items.length === 0) {
		const errorMessage = getResource(
			'itemtypeselectiondialog.do_not_have_permission_to_create',
			itemType['label_plural'] || itemType['name']
		);
		return alertModule(errorMessage);
	} else if (items.length === 1) {
		return items[0].name;
	}

	const title = getResource('itemtypeselectiondialog.select_item_type');
	const dialog = new Dialog('html', { title, classList: cssClass });

	let state = {
		selectedItem: null
	};

	const setState = (next) => {
		state = Object.assign(state || {}, next);
		render();
	};

	const render = () => {
		const okButton = createButton(
			getResource('common.ok'),
			'aras-button_primary aras-buttons-bar__button',
			() => dialog.close(state.selectedItem.name),
			{
				disabled: !state.selectedItem
			}
		);

		const cancelButton = createButton(
			getResource('common.cancel'),
			'aras-button_secondary-light',
			() => dialog.close()
		);
		HyperHTMLElement.bind(dialog.contentNode)`
			<div class="aras-chip-list aras-chip-list_vertical" role="radiogroup"
				onconnected=${(e) => {
					const listContainer = e.target;
					const toggleOverflowedClass = () => {
						const clientHeight = Math.ceil(
							listContainer.getBoundingClientRect().height
						);
						const isOverflowed = listContainer.scrollHeight > clientHeight;

						listContainer.classList.toggle(
							`aras-chip-list_overflow`,
							isOverflowed
						);
					};

					toggleOverflowedClass();

					window.addEventListener('resize', toggleOverflowedClass);
					dialog.promise.then(() =>
						window.removeEventListener('resize', toggleOverflowedClass)
					);
				}}
			>
				${items.map((item) => {
					const { icon, name, label } = item;
					const iconNode = SvgManager.createHyperHTMLNode(icon, {
						class: 'aras-chip__icon',
						alt: ''
					});

					const itemClassList = ['aras-chip', 'aras-chip_3'];
					let onconnected;
					const isActiveButton = state.selectedItem === item;
					if (isActiveButton) {
						itemClassList.push(activeItemClassName);
						onconnected = (e) => e.target.focus();
					}

					return HyperHTMLElement.hyper`
						<button
							role="radio"
							aria-checked="${isActiveButton}"
							data-name="${name}"
							class="${itemClassList.join(' ')}"
							onconnected=${onconnected}
							ondblclick=${() => dialog.close(name)}
							onclick=${() => !isActiveButton && setState({ selectedItem: item })}
						>
							${iconNode}
							<span class="aras-chip__label" role="presentation">${label || name}</span>
						</button>
					`;
				})}
			</div>
			<div class="aras-buttons-bar aras-buttons-bar_right">
				${okButton}
				${cancelButton}
			</div>
		`;
	};
	render();
	dialog.show();

	return dialog.promise;
};
