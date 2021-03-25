const legacyKeywords = ['cui_disabled', 'cui_style', 'cui_visible', 'inArgs'];

export function isLegacyMethod(code) {
	return legacyKeywords.some((keyword) => code.includes(keyword));
}

function dispatchCommandBarChangedEvent(details) {
	const event = new CustomEvent('commandBarChanged');
	Object.assign(event, details);
	document.dispatchEvent(event);
}

export function executeLegacyMethod(methodId, code, context) {
	const method = new Function('inDom', 'inArgs', code); // jshint ignore:line
	const inArgs = {
		...context,
		control: context.target
	};
	const result = method(null, inArgs);
	if (result) {
		const displayNone = result['cui_style'] === 'display: none';
		const hidden = result['cui_visible'] === false || displayNone;
		const disabled = result['cui_disabled'] === true;
		Object.assign(result, { disabled, hidden });
	}

	if (!result?.['cui_event_sent']) {
		const isClickMethod = methodId === context.target.on_click_handler;
		if (isClickMethod) {
			const eventDetails = {
				changeType: 'click',
				commandBarTarget: context.target.id,
				locationName: context.location
			};
			dispatchCommandBarChangedEvent(eventDetails);
		}
	}

	return result;
}

export default { executeLegacyMethod, isLegacyMethod };
