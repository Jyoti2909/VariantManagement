const sunday = 0;
const monday = 1;
const saturday = 6;
const firstDayOfWeek = {
	'ar-DZ': sunday,
	'ar-KW': sunday,
	'ar-LY': saturday,
	'ar-MA': saturday,
	'ar-SA': sunday,
	'bn-BD': sunday,
	'bn-IN': sunday,
	'bo-CN': sunday,
	'dv-MV': sunday,
	'en-AU': sunday,
	'en-CA': sunday,
	'en-IL': sunday,
	'en-US': sunday,
	'es-US': sunday,
	'fa-IR': saturday,
	'fr-CA': sunday,
	'gu-IN': sunday,
	'hi-IN': sunday,
	'id-ID': sunday,
	'ja-JP': sunday,
	'kn-IN': sunday,
	'mr-IN': sunday,
	'ne-NP': sunday,
	'pa-IN': sunday,
	'ta-IN': sunday,
	'te-IN': sunday,
	'tzm-Latn-DZ': saturday
};

export default (locale) => firstDayOfWeek[locale] ?? monday;
