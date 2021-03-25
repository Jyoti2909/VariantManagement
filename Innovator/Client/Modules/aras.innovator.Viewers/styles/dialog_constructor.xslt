<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<div class="dijitDialog DialogContainer {dialogs/{%0%}/@style}" style="z-index:11111;" data-dojo-attach-point="dialogContainer">
			<div data-dojo-attach-point="titleBar" class="DialogTitleBar">
				<span data-dojo-attach-point="titleBarImage" class="DialogTitleBarImage">.</span>
				<span data-dojo-attach-point="titleBarText" class="DialogTitleBarText">
					<xsl:value-of select="dialogs/{%0%}/@title" />
				</span>
				<span data-dojo-attach-point="closeIcon" class="DialogCloseIcon" data-dojo-attach-event="onclick: _onCrossClick" title="Close" role="button" tabindex="0">
					<span data-dojo-attach-point="closeText" class="closeText" title="Close">x</span>
				</span>
			</div>
			<div class="dijitDialogPaneContent DialogPaneContent" data-dojo-attach-point="paneContent">
				<xsl:for-each select="dialogs/{%0%}/row">
					<div class="{@style}">
						<xsl:for-each select="*">
							<xsl:choose>
								<xsl:when test="name()='numbertextbox'">
									<span data-dojo-type="VC.Widgets.NumberTextBox"
												data-dojo-attach-point="{@name}"
												data-dojo-props="labelBefore: '{@labelbefore}', labelAfter: '{@labelafter}'"
												class="{@style}">.</span>
								</xsl:when>
								<xsl:when test="name()='zoomtextbox'">
									<span data-dojo-type="VC.Widgets.ZoomTextBox"
												data-dojo-attach-point="{@name}"
												data-dojo-props="width: {@width}"
												class="{@style}">.</span>
								</xsl:when>
								<xsl:when test="name()='textbox'">
									<span data-dojo-type="VC.Widgets.TextBox"
												data-dojo-attach-point="{@name}"
												data-dojo-props="labelBefore: '{@labelbefore}', labelAfter: '{@labelafter}', size: {@width}"
												class="{@style}">.</span>
								</xsl:when>
								<xsl:when test="name()='checkbox'">
									<span data-dojo-type="VC.Widgets.Checkbox"
												data-dojo-attach-point="{@name}"
												data-dojo-props="label: '{@label}'"
												class="{@style}">.</span>
								</xsl:when>
								<xsl:when test="name()='slider'">
									<span data-dojo-type="VC.Widgets.Slider" data-dojo-attach-point="{@name}" class="{@style}">
									</span>
								</xsl:when>
								<xsl:when test="name()='button'">
									<xsl:element name="div">
										<xsl:attribute name="data-dojo-type">VC.UI.mtButton</xsl:attribute>
										<xsl:attribute name="data-dojo-attach-point">
											<xsl:value-of select="@name"/>
										</xsl:attribute>
										<xsl:attribute name="class">
											<xsl:value-of select="@style"/>
										</xsl:attribute>
										<xsl:attribute name="title">
											<xsl:value-of select="@tooltip"/>
										</xsl:attribute>
										<img title="{@tooltip}" class="ButtonImage" src="{@src}"/>
										<xsl:if test="text() != ''">
											<div class="ButtonLabel" title="{@tooltip}">
												<xsl:value-of select="."/>
											</div>
										</xsl:if>
										<xsl:if test="@type='parent'">
											<span class="MenuButton">.</span>
										</xsl:if>
									</xsl:element>
								</xsl:when>
								<xsl:when test="name()='colorpallete'">
									<xsl:variable name="defaultColor">
										<xsl:for-each select="row">
											<xsl:for-each select="color">
												<xsl:if test="@selected='selected'">
													<xsl:value-of select="@color"/>
												</xsl:if>
											</xsl:for-each>
										</xsl:for-each>
									</xsl:variable>
									<xsl:variable name="colors">
										[<xsl:for-each select="row">
											[<xsl:for-each select="color">
												{color:'<xsl:value-of select="@color"/>',title:'<xsl:value-of select="@title"/>'}<xsl:if test="position() != last()">
													<xsl:text>,</xsl:text>
												</xsl:if>
											</xsl:for-each>]<xsl:if test="position() != last()">
												<xsl:text>,</xsl:text>
											</xsl:if>
										</xsl:for-each>]
									</xsl:variable>
									<div data-dojo-type="VC.Widgets.ColorPallete" data-dojo-attach-point="{@name}"
									colors="{$colors}" data-dojo-props="defaultcolor: '{$defaultColor}'">
									</div>
								</xsl:when>
								<xsl:when test="name()='empty'">
									<span class="{@style}">
									</span>
								</xsl:when>
								<xsl:when test="name()='label'">
									<span class="{@style}">
										<xsl:value-of select="."/>
									</span>
								</xsl:when>
								<xsl:when test="name()='image'">
									<span class="{@style}" style="background-image: url('{@src}')">.</span>
								</xsl:when>
								<xsl:when test="name()='radiobutton'">
									<span data-dojo-type="VC.Widgets.RadioButton"
										data-dojo-attach-point="{@name}"
										data-dojo-props="text: '{@text}', groupName: '{@groupName}'"
										class="{@style}">.</span>
								</xsl:when>
								<xsl:when test="name()='simplifiednumbertextbox'">
									<span data-dojo-type="VC.Widgets.SimplifiedNumberTextBox"
											data-dojo-attach-point="{@name}"
											data-dojo-props="width: '{@width}'"
											class="{@style}">.</span>
								</xsl:when>

							</xsl:choose>
						</xsl:for-each>
					</div>
				</xsl:for-each>
			</div>
		</div>
	</xsl:template>
</xsl:stylesheet>