define(['dojo/_base/declare', 'Vendors/ace-editor/ace'], function (declare) {
	return declare(null, {
		_aceModules: null,

		constructor: function (initialParameters) {
			this._aceModules = {
				ace: ace,
				Range: ace.require('ace/range').Range
			};

			ace.config.set('modePath', '../vendors/ace-editor');
			ace.require('ace/ext/language_tools');
		},

		createEditor: function (initialParameters) {
			initialParameters = initialParameters || {};

			const editorNode =
				initialParameters.containerNode ||
				document.getElementById(initialParameters.connectId);
			let editorControl = this._initEditor(editorNode, initialParameters);

			return editorControl;
		},

		_initEditor: function (editorNode, editorParameters) {
			const aceModule = this._aceModules.ace;
			let editorControl;

			editorParameters = editorParameters || {};
			editorControl = aceModule.edit(editorNode);

			editorControl.setOptions({
				enableBasicAutocompletion: true,
				enableSnippets: false,
				selectionStyle: 'text',
				showGutter:
					editorParameters.showGutter !== undefined
						? editorParameters.showGutter
						: true,
				highlightActiveLine: true,
				showPrintMargin: false,
				showLineNumbers:
					editorParameters.showLineNumbers !== undefined
						? editorParameters.showLineNumbers
						: true,
				theme: 'ace/theme/' + (editorParameters.theme || 'textmate'),
				useWorker: false,
				mode: 'ace/mode/' + (editorParameters.mode || 'text'),
				wrap: true
			});

			this._attachEventHandlers(editorControl, editorParameters);
			this.setEditorEditMode(editorControl, editorParameters.editMode);

			if (editorParameters.value) {
				editorControl.setValue(editorParameters.value, -1);
			}

			return editorControl;
		},

		_attachEventHandlers: function (editorControl, editorParameters) {
			if (editorParameters.highlightChanges) {
				editorControl.on(
					'change',
					function (eventData) {
						if (!editorControl._isRefreshing) {
							editorControl
								.getSession()
								.addMarker(
									new this._aceModules.Range(
										eventData.start.row,
										1,
										eventData.end.row,
										0
									),
									'ace_changed-line',
									'fullLine'
								);
						}
					}.bind(this)
				);
			}
		},

		refreshEditor: function (editorControl, refreshParameters) {
			refreshParameters = refreshParameters || {};

			if (editorControl) {
				const selectionRange = editorControl.getSelectionRange();
				const firstVisibleRow = editorControl.getFirstVisibleRow();
				const currentLine = selectionRange.start.row;

				editorControl._isRefreshing = true;

				if (refreshParameters.cleanupMarkers) {
					this.cleanupEditorMarkers(editorControl);
				}

				this.setEditorEditMode(editorControl, refreshParameters.editMode);

				const newValue = refreshParameters.value;
				const oldValue = editorControl.getValue();
				if (oldValue !== newValue) {
					editorControl.setValue(refreshParameters.value);
					editorControl.gotoLine(currentLine + 1, 0, false);
					editorControl.scrollToRow(firstVisibleRow + 2);
				}

				editorControl._isRefreshing = false;
			}
		},

		cleanupEditorMarkers: function (editorControl) {
			if (editorControl) {
				const editorSession = editorControl.getSession();
				const markerIds = editorSession.getMarkers();

				for (let markerId in markerIds) {
					editorSession.removeMarker(markerId);
				}
			}
		},

		setEditorEditMode: function (editorControl, editMode) {
			if (editorControl) {
				const containerNode = editorControl.renderer.container;

				editMode = Boolean(editMode);
				editorControl.setReadOnly(!editMode);

				if (containerNode) {
					containerNode.classList.toggle('readOnly', !editMode);
				}
			}
		}
	});
});
