const axios = require('axios');

class TikTokService {
  static async testConnection(accessToken, openId) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/user/info/', {
        access_token: accessToken,
        open_id: openId
      });

      return {
        success: true,
        message: 'TikTok connection is valid',
        data: response.data.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: 'TikTok connection failed',
        error: error.response?.data || error.message
      };
    }
  }

  static async getUserVideos(accessToken, openId, cursor = 0, maxCount = 20) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/video/list/', {
        access_token: accessToken,
        open_id: openId,
        cursor,
        max_count: maxCount,
        fields: [
          "id",
          "title",
          "video_description", 
          "duration",
          "create_time",
          "cover_image_url",
          "share_url",
          "view_count",
          "like_count",
          "comment_count",
          "share_count",
          "download_url"
        ]
      });

      if (response.data.data && response.data.data.videos) {
        return {
          success: true,
          data: response.data.data.videos,
          hasMore: response.data.data.has_more,
          cursor: response.data.data.cursor
        };
      } else {
        return {
          success: false,
          error: 'No video data returned'
        };
      }
    } catch (error) {
      console.error('TikTok getUserVideos error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async getVideoDetails(videoId, accessToken, openId) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/video/query/', {
        access_token: accessToken,
        open_id: openId,
        video_ids: [videoId],
        fields: [
          "id",
          "title",
          "video_description", 
          "duration",
          "create_time",
          "cover_image_url",
          "share_url",
          "view_count",
          "like_count",
          "comment_count",
          "share_count",
          "download_url",
          "width",
          "height"
        ]
      });

      if (response.data.data && response.data.data.videos && response.data.data.videos.length > 0) {
        const video = response.data.data.videos[0];
        return {
          success: true,
          data: {
            id: video.id,
            title: video.title,
            description: video.video_description,
            duration: video.duration,
            createTime: video.create_time,
            coverImageUrl: video.cover_image_url,
            shareUrl: video.share_url,
            downloadUrl: video.download_url,
            stats: {
              views: video.view_count,
              likes: video.like_count,
              comments: video.comment_count,
              shares: video.share_count
            },
            dimensions: {
              width: video.width,
              height: video.height
            }
          }
        };
      } else {
        return {
          success: false,
          error: 'Video not found'
        };
      }
    } catch (error) {
      console.error('TikTok getVideoDetails error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async downloadVideo(downloadUrl, filename) {
    try {
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 60000, // 60 seconds timeout for larger video files
        headers: {
          'User-Agent': 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet'
        }
      });

      return {
        success: true,
        stream: response.data,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length']
      };
    } catch (error) {
      console.error('TikTok downloadVideo error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getUserProfile(accessToken, openId) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/user/info/', {
        access_token: accessToken,
        open_id: openId,
        fields: [
          "open_id",
          "union_id", 
          "avatar_url",
          "display_name",
          "bio_description",
          "profile_deep_link",
          "is_verified",
          "follower_count",
          "following_count",
          "likes_count",
          "video_count"
        ]
      });

      return {
        success: true,
        data: response.data.data.user
      };
    } catch (error) {
      console.error('TikTok getUserProfile error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static extractHashtags(description) {
    if (!description) return [];
    
    const hashtagRegex = /#[\w\u00C0-\u017F\u4e00-\u9fff]+/g;
    const hashtags = description.match(hashtagRegex);
    
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
  }

  static cleanDescription(description) {
    if (!description) return '';
    
    // Remove hashtags and mentions for cleaner title
    return description
      .replace(/#[\w\u00C0-\u017F\u4e00-\u9fff]+/g, '') // Remove hashtags
      .replace(/@[\w\u00C0-\u017F\u4e00-\u9fff]+/g, '') // Remove mentions
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  static async refreshToken(refreshToken) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/refresh_token/', {
        client_key: process.env.TIKTOK_CLIENT_ID,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      if (response.data.data) {
        return {
          success: true,
          data: {
            accessToken: response.data.data.access_token,
            refreshToken: response.data.data.refresh_token,
            expiresIn: response.data.data.expires_in,
            openId: response.data.data.open_id
          }
        };
      } else {
        return {
          success: false,
          error: 'Token refresh failed'
        };
      }
    } catch (error) {
      console.error('TikTok refreshToken error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async getRecentVideos(accessToken, openId, since = null) {
    try {
      let allVideos = [];
      let cursor = 0;
      let hasMore = true;
      const maxPages = 5; // Limit to prevent infinite loops
      let pageCount = 0;

      while (hasMore && pageCount < maxPages) {
        const result = await this.getUserVideos(accessToken, openId, cursor, 20);
        
        if (!result.success) {
          break;
        }

        const videos = result.data || [];
        
        // Filter videos posted after 'since' date if provided
        const filteredVideos = since 
          ? videos.filter(video => new Date(video.create_time * 1000) > new Date(since))
          : videos;

        allVideos = allVideos.concat(filteredVideos);

        // If we have a 'since' filter and found older videos, stop here
        if (since && filteredVideos.length < videos.length) {
          break;
        }

        hasMore = result.hasMore;
        cursor = result.cursor;
        pageCount++;
      }

      return {
        success: true,
        data: allVideos,
        total: allVideos.length
      };
    } catch (error) {
      console.error('TikTok getRecentVideos error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static formatVideoData(video) {
    return {
      id: video.id,
      title: video.title || this.cleanDescription(video.video_description),
      description: video.video_description,
      duration: video.duration,
      createdAt: new Date(video.create_time * 1000),
      thumbnailUrl: video.cover_image_url,
      shareUrl: video.share_url,
      downloadUrl: video.download_url,
      hashtags: this.extractHashtags(video.video_description),
      stats: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0
      },
      dimensions: {
        width: video.width,
        height: video.height
      }
    };
  }

  static async revokeToken(accessToken, openId) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/revoke/', {
        client_key: process.env.TIKTOK_CLIENT_ID,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        access_token: accessToken,
        open_id: openId
      });

      return {
        success: true,
        message: 'Token revoked successfully'
      };
    } catch (error) {
      console.error('TikTok revokeToken error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = { TikTokService };