export function appendButton(
	btnContainer,
	btnText,
	btnModifier,
	clickHandler,
	options
) {
	const dialogButton = createButton(
		btnText,
		btnModifier,
		clickHandler,
		options
	);

	btnContainer.appendChild(dialogButton);

	return dialogButton;
}

export function createButton(btnText, btnModifier, clickHandler, options = {}) {
	const { autofocus, disabled } = options;

	return HyperHTMLElement.hyper`
		<button
			disabled="${disabled}"
			autofocus="${autofocus}"
			class="${`aras-button ${btnModifier}`}"
			onclick=${clickHandler}
		>
			<span
				class="aras-button__text"
			>
				${btnText}
			</span>
		</button>
	`;
}
