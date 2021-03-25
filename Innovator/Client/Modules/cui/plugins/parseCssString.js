const normalizeCSS = (css = '') => {
	css = css.trim();
	if (!css) {
		return '';
	}

	const trimKeys = '{}:;';
	css = trimKeys.split('').reduce((css, key) => {
		return css.replace(new RegExp('[\\s]*\\' + key + '[\\s]*', 'g'), key);
	}, css);
	return css;
};

const parseCssString = (cssString) => {
	cssString = normalizeCSS(cssString);

	const cssBlocks = cssString.match(/\..*?\}/g) || [];
	const stylesMap = cssBlocks.reduce((acc, cssBlock) => {
		const propertyName = cssBlock.match(/\..*(?=\{)/)[0].slice(1);
		const rules = cssBlock.match(/\{.*(?=\})/)[0].slice(1);
		let resultObject = {};
		rules.split(';').forEach((rule) => {
			if (!rule) {
				return;
			}

			rule = rule.split(':');
			resultObject[rule[0]] = rule[1];
		});

		if (acc.has(propertyName)) {
			resultObject = {
				...acc.get(propertyName),
				...resultObject
			};
		}
		acc.set(propertyName, resultObject);
		return acc;
	}, new Map());

	return stylesMap;
};

export default parseCssString;
