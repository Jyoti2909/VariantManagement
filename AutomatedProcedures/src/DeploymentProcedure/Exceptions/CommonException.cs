using System;
using System.Runtime.Serialization;

namespace DeploymentProcedure.Exceptions
{
	[Serializable]
	public class CommonException : Exception
	{
		public CommonException()
		{
		}

		public CommonException(string message) : base(message)
		{
		}

		public CommonException(string message, Exception innerException) : base(message, innerException)
		{
		}

		protected CommonException(SerializationInfo info, StreamingContext context) : base(info, context)
		{
		}
	}
}
