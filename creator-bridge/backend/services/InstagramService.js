const axios = require('axios');

class InstagramService {
  static async testConnection(accessToken) {
    try {
      const response = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
      return {
        success: true,
        message: 'Instagram connection is valid',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Instagram connection failed',
        error: error.response?.data || error.message
      };
    }
  }

  static async getUserMedia(accessToken, limit = 25) {
    try {
      const response = await axios.get(`https://graph.instagram.com/me/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
          limit,
          access_token: accessToken
        }
      });

      // Filter for video content only (Reels and videos)
      const videos = response.data.data.filter(item => 
        item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL_ALBUM'
      );

      return {
        success: true,
        data: videos,
        pagination: response.data.paging
      };
    } catch (error) {
      console.error('Instagram getUserMedia error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async getMediaDetails(mediaId, accessToken) {
    try {
      const response = await axios.get(`https://graph.instagram.com/${mediaId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink,children{media_url,media_type}',
          access_token: accessToken
        }
      });

      const media = response.data;
      
      // Extract video files from carousel if needed
      let videoUrls = [];
      if (media.media_type === 'CAROUSEL_ALBUM' && media.children) {
        videoUrls = media.children.data
          .filter(child => child.media_type === 'VIDEO')
          .map(child => child.media_url);
      } else if (media.media_type === 'VIDEO') {
        videoUrls = [media.media_url];
      }

      return {
        success: true,
        data: {
          id: media.id,
          caption: media.caption,
          mediaType: media.media_type,
          videoUrls,
          thumbnailUrl: media.thumbnail_url,
          timestamp: media.timestamp,
          likeCount: media.like_count,
          commentsCount: media.comments_count,
          permalink: media.permalink
        }
      };
    } catch (error) {
      console.error('Instagram getMediaDetails error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async downloadMedia(mediaUrl, filename) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        timeout: 30000 // 30 seconds timeout
      });

      return {
        success: true,
        stream: response.data,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length']
      };
    } catch (error) {
      console.error('Instagram downloadMedia error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`https://graph.instagram.com/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Instagram getUserProfile error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static extractHashtags(caption) {
    if (!caption) return [];
    
    const hashtagRegex = /#[\w\u00C0-\u017F\u4e00-\u9fff]+/g;
    const hashtags = caption.match(hashtagRegex);
    
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
  }

  static cleanCaption(caption) {
    if (!caption) return '';
    
    // Remove hashtags and mentions for cleaner title
    return caption
      .replace(/#[\w\u00C0-\u017F\u4e00-\u9fff]+/g, '') // Remove hashtags
      .replace(/@[\w\u00C0-\u017F\u4e00-\u9fff]+/g, '') // Remove mentions
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  static async refreshToken(accessToken) {
    try {
      // Instagram Basic Display API doesn't support token refresh
      // Long-lived tokens last 60 days and can be refreshed before expiry
      const response = await axios.get(`https://graph.instagram.com/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return {
        success: true,
        data: {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in
        }
      };
    } catch (error) {
      console.error('Instagram refreshToken error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  static async getRecentVideos(accessToken, since = null) {
    try {
      const params = {
        fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
        limit: 50,
        access_token: accessToken
      };

      if (since) {
        params.since = Math.floor(new Date(since).getTime() / 1000);
      }

      const response = await axios.get(`https://graph.instagram.com/me/media`, { params });

      // Filter for video content and videos posted after 'since' date
      const videos = response.data.data.filter(item => {
        const isVideo = item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL_ALBUM';
        const isRecent = since ? new Date(item.timestamp) > new Date(since) : true;
        return isVideo && isRecent;
      });

      return {
        success: true,
        data: videos,
        hasMore: !!response.data.paging?.next
      };
    } catch (error) {
      console.error('Instagram getRecentVideos error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = { InstagramService };