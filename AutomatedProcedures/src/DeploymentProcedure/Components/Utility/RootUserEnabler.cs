using DeploymentProcedure.Logging;
using System;
using System.Data.SqlClient;

namespace DeploymentProcedure.Components.Utility
{
	internal sealed class RootUserEnabler : IDisposable
	{
		private readonly DatabaseComponent _databaseComponent;
		private readonly bool _preservedRootUserLogonEnabled;

		public RootUserEnabler(DatabaseComponent databaseComponent)
		{
			_databaseComponent = databaseComponent;

			string rootUserLogonEnabled = RetrieveRootLogonEnabled();
			_preservedRootUserLogonEnabled = rootUserLogonEnabled.Equals("1", StringComparison.OrdinalIgnoreCase) ? true : false;
		}

		public void Enable()
		{
			if (!_preservedRootUserLogonEnabled)
			{
				Logger.Instance.Log(LogLevel.Info, "\t Enabling '{0}' user logon for {1} database...", _databaseComponent.LoginOfRootInnovatorUser, _databaseComponent.Id);

				SetRootLogonEnabled(true);
			}

			Logger.Instance.Log(LogLevel.Info, "\t The '{0}' user logon is enabled for {1} database...", _databaseComponent.LoginOfRootInnovatorUser, _databaseComponent.Id);
		}

		public void Dispose()
		{
			if (!_preservedRootUserLogonEnabled)
			{
				Logger.Instance.Log(LogLevel.Info, "\t Disabling '{0}' user logon option for {1} database...", _databaseComponent.LoginOfRootInnovatorUser, _databaseComponent.Id);

				SetRootLogonEnabled(_preservedRootUserLogonEnabled);
			}
		}

		private string RetrieveRootLogonEnabled()
		{
			using (SqlConnection connection = new SqlConnection(_databaseComponent.InnovatorConnectionStringToDatabase))
			{
				connection.Open();

				const string retrieveRootLogonEnabledQuery = "SELECT logon_enabled FROM [innovator].[USER]" +
								" WHERE [login_name] = @LoginName";
				using (SqlCommand retrieveRootLogonEnabledCommand = new SqlCommand(retrieveRootLogonEnabledQuery, connection))
				{
					retrieveRootLogonEnabledCommand.CommandTimeout = 3600;

					retrieveRootLogonEnabledCommand.Parameters.AddWithValue("@LoginName", _databaseComponent.LoginOfRootInnovatorUser);

					SqlDataReader reader = retrieveRootLogonEnabledCommand.ExecuteReader();
					reader.Read();

					return reader.GetString(0);
				}
			}
		}

		private void SetRootLogonEnabled(bool logonEnabled)
		{
			using (SqlConnection connection = new SqlConnection(_databaseComponent.InnovatorConnectionStringToDatabase))
			{
				connection.Open();

				const string setRootLogonEnabledQuery = "UPDATE [innovator].[USER] SET" +
								" [logon_enabled] = @LogonEnabled" +
								" WHERE [login_name] = @LoginName";
				using (SqlCommand setRootLogonEnabledCommand = new SqlCommand(setRootLogonEnabledQuery, connection))
				{
					setRootLogonEnabledCommand.CommandTimeout = 3600;

					setRootLogonEnabledCommand.Parameters.AddWithValue("@LogonEnabled", logonEnabled ? "1" : "0");
					setRootLogonEnabledCommand.Parameters.AddWithValue("@LoginName", _databaseComponent.LoginOfRootInnovatorUser);

					setRootLogonEnabledCommand.ExecuteNonQuery();
				}
			}
		}
	}
}
