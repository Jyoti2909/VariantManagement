function XmlUtils() {}

// provide simple way to create xml documents without specifing needed attributes each time
XmlUtils.createDocument = function XmlUtilsCreateDocument() {
	return new XmlDocument();
};

// value returned as xpath function concat(), ie addition quotes aren't needed
XmlUtils.escapeXPathStringCriteria = function XmlUtilsEscapeXPathStringCriteria(
	str
) {
	var res = str.replace(/'/g, "',\"'\",'");
	if (res != str) {
		return "concat('" + res + "')";
	} else {
		return "'" + res + "'";
	}
};
