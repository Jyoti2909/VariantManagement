using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Collections.Generic;
using System.IO;

namespace DeploymentProcedure.Utility
{
	internal class OAuthCertificatesManager
	{
		private readonly IReadOnlyCollection<Component> _componentsForSetup;
		private readonly IFileSystem _fileSystem;
		private readonly string _issuer;
		private readonly DateTime _validity;

		public OAuthCertificatesManager(IFileSystem fileSystem, IReadOnlyCollection<Component> componentsForSetup, string issuer, DateTime validity)
		{
			_fileSystem = fileSystem;
			_componentsForSetup = componentsForSetup;
			_issuer = issuer;
			_validity = validity;
		}

		internal void GenerateCertificates()
		{
			UpdateCertificatesPasswordIfRequired();

			(OAuthCertificateInfo oAuthServerCertificateInfo, List<ResourceCertificateInfo> resourceServersCertificateInfo) = InitializeCertificatesInfo();

			if (oAuthServerCertificateInfo != null)
			{
				CreateAndPlaceCertificatesToTemplates(oAuthServerCertificateInfo, resourceServersCertificateInfo);
			}
		}

		private void CreateAndPlaceCertificatesToTemplates(
			OAuthCertificateInfo oAuthServerCertificateInfo,
			IEnumerable<ResourceCertificateInfo> resourceServersCertificateInfo)
		{
			if (!Directory.Exists(oAuthServerCertificateInfo.CertificateTemplateDir))
			{
				Directory.CreateDirectory(oAuthServerCertificateInfo.CertificateTemplateDir);
			}

			string oAuthCertificatePfx = Path.Combine(oAuthServerCertificateInfo.CertificateTemplateDir, $"{oAuthServerCertificateInfo.Name}.pfx");
			string oAuthCertificateCer = Path.Combine(oAuthServerCertificateInfo.CertificateTemplateDir, $"{oAuthServerCertificateInfo.Name}.cer"); ;

			CertificateUtil.GenerateCertificate(_fileSystem, oAuthCertificatePfx, oAuthCertificateCer, _issuer, oAuthServerCertificateInfo.CertificatePassword, _validity);

			foreach (ResourceCertificateInfo resourceServerCertificateInfo in resourceServersCertificateInfo)
			{
				if (!Directory.Exists(resourceServerCertificateInfo.CertificateTemplateDir))
				{
					Directory.CreateDirectory(resourceServerCertificateInfo.CertificateTemplateDir);
				}

				if (resourceServerCertificateInfo.IsOAuthPublicCertificateRequired)
				{
					_fileSystem.CopyFile(oAuthCertificateCer, _fileSystem, Path.Combine(resourceServerCertificateInfo.CertificateTemplateDir, Path.GetFileName(oAuthCertificateCer)), true);
				}

				string resourceCertificatePfx = Path.Combine(resourceServerCertificateInfo.CertificateTemplateDir, $"{resourceServerCertificateInfo.Name}.pfx");
				string resourceCertificateCer = Path.Combine(resourceServerCertificateInfo.CertificateTemplateDir, $"{resourceServerCertificateInfo.Name}.cer");

				CertificateUtil.GenerateCertificate(_fileSystem, resourceCertificatePfx, resourceCertificateCer, _issuer, resourceServerCertificateInfo.CertificatePassword, _validity);

				string targetresourceCertificateCerPath = Path.Combine(oAuthServerCertificateInfo.CertificateTemplateDir, Path.GetFileName(resourceCertificateCer));
				if (_fileSystem.FileExists(targetresourceCertificateCerPath))
				{
					_fileSystem.DeleteFile(targetresourceCertificateCerPath);
				}

				_fileSystem.MoveFile(resourceCertificateCer, _fileSystem, targetresourceCertificateCerPath);
			}
		}

		private (OAuthCertificateInfo, List<ResourceCertificateInfo>) InitializeCertificatesInfo()
		{
			OAuthCertificateInfo oAuthServerCertificateInfo = null;
			List<ResourceCertificateInfo> resourceServersCertificateInfo = new List<ResourceCertificateInfo>();

			foreach (Component component in _componentsForSetup)
			{
				if (component is CodeTreeComponent codeTreeComponent
					&& !string.IsNullOrEmpty(codeTreeComponent.OAuthCertificateName)
					&& !string.IsNullOrEmpty(codeTreeComponent.OAuthCertificatesTemplateDir)
					&& !string.IsNullOrEmpty(codeTreeComponent.OAuthConfigCertificatePasswordXpath)
					&& !string.IsNullOrEmpty(codeTreeComponent.OAuthConfigTemplateFile))
				{
					ResourceCertificateInfo certificateInfo = new ResourceCertificateInfo(
						codeTreeComponent.OAuthCertificateName,
						Path.Combine(Properties.PathToTemplates, codeTreeComponent.OAuthCertificatesTemplateDir),
						string.IsNullOrEmpty(codeTreeComponent.OAuthCertificatePassword)
							? _fileSystem.XmlHelper.XmlPeek(Path.Combine(Properties.PathToTemplates, codeTreeComponent.OAuthConfigTemplateFile), codeTreeComponent.OAuthConfigCertificatePasswordXpath)
							: codeTreeComponent.OAuthCertificatePassword,
						codeTreeComponent.IsOAuthPublicCertificateRequired);

					if (component is OAuthComponent)
					{
						oAuthServerCertificateInfo = certificateInfo;
					}
					else
					{
						resourceServersCertificateInfo.Add(certificateInfo);
					}
				}
			}

			return (oAuthServerCertificateInfo, resourceServersCertificateInfo);
		}

		private void UpdateCertificatesPasswordIfRequired()
		{
			foreach (Component component in _componentsForSetup)
			{
				if (component is CodeTreeComponent codeTreeComponent
					&& !string.IsNullOrEmpty(codeTreeComponent.OAuthCertificatePassword))
				{
					_fileSystem.XmlHelper.XmlPoke(
						Path.Combine(Properties.PathToTemplates, codeTreeComponent.OAuthConfigTemplateFile),
						codeTreeComponent.OAuthConfigCertificatePasswordXpath,
						codeTreeComponent.OAuthCertificatePassword);
				}
			}
		}

		private class OAuthCertificateInfo
		{
			public string Name { get; set; }
			public string CertificateTemplateDir { get; set; }
			public string CertificatePassword { get; set; }

			public OAuthCertificateInfo(string name, string certificateTemplateDir, string certificatePassword)
			{
				Name = name;
				CertificateTemplateDir = certificateTemplateDir;
				CertificatePassword = certificatePassword;
			}
		}

		private class ResourceCertificateInfo : OAuthCertificateInfo
		{
			public bool IsOAuthPublicCertificateRequired { get; set; }

			public ResourceCertificateInfo(string name, string certificateFolderPath, string certificatePassword, bool isOAuthPublicCertificateRequired)
				: base(name, certificateFolderPath, certificatePassword)
			{
				IsOAuthPublicCertificateRequired = isOAuthPublicCertificateRequired;
			}
		}
	}
}
