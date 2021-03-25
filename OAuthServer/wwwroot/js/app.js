const backgroundImageElement = document.getElementById('backgroundImage');
document.body.style.backgroundImage = 'url(' + backgroundImageElement.src + ')';
const logoElement = document.getElementById('logo');
const logoContainerElement = logoElement.parentElement;
logoContainerElement.style.backgroundImage = 'url(' + logoElement.src + ')';

let links = document.querySelectorAll('link[rel="preload"]');
[].forEach.call(links, function(link) {
	link.onload = function(event) {
		event.target.rel = 'stylesheet';
		event.target.onload = null;
	};
});

// Fixup favicon loading for IE11 (I-002409 "R: Favicon is absent on login page on browser tab")
// It does not work because of implementation sandbox X-Content-Security-Policy in IE11.
// At the same time IE11 does not support another X-Content-Security-Policy.
function fixupFaviconForIe() {
	const iconLinkElement = document.querySelector('link[rel="icon"]');
	iconLinkElement.href = iconLinkElement.href;
}
fixupFaviconForIe();
if (window.loginPage) {
	window.loginPage.initialize();
}

// MS Edge has a bug with autofocus property, that also provided in ms bug reporting system https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/21200871/
// in this regard next code manualy sets focus to autofocus node
const autofocusNode = document.querySelector('[autofocus]');
if (autofocusNode) {
	autofocusNode.focus();
}
