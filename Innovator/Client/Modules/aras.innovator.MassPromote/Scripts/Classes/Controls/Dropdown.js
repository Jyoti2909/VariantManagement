define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.MassPromoteDropdown', null, {
		constructor: function (options) {
			var selectNode = document.createElement('select');
			this._selectNode = selectNode;
			this._options = options;
			this._createPlaceHolder();
			this._loadData(options.dataStorage);
			this._subscribeOnEvents();
			this._connectNode(selectNode, options);
		},

		setData: function (dataStorage) {
			if (this._selectNode.disabled) {
				return;
			}

			var prevSelectedValue = this._selectNode.value;
			this._selectNode.options.length = 0;

			var isExist = dataStorage.some(function (elem) {
				return elem.id === prevSelectedValue;
			});

			if (!isExist) {
				this._createPlaceHolder();
			}

			this._loadData(dataStorage, prevSelectedValue);
			this._detectOnChangeOption(prevSelectedValue);
		},

		setDisabled: function (disabled) {
			this._selectNode.disabled = disabled;
		},

		getSelectedObject: function () {
			if (this._selectNode.value) {
				return this._getSelectedObject(this._selectNode.value);
			}
		},

		selectElement: function (id) {
			if (this._selectNode.disabled) {
				return;
			}

			var opts = this._selectNode.options;
			var changed = false;

			for (var i = 0; i < opts.length; i++) {
				if (opts[i].value === id) {
					this._selectNode.selectedIndex = i;
					changed = true;
					break;
				}
			}

			if (changed) {
				var onChangeEvent = new CustomEvent('change');
				this._selectNode.dispatchEvent(onChangeEvent);
			}
		},

		_detectOnChangeOption: function (prevSelectedValue) {
			if (this._options.onchange) {
				var currentSelectedValue = this._selectNode.value;
				if (currentSelectedValue) {
					if (currentSelectedValue !== prevSelectedValue) {
						var currentObject = this._getSelectedObject(currentSelectedValue);
						this._options.onchange.call(this, currentObject);
					}
				} else {
					if (prevSelectedValue && prevSelectedValue !== '_placeholder_') {
						this._options.onchange.call(this, undefined);
					}
				}
			}
		},

		_getSelectedObject: function (selectedId) {
			var selectedElements = this._dataStorage.filter(function (el) {
				return el.id === selectedId;
			});
			if (selectedElements && selectedElements.length === 1) {
				return selectedElements[0];
			}
		},

		_createPlaceHolder: function () {
			if (this._options.placeholder) {
				var placeholder = new Option(
					this._options.placeholder,
					'_placeholder_'
				);
				placeholder.hidden = true;
				placeholder.selected = true;
				this._selectNode.add(placeholder);
			}
		},

		_loadData: function (dataStorage, selectedId) {
			if (dataStorage) {
				this._dataStorage = dataStorage;
				for (var i = 0; i < dataStorage.length; i++) {
					const optionInfo = dataStorage[i];
					const option = new Option(
						optionInfo.label || optionInfo.name,
						optionInfo.id
					);
					if (option.value === selectedId) {
						option.selected = true;
					}
					this._selectNode.appendChild(option);
				}
			} else {
				this._dataStorage = [];
			}
		},

		_connectNode: function () {
			if (this._options.connectId) {
				var connectNode = document.getElementById(this._options.connectId);
				if (connectNode) {
					connectNode.appendChild(this._selectNode);
					return;
				}
			}
			document.body.appendChild(this._selectNode);
		},

		_subscribeOnEvents: function () {
			var self = this;

			this._selectNode.addEventListener('change', function (e) {
				var selectedItem;
				var selectedId = e.target.value;
				if (selectedId) {
					if (self._options.placeholder && selectedId !== '_placeholder_') {
						var firstOption = e.target.options[0].value;
						if (firstOption === '_placeholder_') {
							e.target.remove(0);
						}
					}
				}
				if (self._options.onchange) {
					self._options.onchange.call(
						self,
						selectedId ? self._getSelectedObject(selectedId) : undefined
					);
				}
			});
		}
	});
});
