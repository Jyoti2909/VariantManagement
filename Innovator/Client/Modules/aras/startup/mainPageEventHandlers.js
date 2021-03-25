import validateBrowserCertified from './validateBrowserCertified';
import disabledCookiesDialog from '../dialogs/disabledCookies';
import getTimeZoneName from './getTimeZoneName';
import login from './login';

function onBeforeUnloadHandler() {
	const tabsContainer = window.mainLayout && window.mainLayout.tabsContainer;

	if (aras.getCommonPropertyValue('exitInProgress') === true) {
		return;
	}

	if (aras.isDirtyItems()) {
		window.onLogoutCommand();
		return 'Changes you made may not be saved.';
	} else if (
		tabsContainer &&
		tabsContainer.isExistAnyTabs() &&
		aras.getCommonPropertyValue('exitWithoutSavingInProgress') !== true
	) {
		return 'Changes you made may not be saved.';
	}
}
async function onLoadHandler() {
	if (!navigator.cookieEnabled) {
		await disabledCookiesDialog();
	}

	await validateBrowserCertified();

	try {
		const timeZoneName = await getTimeZoneName();
		aras.setCommonPropertyValue('systemInfo_CurrentTimeZoneName', timeZoneName);
		await login();
	} catch (e) {
		aras.AlertError(e.message);
	}
	aras.setWindowLangAttribute(window);
}
function onUnloadHandler() {
	if (!window.aras) {
		return;
	}
	aras.setCommonPropertyValue('exitInProgress', true);
	aras.getOpenedWindowsCount(true);
	aras.logout();
}

export default { onBeforeUnloadHandler, onLoadHandler, onUnloadHandler };
