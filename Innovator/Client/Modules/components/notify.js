import SvgManager from '../core/SvgManager';

const defaultOptions = {
	timeout: 3000,
	position: 'top-right',
	type: 'info'
};

const images = {
	error: '../images/ToastError.svg',
	info: '../images/ToastInfo.svg',
	success: '../images/ToastSuccess.svg',
	warning: '../images/ToastWarning.svg'
};

SvgManager.enqueue(Object.values(images));

const notifyes = new WeakMap();

function notify(message, options) {
	if (!message) {
		return false;
	}

	const settings = Object.assign(
		{},
		defaultOptions,
		{ container: document.body },
		options
	);

	const { position, type } = settings;
	const notification = HyperHTMLElement.hyper`
		<div class="aras-notify__notification-container aras-notify__notification-container_visible">
			<div
				class="${
					'aras-notification' +
					(type === 'info' ? '' : ' aras-notification_' + type)
				}"
			>
				${SvgManager.createHyperHTMLNode(images[type] || images[defaultOptions.type], {
					class: 'aras-notification__icon'
				})}
				<span class="aras-notification__message">${message}</span>
			</div>
		</div>
	`;

	if (!notifyes.has(settings.container)) {
		notifyes.set(settings.container, {
			'bottom-left': null,
			'bottom-right': null,
			'top-left': null,
			'top-right': null
		});
	}
	const notifyObjects = notifyes.get(settings.container);

	notifyObjects[position] =
		notifyObjects[position] ||
		HyperHTMLElement.hyper`
			<div class="${'aras-notify aras-notify_' + position}" />
		`;

	if (!notifyObjects[position].parentElement) {
		settings.container.appendChild(notifyObjects[position]);
	}

	const direction = position.split('-')[0];
	if (direction === 'bottom') {
		notifyObjects[position].insertBefore(
			notification,
			notifyObjects[position].firstElementChild
		);
	} else {
		notifyObjects[position].appendChild(notification);
	}

	const timeoutHandler = function () {
		notification.classList.remove(
			'aras-notify__notification-container_visible'
		);
		if (direction === 'bottom') {
			notification.style.marginBottom = -notification.offsetHeight + 'px';
		} else {
			notification.style.marginTop = -notification.offsetHeight + 'px';
		}
		notification.addEventListener('transitionend', function (e) {
			if (notification.parentNode) {
				notification.parentNode.removeChild(notification);
			}
			if (notifyObjects[position] && !notifyObjects[position].children.length) {
				settings.container.removeChild(notifyObjects[position]);
				notifyObjects[position] = null;
			}
		});
	};

	const timeout = setTimeout(timeoutHandler, settings.timeout);
	notification.addEventListener('click', function clickHandler(e) {
		clearTimeout(timeout);
		timeoutHandler();
		notification.removeEventListener('click', clickHandler);
	});

	return true;
}

export default notify;
