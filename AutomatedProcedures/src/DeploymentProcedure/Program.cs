using CommandLine;
using DeploymentProcedure.Utility;
using System.Collections.Generic;

namespace DeploymentProcedure
{
	class Program
	{
		public static void Main(string[] args)
		{
			Parser.Default.ParseArguments<CommandLineOptions>(args)
				.WithParsed(options => Run(Instance.FromXml(options.PathToConfig), options.Targets));
		}

		private static void Run(Instance instance, IEnumerable<Target> targets)
		{
			InstanceConfigValidator.Validate(instance);

			foreach (Target target in targets)
			{
				switch (target)
				{
					case Target.Backup:
						instance.Backup();
						break;
					case Target.Cleanup:
						instance.Remove();
						break;
					case Target.Deploy:
						instance.Deploy();
						break;
				}
			}
		}
	}
}
