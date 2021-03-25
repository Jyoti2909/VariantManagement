//using System;
//using Aras.TAF.Core.Selenium.Models;
//using System.Drawing;
//using Aras.TAF.Core;
using Aras.TAF.Core.Selenium.Models;

namespace Aras.TAF.ArasInnovator12.Customization.Models
{
	/// Example of the model of Border property for web element

	// The more suitable name for this class according to the provided example is 'BorderModel'
	public class SampleModel /* : IEquatable<BorderModel> */
	{
		/// <summary>
		/// The width of the border
		/// </summary>
		//public string Width { get; }

		/// <summary>
		/// The style of the border
		/// </summary>
		//public string Style { get; }

		/// <summary>
		/// The Color of the border
		/// </summary>
		//public Color Color { get; }

		/// <summary>
		/// The side where border are on
		/// </summary>
		//public Side BorderLocation { get; }


		/// <summary>
		/// Creates a new instance of <see cref="BorderModel"/>
		/// </summary>
		/// <param name="borderLocation">The place where the border are situated</param>
		/// <param name="width"></param>
		/// <param name="style"></param>
		/// <param name="color"></param>
		//public BorderModel(Side borderLocation, string width, string style, Color color)
		//{
		//	BorderLocation = borderLocation;
		//	Width = Guard.NotNullOrEmpty(width, nameof(width));
		//	Style = Guard.NotNullOrEmpty(style, nameof(style));
		//	Color = color;
		//}

		///// <inheritdoc/>
		//public override int GetHashCode()
		//{
		//	return base.GetHashCode() ^
		//	       BorderLocation.GetHashCode() ^
		//	       Width.GetHashCode() ^
		//	       Style.GetHashCode() ^
		//	       Color.GetHashCode();
		//}

		/// <summary>
		/// Represents a side of element
		/// </summary>
		//public enum Side
		//{
		/// <summary>
		/// Left side
		/// </summary>
		//Left,

		/// <summary>
		/// Right side
		/// </summary>
		//Right,

		/// <summary>
		/// Top side
		/// </summary>
		//Top,

		/// <summary>
		/// Bottom side
		/// </summary>
		//Bottom,
		//}
	}
}
