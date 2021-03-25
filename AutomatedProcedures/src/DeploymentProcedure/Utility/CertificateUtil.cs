using DeploymentProcedure.Utility.FileSystem.Base;
using Pluralsight.Crypto;
using System;
using System.Security.Cryptography.X509Certificates;

namespace DeploymentProcedure.Utility
{
	internal static class CertificateUtil
	{
		internal static void GenerateCertificate(
			IFileSystem fileSystem,
			string pathToPfx,
			string pathToCer,
			string issuer,
			string password,
			DateTime validity)
		{
			using (CryptContext ctx = new CryptContext())
			{
				ctx.Open();

				X509Certificate2 cert = ctx.CreateSelfSignedCertificate(
					new SelfSignedCertProperties
					{
						IsPrivateKeyExportable = true,
						KeyBitLength = 2048,
						Name = new X500DistinguishedName($"cn={issuer}"),
						ValidFrom = DateTime.Today.AddDays(-1),
						ValidTo = validity
					});

				if (fileSystem.FileExists(pathToPfx))
				{
					fileSystem.DeleteFile(pathToPfx);
				}

				fileSystem.WriteAllBytesToFile(pathToPfx, cert.Export(X509ContentType.Pfx, password));

				if (fileSystem.FileExists(pathToCer))
				{
					fileSystem.DeleteFile(pathToCer);
				}

				fileSystem.WriteAllTextToFile(pathToCer,
					"-----BEGIN CERTIFICATE-----\r\n"
					+ Convert.ToBase64String(cert.Export(X509ContentType.Cert), Base64FormattingOptions.InsertLineBreaks)
					+ "\r\n-----END CERTIFICATE-----");
			}
		}
	}
}
