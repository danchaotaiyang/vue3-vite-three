const __base__path__ = 'example/others';
const __base__name__ = __base__path__.split('/').map(d => d.replace(/^\w/, c => c.toUpperCase())).join('-');

const modules = import.meta.glob([
    `../../../views/example/others/**/*.vue`
]);

const setChildren = (data, parent) => {
    return data.map((d) => {
        let [ name, title, description, children ] = d;
        if (parent) {
            name = `${ parent }/${ name }`;
        }
        let route = {
            path: `/${ __base__path__ }/${ name }`,
            name: `${ __base__name__ }-${ name }`,
            meta: {
                title, description
            }
        };
        if (children) {
            route.redirect = { name: 'Home' };
            route.children = setChildren(children, name);
        } else {
            route.component = modules[ `../../../views/${ __base__path__ }/${ name }.vue` ];
        }
        return route;
    });
};

const __children__ = [
    [ 'geo-json', 'GeoJSON地图', '',
        [
            [ 'geo-json', '吉林省地图' ]
        ]
    ],
    [ 'terrain-map', '地形图', '',
        [
            [ 'terrain-map', '吉林省地形图' ]
        ]
    ],
    [ 'cable-duct', '管沟', '',
        [
            [ 'cable-duct', '管沟' ]
        ]
    ]
];

const routeDefault = {
    path: __base__path__,
    name: __base__name__,
    meta: {
        title: '其他'
    },
    redirect: { name: 'Home' }
};

routeDefault.children = setChildren(__children__);

export default routeDefault;
