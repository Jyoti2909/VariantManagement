// @flow
import Toolbar from '../toolbar';
import {
	paginationControls,
	paginationControlsIds
} from './paginationControls';
import paginationTemplates from './paginationTemplates';
import intl from '../../core/intl';

declare var aras: Object;
const resources = {
	pagination_prev_button: {
		label: 'pagination.prev',
		tooltip: 'pagination.prev.tooltip'
	},
	pagination_next_button: {
		label: 'pagination.next',
		tooltip: 'pagination.next.tooltip'
	},
	pagination_page_size: {
		tooltip: 'pagination.pagesize.tooltip'
	},
	pagination_more_button: {
		tooltip: 'pagination.more.tooltip'
	},
	pagination_max_results: {
		tooltip: 'pagination.maxresults.tooltip'
	},
	pagination_max_reached: {
		label: 'search.how_much_items_max_reached',
		tooltip: 'search.how_much_items_max_reached'
	}
};

export default class Pagination extends Toolbar {
	_itemsCount = 0;
	_prevPageSize = null;
	_prevMaxResults = null;

	constructor(self: this) {
		// $FlowFixMe
		super(self);
		this._initEventListeners();
		this._initControls();
		this._initLabelsForControls();
		return self;
	}

	connectedCallback() {
		this.role = 'navigation';
		this.overflow = true;
		this.classList.add('aras-pagination');
		this.render();
	}

	_render(renderingOptions: ?Object) {
		this.updateControlsState();
		super._render(renderingOptions);
	}

	_setDataItemProperties(itemId: string, properties: Object): void {
		this.data.set(itemId, {
			...this.getItem(itemId),
			...properties
		});
	}

	setItemEnabled(itemId: string, isEnabled: boolean): Promise<void> {
		const item = this.getItem(itemId);
		if (!item || item.disabled === !isEnabled) {
			return Promise.resolve();
		}

		this.data.set(itemId, Object.assign({}, item, { disabled: !isEnabled }));
		return this.render();
	}

	getItem(itemId: string): Object {
		return this.data.get(itemId);
	}

	showSpinner(): Promise<void> {
		this._setDataItemProperties('pagination_more_button', {
			type: 'text',
			cssClass: 'aras-spinner'
		});
		return this.render();
	}

	showMoreButton(): Promise<void> {
		this._itemsCount = 0;
		this._setDataItemProperties('pagination_more_button', {
			hidden: false,
			type: 'button',
			cssClass: 'aras-icon_grayscale'
		});
		this._setDataItemProperties('pagination_status_node', {
			totalResults: null
		});
		this._setDataItemProperties('pagination_status_separator', {
			hidden: true
		});
		this._setDataItemProperties('pagination_total_results_status_node', {
			totalResults: null
		});
		return this.render();
	}

	/**
	 * @returns {Promise<totalResults>}
	 * @memberof Pagination
	 */
	getTotalResults(): Promise<null> {
		return Promise.resolve(null);
	}

	updateControlsState(): Promise<void> {
		return this.updateControlsStateByDefault();
	}

	updateControlsStateByDefault(): Promise<void> {
		const isValidPaginationInputs =
			this.pageSize !== null && this.maxResults !== null;
		if (!isValidPaginationInputs) {
			this.setItemEnabled('pagination_prev_button', false);
			this.setItemEnabled('pagination_next_button', false);

			return this.render();
		}

		let totalResults = this.totalResults;
		const pageSize = this._prevPageSize || this.pageSize || 0;
		const maxResults = this._prevMaxResults || this.maxResults;
		let totalPages;
		if (totalResults !== -1) {
			totalPages = pageSize ? Math.ceil(totalResults / pageSize) : 1;
		}

		const itemsQuantity =
			pageSize * (this.currentPageNumber - 1) + this.itemsCount;
		const isFirstPage = this.currentPageNumber === 1;
		const isEmptyResult = this.itemsCount === 0;
		if (totalPages && itemsQuantity > totalResults) {
			const itemsCount = this._itemsCount;
			this.showMoreButton();
			this._itemsCount = itemsCount;
			totalResults = this.totalResults;
			totalPages = 0;
		}

		let isLastPage;
		if (totalPages) {
			isLastPage =
				this.currentPageNumber === totalPages || itemsQuantity === totalResults;
		} else {
			isLastPage =
				isEmptyResult ||
				!pageSize ||
				this.itemsCount < pageSize ||
				itemsQuantity === maxResults;
		}

		const isMaxReached = maxResults && maxResults === itemsQuantity;
		this.getItem('pagination_max_reached').hidden = !isMaxReached;

		const isEnabledPrevButton = !isFirstPage && pageSize;
		const isEnabledMoreButton = !(isFirstPage && isEmptyResult);
		let isEnabledNextButton =
			pageSize && maxResults ? pageSize < maxResults : true;
		isEnabledNextButton = isEnabledNextButton && !isLastPage;
		if (!totalPages && !isEmptyResult && isLastPage) {
			this.totalResults = Math.max(totalResults, itemsQuantity);
			totalPages = pageSize ? Math.ceil(this.totalResults / pageSize) : 1;
			isEnabledNextButton =
				isEnabledNextButton && this.currentPageNumber < totalPages;
		}

		this.setItemEnabled('pagination_prev_button', !!isEnabledPrevButton);
		this.setItemEnabled('pagination_next_button', !!isEnabledNextButton);
		this.setItemEnabled('pagination_more_button', !!isEnabledMoreButton);
		this.setItemEnabled('pagination_status_node', !!isEnabledMoreButton);
		this.setItemEnabled(
			'pagination_total_results_status_node',
			!!isEnabledMoreButton
		);

		return this.render();
	}

	set totalResults(newValue: ?number | ?string) {
		if (
			newValue === '' ||
			(!this._isPositiveInteger(newValue) && parseInt(newValue) !== 0)
		) {
			return;
		}

		const moreButton = this.getItem('pagination_more_button');
		moreButton.hidden = true;
		this._setDataItemProperties('pagination_status_node', {
			totalResults: newValue
		});
		this._setDataItemProperties('pagination_status_separator', {
			hidden: false
		});
		this._setDataItemProperties('pagination_total_results_status_node', {
			totalResults: newValue
		});
		this.render();
	}

	get totalResults(): number {
		const totalResultValue = this.getItem('pagination_status_node')
			.totalResults;
		return this._isPositiveInteger(totalResultValue) ||
			String(totalResultValue) === '0'
			? parseInt(totalResultValue)
			: -1;
	}

	set itemsCount(newValue: number) {
		this._prevPageSize = null;
		this._prevMaxResults = null;
		this._itemsCount = newValue;
		this.render();
	}

	get itemsCount(): number {
		return this._itemsCount;
	}

	set pageSize(newValue: ?number | ?string) {
		this._setValueInItemWithPositiveInt('pagination_page_size', newValue);
	}

	get pageSize(): ?number {
		return this._getValueFromItemWithPositiveInt('pagination_page_size');
	}

	set currentPageNumber(newValue: number) {
		const statusNodeId = 'pagination_status_node';
		const pageNumberControl = this.getItem(statusNodeId);
		if (pageNumberControl.currentPageNumber === newValue) {
			return;
		}

		this._setDataItemProperties(statusNodeId, { currentPageNumber: newValue });
		this.render();
	}

	get currentPageNumber(): number {
		return this.getItem('pagination_status_node').currentPageNumber;
	}

	set maxResults(newValue: ?number | ?string) {
		this._setValueInItemWithPositiveInt('pagination_max_results', newValue);
	}

	get maxResults(): ?number {
		return this._getValueFromItemWithPositiveInt('pagination_max_results');
	}

	_setValueInItemWithPositiveInt(itemId: string, newValue: ?number | ?string) {
		const control = this.getItem(itemId);

		if (control.value === newValue || !this._isPositiveInteger(newValue)) {
			return;
		}

		this._setDataItemProperties(itemId, {
			value: newValue,
			invalid: false
		});
		this.render();
	}

	_getValueFromItemWithPositiveInt(itemId: string): ?number {
		const itemValue = this.getItem(itemId).value;
		if (itemValue === '') {
			return 0;
		}

		return this._isPositiveInteger(itemValue)
			? intl.number.parseInt(itemValue)
			: null;
	}

	_initLabelsForControls() {
		Object.keys(resources).forEach((id) => {
			const item = this.getItem(id);
			const resource = resources[id];
			if (resource.label) {
				item.label = aras.getResource('', resource.label);
			}
			if (resource.tooltip) {
				item.tooltip_template = aras.getResource('', resource.tooltip);
			}
		});
	}

	_isPositiveInteger(value: ?number | ?string): boolean {
		const parsedInt = intl.number.parseInt(value);
		if (
			value !== '' &&
			(isNaN(parsedInt) || parsedInt < 1 || String(parsedInt) !== String(value))
		) {
			return false;
		}

		return true;
	}

	_clickNextButton() {
		this.itemsCount = 0;
		this.currentPageNumber += 1;
		this.dispatchEvent(new CustomEvent('runSearch'));
	}

	_clickPrevButton() {
		if (this.currentPageNumber === 1) {
			return;
		}

		this.itemsCount = 0;
		this.currentPageNumber -= 1;
		this.dispatchEvent(new CustomEvent('runSearch'));
	}

	_clickMoreButton() {
		this.showSpinner()
			.then(this.getTotalResults)
			.then((totalResults) => {
				this.totalResults = totalResults;
			})
			.catch(() => {
				this.showMoreButton();
			});
	}

	_initControls() {
		this.datastore = new Map();
		paginationControls.forEach((control, id) => {
			this.datastore.set(id, { ...control });
		});
		this._leftContainerItems = paginationControlsIds;
	}

	_initEventListeners() {
		this.on('click', (itemId: string) => {
			switch (itemId) {
				case 'pagination_prev_button':
					this._clickPrevButton();
					break;
				case 'pagination_next_button':
					this._clickNextButton();
					break;
				case 'pagination_more_button':
					this._clickMoreButton();
					break;
			}
			this.render();
		});

		this.addEventListener(
			'input',
			(event: InputEvent) => {
				const targetItemId = this._getIdByDomElement(event.target);
				const item = this.getItem(targetItemId);
				if (
					!item ||
					!targetItemId ||
					!(event.target instanceof HTMLInputElement)
				) {
					return;
				}

				if (this._prevPageSize === null) {
					this._prevPageSize = this.pageSize;
					this._prevMaxResults = this.maxResults;
				}

				const newValue = event.target.value;
				const isInvalid = !this._isPositiveInteger(newValue);
				item.invalid = isInvalid;
				this.data.set(targetItemId, item);
				this.render();
			},
			true
		);
	}
}

Pagination.extendFormatters(paginationTemplates);
