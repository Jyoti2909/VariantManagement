define(['dojo/_base/declare'], function (declare) {
	return declare('MessageContentConverter', [], {
		constructor: function () {}, // added for test otherwise define mock is throwing stackoverflow
		parseFromHtml: function (textContainer) {
			let resultText = '';
			for (let i = 0; i < textContainer.childNodes.length; i++) {
				const child = textContainer.childNodes[i];
				if (child.nodeName === 'P') {
					resultText += this.parseFromHtml(child);
					if (child.nextSibling) {
						resultText += '\r\n';
					}
					continue;
				}
				if (child.nodeName === '#text') {
					resultText += child.nodeValue;
					continue;
				}
				if (child.nodeName === 'SPAN') {
					if (child.classList.contains('userRef')) {
						const userId = child.getAttribute('user_id');
						const label = child.textContent;
						resultText +=
							'<user_ref user_id="' + userId + '" label="' + label + '" />';
					}
					continue;
				}
			}
			return resultText;
		},

		_convertIntoHtml: function (comment, commentToHtmlConverter) {
			if (!comment || !commentToHtmlConverter) {
				return comment;
			}

			comment = comment.replace(new RegExp('<', 'g'), '&lt;');
			comment = comment.replace(new RegExp('>', 'g'), '&gt;');
			while (true) {
				if (comment.indexOf('&lt;user_ref') > -1) {
					const startIndex = comment.indexOf('&lt;user_ref');
					const endIndex = comment.indexOf('/&gt;', startIndex);
					if (endIndex > startIndex) {
						const substring = comment.substring(startIndex, endIndex + 5);
						let xmlNode = substring.replace(new RegExp('&lt;', 'g'), '<');
						xmlNode = xmlNode.replace(new RegExp('&gt;', 'g'), '>');
						const xmlDocument = aras.createXMLDocument();
						xmlDocument.loadXML(xmlNode);
						if (!xmlDocument || !xmlDocument.firstChild) {
							break;
						} else {
							const userId = xmlDocument.firstChild.getAttribute('user_id');
							let label = xmlDocument.firstChild.getAttribute('label');
							if (label) {
								label = label
									.replace("'", '&quot;')
									.replace('<', '&lt;')
									.replace('>', '&gt;');
							}
							const text = commentToHtmlConverter(userId, label);
							comment = comment.replace(substring, text);
						}
					}
				} else {
					break;
				}
			}
			return comment;
		},

		convertIntoHtml: function (comment) {
			return this._convertIntoHtml(comment, function (userId, label) {
				return (
					'<span><a href="" user_id="' +
					userId +
					'" class="user-mention-link">' +
					label +
					'</a></span>'
				);
			});
		},

		convertIntoEditableHtml: function (comment) {
			let resultText = this._convertIntoHtml(comment, function (userId, label) {
				label = label.substring(1);
				return (
					'<span contenteditable="false" class="userRef" user_id="' +
					userId +
					'" username="' +
					label +
					'">' +
					'@<a onclick="return false;" href="" style="text-decoration:underline" class="user-mention-link" user_id="' +
					userId +
					'">' +
					label +
					'</a>' +
					'</span>'
				);
			});
			if (endsWith(resultText, '>')) {
				resultText += '&nbsp;';
			}
			return resultText;

			function endsWith(text, search) {
				return (
					text.substring(text.length - search.length, text.length) === search
				);
			}
		}
	});
});
