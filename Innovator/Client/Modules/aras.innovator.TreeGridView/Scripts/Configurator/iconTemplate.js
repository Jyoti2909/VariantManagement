define(['dojo/_base/declare'], function (declare) {
	var helper = {
		rootPath: '../../Modules/aras.innovator.TreeGridView/',
		createdHandler: function (win, cb, event) {
			var clickFunction = win.tabbarClick;

			this._tabbar = event.detail.tabbar;
			win.tabbarClick = function (tbItem) {
				if (tbItem !== '3') {
					return clickFunction(tbItem);
				}

				var iconTemplateIFrame = win.document.getElementById('iconTemplate');
				var imagesIFrame = win.document.getElementById('imageBrowser');
				var filesIFrame = win.document.getElementById('externalFile');

				filesIFrame.style.display = imagesIFrame.style.display = 'none';
				imagesIFrame = imagesIFrame.contentWindow.document.getElementById(
					'files'
				);

				var input = iconTemplateIFrame.contentWindow.document.querySelector(
					'input'
				);
				var file =
					(imagesIFrame.contentWindow.currSelId &&
						'../images/' + imagesIFrame.contentWindow.currSelId) ||
					filesIFrame.contentWindow.selectedFile;
				var fileItem;

				helper.saveFileItem = function () {
					var item = aras.IomInnovator.newItem();

					if (fileItem) {
						item.loadAML(fileItem.xml);
						item.apply();
					}
				};

				if (file instanceof File) {
					fileItem = aras.newFileItem(file);
					file = 'vault:///?fileId=' + fileItem.getAttribute('id');
				}

				this._template = input.value = file || input.value;
			}.bind(this);
			cb();
		},
		imageBrowserLoadedHandler: function (
			win,
			configuratorController,
			rowModel,
			cb
		) {
			var iconTemplateFrame = win.document.createElement('iframe');
			iconTemplateFrame.dialogArguments = Object.assign(
				{},
				win.frameElement.dialogArguments
			);
			iconTemplateFrame.addEventListener(
				'load',
				helper.iconTemplateLoadedHandler.bind(
					iconTemplateFrame,
					configuratorController,
					rowModel,
					this,
					cb
				)
			);
			iconTemplateFrame.id = 'iconTemplate';
			iconTemplateFrame.src = helper.rootPath + 'html/iconTemplate.html';
			iconTemplateFrame.setAttribute('frameborder', '0');
			iconTemplateFrame.style.cssText = 'width: 100%; height: 100%';
			win.document.getElementById('tabbarArea').appendChild(iconTemplateFrame);
		},
		iconTemplateLoadedHandler: function (
			configuratorController,
			rowModel,
			context,
			cb
		) {
			var doc = this.contentWindow.document;

			doc.querySelector('.helper_label').textContent = aras.getResource(
				helper.rootPath,
				'icon-template_helper'
			);
			doc.querySelector('h4').textContent = aras.getResource(
				helper.rootPath,
				'icon-template_label'
			);
			context.fillByTemplates(
				doc,
				context.createTemplates(configuratorController, rowModel)
			);
			cb();
		}
	};

	function IconTemplate(params) {
		this._tabbar = null;
		this._helpers = [];
		this._template = '';

		var configuratorController = params.configuratorController;
		var rowModel = params.rowModel;
		var columnModel = params.columnModel;

		var columnMapping = rowModel.columnMappings.find(function (item) {
			return item.sourceId === columnModel.id;
		}, null);
		var dialog = ArasModules.Dialog.show('iframe', {
			aras: aras,
			type: 'ImageBrowser'
		});
		var win = dialog.contentNode.firstChild.contentWindow;

		// HACK: to cache Vault Item and thus to avoid SYNC requests inside getVaultServerURL
		aras.getVaultServerURL();

		if (
			columnMapping &&
			columnMapping.template &&
			columnMapping.template.icon
		) {
			this._template = columnMapping.template.icon;
		}
		this._resolveAfterClose(
			dialog,
			configuratorController,
			rowModel,
			columnModel
		);
		this._resolveAfterLoading(win, configuratorController, rowModel);
	}
	return declare('IconTemplate', null, {
		constructor: IconTemplate,
		applyTemplate: function (configuratorController, rowModel, columnModel) {
			var treeGridRepository = configuratorController._treeGridRepository;
			var currentBranch = treeGridRepository.getCurrentBranch();
			var graphNode = currentBranch.getNodeById(rowModel.uniqueId);
			var columnMapping = rowModel.columnMappings.find(function (item) {
				return item.sourceId === columnModel.id;
			}, null);

			columnMapping =
				columnMapping ||
				treeGridRepository.createColumnMapping(graphNode, columnModel);
			columnMapping.template = columnMapping.template || {};
			if (!this._template) {
				var queryItem = treeGridRepository._queryDefinition.getQueryItem(
					graphNode.queryItemRefId
				);
				this._template = treeGridRepository._getItemTypeIconUrl(
					queryItem.itemType
				);
			}
			columnMapping.template.icon = this._template;
			treeGridRepository.addOrUpdateColumnMapping(columnMapping);
			configuratorController._view.reload();
		},
		createTemplates: function (configuratorController, rowModel) {
			var treeGridRepository = configuratorController._treeGridRepository;
			var currentBranch = treeGridRepository.getCurrentBranch();
			var graphNode = currentBranch.getNodeById(rowModel.uniqueId);
			var qbAliases = treeGridRepository.getAliasesForNode(graphNode, false);

			return qbAliases.reduce(function (obj, alias) {
				obj[
					alias
				] = configuratorController._treeGridRepository.getQbCellTemplateValuesForAlias(
					graphNode,
					alias
				);
				return obj;
			}, {});
		},
		fillByTemplates: function (doc, data) {
			var self = this;
			var input = doc.querySelector('input');
			var select = doc.querySelector('select');

			input.value = self._template;
			input.addEventListener('input', function () {
				self._template = this.value;
			});
			select.addEventListener('dblclick', function () {
				input.value += this.value;
				self._template = input.value;
			});
			Object.keys(data).forEach(function (key) {
				data[key].forEach(function (value) {
					var option = doc.createElement('option');
					option.textContent = '{' + key + '.' + value + '}';
					self._helpers.push('{' + key + '.' + value + '}');
					select.appendChild(option);
				});
			});
		},
		_resolveAfterClose: function (
			dialog,
			configuratorController,
			rowModel,
			columnModel
		) {
			return dialog.promise.then(
				function (result) {
					if (!result) {
						return;
					}

					if (result.applyChanges === false || result === 'set_nothing') {
						this._template = '';
					} else {
						this._template = (!result.applyChanges && result) || this._template;
					}

					if (
						result.applyChanges &&
						this._template.indexOf('vault:///?fileId=') !== -1
					) {
						helper.saveFileItem();
					}

					this.applyTemplate(configuratorController, rowModel, columnModel);
				}.bind(this)
			);
		},
		_resolveAfterLoading: function (win, configuratorController, rowModel) {
			return Promise.all([
				new Promise(
					function (resolve) {
						win.addEventListener(
							'tabbar_created',
							helper.createdHandler.bind(this, win, resolve)
						);
					}.bind(this)
				),
				new Promise(
					function (resolve) {
						win.addEventListener(
							'load',
							helper.imageBrowserLoadedHandler.bind(
								this,
								win,
								configuratorController,
								rowModel,
								resolve
							)
						);
					}.bind(this)
				)
			]).then(
				function () {
					this._tabbar.addTab('3', 'Icon Template');
				}.bind(this)
			);
		}
	});
});
