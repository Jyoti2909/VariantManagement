export default function copyTextToBuffer(text, container) {
	if (!text) {
		return;
	}

	let win;
	if (!container) {
		container = window.document.body;
		win = window;
	} else if (container && container.document && container.document.body) {
		win = container;
		container = container.document.body;
	} else if (container) {
		win =
			container.ownerDocument.defaultView ||
			container.ownerDocument.parentWindow;
	}

	const textArea = win.document.createElement('textarea');
	container.appendChild(textArea);
	textArea.style.position = 'fixed';
	textArea.style.left = '-9999px';
	textArea.value = text;
	win.getSelection().removeAllRanges();
	textArea.select();
	win.document.execCommand('copy');
	win.getSelection().removeAllRanges();
	textArea.parentNode.removeChild(textArea);
}
