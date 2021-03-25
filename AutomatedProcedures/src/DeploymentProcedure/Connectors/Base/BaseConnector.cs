using DeploymentProcedure.Components.Base;
using System.Collections.Generic;

namespace DeploymentProcedure.Connectors.Base
{
	public abstract class BaseConnector
	{
		public abstract void Connect(IReadOnlyCollection<Component> instanceComponents);
	}
}
