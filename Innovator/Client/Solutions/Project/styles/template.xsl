<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:aras="http://www.aras-corp.com">
	<xsl:variable name="iconsBase" select="'../images/'"/>
	<xsl:variable name="attachIcon" select="'Deliverable.svg'"/>
	<xsl:variable name="wbsIcon0" select="'WBSElement.svg'"/>
	<xsl:variable name="wbsIcon1" select="'WBSElement.svg'"/>
	<xsl:variable name="activityIcon" select="'Activity2.svg'"/>
	<xsl:variable name="milestoneIcon" select="'Milestone.svg'"/>
	<xsl:output method="xml" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
	<xsl:template match="/">
		<table font="Arial-8" enableHTML="false" treelines="1" draw_grid="true" thinBorder="true" onRowSelect="onRowSelect" onEditCell="onEditCell" onXMLLoaded="onXmlLoaded" onMenuInit="initmenu" onMenuClick="onmenu" onKeyPressed="onKeyPressed" editable="true" link_func="onLink" nosort="true">
			<thead>
				<th align="center">tree_node</th>
				<th align="center">n</th>
				<th align="center">predecessor</th>
				<th align="center">duration</th>
				<th align="center">hours</th>
				<th align="center">deliv_required</th>
				<th align="center">deliv_type</th>
				<th align="center">role</th>
				<th align="center">required</th>
				<th align="center">attach</th>
			</thead>
			<list id="0" name="Project Role">
				<!-- role values -->
			</list>
			<list id="1" name="Deliverable">
				<!-- deliv_type values -->
			</list>
			<columns>
				<column width="200" order="0" align="left" name="treeNode"/>
				<column width="20" order="1" align="center" name="n"/>
				<column width="80" order="2" align="center" name="predecessor"/>
				<column width="70" order="3" align="center" name="duration"/>
				<column width="70" order="4" align="center" name="hours"/>
				<column width="85" edit="boolean" order="5" align="center" name="delivRequired"/>
				<column width="80" edit="COMBO:1" order="6" align="center" name="delivType"/>
				<column width="80" edit="COMBO:0" order="7" align="center" name="role"/>
				<column width="50" edit="boolean" order="8" align="center" name="required"/>
				<column width="50" order="10" align="center" name="attach"/>
			</columns>
			<inputrow/>
			<xsl:call-template name="Main"/>
		</table>
	</xsl:template>
	<xsl:template name="Main" match="Item">
		<xsl:apply-templates mode="getWBS" select="Item[not(@pt_filtered='true')]">
			<xsl:with-param name="level" select="0"/>
		</xsl:apply-templates>
	</xsl:template>
	<xsl:template mode="getWBS" match="Item">
		<xsl:param name="level"/>
		<tr type="WBS Element">
			<xsl:attribute name="icon0"><xsl:value-of select="concat($iconsBase,$wbsIcon0)"/></xsl:attribute>
			<xsl:attribute name="icon1"><xsl:value-of select="concat($iconsBase,$wbsIcon1)"/></xsl:attribute>
			<xsl:attribute name="level"><xsl:value-of select="$level"/></xsl:attribute>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<td name="TreeNode">
				<xsl:value-of select="name"/>
			</td>
			<td name="N"/>
			<td name="Predecessor"/>
			<td name="Duration">
				<xsl:value-of select="expected_duration"/>
			</td>
			<td name="Hours">
				<xsl:value-of select="work_est"/>
			</td>
			<td name="Deliv Required">
				<xsl:text>&lt;checkbox state='</xsl:text>
				<xsl:value-of select="string(deliv_required)"/>
				<xsl:text>'/&gt;</xsl:text>
			</td>
			<td name="Deliv Type">
				<xsl:value-of select="deliv_type"/>
			</td>
			<td name="Role"/>
			<td name="Required"/>
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
					<xsl:apply-templates mode="getWBS" select="related_id/Item[not(@pt_filtered='true')]">
						<xsl:with-param name="level" select="$level+1"/>
					</xsl:apply-templates>
				</xsl:if>
				<xsl:if test="@type='WBS Activity2'">
					<xsl:apply-templates mode="getACT" select="related_id/Item[not(@pt_filtered='true')]">
						<xsl:with-param name="level" select="$level+1"/>
					</xsl:apply-templates>
				</xsl:if>
			</xsl:for-each>
		</tr>
	</xsl:template>
	<xsl:template mode="getACT" match="Item">
		<xsl:param name="level"/>
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
			<xsl:attribute name="level"><xsl:value-of select="$level"/></xsl:attribute>
			<xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			<td name="TreeNode">
				<xsl:value-of select="name"/>
			</td>
			<td name="N"/>
			<td name="Predecessor">
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
						<xsl:otherwise><!-- "Finish to Start" processes below --></xsl:otherwise>
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
			<td name="Duration">
				<xsl:value-of select="expected_duration"/>
			</td>
			<td name="Hours">
				<xsl:value-of select="work_est"/>
			</td>
			<td name="Deliv Required">
				<xsl:text>&lt;checkbox state='</xsl:text>
				<xsl:value-of select="string(deliv_required)"/>
				<xsl:text>'/&gt;</xsl:text>
			</td>
			<td name="Deliv Type">
				<xsl:value-of select="deliv_type"/>
			</td>
			<td name="Role">
				<xsl:value-of select="lead_role"/>
			</td>
			<td name="Required">
				<xsl:text>&lt;checkbox state='</xsl:text>
				<xsl:value-of select="string(is_required)"/>
				<xsl:text>'/&gt;</xsl:text>
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
</xsl:stylesheet>
