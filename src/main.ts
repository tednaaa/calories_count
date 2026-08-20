import { createApp } from 'vue';

import App from './App.vue';
import { router } from './pages/router';
import { blockPinchZoom, requestPersistentStorage } from './shared/lib';

import './assets/css/main.css';

const app = createApp(App);

app.use(router);

app.mount('#app');

blockPinchZoom();

void requestPersistentStorage();
