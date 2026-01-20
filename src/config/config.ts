/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// export const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://seekflow.exmay.com';
export const BASE_URL = 'https://seekflow.exmay.com';
export const BASE_API = `${BASE_URL}/exmay/authority/api`;
export const APP_ID = 'seekflow';

import logoUrl from '../../assets/logo.svg';

// 搜索接口配置
export const SEARCH_API_CONFIG = {
  // url: 'https://code.exmay.com/exmay/api/ugc/article/search',
  // method: 'GET',
  url: '/api/search',
  method: 'GET',
  timeout: 10000,
  headers: {
    'App-Id': 'eflyos',
  },
  urlTemplate: 'https://code.exmay.com/exmay/ugc/article/detail/{id}',
};

// 应用信息配置
export const APP_INFO = {
  name: 'SeekFlow',
  logoUrl: logoUrl,
  version: 'v1.0.0',
  officialWebsite: 'https://seekflow.exmay.com/',
  openSourceCommunity: 'https://github.com/gitcoffee-os',
  githubRepository: 'https://github.com/gitcoffee-os/seekflow',
  rateApp: 'https://github.com/gitcoffee-os/seekflow',
  submitFeedback: 'https://github.com/gitcoffee-os/seekflow/issues'
};

// 应用默认设置
export const APP_SETTING = {
  smartSearch: true, // seekflow默认启用智能搜索
  aiModeSearch: true, // seekflow默认启用AI模式搜索
  aiTabUrl: 'https://dreamingai.exmay.com/' // AI选项卡默认URL
};
