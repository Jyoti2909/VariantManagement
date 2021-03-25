<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<viewerToolbars>
			<{%0%}>
				<xsl:for-each select="Result/*">
					<xsl:choose>
						<xsl:when test="@type='CommandBarButton'">
							<button name="{id/@keyed_name}" src="../../{image}" tooltip="{tooltip_template}" event="{concat(id/@keyed_name,'Click')}" style="ViewerButton"></button>
						</xsl:when>

						<xsl:when test="@type='CommandBarEdit'">
							<numbertextbox name="{id/@keyed_name}" labelAfter="" tooltip="{tooltip_template}" event="{concat(id/@keyed_name,'Click')}" style="ViewerNumberTextBox" additionalData="{additional_data}"></numbertextbox>
						</xsl:when>
					</xsl:choose>
				</xsl:for-each>
			</{%0%}>
		</viewerToolbars>
	</xsl:template>
</xsl:stylesheet>