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
		<xsl:param name="userMessagesPrefix">My Messages</xsl:param>
		<xsl:param name="userMessagesIcon">../../../images/MessageFrom.svg</xsl:param>
		<xsl:param name="myMessagesIcon">../../../images/Myself.svg</xsl:param>
		<xsl:param name="ForumIcon">../../../images/Forum.svg</xsl:param>
		<xsl:param name="MyForumIcon">../../../images/MyForums.svg</xsl:param>
		<!-- common items for current user-->
		<xsl:param name="CurrentUserId"></xsl:param>
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">allmessages</xsl:attribute>
			<xsl:attribute name="icon0">../../../images/MyDiscussions.svg</xsl:attribute>
			<xsl:attribute name="icon1">../../../images/MyDiscussions.svg</xsl:attribute>
			<userdata key="className" value="ForumMessageGroup"/>
			<td align="left">All Messages</td>
		</tr>
		<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id=$currentUserId]">
			<xsl:with-param name="level" select="$level+1"/>
			<xsl:with-param name="label" select="$userMessagesPrefix"/>
			<xsl:with-param name="icon" select ="$myMessagesIcon"/>
		</xsl:apply-templates>
		<!-- end of common items for all users-->
		<!-- TOC category Messages From -->
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">messagesfromcategory</xsl:attribute>
			<xsl:attribute name="icon0"></xsl:attribute>
			<xsl:attribute name="icon1"></xsl:attribute>
			<userdata key="className" value="TocCategory"/>
			<userdata key="format" value="rich"/>
			<td align="left">People</td>
			<td align="right"><img src="../../../images/FollowPerson.svg" class="treeButton treeButton-followPeople" onclick="showPopup(event, SelectUserObj);" /></td>
			<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup'][group_type='UserMessages'][user_criteria_id!=$currentUserId]">
				<xsl:sort select="label"/>
				<xsl:with-param name="level" select="$level+1"/>
				<xsl:with-param name="prefix" select ="$userMessagesPrefix"/>
				<xsl:with-param name="icon" select ="$userMessagesIcon"/>
			</xsl:apply-templates>
		</tr>
		<!-- end of TOC category Messages From-->
		<!-- TOC category Forums -->
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">forumscategory</xsl:attribute>
			<xsl:attribute name="icon0"></xsl:attribute>
			<xsl:attribute name="icon1"></xsl:attribute>
			<userdata key="className" value="TocCategory"/>
			<userdata key="format" value="rich"/>
			<td align="left">Forums</td>
			<td align="right">
				<img src="../../../images/FollowForum.svg" class="treeButton treeButton-followForum" onclick="showPopup(event, SelectForumObj);" />
				<img src="../../../images/CreateForum.svg" class="treeButton treeButton-createForum" onclick="onCreateForumClick(event);" />
			</td>
			<xsl:apply-templates select="../Item[@type='Forum'][forum_type!='MyBookmarks']">
				<xsl:sort select="name"/>
				<xsl:with-param name="level" select="$level+1"/>
				<xsl:with-param name="icon" select="$ForumIcon"/>
				<xsl:with-param name="CurrentUserId" select="$CurrentUserId"/>
				<xsl:with-param name="MyForumIcon" select="$MyForumIcon"/>
			</xsl:apply-templates>
		</tr >
		<!-- end of TOC category Forums -->
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
				<xsl:sort select="item_keyed_name"/>
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
		</tr>
	</xsl:template>
	<xsl:template match="Item[@type='Forum'][forum_type!='MyBookmarks']">
		<xsl:param name="level">0</xsl:param>
		<xsl:param name="icon"></xsl:param>
		<xsl:param name="CurrentUserId"></xsl:param>
		<xsl:param name="MyForumIcon"></xsl:param>
		<tr>
			<xsl:attribute name="level">
				<xsl:value-of select="$level"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="id"/>
			</xsl:attribute>
			<xsl:variable name="owned_by_id">
				<xsl:value-of select="owned_by_id"/>
			</xsl:variable>
			<xsl:variable name="forumIcon">
				<xsl:choose>
					<xsl:when test='$CurrentUserId=$owned_by_id'>
						<xsl:value-of select="$MyForumIcon"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$icon"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:attribute name="icon0">
				<xsl:value-of select="$forumIcon"/>
			</xsl:attribute>
			<xsl:attribute name="icon1">
				<xsl:value-of select="$forumIcon"/>
			</xsl:attribute>
			<userdata key="className" value="Forum"/>
			<userdata key="owned_by_id">
				<xsl:attribute name="value">
					<xsl:value-of select="owned_by_id"/>
				</xsl:attribute>
			</userdata>
			<td align="left">
				<xsl:choose>
					<xsl:when test="label">
						<xsl:value-of select="label"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="name"/>
					</xsl:otherwise>
				</xsl:choose>
			</td>
			<xsl:apply-templates select="Relationships/Item[@type='ForumMessageGroup']">
				<xsl:sort select="label"/>
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="Relationships/Item[@type='ForumSearch']">
				<xsl:sort select="related_id/Item[@type='SavedSearch']/label"/>
				<xsl:with-param name="level" select="$level+1"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="Relationships/Item[@type='ForumItem']">
				<xsl:sort select="item_keyed_name"/>
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
						<xsl:value-of select="label"/>
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
					<xsl:value-of select="related_id/Item[@type='SavedSearch']/itname/@icon"/>
				</xsl:attribute>
				<xsl:attribute name="icon1">
					<xsl:value-of select="related_id/Item[@type='SavedSearch']/itname/@icon"/>
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
					<xsl:value-of select="item_type/@icon"/>
				</xsl:attribute>
				<xsl:attribute name="icon1">
					<xsl:value-of select="item_type/@icon"/>
				</xsl:attribute>
				<userdata key="className" value="ForumItem"/>
				<td align="left">
					<xsl:value-of select="item_keyed_name"/>
				</td>
			</tr>
		</xsl:if>
	</xsl:template>
</xsl:stylesheet>