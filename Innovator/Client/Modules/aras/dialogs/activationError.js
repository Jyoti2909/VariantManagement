import Dialog from '../../core/Dialog';
import getResource from '../../core/resources';
import { createButton } from '../../components/dialogCommonApi';
import copyTextToBuffer from '../../core/copyTextToBuffer';
import { xmlToJson } from '../../core/XmlToJson';

export default (data) => {
	const title = getResource('licensing.service_not_available_title');
	const classList = 'aras-dialog-activation-error';
	const dialog = new Dialog('html', { title, classList });
	const copyButtonLabel = getResource('licensing.copy_system_info');
	const copyButton = createButton(
		copyButtonLabel,
		'aras-button_primary-light aras-buttons-bar__button',
		() => copyTextToBuffer(data, copyButton.parentElement)
	);
	const okButtonLabel = getResource('common.ok');
	const okButton = createButton(okButtonLabel, 'aras-button_primary', () =>
		dialog.close()
	);
	const propNameToLabelMap = {
		framework_license_key: 'licensing.framework_license_key',
		innovator_server_name: 'licensing.innovator_server_name',
		innovator_server_locale: 'licensing.innovator_server_locale',
		mac_address: 'licensing.mac_address',
		database_server_name: 'licensing.database_server_name',
		database_engine_edition: 'licensing.database_engine_edition',
		activation_key: 'licensing.activation_key'
	};
	const jsonData = xmlToJson('<data>' + data + '</data>').data;
	const serviceInfoNodes = Object.entries(propNameToLabelMap).reduce(
		(nodes, [propertyName, labelResource]) => {
			const value = jsonData[propertyName];
			if (!value) {
				return nodes;
			}

			const label = getResource(labelResource);
			const rowNode = HyperHTMLElement.hyper`
				<div class="${classList}__row">
					<span class="${classList}__label">${label}</span>
					<span class="${classList}__value">${value}</span>
				</div>
			`;
			nodes.push(rowNode);

			return nodes;
		},
		[]
	);

	const message = getResource('licensing.service_not_available');
	const messageParts = message.split('{SUBSCRIBER_PORTAL}');
	const messageBeforeLink = messageParts[0];
	const messageAfterLink = messageParts[1];
	const linkText = getResource('licensing.subscriber_portal');
	const linkNode = HyperHTMLElement.hyper`<a class="aras-link_a" href="https://www.aras.com/support/LicenseKeyService/featurelicenserequest.aspx" target="_blank">${linkText}</a>`;

	HyperHTMLElement.hyper(dialog.contentNode)`
		<span class="${classList}__message">${messageBeforeLink}${linkNode}${messageAfterLink}</span>
		${serviceInfoNodes}
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${copyButton}
			${okButton}
		</div>
	`;

	dialog.show();

	return dialog.promise;
};
