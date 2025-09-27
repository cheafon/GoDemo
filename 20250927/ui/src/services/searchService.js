// src/services/searchService.js
import { apiClient } from './api';

export const searchService = {
  /**
   * 搜索条目
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchItems(query) {
    return apiClient.get('/search', { q: query });
  },

  /**
   * 获取后端响应
   * @returns {Promise<Array>} 所有条目数组
   */
  async getResponse(user_input) {
    return apiClient.post('/complete',{"user_input":user_input});
  }
};
