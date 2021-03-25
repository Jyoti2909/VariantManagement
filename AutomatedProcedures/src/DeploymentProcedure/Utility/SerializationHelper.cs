using System;
using System.Collections.Generic;
using System.Reflection;

namespace DeploymentProcedure.Utility
{
	internal static class SerializationHelper
	{
		internal static IEnumerable<Type> GetAllSubtypes(Type baseType)
		{
			foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
			{
				foreach (Type type in assembly.GetTypes())
				{
					if (type.IsSubclassOf(baseType))
					{
						yield return type;
					}
				}
			}
		}
	}
}
