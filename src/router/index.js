import { createRouter, createWebHistory } from 'vue-router';
import errorRouter from './error.js';
import { routerBase } from '../config.js';

const modules = import.meta.glob('./modules/*.js', { eager: true });

const routerModules = [];

for (const key in modules) {
    let item = modules[ key ];
    let mod = item.default || {};
    let modList = Array.isArray(mod) ? [ ...mod ] : [ mod ];
    routerModules.push(...modList);
    item = null;
    mod = null;
    modList = null;
}

const router = createRouter({
    history: createWebHistory(routerBase),
    routes: [
        ...errorRouter
    ]
});

export const routes = routerModules
    .sort((a, b) => {
        return a.meta.order - b.meta.order;
    })
    .map(d => {
        router.addRoute(d);
        return d;
    });

export const defaultRouterName = routes[ 0 ].name;

export default router;

