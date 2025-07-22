const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class InstagramService {
  constructor() {
    this.baseURL = 'https://graph.instagram.com';
    this.oauthURL = 'https://api.instagram.com/oauth';
    this.appId = process.env.INSTAGRAM_APP_ID;
    this.appSecret = process.env.INSTAGRAM_APP_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    this.scopes = process.env.INSTAGRAM_SCOPES || 'user_profile,user_media';
  }

  /**
   * Generate Instagram OAuth authorization URL
   */
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: this.scopes,
      response_type: 'code'
    });

    return `${this.oauthURL}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.oauthURL}/access_token`, {
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Get short-lived token
      const shortLivedToken = response.data.access_token;
      
      // Exchange for long-lived token
      const longLivedResponse = await axios.get(`${this.baseURL}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.appSecret,
          access_token: shortLivedToken
        }
      });

      return {
        access_token: longLivedResponse.data.access_token,
        token_type: longLivedResponse.data.token_type,
        expires_in: longLivedResponse.data.expires_in,
        user_id: response.data.user_id
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for access token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      throw new Error(`Failed to fetch user profile: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get user's media (posts)
   */
  async getUserMedia(accessToken, limit = 25, after = null) {
    try {
      const params = {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
        access_token: accessToken,
        limit: limit
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(`${this.baseURL}/me/media`, { params });

      return {
        data: response.data.data || [],
        paging: response.data.paging || null
      };
    } catch (error) {
      console.error('Error fetching user media:', error.response?.data || error.message);
      throw new Error(`Failed to fetch user media: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get detailed media information
   */
  async getMediaDetails(mediaId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/${mediaId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching media details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch media details: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Download media file from Instagram
   */
  async downloadMedia(mediaUrl, filename = null) {
    try {
      if (!filename) {
        filename = `instagram_${uuidv4()}.${this.getFileExtension(mediaUrl)}`;
      }

      const tempDir = process.env.TEMP_DIR || './temp';
      await fs.ensureDir(tempDir);
      
      const filePath = path.join(tempDir, filename);

      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'CreatorBridge/1.0'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading media:', error.message);
      throw new Error(`Failed to download media: ${error.message}`);
    }
  }

  /**
   * Process Instagram media for import
   */
  async processMediaForImport(media, accessToken) {
    try {
      // Only process VIDEO and CAROUSEL_ALBUM (which might contain videos)
      if (!['VIDEO', 'CAROUSEL_ALBUM'].includes(media.media_type)) {
        throw new Error('Media is not a video');
      }

      let videoUrl = media.media_url;
      let thumbnailUrl = media.thumbnail_url || media.media_url;

      // For CAROUSEL_ALBUM, we need to get the children to find videos
      if (media.media_type === 'CAROUSEL_ALBUM') {
        const children = await this.getCarouselChildren(media.id, accessToken);
        const videoChild = children.find(child => child.media_type === 'VIDEO');
        
        if (!videoChild) {
          throw new Error('No video found in carousel');
        }
        
        videoUrl = videoChild.media_url;
        thumbnailUrl = videoChild.thumbnail_url || videoChild.media_url;
      }

      // Extract hashtags from caption
      const hashtags = this.extractHashtags(media.caption);

      // Download the video file
      const localPath = await this.downloadMedia(videoUrl);

      return {
        id: media.id,
        platform: 'instagram',
        title: this.generateTitle(media.caption),
        description: media.caption || '',
        hashtags: hashtags,
        originalUrl: media.permalink,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        localPath: localPath,
        stats: {
          likes: media.like_count || 0,
          comments: media.comments_count || 0
        },
        createdAt: media.timestamp,
        importedAt: new Date().toISOString(),
        status: 'downloaded'
      };
    } catch (error) {
      console.error('Error processing media for import:', error.message);
      throw error;
    }
  }

  /**
   * Get children of a carousel album
   */
  async getCarouselChildren(mediaId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/${mediaId}/children`, {
        params: {
          fields: 'id,media_type,media_url,thumbnail_url',
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching carousel children:', error.message);
      return [];
    }
  }

  /**
   * Extract hashtags from caption text
   */
  extractHashtags(caption) {
    if (!caption) return [];
    
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = caption.match(hashtagRegex);
    
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  /**
   * Generate a title from caption (first line or first 50 chars)
   */
  generateTitle(caption) {
    if (!caption) return 'Instagram Video';
    
    // Remove hashtags for title
    const cleanCaption = caption.replace(/#[\w\u0590-\u05ff]+/g, '').trim();
    
    // Get first line or first 50 characters
    const firstLine = cleanCaption.split('\n')[0];
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
    
    return title || 'Instagram Video';
  }

  /**
   * Get file extension from URL
   */
  getFileExtension(url) {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const extension = path.extname(pathname);
    
    return extension ? extension.substring(1) : 'mp4';
  }

  /**
   * Refresh access token (for long-lived tokens)
   */
  async refreshAccessToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error(`Failed to refresh access token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken) {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get account insights (if available)
   */
  async getAccountInsights(accessToken, period = 'day', metrics = ['impressions', 'reach', 'profile_views']) {
    try {
      const response = await axios.get(`${this.baseURL}/me/insights`, {
        params: {
          metric: metrics.join(','),
          period: period,
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      // Insights might not be available for all account types
      console.warn('Instagram insights not available:', error.response?.data?.error?.message);
      return [];
    }
  }

  /**
   * Import all available media from user account
   */
  async importAllMedia(accessToken, progressCallback = null) {
    const allMedia = [];
    let after = null;
    let hasNextPage = true;

    try {
      while (hasNextPage) {
        const result = await this.getUserMedia(accessToken, 25, after);
        const processedMedia = [];

        for (const media of result.data) {
          try {
            if (['VIDEO', 'CAROUSEL_ALBUM'].includes(media.media_type)) {
              const processed = await this.processMediaForImport(media, accessToken);
              processedMedia.push(processed);
              
              if (progressCallback) {
                progressCallback({
                  processed: allMedia.length + processedMedia.length,
                  current: processed
                });
              }
            }
          } catch (error) {
            console.warn(`Skipping media ${media.id}:`, error.message);
          }
        }

        allMedia.push(...processedMedia);

        // Check if there's a next page
        hasNextPage = result.paging && result.paging.next;
        after = result.paging?.cursors?.after;

        // Add delay to respect rate limits
        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return allMedia;
    } catch (error) {
      console.error('Error importing all media:', error.message);
      throw error;
    }
  }
}

module.exports = InstagramService;