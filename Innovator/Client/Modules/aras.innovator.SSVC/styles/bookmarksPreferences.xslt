<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:output method="xml" version="1.0" omit-xml-declaration="yes" encoding="UTF-8" />
	<xsl:template match="/">
		<root>
			<xsl:apply-templates select="(//Item[@type='Forum'][forum_type='MyBookmarks'])[1]" />
		</root>
	</xsl:template>
	<xsl:template match="Item[@type='Forum'][forum_type='MyBookmarks']">
		<!-- common items for all users-->
		<xsl:param name="currentUserId" select="@currentUser"/>
		<xsl:param name="userMessagesPrefix">Messages from </xsl:param>
		<xsl:param name="myMessages">My Messages</xsl:param>
		<option value="allmessages">All Bookmarks</option>
		<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id=$currentUserId]">
			<xsl:with-param name="label" select="$myMessages"/>
		</xsl:apply-templates>
		<xsl:apply-templates select="Relationships/Item[@type='ForumItem']" />
		<!-- end of common items for all users-->
		<xsl:if test="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id!=$currentUserId]">
			<!-- category Messages From -->
			<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id!=$currentUserId]">
				<xsl:with-param name="prefix" select ="$userMessagesPrefix"/>
			</xsl:apply-templates>
			<!-- end of category Messages From-->
		</xsl:if>
		<xsl:if test="../Item[@type='Forum'][forum_type!='MyBookmarks']">
			<!-- category Forums -->
			<xsl:apply-templates select="../Item[@type='Forum'][forum_type!='MyBookmarks']" />
			<!-- end of category Forums -->
		</xsl:if>
	</xsl:template>
	<xsl:template match="Item[@type='Forum'][forum_type!='MyBookmarks']">
		<option>
			<xsl:attribute name="value">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:value-of select="name"/>
			<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup']" />
		</option>
	</xsl:template>
	<xsl:template match="Item[@type='ForumMessageGroup']">
		<xsl:param name="label"></xsl:param>
		<xsl:param name="prefix"></xsl:param>
		<option>
			<xsl:attribute name="value">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="$label">
					<xsl:value-of select="$label"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="concat($prefix, label)"/>
				</xsl:otherwise>
			</xsl:choose>
		</option>
	</xsl:template>
	<xsl:template match="Item[@type='ForumItem']">
		<xsl:param name="label"></xsl:param>
		<option>
			<xsl:attribute name="value">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:value-of select="item_keyed_name"/>
		</option>
	</xsl:template>
</xsl:stylesheet>