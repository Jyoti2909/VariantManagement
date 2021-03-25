<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:msxsl="urn:schemas-microsoft-com:xslt"
xmlns:aras="http://www.aras-corp.com">
  <xsl:variable name="iconsBase"     select="'../images/'"/>
  <xsl:variable name="attachIcon"    select="'Deliverable.svg'"/>
  <xsl:variable name="wbsIcon0"      select="'WBSElement.svg'"/>
  <xsl:variable name="wbsIcon1"      select="'WBSElement.svg'"/>
  <xsl:variable name="activityIcon"  select="'Activity2.svg'"/>
  <xsl:variable name="milestoneIcon" select="'Milestone.svg'"/>
  <xsl:output method="xml" omit-xml-declaration="yes" standalone="no" indent="yes"/>
  <xsl:template match="/Item">
    <tr>
      <xsl:attribute name="id"><xsl:value-of select="@id" /></xsl:attribute>
      <xsl:for-each select="Relationships/Item[not(@action='delete')]">
        <xsl:if test="self::Item[@type='Sub WBS']">
          <xsl:apply-templates mode="getWBS" select="related_id/Item" />
        </xsl:if>
        <xsl:if test="self::Item[@type='WBS Activity2']">
          <xsl:apply-templates mode="getACT" select="related_id/Item" />
        </xsl:if>
      </xsl:for-each>
    </tr>
  </xsl:template>
  <xsl:template mode="getWBS" match="Item">
    <tr type="WBS Element">
      <xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$wbsIcon0)" /></xsl:attribute>
      <xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$wbsIcon1)" /></xsl:attribute>
      <xsl:attribute name="id"><xsl:value-of select="@id" /></xsl:attribute>
      <td name="TreeNode"><xsl:value-of select="name"/></td>
      <td name="N"/>
      <td name="Predecessor"/>
      <td name="Duration"><xsl:value-of select="expected_duration"/></td>
      <td name="Hours"><xsl:value-of select="work_est"/></td>
      <td name="Attach Required"><xsl:text>&lt;checkbox state='</xsl:text><xsl:value-of select="string(deliv_required)"/><xsl:text>'/&gt;</xsl:text></td>
      <td name="Attach Type"><xsl:value-of select="deliv_type"/></td>
      <td name="Role"/>
      <td name="Required" />
      <xsl:for-each select="Relationships/Item[not(@action='delete')]">
        <xsl:if test="@type='Sub WBS'">
          <xsl:apply-templates mode="getWBS" select="related_id/Item[not(@pt_filtered='true')]" />
        </xsl:if>
        <xsl:if test="@type='WBS Activity2'">
          <xsl:apply-templates mode="getACT" select="related_id/Item[not(@pt_filtered='true')]" />
        </xsl:if>
      </xsl:for-each>
    </tr>
  </xsl:template>
  <xsl:template mode="getACT" match="Item">
    <tr type="Activity2">
      <xsl:choose>
        <xsl:when test="is_milestone[.='1']">
          <xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$milestoneIcon)" /></xsl:attribute>
          <xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$milestoneIcon)" /></xsl:attribute>
          <xsl:attribute name="isMilestone">true</xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$activityIcon)" /></xsl:attribute>
          <xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$activityIcon)" /></xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
		<xsl:attribute name="id"><xsl:value-of select="@id" /></xsl:attribute>
		<td name="TreeNode"><xsl:value-of select="name"/></td>
		<td name="N"/>
			<td name="Predecessor">
				<xsl:for-each select="Relationships/Item[@type='Predecessor' and not(@action='delete')]">
					<xsl:choose>
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
			</td>

		<td name="Duration"><xsl:value-of select="expected_duration"/></td>
		<td name="Hours"><xsl:value-of select="work_est"/></td>
		<td name="Attach Required"><xsl:text>&lt;checkbox state='</xsl:text><xsl:value-of select="string(deliv_required)"/><xsl:text>'/&gt;</xsl:text></td>
		<td name="Attach Type"><xsl:value-of select="deliv_type"/></td>
		<td name="Role"><xsl:value-of select="lead_role"/></td>
		<td name="Required"><xsl:text>&lt;checkbox state='</xsl:text><xsl:value-of select="string(is_required)"/><xsl:text>'/&gt;</xsl:text></td>
    </tr>
  </xsl:template>
</xsl:stylesheet>
