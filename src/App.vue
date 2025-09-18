<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { REVISION } from 'three';
import disableDevtool from 'disable-devtool';
import { routes } from '@/router';
import { SideMenu } from './components/SideMenu';


const asideRef = ref();

const menu = computed(() => {
    return routes.filter((d) => d[ 'meta' ]).map((d) => setItem(d));
});

const setItem = ({ meta, path, children }) => {

    const item = {
        label: meta[ 'title' ],
        value: path
    };

    if (meta[ 'description' ]) {
        item[ 'description' ] = meta[ 'description' ];

        if (meta[ 'updated' ]) {
            item[ 'description' ] += `<br><span class="updated-datetime">${ meta[ 'updated' ] }</span>`;
        }
    }

    if (Array.isArray(children) && children.length) {
        item[ 'children' ] = children.filter((d) => d[ 'meta' ] && (d[ 'children' ] || d[ 'component' ])).map((d) => setItem(d));
    }

    return item;
};

const getMenuWidth = () => {
    nextTick(() => {
        sessionStorage.setItem('menu-width', asideRef.value.clientWidth);
    });
};

onMounted(() => {
    getMenuWidth();
});

document.title = `Three.js r${ REVISION }`;

/*if (import.meta.env.PROD) {
    disableDevtool({
        disableMenu: false,
        ondevtoolopen() {
            if (route.name !== 'ErrorDebug') {
                router.replace({
                    name: 'ErrorDebug',
                    query: {
                        redirect: route.name
                    }
                });
            }
        },
        ondevtoolclose() {
            if (route.name === 'ErrorDebug') {
                router.replace({
                    name: route.query.redirect || 'Home'
                });
            }
        }
    });
}*/

</script>

<template>
<div class="app-wrap">
    <div ref="asideRef" class="aside">
        <div class="logo">
            <div class="brand">
                <svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M6.276758 14.178032C4.169462 5.646052 12.080719-1.972635 20.525719 0.462814l246.03575 70.833626a11.623736 11.623736 0 0 1 6.238863 1.798911l485.231682 139.698332c2.008455 0.039537 3.993188 0.612816 5.71698 1.644719l246.051565 70.841533c8.452907 2.435449 11.097901 13.110309 4.756243 19.20684l-742.495803 714.223239c-6.337704 6.096531-16.897908 3.044312-19.005204-5.495576L129.891635 514.611506a11.655365 11.655365 0 0 1-0.387458-1.565646z m210.753362 757.954582l53.453372 216.395222 160.968978-154.844771-214.42235-61.550451z m165.808248-171.129864l-155.849 150.219 207.614162 59.605254-51.765162-209.824254z m23.132816-1.605182l51.603063 209.16004 155.422005-149.503389-207.025068-59.656651z m-249.356817-71.853667l51.828421 209.83216 155.663178-150.041085-207.491599-59.791075z m410.009503-103.894062l-158.347707 152.634681 211.018256 60.807164-52.670549-213.441845z m22.187894-5.428364l52.670549 213.433938 158.782609-152.733522-211.453158-60.700416zM321.620024 352.824121l-158.687722 152.769105 211.405714 60.913913-52.717992-213.683018z m22.100913-5.76047l51.769116 209.820299 155.849-150.222952-207.614162-59.597347zM94.435285 275.806985L147.117695 489.110452l158.573066-152.658403-211.259429-60.645064z m657.065296-29.612852l-155.848999 150.218999 207.614162 59.605254-51.765163-209.824253z m22.27092-5.100211l52.504496 212.809261 158.1777-152.152335-210.682196-60.656926z m-268.294809-65.258976L350.331443 325.192049l206.63761 59.316638-51.488407-208.673741z m22.144404-5.610232l51.840282 210.073334 155.892489-150.266443-207.732771-59.806891zM260.302838 104.69689L104.453839 254.919843 312.068001 314.517189 260.302838 104.69689z m22.290689-5.017184l51.638646 209.294464 155.469448-149.665488-207.108094-59.628976zM33.189266 27.877436l52.674502 213.240208 158.233052-152.520024L33.189266 27.877436z" fill="#2c2c2c"></path></svg>
                <span>Three.js</span>
            </div>
            <div class="version">r{{ REVISION }}</div>
        </div>
        <div class="official">
            <ul>
                <li><a href="https://github.com/mrdoob/three.js/" target="_blank">GitHub</a></li>
                <li><a href="https://threejs.org/examples/#webgl_animation_keyframes" target="_blank">Example</a></li>
                <li><a href="https://threejs.org/docs/index.html#manual/zh/introduction/Creating-a-scene" target="_blank">Docs</a></li>
            </ul>
        </div>
        <div class="navigation">
            <div class="navigation-inner">
                <el-scrollbar scroll-y>
                    <side-menu :data="menu"></side-menu>
                </el-scrollbar>
            </div>
        </div>
    </div>
    <router-view v-slot="{ Component }">
        <transition mode="out-in" appear>
            <suspense>
                <div><component :is="Component"></component></div>
                <template #fallback>
                <div>加载中……</div>
                </template>
            </suspense>
        </transition>
    </router-view>
</div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

.app-wrap {
    overflow: hidden;
}

.aside {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 215px;
    background: color.scale(#ffffff, $alpha: -1%);
    //background: rgba(0, 0, 0, .01);
    overflow: hidden;
    //border-right: 1px solid rgba(0, 0, 0, .1);
    //box-shadow: 0 0 8px rgba(0, 0, 0, .2);
    opacity: 0;
    transform: translateX(-182px);
    transition: all .2s ease;

    .logo {
        position: relative;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
        //background: var(--three-blue-main);
        padding: 5px;
        line-height: 1;
        border-bottom: 2px solid var(--three-link-hover-color);
        //box-shadow: 0 0 8px rgba(0, 0, 0, .2);

        .brand {
            display: flex;
            align-items: center;
            font-weight: 500;
            line-height: 1;

            span {
                margin-left: 5px;
                font-size: 20px;
            }
        }

        .version {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            margin: 1px 3px 0 0;
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 16px;
            line-height: 1;
            color: var(--three-color);
        }
    }

    .official {
        ul {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0;
            padding: 5px;
            background: var(--three-note-background-color);
            line-height: 1;
            list-style: none;
        }

        a {
            display: inline-block;
            padding: 0 5px;
            font-size: 12px;
            text-align: center;
            color: var(--three-link-color);
        }
    }

    .navigation {
        position: relative;
        flex: 1;

        .navigation-inner {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
        }
    }

    &:hover {
        transform: translateX(0);
        opacity: 1;
    }
}

.updated-datetime {
    display: block;
    color: #aaa;
    transform-origin: 0 center;
    transform: scale(.8);
}
</style>
