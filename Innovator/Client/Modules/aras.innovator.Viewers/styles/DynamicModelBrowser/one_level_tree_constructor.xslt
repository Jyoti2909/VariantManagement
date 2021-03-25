<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:strip-space elements="*"/>
	<xsl:template match="table">
		<xsl:copy>
			<xsl:apply-templates select="thead"/>
			<xsl:apply-templates select="columns"/>
			<xsl:apply-templates select="//tr"/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="thead">
		<xsl:copy-of select="."/>
	</xsl:template>

	<xsl:template match="columns">
		<xsl:copy-of select="."/>
	</xsl:template>

	<xsl:template match="tr">
		<xsl:copy>
			<xsl:copy-of select="@*"/>
			<xsl:copy-of select="userdata"/>
			<xsl:copy-of select="td"/>
		</xsl:copy>
	</xsl:template>
</xsl:stylesheet>