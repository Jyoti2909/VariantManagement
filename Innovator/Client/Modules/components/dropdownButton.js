function dropdownButton(container, options) {
	if (!container) {
		return false;
	}
	options = options || {};
	const dropdownBox =
		container.querySelector('.aras-dropdown') || container.lastElementChild;
	const buttonNode =
		container.querySelector(options.buttonSelector) ||
		dropdownBox.previousElementSibling;
	const list = dropdownBox.querySelector('ul');

	if (!(buttonNode && dropdownBox && list)) {
		return false;
	}

	dropdownBox.style.minWidth = list.style.minWidth = '100%';
	dropdownBox.style.boxSizing = list.style.boxSizing = 'border-box';
	return true;
}

export default dropdownButton;
