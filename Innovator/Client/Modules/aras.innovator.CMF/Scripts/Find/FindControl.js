define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/form/TextBox',
	'dojo/keys',
	'dojo/aspect',
	'dojo/dom-attr',
	'dojo/dom-class',
	'CMF/Scripts/Utils'
], function (declare, connect, TextBox, keys, aspect, domAttr, domClass) {
	var addClearButton = function (textBoxControl, onClearHandler) {
		var element = textBoxControl.textbox;
		domClass.add(element, 'cleanable');

		var toggle = function (v) {
			return v ? domClass.add : domClass.remove;
		};

		element.addEventListener('input', function () {
			if (domClass.contains(this, 'cleanable')) {
				toggle(element.value)(element, 'x');
			}
		});

		element.addEventListener('mousemove', function (evt) {
			if (domClass.contains(this, 'x')) {
				toggle(
					this.offsetWidth - 18 <
						evt.clientX - this.getBoundingClientRect().left
				)(this, 'onX');
			}
		});

		element.addEventListener('click', function (evt) {
			if (domClass.contains(this, 'onX')) {
				evt.preventDefault();
				domClass.remove(this, 'x onX');
				textBoxControl.value = '';
				this.value = '';
				if (onClearHandler) {
					onClearHandler();
				}
			}
		});
	};

	return declare(null, {
		_divFind: null,
		_btnFind: null,
		_btnUp: null,
		_btnDown: null,
		_txtBoxFind: null,
		_lblTotal: null,
		_grid: null,
		_matchCount: 0,
		_activeIndex: 0,
		_isHidden: true,
		//true when results are cleared and Grid doesn't contains regExp to find something
		_isActive: false,
		_searchValue: null,
		_controlLayout:
			'<div id="find" align="right" style="position:absolute; top:0px; right: 0px;"> ' +
			'<span id="lblTotal"></span>' +
			'<input id="txtBoxFind" type="text" class="searchInput"/>' +
			'<input type="button" value="" id="btnUp" />' +
			'<input type="button" value="" id="btnDown" />' +
			'</div>',

		constructor: function (parentElement) {
			var container = document.createElement('div');
			var searchContainerNode;

			container.innerHTML = this._controlLayout;
			this._divFind = container.firstChild;
			parentElement.appendChild(this._divFind);

			// button "up" setup
			this._btnUp = document.getElementById('btnUp');
			this._btnUp.disabled = true;
			this._btnUp.onclick = function () {
				this._findNext(true);
			}.bind(this);

			// button "down" setup
			this._btnDown = document.getElementById('btnDown');
			this._btnDown.disabled = true;
			this._btnDown.onclick = function () {
				this._findNext(false);
			}.bind(this);

			// search label setup
			this._lblTotal = document.getElementById('lblTotal');
			this._lblTotal.textContent = this._getFoundOfText(true);

			// textbox setup
			this._txtBoxFind = new TextBox(
				{ intermediateChanges: true, maxLength: 128, color: 'black' },
				'txtBoxFind'
			);
			this._txtBoxFind.startup();

			addClearButton(
				this._txtBoxFind,
				function () {
					this.findAll(true);
				}.bind(this)
			);

			domAttr.set(
				this._txtBoxFind,
				'placeholder',
				CMF.Utils.getResource('search_placeholder')
			);

			aspect.after(
				this._txtBoxFind,
				'resize',
				function () {
					this._fixTextBoxWidth();
				}.bind(this)
			);

			connect.connect(
				this._txtBoxFind,
				'onChange',
				function () {
					this._onChangeValue();
				}.bind(this)
			);

			connect.connect(
				this._txtBoxFind,
				'onKeyPress',
				function (evt) {
					var textBoxValue = this._txtBoxFind.get('value');
					var isValueChanged = textBoxValue !== this._searchValue;
					var searchAction;

					switch (evt.charOrCode) {
						case keys.ENTER:
							searchAction = isValueChanged || !this._isActive ? 'new' : 'next';
							break;
						case keys.DOWN_ARROW:
							searchAction =
								!isValueChanged && this._matchCount ? 'next' : undefined;
							break;
						case keys.UP_ARROW:
							searchAction =
								!isValueChanged && this._matchCount ? 'prev' : undefined;
							break;
					}

					switch (searchAction) {
						case 'new':
							this.findAll(!textBoxValue, false);
							break;
						case 'next':
						case 'prev':
							this._findNext(searchAction == 'prev');
							this._txtBoxFind.focus();
							break;
					}

					evt.stopPropagation();
				}.bind(this)
			);
		},

		_onChangeValue: function () {
			this._btnUp.disabled = this._btnDown.disabled = !this._txtBoxFind.get(
				'value'
			);
		},

		toggle: function () {
			var gridElement = this._grid._grid.domNode;
			var findClassName = 'withFind';

			if (this._isHidden) {
				//show
				if (gridElement.className) {
					gridElement.className += ' ' + findClassName;
				} else {
					gridElement.className = findClassName;
				}

				this._divFind.style.display = 'block';
				this._isHidden = false;
				this._fixTextBoxWidth();

				this._searchValue = null;
				this._onChangeValue();
			} else {
				//hide
				//for now we remove a way to hide - see git history to restore if need.
			}
		},

		_getFoundOfText: function (isOnlyToClear) {
			if (isOnlyToClear) {
				return '';
			}
			if (!this._matchCount) {
				return CMF.Utils.getResource('no_matches_found');
			}
			if (this._matchCount > 100) {
				return CMF.Utils.getResource('more_than_100_matches');
			}

			return CMF.Utils.getResource(
				'found_of_matches',
				this._currentFound.toString(),
				this._totalFound.toString()
			);
		},

		findAll: function (isOnlyToClear, skipGridClear) {
			if (isOnlyToClear && !this._isActive) {
				this._lblTotal.textContent = '';
				return;
			}

			this._isActive = !isOnlyToClear;
			this._searchValue = this._txtBoxFind.value;
			this._matchCount = skipGridClear
				? 0
				: this._grid.findAll(this._searchValue, isOnlyToClear);
			this._activeIndex = 0;
			this._lblTotal.textContent = this._getFoundOfText(isOnlyToClear);
		},

		_findNext: function (isUp) {
			var textBoxValue = this._txtBoxFind.get('value');
			var isLimit;

			if (
				this._searchValue !== textBoxValue ||
				(textBoxValue && !this._isActive)
			) {
				this.findAll();
				isLimit = isUp ? true : this._matchCount === 1;
			} else {
				isLimit = this._activeIndex === (isUp ? 1 : this._matchCount);
			}

			if (this._matchCount) {
				if (!isLimit) {
					this._activeIndex += isUp ? -1 : 1;
				} else {
					this._activeIndex = isUp ? this._matchCount : 1;
				}

				this._grid.findNext(isUp, this._activeIndex - 1);
				this._lblTotal.textContent = this._getFoundOfText();
			}
		},

		reload: function () {
			if (!this._isHidden) {
				this._fixTextBoxWidth();
			}

			this.findAll(true, true);
		},

		_fixTextBoxWidth: function () {
			//fix for width, dojo TextBox here requires region for current layout and this region added parent.parent div which has wrong width (very large).
			this._txtBoxFind.focusNode.parentNode.parentNode.style.width = '160px';
			this._txtBoxFind.focusNode.parentNode.parentNode.style.position =
				'relative';
		},

		setGrid: function (grid) {
			this._grid = grid;
		},

		isHidden: function () {
			return this._isHidden;
		}
	});
});
