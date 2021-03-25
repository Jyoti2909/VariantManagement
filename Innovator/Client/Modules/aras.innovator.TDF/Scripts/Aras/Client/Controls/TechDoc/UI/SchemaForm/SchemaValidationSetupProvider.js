define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		_topWindow: null,
		_aras: null,
		controls: null,
		_aceModules: null,
		_schemaItem: null,
		_isEditorInitializing: false,
		_editMode: null,
		_schemaValidated: false,
		_errorAnnotations: null,
		_originSaveCommand: null,
		_originSaveUnlockAndExitCommand: null,
		_originUnlockCommand: null,
		_validationPromise: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			const editorNode =
				initialParameters.editorNode ||
				document.querySelector('.aceEditorContainer');
			const ace = initialParameters.ace;
			let editor;

			this._aras = initialParameters.aras;
			this._topWindow = this._aras.getMostTopWindowWithAras(window);
			this._schemaItem = initialParameters.schemaItem || document.item;
			this._editMode = initialParameters.editMode || false;
			this._schemaValidated = false;

			this._aceModules = {
				ace: ace,
				Range: ace.require('ace/range').Range
			};

			editor = this._initEditor(editorNode);

			this.controls = {
				editorControl: editor,
				editorSession: editor.getSession(),
				editorNode:
					initialParameters.editorNode ||
					document.querySelector('.aceEditorContainer'),
				messageNode:
					initialParameters.messageNode ||
					document.querySelector('.validationMessage'),
				validateButtonNode:
					initialParameters.validateButtonNode ||
					window.getFieldByName('validateButton').querySelector('input')
			};

			this.setEditMode(initialParameters.editMode);
			this.validateSchema(true);

			this._attachEventHandlers();
		},

		_initEditor: function (editorNode) {
			const ace = this._aceModules.ace;
			let editor;
			let editorSession;

			ace.require('ace/ext/language_tools');
			ace.config.set('modePath', '../vendors/ace-editor');

			editor = ace.edit(editorNode);
			editor.setTheme('ace/theme/textmate');
			editor.setReadOnly(!this._editMode);

			editor.setOptions({
				enableBasicAutocompletion: true,
				enableSnippets: false,
				selectionStyle: 'text',
				showGutter: true,
				highlightActiveLine: true,
				showPrintMargin: false,
				showLineNumbers: true
			});

			editorSession = editor.getSession();
			editorSession.setOption('useWorker', false);
			editorSession.setMode('ace/mode/xml');

			editorSession.setUseWrapMode(true);
			editorSession.setValue(
				this._aras.getItemProperty(this._schemaItem, 'content')
			);
			editor.gotoLine(0, 0, true);
			editor.focus();

			return editor;
		},

		_attachEventHandlers: function (showFirstError) {
			const pageControls = this.controls;

			pageControls.validateButtonNode.addEventListener(
				'click',
				function () {
					this._validationPromise = this.validateSchema(true).then(
						function () {
							const errorsCount = this._errorAnnotations.length;
							const validationMessage = this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								errorsCount ? 'schemaform.isInvalid' : 'schemaform.isValid'
							);

							this.showValidationMessage(
								validationMessage,
								Boolean(errorsCount)
							);
						}.bind(this)
					);
				}.bind(this)
			);

			pageControls.editorControl.on(
				'change',
				function (eventData) {
					if (!this._isEditorInitializing) {
						const schemaItem = this._schemaItem;
						const isDirty = schemaItem.getAttribute('isDirty') === '1';

						this._aras.setItemProperty(
							schemaItem,
							'content',
							pageControls.editorControl.getValue()
						);

						if (!isDirty) {
							schemaItem.setAttribute('isDirty', '1');
							schemaItem.setAttribute('action', 'update');

							if (this._topWindow.updateItemsGrid) {
								this._topWindow.updateItemsGrid(schemaItem);
							}
						}

						pageControls.editorSession.addMarker(
							new this._aceModules.Range(
								eventData.start.row,
								1,
								eventData.end.row,
								0
							),
							'ace_changed-line',
							'fullLine'
						);
						this._schemaValidated = false;
					}
				}.bind(this)
			);

			this._originSaveCommand = this._topWindow.onSaveCommand;
			this._topWindow.onSaveCommand = this._createSaveAfterValidationHandler(
				this._originSaveCommand
			);

			this._originSaveUnlockAndExitCommand = this._topWindow.onSaveUnlockAndExitCommand;
			this._topWindow.onSaveUnlockAndExitCommand = this._createSaveAfterValidationHandler(
				this._originSaveUnlockAndExitCommand
			);

			this._originUnlockCommand = this._topWindow.onUnlockCommand;
			this._topWindow.onUnlockCommand = this._createSaveAfterValidationHandler(
				this._originUnlockCommand
			);
		},

		_createSaveAfterValidationHandler: function (callbackMethod) {
			callbackMethod =
				typeof callbackMethod !== 'function' ? function () {} : callbackMethod;

			return function () {
				const validationPromise = !this._schemaValidated
					? this.validateSchema()
					: Promise.resolve();
				const commandArguments = Array.prototype.slice.call(arguments);

				return validationPromise.then(
					function () {
						return this._onSaveCommandHandler(callbackMethod, commandArguments);
					}.bind(this)
				);
			}.bind(this);
		},

		_onSaveCommandHandler: function (originSaveCommand, commandArguments) {
			if (!this.isSchemaValid()) {
				const xmlErrors = this._errorAnnotations.filter(function (
					errorDescriptor
				) {
					return errorDescriptor.validationType === 'Xml';
				});

				if (xmlErrors.length) {
					this._aras.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'schemaform.fixXmlBeforeSave'
						)
					);
				} else if (
					this._aras.confirm(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'schemaform.confirmInvalidSave'
						)
					)
				) {
					return originSaveCommand.apply(this._topWindow, commandArguments);
				}
			} else {
				return originSaveCommand.apply(this._topWindow, commandArguments);
			}
		},

		showValidationMessage: function (validationMessage, isInvalid) {
			const messageNode = this.controls.messageNode;

			// cleanup messageNode classes
			messageNode.classList.remove('invalid');
			messageNode.classList.remove('active');

			// HACK: In Edge it is additionally required to trigger messageNode reflow to restart show animation
			messageNode.offsetWidth = messageNode.offsetWidth;

			if (isInvalid) {
				messageNode.classList.add('invalid');
			}

			// show message
			messageNode.textContent = validationMessage;
			messageNode.classList.add('active');
		},

		refreshEditor: function (refreshParameters) {
			const editorControl = this.controls.editorControl;

			refreshParameters = refreshParameters || {};

			if (editorControl) {
				const selectionRange = editorControl.getSelectionRange();
				const firstVisibleRow = editorControl.getFirstVisibleRow();
				const currentLine = selectionRange.start.row;
				const newSchemaItem = refreshParameters.schemaItem || document.item;

				this._isEditorInitializing = true;

				if (newSchemaItem !== this._schemaItem) {
					this._schemaItem = newSchemaItem;
					this.cleanupMarkers();
				}

				this.setEditMode(refreshParameters.editMode);

				const newValue = this._aras.getItemProperty(
					this._schemaItem,
					'content'
				);
				const oldValue = editorControl.getValue();
				if (newValue !== oldValue) {
					editorControl.setValue(newValue);
					editorControl.gotoLine(currentLine + 1, 0, false);
					editorControl.scrollToRow(firstVisibleRow + 2);
				}

				this.validateSchema();

				this._isEditorInitializing = false;
			}
		},

		cleanupMarkers: function () {
			const pageControls = this.controls;
			const markerIds = pageControls.editorSession.getMarkers();

			for (let markerId in markerIds) {
				pageControls.editorSession.removeMarker(markerId);
			}
		},

		isSchemaValid: function () {
			return !this._errorAnnotations || !this._errorAnnotations.length;
		},

		setEditMode: function (editMode) {
			const pageControls = this.controls;

			this._editMode = Boolean(editMode);
			pageControls.editorControl.setReadOnly(!editMode);

			if (editMode) {
				pageControls.editorNode.classList.remove('readOnly');
			} else {
				pageControls.editorNode.classList.add('readOnly');
			}
		},

		setAnnotations: function (annotationsList) {
			const editorSession = this.controls.editorSession;

			annotationsList = annotationsList
				? Array.isArray(annotationsList)
					? annotationsList
					: [annotationsList]
				: [];
			editorSession.setAnnotations(annotationsList);

			this._errorAnnotations = annotationsList.length
				? annotationsList.filter(function (errorDescriptor) {
						return errorDescriptor.type === 'error';
				  })
				: annotationsList;
		},

		validateSchema: function (showFirstError) {
			const pageControls = this.controls;
			const statusMessageId = this._aras.setStatus(
				this._aras.getResource(
					'../Modules/aras.innovator.TDF',
					'schemaform.validationInProgress'
				),
				'../images/Progress.gif'
			);

			this._validationPromise = this._sendValidationRequest()
				.then(
					function (errorAnnotations) {
						this.setAnnotations(errorAnnotations);

						if (errorAnnotations.length && showFirstError) {
							const firstError = errorAnnotations[0];
							pageControls.editorControl.gotoLine(
								firstError.row + 1,
								firstError.column,
								true
							);
						}

						this._schemaValidated = true;

						setTimeout(
							function () {
								this._aras.clearStatus(statusMessageId);
							}.bind(this),
							200
						);
					}.bind(this)
				)
				.catch(
					function (error) {
						this._aras.AlertError(reason);
					}.bind(this)
				);

			return this._validationPromise;
		},

		_sendValidationRequest: function (schemaXml) {
			return new Promise(
				function (resolve, reject) {
					const xhr = new XMLHttpRequest();

					xhr.open(
						'POST',
						'../../Modules/aras.innovator.TDF/HttpHandlers/XmlSchemaHelper.ashx',
						true
					);
					xhr.setRequestHeader(
						'Content-type',
						'application/x-www-form-urlencoded'
					);

					xhr.onload = function () {
						if (xhr.status >= 200 && xhr.status < 300) {
							const errorAnnotations = [];

							if (xhr.responseText) {
								const response = JSON.parse(xhr.responseText);
								let errorDescriptor;

								for (let i = 0; i < response.length; i++) {
									errorDescriptor = response[i];

									errorAnnotations.push({
										row: errorDescriptor.LineNumber - 1,
										column: errorDescriptor.ColumnNumber - 1,
										text:
											errorDescriptor.ValidationType +
											': ' +
											errorDescriptor.Message,
										type: errorDescriptor.Severity.toLowerCase(),
										validationType: errorDescriptor.ValidationType
									});
								}
							}

							resolve(errorAnnotations);
						} else {
							reject(xhr.statusText);
						}
					};
					xhr.onerror = function () {
						reject(xhr.statusText);
					};
					xhr.send(
						this._buildRequestQueryString({
							action: 'ValidateSchema',
							defaultSchemaXml:
								schemaXml || this.controls.editorControl.getValue()
						})
					);
				}.bind(this)
			);
		},

		_buildRequestQueryString: function (queryParameters) {
			const searchParams = new URLSearchParams();

			queryParameters = queryParameters || {};

			for (let parameterName in queryParameters) {
				searchParams.append(parameterName, queryParameters[parameterName]);
			}

			return searchParams.toString();
		}
	});
});
