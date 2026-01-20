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
// import { useSettingsStore } from '../stores';
import { search } from '@gitcoffee/api';

const intervalTime: number = 1000 * 30;

// const initDefaultTrustedDomains = async () => {
//   const settingsStore = useSettingsStore();
//   const trustedDomains = settingsStore.getTrustedDomains;
//   if (!trustedDomains || trustedDomains.length === 0) {
//     await settingsStore.saveTrustedDomains(['exmay.com']);
//   }
// };

export const initSeekFlow = async () => {
  // initDefaultTrustedDomains();

  await search.user.isLoginApi({});

  const searchPlatformList = await search.platform.listingApi({});

  startSeekFlow(intervalTime);
};

export const startSeekFlow = async (intervalTime: number) => {
  search.client.updateApi({});
};
