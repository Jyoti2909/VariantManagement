define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.UI.ToolbarParser', null, {
		_xml: null,
		_aras: null,
		_viewmodel: null,
		toolbarName: null,
		_presentationConfigurationId: null,
		_handler_code: null,

		constructor: function (args) {
			this._viewmodel = args.viewmodel;
			this._aras = args.aras;
			this._presentationConfigurationId =
				args.presentationConfigurationId ||
				'CC6D423887304F9F95ABF9FC7647DAC1'; /*TDF Default*/
			this.args = args;
			this.LoadXmlToParse(args.xml);
		},

		LoadXmlToParse: function (xml) {
			this._parseXmlToString(xml.selectSingleNode('//Item'));
		},

		GetInitXml: function () {
			return this._xml;
		},

		GetToolbarId: function () {
			return this.toolbarName;
		},

		GetHandelCode: function () {
			return this['_handler_code'];
		},

		GetSeparatorIds: function () {
			return this._separatorsIds;
		},

		_getAdditionalData: function (itemNode) {
			var data = itemNode.selectSingleNode('additional_data');
			if (data && data.text) {
				return JSON.parse(data.text);
			}
			return data;
		},

		_getDataProperty: function (item, propName, defaultValue) {
			return item ? item[propName] || defaultValue : defaultValue;
		},

		_parseXmlToString: function (commandBarItems /*IXMLDocument*/) {
			if (this._aras) {
				var aras = this._aras;
				var toolbarConfigDoc = aras.MetadataCache.GetPresentationConfiguration(
					this._presentationConfigurationId
				).results;
				var commandBarSectionDoc = toolbarConfigDoc.selectSingleNode(
					'/*/*/*/Item/Relationships/Item/related_id/Item/location[@keyed_name="' +
						this.args.toolbarContainerName +
						'"]'
				).parentNode;
				var toolbarData = this._getAdditionalData(commandBarSectionDoc);

				var initXml =
					'<toolbarapplet buttonstyle="{0}" buttonsize="{1}"><toolbar id="{2}">{3}</toolbar></toolbarapplet>';
				var btnsize = this._getDataProperty(toolbarData, 'tp_buttonsize', '');
				var btnstyle = this._getDataProperty(toolbarData, 'tp_buttonstyle', '');
				var toolbarId = aras.getItemProperty(commandBarSectionDoc, 'name');
				var separators = { counter: 0 };
				var jsHandlerMethodName = this._getDataProperty(
					toolbarData,
					'tp_handler'
				);
				var jsHandlerMethod;
				var btnXml = '';

				this.toolbarName = toolbarId || 'global';

				if (jsHandlerMethodName) {
					var methodNd = aras.MetadataCache.GetClientMethodNd(
						jsHandlerMethodName,
						'name'
					);
					if (methodNd) {
						var jsHandlerMethodCode = methodNd.selectSingleNode('method_code')
							.text;
						/* jshint -W054 */
						this['_handler_code'] = new Function(
							'viewmodel',
							'toolbar',
							jsHandlerMethodCode
						);
						/* jshint +W054 */
					}
				}

				initXml = initXml.replace('{0}', btnstyle);
				initXml = initXml.replace('{1}', btnsize);
				initXml = initXml.replace('{2}', toolbarId);

				var items = commandBarItems.selectNodes('//Item');
				for (var i = 0; i < items.length; i++) {
					var item = items[i];

					switch (item.getAttribute('type').toLowerCase()) {
						case 'commandbarbutton':
							btnXml += this._getButtonsInitXml(aras, item);
							break;
						case 'commandbardropdown':
							btnXml += this._getSelectionInitXml(aras, item);
							break;
					}

					var itemData = this._getAdditionalData(item);
					if (this._getDataProperty(itemData, 'tp_use_separator') === '1') {
						var itemName = aras.getItemProperty(item, 'name', '');

						btnXml += '<separator/>';
						separators.counter++;
						separators[itemName] = 'emptyId_' + separators.counter;
					}
				}

				initXml = initXml.replace('{3}', btnXml);
				this._xml = initXml;
				this._separatorsIds = separators;
			}
		},

		_getButtonsInitXml: function (aras, item) {
			var img = aras.getItemProperty(item, 'image', '');
			var id = aras.getItemProperty(item, 'name', '');
			var label = aras.getItemProperty(item, 'label', '');

			return (
				'<button image="../images/' +
				img +
				'" id="' +
				id +
				'" tooltip="' +
				label +
				'">' +
				label +
				'</button>'
			);
		},

		_getSelectionInitXml: function (aras, item) {
			var data = this._getAdditionalData(item);
			var width = aras.getItemProperty(item, 'width', 'auto');
			var id = aras.getItemProperty(item, 'name', '');
			var tooltip = aras.getItemProperty(item, 'tooltip_template', '');
			var label = aras.getItemProperty(item, 'label', '');
			var list = this._getDataProperty(data, 'tp_list');
			var listStr = '';
			var i;

			if (list) {
				list = aras.MetadataCache.GetList([list], []).results;
				var optionNodes = list.selectNodes('//Item[@type="Value"]');
				for (i = 0; i < optionNodes.length; i++) {
					var option = optionNodes[i];
					listStr +=
						'<choiceitem id="' +
						aras.getItemProperty(option, 'value') +
						'">' +
						aras.getItemProperty(option, 'label') +
						'</choiceitem><separator/>';
				}
			}

			return (
				'<choice width="' +
				width +
				'" id="' +
				id +
				'" tooltip="' +
				tooltip +
				'" text="' +
				label +
				'">' +
				listStr +
				'</choice>'
			);
		}
	});
});
