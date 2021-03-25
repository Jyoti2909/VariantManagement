<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:output method="xml" version="1.0" omit-xml-declaration="yes" encoding="UTF-8" />
	<xsl:template match="/">
		<xsl:param name="level">0</xsl:param>
		<table enableHTML="false" icon0="" icon1="" treelines="1" thinBorder="true">
			<menu></menu>
			<thead>
				<th align="center"></th>
			</thead>

			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">createdbyme</xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Created by me</td>
				<xsl:apply-templates select="/*/*/Result/Item[@type='SelfServiceReport']">
					<xsl:sort select="name"/>
					<xsl:with-param name="level" select="$level+1"/>
				</xsl:apply-templates>
			</tr>

			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">sharedwithme</xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Shared with me</td>
				<xsl:apply-templates select="/*/*/Result/Item[@type='SelfServiceReport']/Relationships/Item[@type='SelfServiceReportSharedWith']">
					<xsl:sort select="name"/>
					<xsl:with-param name="level" select="$level+1"/>
				</xsl:apply-templates>
			</tr>

			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">recent</xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Recent</td>
				<xsl:apply-templates select="/*/*/Result/Item[@type='SelfServiceReport']/Relationships/Item[@type='RunReportByUser']">
					<xsl:sort select="name"/>
					<xsl:with-param name="level" select="$level+1"/>
				</xsl:apply-templates>
			</tr>
		</table>
	</xsl:template>

	<xsl:template match="Item[@type='SelfServiceReport']">
		<xsl:param name="level">0</xsl:param>
		<xsl:param name="currentUserId" select="@currentUser"/>
		<xsl:param name="createdById" select="created_by_id"/>

		<xsl:if test="$createdById=$currentUserId">
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">
					<xsl:value-of select="id"/>
				</xsl:attribute>
				<userdata key="className" value="UserReport"/>
				<userdata key="type" value="createdbyme"/>
				<userdata key="access_rights" value="full" />
				<td align="left">
					<xsl:value-of select="name"/>
				</td>
			</tr>
		</xsl:if>
	</xsl:template>

	<xsl:template match="Item[@type='SelfServiceReportSharedWith']">
		<xsl:param name="level">0</xsl:param>
		<xsl:param name="access_rights" select="access_rights"/>

		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="../../id"/>
			</xsl:attribute>
			<userdata key="className" value="UserReport"/>
			<userdata key="type" value="sharedwithme"/>

			<xsl:if test="$access_rights='full'">
				<userdata key="access_rights" value="full" />
			</xsl:if>
			<xsl:if test="$access_rights='readonly'">
				<userdata key="access_rights" value="readonly" />
			</xsl:if>
			<xsl:if test="$access_rights='viewonly'">
				<userdata key="access_rights" value="viewonly" />
			</xsl:if>
			<xsl:if test="$access_rights='locked'">
				<userdata key="access_rights" value="locked" />
			</xsl:if>

			<td align="left">
				<xsl:value-of select="../../name"/>
			</td>
			</tr>
	</xsl:template>

	<xsl:template match="Item[@type='RunReportByUser']">
		<xsl:param name="level">0</xsl:param>

		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="../../id"/>
			</xsl:attribute>
			<userdata key="className" value="UserReport"/>
			<userdata key="type" value="recent"/>
			<userdata key="access_rights" value="inherited" />
			<td align="left">
				<xsl:value-of select="../../name"/>
			</td>
		</tr>
	</xsl:template>
</xsl:stylesheet>