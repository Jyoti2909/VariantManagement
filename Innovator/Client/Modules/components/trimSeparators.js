// @flow
import type { ToolbarItemT } from './toolbar';

const trimSeparators = (
	data: Map<string, ToolbarItemT>,
	items: string[]
): string[] => {
	if (!items.length) {
		return items;
	}

	let lastOfTypeSeparator = true;
	const result = items.filter((id) => {
		const item: ?ToolbarItemT = data.get(id);

		if (!item || item.hidden) {
			return false;
		}

		const isSeparator = item.type === 'separator';
		const result = isSeparator ? lastOfTypeSeparator === false : true;
		lastOfTypeSeparator = isSeparator;
		return result;
	});

	if (lastOfTypeSeparator) {
		result.pop();
	}
	return result;
};

export default trimSeparators;
