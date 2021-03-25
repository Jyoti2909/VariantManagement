async function callOdataMethod(methodName, body) {
	const response = await ArasModules.fetch(
		aras.getServerBaseURL() + 'odata/method.' + methodName,
		{
			method: 'POST',
			body: JSON.stringify(body)
		}
	);
	const data = await response.json();
	const convertedResponse = typeof data !== 'string' ? data : JSON.parse(data);

	if (convertedResponse && convertedResponse.error) {
		throw convertedResponse;
	}

	return convertedResponse;
}

function sortFiles(files) {
	const resultMap = new Map();
	files.forEach((file) => {
		file.name = file.id;
		if (!resultMap.has(file.viewer.keyedName)) {
			resultMap.set(file.viewer.keyedName, new Map());
		}
		resultMap.get(file.viewer.keyedName).set(file.id, file);
	});
	return resultMap;
}

export default class SSVCDataManager {
	constructor(aras) {
		this.aras = aras;
		this.filesForViewing = new Map();
		this.ssvcFormViewSettings = {};
	}
	getFilesForViewing() {
		return this.filesForViewing;
	}
	getSsvcFormViewSettings() {
		return this.ssvcFormViewSettings;
	}
	async fetchFilesForViewing(itemTypeName, itemId) {
		const response = await callOdataMethod('VC_GetFilesForViewingForItem', {
			itemTypeName,
			itemId
		});
		this.filesForViewing = sortFiles(response || []);
		return this.filesForViewing;
	}

	async updateDataForItem(itemNode) {
		const itemId = itemNode.getAttribute('id');
		const itemTypeName = itemNode.getAttribute('type');
		const configId = this.aras.getItemProperty(itemNode, 'config_id');
		if (!(itemTypeName && itemId && configId)) {
			const emptySettings = {
				discussionPanel: false,
				formTooltip: ''
			};
			return emptySettings;
		}

		const isNew = this.aras.isNew(itemNode);
		const emptyMap = new Map();
		const errors = {};
		const results = await Promise.all([
			(!isNew &&
				this.fetchFilesForViewing(itemTypeName, itemId).catch(
					(err) => (errors.files = err)
				)) ||
				Promise.resolve(emptyMap),
			this.fetchSsvcFormViewSettings(itemTypeName, itemId, configId).catch(
				(err) => (errors.settings = err)
			)
		]);

		this.filesForViewing = errors.files ? emptyMap : results[0] || emptyMap;
		this.ssvcFormViewSettings = errors.settings ? {} : results[1] || {};

		if (errors.files && errors.settings) {
			throw new Error('Errors occurred during update data for SSVC.');
		}
		if (errors.files) {
			const errorMessage = errors.files?.error?.message;
			return Promise.reject(errorMessage || errors.files);
		}
		if (errors.settings) {
			const errorMessage = errors.settings?.error?.message;
			return Promise.reject(errorMessage || errors.settings);
		}
	}
	async fetchSsvcFormViewSettings(itemTypeName, itemId, configId) {
		const itemType = this.aras.getItemTypeForClient(itemTypeName);
		const itemTypeId = itemType.getID();
		const response = await ArasModules.fetch(
			aras.getServerBaseURL() +
				"odata/Method('" +
				itemId +
				"')/method.VC_GetSSVCPresentConfiguration",
			{
				method: 'POST',
				body: JSON.stringify({
					client: 'js',
					item_type_id: itemTypeId,
					item_type_name: itemTypeName,
					item_config_id: configId
				})
			}
		);
		const settingsResult = await response.json();
		const discussionPanel =
			settingsResult.Item['discussion_panel_behavior'] === 'discPanelOn';
		const formTooltip = settingsResult?.Item['form_tooltip_template']
			? settingsResult.Item['form_tooltip_template']['#text']
			: '';

		const settings = {
			discussionPanel: discussionPanel,
			formTooltip: formTooltip
		};

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
	}
}
