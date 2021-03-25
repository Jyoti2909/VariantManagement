require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.DropDownList',
		(function () {
			dojo.declare('VC.Widgets.Option', null, {
				_optionNode: null,

				text: null,
				value: null,
				additionalData: null,

				onSelect: function (event, option) {},

				constructor: function (text, value) {
					this.text = text;
					this.value = value;

					this._optionNode = document.createElement(
						VC.Utils.Constants.htmlTags.div
					);
					this._optionNode.setAttribute(
						VC.Utils.Constants.htmlAttributes.value,
						this.value
					);
					this._optionNode.innerHTML = this.text;

					VC.Utils.addClass(this._optionNode, 'Option');
					this._optionNode.onclick = dojo.hitch(this, function (event) {
						this._onSelect(event);
					});

					Object.defineProperty(this, 'domNode', {
						get: function () {
							return this._optionNode;
						}
					});
				},

				_onSelect: function (event) {
					this.onSelect(event);
					this.select();
				},

				select: function () {
					this._optionNode.setAttribute('selected', 'selected');
				},

				clearSelection: function () {
					this._optionNode.removeAttribute('selected');
				}
			});

			return declare(null, {
				_containerNode: null,
				_selectedValueNode: null,
				_optionsNode: null,
				_selectedOption: null,
				_isOpenedOptionsPanel: null,
				_options: null,

				onChange: function () {},

				//data: [{ text: "", value: "", selected: "" }]
				constructor: function (data, hasEmptyOption) {
					this._options = [];
					this._isOpenedOptionsPanel = false;

					this._containerNode = document.createElement(
						VC.Utils.Constants.htmlTags.div
					);
					this._selectedValueNode = document.createElement(
						VC.Utils.Constants.htmlTags.div
					);
					this._optionsNode = document.createElement(
						VC.Utils.Constants.htmlTags.div
					);

					this._containerNode.appendChild(this._selectedValueNode);
					this._containerNode.appendChild(this._optionsNode);

					VC.Utils.addClass(this._containerNode, 'Select');
					VC.Utils.addClass(this._selectedValueNode, 'SelectedText');
					VC.Utils.addClass(this._optionsNode, 'Options');

					if (data) {
						this.bindOptions(data, hasEmptyOption);
					}

					this._selectedValueNode.onclick = dojo.hitch(
						this,
						this._onOpenOptions
					);
					document.addEventListener(
						'click',
						dojo.hitch(this, this._closeOptions)
					);

					Object.defineProperty(this, 'width', {
						set: function (value) {
							var padding = 10;
							var borders = 2;

							value = +value;

							this._containerNode.style.width = value + borders + 'px';
							this._selectedValueNode.style.width = value - padding + 'px';
							this._optionsNode.style.width = value + 'px';
						}
					});

					Object.defineProperty(this, 'selectedText', {
						get: function () {
							var returnedValue = null;

							if (this._selectedOption !== null) {
								returnedValue = this._selectedOption.text;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'selectedValue', {
						get: function () {
							var returnedValue = null;

							if (this._selectedOption !== null) {
								returnedValue = this._selectedOption.value;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'selectedAdditionalData', {
						get: function () {
							var returnedValue = null;

							if (this._selectedOption !== null) {
								returnedValue = this._selectedOption.additionalData;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'selectedOption', {
						get: function () {
							var returnedValue = null;

							if (this._selectedOption !== null) {
								returnedValue = this._selectedOption;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'domNode', {
						get: function () {
							return this._containerNode;
						}
					});

					this.width = 58;
				},

				bindOptions: function (data, hasEmptyOption) {
					this._removeOptions();

					if (hasEmptyOption) {
						var emptyOptionData = { text: '', value: '' };
						this._addNewOption(emptyOptionData);
					}

					for (var i = 0; i < data.length; i++) {
						var currentOption = this._addNewOption(data[i]);

						if (data[i].selected) {
							this.selectOption(currentOption.value);
						}
					}
				},

				selectOption: function (value) {
					var currrentOption = null;

					for (var i = 0; i < this._options.length; i++) {
						currrentOption = this._options[i];

						if (currrentOption.value === value) {
							this._onChange(currrentOption);
							currrentOption.select();
						}
					}
				},

				_addNewOption: function (data) {
					var currentOption = new VC.Widgets.Option(data.text, data.value);
					currentOption.additionalData = data.additionalData;
					currentOption.onSelect = dojo.partial(
						dojo.hitch(this, this._onChange),
						currentOption
					);
					this._optionsNode.appendChild(currentOption.domNode);
					this._options.push(currentOption);

					return currentOption;
				},

				_onChange: function (selectedOption, event) {
					this._selectedOption = selectedOption;
					this._selectedValueNode.innerHTML = selectedOption.text;
					this._closeOptions();

					for (var i = 0; i < this._options.length; i++) {
						this._options[i].clearSelection();
					}

					this.onChange();

					if (event) {
						event.stopPropagation();
					}
				},

				_onOpenOptions: function (event) {
					if (this._isOpenedOptionsPanel) {
						this._closeOptions();
					} else {
						this._isOpenedOptionsPanel = true;
						this._optionsNode.visible(true);
					}

					if (event) {
						event.stopPropagation();
					}
				},

				_closeOptions: function () {
					if (this._isOpenedOptionsPanel) {
						this._isOpenedOptionsPanel = false;
						this._optionsNode.visible(false);
					}
				},

				_removeOptions: function () {
					this._selectedValueNode.innerHTML = '';
					this._optionsNode.innerHTML = '';
					this._selectedOption = null;
					this._options = [];
				},

				disable: function () {
					this._selectedValueNode.disable(true);
				},

				enable: function () {
					this._selectedValueNode.disable(false);
				}
			});
		})()
	);
});
