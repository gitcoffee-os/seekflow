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

import { App } from 'vue';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
} from 'ant-design-vue';

/**
 * 注册所有Ant Design Vue组件
 * @param app Vue应用实例
 */
export function registerAntdvComponents(app: App) {
  // 注册Ant Design Vue组件
  app.use(Button);
  app.use(Input);
  app.use(Layout);
  app.use(Card);
  app.use(Tag);
  app.use(Spin);
  app.use(Empty);
  app.use(Checkbox);
  app.use(Radio);
  app.use(Slider);
  app.use(Space);
  app.use(Modal);
  app.use(Drawer);
  app.use(Row);
  app.use(Col);
  app.use(Tabs);
  app.use(Switch);
  app.use(Collapse);
  app.use(Avatar);
  app.use(Select);
  app.use(Dropdown);
  app.use(Menu);
  app.use(Divider);
  app.use(List);
}
