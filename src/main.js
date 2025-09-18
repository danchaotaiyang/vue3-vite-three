import { createApp, h } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import * as ElementPlusIcons from '@element-plus/icons-vue';
import pinia from './stores';
import router from '@/router';
import App from './App.vue';
import MonacoEditor from './components/monaco-editor';

import 'element-plus/dist/index.css';
import './assets/css/redefine.scss';
import './assets/css/layout.scss';

import singleSpaVue from 'single-spa-vue';

const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(ElementPlus, { locale: zhCn, size: 'small' });
for (const [ key, component ] of Object.entries(ElementPlusIcons)) {
    app.component(key, component);
}
app.use(MonacoEditor);
app.mount('#app');

/*
const vueLifeCycles = singleSpaVue({
    createApp,
    appOptions: {
        render() {
            return h(App, {
                props: {
                    name: this.name,
                    mountParcel: this.mountParcel,
                    singleSpa: this.singleSpa
                }
            });
        }
    },
    handleInstance: (app) => {
        app.use(router);
        app.use(pinia);
        app.use(ElementPlus, { locale: zhCn, size: 'small' });
        for (const [ key, component ] of Object.entries(ElementPlusIcons)) {
            app.component(key, component);
        }
        app.component('MonacoEditor', MonacoEditor);
    }
});

export const bootstrap = vueLifeCycles[ 'bootstrap' ];
export const mount = vueLifeCycles[ 'mount' ];
export const unmount = vueLifeCycles[ 'unmount' ];
*/
