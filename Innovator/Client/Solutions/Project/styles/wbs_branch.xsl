﻿<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:aras="http://www.aras-corp.com">
	<xsl:variable name="iconsBase" select="'../images/'"/>
	<xsl:variable name="attachIcon" select="'Deliverable.svg'"/>
	<xsl:variable name="wbsIcon0" select="'WBSElement.svg'"/>
	<xsl:variable name="wbsIcon1" select="'WBSElement.svg'"/>
	<xsl:variable name="activityIcon" select="'Activity2.svg'"/>
	<xsl:variable name="milestoneIcon" select="'Milestone.svg'"/>
	<xsl:output method="xml" omit-xml-declaration="yes" standalone="no" indent="yes"/>
	<xsl:template match="/Item">
		<tr>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<xsl:for-each select="Relationships/Item[not(@action='delete')]">
				<xsl:if test="@type='Sub WBS'">
					<xsl:apply-templates mode="getWBS" select="related_id/Item"/>
				</xsl:if>
				<xsl:if test="@type='WBS Activity2'">
					<xsl:apply-templates mode="getACT" select="related_id/Item"/>
				</xsl:if>
			</xsl:for-each>
		</tr>
	</xsl:template>
	<xsl:template mode="getWBS" match="Item">
		<tr type="WBS Element">
			<xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$wbsIcon0)"/></xsl:attribute>
			<xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$wbsIcon1)"/></xsl:attribute>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<td name="TreeNode">
				<xsl:value-of select="name"/>
			</td>
			<td name="N"/>
			<td name="Predecessor"/>
			<td name="Status">
				<xsl:call-template name="SetBgColor">
					<xsl:with-param name="bgColor" select="rollup_status"/>
				</xsl:call-template>
				<xsl:value-of select="rollup_percent_compl"/>
				<xsl:if test="self::node()[not(rollup_percent_compl)]">0</xsl:if>
			</td>
			<td name="Lead"/>
			<td name="Plan Start">
				<xsl:value-of select="rollup_date_sched_start"/>
			</td>
			<td name="Plan Finish">
				<xsl:value-of select="rollup_date_sched_due"/>
			</td>
			<td name="Duration">
				<xsl:value-of select="rollup_duration"/>
			</td>
			<td name="Hours"/>
			<td name="Role"/>
			<td name="Attach">
				<xsl:variable name="delivsCount" select="count(Relationships/Item[@type='WBS Deliverable'][not(@action='delete')]/related_id/Item)"/>
				<xsl:if test="self::node()[not($delivsCount=0 and deliv_required!='1')]">
					<xsl:attribute name="link"><xsl:value-of select="@id"/></xsl:attribute>
				</xsl:if>
				<xsl:choose>
					<xsl:when test="$delivsCount=0">
						<xsl:if test="deliv_required='1'">
							<xsl:value-of select="concat('&lt;img src=&quot;',$iconsBase)"/>
							<xsl:value-of select="$attachIcon"/>
							<xsl:value-of select="'&quot;&gt;'"/>
						</xsl:if>
					</xsl:when>
					<xsl:when test="$delivsCount=1">
						<xsl:value-of select="Relationships/Item[@type='WBS Deliverable'][not(@action='delete')]/related_id/Item/keyed_name"/>
					</xsl:when>
					<xsl:when test="$delivsCount>1">
						<xsl:value-of select="'Multiple'"/>
					</xsl:when>
				</xsl:choose>
			</td>
			<xsl:for-each select="Relationships/Item[not(@action='delete')]">
				<xsl:if test="@type='Sub WBS'">
					<xsl:apply-templates mode="getWBS" select="related_id/Item[not(@pt_filtered='true')]"/>
				</xsl:if>
				<xsl:if test="@type='WBS Activity2'">
					<xsl:apply-templates mode="getACT" select="related_id/Item[not(@pt_filtered='true')]"/>
				</xsl:if>
			</xsl:for-each>
		</tr>
	</xsl:template>
	<xsl:template mode="getACT" match="Item">
		<xsl:variable name="asmntsCount" select="count(Relationships/Item[@type='Activity2 Assignment' and string(@action)!='delete'])"/>
		<tr type="Activity2">
			<xsl:choose>
				<xsl:when test="is_milestone[.='1']">
					<xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$milestoneIcon)"/></xsl:attribute>
					<xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$milestoneIcon)"/></xsl:attribute>
					<xsl:attribute name="isMilestone">true</xsl:attribute>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$activityIcon)"/></xsl:attribute>
					<xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$activityIcon)"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:if test="is_critical[.='1']">
				<xsl:attribute name="textColor">#FF0000</xsl:attribute>
				<xsl:attribute name="isCritical">true</xsl:attribute>
			</xsl:if>
			<xsl:if test="number($asmntsCount) &gt; 0">
				<xsl:attribute name="hasAssignments">true</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<td name="TreeNode">
				<xsl:value-of select="name"/>
			</td>
			<td name="N"/>
			<!-- Predecessor id -->
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
			<td name="Status">
				<xsl:call-template name="SetBgColor">
					<xsl:with-param name="bgColor" select="status"/>
				</xsl:call-template>
				<xsl:variable name="statusValue">
					<xsl:choose>
						<xsl:when test="number($asmntsCount) &gt; 0">
							<xsl:value-of select="rollup_percent_compl"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="percent_compl"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:value-of select="$statusValue"/>
				<xsl:if test="string($statusValue)=''">0</xsl:if>
			</td>
			<td name="Lead">
				<xsl:value-of select="managed_by_id/@keyed_name"/>
			</td>
			<td name="Plan Start">
				<xsl:value-of select="date_start_sched"/>
			</td>
			<td name="Plan Finish">
				<xsl:value-of select="date_due_sched"/>
			</td>
			<td name="Duration">
				<xsl:value-of select="expected_duration"/>
			</td>
			<td name="Hours">
        <xsl:variable name="hoursValue">
          <xsl:choose>
            <xsl:when test="number($asmntsCount) &gt; 0">
              <xsl:value-of select="rollup_work_est"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="work_est"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:value-of select="$hoursValue"/>
			</td>
			<td name="Role">
				<xsl:value-of select="lead_role"/>
			</td>
			<td name="Attach">
				<xsl:variable name="delivsCount" select="count(Relationships/Item[@type='Activity2 Deliverable'][not(@action='delete')]/related_id/Item)"/>
				<xsl:if test="self::node()[not($delivsCount=0 and deliv_required!='1')]">
					<xsl:attribute name="link"><xsl:value-of select="@id"/></xsl:attribute>
				</xsl:if>
				<xsl:choose>
					<xsl:when test="$delivsCount=0">
						<xsl:if test="deliv_required='1'">
							<xsl:value-of select="concat('&lt;img src=&quot;',$iconsBase)"/>
							<xsl:value-of select="$attachIcon"/>
							<xsl:value-of select="'&quot;&gt;'"/>
						</xsl:if>
					</xsl:when>
					<xsl:when test="$delivsCount=1">
						<xsl:value-of select="Relationships/Item[@type='Activity2 Deliverable'][not(@action='delete')]/related_id/Item/keyed_name"/>
					</xsl:when>
					<xsl:when test="$delivsCount>1">
						<xsl:value-of select="'Multiple'"/>
					</xsl:when>
				</xsl:choose>
			</td>
		</tr>
	</xsl:template>
	<!-- Sets bgColor attribute. Takes bgColor parameter. -->
	<xsl:template name="SetBgColor">
		<xsl:param name="bgColor"/>
		<xsl:variable name="bgColorStr" select="string($bgColor)"/>
		<xsl:choose>
			<xsl:when test="starts-with($bgColorStr, '#') and string-length($bgColorStr)=7">
				<xsl:attribute name="bgColor"><xsl:value-of select="$bgColorStr"/></xsl:attribute>
			</xsl:when>
			<xsl:otherwise>
				<xsl:attribute name="bgColor">#ffffff</xsl:attribute>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
