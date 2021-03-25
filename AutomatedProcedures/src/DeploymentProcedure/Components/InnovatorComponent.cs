using DeploymentProcedure.Components.Type;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Xml;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("innovator")]
	public class InnovatorComponent : WebComponent
	{
		public SecretString LicenseString { get; set; }
		public string LicenseKey { get; set; }
		public string LicenseActivationKey { get; set; }
		public string LicenseType { get; set; } = "Unlimited";
		public string LicenseCompany { get; set; } = string.Empty;
		public string SmtpServer { get; set; } = "queue";
		public string InnovatorServerAspxUrl => Url.TrimEnd('/') + "/Server/InnovatorServer.aspx";
		[XmlElement("OperatingParameter")]
		public Collection<OperatingParameter> OperatingParameters { get; set; }

		#region Overriding CodeTreeComponent properties
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "Innovator");
		public override string DeploymentPackageDirectoryName { get; set; } = "Innovator";
		public override bool IsOAuthPublicCertificateRequired { get; set; } = true;
		public override string OAuthCertificateName { get; set; } = "InnovatorServer";
		public override string OAuthCertificatesTemplateDir { get; set; } = @"Innovator\Server\App_Data\Certificates";
		public override string OAuthConfigTemplateFile { get; set; } = @"Innovator\Server\OAuth.config";
		public override string OAuthConfigCertificatePasswordXpath { get; set; } = "/oauth/client/secret/certificate/@password";
		private string _pathToConfig;
		public override string PathToConfig
		{
			get { return _pathToConfig ?? Path.Combine(InstallationPath, "..\\InnovatorServerConfig.xml"); }
			set { _pathToConfig = value; }
		}
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "Innovator");
		public override string PathToConfigTemplate => Path.Combine(Properties.PathToTemplates, "InnovatorServerConfig.xml");
		public override string PathToBasicConfig => Path.Combine(InstallationPath, "Server\\Innovator.xml");
		#endregion

		#region Implementing Setup logic
		public override void Setup()
		{
			base.Setup();

			SetupNtfsPermissions();
			SetupAdditionalApplications();
			SetupAuth();
			SetupInnovatorServerConfig();
		}

		public void SetupWinAuth()
		{
			WebAdministration.SetupWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Client/Scripts/login.aspx");
			WebAdministration.SetupWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Client/Scripts/IOMlogin.aspx");
		}

		internal void SetupNtfsPermissions()
		{
			string[] foldersToGrantAccess =
			{
				"Client\\jsBundles",
				"Server\\data",
				"Server\\dll",
				"Server\\logs",
				"Server\\temp"
			};

			foreach (string folderPath in foldersToGrantAccess)
			{
				SetupNtfsPermissionsToFolder(Path.Combine(InstallationPath, folderPath));
			}
		}

		private void SetupAdditionalApplications()
		{
			WebAdministration.SetupApplication(ServerName, SiteName, VirtualDirectoryPath + "/Client", ApplicationPoolName, Path.Combine(InstallationPath, "Client"));
			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath + "/Client");
			WebAdministration.SetupApplication(ServerName, SiteName, VirtualDirectoryPath + "/NotificationServer", ApplicationPoolName, Path.Combine(InstallationPath, "Server"));
			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath + "/NotificationServer");
			WebAdministration.SetupApplication(ServerName, SiteName, VirtualDirectoryPath + "/Server", ApplicationPoolName, Path.Combine(InstallationPath, "Server"));
			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath + "/Server");
		}

		private void SetupAuth()
		{
			WebAdministration.SetupWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Server/SharePoint/Auth");
			WebAdministration.SetupWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/NotificationServer/UserNotifications/Auth");
		}

		private void SetupInnovatorServerConfig()
		{
			TargetFileSystem.CopyFile(PathToBasicConfig, TargetFileSystem, Path.Combine(InstallationPath, "Client\\Innovator.xml"), true);

			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/operating_parameter[@key='temp_folder']/@value", Path.Combine(InstallationPath, "Server\\temp"));
			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/operating_parameter[@key='ServerMethodTempDir']/@value", Path.Combine(InstallationPath, "Server\\dll"));
			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/operating_parameter[@key='debug_log_prefix']/@value", Path.Combine(InstallationPath, "Server\\logs"));

			foreach (OperatingParameter operatingParameter in OperatingParameters)
			{
				SetupOperatingParameter(operatingParameter);
			}

			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/Mail/@SMTPServer", SmtpServer);

			SetupLicense();
		}

		private void SetupLicense()
		{
			if (LicenseString != null && !string.IsNullOrEmpty(LicenseString.Value))
			{
				if (TargetFileSystem.XmlHelper.CheckIfExists(PathToConfig, "/Innovator/License"))
				{
					TargetFileSystem.XmlHelper.RemoveNode(TargetFileSystem.XmlHelper.GetNode(PathToConfig, "/Innovator/License"));
				}

				string unescapedLicenseString = LicenseString.Value.Replace("\"\"", "\"");
				TargetFileSystem.XmlHelper.AppendFragment(unescapedLicenseString, TargetFileSystem.XmlHelper.GetNode(PathToConfig, "/Innovator"));
			}
			else
			{
				TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/License/@lic_type", LicenseType);
				TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/License/@lic_key", LicenseKey);
				TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/License/@act_key", LicenseActivationKey);
				if (!string.IsNullOrEmpty(LicenseCompany))
				{
					XmlNode innovatorLicenseNode = TargetFileSystem.XmlHelper.GetNode(PathToConfig, "/Innovator/License");
					if (innovatorLicenseNode.SelectSingleNode("/@company") != null)
					{
						TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/Innovator/License/@company", LicenseCompany);
					}
					else
					{
						XmlDocument innovatorServerConfig = innovatorLicenseNode.OwnerDocument;
						XmlAttribute companyNameAttribute = innovatorServerConfig.CreateAttribute("company");
						companyNameAttribute.Value = LicenseCompany;
						innovatorLicenseNode.Attributes.Append(companyNameAttribute);
						TargetFileSystem.XmlHelper.SaveXmlDocument(innovatorServerConfig);
					}
				}
			}
		}

		private void SetupOperatingParameter(OperatingParameter operatingParameter)
		{
			string operatingParameterXPath = string.Format(CultureInfo.InvariantCulture, "/Innovator/operating_parameter[@key = '{0}']", operatingParameter.Key);
			if (TargetFileSystem.XmlHelper.CheckIfExists(PathToConfig, operatingParameterXPath))
			{
				TargetFileSystem.XmlHelper.RemoveNode(TargetFileSystem.XmlHelper.GetNode(PathToConfig, operatingParameterXPath));
			}

			TargetFileSystem.XmlHelper.AppendFragment(operatingParameter.ToXml, TargetFileSystem.XmlHelper.GetNode(PathToConfig, "/Innovator"));
		}
		#endregion

		#region Implementing Cleanup logic
		public override void Remove()
		{
			base.Remove();

			RemoveAuth();
			RemoveWinAuth();
		}

		public void RemoveWinAuth()
		{
			WebAdministration.RemoveWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Client/Scripts/login.aspx");
			WebAdministration.RemoveWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Client/Scripts/IOMlogin.aspx");
		}

		private void RemoveAuth()
		{
			WebAdministration.RemoveWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/Server/SharePoint/Auth");
			WebAdministration.RemoveWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/NotificationServer/UserNotifications/Auth");
		}
		#endregion

		#region Implementing ApplyPackage
		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			TransformationUtil.ApplyTransformations(this, BaseFileSystem.CombinePaths(package.PathToDeploymentPackage, package.RelativePathToTransformations));
			package.ApplyToInnovatorComponent(this);
		}
		#endregion
	}
}
