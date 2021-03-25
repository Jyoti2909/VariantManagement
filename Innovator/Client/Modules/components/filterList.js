import BaseTypeahead from './baseTypeahead';

class FilterList extends BaseTypeahead {
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute('role', 'combobox');
		this.setAttribute('aria-haspopup', 'listbox');
	}

	initialize() {
		super.initialize();
		this.state.predictedValue = null;
		Object.defineProperty(this.state, 'value', {
			get: function () {
				return this.predictedValue !== null ? this.predictedValue : this._value;
			},
			set: function (newValue) {
				this._value = newValue;
				this.label = null;
				this.oldLabel = null;
			},
			configurable: true
		});
	}

	getTemplate() {
		const wrapper = super.getTemplate();
		if (this.getAttribute('mode') === 'field-a') {
			wrapper.className += ' aras-filter-list_a';
		}

		return wrapper;
	}

	_onInputHandler(e) {
		const newLabel = e.target.value;
		const prevLabel = this._getCurrentInputValue();

		Object.assign(this.state, {
			autocomplete:
				prevLabel.length < newLabel.length &&
				e.target.selectionEnd === newLabel.length,
			predictedValue: null,
			focusedIndex: -1,
			showAll: false
		});

		super._onInputHandler(e);

		if (this.state.validation) {
			this.setState({
				invalid: !this.inputValidate()
			});
		}
	}

	_onInputFocusoutHandler(e) {
		if (e.relatedTarget === this.state.refs.dropdown) {
			e.preventDefault();
			e.stopPropagation();
			this.setFocus();
			return;
		}

		this.setState({
			showAll: false
		});

		super._onInputFocusoutHandler(e);
	}

	_onKeyDownHandler(e) {
		if (e.key === 'Enter' && this.state.shown && this.state.count) {
			e.stopPropagation();
		}
		const maxIndex = this.state.count - 1;
		const focusedIndex = this.state.focusedIndex;

		switch (e.key) {
			case 'Down':
			case 'ArrowDown':
				this.setState({
					shown: true,
					focus: true,
					focusedIndex: focusedIndex < maxIndex ? focusedIndex + 1 : 0,
					autocomplete: true
				});
				break;
			case 'Up':
			case 'ArrowUp':
				this.setState({
					shown: true,
					focus: true,
					focusedIndex: focusedIndex > 0 ? focusedIndex - 1 : maxIndex,
					autocomplete: true
				});
				break;
			case 'Enter':
				if (!this._checkShown()) {
					return;
				}
				Object.assign(this.state, {
					shown: false,
					focus: true,
					focusedIndex: -1,
					showAll: false
				});

				this.state.refs.input.dispatchEvent(
					new CustomEvent('change', { bubbles: true })
				);
				break;
			case 'Esc':
			case 'Escape':
				if (!this._checkShown()) {
					return;
				}
				this.setState({
					shown: false,
					focus: true,
					focusedIndex: -1,
					autocomplete: false,
					showAll: false,
					predictedValue: null
				});
				e.preventDefault();
				break;
		}
	}

	_onButtonClickHandler(e) {
		this.setState({
			showAll: true,
			autocomplete: false
		});
		super._onButtonClickHandler(e);
	}

	_onItemClickHandler(e) {
		const li = e.target.closest('li');
		Object.assign(this.state, {
			predictedValue: li.getAttribute('data-value'),
			shown: false,
			focus: true,
			showAll: false
		});

		this.state.refs.input.dispatchEvent(
			new CustomEvent('change', { bubbles: true })
		);
		e.preventDefault();
	}

	_autocomplete() {
		const autocomplete = this.state.autocomplete && this.state.focus;

		if (autocomplete) {
			const input = this.state.refs.input;
			const label = this._getCurrentInputValue();
			const autocompleteLabel = this._getAutocompleteLabel();

			if (autocompleteLabel) {
				input.value = autocompleteLabel;
			}

			if (!document.activeElement) {
				return;
			}

			input.selectionStart = label.length;
			input.selectionEnd = autocompleteLabel
				? autocompleteLabel.length
				: label.length;
		}
	}

	_getAutocompleteLabel() {
		const list = this.state.list;
		const predictedValue = this.state.predictedValue;

		if (!list || !predictedValue) {
			return;
		}

		const item = list.find(function (item) {
			return item.value === predictedValue;
		});

		return item ? item.label || item.value : '';
	}

	_scrollToItem(focusedIndex) {
		const list = this.state.refs.dropdown;

		if (!list) {
			return;
		}

		if (focusedIndex === -1) {
			list.scrollTop = 0;
			return;
		}

		const itemHeight = this._getItemHeight();

		const itemTopOffset = focusedIndex * itemHeight;
		const itemBottomOffest = itemTopOffset + itemHeight - list.clientHeight;
		list.scrollTop = Math.max(
			itemBottomOffest,
			Math.min(itemTopOffset, list.scrollTop)
		);
	}

	_checkShown() {
		return this.state.shown && this.state.count > 0;
	}

	_getItemHeight() {
		const fontSize = parseFloat(
			window.getComputedStyle(document.body)['font-size']
		);
		return fontSize * 2.2;
	}

	_getDropdownHeight() {
		const itemHeight = this._getItemHeight();
		return Math.min(this.state.count, 16) * itemHeight;
	}

	_getCurrentInputValue() {
		const list = this.state.list;
		const value = this.state._value;
		const label = this.state.label;

		if (label !== null) {
			return label;
		} else if (value !== null) {
			const item = list.find(function (item) {
				return item.value === value;
			});

			return item ? item.label || item.value : '';
		}

		return '';
	}

	_getIconContainerTemplate() {
		if (this.getAttribute('mode') === 'field-a') {
			return null;
		}

		return super._getIconContainerTemplate();
	}

	_getInputTemplate() {
		const input = super._getInputTemplate();

		if (this.getAttribute('mode') === 'field-a') {
			input.className = 'aras-input';

			if (this.state.invalid) {
				input.className += ' aras-input_invalid';
			}
		}
		input.events = Object.assign(input.events, {
			onchange: (e) => {
				if (!(e instanceof CustomEvent)) {
					e.stopPropagation();
					return;
				}

				const predictedValue = this.state.predictedValue;

				if (predictedValue === null || predictedValue === undefined) {
					e.stopPropagation();
				} else {
					this.setState({
						value: predictedValue
					});
				}

				if (this.state.validation) {
					this.setState({
						invalid: !this.validate()
					});
				}
			},
			onkeydown: (e) => this._onKeyDownHandler(e)
		});
		return input;
	}

	_getButtonTemplate() {
		const button = super._getButtonTemplate();
		if (this.getAttribute('mode') === 'field-a') {
			button.className = 'aras-button-select';
		}

		return button;
	}

	_getDropdownTemplate() {
		const showAll = this.state.showAll;
		const showNoResultMessage =
			!this.state.list.length && this.state.emptyMessage;
		const needPredict =
			this.state.shown && this.state.autocomplete && !showNoResultMessage;
		const label = this._getCurrentInputValue();
		const focusedIndex = this.state.focusedIndex;
		let predictedValue = null;
		// counter of visible items in the list
		let count = 0;

		let items = (this.state.list || []).map(function (item) {
			const itemLabel = item.label || item.value;
			const exist = itemLabel.toUpperCase().indexOf(label.toUpperCase()) === 0;
			const textEnding = exist
				? itemLabel.substring(label.length, itemLabel.length)
				: itemLabel;
			let classes = 'aras-list-item';

			if (exist || showAll) {
				classes += ' aras-list-item_shown';

				if (count === 0 || itemLabel.toUpperCase() === label.toUpperCase()) {
					predictedValue = item.value || item.label;
				}
				if (count === focusedIndex) {
					predictedValue = item.value || item.label;
					classes += ' aras-list-item_selected';
				}
				count++;
			}

			return {
				tag: 'li',
				className: classes,
				attrs: {
					'data-value': item.value || '',
					role: 'option'
				},
				children: [
					{
						tag: 'mark',
						children: [exist ? itemLabel.substring(0, label.length) : '']
					},
					textEnding
				],
				events: {
					onmousedown: (e) => this._onItemClickHandler(e)
				}
			};
		}, this);

		if (items.length === 0 && showNoResultMessage && label !== '') {
			items = [
				{
					tag: 'li',
					className:
						'aras-list-item aras-list-item_shown aras-list-item_warning',
					attrs: { role: 'status' },
					children: [showNoResultMessage]
				}
			];
			count = 1;
		}

		this.state.predictedValue = needPredict
			? predictedValue
			: predictedValue === ''
			? ''
			: null;
		this.state.count = count;

		const list = {
			tag: 'ul',
			className: 'aras-list',
			children: items,
			attrs: {
				role: 'listbox'
			}
		};

		const dropdown = super._getDropdownTemplate();
		dropdown.children.push(list);

		return dropdown;
	}

	validate() {
		const list = this.state.list;
		const inputValue = this._getCurrentInputValue();

		if (!list) {
			return false;
		}

		return list.some(function (item) {
			return (item.label || item.value) === inputValue;
		});
	}

	inputValidate() {
		const list = this.state.list;
		const inputValue = this._getCurrentInputValue().toLowerCase();
		const isAutocomplete = this.state.autocomplete && this.state.focus;

		if (!list) {
			return false;
		}

		return list.some((item) => {
			const itemLabel = (item.label || item.value).toLowerCase();
			return isAutocomplete
				? itemLabel.startsWith(inputValue)
				: itemLabel === inputValue;
		});
	}

	render() {
		return this._render()
			.then(() => {
				if (this.state.shown) {
					this._scrollToItem(this.state.focusedIndex);
				}

				return this.setFocus();
			})
			.then(() => {
				this._autocomplete();
			});
	}

	attributeChangedCallback(attr, oldValue, newValue) {
		if (attr === 'emptymessage') {
			attr = 'emptyMessage';
		}

		super.attributeChangedCallback(attr, oldValue, newValue);
	}
}

FilterList.observedAttributes = BaseTypeahead.observedAttributes.concat([
	'mode',
	'emptymessage'
]);

export default FilterList;
