using Aras.TAF.ArasInnovator12.Tests.DI;
using Aras.TAF.ArasInnovatorBase.Services.DI;
using Aras.TAF.Core.Domain;
using Aras.TAF.Core.Selenium.Reporting;
using NUnit.Framework;
using System;
using System.IO;

namespace Aras.TAF.ArasInnovator12.Tests
{
	/// <summary>
	/// Base class for all Web UI Tests related to Innovator 12 based projects
	/// </summary>
	[TestFixture]
	public abstract class GroupingTestBase : BaseTafInnovator12Test
	{
		// All blocks in GroupingTestBase can't be turned off

		/// <summary>
		/// Initializes observers for reporting.
		/// By default contains NUnit and ExtentReports observers inside.
		/// </summary>
		protected override void InitReport()
		{
			// Default implementation:

			//var nunitObserver = new NUnitReportWithScreenshotsObserver(Settings, Settings.BrowserName.ToString());
			//var extentReportObserver = CreateExtentReportWithScreenshots.With(Settings, Settings.BrowserName);

			//ReportObserver = new CompositeScreenshotReportObserver(nunitObserver, extentReportObserver);

			var nunitObserver = new NUnitReportWithScreenshotsObserver(Settings, Settings.BrowserName.ToString());

			var directory = Path.GetDirectoryName(typeof(GroupingTestBase).Assembly.Location);

			var extentReportObserver =
				CreateExtentReportWithScreenshots.With(Settings, new BrowserInfo { BrowserName = Settings.BrowserName },
					FormattableString.Invariant($"{directory}\\Settings\\ExtentReportsConfig.xml"));

			ReportObserver = new CompositeScreenshotReportObserver(nunitObserver, extentReportObserver);
		}

		/// <summary>
		/// Gets ioc service with specified bindings.
		/// Should be implemented in all test which is inherited from <see cref="BaseTafInnovator12Test" />
		/// </summary>
		/// <returns></returns>
		protected override ICompositionRoot GetIocService()
		{
			return new Innovator12TestsCompositionRoot(Settings);
		}

		///// <summary>
		///// Gets test run settings.
		///// By default: test settings from App.config, users credentials from TestCredentials.json.
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
		///// Logs out from Innovator after test is finished.
		///// </summary>
		//protected override void Logout()
		//{
		//	// Default implementation:

		//	Actor.AttemptsTo(LogOut.FromInnovator);
		//}

		///// <summary>
		///// Activates necessary Subscription(use Feature License from App.config, fields Aras.PDFViewer, Aras.ArasHTMLtoPDFConverter, Aras.ArasEssentialsSubscription, Aras.SelfServiceReporting, etc.) 
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
		///// Gets user info to create Innovator actor for test. You can init actor only based on existing user. 
		///// Should be implemented in all test which is inherited from <see cref="BaseTafInnovator12Test" />
		///// </summary>
		///// <returns>Test user info</returns>
		//protected override IInnovatorLoginCredentials GetTestUserInfo()
		//{
		//	// Example1:

		//	return Settings.UsersCredentials.Admin;

		//	// Example2:

		//	return Settings.UsersCredentials.GetUserCredentials("TestUserA");
		//}

		///// <summary>
		///// Re-initializes actor when browser was closed but not all tests are finished.
		///// </summary>
		//protected override void ReInitActor()
		//{
		//	// Default implementation:

		//	InitActor();
		//}

		///// <summary>
		///// Setups test preconditions using AML(Aras Markup language)
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
		///// Creates WebBrowser and add it to actor abilities​
		///// </summary>
		//protected override void AddBrowserAbility()
		//{
		//	// Default implementation:

		//	WebBrowser webBrowser = InnovatorWebBrowser.With(Settings);
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
		///// Initializes some data for test(models/lists/dictionaries with expected data, keys, etc.)
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
		///// Generates extent report based on ReportObserver with screenshots in steps with error.
		///// By default: screenShot name format is 'Screenshot_{0:G}').
		///// </summary>
		//protected override void GenerateReport()
		//{
		//	// Default implementation:

		//	GenerateSeparateReportWithScreenshots.For(ReportObserver);

		//	// Example:

		//	//GenerateSeparateReport.For(ReportObserver);
		//}

		///// <summary>
		///// Disposes actor​.
		///// </summary>
		//protected override void DisposeActor()
		//{
		//	// Default implementation:

		//	Actor.Dispose();

		//	// Example:

		//	NoEffsUser.Dispose();
		//	EffsUser.Dispose();

		//	//base.DisposeActor();
		//}

		///// <summary>
		///// Global postcondition after all tests are finished.
		///// </summary>
		//protected override void SetTearDownPostconditions()
		//{
		//	// Default implementation: empty

		//	// Example:

		//	SystemActor.AttemptsTo(Run.EsCrawler(SolrCleanerCrawlerType));
		//}
	}
}