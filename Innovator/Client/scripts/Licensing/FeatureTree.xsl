<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"  xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
	<xsl:output method="html" omit-xml-declaration="yes"></xsl:output>
	<xsl:template match="/">
		<xsl:apply-templates></xsl:apply-templates>
	</xsl:template>
	<xsl:template match="ArasFeatureTree">
		<html>
			<head>
				<style>
					td {font-family:Arial; font-size:10pt; padding-left:5px; padding-right:5px; border-style:solid; border-width:1;}
					table { empty-cells:show; border-collapse:collapse; border-style:solid; border-width:1}
					th {font-family:Arial; font-size:10pt; border-style:solid; border-width:1; padding-right:5px; padding-left:5px; text-align:center;}
					.yesno { text-align:center; }
				</style>
				<title>Aras Feature Tree</title>
			</head>
			<body style="min-width:400px;">
				<h1>Aras Feature Tree</h1>
				<h2>
					Datestamp: <xsl:value-of select="substring(@generated_on,1,10)"/>
				</h2>
				<table>
					<tr>
						<th>Feature</th>
						<th>Licensed</th>
						<th>Separate Activation</th>
					</tr>
					<xsl:apply-templates select="Feature"></xsl:apply-templates>
				</table>
			</body>
		</html>
	</xsl:template>

	<xsl:template match="Feature">
		<xsl:variable name="lev" select="count(ancestor::Feature)"/>
		<xsl:variable name="indent" select="'....................'"/>

		<tr>
			<td>
				<xsl:value-of select="concat(substring($indent,1,$lev*2),@name)"/>
			</td>
			<td class="yesno">
				<xsl:choose>
					<xsl:when test="@licensed='1'">Yes</xsl:when>
					<xsl:otherwise>No</xsl:otherwise>
				</xsl:choose>
			</td>
			<td class="yesno">
				<xsl:choose>
					<xsl:when test="@requires_explicit_activation='1'">Yes</xsl:when>
					<xsl:otherwise>No</xsl:otherwise>
				</xsl:choose>
			</td>
		</tr>
		<xsl:apply-templates select="Feature"/>
	</xsl:template>

</xsl:stylesheet>