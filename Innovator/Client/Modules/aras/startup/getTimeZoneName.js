import selectTimeZoneDialog from '../dialogs/selectTimeZone';
import getResourceManager from '../startup/getResourceManager';

const setTimeZoneNameInLocalStorage = (tzLabel, winTzName) => {
	const tzOffset = -1 * new Date().getTimezoneOffset();
	const timeZones = {};
	timeZones[tzOffset + tzLabel] = winTzName;
	localStorage.setItem('timeZone', JSON.stringify(timeZones));
};

const getTimeZoneName = async () => {
	const resourceManager = getResourceManager('core');
	let tzLabel;

	try {
		tzLabel = new Intl.DateTimeFormat().resolvedOptions().timeZone || '';
	} catch (ex) {
		tzLabel = '';
	}

	const tzOffset = -1 * new Date().getTimezoneOffset();
	let timeZones = {};

	try {
		timeZones = JSON.parse(localStorage.getItem('timeZone'));
	} catch (e) {
		timeZones = {};
	}

	const winTzName = timeZones?.[tzOffset + tzLabel];
	if (winTzName) {
		return winTzName;
	}

	const inputType = tzLabel ? 'iana' : 'windows';
	const localTime = new Date().toISOString();
	const localTimeOffset = (-1 * new Date().getTimezoneOffset()).toString();

	const url = new URL(aras.getBaseURL() + '/TimeZone/GetTimezoneNames');
	url.searchParams.set('tzlabel', tzLabel);
	url.searchParams.set('inputType', inputType);
	url.searchParams.set('localTime', localTime);
	url.searchParams.set('offsetBetweenLocalTimeAndUTCTime', localTimeOffset);

	const tzRequest = await (await fetch(url)).json();
	const winTzNames = tzRequest.map(({ id }) => id);

	if (winTzNames.length === 0) {
		throw new Error(resourceManager.getString('tz.get_currentzone_fail'));
	} else if (winTzNames.length === 1) {
		setTimeZoneNameInLocalStorage(tzLabel, winTzNames[0]);
		return winTzNames[0];
	}

	return selectTimeZoneDialog(winTzNames).then((value) => {
		setTimeZoneNameInLocalStorage(tzLabel, value);
		return value;
	});
};

export default getTimeZoneName;
