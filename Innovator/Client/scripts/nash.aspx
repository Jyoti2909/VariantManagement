<!DOCTYPE html>
<html>
<head>
	<title></title>
	<!-- #INCLUDE FILE="include/InitialSetupHeader.aspx" -->
<%
	'"clConfig" and "gs" variables is distinctive from InitialSetupHeader.aspx
	Dim rawRequestUrl As String = Request.RawUrl
	Dim urlContainsSalt As Boolean = -1 < rawRequestUrl.IndexOf(ClientHttpApplication.FullSaltForCachedContent, StringComparison.OrdinalIgnoreCase)

	Dim AssemblyRootFolder As String
	If clConfig.UseCachingModule Then
		If urlContainsSalt Then
			AssemblyRootFolder = "../../cbin/"
		Else
			Response.Redirect("../" + ClientHttpApplication.FullSaltForCachedContent + "/scripts/nash.aspx", True)
		End If
	Else
		If urlContainsSalt Then
			Response.Redirect( rawRequestUrl.Replace(ClientHttpApplication.FullSaltForCachedContent + "/",""), True)
		Else
			AssemblyRootFolder = "../cbin/"
		End If
	End If
%>

	<link rel="icon" sizes="16x16 32x32 48x48 64x64 144x144" href="<%=requestDir%>/../images/favicon.ico" />
	<script>
		//Init of __staticVariablesStorage is placed in InitialSetupHeader, so no need to reinit again
		if (!window.__staticVariablesStorage) {
			window.__staticVariablesStorage = true; //this is a flag for StaticVariablesStorage to initialize static variables storage here in this window.
		}

		const clientConfig = {
			oauthClientId: '<%=oauthClientId%>'
		};
	</script>
	<script src="../jsBundles/core.js"></script>
	<script src="../javascript/include.aspx?classes=BrowserInfo,StaticVariablesStorage,ResourceManager"></script>
	<script src="../Modules/aras.innovator.AuthenticationFramework/Scripts/OAuthClient.PasswordGrant.js"></script>
	<script>
		var xmlHttpRequestManager = new XmlHttpRequestManager();
		window.__staticVariablesStorage["XmlHttpRequestManager"] = xmlHttpRequestManager;
	</script>
	<link rel="stylesheet" href="../styles/common.min.css" />
	<style type="text/css">
		html, body{
			margin: 5px;
		}
		.nash_span {
			padding: 0 5px;
		}
		input[type="button"] {
			min-width: 87px;
		}
		.aras-form-boolean {
			padding-right: .5em;
		}

	</style>
</head>
<script language="VB" runat="server">
	Public Class LocalesComparer
		Implements IComparer

		Public Function Compare(ByVal x As Object, ByVal y As Object) As Integer Implements IComparer.Compare
			Return String.Compare(CType(x, System.Globalization.CultureInfo).Name, CType(y, System.Globalization.CultureInfo).Name, False, New System.Globalization.CultureInfo(""))
		End Function
	End Class

	Public Class TimeZoneComparer
		Implements IComparer

		Public Function Compare(ByVal x As Object, ByVal y As Object) As Integer Implements IComparer.Compare
			Return String.Compare(CType(x, System.TimeZoneInfo).Id, CType(y, System.TimeZoneInfo).Id, False, New System.Globalization.CultureInfo(""))
		End Function
	End Class

	Private Function getTimeZones() As ArrayList
		Dim zones As New ArrayList

		For Each tzi As System.TimeZoneInfo In System.TimeZoneInfo.GetSystemTimeZones()
			zones.Add(tzi)
		Next
		zones.Sort(New TimeZoneComparer())

		Return zones
	End Function

	Private Function getLocales() As ArrayList
		Dim locales As New ArrayList

		For Each ci As System.Globalization.CultureInfo In System.Globalization.CultureInfo.GetCultures(System.Globalization.CultureTypes.SpecificCultures)
			locales.Add(ci)
		Next
		locales.Sort(New LocalesComparer())

		Return locales
	End Function
</script>
<script>
	function initializeUi() {
		var InnovatorServerRoot = aras.getServerBaseURL();

		var serverURL = document.getElementById("ServerURL");
		serverURL.add(new Option(InnovatorServerRoot + "InnovatorServer.aspx"));

		var xmlhttp = xmlHttpRequestManager.CreateRequest();
		xmlhttp.open("GET", InnovatorServerRoot + "DBList.aspx", false);
		xmlhttp.send();
		var dbs = xmlhttp.responseXML.selectNodes("/DBList/DB");

		var database_select_elem = document.getElementById("database_select");
		for (var i = 0; i < dbs.length; i++) {
			var db = dbs[i];
			database_select_elem.add(new Option(db.getAttribute("id")));
		}
	}

	window.mainLayout = {
		tabsContainer: {
			getSearchGridTabs: function() {
				return [];
			}
		}
	};

	function I18NSessionContextStub() {
	}

	I18NSessionContextStub.prototype.GetLanguageCode = function I18NSessionContextStub_GetLanguageCode() {
		return "en";
	}

	function IomInnovatorStub() {
	}

	I18NSessionContextStub.prototype.GetLocale = function () {
		return "en-us";
	}

	IomInnovatorStub.prototype.getI18NSessionContext = function IomInnovatorStub_GetI18NSessionContext() {
		return new I18NSessionContextStub();
	}

	function setHeader1(theForm, forcedActionIndex) {
		var results = null;
		var msec = Date.now();

		aras.setCommonPropertyValue("systemInfo_CurrentTimeZoneName", theForm.timezone.options[theForm.timezone.options.selectedIndex].text);
		aras.setCommonPropertyValue("systemInfo_CurrentLocale", theForm.locale.options[theForm.locale.options.selectedIndex].value);

		for (var i = 0; i < theForm.act.options.length; i++) {
			var doSend = isNaN(forcedActionIndex) ? theForm.act.options[i].selected : (forcedActionIndex == i);
			if (doSend) {
				var ServerURL = document.getElementById("ServerURL");
				results = aras.soapSend(
					theForm.act.options[i].text,
					theForm.t1.value,
					ServerURL.options[ServerURL.selectedIndex].text
				);
				break;
			}
		}
		if (!results) {
			aras.AlertError(aras.getResource("", "nash.unexpected_error"));
			return;
		}

		s1 = results.getResponseText();

		msec = Date.now() - msec;
		var sec = Math.floor(msec/1000);
		msec -= sec * 1000;
		msec = "000".slice((""+msec).length) + msec;

		const executionTimeLabel = document.getElementById('executionTime');
		executionTimeLabel.textContent = sec + "," + msec;
		theForm.t2.value = s1;
	}

	function f1() {
		var s1 = document.forms.f1.t2.value;
		var w = window.open("", "n1");
		w.document.open();
		w.document.write(s1);
		w.document.close();
	}

	function ourExec() {
		if (!validateForm()) {
			return;
		}
		setHeader1(document.forms.f1);
	}

	function ourClear() {
		document.forms.f1.t1.value = "";
	}

	function hash(password, hashType) {
		switch (hashType) {
			case 'MD5':
				return Promise.resolve(ArasModules.cryptohash.MD5(password).toString());
			case 'SHA256':
				return ArasModules.cryptohash.SHA256(password);
			default:
				return Promise.resolve(password);
		}
	}

	function ourLogin() {
		if (!validateForm()) {
			return;
		}

		const loginName = document.forms.f1.user.value;
		const password = document.forms.f1.password.value;
		const database = document.forms.f1.database.options[document.forms.f1.database.options.selectedIndex].text;
		const oauthClientId = clientConfig.oauthClientId;

		new Promise(function(resolve, reject) {
			aras.OAuthClient.init(oauthClientId, aras.getServerBaseURL())
				.then(resolve)
				.catch(reject);
		})
			.then(function() {
				const hashAlgorithm = getPasswordHashAlgorithm();
				return hash(password, hashAlgorithm);
			})
			.then(function(hashPassword) {
				const oauthOptions = {
					loginName: loginName,
					hashPassword: hashPassword,
					database: database
				};

				// Nash uses the 'OAuthClientPasswordGrant' as 'OAuthClient'. In the same
				// time 'OAuthClientPasswordGrant' is syncronous and uses the 'SyncPromise'.
				// As a result we cannot inject the 'OAuthClient.login' call into chain of
				// promises via 'return' statement.
				// This leads to losing errors from 'OAuthClient.login' because 'reject'
				// from 'SyncPromise' was not caught in the promise chain.
				// It is necessary to wrap the 'OAuthClient.login' call into the Promise 
				// with error handling to catch the exception from the method call and reject
				// the entire promise chain.
				return new Promise(function(resolve, reject) {
					aras.OAuthClient.login('passwordGrant', oauthOptions)
						.then(resolve)
						.catch(function(err) {
							try {
								const jsonError = JSON.parse(err.message);
								reject(jsonError['error_description'] || err);
							} catch (e) {
								reject(err);
							}
						});
				});
			})
			.then(function() {
				return aras.login();
			})
			.then(function() {
				document.forms.f1.t2.value = 'Login complete for user: ' + loginName + '.';
			})
			.catch(function(err) {
				return aras.AlertError(err);
			});
	}

	function ourLogout() {
		if (aras.getCurrentLoginName() != "") {
			aras.logout();
			document.forms.f1.t2.value = "Logout request sent.";
		}
	};
	onunload = ourLogout;

	function validateForm() {
		if (!document.forms.f1.password.value) {
			aras.AlertError("Missing Password");
			return false;
		}
		return true;
	}

	function setFormTarget(targetURL) {
	//  myLogin.serverURL = targetURL;
	}

	window.addEventListener('DOMContentLoaded', function() {
		stubLoginFunction();
		stubTimeZoneInformation();
		initializeUi();
		useOAuthPasswordGrant();
		initDrop();
	});

	function handleTimeZoneChange() {
		const form = document.forms.f1;
		aras.setCommonPropertyValue('systemInfo_CurrentTimeZoneName', form.timezone.options[form.timezone.options.selectedIndex].text);
	}

	function stubTimeZoneInformation() {
		const form = document.forms.f1;
		form.timezone.addEventListener("change", handleTimeZoneChange);
		handleTimeZoneChange();
	}

	function stubLoginFunction() {
		window.login = function() {};
	}

	function useOAuthPasswordGrant() {
		aras.OAuthClient = window.OAuthClientPasswordGrant;
	}

	function initDrop() {
		var textMimeType = "text/plain";
		var xmltext = document.forms.f1.t1;
		xmltext.addEventListener("dragover", function (e) {
			var types = e.dataTransfer.types;
			if (types && (types.contains("Files") || types.contains(textMimeType))) {
				e.dataTransfer.dropEffect = "move";
			} else {
				e.dataTransfer.dropEffect = "none";
			}
			e.preventDefault();
			e.stopPropagation();
		});
		xmltext.addEventListener("drop", function (e) {
			var files = e.dataTransfer.files;
			var types = e.dataTransfer.types;
			if (files && files.length > 0) {
				readTextFile(files[0], function (content) {
					xmltext.value = content;
				});
			} else if (types && types.contains(textMimeType)) {
				xmltext.value = e.dataTransfer.getData(textMimeType);
			}
		});
	}

	function readTextFile(file, callback) {
		var reader = new FileReader();
		reader.onloadend = function (e) {
			if (e.target.readyState === FileReader.DONE) {
				callback(reader.result);
			}
		}
		reader.readAsText(file);
	}

	function getPasswordHashAlgorithm() {
		const radios = document.getElementsByName('hashAlgorithm');
		return Array.from(radios).find(function(radio) {
			return radio.checked;
		}).value;
	}

	function loginOnEnter(event) {
		if (event.key === 'Enter') {
			ourLogin();
		}
	}
</script>
<body>
	<form name="f1" id="f1" class="aras-form">
	<p>
		<div>
			<span class="nash_span">User:</span><input type="text" name="user" value="admin" autofocus onchange="ourLogout()" />
			<span class="nash_span">Password:</span><input type="password" name="password" value="" onkeypress="loginOnEnter(event)"/>
			<span class="nash_span">Database:</span>
			<select id="database_select" name="database" class="sys_f_select" onchange="ourLogout()"></select>
		</div>
	</p>
	<p>
		<div>
			<span class="nash_span">Password Hash Algorithm:</span>
			<label class="aras-form-boolean">
				<input name="hashAlgorithm" value="MD5" type="radio" checked="checked">
				<span></span>
				<span class="nash_span">MD5</span>
			</label>
			<label class="aras-form-boolean">
				<input name="hashAlgorithm" value="SHA256" type="radio">
				<span></span>
				<span class="nash_span">SHA256</span>
			</label>
		</div>
	</p>
	<p>
		<div>
			<span class="nash_span">TimeZone:</span>
				<select id="timezone" name="timezone" class="sys_f_select">
				<%
					Dim timeZones As ArrayList = getTimeZones()
					Dim i As Integer
					For i = 0 To timeZones.Count - 1
						Dim tzi As System.TimeZoneInfo = CType(timeZones(i), System.TimeZoneInfo)
						Response.Write("<option")
						If "Eastern Standard Time" = tzi.Id Then
							Response.Write(" selected ")
						End If
						Response.Write(">")
						Response.Write(tzi.Id)
						Response.Write("</option>")
					Next
				%>
				</select>
			<span class="nash_span">Culture:</span>
			<select id="locale" name="locale" class="sys_f_select">
			<%
				Dim locales As ArrayList = getLocales()
				For i = 0 To locales.Count - 1
					Dim ci As System.Globalization.CultureInfo = CType(locales(i), System.Globalization.CultureInfo)
					Response.Write("<option value=""")
					Response.Write(ci.Name)
					Response.Write("""")
					If "en-US" = ci.Name Then
						Response.Write(" selected ")
					End If
					Response.Write(">")
					Response.Write(ci.Name)
					Response.Write(" - ")
					Response.Write(ci.EnglishName)
					Response.Write("</option>")
				Next
			%>
			</select>
			<input type="button" class="aras-btn" value="Login" onclick="ourLogin()" />
		</div>
	</p>
	<table border="0" cellspacing="0" cellpadding="0">
		<tr>
			<td align="left">
				<span class="nash_span">Action:</span>
			</td>
			<td align="left">
				<span class="nash_span">Server:</span>
			</td>
		</tr>
		<tr>
			<td valign="middle">
				<select id="act" name="act" class="sys_f_select">
					<optgroup label="New relationships">
						<option>PopulateRelationshipsGrid</option>
						<option>populateRelationshipsTables</option>
						<option>GenerateRelationshipsTable</option>
						<option>GenerateRelationshipsTabbar</option>
					</optgroup>
					<optgroup label="DB">
						<option>CopyItem</option>
						<option>AddItem</option>
						<option>CopyItem2</option>
						<option>NewItem</option>
						<option title="Will get new GUID from server.">GenerateNewGUID</option>
						<option>VersionItem</option>
						<option>GetUserWorkingDirectory</option>
						<option>GetItemTypeByFormID</option>
						<option>GetItemRelationships</option>
						<option>GetUsersList</option>
						<option>ResetItemAccess</option>
						<option>ResetAllItemsAccess</option>
					</optgroup>
					<optgroup label="Version">
						<option>GetAffectedItems</option>
						<option>GetItemLastVersion</option>
					</optgroup>
					<optgroup label="------------------------------">
						<option>generateNewGUID</option>
						<option>generateNewGUIDEx</option>
						<option>GetNextSequence</option>
						<option>GetAssignedActivities</option>
						<option>GetAssignedTasks</option>
						<option>LoadProcessInstance</option>
						<option>ClearHistory</option>
						<option>GetHistoryItems</option>
						<option>ApplyMethod</option>
					</optgroup>
					<optgroup label="Life Cycle related">
						<option>GetItemNextStates</option>
						<option>PromoteItem</option>
						<option title="Reset current_state to start_state of correspondent Life Cycle Map (if exists; if not - uses default_lifecycle of ItemType).">
							ResetLifecycle</option>
						<option title="Reset current_state to start_state of default_lifecycle of ItemType.">
							SetDefaultLifeCycle</option>
					</optgroup>
					<optgroup label="------------------------------">
						<option>CreateItem</option>
						<option>GetItem</option>
						<option>CopyItem</option>
						<option>ChangeUserPassword</option>
						<option>RebuildView</option>
						<option>LockItem</option>
						<option>UnlockItem</option>
						<option>ValidateUser</option>
					</optgroup>
					<optgroup label="Perfomance enhancements">
						<option title="Makes a special request to Server to get ItemType with a fixed selected properties and some required relationships">
							GetItemTypeForClient</option>
						<option title="Makes a special request to Server to get Form with a fixed selected properties and some required relationships">
							GetFormForDisplay</option>
						<option title="Generates stylesheet, come properties information, grid definition for Configurable Grid on a Server">
							GetConfigurableGridMetadata</option>
						<option>GetItemWhereUsed</option>
						<option>GetItemAllVersions</option>
					</optgroup>
					<optgroup label="DB Update Tool">
						<option>ApplyUpdate</option>
					</optgroup>
					<optgroup label="Workflow Business Logic">
						<option>InstantiateWorkflow</option>
						<option>StartWorkflow</option>
						<option>cancelWorkflow</option>
						<option>closeWorkflow</option>
						<option>EvaluateActivity</option>
						<option>ValidateWorkflowMap</option>
						<option>ExecuteReminders</option>
					</optgroup>
					<optgroup label="------------------------------">
						<option>ApplySQL</option>
						<option selected="selected">ApplyAML</option>
						<option>ApplyItem</option>
					</optgroup>
					<optgroup label="Server Cache Management">
						<option>ClearCache</option>
					</optgroup>
					<optgroup label="VaultReplication">
						<option>ProcessReplicationQueue</option>
						<option>ReplicationExecutionResult</option>
					</optgroup>
					<optgroup label="FileExchange">
						<option>CreateFileExchangeTxn</option>
						<option>StartFileExchangeTxn</option>
					</optgroup>
				</select>
			</td>
			<td valign="middle" style="padding-left: 8px;">
				<select id="ServerURL" name="ServerURL" class="sys_f_select"></select>
			</td>
		</tr>
	</table>
	<br />
	<span class="nash_span">XML:</span>
	<table border="0">
		<tr>
			<td>
				<textarea name="t1" cols="110" rows="15"></textarea>
			</td>
			<td valign="top">
				<input type="button" value="Submit" class="aras-btn" onclick="ourExec()" /><br />
				<input type="button" value="Clear" class="aras-btn btn_cancel" style="margin-top: 2px" onclick="ourClear()" /><br />
			</td>
		</tr>
	</table>
	<br />
	<br />
	<table border="0" width="700">
		<tr>
			<td width="50%">
				<span class="nash_span">Run time, sec:</span>
				<label id="executionTime" style="color: red; font-size: 14px">0,000</label>
			</td>
			<td width="50%" align="right">
				<span class="nash_span">Result:</span>
				<a href="#" onclick="window.f1();">read</a>
			</td>
		</tr>
	</table>
	<table border="0">
		<tr>
			<td>
				<textarea name="t2" cols="110" rows="15"></textarea>
			</td>
			<td valign="top">
				<input type="button" class="aras-btn" value="ShowXml" onclick="var w1=window.open(); aras.uiViewXMLstringInFrame(w1,t2.value,true); " /><br />
			</td>
		</tr>
	</table>
	</form>
</body>
</html>
