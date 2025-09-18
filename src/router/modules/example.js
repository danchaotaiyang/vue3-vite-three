import * as study163 from '@/router/modules/example/study163-1212491801.js';
import * as other from '@/router/modules/example/other.js';


export default {
    path: '/example',
    name: 'Example',
    meta: {
        title: '示例',
        order: 200
    },
    redirect: { name: 'Home' },
    children: [
        study163.default,
        other.default
    ]
};
