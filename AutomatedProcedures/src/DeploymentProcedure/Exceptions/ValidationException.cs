using System;
using System.Runtime.Serialization;

namespace DeploymentProcedure.Exceptions
{
	[Serializable]
	public class ValidationException : CommonException
	{
		public ValidationException()
		{
		}

		public ValidationException(string message) : base(message)
		{
		}

		public ValidationException(string message, Exception innerException) : base(message, innerException)
		{
		}

		protected ValidationException(SerializationInfo info, StreamingContext context) : base(info, context)
		{
		}
	}
}
