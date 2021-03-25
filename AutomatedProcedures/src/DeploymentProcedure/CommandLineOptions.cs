using CommandLine;
using System.Collections.Generic;

namespace DeploymentProcedure
{
	public enum Target
	{
		Backup,
		Cleanup,
		Deploy
	};

	public class CommandLineOptions
	{
		[Option('t', "targets", Separator = ',', Required = true, HelpText = "A comma separated list of targets you want to run. (e. g. -t Backup,Cleanup,Deploy)")]
		public IEnumerable<Target> Targets { get; set; }
		[Option('c', "config", Required = true, HelpText = "The absolute path to the XML config file that describes Innovator structure")]
		public string PathToConfig { get; set; }
	}
}
