define([
	'dojo/_base/declare',
	'SSVC/Scripts/Controls/AttachControl',
	'SSVC/Scripts/Utils'
], function (declare, AttachControl, ssvcUtils) {
	const clearFileInput = function () {
		this.domNode.removeChild(this.input);
		this.input = this.input.cloneNode(true);
		this.domNode.appendChild(this.input);
		this.input.onchange = loadFileHandler.bind(this);
		this.input.onclick = function () {
			this.value = '';
		};
	};

	const validateFileType = function (fileType) {
		let isValid = true;
		const acceptableFileTypes = this.validationFileTypes.split(/, ?/g);

		if (acceptableFileTypes.indexOf(fileType) === -1) {
			isValid = false;
			clearFileInput.apply(this);
			aras.AlertWarning(ssvcUtils.GetResource('wrong_file_type'));
		}

		return isValid;
	};

	var loadFileHandler = function (event) {
		const self = this;
		const file = event.target.files[0];

		if (file) {
			const isValid = validateFileType.call(self, file.type);

			if (!isValid) {
				return;
			}

			const reader = new FileReader();

			reader.onload = function (event) {
				self.onClick(event.target.result);
				clearFileInput.apply(self);
			};
			reader.readAsDataURL(file);
		}
	};

	return declare([AttachControl], {
		input: null,
		label: null,
		domNode: null,
		validationFileTypes: null,
		onClick: function () {},

		constructor: function (title, cssClass) {
			this.domNode = document.createElement('span');
			this.domNode.classList.add(cssClass);
			this.input = document.createElement('input');
			this.label = document.createElement('span');
			this.label.textContent = title;
			this.label.classList.add('attachLabel');
			this.domNode.appendChild(this.label);

			this.input.classList.add('attachInput');
			this.input.setAttribute('type', 'file');
			this.domNode.appendChild(this.input);
			this.input.onchange = loadFileHandler.bind(this);

			this.setAcceptableFileTypes('image/*');
			this.setValidationFileTypes(
				'image/png, image/gif, image/jpg, image/jpeg'
			);
		},

		setAcceptableFileTypes: function (fileTypes) {
			this.input.setAttribute('accept', fileTypes);
		},

		setValidationFileTypes: function (fileTypes) {
			this.validationFileTypes = fileTypes;
		}
	});
});
