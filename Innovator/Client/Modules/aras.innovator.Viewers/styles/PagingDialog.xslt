<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:output method="xml" version="1.0" omit-xml-declaration="yes" encoding="UTF-8" />
	<xsl:template match="/">
		<table enableHTML="false" icon0="" icon1="" treelines="1" thinBorder="true">
			<menu></menu>
			<thead>
				<th align="center"></th>
			</thead>
			<xsl:apply-templates select="/*/*/Result/Item[@type='Forum'][forum_type='MyBookmarks']" />
		</table>
	</xsl:template>
	<xsl:template match="Item[@type='Forum'][forum_type='MyBookmarks']">
		<!-- common items for all users-->
		<xsl:param name="level">0</xsl:param>
		<xsl:param name="currentUserId" select="@currentUser"/>
		<xsl:param name="userMessagesPrefix">Messages from </xsl:param>
		<xsl:param name="favoriteMessagesPrefix">Flagged by </xsl:param>
		<xsl:param name="userMessagesIcon">../../../images/User.svg</xsl:param>
		<xsl:param name="favoriteMessagesIcon">../../../images/Flag.svg</xsl:param>
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">allmessages</xsl:attribute>
			<xsl:attribute name="icon0"></xsl:attribute>
			<xsl:attribute name="icon1"></xsl:attribute>
			<userdata key="className" value="ForumMessageGroup"/>
			<td align="left">All Messages</td>
		</tr>
		<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id=$currentUserId]">
			<xsl:with-param name="level" select="$level+1"/>
			<xsl:with-param name="label" select="concat($userMessagesPrefix, 'me')"/>
			<xsl:with-param name="icon" select ="$userMessagesIcon"/>
		</xsl:apply-templates>
		<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserFavoriteMessages'][user_criteria_id=$currentUserId]">
			<xsl:with-param name="level" select="$level+1"/>
			<xsl:with-param name="label" select="concat($favoriteMessagesPrefix, 'me')"/>
			<xsl:with-param name="icon" select="$favoriteMessagesIcon"/>
		</xsl:apply-templates>
		<!-- end of common items for all users-->
		<xsl:if test="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id!=$currentUserId]">
			<!-- TOC category Messages From -->
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">messagesfromcategory</xsl:attribute>
				<xsl:attribute name="icon0"></xsl:attribute>
				<xsl:attribute name="icon1"></xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Messages From</td>
				<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id!=$currentUserId]">
					<xsl:with-param name="level" select="$level+1"/>
					<xsl:with-param name="prefix" select ="$userMessagesPrefix"/>
					<xsl:with-param name="icon" select ="$userMessagesIcon"/>
				</xsl:apply-templates>
			</tr>
			<!-- end of TOC category Messages From-->
		</xsl:if>
		<xsl:if test="Relationships/Item[@type='ForumMessageGroup'][group_type='UserFavoriteMessages'][user_criteria_id!=$currentUserId]">
			<!-- TOC category Flagged By -->
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">flaggedbycategory</xsl:attribute>
				<xsl:attribute name="icon0"></xsl:attribute>
				<xsl:attribute name="icon1"></xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Flagged by</td>
				<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserFavoriteMessages'][user_criteria_id!=$currentUserId]">
					<xsl:with-param name="level" select="$level+1"/>
					<xsl:with-param name="prefix" select="$favoriteMessagesPrefix"/>
					<xsl:with-param name="icon" select="$favoriteMessagesIcon"/>
				</xsl:apply-templates>
			</tr>
			<!-- end of TOC category Flagged By-->
		</xsl:if >
		<xsl:if test="../Item[@type='Forum'][forum_type!='MyBookmarks']">
			<!-- TOC category Forums -->
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">forumscategory</xsl:attribute>
				<xsl:attribute name="icon0"></xsl:attribute>
				<xsl:attribute name="icon1"></xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Forums</td>
				<xsl:apply-templates select="../Item[@type='Forum'][forum_type!='MyBookmarks']">
					<xsl:with-param name="level" select="$level+1"/>
				</xsl:apply-templates>
			</tr >
			<!-- end of TOC category Forums -->
		</xsl:if >
		<xsl:if test="Relationships/Item[@type='ForumItem']">
			<!-- TOC category Items -->
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">itemscategory</xsl:attribute>
				<xsl:attribute name="icon0"></xsl:attribute>
				<xsl:attribute name="icon1"></xsl:attribute>
				<userdata key="className" value="TocCategory"/>
				<td align="left">Items</td>
				<xsl:apply-templates select="Relationships/Item[@type='ForumItem']">
					<xsl:with-param name="level" select="$level+1"/>
				</xsl:apply-templates>
			</tr>
			<!-- TOC category Items -->
		</xsl:if>
	</xsl:template>
	<xsl:template match="Item[@type='Forum'][forum_type!='MyBookmarks']">
		<xsl:param name="level">0</xsl:param>
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="id"/>
			</xsl:attribute>
			<xsl:attribute name="icon0">
				<xsl:value-of select="close_icon"/>
			</xsl:attribute>
			<xsl:attribute name="icon1">
				<xsl:value-of select="open_icon"/>
			</xsl:attribute>
			<userdata key="className" value="Forum"/>
			<td align="left">
				<xsl:value-of select="name"/>
			</td>
			<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup']">
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="Relationships/Item[@type='ForumSearch']">
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="Relationships/Item[@type='ForumItem']">
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
		</tr>
	</xsl:template>
	<xsl:template match="Item[@type='ForumMessageGroup']">
		<xsl:param name="level">0</xsl:param>
		<xsl:param name="label"></xsl:param>
		<xsl:param name="prefix"></xsl:param>
		<xsl:param name="icon"></xsl:param>
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="id"/>
			</xsl:attribute>
			<xsl:attribute name="icon0">
				<xsl:value-of select="$icon"/>
			</xsl:attribute>
			<xsl:attribute name="icon1">
				<xsl:value-of select="$icon"/>
			</xsl:attribute>
			<userdata key="className" value="ForumMessageGroup"/>
			<td align="left">
				<xsl:choose>
					<xsl:when test="$label">
						<xsl:value-of select="$label"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="concat($prefix, label)"/>
					</xsl:otherwise>
				</xsl:choose>
				
			</td>
		</tr>
	</xsl:template>
	<xsl:template match="Item[@type='ForumSearch']">
		<xsl:param name="level">0</xsl:param>
		<xsl:if test="related_id/Item">
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">
					<xsl:value-of select="id"/>
				</xsl:attribute>
				<xsl:attribute name="icon0">
					<xsl:value-of select="open_icon"/>
				</xsl:attribute>
				<xsl:attribute name="icon1">
					<xsl:value-of select="close_icon"/>
				</xsl:attribute>
				<userdata key="className" value="ForumSearch"/>
				<td align="left">
					<xsl:value-of select="related_id/Item[@type='SavedSearch']/label"/>
				</td>
			</tr>
		</xsl:if>
	</xsl:template>
	<xsl:template match="Item[@type='ForumItem']">
		<xsl:param name="level">0</xsl:param>
		<xsl:if test="item_keyed_name[not(@is_null)]">
			<tr>
				<xsl:attribute name="level">
					<xsl:value-of select="$level"/>
				</xsl:attribute>
				<xsl:attribute name="id">
					<xsl:value-of select="id"/>
				</xsl:attribute>
				<xsl:attribute name="icon0">
					<xsl:value-of select="open_icon"/>
				</xsl:attribute>
				<xsl:attribute name="icon1">
					<xsl:value-of select="close_icon"/>
				</xsl:attribute>
				<userdata key="className" value="ForumItem"/>
				<td align="left">
					<xsl:value-of select="item_keyed_name"/>
				</td>
			</tr>
		</xsl:if>
	</xsl:template>
</xsl:stylesheet>