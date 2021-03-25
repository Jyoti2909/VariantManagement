/* global define */
define(['dojo/_base/declare', 'Vendors/tribute'], function (declare, Tribute) {
	return declare('TributeWrapper', [], {
		getInstance: function (options, nodeContainer) {
			const tribute = new Tribute(options);

			function setCursorIntoEmptyParagraph(paragraph) {
				if (paragraph.childNodes.length > 0) {
					setCursorBefore(paragraph.childNodes[0], 0, 0);
				} else {
					const tempSpan = document.createElement('span');
					tempSpan.textContent = ' ';
					paragraph.appendChild(tempSpan);
					setCursorPosition(paragraph, 0, 0);
					paragraph.removeChild(tempSpan);
				}
			}

			function setCursorBefore(childNode, index, position) {
				const tempSpan = document.createElement('span');
				tempSpan.textContent = ' ';
				childNode.parentNode.insertBefore(tempSpan, childNode);
				setCursorPosition(childNode.parentNode, index, position);
				childNode.parentNode.removeChild(tempSpan);
			}

			function isTextNode(node) {
				return node && node.nodeName === '#text';
			}

			function isSpanNode(node) {
				return node && node.nodeName === 'SPAN';
			}

			function isParagraphNode(node) {
				return node && node.nodeName === 'P';
			}

			function isDivNode(node) {
				return node && node.nodeName === 'DIV';
			}

			function isBreakNode(node) {
				return node && node.nodeName === 'BR';
			}

			function isLinkNode(node) {
				return node && node.nodeName === 'A';
			}

			function setCursorPosition(el, childIndex, position) {
				const range = document.createRange();
				const sel = window.getSelection();
				range.setStart(el.childNodes[childIndex], position);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}

			function getChildIndex(child) {
				let i = 0;
				while ((child = child.previousSibling) !== null) {
					i++;
				}
				return i;
			}

			function setCursorAfter(childNode, position) {
				const tempSpan = document.createElement('span');
				tempSpan.textContent = ' ';

				if (childNode.nextSibling) {
					childNode.parentNode.insertBefore(tempSpan, childNode.nextSibling);
					const index = getChildIndex(tempSpan);
					setCursorPosition(childNode.parentNode, index, position);
				} else {
					childNode.parentNode.appendChild(tempSpan);
					setCursorPosition(
						childNode.parentNode,
						childNode.parentNode.childNodes.length - 1,
						position
					);
				}
				childNode.parentNode.removeChild(tempSpan);
			}

			const container = nodeContainer;

			nodeContainer.addEventListener('compositionstart', function (event) {
				tribute.hideMenu();
			});

			nodeContainer.addEventListener('compositionend', function (event) {
				tribute.events.keyup.call(nodeContainer, tribute.events, event, true);
			});

			nodeContainer.addEventListener('keydown', function (event) {
				if (nodeContainer.readOnly) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}

				switch (event.keyCode) {
					case 8:
						onBackspaceKeyDown(event);
						break; // backspace
					case 46:
						onDeleteKeyDown(event);
						break; // delete key
					case 37:
						onLeftArrowPressed(event);
						break; // left arrow
					case 39:
						onRightArrowPressed(event);
						break; // right arrow
					case 13:
						onEnterPressed(event);
						break;
					default:
						createEmptyParagraph(event);
						break;
				}
			});

			nodeContainer.addEventListener('paste', function (e) {
				const clipboardData = e.clipboardData || window.clipboardData;
				const pastedData = clipboardData.getData('Text');
				if (pastedData) {
					const arrayOfLines = pastedData.match(/[^\r\n]+/g);
					let tempNode;
					let needToInsertAfter = [];
					let lastParagraph;
					for (let i = 0; i < arrayOfLines.length; i++) {
						const path = getPath();
						const currentNode = path.currentNode;
						if (i > 0) {
							if (currentNode && isTextNode(currentNode)) {
								needToInsertAfter = getNodesAfterInsert(
									currentNode,
									needToInsertAfter
								);
								const parentParagraphNode = getParentParagraphNode(currentNode);
								tempNode = document.createTextNode('a'); // create temp text node for new paragraph for focus
								lastParagraph = insertNewParagrhaphNode(
									parentParagraphNode,
									tempNode
								);
							}
						}

						if (i === 0 && arrayOfLines.length > 1) {
							splitTextNode(currentNode, path, needToInsertAfter);
						}

						if (aras.Browser.getBrowserCode() === 'ie') {
							insertTextAtCursor(arrayOfLines[i]);
						} else {
							window.document.execCommand('insertText', false, arrayOfLines[i]);
						}
						removeTempNode(tempNode);
					}

					insertTextAfterPaste(needToInsertAfter, lastParagraph);
					processText();
					e.stopPropagation();
					e.preventDefault();
				}
			});

			function removeTempNode(tempNode) {
				if (tempNode) {
					const offset = tribute.range.getNodeContentLength(tempNode);
					const range = document.createRange();
					range.setStart(tempNode, offset - 1);
					range.setEnd(tempNode, offset);
					range.deleteContents();
				}
			}

			function splitTextNode(currentNode, path, needToInsertAfter) {
				if (currentNode && isTextNode(currentNode)) {
					if (path.offset > 0) {
						currentNode.splitText(path.offset);
					}
					if (path.offset === 0) {
						const textNode = document.createTextNode(currentNode.textContent);
						currentNode.textContent = '';
						needToInsertAfter.push(textNode);
					}
				}
			}

			function insertNewParagrhaphNode(parentParagraphNode, textNode) {
				const newParagraph = document.createElement('p');
				parentParagraphNode.parentNode.insertBefore(
					newParagraph,
					parentParagraphNode.nextSibling
				);
				newParagraph.appendChild(textNode);
				setCursorIntoEmptyParagraph(newParagraph);
				return newParagraph;
			}

			function getParentParagraphNode(currentNode) {
				let parentParagraphNode = currentNode.parentNode;
				if (!isParagraphNode(parentParagraphNode)) {
					const paragraph = document.createElement('p');
					for (let j = 0; j < currentNode.parentNode.childNodes.length; j++) {
						paragraph.appendChild(currentNode.parentNode.childNodes[j]);
					}
					parentParagraphNode.appendChild(paragraph);
					parentParagraphNode = paragraph;
				}
				return parentParagraphNode;
			}

			function getNodesAfterInsert(currentNode, needToInsertAfter) {
				const childIndex = getChildIndex(currentNode);
				for (
					let k = childIndex + 1;
					k < currentNode.parentNode.childNodes.length;
					k++
				) {
					if (!isParagraphNode(currentNode.parentNode.childNodes[k])) {
						needToInsertAfter.push(currentNode.parentNode.childNodes[k]);
					}
				}

				for (let l = 0; l < needToInsertAfter.length; l++) {
					if (needToInsertAfter[l].parentNode) {
						needToInsertAfter[l].parentNode.removeChild(needToInsertAfter[l]);
					}
				}
				return needToInsertAfter;
			}

			function insertTextAfterPaste(needToInsertAfter, lastParagraph) {
				if (needToInsertAfter.length > 0) {
					const path = getPath();
					for (let q = 0; q < needToInsertAfter.length; q++) {
						lastParagraph.appendChild(needToInsertAfter[q]);
					}
					if (aras.Browser.getBrowserCode() === 'ie') {
						// for ie we should set cursor after paste function will be finished
						setTimeout(function () {
							setCursorAfter(path.currentNode, 0);
						}, 0);
					} else {
						setCursorAfter(path.currentNode, 0);
					}
				}
			}

			function insertTextAtCursor(text) {
				if (window.getSelection) {
					const sel = window.getSelection();
					if (sel.getRangeAt && sel.rangeCount) {
						const range = sel.getRangeAt(0);
						range.deleteContents();
						range.insertNode(document.createTextNode(text));
					}
				} else if (document.selection && document.selection.createRange) {
					document.selection.createRange().text = text;
				}
			}

			function createEmptyParagraph() {
				for (let i = 0; i < nodeContainer.childNodes.length; i++) {
					const topLevelChild = nodeContainer.childNodes[i];
					if (isParagraphNode(topLevelChild)) {
						for (let j = topLevelChild.childNodes.length - 1; j >= 0; j--) {
							const child = topLevelChild.childNodes[j];
							if (isTextNode(child) && child.textContent === '') {
								topLevelChild.removeChild(child);
							}
						}
					}
				}
			}

			nodeContainer.addEventListener(
				'keyup',
				function (event) {
					tribute.lastCursorInfo = getPath();
					if (event.keyCode === 37 || event.keyCode === 39) {
						tribute.commandEvent = true;
					}
					if (
						event.keyCode === 13 &&
						!tribute.menuWasActive &&
						!tribute.isActive
					) {
						const selection = window.getSelection();
						const currentNode = selection.anchorNode;
						if (isSpanNode(currentNode)) {
							currentNode.parentNode.removeChild(currentNode);
						}
					}

					if (!tribute.isActive) {
						if (tribute.menu && tribute.menu.style.display === 'block') {
							tribute.hideMenu();
						}
						removeBrTags(nodeContainer);
						processText();
					}

					if (event.keyCode === 13 && aras.Browser.getBrowserCode() === 'ff') {
						// bug ff for japanese locale when we insert @ using IME we get 2text node with @
						const pos = tribute.range.getContentEditableSelectedPath();
						const curNode = pos.currentNode;
						if (
							curNode &&
							curNode.textContent == '@' &&
							curNode.nextSibling &&
							curNode.nextSibling.textContent === '@'
						) {
							curNode.parentNode.removeChild(curNode.nextSibling);
						}
					}
				},
				true
			);

			nodeContainer.addEventListener('tribute-replaced', function () {
				processText();
				if (aras.Browser.getBrowserCode() === 'ch') {
					// for chrome we should add empty text node to set cursor after mention span
					const pos = tribute.range.getContentEditableSelectedPath();
					const currentNode = pos.currentNode;
					if (
						currentNode &&
						isSpanNode(currentNode) &&
						!currentNode.nextSibling
					) {
						const tempNode = document.createTextNode('');
						currentNode.parentNode.appendChild(tempNode);
						setCursorAfter(currentNode, 0);
					}
				}
			});

			function processText() {
				const topLevelChildren = nodeContainer.childNodes;

				for (let l = nodeContainer.childNodes.length; l >= 0; l--) {
					const child = nodeContainer.childNodes[l];
					if (isTextNode(child) && child.textContent === '') {
						nodeContainer.removeChild(child);
					}
				}

				for (let i = 0; i < nodeContainer.childNodes.length; i++) {
					const topLevelChild = nodeContainer.childNodes[i];
					if (isSpanNode(topLevelChild) || isTextNode(topLevelChild)) {
						const nextLineIndex = findNextLineIndex(nodeContainer, i);
						const paragraph = document.createElement('p');
						if (nextLineIndex > i) {
							for (let j = i; j < nextLineIndex; j++) {
								paragraph.appendChild(nodeContainer.childNodes[j]);
							}

							for (let k = nodeContainer.childNodes.length; k > -1; k--) {
								const x = nodeContainer.childNodes[k];
								if (isParagraphNode(x)) {
									if (x.childNodes.length === 0) {
										nodeContainer.removeChild(x);
									} else {
										if (isParagraphNode(x.childNodes[0])) {
											nodeContainer.removeChild(x);
										}
									}
								}
							}

							nodeContainer.appendChild(paragraph);
							break;
						} else {
							for (let m = i; m < nodeContainer.childNodes.length; m++) {
								paragraph.appendChild(nodeContainer.childNodes[m]);
							}
							nodeContainer.appendChild(paragraph);
							setCursorAfter(topLevelChild, 0);
							break;
						}
					}
				}

				removeMailToLinks(nodeContainer);
			}

			function removeMailToLinks(nodeContainer) {
				for (let i = 0; i < nodeContainer.childNodes.length; i++) {
					const topLevelChild = nodeContainer.childNodes[i];
					if (isParagraphNode(topLevelChild)) {
						for (let j = 0; j < topLevelChild.childNodes.length; j++) {
							const child = topLevelChild.childNodes[j];
							if (isLinkNode(child) && child.href) {
								if (child.href.indexOf('mailto:') === 0) {
									const textNode = document.createTextNode(child.textContent);
									child.parentNode.replaceChild(textNode, child);
								}
							}
						}
					}
				}
			}

			function findNextLineIndex(nodeContainer, index) {
				for (let i = index + 1; i < nodeContainer.childNodes.length; i++) {
					const current = nodeContainer.childNodes[i];
					if (
						isDivNode(current) ||
						isBreakNode(current) ||
						isParagraphNode(current)
					) {
						return i;
					}
				}
				return -1;
			}

			function removeBrTags(container) {
				let current = container.firstChild;
				while (current) {
					if (current.nodeName === 'BR') {
						current.parentNode.removeChild(current);
						current = container.firstChild;
					} else {
						current = current.nextSibling;
					}
				}
			}

			function removeLine(previousParagraph, currentParagraph, event) {
				const lastChild = previousParagraph.lastChild;

				let position = -1;
				let childIndex = -1;
				let isSpan = false;
				let isEmpty = false;
				if (previousParagraph.childNodes) {
					if (previousParagraph.childNodes.length > 0) {
						childIndex = previousParagraph.childNodes.length - 1;
						isSpan = isSpanNode(previousParagraph.lastChild);
						position = isSpan ? 0 : previousParagraph.lastChild.length;
					} else {
						isEmpty = true;
					}
				}

				previousParagraph.innerHTML += currentParagraph.innerHTML;
				removeBrTags(previousParagraph);
				currentParagraph.parentNode.removeChild(currentParagraph);
				if (isEmpty) {
					setCursorIntoEmptyParagraph(previousParagraph);
				}
				if (position > -1) {
					if (isSpan) {
						const child = previousParagraph.childNodes[childIndex];
						setCursorAfter(child, position);
					} else {
						setCursorPosition(previousParagraph, childIndex, position);
					}
				}

				event.preventDefault();
				event.stopPropagation();
			}

			function onBackspaceKeyDown(event) {
				const selection = window.getSelection();
				let currentNode = selection.anchorNode;
				let offset = selection.anchorOffset;

				if (selection.anchorOffset !== selection.focusOffset) {
					return;
				}

				if (currentNode.nodeName === 'DIV') {
					if (currentNode.childNodes.length === 0) {
						return; // emty div
					}
					if (currentNode.childNodes.length >= offset) {
						currentNode = currentNode.childNodes[offset - 1];
						offset = isTextNode(currentNode)
							? currentNode.textContent.length
							: 1;
					}
				}

				if (
					isTextNode(currentNode) &&
					currentNode.nodeValue === '@' &&
					isLinkNode(currentNode.nextSibling)
				) {
					currentNode = currentNode.parentNode;
				}

				let currentPosition = getNotEmptyPosition(currentNode, offset);
				currentNode = currentPosition.currentNode;
				offset = currentPosition.offset;

				if (isParagraphNode(currentNode)) {
					if (offset === 0) {
						if (currentNode.previousSibling) {
							const previousParagraph = currentNode.previousSibling;
							if (isParagraphNode(currentNode.previousSibling)) {
								removeLine(previousParagraph, currentNode, event);
								return;
							} else {
							}
						} else {
							return;
						}
					} else {
						currentNode = currentNode.childNodes[offset - 1];
						offset = isTextNode(currentNode) ? currentNode.length : 1;
					}
				}

				currentPosition = getNotEmptyPosition(currentNode, offset);
				currentNode = currentPosition.currentNode;
				offset = currentPosition.offset;

				if (isTextNode(currentNode)) {
					if (offset === 0) {
						if (
							!currentNode.previousSibling &&
							isParagraphNode(currentNode.parentNode)
						) {
							const currentParagraph = currentNode.parentNode;
							if (currentParagraph.previousSibling) {
								if (isParagraphNode(currentParagraph.previousSibling)) {
									removeLine(
										currentParagraph.previousSibling,
										currentParagraph,
										event
									);
									return;
								} else {
								}
							}
						} else {
							if (
								isTextNode(currentNode) &&
								currentNode.textContent === '' &&
								offset === 0
							) {
								if (aras.Browser.getBrowserCode() === 'ff') {
									return;
								}
							}
							// previous node is span
							if (
								currentNode.previousSibling &&
								isSpanNode(currentNode.previousSibling)
							) {
								currentNode.previousSibling.parentNode.removeChild(
									currentNode.previousSibling
								);
								event.preventDefault();
								event.stopPropagation();
							} else {
							}
						}
					} else {
						if (aras.Browser.getBrowserCode() === 'ch') {
							return;
						}
						const range = document.createRange();
						range.setStart(currentNode, offset - 1);
						range.setEnd(currentNode, offset);
						range.deleteContents();
						event.preventDefault();
						event.stopPropagation();
						return;
					}
				}

				if (isSpanNode(currentNode)) {
					if (offset === 0) {
						if (
							!currentNode.previousSibling &&
							isParagraphNode(currentNode.parentNode)
						) {
							const currentParagraph2 = currentNode.parentNode;
							if (currentParagraph2.previousSibling) {
								if (isParagraphNode(currentParagraph2.previousSibling)) {
									removeLine(
										currentParagraph2.previousSibling,
										currentParagraph2,
										event
									);
									return;
								} else {
								}
							}
						} else {
							if (currentNode.previousSibling) {
								currentNode.parentNode.removeChild(currentNode);
								event.preventDefault();
								event.stopPropagation();
								return;
							} else {
							}
						}
					} else {
						const parent = currentNode.parentNode;
						if (!currentNode.previousSibling) {
							currentNode.parentNode.removeChild(currentNode);
							if (parent.childNodes.length > 0) {
								setCursorPosition(parent, 0, 0);
							} else {
								if (
									parent.parentNode.childNodes.length === 1 &&
									parent.childNodes.length === 0
								) {
									// remove empty p tag
									parent.parentNode.removeChild(parent);
								} else {
									setCursorIntoEmptyParagraph(parent);
								}
							}
						} else {
							const index = getChildIndex(currentNode);
							const previous = currentNode.previousSibling;
							currentNode.parentNode.removeChild(currentNode);

							if (parent.childNodes.length > 0) {
								setCursorAfter(previous, 0);
							} else {
								setCursorIntoEmptyParagraph(parent);
							}
						}

						event.preventDefault();
						event.stopPropagation();
					}
				}
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			function getNotEmptyPosition(currentNode, offset) {
				if (
					isTextNode(currentNode) &&
					currentNode.textContent === '' &&
					(offset === 0 || aras.Browser.getBrowserCode() === 'ff')
				) {
					while (currentNode.previousSibling) {
						currentNode = currentNode.previousSibling;
						if (isTextNode(currentNode) && currentNode.textContent === '') {
							continue;
						} else {
							if (isTextNode(currentNode)) {
								offset = currentNode.nodeValue.length;
							} else {
								offset = 1;
							}
							break;
						}
					}
				}
				return { currentNode: currentNode, offset: offset };
			}

			function onDeleteKeyDown(event) {
				if (!window.getSelection().toString()) {
					const nodeEnd = tribute.range.getNodeByCaret(nodeContainer);
					const nodeStart = getStartContainer(nodeContainer);

					const cursorInformation = getPath();
					const currentNode = cursorInformation.currentNode;
					if (!currentNode) {
						return;
					}

					const currentNodeLength = tribute.range.getNodeContentLength(
						currentNode
					);
					if (
						isTextNode(currentNode) &&
						currentNodeLength > cursorInformation.offset
					) {
						return;
					}

					if (isSpanNode(currentNode) && cursorInformation.offset === 0) {
						currentNode.parentNode.removeChild(currentNode);
						return;
					}

					if (currentNode.nextSibling) {
						if (isTextNode(currentNode.nextSibling)) {
							return;
						}

						if (isSpanNode(currentNode.nextSibling)) {
							currentNode.parentNode.removeChild(currentNode.nextSibling);
							return;
						}
					} else {
						if (cursorInformation.path.length > 0) {
							return;
						}
					}
				}
			}

			function onLeftArrowPressed(event) {
				const cursorInformation = getPath();

				const nodeEnd = tribute.range.getNodeByCaret(nodeContainer);
				const nodeStart = getStartContainer(nodeContainer);

				if (isDivNode(nodeStart) && isDivNode(nodeEnd)) {
					// if <p>text(cursor)</p><p>text</p>
					if (cursorInformation.path.length > 1) {
						if (
							isParagraphNode(cursorInformation.currentNode) ||
							isSpanNode(cursorInformation.currentNode)
						) {
							// empty paragraph
						} else {
							setCursorPosition(
								cursorInformation.currentNode.parentNode,
								cursorInformation.path[1],
								cursorInformation.offset
							);
						}
						return;
					} else {
						if (
							isSpanNode(cursorInformation.currentNode) &&
							cursorInformation.offset > 0
						) {
							// if only <span></span>
							setCursorBefore(
								cursorInformation.currentNode,
								cursorInformation.path[0],
								0
							);
							event.preventDefault();
							event.stopPropagation();
							return;
						} else {
							return;
						}
					}
				}

				if (
					isSpanNode(cursorInformation.currentNode) &&
					cursorInformation.offset > 0
				) {
					let nodeIndex;
					// if in the same paragraph
					if (nodeEnd.parentNode === cursorInformation.currentNode.parentNode) {
						nodeIndex =
							cursorInformation.path.length > 1
								? cursorInformation.path[1]
								: cursorInformation.path[0];
						setCursorBefore(cursorInformation.currentNode, nodeIndex, 0);

						event.preventDefault();
						event.stopPropagation();
					}

					if (
						isParagraphNode(nodeEnd) &&
						cursorInformation.currentNode.parentNode === nodeEnd
					) {
						nodeIndex =
							cursorInformation.path.length > 1
								? cursorInformation.path[1]
								: cursorInformation.path[0];
						setCursorBefore(cursorInformation.currentNode, nodeIndex, 0);

						event.preventDefault();
						event.stopPropagation();
					}
				}
			}

			function onEnterPressed(event) {
				tribute.menuWasActive = tribute.isActive;
			}

			function onRightArrowPressed(event) {
				const cursorInformation = getPath();
				const nodeEnd = tribute.range.getNodeByCaret(nodeContainer);
				const nodeStart = getStartContainer(nodeContainer);

				if (!cursorInformation.currentNode) {
					return;
				}

				const nodeLength = tribute.range.getNodeContentLength(
					cursorInformation.currentNode
				);
				if (cursorInformation.offset >= nodeLength) {
					let nextNode = cursorInformation.currentNode.nextSibling;

					if (nextNode) {
						if (nextNode.nodeType === 3) {
							return;
						} else {
							setCursorAfter(nextNode, 0);
						}
					} else {
						if (cursorInformation.path.length > 1) {
							const nextLineIndex = cursorInformation.path[0] + 1;
							if (
								cursorInformation.selected.childNodes.length > nextLineIndex
							) {
								const nextLine =
									cursorInformation.selected.childNodes[nextLineIndex];
								if (isParagraphNode(nextLine)) {
									nextNode = nextLine.childNodes[0];
									if (!nextNode) {
										return;
									}
									if (isTextNode(nextNode)) {
										if (isParagraphNode(nodeEnd)) {
											// we have already on the new line and we need to move next
											setCursorPosition(nextNode.parentNode, 0, 1);
										} else {
											// set cursor on the beginning of the new line
											setCursorBefore(nextNode, 0, 0);
										}
									} else {
										setCursorAfter(nextNode, 0);
									}
								} else {
									setCursorPosition(nextLine, nextLineIndex, 0);
								}
							} else {
								setCursorAfter(cursorInformation.currentNode, 0);
							}
						} else {
							setCursorAfter(cursorInformation.currentNode, 0);
						}
						// p
					}
				} else {
					if (cursorInformation.currentNode.nodeType === 3) {
						return;
					} else {
						setCursorAfter(cursorInformation.currentNode, 0);
					}
				}
				event.preventDefault();
				event.stopPropagation();
			}

			function getPath() {
				return tribute.range.getContentEditableSelectedPath();
			}

			function getStartContainer(element) {
				const caretOffset = 0;
				const doc = element.ownerDocument || element.document;
				const win = doc.defaultView || doc.parentWindow;
				let sel;
				if (typeof win.getSelection !== 'undefined') {
					sel = win.getSelection();
					if (sel.rangeCount > 0) {
						const range = win.getSelection().getRangeAt(0);
						const preCaretRange = range.cloneRange();
						preCaretRange.selectNodeContents(element);
						preCaretRange.setEnd(range.endContainer, range.endOffset);
						return preCaretRange.startContainer;
					}
				}
				return element;
			}
			tribute.attach(nodeContainer);
			return tribute;
		}
	});
});
