define([], function () {
	/**
	 * @typedef MessageControlViewSettings
	 * @type Object
	 * @property {string} itemTypeIcon
	 * @property {string} style
	 */

	/**
	 * @typedef SsvcFormViewSettings
	 * @type Object
	 * @property {boolean} discussionPanel
	 * @property {string} formTooltip
	 */

	const ViewSettingsManager = (function () {
		/**
		 * @param {{aras: Object}} args
		 * @constructor
		 */
		function ViewSettingsManager(args) {
			this.aras = args.aras;
		}
		/**
		 * @param {{itemTypeName: string}} args
		 * @returns {MessageControlViewSettings}
		 */
		ViewSettingsManager.prototype.getMessageControlViewSettings = function (
			args
		) {
			const itemTypeItem = this.aras.getItemTypeForClient(args.itemTypeName);
			const itemTypeIconUrl = this.getItemTypeIconUrl(itemTypeItem);
			const style = this.getStyle(itemTypeItem);
			const settings = {
				itemTypeIcon: itemTypeIconUrl,
				style: style
			};
			return settings;
		};
		/**
		 * @param {{itemTypeName: string}} args
		 * @returns {MessageControlViewSettings}
		 */
		ViewSettingsManager.prototype.getSsvcFormViewSettings = function (args) {
			const _this = this;
			return Promise.resolve()
				.then(function () {
					if (!(args && args.itemTypeName && args.itemId && args.configId)) {
						const emptySettings = {
							discussionPanel: false,
							formTooltip: ''
						};
						return emptySettings;
					}
					return _this.fetchSsvcFormViewSettings(
						args.itemTypeName,
						args.itemId,
						args.configId
					);
				})
				.then(function (settings) {
					const globalState = sessionStorage.getItem('defaultDState');
					if (globalState && globalState !== 'defaultDState') {
						switch (globalState) {
							case 'onDState':
								settings.discussionPanel = true;
								break;
							case 'offDState':
								settings.discussionPanel = false;
								break;
						}
					}
					return settings;
				});
		};
		ViewSettingsManager.prototype.getItemTypeIconUrl = function (itemTypeItem) {
			const itemTypeIconRelativeUrl = itemTypeItem.getProperty(
				'open_icon',
				'../Images/DefaultItemType.svg'
			);
			const itemTypeIconUrl = this.aras.getScriptsURL(itemTypeIconRelativeUrl);
			return itemTypeIconUrl;
		};
		ViewSettingsManager.prototype.getStyle = function (itemTypeItem) {
			const itemTypeName = itemTypeItem.getProperty('name');
			const itemTypeColor = this.aras.getItemTypeColor(itemTypeName, 'name');
			return 'background-color:' + itemTypeColor;
		};
		ViewSettingsManager.prototype.getItemTypePresentationConfigurationItem = function (
			itemTypeItem
		) {
			let presentationConfiguration = null;
			const configs = itemTypeItem.getItemsByXPath(
				"Relationships/Item[@type='ITPresentationConfiguration']"
			);
			for (let i = 0; i < configs.getItemCount(); i++) {
				const config = configs.getItemByIndex(i);
				if (this.aras.getItemProperty(config.node, 'client') === 'js') {
					presentationConfiguration = config.getItemsByXPath('related_id/Item')
						.node;
					break;
				}
			}
			return presentationConfiguration;
		};
		ViewSettingsManager.prototype.fetchSsvcFormViewSettings = function (
			itemTypeName,
			itemId,
			configId
		) {
			const _this = this;
			return Promise.resolve()
				.then(function () {
					const itemType = _this.aras.getItemTypeForClient(itemTypeName);
					const itemTypeId = itemType.getID();
					const getSsvcPresentConfigurationQuery = ArasModules.jsonToXml({
						Item: {
							'@attrs': {
								type: 'Method',
								action: 'VC_GetSSVCPresentConfiguration',
								id: itemId
							},
							client: 'js',
							item_type_id: itemTypeId,
							item_type_name: itemTypeName,
							item_config_id: configId
						}
					});
					return ArasModules.soap(getSsvcPresentConfigurationQuery, {
						async: true
					});
				})
				.then(function (xmlItem) {
					return ArasModules.xmlToJson(xmlItem);
				})
				.then(function (jsonItem) {
					return {
						discussionPanelBehavior: jsonItem.Item['discussion_panel_behavior'],
						formTooltip: jsonItem.Item['form_tooltip_template']
							? jsonItem.Item['form_tooltip_template']['@value']
							: ''
					};
				})
				.then(function (presentConfiguration) {
					const discussionPanel =
						presentConfiguration.discussionPanelBehavior === 'discPanelOn' ||
						false;
					const formTooltip = presentConfiguration.formTooltip || '';
					const settings = {
						discussionPanel: discussionPanel,
						formTooltip: formTooltip
					};
					return settings;
				});
		};
		return ViewSettingsManager;
	})();
	return ViewSettingsManager;
});
