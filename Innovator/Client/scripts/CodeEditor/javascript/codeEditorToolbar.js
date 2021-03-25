/* global clientControlsFactory, js_beautify, dijit */
/* exported CodeEditorToolbar */

function CodeEditorToolbar(mainWnd, methodEditorHelper) {
	var toolbar;
	var topWnd = mainWnd;
	var currentLanguageSide = "Client";
	var methodEditor = methodEditorHelper;
	this.blockComment = "";

	function getOneLineComment() {
		switch (methodEditor.currentLanguage) {
			case "JavaScript":
				return "//";
			case "VB":
				return "'";
			case "C#":
				return "//";
			default:
				return "//";
		}
	}

	this.initToolbar = function initToolbar() {
		clientControlsFactory.createControl("Aras.Client.Controls.Public.ToolBar", { id: "tb1", connectId: "toolbar" }, function(control) {
			toolbar = control;
			toolbar.loadXml(topWnd.aras.getI18NXMLResource("toolbar.xml", topWnd.aras.getScriptsURL() + "CodeEditor"));
			toolbar.show();

			var codelang = topWnd.aras.getItemProperty(parent.document.item, "method_type");
			methodEditorHelper.currentLanguage = codelang;
			toolbar.getItem("method_lang").enable();

			if (codelang === "JScript" || codelang === "JavaScript") {
				toolbar.getItem("side").setSelected("client");
			} else {
				toolbar.getItem("side").setSelected("server");
			}

			clientControlsFactory.on(toolbar, {
				"onClick": onTbItemClick,
				"onChange": onDropDonwItemClickHandler
			});

			setMethodSide(toolbar.getItem("side").getSelectedItem());
		});
		// toolbar icons loading too slow. If we try to disable toolbar we will disable only some of them
		// so we do timeout
		setTimeout(function() {
			if (parent.document.isEditMode) {
				toolbar.enable();
			} else {
				toolbar.disable();
			}
		}, 10);
	};

	function onTbItemClick(tbItem) {
		var tbItemId = tbItem.getId();
		switch (tbItemId) {
		case "print":
			printText();
			break;
		case "undo":
			window.editor.execCommand("undo");
			break;
		case "redo":
			window.editor.execCommand("redo");
			break;
		case "find":
			window.editor.execCommand("find");
			break;
		case "replace":
			window.editor.execCommand("replace");
			break;
		case "unindent":
			window.editor.execCommand("outdent");
			break;
		case "indent":
			window.editor.execCommand("indent");
			break;
		case "formatting":
			formatText();
			break;
			case "comment":
			commentLines("comment");
			break;
		case "uncomment":
			commentLines("uncomment");
			break;
		case "chksyn":
			checkSyntax();
			break;
		case "ftoc":
			showHideToc(tbItem.getState());
			break; // hide or show help pane
		case "toc_pos":
			switchHelpPanePosition();
			break; // change help pane position (right or left).
		case "help":
			showHelpBySelection();
			break; // show help about selected method code
		case "fhelp":
			showHideHelp(tbItem.getState());
			break; // hide or show help tab
		}
	}

	function printText() {
		var frame = document.getElementById("printable").contentWindow;
		frame.document.body.innerHTML = "<PRE>" + topWnd.aras.getItemProperty(parent.document.item, "method_code") + "</PRE>";
		frame.focus(); // This is key, the iframe must have focus first
		frame.print();
	}

	function formatText() {
		if (methodEditor.currentLanguage !== "VB") {
			var selectString = window.editor.session.getTextRange(window.editor.getSelectionRange());
			var res = js_beautify(selectString); // see beautify.js
			window.editor.session.replace(window.editor.selection.getRange(), res);
			window.editor.focus();
		}
	}

	function showHideToc(doVisible) {
		document.getElementById("helpPane").style.display = doVisible ? "" : "none";
		document.getElementById("workAreaWrapper").style.width = doVisible ? "70%" : "100%";
		dijit.byId("workarea").resize();
	}

	function checkSyntax() {
		methodEditor.saveUserChanges();
		methodEditor.selectTab("debugTab");
		document.getElementById("debug").value = "Checking syntax...\n\n";
		var errorInfo = "", warningInfo = "";
		var lang = topWnd.aras.getItemProperty(parent.document.item, "method_type");
		if (lang === "VB" || lang === "C#" || lang === "VJSharp") {
			var resultXml = topWnd.aras.createXMLDocument();
			resultXml.loadXML(topWnd.aras.compileMethod(parent.document.item.xml));
			errorInfo = resultXml.selectSingleNode("/Result/status").text;
		} else {
			var annot = window.editor.getSession().getAnnotations();
			var expRow, expCol, tooManyErrorsWarningText, warningExist;
			for (var key in annot) {
				if (annot.hasOwnProperty(key) && (annot[key].type === "error" || annot[key].type === "warning")) {
					if (annot[key].type === "error") {
						if (!expRow) {
							expRow = annot[key].row + 1;
							expCol = annot[key].column;
						}
						errorInfo += annot[key].text + "on line " + " " + (annot[key].row + 1) + "\r\n";
					} else if (annot[key].raw === "Too many errors.") {
						tooManyErrorsWarningText = annot[key].text;
					} else {
						warningExist = true;
					}
				}
			}
			if (expRow && expCol) {
				window.editor.gotoLine(expRow, expCol, true);
				window.editor.gotoLine(expRow, expCol, true);
			}
			if (tooManyErrorsWarningText) {
				var correctMessage = "Check syntax not completed";
				if (expRow && warningExist) {
					correctMessage += ". Too many warnings and errors.";
				} else if (expRow) {
					correctMessage += ". Too many errors.";
				} else if (warningExist) {
					correctMessage += ". Too many warnings.";
				} else {
					correctMessage += " for unknown reason.";
				}
				tooManyErrorsWarningText = tooManyErrorsWarningText.replace("Too many errors.", correctMessage);
				errorInfo += tooManyErrorsWarningText;
			}
		}
		if (errorInfo === "") {
			errorInfo = "ok";
		}
		document.getElementById("debug").value += errorInfo;
		window.editor.focus();
	}

	function switchHelpPanePosition() {
		if (dijit.byId("workAreaWrapper").region === "leading") {
			dijit.byId("helpPane").set("region", "leading");
			dijit.byId("workAreaWrapper").set("region", "center");
			document.getElementById("workAreaWrapper_splitter").style.display = "none";

		} else {
			dijit.byId("workAreaWrapper").set("region", "leading");
			dijit.byId("helpPane").set("region", "center");
			document.getElementById("workAreaWrapper_splitter").style.display = "";
		}
		dijit.byId("workarea").resize();
	}

	function showHideHelp(doVisible) {
		var helpDebugSlot = document.getElementById("helpDebugSlot");
		var helpDebugSlotSplitter = document.getElementById("helpDebugSlot_splitter");
		helpDebugSlot.style.display = helpDebugSlotSplitter.style.display = doVisible ? "" : "none";
		refreshDebugHelpSlot(doVisible);
		dijit.byId("helpDebugSlot").layout();
		dijit.byId("BorderContainer").layout();
		methodEditor.resizeEditor();
	}

	function showHelpBySelection() {
		var searchString = escape(window.editor.session.getTextRange(window.editor.getSelectionRange()).trim()); // jshint ignore:line
		var helpRow = window.helpTab.getHelper().getIdByLabel(searchString);
		var rowId = helpRow ? helpRow.selectSingleNode("id").text : searchString;
		window.helpTab.showHelp(rowId, false);
	}

	function refreshDebugHelpSlot(doVisible) {
		var h = document.documentElement.offsetHeight;
		var helpDebugSlot = document.getElementById("helpDebugSlot");
		var helpDebugSlotHeight = parseInt(helpDebugSlot.style.height);
		var helpDebugSlotSplitter = document.getElementById("helpDebugSlot_splitter");
		var helpDebugSlotSplitterHeight = helpDebugSlotSplitter.offsetHeight;
		var tHeight = toolbar.getCurrentToolBarDomNode_Experimental().offsetHeight +
			document.getElementById("toolbar_splitter").offsetHeight + helpDebugSlotSplitterHeight;
		var newHeight = h - (helpDebugSlotHeight + tHeight);
		if (newHeight > 0) {
			document.getElementById("workarea").style.height = newHeight + "px";
			document.getElementById("workAreaWrapper").style.height = newHeight + "px";
		}
		if (doVisible) {
			var tmp = tHeight + parseInt(document.getElementById("editorpane").style.height);
			helpDebugSlot.style.top = tmp + "px";
			helpDebugSlotSplitter.style.top = tmp - helpDebugSlotSplitterHeight + "px";
		}
	}

	function onDropDonwItemClickHandler(tbItem) {
		if (tbItem.getId() === "method_lang") {
			methodEditor.switchLanguage(tbItem._item_Experimental.value);
		} else if (tbItem.getId() === "side") {
			switchSide(tbItem._item_Experimental.value);
		}
	}

	function switchSide(val) {
		var lang = "";
		if (val !== currentLanguageSide) {
			var codelang = topWnd.aras.getItemProperty(parent.document.item, "method_type");
			if (val === "client") {
				lang = "JavaScript";
			} else if (val === "server") {
				if (codelang !== "VB" && codelang !== "C#" && codelang !== "VJSharp") {
					lang = "C#";
				} else {
					lang = codelang;
				}
			}
			methodEditor.setLanguage(lang);
			if (lang !== codelang) {
				topWnd.aras.setItemProperty(parent.document.item, "method_type", lang);
			}
			fillMethodLanguageChoise(val);
		}
	}

	function setMethodSide(side) {
		loadFilterValues(side);
		var codelang = topWnd.aras.getItemProperty(parent.document.item, "method_type");

		if (codelang !== undefined) {
			toolbar.getItem("method_lang").setSelected(codelang);
		}
		currentLanguageSide = toolbar.getItem("side").getSelectedItem();
	}

	function loadFilterValues(val) {
		toolbar.getItem("method_lang").removeAll();
		var methodLanguages = methodEditor.getListOfMethodLanguages();
		for (var i = 0, len = methodLanguages.length; i < len; ++i) {
			if (methodLanguages[i].side.toLowerCase() === val) {
				toolbar.getItem("method_lang").Add(methodLanguages[i].name, methodLanguages[i].name);
			}
		}
	}

	function fillMethodLanguageChoise(val) {
		if (val === "client") {
			toolbar.getItem("side").setSelected("client");
		} else {
			toolbar.getItem("side").setSelected("server");
		}
		setMethodSide(val);
	}

	function getSelectedRows() {
		var range = window.editor.getSelectionRange().collapseRows();

		return {
			first: window.editor.session.getRowFoldStart(range.start.row),
			last: window.editor.session.getRowFoldEnd(range.end.row)
		};
	}

	function commentLines(direction) {
		var state = window.editor.session.getState(window.editor.getCursorPosition().row);
		var rows = getSelectedRows();
		//window.editor.session.getMode().toggleCommentLines(state, window.editor.session, rows.first, rows.last);

		toggleCommentLines(state, window.editor.session, rows.first, rows.last, direction);
	}
	

	function toggleCommentLines(state, session, startRow, endRow, direction) {
		var doc = session.doc;
		var lineCommentStart2 = getOneLineComment();
		var ignoreBlankLines = true;
		var shouldRemove = true;
		var minIndent = Infinity;
		var tabSize = session.getTabSize();
		var insertAtTabStop = false;
		var regexpStart1 = lineCommentStart2.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
		var regexpStart = new RegExp("^(\\s*)(?:" + regexpStart1 + ") ?");

		insertAtTabStop = session.getUseSoftTabs();

		var uncomment = function(line, i) {
			var m = line.match(regexpStart);
			if (!m) return;
			var start = m[1].length, end = m[0].length;
			if (!shouldInsertSpace(line, start, end) && m[0][end - 1] === " ")
				end--;
			doc.removeInLine(i, start, end);
		};
		var commentWithSpace = lineCommentStart2 + " ";
		var comment = function(line, i) {
			if (!ignoreBlankLines || /\S/.test(line)) {
				if (shouldInsertSpace(line, minIndent, minIndent))
					doc.insertInLine({ row: i, column: minIndent }, commentWithSpace);
				else
					doc.insertInLine({ row: i, column: minIndent }, lineCommentStart2);
			}
		};
		var testRemove = function(line) {
			return regexpStart.test(line);
		};

		var shouldInsertSpace = function(line, before, after) {
			var spaces = 0;
			while (before-- && line.charAt(before) === " ")
				spaces++;
			if (spaces % tabSize !== 0)
				return false;
			spaces = 0;
			while (line.charAt(after++) === " ")
				spaces++;
			if (tabSize > 2)
				return spaces % tabSize !== tabSize - 1;
			else
				return spaces % tabSize === 0;
			return true;
		};

		function iter(fun) {
			for (var i = startRow; i <= endRow; i++)
				fun(doc.getLine(i), i);
		}


		var minEmptyLength = Infinity;
		iter(function (line, i) {
			var indent = line.search(/\S/);
			if (indent !== -1) {
				if (indent < minIndent)
					minIndent = indent;
				if (shouldRemove && !testRemove(line, i))
					shouldRemove = false;
			} else if (minEmptyLength > line.length) {
				minEmptyLength = line.length;
			}
		});

		if (minIndent === Infinity) {
			minIndent = minEmptyLength;
			ignoreBlankLines = false;
			shouldRemove = false;
		}

		if (insertAtTabStop && minIndent % tabSize !== 0)
			minIndent = Math.floor(minIndent / tabSize) * tabSize;

		iter(direction === "uncomment" ? uncomment : comment);
	}

	this.enable = function() {
		toolbar.enable();
	};

	this.disable = function() {
		toolbar.disable();
	};
}