using Aras.TAF.ArasInnovator12.Tests.DI;
using Aras.TAF.ArasInnovatorBase.Services.DI;
using Aras.TAF.Core.Domain;
using Aras.TAF.Core.Selenium.Reporting;
using System;
using System.IO;

namespace Aras.TAF.ArasInnovator12.Tests
{
	public class SingleTestBase : ArasInnovatorBase12Test
	{
		///// <summary>
		///// To turn on/off some blocks - use flags in Constructor
		///// </summary>
		//public SingleTestBase()
		//{
		//	//Example with unset blocks
		//	TestBlocks = TestBlocks.UnsetFlags(TestBlock.Login, TestBlock.Logout);

		//	//Example with set blocks
		//	TestBlocks = TestBlocks.SetFlags(TestBlock.Login, TestBlock.Logout);
		//}

		/// <summary>
		/// Initializes observers for reporting.
		/// By default contains NUnit and ExtentReports observers inside.
		/// Can't be turned off
		/// </summary>
		protected override void InitReport()
		{
			// Default implementation:

			//var nunitObserver = new NUnitReportWithScreenshotsObserver(Settings, Settings.BrowserName.ToString());
			//var extentReportObserver = CreateExtentReportWithScreenshots.With(Settings, Settings.BrowserName);

			//ReportObserver = new CompositeScreenshotReportObserver(nunitObserver, extentReportObserver);

			var nunitObserver = new NUnitReportWithScreenshotsObserver(Settings, Settings.BrowserName.ToString());

			var directory = Path.GetDirectoryName(typeof(SingleTestBase).Assembly.Location);

			var extentReportObserver =
				CreateExtentReportWithScreenshots.With(Settings, new BrowserInfo { BrowserName = Settings.BrowserName },
					FormattableString.Invariant($"{directory}\\Settings\\ExtentReportsConfig.xml"));

			ReportObserver = new CompositeScreenshotReportObserver(nunitObserver, extentReportObserver);
		}

		/// <summary>
		/// Gets ioc service with specified bindings.
		/// Should be implemented in all test which is inherited from <see cref="ArasInnovatorBase12Test" />
		/// </summary>
		/// <returns></returns>
		protected override ICompositionRoot GetIocService()
		{
			return new Innovator12TestsCompositionRoot(Settings);
		}

		///// <summary>
		///// Gets test run settings.
		///// By default: test settings from App.config, users credentials from TestCredentials.json.
		///// Can't be turned off
		///// </summary>
		//protected override void InitInnovatorTestRunSettings()
		//{
		//	// Default implementation:

		//	Settings = SettingsService.GetSettingsFromConfigFiles();
		//	PathToScreenshots = Path.Combine(Settings.PathToLogsFolder, "Screenshots", FormattableString.Invariant($"{Settings.BrowserName.ToString()}_{TestContext.CurrentContext.Test.Name}"));

		//	// Example:

		//	Settings = SettingsService.GetSettingsFromConfigFiles();
		//	PathToScreenshots = Path.Combine(Settings.PathToLogsFolder, "MyScreenshots", FormattableString.Invariant($"{Settings.BrowserName.ToString()}_{TestContext.CurrentContext.Test.Name}"));
		//}

		///// <summary>
		///// Global precondition for test run.
		///// Override this method in base classes. Only method implementation for first test in test run will be executed.
		///// Can be turn on/off with flag <see cref="TestBlock.OnetimeSetup" />
		///// </summary>
		//protected override void SetOneTimePreconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	InnovatorServerLogsHelper.CreateInnovatorServerLogsMethod();

		//	SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(
		//		Path.Combine(SetupAmlFolder, AddEsUserAndEsIdentityAml),
		//		ReplacementMap));

		//	//where
		//	//protected const string SetupAmlFolder = @"DataContainer\Smoke\EnterpriseSearch";
		//	//protected const string AddEsUserAndEsIdentityAml = "AddEsUserAndEsIdentity.xml";

		//	//protected Dictionary<string, string> ReplacementMap { get; } = new Dictionary<string, string>
		//	//{ ["{EsUserLogin}"] = "ES_User" };
		//}

		///// <summary>
		///// Runs some UI actions after test is finished.
		///// By default contains blocks SetRoutineUiPostconditions and Logout.
		///// Can be turn on/off with flag <see cref="TestBlock.UiPostconditions" />
		///// </summary>
		//protected override void SetUiPostconditions()
		//{
		//	// Default implementation:

		//	if (TestBlocks.IsFlagDependencyMet(TestBlocksDependency.UseRoutineUiAsUiPostcondition))
		//	{
		//		SetRoutineUiPostconditions();
		//	}

		//	if (TestBlocks.IsFlagDependencyMet(TestBlocksDependency.UseLogoutAsUiPostcondition))
		//	{
		//		Logout();
		//	}
		//}

		///// <summary>
		///// Logs out from Innovator after test is finished.
		///// Can be turn on/off with flag <see cref="TestBlock.Logout" />
		///// </summary>
		//protected override void Logout()
		//{
		//	// Default implementation:

		//	Actor.AttemptsTo(LogOut.FromInnovator);
		//}

		///// <summary>
		///// Applies API actions where test is finished.
		///// ​​Can be turn on/off with flag <see cref="TestBlock.ApiPostconditions" />
		///// </summary>
		//protected override void SetApiPostconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	Actor.AttemptsTo(Delete.Item.ViaApi.ByTypeAndProperty("User", "login_name", userCarpenter.LoginName));
		//	Actor.ActorInfo.FirstName = string.Empty;
		//	Actor.ActorInfo.LastName = string.Empty;
		//	Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));

		//	//where
		//	//private static UserInfo userCarpenter;
		//}

		///// <summary>
		///// Activates necessary Subscription(use Feature License from App.config, fields Aras.PDFViewer, Aras.ArasHTMLtoPDFConverter, Aras.ArasEssentialsSubscription, Aras.SelfServiceReporting, etc.) 
		///// Can be turn on/off with flag <see cref="TestBlock.ActivateFeature" />
		///// </summary>
		//protected override void ActivateFeature()
		//{
		//	// Default implementation: empty

		//	// Example: Activate Self Service Reporting

		//	//Feature License from App.config. Fields Aras.PDFViewer, Aras.ArasHTMLtoPDFConverter, Aras.ArasEssentialsSubscription, Aras.SelfServiceReporting;
		//	var featureLicense = Settings.ArasSelfServiceReportingFeatureLicense;

		//	Actor.AttemptsTo(Activate.Feature(Actor.ActorInfo, featureLicense));
		//}

		///// <summary>
		///// Deactivates features which were activated before test running
		///// Can be turn on/off with flag <see cref="TestBlock.ActivateFeature" />
		///// </summary>
		//protected override void DeactivateFeature()
		//{
		//	// Default implementation: empty

		//	// Example: Deactivate Premier Subscription

		//	// Feature License from App.config. Fields Aras.PremierSubscription, Aras.PDFViewer, Aras.SelfServiceReporting;
		//	var featureLicense = Settings.ArasPremierSubscriptionFeatureLicense;

		//	Actor.AttemptsTo(Deactivate.Feature(featureLicense));
		//}

		///// <summary>
		///// Initializes test data provider for running tests with different locales.
		///// Inside of this block you should point to the path to the file where you store the values for localized data.
		///// The file with your specific values should be of JSON format.
		///// For all languages json name should have appropriate postfix: for English - my_test_en.json, for German - my_test_de.json, etc.
		///// Can't be turned off
		///// </summary>
		///// <returns></returns>
		//protected override TestDataProvider InitTestDataProvider()
		//{
		//	// Default implementation:

		//	return null;

		//	// Example:

		//	return TestDataProviderFactory.GetDataProvider(Path.Combine(TestDataFolder, "Resources"), Settings.CultureInfo);

		//	//where TestDataFolder = @"DataContainer\CoreSmoke\Login";
		//}

		///// <summary>
		///// Sets:
		/////  - DefaultSettings for InnovatorCollectionConnections(for creation root and admin connection to Innovator)
		/////  - CultureInfo and ClientUrl for getting UI resources from Innovator
		/////  - Timeouts for Action/Questions from App.config
		///// Can be turn on/off with flag <see cref="TestBlock.InitTestingServices" />
		///// </summary>
		//protected override void InitTestingServices()
		//{
		//	// Default implementation:

		//	InnovatorCollectionConnections.DefaultSettings = Settings;
		//	InnovatorUiResourcesService.DefaultCultureInfo = Settings.CultureInfo;
		//	InnovatorUiResourcesService.ClientUrl = Settings.ClientUrl;
		//	TimeoutsStorage.Settings = Settings.Timeouts;

		//	// Example:

		//	base.InitTestingServices();

		//	InnovatorServerLogsHelper.CreateInnovatorServerLogsMethod();
		//}

		///// <summary>
		///// Adds custom classes to container in tests in format "Ioc.Container.Rebind{BasePartClass{>}.To{CustomClass}();"
		///// </summary>
		//protected override void AddCustomConfig()
		//{
		//	// Default implementation: empty

		//	// Example:
		//	Ioc.Container.Rebind<LoginToInnovator>().To<LoginToInnovatorAndCloseError>();
		//}

		///// <summary>
		///// Removes custom classes to container in tests in format "Ioc.Container.Rebind{BasePartClass{>}.To{CustomClass}();"
		///// </summary>
		//protected override void RemoveCustomConfig()
		//{
		//	// Should return the bindings set up in AddCustomConfig method to original state
		//	// e.g. AddCustomConfig set bind 'LoginToInnovatorAndCloseError' to 'LoginToInnovator'
		//	// so RemoveCustomConfig should return binding 'LoginToInnovator' => 'LoginToInnovator'

		//	// Ioc.Container.Rebind<LoginToInnovator>().To<LoginToInnovator>();
		//}

		///// <summary>
		///// Creates actor/actors.
		///// By default creates Actor of 'Admin' type.
		///// Can be turn on/off with flag <see cref="TestBlock.ActorInitialization" />
		///// </summary>
		//protected override void InitActor()
		//{
		//	// Default implementation:

		//	Actor = SystemActor.AttemptsTo(Create.Actor(UserType.Admin));


		//	// Example of creating several users for your test:

		//	base.InitActor();

		//	Actor2 = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
		//	Actor3 = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
		//	ActorAdmin = SystemActor.AttemptsTo(Create.Actor(UserType.Admin));

		//	//Where:
		//	//protected IActorFacade<IUserInfo> Actor2 { get; set; }
		//	//protected IActorFacade<IUserInfo> Actor3 { get; set; }
		//	//protected IActorFacade<IUserInfo> ActorAdmin { get; set; }


		//	// Example of creating actor based on the existing in Innovator user using the credentials from Settings:

		//	Actor = new InnovatorActor(Settings.UsersCredentials.Admin);​


		//	// Example of creating actor based on the existing in Innovator user using the hardcoded credentials:

		//	Actor = new InnovatorActor(new UserInfo
		//	{
		//		LoginName = "your login",
		//		Password = "your password",
		//		DatabaseName = Settings.DatabaseName
		//	});
		//}

		///// <summary>
		///// Setups test preconditions using AML(Aras Markup language)
		///// Can be turn on/off with flag <see cref="TestBlock.RunAmls" />
		///// </summary>
		//protected override void RunSetUpAmls()
		//{
		//	// Default implementation: empty

		//	// Example:
		//	SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(DataContainer, "S_1_004_Setup.xml")));

		//	//Where
		//	//private const string DataContainer = @"DataContainer\CoreSmoke\S_1_004";
		//}

		///// <summary>
		///// Runs Cleanup AML after test is finished
		///// Can be turn on/off with flag <see cref="TestBlock.ApiPostconditions" />
		///// </summary>
		//protected override void RunTearDownAmls()
		//{
		//	// Default implementation: empty

		//	// Example:
		//	SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(DataContainer, "S_1_004_Cleanup.xml")));

		//	//Where
		//	//private const string DataContainer = @"DataContainer\CoreSmoke\S_1_004";
		//}

		///// <summary>
		///// Runs some necessary scripts before test running.
		///// Can be turn on/off with flag <see cref="TestBlock.RunScripts" />
		///// </summary>
		//protected override void RunScripts()
		//{
		//	// Default implementation: empty
		//}

		///// <summary>
		///// Runs some other API actions before test running
		///// Can be turn on/off with flag <see cref="TestBlock.RunOtherApiPreconditions" />
		///// </summary>
		//protected override void RunOtherApiPreconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	Actor.ActorInfo.FirstName = "Jane1";
		//	Actor.ActorInfo.LastName = "Woods1";
		//	Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));
		//}

		///// <summary>
		///// Creates WebBrowser and add it to actor abilities​
		///// Can be turn on/off with flag <see cref="TestBlock.InitBrowserAbility" />
		///// </summary>
		//protected override void AddBrowserAbility()
		//{
		//	// Default implementation:

		//	WebBrowser webBrowser = InnovatorWebBrowser.With(Settings);

		//	SystemActor.AttemptsTo(
		//		Log.Info(FormattableString.Invariant(
		//					$"WebBrowser version is '{webBrowser.GetBrowserVersion(Settings.BrowserName)}'")));

		//	SystemActor.AttemptsTo(
		//		Log.Info(FormattableString.Invariant(
		//					$"Client machine is '{Settings.MachineExecutionContext.MachineAlias}'")));

		//	Actor = Actor.CanUse(webBrowser);

		//	// Example:

		//	base.AddBrowserAbility();

		//	WebBrowser webBrowser2 = InnovatorWebBrowser.With(chromeAllowPdfSettings);
		//	Actor2 = Actor2.CanUse(webBrowser2);

		//	//Where:
		//	//private IInnovatorTestRunSettings chromeAllowPdfSettings;
		//	//private IActorFacade<IUserInfo> Actor2 { get; set; }
		//}

		///// <summary>
		///// Creates reporting with screenshots actor​.
		///// Can't be turned off
		///// </summary>
		//protected override void AddReportingAbility()
		//{
		//	// Default implementation:

		//	Actor = ((InnovatorActor)Actor).WithReportingAndScreenshots(ReportObserver, "Screenshot_{0:G}");

		//	// Example:
		//	//ReportObserver = CreateExtentReportWithScreenshots.With(Settings, Settings.BrowserName);

		//	//Actor = ((InnovatorActor)Actor).WithSeleniumExtentReporting("Screenshot_{0:000}", ReportObserver);
		//	//Actor2 = ((InnovatorActor)Actor2).WithSeleniumExtentReporting("Screenshot_{0:000}", ReportObserver);

		//	//Where:
		//	//private IActorFacade<IUserInfo> Actor2 { get; set; }
		//}

		///// <summary>
		///// Creates actor with other abilities: HighlightTargets, SlowSelenium, etc.
		///// Can be turn on/off with flag <see cref="TestBlock.AddOtherActorAbilities" />
		///// </summary>
		//protected override void AddOtherAbilities()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	Actor = ((InnovatorActor) Actor).HighlightTargets();
		//	Actor = ((InnovatorActor) Actor).SlowSelenium(TimeSpan.FromSeconds(5));
		//	Actor = ((InnovatorActor) Actor).TakeScreenshots(Settings.PathToLogsFolder, "Screenshot_{0:000}");
		//}

		///// <summary>
		///// Initializes some data for test(models/lists/dictionaries with expected data, keys, etc.)
		///// Can be turn on/off with flag <see cref="TestBlock.TestDataInitialization" />
		///// </summary>
		//protected override void InitTestData()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	planningActivityLabel = TestData.Get("PlanningActivityLabel");
		//	confirmingActivityLabel = TestData.Get("ConfirmingActivityLabel");

		//	votingComment = FormattableString.Invariant($"Updated by {Actor.ActorInfo.LoginName}");

		//	expectedReport = new WorkflowHistoryReport
		//	{
		//		WfProcessItemName = "A8ADCDE540D24D3FB3F3D00DA2A2E333",
		//		StartedBy = "Innovator Admin",
		//		CurrentStatus = "Active"
		//	};
		//}

		///// <summary>
		///// Opens the application in browser and login​ to it
		///// Can be turn on/off with flag <see cref="TestBlock.Login" />
		///// </summary>
		//protected override void Login()
		//{
		//	// Default implementation:

		//	Actor.AttemptsTo(Open.Application.By(Settings.ClientUrl));

		//	Actor.AttemptsTo(LogIn.ToInnovator.As(Actor.ActorInfo));

		//	// Example:

		//	Actor.AttemptsTo(Open.Application.By(Settings.ClientUrl));

		//	Actor.AttemptsTo(LogIn.ToInnovator.As(SomeOtherUser.ActorInfo));
		//}

		///// <summary>
		///// Runs some UI actions before test running
		///// Can be turn on/off with flag <see cref="TestBlock.PerformRoutineUiPreconditions" />
		///// </summary>
		//protected override void SetRoutineUiPreconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	//Actor.AttemptsTo(Open.NavigationPanel,
		//	//	Open.SearchPanel.OfTocItemWithPath("Design/Part").ByLoupeIcon,
		//	//	Search.WithCurrentSearchCriteria.InMainGrid,
		//	//	Open.Item.InMainGrid.WithValueInCell("Part Number", "Part_01_" + TestPostfix).ByDoubleClick);

		//	//var relationshipsPanel = Actor.AsksFor(ItemPageContent.RelationshipsPanel);

		//	//Actor.AttemptsTo(Select.RelationshipTab.WithName("BOM Structure").InRelationshipsPanel(relationshipsPanel));
		//}

		///// <summary>
		///// Runs some UI actions after test is finished
		///// Can be turn on/off with flag <see cref="TestBlock.PerformRoutineUiPostconditions" />
		///// </summary>
		//protected override void SetRoutineUiPostconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	//Actor.AttemptsTo(Close.ActiveItemPage.ByCloseButton);
		//	//Actor.AttemptsTo(Switch.ToPage(mainPageModel));
		//}

		///// <summary>
		///// Generates extent report based on ReportObserver with screenshots in steps with error.
		///// By default: screenShot name format is 'Screenshot_{0:G}').
		///// Can't be turned off
		///// </summary>
		//protected override void GenerateReport()
		//{
		//	// Default implementation:

		//	GenerateSeparateReportWithScreenshots.For(ReportObserver);

		//	// Example:

		//	//GenerateSeparateReport.For(ReportObserver);
		//}

		///// <summary>
		///// Puts actorInfo back to UsersPool for reusing in next test, disposes actor​.
		///// Can be turn on/off with flag <see cref="TestBlock.ActorInitialization" />
		///// </summary>
		//protected override void DisposeActor()
		//{
		//	// Default implementation:

		//	SystemActor.AttemptsTo(Dispose.Actor(Actor));

		//	// Example:

		//	//SystemActor.AttemptsTo(Dispose.Actors(NoEffsUser, EffsUser));

		//	//base.DisposeActor();
		//}
	}
}
