VC.Utils.Page.LoadModules(['DynamicHoopsViewer']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.StreamingHoopsViewer',
		(function () {
			return declare('StreamingHoopsViewer', VC.DynamicHoopsViewer, {
				constructor: function (args) {
					this.args = args;
					this.type = 'dynamic';
				},

				initializeViewer: function (args) {
					var self = this;
					let rendererTypeStr = VC.ViewerAgent.getVariable(
						VC.Utils.Enums.ServerVariable.HOOPSViewerRendererType
					);

					let rendererType = Communicator.RendererType.Client;
					if ('Server' === rendererTypeStr) {
						rendererType = Communicator.RendererType.Server;
					}
					var endPoint = this.requestEndpoint(rendererType);
					if (endPoint) {
						endPoint.then(function (endpoint) {
							self.viewer = new Communicator.WebViewer({
								containerId: 'viewerContainer',
								endpointUri: endpoint,
								streamingMode: Communicator.StreamingMode.OnDemand,
								boundingPreviewMode: Communicator.BoundingPreviewMode.None,
								model: Communicator.EmptyModelName,
								rendererType: rendererType
							});

							var viewerTimeout = VC.ViewerAgent.getVariable(
								VC.Utils.Enums.ServerVariable.HOOPSViewerTimeout
							);
							if (VC.Utils.isNotNullOrUndefined(viewerTimeout)) {
								self.viewer.setClientTimeout(viewerTimeout, viewerTimeout - 1);
							}

							self.viewer.start();
							self.isStarted = true;

							self.setViewerCallbacks();

							var splitter = self.content.getSplitter('left');

							VC.Utils.Page.LoadModules(['Controls/CuttingPlaneControl']);

							self.cuttingPlaneControl = new VC.Widgets.CuttingPlaneControl(
								new Communicator.Ui.CuttingPlaneController(self.viewer)
							);
							var zoomOperator = self.viewer
								.getOperatorManager()
								.getOperator(Communicator.OperatorId.Zoom);
							zoomOperator.setZoomToMousePosition(false);
						});
					}

					this.isViewerInitialized = true;
				},

				requestEndpoint: function (rendererType) {
					var hoopsServerUrl = VC.ViewerAgent.getVariable(
						VC.Utils.Enums.ServerVariable.HOOPSServerUrl
					);
					if (VC.Utils.isNotNullOrUndefined(hoopsServerUrl)) {
						var serviceBrokerEndpoint = hoopsServerUrl + ':11182';
						var serviceClass =
							rendererType === Communicator.RendererType.Client
								? Communicator.ServiceClass.CSR_Session
								: Communicator.ServiceClass.SSR_Session;
						var serviceBroker = new Communicator.ServiceBroker(
							serviceBrokerEndpoint
						);
						var serviceRequest = new Communicator.ServiceRequest(serviceClass);
						return serviceBroker.request(serviceRequest).then(
							function (serviceResponse) {
								if (serviceResponse.getIsOk() === true) {
									var endpoints = serviceResponse.getEndpoints();
									var serviceProtocol = endpoints.hasOwnProperty(
										Communicator.ServiceProtocol.WS.toString()
									)
										? Communicator.ServiceProtocol.WS
										: Communicator.ServiceProtocol.WSS;
									var clientEndpoint = endpoints[serviceProtocol];
									return clientEndpoint;
								} else {
									VC.Utils.AlertWarning(serviceResponse.getReason());
									return null;
								}
							},
							function (serviceResponse) {
								VC.Utils.AlertWarning(serviceResponse.getReason());
							}
						);
					} else {
						VC.Utils.AlertWarning(
							VC.Utils.GetResource('hoops_server_url_not_specified')
						);
						return null;
					}
				},

				getMethodItemString: function () {
					const methodTemplate =
						"<Item type='Method' action='CreateModelXml'>" +
						'<dynamicViewDefinitionId>{0}</dynamicViewDefinitionId>' +
						'<itemId>{1}</itemId>' +
						'<qbParamValueByName>{2}</qbParamValueByName>' +
						'<mode>{3}</mode>' +
						'</Item>';
					const itemData = this.getItemData();
					const dvdId = this.args.dvdId;
					const mode = VC.Utils.Viewers.HoopsViewerMode.SczStreaming;
					const method = methodTemplate.Format(
						dvdId,
						itemData.itemId,
						this.aras.escapeXMLAttribute(this.tgv_parameters),
						mode
					);

					return method;
				},

				loadSubtreeFromXML: function () {
					var self = this;
					var model = this.viewer.getModel();
					var rootNodeID = model.getAbsoluteRootNode();

					model
						.loadSubtreeFromXML(rootNodeID, this.modelXml)
						.then(function () {
							self.viewer
								.getModel()
								.requestNodes([rootNodeID])
								.then(function () {
									self.resetView();
									self.fillPathNodeDictionary();
									self.spinner.hideViewerSpinner(this.viewerContainer);
									self.setModelSelectionSettings(true);
								});
						})
						.catch(function () {
							self.spinner.hideViewerSpinner(this.viewerContainer);
						});
					this.setBtnExplodedViewAccessibility();
				}
			});
		})()
	);
});
