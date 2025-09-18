export default [
    {
        path: '/debug',
        name: 'ErrorDebug',
        meta: {
            title: 'debug',
            order: 10000
        },
        component: () => import(/* webpackChunkName: "ErrorDebug" */ '../views/error/errorDebug.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Error404',
        meta: {
            title: '404',
            order: 10000
        },
        component: () => import(/* webpackChunkName: "Error404" */ '../views/error/error404.vue')
    }
];
