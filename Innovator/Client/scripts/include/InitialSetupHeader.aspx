<!-- (c) Copyright by Aras Corporation, 2006-2011. -->
<!-- #INCLUDE FILE="utils.aspx" -->
<%
	Dim qs As String = Request.ServerVariables("QUERY_STRING")
	If Not String.IsNullOrEmpty(qs) Then
		qs = "?" + qs
	End If
	Dim clConfig As ClientConfig = ClientConfig.GetServerConfig()

	Dim actionNamespace As String = clConfig.ActionNamespace
	Dim serviceName As String = clConfig.ServiceName
	Dim serviceUrl As String = clConfig.ServiceUrl
	Dim oauthClientId As String = clConfig.oauthClientId

	Dim requestPath As String = Request.Url.AbsolutePath
	Dim requestDir As String = requestPath.Substring(0, requestPath.LastIndexOf("/"))
%>
	<script type="text/javascript">
		window.__staticVariablesStorage = true; //this is a flag for StaticVariablesStorage to initialize static variables storage here in this window.
	</script>
	<%
		Dim iomScriptSharp As String = If(HttpContext.Current.IsDebuggingEnabled, "IOM.ScriptSharp.debug", "IOM.ScriptSharp")
	%>
	<script type="text/javascript" src="../javascript/include.aspx?classes=ArasModulesWithoutCore"></script>
	<script defer type="text/javascript" src="../javascript/include.aspx?classes=MainWindow,pageReturnBlocker&files=<%=iomScriptSharp%>"></script>
	<script defer src="../javascript/include.aspx?classes=arasStub/dojo.js" data-dojo-config="async: true, isDebug: false, baseUrl:'../javascript/dojo'"></script>
	<script defer type="text/javascript" src="../javascript/include.aspx?classes=arasInnovatorCUI"></script>
	<script type="module">
		//these global variable is required because may be overwritten on pages that include this file.
		var documentTitle = '<%=Client_Config("product_name")%>';//document title
		window.oauthClientId = '<%=oauthClientId%>';

		function _createArasObject()
		{
			var aras = new Aras();
			window.aras = aras;
			window.aras.Browser = new BrowserInfo();

			aras.aboutData = {
				version: {
					revision: '<!-- #include file = "rev.inc"-->',
					build: '<!-- #include file = "build.inc"-->'
				},
				msBuildNumber: '<!-- #include file = "MSBuildNumber.inc"-->',
				copyright: '<!-- #include file = "copyright.inc"-->'
			};

			<% If Not String.IsNullOrEmpty(clConfig.ServerBaseUrl) Then %>
				aras.SetupURLs(null, {
					serverBaseURL: '<%=clConfig.ServerBaseUrl%>'
				});
			<% End If %>

			aras.setCommonPropertyValue('clientRevision', "<%=ClientHttpApplication.ClientVersion%>");
		}

		window.onSuccessfulLogin = function () {
			authenticateServiceWorker();
			ArasModules.intl.locale = aras.getSessionContextLocale();
			resetSelfServiceReportingSession();
			initalizeArasSetupQuery();
			document.title = documentTitle;
			deepLinking.onSuccessfulLogin();
			aras.setCommonPropertyValue("systemInfo_CurrentLocale", aras.IomInnovator.getI18NSessionContext().getLocale());
			window.Cache = null;
			const navPanel = document.getElementById('navigationPanel');
			navPanel.render();
			window.cui = new CUI_ConfigurableUI();
			Promise.all([
				prepareMetadataDates(),
				prepareMainWindowInfo(),
			])
				.then(function() {
					window.main = window;
					window.initialize();
					window.mainLayout = new MainWindowCuiLayout(document, 'MainWindowView', {item_classification: '%all_grouped_by_classification%'});
					window.addEventListener('unload', () => window.mainLayout.destroy());
					return window.mainLayout.init();
				})
				.finally(function () {
					window.aras.browserHelper.toggleSpinner(document, false);
				})
				.then(function() {
					const metadata = ['ConfigurableUIControls', 'List', 'Form', 'ContentTypeByDocumentItemType'];
					const promises = metadata.map((name) => aras.MetadataCache.RefreshMetadata(name));
					return Promise.all(promises);
				})
				.then(function() {
					arasMainWindowInfo.setProvider(new SyncMainWindowInfoProvider());
					aras.MetadataCacheJson.GetLifeCycleStates();
				});
		}

		function authenticateServiceWorker() {
			const database = aras.getDatabase();
			const lang = aras.getSessionContextLanguageCode();
			const user = aras.getCurrentLoginName();
			const payload = { database, lang, user };
			postMessageToWorker('AUTHENTICATE' , payload);
		}

		async function loadMetadataDates() {
			const serverBaseURL = aras.getServerBaseURL();
			const odataUrl = `${serverBaseURL}odata/method.GetArasMainWindowInfo`;
			const body = JSON.stringify({ query_type: "GetMetadataInfoDates" });
			const method = 'POST';
			const options = { body, method };
			const response = await ArasModules.fetch(odataUrl, options);
			const json = await response.json();
			const metadataDates = json['GetMetadataInfoDates'];
			aras.MetadataCache.UpdatePreloadDates(metadataDates);

			return metadataDates;
		}

		async function prepareMetadataDates() {
			const metadataDates = await loadMetadataDates();
			const headers = aras.OAuthClient.getAuthorizationHeader();
			const serverBaseURL = aras.getServerBaseURL();
			const metadataURL = `${serverBaseURL}MetaData.asmx`;
			const payload = { headers, metadataDates, metadataURL };
			postMessageToWorker('LOAD_METADATA' , payload);
		}

		async function postMessageToWorker(type , payload) {
			if (!('serviceWorker' in navigator)) {
				return;
			}

			const controller = navigator.serviceWorker.controller;
			if (!controller) {
				return;
			}

			const registration = await navigator.serviceWorker.ready;
			const worker = registration.active;
			worker.postMessage({ type , payload });
		}

		function initalizeArasSetupQuery() {
			aras.setup_query = {};

			<% Dim key As String
		For Each key In Request.QueryString.AllKeys
			Response.Write("aras.setup_query[""" +
			Server.HtmlEncode(key) + """]=""" +
			Server.HtmlEncode(Request.QueryString.Item(key)) +
			""";" + vbCrLf)
		Next %>
		}

		function prepareMainWindowInfo() {
			var asyncProvider = new AsyncCachedMainWindowInfoProvider();

			return asyncProvider.fetch()
				.then(function(provider) {
					window.arasMainWindowInfo = new ArasMainWindowInfo(aras);
					window.arasMainWindowInfo.setProvider(provider);

					let identityID = '';
					const loggedUser = aras.getLoggedUserItem();
					const identityNd = loggedUser.selectSingleNode(
						"Relationships/Item[@type='Alias']/related_id/Item[@type='Identity']"
					);
					if (identityNd) {
						identityID = identityNd.getAttribute('id');
					}
					aras.user.setStorageProperty('identityId', identityID);

					const userPropsMapping = {
						firstName: 'first_name',
						lastName: 'last_name',
						keyedName: 'keyed_name',
						picture: 'picture',
						startingPage: 'starting_page',
						defaultVault: 'default_vault'
					};

					for (let [name, propName] of Object.entries(userPropsMapping)) {
						aras.user.setStorageProperty(name, aras.getItemProperty(loggedUser, propName));
					}

					aras.buildIdentityList(window.arasMainWindowInfo.getIdentityListResult);
					aras.setCommonPropertyValue('IsSSVCLicenseOk', arasMainWindowInfo.IsSSVCLicenseOk);
					aras.setCommonPropertyValue('MessageCheckInterval', arasMainWindowInfo.MessageCheckInterval);
					aras.setCommonPropertyValue('SearchCountModeException', arasMainWindowInfo.Core_SearchCountModeException);
					aras.setCommonPropertyValue('SearchCountMode', arasMainWindowInfo.SearchCountMode);
				});
		}



		function resetSelfServiceReportingSession() {
			var xmlHttp = new XMLHttpRequest();
			// SSR is placed near Inn. Server
			var url = aras.getServerBaseURL() + "../SelfServiceReporting/SessionAbandon.aspx?_random=" + Math.random();
			xmlHttp.open("POST", url);
			xmlHttp.send();
		}

		function initArasObject() {
			_createArasObject();
			var aras = window.aras;

			aras.browserHelper = new BrowserHelper(aras, window);

			//++++++++ Initialize aras components
			/// this function is called from scrits/nash.aspx and scripts/login.aspx
			aras.IomFactory = new Aras.IOM.IomFactory();
			aras.IomInnovator = aras.newIOMInnovator();
			aras.InnovatorUser = new Aras.IOM.InnovatorUser();
			aras.GUIDManager = new GUIDManager(aras);
			const cache = aras.IomFactory.CreateItemCache();
			aras.MetadataCache = new MetadataCache(aras, cache);// aras.IomFactory.CreateItemCache();
			aras.MetadataCacheJson = new MetadataCache(aras, cache, true);
			aras.setCommonPropertyValue("mainWindow", window);
			aras.XmlHttpRequestManager = new XmlHttpRequestManager(aras.utils);

			aras.arasService = aras.newObject();
			aras.arasService.actionNamespace = "<%=actionNamespace%>";
			aras.arasService.serviceName = "<%=serviceName%>";
			aras.arasService.serviceUrl = "<%=serviceUrl%>";
		}

		window.addEventListener('DOMContentLoaded', function() {
			window.__staticVariablesStorage["XmlHttpRequestManager"] = new XmlHttpRequestManager();
			makeItCaseInsensetive(
				Aras.IOME.CacheableContainer,
				Aras.IOME.ItemCache,
				Aras.IOM.I18NSessionContext,
				Aras.IOM.Innovator,
				Aras.IOM.IomFactory,
				Aras.IOM.Item,
				Aras.IOM.InnovatorUser,
				Aras.IOM.InnovatorServerConnector);
		});

		initArasObject();
	</script>
