import FilterList from './filterList';
import BaseTypeahead from './baseTypeahead';

class ClassificationProperty extends FilterList {
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute('aria-haspopup', 'tree');
	}

	initialize() {
		super.initialize();
		Object.defineProperty(this.state, 'value', {
			get: function () {
				return this.predictedValue !== null
					? this.predictedValue
					: this._value || '';
			}
		});
	}

	showDialogHandler() {}

	_onKeyDownHandler(e) {
		super._onKeyDownHandler(e);

		if (e.key === 'F2') {
			this.showDialogHandler();
		}
	}

	_getButtonTemplate() {
		return {
			tag: 'button',
			attrs: {
				disabled: this.state.disabled || this.state.readonly,
				tabIndex: -1,
				'aria-hidden': true
			},
			events: {
				onclick: this.showDialogHandler
			},
			className:
				'aras-filter-list__button aras-btn aras-filter-list__button_ellipsis',
			ref: (node) => {
				this.state.refs.button = node;
			}
		};
	}

	_getAutocompleteLabel() {
		const predictedValue = this.state.predictedValue;
		const item = this._findItem(predictedValue);

		return item ? item.label : '';
	}

	_getCurrentInputValue() {
		const value = this.state._value;
		const label = this.state.label;

		if (label !== null) {
			return label;
		} else if (value !== null) {
			const item = this._findItem(value);

			return item ? item.label : '';
		}

		return '';
	}

	_findItem(value) {
		const path = (value || '').split('/');

		function findRecurcive(values, level) {
			const value = path[level];
			const lastLevel = path.length - 1 === level;

			for (let i = 0; i < values.length; i++) {
				const item = values[i];
				if (item.label === value) {
					if (lastLevel) {
						return item;
					}

					const hasChildren = item.children && item.children.length;
					if (hasChildren) {
						return findRecurcive(item.children, level + 1);
					}
				}
			}

			return false;
		}

		return findRecurcive(this.state.list, 0);
	}

	_getListTemplate(list, level, path) {
		const label = this._getCurrentInputValue();
		const needPredict = this.state.shown && this.state.autocomplete;
		const focusedIndex = this.state.focusedIndex;
		const items = [];
		const self = this;

		const isLeaf = function (item) {
			return !item.children || item.children.length === 0;
		};
		const isExists = function (item) {
			return (
				((!isLeaf(item) && self.state.searchableBranch) || isLeaf(item)) &&
				item.label.toUpperCase().indexOf(label.toUpperCase()) === 0
			);
		};
		const getChildrenInside = function (list, level, path) {
			return (list || []).some(function (item) {
				const childrenInside = getChildrenInside(
					item.children,
					level + 1,
					path
				);
				if (isExists(item) || childrenInside || self.state.showAll) {
					return true;
				}
			});
		};

		(list || []).forEach(function (item) {
			const startCount = this.state.commonCount;

			const itemPath = path ? path + '/' + item.label : item.label;
			const leaf = isLeaf(item);
			const exist = isExists(item);
			const textEnding = exist
				? item.label.substring(label.length, item.label.length)
				: item.label;
			let classes = leaf
				? 'aras-filter-list-tree-leaf '
				: 'aras-filter-list-tree-branch ';
			if (!leaf && this.state.searchableBranch) {
				classes += 'aras-filter-list-tree-searchable-branch ';
			}

			const children = [
				{
					tag: 'div',
					children: [
						{
							tag: 'span',
							className: 'aras-filter-list-tree-label',
							children: [
								{
									tag: 'mark',
									children: [exist ? item.label.substring(0, label.length) : '']
								},
								textEnding
							]
						}
					]
				}
			];
			let childrenInside = getChildrenInside(
				item.children,
				level + 1,
				itemPath
			);
			if (exist) {
				if (this.state.count === 0) {
					this.state.predictedValue = needPredict
						? itemPath
						: label === ''
						? ''
						: null;
				}
				if (this.state.count === focusedIndex) {
					this.state.predictedValue = needPredict
						? itemPath
						: label === ''
						? ''
						: null;
					this.state.computedFocusedIndex = startCount + level;
					classes += 'aras-filter-list-tree-leaf_selected';
				}
			}
			if (
				!exist &&
				(this.state.showAll ||
					(!leaf && this.state.searchableBranch && childrenInside))
			) {
				if (this.state.count === focusedIndex) {
					this.state.predictedValue = needPredict
						? itemPath
						: label === ''
						? ''
						: null;
					this.state.computedFocusedIndex = startCount + level;
					classes += 'aras-filter-list-tree-leaf_selected';
				}
			}
			if (
				exist ||
				this.state.showAll ||
				(!leaf && this.state.searchableBranch && childrenInside)
			) {
				this.state.count++;
				this.state.commonCount++;
			}

			if (exist || childrenInside || this.state.showAll) {
				items.push({
					tag: 'li',
					className: classes,
					children: children,
					attrs: {
						'data-value': itemPath,
						role: 'treeitem'
					},
					events: {
						onmousedown:
							leaf || this.state.searchableBranch
								? this._onItemClickHandler.bind(this)
								: (e) => {
										e.preventDefault();
								  }
					}
				});
			}

			childrenInside =
				!leaf && this._getListTemplate(item.children, level + 1, itemPath);
			if (childrenInside) {
				children.push(childrenInside);
				this.state.commonCount++;
			}
		}, this);

		return (
			items.length > 0 && {
				tag: 'ul',
				children: items,
				attrs: {
					role: level === 0 ? 'tree' : 'group'
				}
			}
		);
	}

	_getDropdownHeight() {
		const itemHeight = this._getItemHeight();
		const maxVisibleItemsCount = 16;

		return Math.min(this.state.commonCount, maxVisibleItemsCount) * itemHeight;
	}

	_getDropdownTemplate() {
		Object.assign(this.state, {
			count: 0,
			commonCount: 0
		});

		const list = this._getListTemplate(this.state.list, 0, '');
		const dropdown = BaseTypeahead.prototype._getDropdownTemplate.call(this);
		dropdown.children.push(list);
		dropdown.className += ' aras-filter-list-tree';

		return dropdown;
	}

	validate() {
		const inputValue = this._getCurrentInputValue();

		if (inputValue === '') {
			return true;
		}

		const value = this.state.value;
		const item = this._findItem(value);

		if (!item || (item.children && item.children.length)) {
			return false;
		}

		return item.label === inputValue;
	}

	inputValidate() {
		const inputValue = this._getCurrentInputValue();
		const searchableBranch = this.state.searchableBranch;
		const isAutocomplete = this.state.autocomplete && this.state.focus;

		if (inputValue === '') {
			return true;
		}

		function findRecurcive(values) {
			for (let i = 0; i < values.length; i++) {
				const item = values[i];
				const hasChildren = item.children && item.children.length;
				const itemLabel = item.label.toUpperCase();

				if (
					(!hasChildren || searchableBranch) &&
					(isAutocomplete
						? itemLabel.startsWith(inputValue.toUpperCase())
						: itemLabel === inputValue)
				) {
					return true;
				}

				if (hasChildren && findRecurcive(item.children)) {
					return true;
				}
			}

			return false;
		}

		return findRecurcive(this.state.list);
	}
}

ClassificationProperty.observedAttributes = BaseTypeahead.observedAttributes;

export default ClassificationProperty;
