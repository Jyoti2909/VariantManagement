/* global ResourceManager, Solution */
export default function (
	solution,
	resourceName = 'ui_resources.xml',
	language = navigator.language
) {
	return new ResourceManager(new Solution(solution), resourceName, language);
}
