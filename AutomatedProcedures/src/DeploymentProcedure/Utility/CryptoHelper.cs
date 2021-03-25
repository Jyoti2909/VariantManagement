using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace DeploymentProcedure.Utility
{
	internal static class CryptoHelper
	{
		private static MD5CryptoServiceProvider md5provider = new MD5CryptoServiceProvider();

		internal static string MD5Hash(string input)
		{
			StringBuilder hash = new StringBuilder();
			foreach (byte b in md5provider.ComputeHash(Encoding.UTF8.GetBytes(input)))
			{
				hash.Append(b.ToString("x2", CultureInfo.InvariantCulture));
			}
			return hash.ToString();
		}
	}
}
