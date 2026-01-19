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

<template>
  <UserSetting v-model="modelValue" :setting-data="settingData">
    <Setting />
  </UserSetting>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { settingData } from '@gitcoffee/search';
import { UserSetting } from '@gitcoffee/setting-ui';
import Setting from '../Setting.vue';

// 组件属性
const props = defineProps<{
  modelValue?: boolean;
}>();

// 事件
const emit = defineEmits(['update:modelValue']);

// 本地计算属性处理 v-model
const modelValue = computed({
  get: () => props.modelValue || false,
  set: (value) => emit('update:modelValue', value)
});
</script>

<style scoped>
/* 可以在这里添加组件特定的样式 */
</style>