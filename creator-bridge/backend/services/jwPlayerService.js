const axios = require('axios');
const fs = require('fs-extra');
const FormData = require('form-data');
const crypto = require('crypto');
const path = require('path');

class JWPlayerService {
  constructor() {
    this.apiKey = process.env.JW_PLAYER_API_KEY;
    this.apiSecret = process.env.JW_PLAYER_API_SECRET;
    this.siteId = process.env.JW_PLAYER_SITE_ID;
    this.baseURL = 'https://api.jwplayer.com';
    this.uploadURL = 'https://upload.jwplatform.com';
  }

  /**
   * Generate API signature for authentication
   */
  generateSignature(params, path, method = 'GET') {
    // Sort parameters by key
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Create string to sign
    const stringToSign = `${method}&${path}&${sortedParams}`;

    // Generate HMAC-SHA1 signature
    const signature = crypto
      .createHmac('sha1', this.apiSecret)
      .update(stringToSign)
      .digest('hex');

    return signature;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', data = null, isUpload = false) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const params = {
      api_key: this.apiKey,
      timestamp: timestamp,
      nonce: nonce,
      api_format: 'json'
    };

    // Add additional parameters
    if (data && method === 'GET') {
      Object.assign(params, data);
    }

    // Generate signature
    const signature = this.generateSignature(params, endpoint, method);
    params.api_signature = signature;

    const baseURL = isUpload ? this.uploadURL : this.baseURL;
    const url = `${baseURL}${endpoint}`;

    try {
      let response;
      
      if (method === 'GET') {
        response = await axios.get(url, { params });
      } else if (method === 'POST') {
        if (data instanceof FormData) {
          // For file uploads
          Object.keys(params).forEach(key => {
            data.append(key, params[key]);
          });
          
          response = await axios.post(url, data, {
            headers: {
              ...data.getHeaders(),
              'Content-Type': 'multipart/form-data'
            },
            timeout: 300000 // 5 minute timeout for uploads
          });
        } else {
          // For regular POST requests
          const postData = { ...params, ...data };
          response = await axios.post(url, postData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        }
      }

      if (response.data.status !== 'ok') {
        throw new Error(response.data.message || 'API request failed');
      }

      return response.data;
    } catch (error) {
      console.error('JW Player API Error:', error.response?.data || error.message);
      throw new Error(`JW Player API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get account information
   */
  async getAccount() {
    return await this.makeRequest('/v2/sites/' + this.siteId);
  }

  /**
   * Get list of videos
   */
  async getVideos(search = null, orderBy = 'created:desc', page = 1, pageLength = 10) {
    const params = {
      page: page,
      page_length: pageLength,
      order_by: orderBy
    };

    if (search) {
      params.search = search;
    }

    return await this.makeRequest(`/v2/sites/${this.siteId}/media`, 'GET', params);
  }

  /**
   * Get video details
   */
  async getVideoDetails(videoId) {
    return await this.makeRequest(`/v2/sites/${this.siteId}/media/${videoId}`);
  }

  /**
   * Create a new video upload
   */
  async createVideo(metadata) {
    const params = {
      upload: {
        method: 'direct'
      },
      metadata: {
        title: metadata.title || 'Untitled Video',
        description: metadata.description || '',
        tags: metadata.tags ? metadata.tags.join(',') : '',
        author: metadata.author || '',
        link: metadata.link || '',
        custom: metadata.custom || {}
      }
    };

    return await this.makeRequest(`/v2/sites/${this.siteId}/media`, 'POST', params);
  }

  /**
   * Upload video file
   */
  async uploadVideo(filePath, metadata = {}) {
    try {
      // First, create the video entry
      console.log('Creating video entry in JW Player...');
      const createResponse = await this.createVideo(metadata);
      
      if (!createResponse.upload || !createResponse.upload.upload_url) {
        throw new Error('Failed to get upload URL from JW Player');
      }

      const videoId = createResponse.media.id;
      const uploadUrl = createResponse.upload.upload_url;

      console.log(`Uploading file to JW Player (Video ID: ${videoId})...`);

      // Prepare file for upload
      const fileStream = fs.createReadStream(filePath);
      const fileStats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      const formData = new FormData();
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: 'video/mp4',
        knownLength: fileStats.size
      });

      // Upload the file directly to the provided URL
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 600000, // 10 minute timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Video uploaded successfully to JW Player');

      // Return video information
      return {
        id: videoId,
        status: 'uploaded',
        uploadResponse: uploadResponse.data,
        jwPlayerUrl: `https://dashboard.jwplayer.com/p/media/${videoId}`,
        playerUrl: createResponse.media ? createResponse.media.player_url : null,
        embedCode: this.generateEmbedCode(videoId)
      };

    } catch (error) {
      console.error('Error uploading to JW Player:', error.message);
      throw new Error(`Failed to upload video to JW Player: ${error.message}`);
    }
  }

  /**
   * Update video metadata
   */
  async updateVideo(videoId, metadata) {
    const params = {
      metadata: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags ? metadata.tags.join(',') : '',
        author: metadata.author || '',
        link: metadata.link || '',
        custom: metadata.custom || {}
      }
    };

    return await this.makeRequest(`/v2/sites/${this.siteId}/media/${videoId}`, 'POST', params);
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId) {
    return await this.makeRequest(`/v2/sites/${this.siteId}/media/${videoId}`, 'DELETE');
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId, startDate = null, endDate = null) {
    const params = {};
    
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return await this.makeRequest(`/v2/sites/${this.siteId}/analytics/queries/media/${videoId}`, 'GET', params);
  }

  /**
   * Generate embed code for video
   */
  generateEmbedCode(videoId, width = 640, height = 360) {
    return `<iframe src="https://content.jwplatform.com/players/${videoId}" width="${width}" height="${height}" frameborder="0" scrolling="auto" allowfullscreen></iframe>`;
  }

  /**
   * Get upload status
   */
  async getUploadStatus(videoId) {
    try {
      const response = await this.getVideoDetails(videoId);
      return {
        id: videoId,
        status: response.media.status,
        duration: response.media.duration,
        size: response.media.size,
        created: response.media.created,
        updated: response.media.updated,
        processingStatus: response.media.status === 'ready' ? 'completed' : 'processing'
      };
    } catch (error) {
      console.error('Error getting upload status:', error.message);
      throw error;
    }
  }

  /**
   * Process and upload Instagram video to JW Player
   */
  async processInstagramVideo(instagramMedia) {
    try {
      console.log(`Processing Instagram video: ${instagramMedia.title}`);

      // Prepare metadata for JW Player
      const metadata = {
        title: instagramMedia.title,
        description: instagramMedia.description,
        tags: instagramMedia.hashtags,
        author: instagramMedia.platform,
        link: instagramMedia.originalUrl,
        custom: {
          instagram_id: instagramMedia.id,
          import_date: instagramMedia.importedAt,
          original_stats: JSON.stringify(instagramMedia.stats),
          platform: 'instagram'
        }
      };

      // Upload to JW Player
      const uploadResult = await this.uploadVideo(instagramMedia.localPath, metadata);

      // Clean up local file after successful upload
      try {
        await fs.remove(instagramMedia.localPath);
        console.log('Cleaned up local file:', instagramMedia.localPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup local file:', cleanupError.message);
      }

      return {
        ...uploadResult,
        originalMedia: instagramMedia,
        syncedAt: new Date().toISOString(),
        destination: 'jwplayer'
      };

    } catch (error) {
      console.error('Error processing Instagram video for JW Player:', error.message);
      throw error;
    }
  }

  /**
   * Batch upload multiple videos
   */
  async batchUpload(mediaItems, progressCallback = null) {
    const results = [];
    const concurrency = parseInt(process.env.CONCURRENT_UPLOADS) || 2;

    for (let i = 0; i < mediaItems.length; i += concurrency) {
      const batch = mediaItems.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (media) => {
        try {
          const result = await this.processInstagramVideo(media);
          
          if (progressCallback) {
            progressCallback({
              completed: results.length + 1,
              total: mediaItems.length,
              current: result
            });
          }
          
          return { success: true, result, media };
        } catch (error) {
          console.error(`Failed to upload ${media.title}:`, error.message);
          return { success: false, error: error.message, media };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + concurrency < mediaItems.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Test connection and credentials
   */
  async testConnection() {
    try {
      const account = await this.getAccount();
      return {
        success: true,
        account: account.site,
        message: 'Successfully connected to JW Player'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to JW Player'
      };
    }
  }
}

module.exports = JWPlayerService;