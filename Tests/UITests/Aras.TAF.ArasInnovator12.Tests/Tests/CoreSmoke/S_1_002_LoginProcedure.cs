using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Domain.TestData;
using Aras.TAF.ArasInnovator12.Locators.LoginPage;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.AuthorizationChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SwitchChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Enums;
using Aras.TAF.ArasInnovatorBase.Domain.Interfaces;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Extensions;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs.AboutDialog;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs.ArasDialog;
using Aras.TAF.ArasInnovatorBase.Locators.Page;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.DI;
using Aras.TAF.Core.Extensions;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Actions;
using Aras.TAF.Core.Selenium.Questions;
using Ninject;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using Close = Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains.Close;
using CoreSelect = Aras.TAF.Core.Selenium.Actions.Select;
using MainGridState = Aras.TAF.ArasInnovator12.Questions.States.MainGridState;
using Select = Aras.TAF.ArasInnovator12.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_002_LoginProcedure : SingleTestBase
	{
		private const string TestDataFolder = @"DataContainer\CoreSmoke\Login";
		private static Dictionary<string, string> searchData;
		private static string opacityQuerySelectorScript;
		private const string ArasUrl = "https://www.aras.com/";

		private static string columnLabel;
		private static string userName;

		private static string logonFormLabel,
			usernameTip,
			passwordTip,
			loggedOutLabel,
			authFailedMessage,
			capsIsOnMessage,
			missingPassMessage;

		public S_1_002_LoginProcedure()
		{
			TestBlocks = TestBlocks.TurnOffBlocks(TestBlock.Login);
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			const string filenamePattern = "S_1_002_{0}{1}.json";

			var languagePostfix = Settings.CultureInfo.ToString().Substring(0, 2);

			var versionPostfix =
				(Settings.CultureInfo.Equals(new CultureInfo("fr-FR")) &&
				 Settings.InnovatorVersion == InnovatorVersion.I12)
					? "_sp0"
					: string.Empty;

			var assemblyDir = Path.GetDirectoryName(typeof(TestDataProviderFactory).Assembly.Location);
			var filename = string.Format(CultureInfo.InvariantCulture, filenamePattern, languagePostfix, versionPostfix);
			var folderName = Path.Combine(TestDataFolder, "Resources");
			var filePath = Path.Combine(assemblyDir, folderName, filename);

			return new TestDataProvider(filePath, Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("Variable", "name"));
			userName = TestData.Get("UserLoginName");

			searchData = new Dictionary<string, string>
			{
				[columnLabel] = "Version*"
			};

			logonFormLabel = TestData.Get("LogonFormLabel", Settings.InnovatorVersion.GetDescription(),
				Settings.BuildNumber);

			usernameTip = TestData.Get("UsernameTip");
			passwordTip = TestData.Get("PasswordTip");
			loggedOutLabel = TestData.Get("LoggedOutLabel");
			authFailedMessage = TestData.Get("AuthFailedMessage", userName);
			capsIsOnMessage = TestData.Get("CapsIsOnMessage");
			missingPassMessage = TestData.Get("MissingPassMessage");

			//ToDO: Implement new question in core.selenium with params query selector and propertyName to get computed style.
			opacityQuerySelectorScript =
				"return window.getComputedStyle(document.querySelector('.aras-tooltip'),':after').getPropertyValue('opacity');";
		}

		protected override void RunSetUpAmls()
		{
			SystemActor.AttemptsTo(
				Apply.Aml.FromFile(Path.Combine(TestDataFolder, "Login_CleanUp.xml")));

			SystemActor.AttemptsTo(Apply.Aml.FromFile(Path.Combine(TestDataFolder, "Login_SetUp.xml")));
		}

		[Test]
		[Category(TestCategories.Product.Innovator12)]
		[Category(TestCategories.Product.Innovator12Sp1)]
		[Category(TestCategories.Product.Innovator12Sp2)]
		[Category(TestCategories.Product.Innovator12Sp3)]
		[Category(TestCategories.Product.Innovator12Sp4)]
		[Category(TestCategories.Product.Innovator12Sp5)]
		[Category(TestCategories.Product.Innovator12Sp6)]
		#region Description

		[Description(@"
			S-1-002
			1.	Testing the Login
				a.	Go to Innovator/Server/temp
						i.	Confirm that files VersionServer.xml are not in the folder
				b.	Remove the files if they are present
				c.	Connect to Innovator (e.g.: http://InnovatorServerName/web_alias):
					i.	-:
						•	Version (バージョン)
						•	Service Pack
						•	Build Number (ビルド)
					ii.	Check tips of username field - 'Username' ('ユーザ名'), password field - 'Password' ('パスワード')
				d.	Fill the correct data to login to Innovator:
					•	Database: Available database is selected by default
					•	Username: admin
					•	Password: innovator
				e.	Click the Login button
					i.	Confirm that login is successful
					ii.	Make sure the Innovator address was changed and ends with …/Client/
				f.	Click User Menu Button and select About in expanded User Menu
					i.	Verify that About Aras Innovator dialog appears.
					ii.	Check there are proper values for Aras Innovator in a dialog:
						•	Version
						•	Service Pack
						•	Build 
				g.	Click OK button
				h.	Click Navigation Button and click Pin/Unpin Button to pin the Navigation Panel
				i.	Navigate to Administration and click Search Variables button in TOC
					i.	Verify that proper values are set for the following Variables:
						•	VersionBuild
						•	VersionMajor
						•	VersionMinor
						•	VersionServicePack
							Note: Variables values may differ for each build. 
				j.	Click User Menu Button and select Logout in User Menu
					i.	Confirm the returning to the Logout page with message: You are now logged out (今はログアウトになりました。)
				k.	Click on Login button again
					i.	Confirm the returning to the Login page.
				l.	Go to Innovator/Server/temp
					i.	Confirm that file VersionServer.xml is in the folder
				m.	Return to the Login page and click on the www.aras.com link in the bottom right of the Login window
					i.	 Verify that brings up Aras Corp’s home page after click
				n.	Close the Aras Corp’s home page
				o.	Input the next data in the Login page for login to Innovator:
					i.	Login Name: Admin
					ii.	Password: {leave blank}
					iii.	Database: Available database is selected by default
				p.	Click the Login button
					i. Verify that field 'Password' is marked as required and has additional class 'wrong'
				q.	In the Login page:
					i.	Login Name: False
					ii.	Password: innovator 
					iii.	Database: Available database is selected by default
				r.	Click the Login button
					i.	Verify that you receive an error message “Authentication Failed for False” (渡辺謙の認証に失敗しました)
				s.	In the Login page
					i.	Login Name: Admin
				t.	Turn Caps Lock on
				u.	Enter a Password
					i.	Ensure Info bubble “Caps Lock is On” ('Caps Lockキーがオンになっています') appeared
				v.	Turn Caps Lock off add enter the password: innovator
				w.	Click Login button. 
					i.	Confirm that login is successful
			")]

		#endregion

		public void S_1_002_LoginProcedureTest()
		{
			Ioc.Container.Get<S_1_002_LoginProcedureTest_I12>().Invoke(Actor, Settings);
		}

		internal class S_1_002_LoginProcedureTest_I12 : SingleTestBase
		{
			internal void Invoke(IActorFacade<IUserInfo> actor, IInnovatorTestRunSettings settings)
			{
				//a
				actor.ChecksThat(ServerLogState.ServerFileInfo("VersionServer.xml"), Is.Empty);

				//c
				actor.AttemptsTo(Open.Application.By(settings.ClientUrl), Actions.Chains.WaitChains.Wait.ForLoginPageLoading);

				//c.i
				actor.ChecksThat(TextContent.Of(LoginPageElements.InnovatorVersion), Is.EqualTo(logonFormLabel));

				//c.ii
				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.UserNameInputField).Named("placeholder"),
					Is.EqualTo(usernameTip));
				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.PasswordInputField).Named("placeholder"),
					Is.EqualTo(passwordTip));

				//d, e
				actor.AttemptsTo(LogIn.ToInnovator.As(actor.ActorInfo));
				CheckLoginIsSuccessful(actor);
				actor.ChecksThat(Page.Url, Is.EqualTo(string.Concat(settings.ClientUrl, "/")));

				//f
				actor.AttemptsTo(Select.UserMenuItem.ByPath(UserMenuItems.AboutId));

				//f.i
				var dialogContainer = PageElements.DialogsContainer;
				actor.ChecksThat(Visibility.Of(ArasDialogElements.Dialog(dialogContainer)), Is.True);

				//f.ii
				actor.ChecksThat(
					TextContent.Of(AboutDialogElements.VersionAndBuildNumber(dialogContainer)),
					x => Assert.AreEqual(
						FormattableString.Invariant(
							$"Aras Innovator Version {settings.InnovatorVersion.GetDescription()}  Build: {settings.BuildNumber}"),
						x.Replace(" ", " "))
				);

				//g
				actor.AttemptsTo(Click.On(AboutDialogElements.OkButton(dialogContainer)));

				//h
				actor.AttemptsTo(
					Open.NavigationPanel,
					Pin.NavigationPanel
				);

				//i
				actor.AttemptsTo(
					Open.SearchPanel.OfTocItemWithPath("Administration/Variable").ByLoupeIcon,
					Search.Simple.InMainGrid.With(searchData)
				);

				//i.i
				CheckVariableValue(actor, "VersionBuild", settings.BuildNumber);
				CheckServicePackVersion(actor, settings);
				CheckVariableValue(actor, "VersionMinor", "0");
				CheckVariableValue(actor, "VersionServiceUpdate", "0");

				//j
				actor.AttemptsTo(LogOut.FromInnovator);

				//j.i
				actor.ChecksThat(Displayed.Of(LoginPageElements.InfoContentDescription), Is.True);
				actor.ChecksThat(TextContent.Of(LoginPageElements.InfoContentDescription),
					Is.EqualTo(loggedOutLabel));

				//k
				actor.AttemptsTo(Click.On(LoginPageElements.LoginAgainButton));

				//k.i
				var link = LoginPageElements.ArasLink;

				actor.AttemptsTo(
					Wait.UntilTargetIsPresent(LoginPageElements.LoginButton),
					Wait.UntilTargetIsClickable(link));

				//l.i
				actor.ChecksThat(ServerLogState.ServerFileInfo("VersionServer.xml"), Is.Not.Empty);

				//m
				var initialTabHandle = actor.AsksFor(Page.WindowHandle);

				var newTabHandle = actor.AttemptsTo(Open.NewBrowserTab.ByClickOnLink(link));

				actor.AttemptsTo(Switch.ToBrowserTab.WithHandle(newTabHandle));
				actor.AttemptsTo(Wait.UntilQuestionIsAnswered(Page.Url, url => url != "about:blank"));

				//m.i
				actor.ChecksThat(Page.Url, x => StringAssert.StartsWith(ArasUrl, x));

				//n
				actor.AttemptsTo(Close.BrowserTab.Current.ByButton,
					Switch.ToBrowserTab.WithHandle(initialTabHandle));

				//o
				actor.AttemptsTo(
					Enter.TheNewValue(actor.ActorInfo.LoginName).Into(LoginPageElements.UserNameInputField),
					Enter.TheNewValue(string.Empty).Into(LoginPageElements.PasswordInputField));

				actor.ChecksThat(JsScriptResult.For(opacityQuerySelectorScript), Is.EqualTo("0"));

				actor.AttemptsTo(CoreSelect.TheText(actor.ActorInfo.DatabaseName)
					.Into(LoginPageElements.DatabaseSelectField));

				//p
				actor.AttemptsTo(Click.On(LoginPageElements.LoginButton));

				//p.i
				CheckLoginFailed(actor);

				//q
				actor.AttemptsTo(
					Enter.TheNewValue(userName).Into(LoginPageElements.UserNameInputField),
					Enter.TheNewValue(actor.ActorInfo.Password).Into(LoginPageElements.PasswordInputField),
					CoreSelect.TheText(actor.ActorInfo.DatabaseName).Into(LoginPageElements.DatabaseSelectField)
				);

				//r
				actor.AttemptsTo(Click.On(LoginPageElements.LoginButton));

				//r.i
				CheckErrorMessage(actor, authFailedMessage);

				//s
				actor.AttemptsTo(Enter.TheNewValue("Admin").Into(LoginPageElements.UserNameInputField));

				//t
				actor.AttemptsTo(Clear.TheValueOf(LoginPageElements.PasswordInputField));

				//u
				actor.AttemptsTo(Set.NewValue("true").ForHtmlAttribute("data-tooltip-show")
					.OfTarget(LoginPageElements.PasswordFieldTooltip));
				actor.AttemptsTo(Wait.UntilQuestionIsAnswered(JsScriptResult.For(opacityQuerySelectorScript),
					a => a.ToString() == "1"));

				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.PasswordFieldTooltip).Named("data-tooltip-show"),
					Is.EqualTo("true"));

				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.PasswordFieldTooltip).Named("data-tooltip"),
					x => Assert.IsTrue(x.StartsWith(capsIsOnMessage, false,
						CultureInfo.CurrentCulture)));

				actor.ChecksThat(JsScriptResult.For(opacityQuerySelectorScript), Is.EqualTo("1"));

				//v
				actor.AttemptsTo(Set.NewValue("false").ForHtmlAttribute("data-tooltip-show")
					.OfTarget(LoginPageElements.PasswordFieldTooltip));

				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.PasswordFieldTooltip).Named("data-tooltip-show"),
					Is.EqualTo("false"));

				actor.ChecksThat(Visibility.Of(LoginPageElements.DatabaseSelectField), Is.True);
				actor.ChecksThat(Visibility.Of(LoginPageElements.LoginButton), Is.True);
				actor.AttemptsTo(Wait.UntilQuestionIsAnswered(JsScriptResult.For(opacityQuerySelectorScript),
					a => a.ToString() == "0"));

				//w
				actor.AttemptsTo(LogIn.ToInnovator.As(actor.ActorInfo));
				CheckLoginIsSuccessful(actor);
			}

			private void CheckErrorMessage(IActorFacade<IUserInfo> actor, string errorMessage)
			{
				var errorMessageElement = LoginPageElements.ErrorMessage;

				actor.AttemptsTo(Wait.UntilQuestionIsAnswered(Presence.Of(errorMessageElement), x => x)
					.WithTimeout(TimeSpan.FromSeconds(5)));

				actor.AttemptsTo(Wait.UntilQuestionIsAnswered(Visibility.Of(errorMessageElement), a => a));
				actor.ChecksThat(Visibility.Of(errorMessageElement), Is.True);

				actor.ChecksThat(TextContent.Of(errorMessageElement),
					Is.EqualTo(errorMessage));
			}

			private void CheckLoginIsSuccessful(IActorFacade<IUserInfo> actor)
			{
				actor.ChecksThat(Visibility.Of(PageElements.MainContainer), Is.True);
				actor.ChecksThat(Visibility.Of(PageElements.Header), Is.True);
			}

			protected void CheckVariableValue(IActorFacade<IUserInfo> actor, string varName, string varValue)
			{
				var rowNumber = actor.AsksFor(MainGridState.Unfrozen.IndexOfRowByValueInColumn(varName, columnLabel));

				actor.ChecksThat(MainGridState.Unfrozen.CellValue(rowNumber, 2), Is.EqualTo(varValue));
			}

			protected virtual void CheckServicePackVersion(IActorFacade<IUserInfo> actor, IInnovatorTestRunSettings settings)
			{
				CheckVariableValue(actor, "VersionServicePack", "None");
			}

			protected virtual void CheckLoginFailed(IActorFacade<IUserInfo> actor)
			{
				CheckErrorMessage(actor, missingPassMessage);
			}
		}

		internal class S_1_002_LoginProcedureTest_I12Sp1 : S_1_002_LoginProcedureTest_I12
		{
			protected override void CheckServicePackVersion(IActorFacade<IUserInfo> actor, IInnovatorTestRunSettings settings)
			{
				var innovatorVersion = settings.InnovatorVersion.GetDescription();
				CheckVariableValue(actor, "VersionServicePack", innovatorVersion.Split(' ').Last());
			}

			protected override void CheckLoginFailed(IActorFacade<IUserInfo> actor)
			{
				actor.ChecksThat(Classes.Of(LoginPageElements.PasswordInputField), x => Assert.Contains("wrong", x));

				actor.ChecksThat(HtmlAttribute.Of(LoginPageElements.PasswordInputField).Named(("required")), Is.EqualTo("true"));
			}
		}
	}
}