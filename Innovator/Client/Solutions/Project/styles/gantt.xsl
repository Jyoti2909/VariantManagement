<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:aras="http://www.aras-corp.com">
	<xsl:output method="xml" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
	<xsl:template match="/">
		<project>
			<delta>day</delta>
			<bg-color>#ffffff</bg-color>
			<font family="Helvetica" size="10" bold="0" italic="0"/>
			<color>#000000</color>
			<grid-color>#808080</grid-color>
			<week-color>#C0C0C0</week-color>
			<bar-color>#0000FF</bar-color>
			<dependency-color>#0000FF</dependency-color>
			<progress-color>#000000</progress-color>
			<input-date-format/>
			<display-date-format/>
			<calendar-font>
				<family>Arial</family>
				<size>8</size>
				<bold>0</bold>
				<italic>0</italic>
			</calendar-font>
			<calendar-color>#000000</calendar-color>
			<column-titles>Name,N,Predecessors,Leader,Start,Finish,Duration,Status</column-titles>
			<xsl:call-template name="Main"/>
		</project>
	</xsl:template>
	<xsl:template name="Main" match="Item">
		<xsl:apply-templates mode="getWBS" select="Item"/>
	</xsl:template>
	<xsl:template mode="getWBS" match="Item[@type='WBS Element']">
		<wbs>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<label>
				<xsl:value-of select="name"/>
			</label>
			<xsl:for-each select="Relationships/Item[not(@action='delete')]">
				<xsl:if test="@type='Sub WBS'">
					<xsl:apply-templates mode="getWBS" select="related_id/Item"/>
				</xsl:if>
				<xsl:if test="@type='WBS Activity2'">
					<xsl:apply-templates mode="getAct" select="related_id/Item"/>
				</xsl:if>
			</xsl:for-each>
		</wbs>
	</xsl:template>
	<xsl:template mode="getAct" match="Item[@type='Activity2']">
		<task>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<label>
				<xsl:value-of select="name"/>
			</label>
			<start-date value="{date_start_sched}">
				<xsl:value-of select="date_start_sched"/>
			</start-date>
			<end-date value="{date_due_sched}">
				<xsl:value-of select="date_due_sched"/>
			</end-date>
			<earliest-start-date value="{date_es}">
				<xsl:value-of select="date_es"/>
			</earliest-start-date>
			<latest-finish-date value="{date_lf}">
				<xsl:value-of select="date_lf"/>
			</latest-finish-date>
			<working-duration>
				<xsl:value-of select="expected_duration"/>
			</working-duration>
			<progress>
				<xsl:value-of select="percent_compl"/>
			</progress>
			<bar-color>
				<xsl:if test="is_critical=1">#FF0000</xsl:if>
			</bar-color>
			<num>
				<xsl:value-of select="@num"/>
			</num>
			<predecessor>
				<xsl:for-each select="Relationships/Item[@type='Predecessor' and not(@action='delete')]">
					<xsl:choose>
						<!-- Predecessor id -->
						<xsl:when test="related_id/Item/@id">
							<xsl:value-of select="related_id/Item/@id"/>
						</xsl:when>
						<xsl:when test="related_id/Item/id">
							<xsl:value-of select="related_id/Item/id"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="related_id"/>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:text>|</xsl:text>
					<xsl:choose>
						<!-- precedence_type -->
						<xsl:when test="precedence_type='Start to Start'">SS</xsl:when>
						<xsl:when test="precedence_type='Start to Finish'">SF</xsl:when>
						<xsl:when test="precedence_type='Finish to Finish'">FF</xsl:when>
						<xsl:otherwise>
							<!-- "Finish to Start" processes below -->
						</xsl:otherwise>
						<!-- precedence_type="Finish to Start" with empty lead_leg let pass-->
					</xsl:choose>
					<xsl:choose>
						<!-- lead_lag -->
						<xsl:when test="starts-with(lead_lag, '+') or starts-with(lead_lag,'-')">
							<xsl:if test="precedence_type!='Start to Start' and precedence_type!='Start to Finish' and precedence_type!='Finish to Finish'">FS</xsl:if>
							<xsl:text>|</xsl:text>
							<xsl:value-of select="lead_lag"/>
						</xsl:when>
						<xsl:when test="lead_lag='0' or lead_lag=''">|</xsl:when>
						<xsl:otherwise>
							<xsl:if test="precedence_type!='Start to Start' and precedence_type!='Start to Finish' and precedence_type!='Finish to Finish'">FS</xsl:if>
							<xsl:text>|+</xsl:text>
							<xsl:value-of select="lead_lag"/>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:if test="position()!=last()">,</xsl:if>
				</xsl:for-each>
			</predecessor>
			<assigned>
				<xsl:value-of select="managed_by_id/@keyed_name"/>
			</assigned>
			<is_milestone>
				<xsl:value-of select="is_milestone"/>
			</is_milestone>
		</task>
	</xsl:template>
	<!--deliverable id="234234">
        <type>Document</type>
        <keyed_name>my document</keyed_name>
      </deliverable-->
</xsl:stylesheet>
