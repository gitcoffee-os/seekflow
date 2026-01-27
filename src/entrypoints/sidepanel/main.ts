import { createApp } from 'vue';
import App from '~/App.vue';
import router from '~/router';
import { registerAntdvComponents } from '~/components/antdv.register';

const app = createApp(App);
registerAntdvComponents(app);
app.use(router);
app.mount('#app');
