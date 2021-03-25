<!DOCTYPE html>
<%
	Dim salt As String = String.Empty
	Dim clientConfig As ClientConfig = ClientConfig.GetServerConfig()
	If clientConfig.UseCachingModule Then
		salt = ClientHttpApplication.FullSaltForCachedContent + "/"
	End If
	Dim telemetryTracking As String = String.Empty
	telemetryTracking = ClientHttpApplication.TelemetryKey
%>
<html>
	<head>
		<script type="text/javascript">
			if ('serviceWorker' in navigator) {
				const swPath = `./service-worker.js`;
				navigator.serviceWorker.register(swPath);
				navigator.serviceWorker.ready.then((registration) => {
					const worker = registration.active;
					const salt = '<%=ClientHttpApplication.FullSaltForCachedContent%>';
					const payload = { salt };
					worker.postMessage({ type: 'UPDATE_SALT', payload });
				});
			}
		</script>
		<base href="<%=salt%>scripts/" ></base>
		<%If (Not String.IsNullOrEmpty(telemetryTracking)) Then%>
		<script src="../vendors/applicationinsights-web.min.js"></script>
		<script>
			const appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({
				config: {
					instrumentationKey: "<%=telemetryTracking%>",
					disableFetchTracking: false,
					enableCorsCorrelation: true,
					maxAjaxCallsPerView: -1,
					correlationHeaderDomains: ["*"],
					correlationHeaderExcludedDomains: ["aras.com"],
					distributedTracingMode: Microsoft.ApplicationInsights.DistributedTracingModes.W3C
				}
			});
			appInsights.loadAppInsights();
			appInsights.trackPageView();
		</script>
		<%End If%>
		<link rel="stylesheet" href="../styles/common.min.css"/>
		<link rel="stylesheet" href="../styles/main.min.css"/>
		<link rel="stylesheet" href="../javascript/include.aspx?classes=common.css">
		<style>
			/* disable default outline for focused element in Chrome */
			@supports (-webkit-appearance:none) {
				*:focus {
					outline: none
				}
			}
		</style>
		<script type="module" src="../jsBundles/core.es.js"></script>
		<!-- #INCLUDE FILE="scripts/include/InitialSetupHeader.aspx" -->
		<link rel="icon" sizes="16x16 32x32 48x48 64x64 144x144" href="<%=requestDir%>/images/favicon.ico" />
		<script type="module">
			var browserInfo;
			try {
				browserInfo = new BrowserInfo();
				if (!browserInfo.isKnown() || !browserInfo.isSupported()) {
					//we even cannot recognize this browser
					location = "<%=requestDir%>/SupportedBrowsers.html";
				}
			}
			catch (excep) {
				//Everything is so bad that we even cannot instantiate BrowserInfo and check if browser is supported or not.
				location = "<%=requestDir%>/SupportedBrowsers.html";
			}
		</script>
		<script type="module" src="../jsBundles/startup.es.js"></script>
		<script type="module" src="../jsBundles/mainWindowCuiLayout.es.js"></script>
		<script type="module">
			require(['dojo/date/locale']);
			onbeforeunload = mainPageEventHandlers.onBeforeUnloadHandler;
			window.addEventListener('DOMContentLoaded', mainPageEventHandlers.onLoadHandler);
			window.onunload = mainPageEventHandlers.onUnloadHandler;
		</script>
	</head>
	<body>
		<iframe id="deepLinking" class="main" name="deepLinking" frameborder="0"  style="z-index: 2; display: none;"></iframe>
		<aras-toolbar role="banner" id="headerCommandsBar"></aras-toolbar>
		<main>
			<aras-navigation-panel id="navigationPanel"></aras-navigation-panel>
			<aras-splitter class="aras-hide"></aras-splitter>
			<div class="aras-background-page" id="backgroundPage"></div>
			<div id="center" class="aras-flex-grow content-block">
				<aras-header-tabs id="dock-tab" class="content-block__main-tabs content-block__main-tabs_dock"></aras-header-tabs>
				<aras-splitter flexible class="content-block__splitter aras-splitter_divider-a"></aras-splitter>
				<aras-header-tabs id="main-tab" class="content-block__main-tabs content-block__main-tabs_active"></aras-header-tabs>
			</div>
		</main>
		<iframe id="dimmer_spinner" class="aras-spinner_behind-dialogs" src="spinner.html"></iframe>
	</body>
</html>
