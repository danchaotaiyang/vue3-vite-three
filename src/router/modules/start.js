export default {
    path: '/',
    name: 'Home',
    meta: {
        title: '开始',
        order: 0
    },
    component: () => import(/* webpackChunkName: "Home" */ '../../views/Home.vue')
};
