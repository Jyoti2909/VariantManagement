import notCertifiedBrowserDialog from '../dialogs/notCertifiedBrowser';

const storageKey = 'ArasAppUrlsKeys';
const getUrlsKeys = () => {
	const strArray = localStorage.getItem(storageKey);
	let array = [];
	try {
		if (strArray) {
			array = JSON.parse(strArray);
		}
	} catch (exp) {
		return array;
	}

	return array;
};

const getBaseUrl = () =>
	window.location.href.replace(/Client\/.*/i, 'Client').toLowerCase();
const addToLocalStorage = () => {
	const baseUrl = getBaseUrl();
	const arrayUrls = getUrlsKeys();

	if (!arrayUrls.includes(baseUrl)) {
		arrayUrls.push(baseUrl);
	}
	localStorage.setItem(storageKey, JSON.stringify(arrayUrls));
};
const keySessionStore = 'skipBrowserCertificationDialog';
const checkStorage = function () {
	if (sessionStorage.getItem(keySessionStore)) {
		return true;
	}
	return getUrlsKeys().includes(getBaseUrl());
};

const validateBrowserCertified = async function () {
	if (aras.Browser.isCertified() || checkStorage()) {
		return;
	}

	const rememberChoice = await notCertifiedBrowserDialog();
	if (rememberChoice) {
		addToLocalStorage();
	} else {
		sessionStorage.setItem(keySessionStore, true);
	}
};

export default validateBrowserCertified;
