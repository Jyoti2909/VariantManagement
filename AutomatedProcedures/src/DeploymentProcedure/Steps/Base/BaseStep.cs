using DeploymentProcedure.Components.Base;
using System.Collections.Generic;

namespace DeploymentProcedure.Steps.Base
{
	public abstract class BaseStep
	{
		public abstract void Execute(IReadOnlyCollection<Component> instanceComponents);
	}
}
