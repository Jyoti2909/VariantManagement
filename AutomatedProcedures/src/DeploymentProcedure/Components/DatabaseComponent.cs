using Aras.IOM;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Components.Type;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Data.SqlClient;
using System.Data;
using System.IO;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Components.Utility;
using System.Xml.Serialization;
using System.Globalization;

namespace DeploymentProcedure.Components
{
	[XmlType("database")]
	public class DatabaseComponent : Component
	{
		public string SqlServer { get; set; }
		public string DatabaseName { get; set; }
		public string PathToDatabaseBackup { get; set; } = Properties.PathToDBBak;
		public string SaLogin { get; set; } = "sa";
		public SecretString SaPassword { get; set; } = new SecretString { Value = "innovator" };
		public string InnovatorLogin { get; set; } = "innovator";
		public SecretString InnovatorPassword { get; set; } = new SecretString { Value = "innovator" };
		public string InnovatorRegularLogin { get; set; } = "innovator_regular";
		public SecretString InnovatorRegularPassword { get; set; } = new SecretString { Value = "innovator_regular" };
		public string LoginOfRootInnovatorUser { get; set; } = "root";
		public SecretString PasswordOfRootInnovatorUser { get; set; } = new SecretString { Value = "innovator" };
		public string InnovatorUrl { get; set; }
		public string InnovatorServerAspxUrl => InnovatorUrl.TrimEnd('/') + "/Server/InnovatorServer.aspx";
		public string PreAmlDeploymentScriptsDirectoryName { get; set; } = "AmlDeploymentScripts\\1-BeforeAmlPackagesImport";
		public string PostAmlDeploymentScriptsDirectoryName { get; set; } = "AmlDeploymentScripts\\2-AfterAmlPackagesImport";
		public string AmlPackagesDirectoryName { get; set; } = "AML-packages";
		public string AmlPackagesManifest { get; set; } = "imports.mf";
		public string PathToConsoleUpgradeLogFile { get; set; } = Path.Combine(Properties.PathToLogs, "Upgrade.DB.log");
		public string LanguagePacksDirectoryName { get; set; } = "Language packs";

		internal string InnovatorConnectionString => string.Format(CultureInfo.InvariantCulture, "Data Source={0};User Id={1};Password={2}", SqlServer, InnovatorLogin, InnovatorPassword.Value);
		internal string InnovatorConnectionStringToDatabase => string.Format(CultureInfo.InvariantCulture, "{0};Initial Catalog={1}", InnovatorConnectionString, DatabaseName);

		private string SaConnectionString => string.Format(CultureInfo.InvariantCulture, "Data Source={0};User Id={1};Password={2}", SqlServer, SaLogin, SaPassword.Value);
		private string SaConnectionStringToDatabase => string.Format(CultureInfo.InvariantCulture, "{0};Initial Catalog={1}", SaConnectionString, DatabaseName);

		#region Implementing Setup logic
		public override void RunPreSetupValidation()
		{
			base.RunPreSetupValidation();

			ValidationHelper.CheckSqlServerConnection(SaConnectionString);
			ValidationHelper.CheckSqlServerConnection(InnovatorConnectionString);
			ValidationHelper.CheckSqlServerConnection(string.Format("Data Source={0};User Id={1};Password={2}", SqlServer, InnovatorRegularLogin, InnovatorRegularPassword.Value));
		}

		public override void Setup()
		{
			base.Setup();

			RestoreDatabase();

			MapUserToLogin("innovator", InnovatorLogin);
			MapUserToLogin("innovator_regular", InnovatorRegularLogin);

			UpdateInnovatorUser(CryptoHelper.MD5Hash("innovator"), "admin", "Innovator", "Admin", "30B991F927274FA3829655F50C99472E");
			UpdateInnovatorUser(CryptoHelper.MD5Hash("innovator"), "root", "Super", "User", "AD30A6D8D3B642F5A2AFED1A4B02BEFA");
			UpdateInnovatorUser(CryptoHelper.MD5Hash("vadmin"), "vadmin", "Vault", "Admin", "EB2D5AA617FB41A28F081345B8B5FECB");
		}

		private void RestoreDatabase()
		{
			using (SqlConnection connection = CreateLoggingSqlConnection(SaConnectionString))
			{
				connection.Open();

				string restoreDatabaseQuery = ResourceHelper.RetrieveResource("RestoreDatabase.sql");
				using (SqlCommand restoreDatabaseCommand = new SqlCommand(restoreDatabaseQuery, connection))
				{
					restoreDatabaseCommand.CommandTimeout = 3600;

					restoreDatabaseCommand.Parameters.AddWithValue("@path_to_db_bak", PathToDatabaseBackup);
					restoreDatabaseCommand.Parameters.AddWithValue("@database_name", DatabaseName);
					restoreDatabaseCommand.Parameters.AddWithValue("@database_name_to_sql_object", DatabaseName);
					restoreDatabaseCommand.Parameters.AddWithValue("@sql_server_data_paths_list", string.Empty);

					restoreDatabaseCommand.ExecuteNonQuery();
				}
			}
		}

		// TODO: foresee Win Auth. Maybe again stored procedure
		private void MapUserToLogin(string user, string login)
		{
			using (SqlConnection connection = CreateLoggingSqlConnection(SaConnectionStringToDatabase))
			{
				connection.Open();

				using (SqlCommand mapUsersToLoginsCommand = new SqlCommand("sp_change_users_login", connection))
				{
					mapUsersToLoginsCommand.CommandType = CommandType.StoredProcedure;

					mapUsersToLoginsCommand.Parameters.AddWithValue("@Action", "Update_One");
					mapUsersToLoginsCommand.Parameters.AddWithValue("@UserNamePattern", user);
					mapUsersToLoginsCommand.Parameters.AddWithValue("@LoginName", login);

					mapUsersToLoginsCommand.ExecuteNonQuery();
				}
			}
		}

		private void UpdateInnovatorUser(string passwordHash, string loginName, string firstName, string lastName, string id)
		{
			using (SqlConnection connection = CreateLoggingSqlConnection(SaConnectionStringToDatabase))
			{
				connection.Open();

				const string updateUserQuery = "UPDATE [innovator].[USER] SET" +
												" [password] = @PasswordHash" +
												", [logon_enabled] = '1'" +
												", [login_name] = @LoginName" +
												", [first_name] = @FirstName" +
												", [last_name] = @LastName" +
												" WHERE [id] = @Id";
				using (SqlCommand mapUsersToLoginsCommand = new SqlCommand(updateUserQuery, connection))
				{
					mapUsersToLoginsCommand.Parameters.AddWithValue("@PasswordHash", passwordHash);
					mapUsersToLoginsCommand.Parameters.AddWithValue("@LoginName", loginName);
					mapUsersToLoginsCommand.Parameters.AddWithValue("@FirstName", firstName);
					mapUsersToLoginsCommand.Parameters.AddWithValue("@LastName", lastName);
					mapUsersToLoginsCommand.Parameters.AddWithValue("@Id", id);

					mapUsersToLoginsCommand.ExecuteNonQuery();
				}
			}
		}

		private static SqlConnection CreateLoggingSqlConnection(string connectionString)
		{
			SqlConnection connection = new SqlConnection(connectionString);
			connection.InfoMessage += (s, e) => Logger.Instance.Log(LogLevel.Info, e.Message);
			return connection;
		}
		#endregion

		#region Implementing Clenaup logic
		public override void Remove()
		{
			Logger.Instance.Log(LogLevel.Info, "\nRemoving component ({0}):\n", Id);

			using (SqlConnection connection = new SqlConnection(SaConnectionString))
			{
				connection.Open();

				string dropDatabaseQuery = "DECLARE @drop_database_query NVARCHAR(4000) = N'IF DB_ID(''' + @database_name + ''') IS NOT NULL" +
											" BEGIN DROP DATABASE [' + @database_name + ']; END';" +
											" EXECUTE sp_executesql  @drop_database_query";
				using (SqlCommand dropDatabaseCommand = new SqlCommand(dropDatabaseQuery, connection))
				{
					dropDatabaseCommand.CommandTimeout = 3600;

					dropDatabaseCommand.Parameters.AddWithValue("@database_name", DatabaseName);

					dropDatabaseCommand.ExecuteNonQuery();
				}
			}
		}
		#endregion

		#region Implementing ApplyPackage
		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			using (RootUserEnabler rootUserEnabler = new RootUserEnabler(this))
			{
				rootUserEnabler.Enable();

				package.ApplyToDatabaseComponent(this);
			}
		}

		public override void HealthCheck()
		{
			using (RootUserEnabler rootUserEnabler = new RootUserEnabler(this))
			{
				rootUserEnabler.Enable();

				ValidationHelper.CheckAmlApplicability(this);
			}
		}

		public void ApplyAmlsFromFolder(string pathToFolder)
		{
			foreach (string pathToPostAmlDeploymentScript in Directory.GetFiles(pathToFolder))
			{
				Logger.Instance.Log(LogLevel.Info, "\t Applying script {0}...", pathToPostAmlDeploymentScript);

				ApplyAmlFromFile(pathToPostAmlDeploymentScript);
			}
		}

		public void ApplyAmlsFromFolderRecursively(string root)
		{
			ApplyAmlsFromFolder(root);
			string[] directories = Directory.GetDirectories(root);
			foreach (string pathToAmlDeploymentScripts in directories)
			{
				ApplyAmlsFromFolderRecursively(pathToAmlDeploymentScripts);
			}
		}

		public void ApplyAmlFromFile(string pathToFile)
		{
			string aml = File.ReadAllText(pathToFile);
			ApplyAml(aml);
		}

		public void ApplyAml(string aml)
		{
			HttpServerConnection connection = ServerConnectionFactory.GetServerConnection(this);
			Innovator innovator = new Innovator(connection);
			Item result = innovator.applyAML(aml);
			if (result.isError())
			{
				Logger.Instance.Log(LogLevel.Error, result.ToString());

				throw new Exception(string.Format(CultureInfo.InvariantCulture, "Failed to apply AML {0}.", aml));
			}
		}
		#endregion

		#region Implement Backup logic
		public override void Backup(string pathToBackupDir)
		{
			base.Backup(pathToBackupDir);

			BackupDatabase(pathToBackupDir);
		}

		private void BackupDatabase(string pathToDatabaseBackupFolder)
		{
			ValidationHelper.CheckSqlServerConnection(SaConnectionString);

			using (SqlConnection connection = CreateLoggingSqlConnection(SaConnectionString))
			{
				connection.Open();

				string backupDatabaseQuery = ResourceHelper.RetrieveResource("BackupDatabase.sql");
				using (SqlCommand backupDatabaseCommand = new SqlCommand(backupDatabaseQuery, connection))
				{
					backupDatabaseCommand.CommandTimeout = 3600;
					backupDatabaseCommand.Parameters.AddWithValue("@database_name", DatabaseName);
					backupDatabaseCommand.Parameters.AddWithValue("@path_to_db_backup", BaseFileSystem.CombinePaths(pathToDatabaseBackupFolder, "DB.bak"));
					backupDatabaseCommand.ExecuteNonQuery();
				}
			}
		}
		#endregion
	}
}
