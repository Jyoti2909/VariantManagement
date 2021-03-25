function BrowserHelper(aras, aWindow) {
	'use strict';
	this.window = aWindow;
	this.aras = aras;
}

BrowserHelper.prototype.adjustHeightTexAreaWithNullableRows = function (
	textArea
) {
	return (textArea.offsetHeight - 2) / 3 + 2; // There is 3 lines in case of rows == 0
};

BrowserHelper.prototype.getNodeTranslationElement = function (
	srcNode,
	nodeName,
	translationXMLNsURI,
	lang
) {
	var nds = srcNode.getElementsByTagNameNS(translationXMLNsURI, nodeName);
	var i;
	var resNd;
	for (i = 0; i < nds.length; i++) {
		if (
			nds[i].parentNode == srcNode &&
			nds[i].getAttribute('xml:lang') === lang
		) {
			resNd = nds[i];
			break;
		}
	}
	return resNd;
};

BrowserHelper.prototype.createTranslationNode = function (
	srcNode,
	nodeName,
	translationXMLNsURI,
	translationXMLNdPrefix
) {
	if (srcNode.ownerDocument.createElementNS) {
		return srcNode.ownerDocument.createElementNS(
			translationXMLNsURI,
			translationXMLNdPrefix + ':' + nodeName
		);
	}
	var resNd = srcNode.ownerDocument.createNode(
		1,
		translationXMLNdPrefix + ':' + nodeName,
		translationXMLNsURI
	);
	resNd.setAttribute('xmlns:' + translationXMLNdPrefix, translationXMLNsURI);
	return resNd;
};

BrowserHelper.prototype.getTextContentPropertyName = function () {
	return 'textContent';
};

BrowserHelper.prototype.getHeightDiffBetweenTearOffAndMainWindow = function () {
	//Height of Title Bar in Main window is less than in Tear-Off window
	return 8;
};

BrowserHelper.prototype.isWindowClosed = function (window) {
	var res = false;
	try {
		res = window.closed;
	} catch (e) {
		//"Permission denied."
		// "-2146823281" - "Object expected" - this error sometimes generates by MS edge, when window is closed and reference is corrupted
		if (e.number != -2146828218 && e.number != -2146823281) {
			throw e;
		} else {
			res = true;
		}
	}
	return res;
};

/***
 * Move window to specified coordinates
 * @param aWindow target window to move
 * @param x
 * @param y
 */
BrowserHelper.prototype.moveWindowTo = function (aWindow, x, y) {
	if (!this.aras.Browser.isEdge()) {
		aWindow.moveTo(x, y);
	}
};

/***
 * Resize window to specified measurements
 * @param aWindow window to resize
 * @param width
 * @param height
 */
BrowserHelper.prototype.resizeWindowTo = function (aWindow, width, height) {
	if (!this.aras.Browser.isEdge()) {
		//regular window
		aWindow.resizeTo(width, height);
	}
};

/***
 * Set focus to specified window
 * @param aWindow Window to focus
 */
BrowserHelper.prototype.setFocus = function (aWindow) {
	// window.focus is not working in chrome for parent window.
	// We need use window.open with empty url as 1-st argument and name of exits window as 2-nd argument.
	if (this.aras.Browser.isCh() && aWindow.opener && !aWindow.frameElement) {
		aWindow.opener.open('', aWindow.name);
	}

	if (aWindow.frameElement) {
		aWindow.focus();
	} else {
		// setTimeout to fix window.focus in Mozilla Firefox
		setTimeout(function () {
			aWindow.focus();
		}, 0);
	}
};

BrowserHelper.prototype.adjustGridSize = function () {};

/**
 * Turning on/off class in "spinner" element (classList is required)
 *
 * @param {HTMLElement|Document} context - current container object
 * @param {string} state - turn on/off spinner
 * @param {string} [spinnerId] - id attribute of spinner element
 * @return {boolean} spinner found or no
 */
BrowserHelper.prototype.toggleSpinner = function (context, state, spinnerId) {
	spinnerId = spinnerId || 'dimmer_spinner';

	var spinnerEl = (context.ownerDocument || context).getElementById(spinnerId);

	if (!spinnerEl) {
		return false;
	}

	spinnerEl.classList.toggle('aras-hide', !state);
	return true;
};

// +++++++ Methods for generating XSLT stylesheets for Grids
BrowserHelper.prototype.addXSLTCssFunctions = function (container) {
	container.push('<xsl:template name="initItemCSS">\n');
	container.push('	<xsl:param name="css"/>\n');
	container.push('	<xsl:param name="fed_css"/>\n');
	container.push(
		"	<xsl:value-of select=\"translate(concat($css, $fed_css), '&#x20;&#x9;&#xD;&#xA;', '')\"/>\n"
	);
	container.push('</xsl:template>\n');

	container.push('<xsl:template name="getPropertyStyleEx">\n');
	container.push('	<xsl:param name="css"/>\n');
	container.push('	<xsl:param name="propName"/>\n');
	container.push('	<xsl:text>;</xsl:text>\n');
	container.push(
		'	<xsl:variable name="delimiter" select="concat(\'.\', $propName, \'{\')"/>\n'
	);
	container.push(
		'	<xsl:if test="string-length(substring-after($css, $delimiter))">\n'
	);
	container.push(
		'		<xsl:variable name="resCss" select="substring-before(substring-after($css, $delimiter), \'}\')"/>\n'
	);
	container.push('		<xsl:value-of select="$resCss"/>\n');
	container.push(
		'		<xsl:if test="substring($resCss, string-length($resCss)) != \';\'">\n'
	);
	container.push('			<xsl:text>;</xsl:text>\n');
	container.push('		</xsl:if>\n');
	container.push('		<xsl:call-template name="getPropertyStyleEx">\n');
	container.push(
		'			<xsl:with-param name="css" select="substring-after($css, $delimiter)"/>\n'
	);
	container.push('			<xsl:with-param name="propName" select="$propName"/>\n');
	container.push('		</xsl:call-template>\n');
	container.push('	</xsl:if>\n');
	container.push('</xsl:template>\n');
};

BrowserHelper.prototype.addXSLTSpecialNamespaces = function (container) {};
BrowserHelper.prototype.addXSLTInitItemCSSCall = function (
	container,
	cssValue,
	fedCssValue
) {
	container.push('<xsl:call-template name="initItemCSS">\n');
	container.push('	<xsl:with-param name="css" select="' + cssValue + '"/>\n');
	container.push(
		'	<xsl:with-param name="fed_css" select="' + fedCssValue + '"/>\n'
	);
	container.push('</xsl:call-template>\n');
};

BrowserHelper.prototype.addXSLTGetPropertyStyleExCall = function (
	container,
	nameCSS,
	cellCSSVariableName1,
	name
) {
	container.push('<xsl:variable name="' + nameCSS + '" >\n');
	container.push('	<xsl:call-template name="getPropertyStyleEx">\n');
	container.push(
		'		<xsl:with-param name="css" select="string($' +
			cellCSSVariableName1 +
			')" />\n'
	);
	container.push(
		'		<xsl:with-param name="propName" >' + name + '</xsl:with-param>\n'
	);
	container.push('	</xsl:call-template>\n');
	container.push('</xsl:variable>\n');
};
// ------- Methods for generating XSLT stylesheets for Grids

BrowserHelper.prototype.escapeUrl = function (url) {
	//after xslt transformation of the data for grid in FF need to escape the url on the pictures src
	if (this.aras.Browser.isFf()) {
		return url.replace(/&/g, '&amp;');
	} else {
		return url;
	}
};
