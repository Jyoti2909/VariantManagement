import { xmlToJson } from './XmlToJson';

const aml = {
	faultToJSON: function (xml) {
		if (xml && xml.firstChild && xml.firstChild.firstChild) {
			const result = xml.firstChild.firstChild.firstChild;
			const isFault =
				result && result.nodeName.toLowerCase() === 'soap-env:fault';

			if (isFault) {
				const obj = xmlToJson(result);
				delete obj['@attrs'];

				return obj;
			}
		}

		return null;
	}
};

export default aml;
