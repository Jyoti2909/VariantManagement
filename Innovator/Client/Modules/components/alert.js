import Dialog from '../core/Dialog';
import { appendButton } from './dialogCommonApi';
import xml from '../core/Xml';
import copyTextToBuffer from '../core/copyTextToBuffer';
import sanitizeHTML from './DOMPurifyWrapper';
import SvgManager from '../core/SvgManager';

const images = {
	error: '../images/Error.svg',
	message: '../images/Message.svg',
	warning: '../images/Warning.svg'
};

SvgManager.enqueue(Object.values(images));

function descriptionContainerClickListener(event) {
	const cssClass = 'aml-description';
	let clicableRow;
	if (
		event.target.parentElement.classList.contains(cssClass + '__clicable-row')
	) {
		clicableRow = event.target.parentElement;
	} else if (event.target.classList.contains(cssClass + '__clicable-row')) {
		clicableRow = event.target;
	} else {
		return;
	}
	const tagBlocks = clicableRow.nextElementSibling.children;
	const link = clicableRow.querySelector('.' + cssClass + '__plus-or-minus');
	link.textContent = link.textContent === '+' ? '-' : '+';
	Array.prototype.forEach.call(tagBlocks, function (itemForTogle) {
		if (itemForTogle.classList.contains(cssClass + '__tag-block')) {
			itemForTogle.classList.toggle('aras-hide');
		}
	});
}

function getAlertTitle(type) {
	switch (type) {
		case 'warning':
			return aras.getResource('', 'common.warning');
		case 'success':
			return aras.getResource('', 'aras_object.aras_innovator');
		default:
			return aras.getResource('', 'aras_object.error');
	}
}

const stackAndTechnicalMessageType = {
	get img() {
		return images.error;
	},
	copyCustomizator: function (copyButton, message, alertOptions) {
		let textMessage = message + ' ';
		textMessage += alertOptions.technicalMessage + ' ';
		textMessage += alertOptions.stackTrace;

		copyButton.addEventListener(
			'click',
			function () {
				copyTextToBuffer(this.text, this.container);
			}.bind({ text: textMessage, container: copyButton.parentElement })
		);
	},

	descriptionCustomizator: function (
		descriptionContainer,
		message,
		alertOptions
	) {
		const cssClassName = 'aras-dialog-alert__container';
		descriptionContainer.classList.add(cssClassName + '-dark');

		const firstConatiner = document.createElement('div');
		const secondConatiner = document.createElement('div');

		let titleBlock = document.createElement('span');
		titleBlock.textContent = aras.getResource(
			'',
			'aras_object.technical_message'
		);
		titleBlock.classList.add('aras-dialog-alert__title');

		let textBlock = document.createElement('span');
		textBlock.classList.add('aras-dialog-alert__text-description');
		textBlock.textContent = alertOptions.technicalMessage;

		firstConatiner.appendChild(titleBlock);
		firstConatiner.appendChild(textBlock);

		descriptionContainer.appendChild(firstConatiner);

		titleBlock = document.createElement('span');
		titleBlock.textContent = aras.getResource('', 'aras_object.stack_trace');
		titleBlock.classList.add('aras-dialog-alert__title');

		textBlock = document.createElement('span');
		textBlock.classList.add('aras-dialog-alert__text-description');
		textBlock.textContent = alertOptions.stackTrace;

		secondConatiner.appendChild(titleBlock);
		secondConatiner.appendChild(textBlock);

		descriptionContainer.appendChild(secondConatiner);
	}
};

const soapResultType = {
	get img() {
		return images.error;
	},
	messageCustomizator: function (messageNode, message, alertOptions) {
		if (alertOptions.data.getParseError()) {
			messageNode.textContent = aras.getResource(
				'',
				'aras_object.invalid_soap_message'
			);
		} else {
			const faultString = alertOptions.data.getFaultString();
			const faultFragment = sanitizeHTML(faultString);
			messageNode.appendChild(faultFragment);
		}
	},

	copyCustomizator: function (copyButton, message, alertOptions) {
		copyButton.addEventListener(
			'click',
			function () {
				copyTextToBuffer(this.text, this.container);
			}.bind({
				text: alertOptions.data.resultsXML,
				container: copyButton.parentElement
			})
		);
	},

	descriptionCustomizator: function (
		descriptionContainer,
		message,
		alertOptions
	) {
		const xsldoc = aras.createXMLDocument();
		xsldoc.load(aras.getBaseURL() + '/styles/amlDescription.xsl');
		descriptionContainer.innerHTML = xml.transform(
			alertOptions.data.results,
			xsldoc
		);

		descriptionContainer.addEventListener(
			'click',
			descriptionContainerClickListener
		);
	}
};

const iomInfoType = {
	get img() {
		return images.error;
	},
	messageCustomizator: function (messageNode, message, alertOptions) {
		const errorString = alertOptions.data.getErrorString();
		const errorFragment = sanitizeHTML(errorString);
		messageNode.appendChild(errorFragment);
	},

	copyCustomizator: function (copyButton, message, alertOptions) {
		copyButton.addEventListener(
			'click',
			function () {
				copyTextToBuffer(this.text, this.container);
			}.bind({
				text: alertOptions.data.dom.xml,
				container: copyButton.parentElement
			})
		);
	},

	descriptionCustomizator: function (
		descriptionContainer,
		message,
		alertOptions
	) {
		const xsldoc = aras.createXMLDocument();
		xsldoc.load(aras.getBaseURL() + '/styles/amlDescription.xsl');
		descriptionContainer.innerHTML = xml.transform(
			alertOptions.data.dom,
			xsldoc
		);

		descriptionContainer.addEventListener(
			'click',
			descriptionContainerClickListener
		);
	}
};

const infoAboutAlertTypes = {
	warning: {
		get img() {
			return images.warning;
		}
	},
	error: {
		get img() {
			return images.error;
		}
	},
	success: {
		img: images.message
	},
	soap: soapResultType,
	stack: stackAndTechnicalMessageType,
	iom: iomInfoType
};

function alertModule(message = '', options = {}) {
	const { customization, type } = options;
	const defaultTypeAlert =
		infoAboutAlertTypes[type] || infoAboutAlertTypes.error;
	const curentTypeAlert = {
		title: getAlertTitle(type),
		...defaultTypeAlert,
		...customization
	};

	const alertDialog = new Dialog('html', {
		title: curentTypeAlert.title
	});

	const cssClassName = 'aras-dialog-alert';
	alertDialog.dialogNode.classList.add(cssClassName);

	const messageContainer = document.createElement('div');
	messageContainer.classList.add(cssClassName + '__container');
	alertDialog.contentNode.appendChild(messageContainer);

	const image = SvgManager.createHyperHTMLNode(curentTypeAlert.img, {
		class: `${cssClassName}__img`
	});
	messageContainer.appendChild(image);

	const messageNode = document.createElement('span');
	messageNode.classList.add(cssClassName + '__text');
	if (curentTypeAlert.messageCustomizator) {
		curentTypeAlert.messageCustomizator(messageNode, message, options);
	} else {
		const messageFragment = sanitizeHTML(message);
		messageNode.appendChild(messageFragment);
	}
	messageContainer.appendChild(messageNode);

	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add(cssClassName + '__container');

	appendButton(
		buttonContainer,
		aras.getResource('', 'common.ok'),
		'aras-button_primary aras-button_right',
		alertDialog.close.bind(alertDialog, null),
		{ autofocus: true }
	);

	alertDialog.contentNode.appendChild(buttonContainer);

	let buttonCopy;

	if (curentTypeAlert.descriptionCustomizator) {
		const showTxt = aras.getResource('', 'aras_object.show_details');
		const hideTxt = aras.getResource('', 'aras_object.hide_details');

		const descriptionContainer = document.createElement('div');
		descriptionContainer.classList.add(
			cssClassName + '__container',
			cssClassName + '__container-aml',
			'aras-hide'
		);

		appendButton(
			buttonContainer,
			showTxt,
			'aras-button_b-primary aras-button_right',
			function (e) {
				if (!this.container.hasChildNodes()) {
					curentTypeAlert.descriptionCustomizator(
						this.container,
						message,
						options
					);
				}
				const button = e.target.closest('button');
				const isHidden = this.container.classList.contains('aras-hide');
				button.firstElementChild.text = isHidden ? this.hideTxt : this.showTxt;
				buttonCopy.style.display = isHidden ? 'inline-block' : 'none';
				this.container.classList.toggle('aras-hide');
			}.bind({
				container: descriptionContainer,
				showTxt: showTxt,
				hideTxt: hideTxt
			})
		);

		alertDialog.contentNode.appendChild(descriptionContainer);
	}

	if (curentTypeAlert.copyCustomizator) {
		buttonCopy = appendButton(
			buttonContainer,
			aras.getResource('', 'aras_object.copy_buffer'),
			'aras-button_primary-light'
		);
		buttonCopy.style.display = 'none';
		curentTypeAlert.copyCustomizator(buttonCopy, message, options);
	}

	alertDialog.show();
	return alertDialog.promise;
}

export default alertModule;
