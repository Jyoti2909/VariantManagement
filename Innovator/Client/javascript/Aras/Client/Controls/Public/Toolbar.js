define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/dijit',
	'dijit/layout/ContentPane',
	'../Experimental/ArasToolBar',
	'../Public/ToolbarItem',
	'dijit/CheckedMenuItem',
	'dijit/RadioMenuItem',
	'Controls/AdvancedToolBarSelect',
	'../Experimental/_toolBar/Button',
	'../Experimental/_toolBar/ToggleButton',
	'../Experimental/_toolBar/AdvancedTextBox',
	'dijit/form/Button',
	'dijit/form/DropDownButton',
	'dijit/DropDownMenu',
	'dijit/ToolbarSeparator',
	'dojo/_base/xhr',
	'dojo/_base/array',
	'dojo/dom-class',
	'dojo/has',
	'dojo/_base/config'
], function (
	declare,
	connect,
	dijit,
	ContentPane,
	dijitToolbar,
	ToolbarItem,
	CheckedMenuItem,
	RadioMenuItem,
	AdvancedToolBarSelect,
	ToolbarButton,
	ToolbarToogleButton,
	AdvancedTextBox,
	Button,
	DropDownButton,
	DropDownMenu,
	Separator,
	xhr,
	array,
	DomClass,
	has,
	config
) {
	//Class-Specific private variables:
	var _buttonMaxWidth = 22,
		_buttonMaxHeight = 22,
		privateProps = {};

	return declare('Aras.Client.Controls.Public.Toolbar', null, {
		//don't add property here without "_Experimental" - it will be shown as field in documentation, properties are defined in constructor using defineProperties
		constructor: function (args) {
			/// <summary>
			/// Toolbar container.
			/// </summary>
			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties({});
				arasDocumentationHelper.registerEvents(
					'onClick, onChange, onDropDownItemClick, onKeyDown'
				);
				return;
			}

			var tmpConnectId = args.connectId || '';
			this.propsId_Experimental = tmpConnectId;
			var counter = 1;
			while (privateProps[this.propsId_Experimental]) {
				this.propsId_Experimental = tmpConnectId + counter;
				counter = counter + 1;
			}

			//Instance-Specific private props:
			privateProps[this.propsId_Experimental] = {
				currentToolBar: null,
				toolBarsNode: null,
				buttonSizeX: null,
				buttonSizeY: null,
				args: null,
				contentPane: null,
				_saltTb_Experimental: null,
				_saltTbi_Experimental: null, //don't use "," after the last property all over the file, e.g, here because documentation will not be built
				rightOffsetElement: args.rightOffsetElement
			};

			var props = privateProps[this.propsId_Experimental];
			props.args = args;
			props._saltTb_Experimental = (args.id || '') + 'SALTkA7_Aras_';
			props._saltTbi_Experimental = props._saltTb_Experimental + 'Tbi_';
			this.controlLegacy = this;
			for (var method in this) {
				if (typeof this[method] === 'function') {
					// workaround for solutions that use getElement method
					if (method == 'getItem') {
						var yetMethodName = 'getElement';
						this[yetMethodName] = this[method];
					}
					var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
					this[methodName] = this[method];
				}
			}

			props.contentPane = new ContentPane(args);
			props.contentPane.onDropDownItemClick = this.onDropDownItemClick;

			props.contentPane.domNode.style.padding = '0px';

			props.toolBarsNode = [];
			props._displayLabels = false;

			if (args.connectNode) {
				args.connectNode.appendChild(props.contentPane.domNode);
			} else {
				document
					.getElementById(args.connectId)
					.appendChild(props.contentPane.domNode);
			}
		},

		// === events =============================================
		onClick: function ToolbarPublic_onClick(el) {
			/// <summary>
			/// Occurs when the control is clicked.
			/// </summary>
			/// <param name="el" type="Aras.Client.Controls.Public.ToolbarItem">The source of the event.</param>
			if (
				'Aras.Client.Controls.Experimental._toolBar.Button' ==
					el._item_Experimental.declaredClass ||
				'Aras.Client.Controls.Experimental._toolBar.ToggleButton' ==
					el._item_Experimental.declaredClass
			) {
				this.buttonClick(el);
			}
		},

		buttonClick: function ToolbarPublic_buttonClick(el) {
			//todo: if need to rename to experimental
			//Event click button
		},

		onChange: function ToolbarPublic_onChange(el) {
			/// <summary>
			/// Occurs when the ComboBox.SelectedIndex property has changed.
			/// </summary>
			/// <param name="el" type="Aras.Client.Controls.Public.ToolbarItem"></param>
		},

		onKeyDown: function ToolbarPublic_onKeyDown(el, evt) {
			/// <summary>
			/// Occurs when Key is pressed on TextBoxEdit.
			/// </summary>
			/// <param name="el" type="Aras.Client.Controls.Public.ToolbarItem"></param>
		},

		onDropDownItemClick: function ToolbarPublic_onDropDownItemClick(text) {
			/// <summary>
			/// Occurs when ComboBox.SelectedIndex property or value of Aras.Client.Controls.TTextBox.Text property was changed.
			/// </summary>
			/// <param name="text" type="string"></param>
		},

		// === public methods =====================================
		loadXml: function ToolbarPublic_loadXml(filePath) {
			//TODO: only absolute pathes work now.
			/// <summary>
			/// Loads xml from file.
			/// </summary>
			/// <param name="filePath" type="string"></param>
			var response = xhr.get({ url: filePath, sync: true });
			this.loadToolbarFromStr(response.results[0]);
		},

		loadToolbarFromStr: function ToolbarPublic_loadToolbarFromStr(string) {
			/// <summary>
			/// Load xml from string;
			/// </summary>
			/// <param name="string" type="string"></param>
			var dom = new XmlDocument();
			dom.loadXML(string);
			var node = dom
				.selectSingleNode('./toolbarapplet')
				.getAttribute('buttonsize')
				.split(',');
			privateProps[this.propsId_Experimental].buttonSizeX = node[0]
				? node[0]
				: 26;
			privateProps[this.propsId_Experimental].buttonSizeY = node[1]
				? node[1]
				: node[0]
				? node[0]
				: 25;
			var toolBars = dom.selectNodes('./toolbarapplet/toolbar');

			for (var j = 0; j < toolBars.length; j++) {
				privateProps[this.propsId_Experimental].toolBarsNode[
					toolBars[j].getAttribute('id')
				] = toolBars[j];
			}
		},

		// Adding extra properties to widget is not good idea, because of widget will have a lot of redundant attributes.
		// TODO: This aprroach should be changed later.
		setExtraProps: function (widget, node, namesToSkip) {
			for (var k = 0; k < node.attributes.length; ++k) {
				var attrNode = node.attributes[k];
				var attrName = attrNode.nodeName;
				if (namesToSkip.indexOf(attrName) < 0) {
					widget.set(attrName, attrNode.value);
				}
			}
		},

		isToolbarExist: function ToolbarPublic_isToolbarExist(id) {
			if (privateProps[this.propsId_Experimental].toolBarsNode[id]) {
				return true;
			}
			return false;
		},

		showToolbar: function ToolbarPublic_showToolbar(id) {
			/// <summary>
			/// Displays toolbar with specified id.
			/// </summary>
			/// <param name="id" type="string"></param>
			var setLabelToWidget = function (widget, itemNode) {
				var itemLabel = itemNode.getAttribute('label');

				if (!itemLabel) {
					return;
				}

				var labelPosition = itemNode.getAttribute('label_position');
				if (itemNode.nodeName === 'edit' || itemNode.nodeName == 'choice') {
					if (labelPosition === 'right') {
						widget.setLabelAfter(itemLabel);
					} else {
						//left by default
						widget.setLabelBefore(itemLabel);
					}
				} else {
					var style =
						'display:inline;' +
						(widget.customStyle ? widget.customStyle : 'padding: 0px;');
					var contentPane = new ContentPane({
						id: 'contentpane_' + widget.id,
						style: style
					});
					var labelElement = document.createElement('label');

					labelElement.innerHTML = itemLabel;
					widget.textLabel = labelElement;

					var firstNode;
					var secondNode;
					if (labelPosition === 'right') {
						firstNode = widget.domNode;
						secondNode = labelElement;
					} else {
						//left by default
						firstNode = labelElement;
						secondNode = widget.domNode;
					}

					contentPane.domNode.appendChild(firstNode);
					contentPane.domNode.appendChild(secondNode);

					widget = contentPane;
				}
			};

			var self = this,
				tool = ToolbarItem,
				elementsWithoutIdsCounter = 0,
				styleItem,
				node,
				nodes,
				nodeText,
				i,
				dijitToolbarId =
					privateProps[this.propsId_Experimental]._saltTb_Experimental + id,
				rightOffsetElement =
					privateProps[this.propsId_Experimental].rightOffsetElement;

			var toolbar = privateProps[this.propsId_Experimental].currentToolBar;
			if (toolbar && toolbar.id == dijitToolbarId) {
				return;
			}

			if (privateProps[this.propsId_Experimental].toolBarsNode[id]) {
				if (toolbar) {
					toolbar.id = dijitToolbarId;

					toolbar.focusedChild = null;
					toolbar.lastFocusedChild = null;
					toolbar.destroyDescendants(false);
				} else {
					toolbar = new dijitToolbar(
						{
							id: dijitToolbarId,
							rightOffsetElement: rightOffsetElement,
							orientation: 'horiz'
						},
						dijitToolbarId
					);
					privateProps[
						this.propsId_Experimental
					].contentPane.domNode.appendChild(toolbar.domNode);
				}

				//id can be $EmptyClassification in case when created toolbar doesn't contains any For classification and there are no other toolbars. For example CMF toolbar.
				var toolbarIds = [id];

				//$EmptyClassification - For classification is empty. That means that all toolbar items should be added to current toolbar.
				if (toolbarIds.indexOf('$EmptyClassification') === -1) {
					toolbarIds.push('$EmptyClassification');
				}

				for (var j = 0; j < toolbarIds.length; j++) {
					var toolBarNode =
						privateProps[this.propsId_Experimental].toolBarsNode[toolbarIds[j]];
					if (toolBarNode) {
						array.forEach(
							toolBarNode.childNodes,
							function (itemNode) {
								var thisItem,
									idItem,
									//salt for menuItem is different from the salt of ToolbarItem because getItem(and pass id of menuItem) should return undefined (the same as in .NET)
									saltMenuItem =
										privateProps[this.propsId_Experimental]
											._saltTbi_Experimental + 'mi_';

								if ('getAttribute' in itemNode) {
									idItem = itemNode.getAttribute('id');
									idItem =
										privateProps[this.propsId_Experimental]
											._saltTbi_Experimental +
										(idItem
											? idItem
											: 'emptyId_' + ++elementsWithoutIdsCounter);
								}
								switch (itemNode.nodeName) {
									case 'button':
										//if button is disable apply grayscale and opacity 50%
										var isExistImage = !!itemNode.getAttribute('image');
										var imageSRC =
											config.baseUrl +
											'../../cbin/' +
											itemNode.getAttribute('image');
										var classImage =
											'true' == itemNode.getAttribute('disabled')
												? 'grayImage'
												: '';
										var w = itemNode.getAttribute('width');
										var h = itemNode.getAttribute('height');
										var imgStyle = {
											width: w ? w + 'px' : 'auto',
											height: h ? h + 'px' : 'auto',
											maxWidth: _buttonMaxWidth + 'px',
											maxHeight: _buttonMaxHeight + 'px',
											display: isExistImage ? '' : 'none'
										};
										if (itemNode.getAttribute('state')) {
											thisItem = new ToolbarToogleButton({
												id: idItem,
												showLabel: isExistImage
													? privateProps[this.propsId_Experimental]
															._displayLabels
													: true,
												showTitle: false,
												checked: itemNode.getAttribute('state') === '1',
												label: itemNode.getAttribute('tooltip'),
												imageSrc: imageSRC,
												imageClass: classImage,
												imageStyle: imgStyle
											});
										} else {
											thisItem = new ToolbarButton({
												id: idItem,
												showLabel: isExistImage
													? privateProps[this.propsId_Experimental]
															._displayLabels
													: true,
												showTitle: false,
												label: itemNode.getAttribute('tooltip'),
												imageSrc: imageSRC,
												imageClass: classImage,
												imageStyle: imgStyle
											});
										}
										connect.connect(thisItem, 'onClick', function () {
											self.onClick(
												new tool({
													item: this,
													saltTbi_Experimental:
														privateProps[self.propsId_Experimental]
															._saltTbi_Experimental
												})
											);
										});
										this.setExtraProps(thisItem, itemNode, [
											'id',
											'name',
											'label',
											'image',
											'tooltip',
											'disabled'
										]);
										break;
									case 'drop_down_button':
										var menu = new DropDownMenu({
												style: 'display: none;',
												eventClick: this.onDropDownItemClick,
												// prettier-ignore
												'class': 'aras_toolbar_input'
											}),
											menuItemOnClickHandler = function () {
												this.getParent().eventClick(
													this.id.replace(saltMenuItem, '')
												);
											},
											menuItem,
											childId;

										menu.resize = function makeMenuScrollableIfNeed(newSize) {
											var st = this.domNode.parentNode.style;
											if (newSize.h && newSize.w && !this.originalPropsBackup) {
												this.originalPropsBackup = {
													h: st.height,
													w: st.width,
													overflowY: st.overflowY,
													overflowX: st.overflowX
												};
											}
											if (
												(newSize.h && newSize.w) ||
												this.originalPropsBackup
											) {
												var newStyle = this.originalPropsBackup;
												if (newSize.h && newSize.w) {
													newStyle = {
														h: newSize.h + 'px',
														overflowY: 'auto',
														w: newSize.width + 16, //vertical scrollbar
														overflowX: 'hidden'
													};
												}
												st.height = newStyle.h;
												st.overflowY = newStyle.overflowY;
												st.width = newStyle.w;
												st.overflowX = newStyle.overflowX;
											}
										};

										menu.isSingleCheck =
											'true' === itemNode.getAttribute('singlecheck');
										nodes = itemNode.selectNodes('./checkitem');

										for (i = 0; i < nodes.length; i += 1) {
											node = nodes[i];
											nodeText = node.text;
											childId =
												saltMenuItem + node.getAttribute('id') || nodeText;

											if (menu.isSingleCheck) {
												menuItem = new RadioMenuItem({
													id: childId,
													label: nodeText,
													checked: 'true' === node.getAttribute('checked'),
													group: idItem + 'group'
												});
											} else {
												menuItem = new CheckedMenuItem({
													id: childId,
													label: nodeText,
													checked: 'true' === node.getAttribute('checked')
												});
											}

											connect.connect(
												menuItem,
												'onClick',
												menuItemOnClickHandler
											);
											menu.addChild(menuItem);
										}

										thisItem = new DropDownButton({
											id: idItem,
											label: itemNode.getAttribute('text'),
											dropDown: menu
										});
										thisItem.maxHeight = -1; //to force menu.resize if need
										connect.connect(thisItem, 'onClick', function () {
											self.onClick(
												new tool({
													item: this,
													saltTbi_Experimental:
														privateProps[self.propsId_Experimental]
															._saltTbi_Experimental
												})
											);
											// this call required to properly set focus on button after first click
											this.focus();
										});
										break;
									case 'separator':
										thisItem = new Separator({ id: idItem });
										thisItem.isSeparator = true;
										break;
									case 'choice':
										styleItem =
											'height: 15px; font-size: 8pt;border-color: #6B6B6B; color: #6E6E6E;';
										thisItem = new AdvancedToolBarSelect({
											id: idItem,
											style: styleItem,
											// prettier-ignore
											'class': 'aras_toolbar_input',
											title: itemNode.getAttribute('tooltip')
										});
										var iconNode = thisItem.domNode.querySelectorAll(
											'.dijitArrowButtonInner'
										);
										if (iconNode && iconNode.length > 0) {
											DomClass.add(iconNode[0], 'DropDownArrowButtonInner');
										}
										var butttonNode = thisItem.domNode.querySelectorAll(
											'td.dijitDownArrowButton'
										);
										if (butttonNode && butttonNode.length > 0) {
											butttonNode[0].style.border = '0px none';
										}
										iconNode = butttonNode = undefined; //to prevent memory leaks
										nodes = itemNode.selectNodes('./choiceitem');
										for (i = 0; i < nodes.length; i++) {
											node = nodes[i];
											nodeText = node.text;
											var value = node.getAttribute('id') || nodeText;
											thisItem.addOption({ value: value, label: nodeText });
										}
										connect.connect(thisItem, 'onChange', function () {
											self.onChange(
												new tool({
													item: this,
													saltTbi_Experimental:
														privateProps[self.propsId_Experimental]
															._saltTbi_Experimental
												})
											);
										});
										this.setExtraProps(thisItem, itemNode, [
											'id',
											'label',
											'disabled'
										]);
										break;
									case 'edit':
										var tooltip =
											itemNode.getAttribute('tooltip') ||
											itemNode.getAttribute('label') ||
											'';
										thisItem = new AdvancedTextBox({
											id: idItem,
											value: itemNode.getAttribute('text'),
											textbox_type: itemNode.getAttribute('textbox_type')
										});
										thisItem.TextBox.style.width =
											itemNode.getAttribute('size') + 'em';
										thisItem.TextBox.style.height = '15px';
										connect.connect(thisItem, 'onChange', function () {
											self.onChange(
												new tool({
													item: this,
													saltTbi_Experimental:
														privateProps[self.propsId_Experimental]
															._saltTbi_Experimental
												})
											);
										});
										connect.connect(thisItem, 'onKeyDown', function (evt) {
											self.onKeyDown(
												new tool({
													item: this,
													saltTbi_Experimental:
														privateProps[self.propsId_Experimental]
															._saltTbi_Experimental
												}),
												evt
											);
										});
										thisItem.customStyle =
											'padding:0px 10px; vertical-align:middle';
										thisItem.set('title', tooltip);
										this.setExtraProps(thisItem, itemNode, [
											'id',
											'name',
											'label',
											'tooltip',
											'disabled'
										]);
										break;
								}

								if (thisItem) {
									if ('true' == itemNode.getAttribute('disabled')) {
										thisItem.set('disabled', true);
									}

									setLabelToWidget(thisItem, itemNode);

									if (itemNode.getAttribute('invisible')) {
										thisItem.set('style', 'display: none');
									}

									var classOnWidget = thisItem.get('class') || '';
									if (thisItem.domNode.nodeName == 'SPAN') {
										thisItem.set(
											'class',
											classOnWidget +
												' ' +
												(privateProps[this.propsId_Experimental].args
													.TbrButtonCls
													? privateProps[this.propsId_Experimental].args
															.TbrButtonCls
													: 'toolbar-item')
										);
									}
									if (thisItem.isSeparator) {
										thisItem.set(
											'class',
											classOnWidget +
												' ' +
												(privateProps[this.propsId_Experimental].args
													.TbrSeparatorCls
													? privateProps[propsId].args.TbrSeparatorCls
													: 'toolbar-separator')
										);
									}

									toolbar.addChild(thisItem);
								}
							},
							this
						);
					}
				}

				//need place the svgFilter in DOM, in another way the filter will not work;
				var svgFilter = document.createElement('div');
				svgFilter.innerHTML =
					'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"><def><filter id="ToolBarGrayFilter"><feColorMatrix type="saturate" values="0" /></filter></def></svg>';
				svgFilter.style.width = 0;
				svgFilter.style.height = 0;
				svgFilter.style.display = 'none';
				privateProps[this.propsId_Experimental].contentPane.domNode.appendChild(
					svgFilter
				);
				toolbar.setAttribute(
					'class',
					privateProps[this.propsId_Experimental].args.ToolbarCls
						? privateProps[this.propsId_Experimental].args.ToolbarCls
						: 'toolbar'
				);
				privateProps[this.propsId_Experimental].currentToolBar = toolbar;

				//it is a trick for IE to properly display toolbar items.
				//toolbar items do not have correct width while toolbar.addChild execution in IE
				setTimeout(function () {
					toolbar._refresh();
				}, 0);
			}
		},

		showLabels: function ToolbarPublic_showLabels(isShow) {
			/// <summary>
			/// Display/hide labels on toolbar buttons.
			/// </summary>
			/// <param name="isShow" type="bool"></param>
			if (
				privateProps[this.propsId_Experimental].currentToolBar != null &&
				this._displayLabels !== isShow
			) {
				privateProps[this.propsId_Experimental].currentToolBar.showLabels(
					isShow
				);
			}
			privateProps[this.propsId_Experimental]._displayLabels = isShow;
		},

		show: function ToolbarPublic_show() {
			/// <summary>
			/// Displays first instance of the toolbar from toolbars collection.
			/// </summary>
			for (var i in privateProps[this.propsId_Experimental].toolBarsNode) {
				this.showToolbar(i);
				break;
			}
		},

		getId: function ToolbarPublic_getId() {
			/// <summary>
			/// Gets the identifier of the Toolbar object.
			/// </summary>
			/// <returns>string, Unique identifier of component</returns>
			var props = privateProps[this.propsId_Experimental];
			return props.currentToolBar.id.replace(props._saltTb_Experimental, '');
		},

		getItem: function ToolbarPublic_getItem(itemId) {
			/// <summary>
			/// Returns item with specified id.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>Aras.Client.Controls.Public.ToolbarItem</returns>
			var item = dijit.byId(
				privateProps[this.propsId_Experimental]._saltTbi_Experimental + itemId
			);
			return item
				? ToolbarItem({
						item: item,
						saltTbi_Experimental:
							privateProps[this.propsId_Experimental]._saltTbi_Experimental
				  })
				: null;
		},

		showItem: function ToolbarPublic_showItem(itemId) {
			/// <summary>
			/// If item with id is hidden, show it.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			var item = this.getItem(itemId)._item_Experimental;
			item.set('style', '');
			item.domNode.style.display = '';
			if (item.textLabel) {
				item.textLabel.style.display = '';
			}
			if (privateProps[this.propsId_Experimental].currentToolBar) {
				privateProps[this.propsId_Experimental].currentToolBar._refresh();
			}
		},

		hideItem: function ToolbarPublic_hideItem(itemId) {
			/// <summary>
			/// Item with specified id became invisible on toolbar.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			var item = this.getItem(itemId);
			item = item ? item._item_Experimental : null;
			if (!item) {
				return;
			}
			item.set('style', 'display: none');
			if (item.textLabel) {
				item.textLabel.style.display = 'none';
			}
			if (privateProps[this.propsId_Experimental].currentToolBar) {
				privateProps[this.propsId_Experimental].currentToolBar._refresh();
			}
		},

		getActiveToolbar: function ToolbarPublic_getActiveToolbar() {
			/// <summary>
			/// Returns current displayed toolbar.
			/// </summary>
			/// <returns>Aras.Client.Controls.Public.Toolbar (this)</returns>
			return this;
		},

		disable: function ToolbarPublic_disable() {
			/// <summary>
			/// Disable current toolbar so all controls became inactive.
			/// </summary>
			return this.setEnabled_Experimental(false);
		},

		enable: function ToolbarPublic_enable() {
			/// <summary>
			/// Enable toolbar, so all controls can respond to user interaction.
			/// </summary>
			return this.setEnabled_Experimental(true);
		},

		getButtonXY: function ToolbarPublic_getButtonXY(itemId) {
			/// <summary>
			/// Returns point from button center.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>string</returns>
			var item = this.getItem(itemId);
			if (!item) {
				return '';
			}
			var b = item.GetBounds();
			return b.left + b.width / 2 + ',' + (b.top + b.height / 2);
		},

		getButtonId: function ToolbarPublic_getButtonId(label) {
			/// <summary>
			/// Gets id for button with specified label.
			/// </summary>
			/// <param name="label" type="string"></param>
			/// <returns>string</returns>
			var arr = this.getItemIdsAsArr_Experimental();
			for (var i = 0; i < arr.length; i++) {
				var itemLabel = this.getButtonLabelById(arr[i]);
				if (itemLabel === label) {
					var item = this.getItem(arr[i]);
					return item.getId();
				}
			}
		},

		isButtonEnabled: function ToolbarPublic_isButtonEnabled(itemId) {
			/// <summary>
			/// Gets a value indicating whether the button can respond to user interaction.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>bool</returns>
			var item = this.getItem(itemId);
			return item == null ? false : item.getEnabled();
		},

		getButtonLabelById: function ToolbarPublic_getButtonLabelById(itemId) {
			/// <summary>
			/// Gets a label for button with specified id.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>string</returns>
			var item = this.getItem(itemId);
			return item ? item._item_Experimental.label : '';
		},

		isButtonVisible: function ToolbarPublic_isButtonVisible(itemId) {
			/// <summary>
			/// If toolbar width bigger that page width, some buttons can be invisible
			/// an be hidden by scroll buttons. So method will return true, if button with id visible to
			/// user, and false, if invisible.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>true</returns>
			return this.isItemVisible_Experimental(itemId);
		},

		getButtons: function ToolbarPublic_getButtons(separator) {
			/// <summary>
			/// Returns string containing all controls on toolbar divided by separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			return this.getItemIds_Experimental(separator);
		},

		getItemSize: function (itemId) {
			/// <summary>
			/// Returns width and height of the item delimited by comma.
			/// </summary>
			/// <param name="itemId" type="string"></param>
			/// <returns>string</returns>
			var item = document.getElementById(
				privateProps[this.propsId_Experimental]._saltTbi_Experimental + itemId
			);
			if (item && privateProps[this.propsId_Experimental].currentToolBar) {
				while (
					item.parentNode &&
					item.parentNode !=
						privateProps[this.propsId_Experimental].currentToolBar.domNode
				) {
					item = item.parentNode;
				}
				return item.offsetWidth + ',' + item.offsetHeight;
			}
			return false;
		},

		// === experimental methods region ========================
		refreshToolbar_Experimental: function () {
			if (privateProps[this.propsId_Experimental].currentToolBar) {
				privateProps[this.propsId_Experimental].currentToolBar._refresh();
			}
		},

		setEnabled_Experimental: function (isEnabled) {
			var tbi,
				i,
				arr = this.getItemIdsAsArr_Experimental();
			for (i in arr) {
				tbi = this.getItem(arr[i]);
				if (tbi) {
					tbi.setEnabled(isEnabled);
				}
			}
		},

		isItemVisible_Experimental: function (id) {
			var element = this.getItem(id);
			return element && element._item_Experimental
				? element._item_Experimental.get('style').indexOf('none') === -1
				: false;
		},

		getItemIdsAsArr_Experimental: function () {
			var currentToolbar =
					privateProps[this.propsId_Experimental].currentToolBar,
				idList = [];

			if (currentToolbar) {
				var dropDownItems = currentToolbar._dropDownToolBar
						? currentToolbar._dropDownToolBar.getChildren()
						: [],
					toolbarItems = currentToolbar.getChildren().concat(dropDownItems),
					saltPrefix =
						privateProps[this.propsId_Experimental]._saltTbi_Experimental,
					itemId,
					i;

				for (i = 0; i < toolbarItems.length; i++) {
					itemId = toolbarItems[i].get('id');
					idList.push(itemId.replace(saltPrefix, ''));
				}
			}

			return idList;
		},

		getItemIds_Experimental: function (separator) {
			return this.getItemIdsAsArr_Experimental().join(separator);
		},

		getCurrentToolBarDomNode_Experimental: function () {
			return privateProps[this.propsId_Experimental].currentToolBar.domNode;
		},

		addChoice_Experimental: function (itemId, itemLabel, options, index) {
			var styleItem =
					'height: 15px; font-size: 8pt;border-color: #6B6B6B; color: #6E6E6E;',
				newItem = new AdvancedToolBarSelect({
					id: itemId,
					style: styleItem,
					// prettier-ignore
					'class': 'aras_toolbar_input'
				}),
				iconNode = newItem.domNode.querySelectorAll('.dijitArrowButtonInner'),
				self = this,
				butttonNode,
				option,
				i;

			if (iconNode && iconNode.length > 0) {
				DomClass.add(iconNode[0], 'DropDownArrowButtonInner');
			}

			butttonNode = newItem.domNode.querySelectorAll('td.dijitDownArrowButton');
			if (butttonNode && butttonNode.length > 0) {
				butttonNode[0].style.border = '0px none';
			}

			if (options && options.length) {
				for (i = 0; i < options.length; i++) {
					option = options[i];
					newItem.addOption({
						value: option.value,
						label: option.label,
						selected: option.selected
					});
				}
			}

			if (itemLabel) {
				newItem.set('title', itemLabel);
			}

			connect.connect(newItem, 'onChange', function () {
				self.onChange(
					new ToolbarItem({
						item: this,
						saltTbi_Experimental:
							privateProps[self.propsId_Experimental]._saltTbi_Experimental
					})
				);
			});

			privateProps[this.propsId_Experimental].currentToolBar.addChild(
				newItem,
				index
			);
			return new ToolbarItem({
				item: newItem,
				saltTbi_Experimental:
					privateProps[this.propsId_Experimental]._saltTbi_Experimental
			});
		},

		addButton_Experimental: function (itemId, buttonConfig, index) {
			var isExistImage = !!buttonConfig.image,
				imageSRC = config.baseUrl + '../../cbin/' + buttonConfig.image,
				classImage = 'true' == buttonConfig.disabled ? 'grayImage' : '',
				imgStyle = {
					width: buttonConfig.width ? buttonConfig.width + 'px' : 'auto',
					height: buttonConfig.height ? buttonConfig.height + 'px' : 'auto',
					maxWidth: _buttonMaxWidth + 'px',
					maxHeight: _buttonMaxHeight + 'px',
					display: isExistImage ? '' : 'none'
				},
				self = this,
				newItem;

			if (buttonConfig.hasOwnProperty('checked')) {
				newItem = new ToolbarToogleButton({
					id: itemId,
					showLabel: isExistImage
						? privateProps[this.propsId_Experimental]._displayLabels
						: true,
					showTitle: false,
					checked: Boolean(buttonConfig.checked),
					label: buttonConfig.label,
					imageSrc: imageSRC,
					imageClass: classImage,
					imageStyle: imgStyle
				});
			} else {
				newItem = new ToolbarButton({
					id: itemId,
					showLabel: isExistImage
						? privateProps[this.propsId_Experimental]._displayLabels
						: true,
					showTitle: false,
					title: buttonConfig.tooltip
						? buttonConfig.tooltip
						: buttonConfig.label,
					label: buttonConfig.label,
					imageSrc: imageSRC,
					imageClass: classImage,
					imageStyle: imgStyle
				});
			}

			connect.connect(newItem, 'onClick', function () {
				self.onClick(
					new ToolbarItem({
						item: this,
						saltTbi_Experimental:
							privateProps[self.propsId_Experimental]._saltTbi_Experimental
					})
				);
			});

			privateProps[this.propsId_Experimental].currentToolBar.addChild(
				newItem,
				index
			);
			return new ToolbarItem({
				item: newItem,
				saltTbi_Experimental:
					privateProps[this.propsId_Experimental]._saltTbi_Experimental
			});
		},

		addSeparator_Experimental: function (itemId, index) {
			var newItem = new Separator({ id: itemId });

			newItem.isSeparator = true;
			newItem.setAttribute(
				'class',
				privateProps[this.propsId_Experimental].args.TbrSeparatorCls
					? privateProps[this.propsId_Experimental].args.TbrSeparatorCls
					: 'toolbar-separator'
			);

			privateProps[this.propsId_Experimental].currentToolBar.addChild(
				newItem,
				index
			);
			return new ToolbarItem({
				item: newItem,
				saltTbi_Experimental:
					privateProps[this.propsId_Experimental]._saltTbi_Experimental
			});
		},

		addTextBox_Experimental: function (itemId, textBoxConfig, index) {
			var self = this;
			var newItem = new AdvancedTextBox({
				id: itemId,
				value: textBoxConfig.text,
				textbox_type: textBoxConfig.textboxType
			});

			newItem.TextBox.style.width = textBoxConfig.size + 'em';
			newItem.TextBox.style.height = '15px';
			connect.connect(newItem, 'onChange', function () {
				self.onChange(
					new ToolbarItem({
						item: this,
						saltTbi_Experimental:
							privateProps[self.propsId_Experimental]._saltTbi_Experimental
					})
				);
			});
			connect.connect(newItem, 'onKeyDown', function (evt) {
				self.onKeyDown(
					new ToolbarItem({
						item: this,
						saltTbi_Experimental:
							privateProps[self.propsId_Experimental]._saltTbi_Experimental
					}),
					evt
				);
			});
			newItem.customStyle = 'padding:0px 10px; vertical-align:middle';
			newItem.set('title', textBoxConfig.tooltip);

			var placeholder = textBoxConfig.placeholder;
			if (placeholder) {
				newItem.setPlaceholder(placeholder);
			}

			privateProps[this.propsId_Experimental].currentToolBar.addChild(
				newItem,
				index
			);
			return new ToolbarItem({
				item: newItem,
				saltTbi_Experimental:
					privateProps[this.propsId_Experimental]._saltTbi_Experimental
			});
		},

		removeItem_Experimental: function (toolbarItem) {
			if (
				toolbarItem &&
				privateProps[this.propsId_Experimental].currentToolBar
			) {
				var targetItem = toolbarItem._item_Experimental || toolbarItem;

				privateProps[this.propsId_Experimental].currentToolBar.removeChild(
					targetItem
				);
				targetItem.destroyRecursive(true);
			}
		}
		//don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
