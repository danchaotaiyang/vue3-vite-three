import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useFullscreen = defineStore('fullscreen', () => {

    const isFullScreen = ref(0);

    const toggleFullscreen = async () => {
        if (isFullScreen.value) {
            isFullScreen.value = 0;
            await document.exitFullscreen();
        } else {
            isFullScreen.value = 1;
            await document.body.requestFullscreen();
        }
    };

    return { isFullScreen, toggleFullscreen };
});
