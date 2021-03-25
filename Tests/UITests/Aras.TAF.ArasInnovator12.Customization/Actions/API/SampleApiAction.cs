//using Aras.TAF.ArasInnovatorBase.Models.UserModel;
//using System;
//using Aras.TAF.ArasInnovatorBase.Models.UserModel;
//using Aras.TAF.ArasInnovatorBase.Domain.IOM;
//using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.Core;

namespace Aras.TAF.ArasInnovator12.Customization.Actions.API
{
	// This is a class example of API Action which allows to add user to identity

	// The more suitable name for this class according to the provided example is 'AddUserToIdentity'
	public class SampleApiAction : ActionUnit
	{
		//protected IUserInfo UserInfo { get; }
		//protected string IdentityName { get; }

		public override string Name => "Your action description";
		//public override string Name => FormattableString.Invariant($"Add User {UserInfo:F} to => {IdentityName}");

		/// <summary>
		/// Initializes a new instance of the <see cref="AddUserToIdentity"/> class
		/// </summary>
		/// <param name="userInfo"></param>
		/// <param name="identityName">Identity name to add</param>
		//public AddUserToIdentity(IUserInfo userInfo, string identityName)
		//{
		//	UserInfo = Guard.NotNull(userInfo, nameof(userInfo));
		//	IdentityName = Guard.NotNullOrEmpty(identityName, nameof(identityName));
		//}

		protected override void ExecuteAttemptsTo(IInnerActorFacade actor)
		{
			//InnovatorUserHelper.AddUserToIdentity(UserInfo, IdentityName);
		}
	}
}