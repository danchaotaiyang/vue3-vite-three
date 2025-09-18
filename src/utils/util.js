
export const waiting = (time = 32) => {
    return new Promise((resolve) => {
        let timerCallback = null;
        let timerWait = null;
        timerCallback = () => {
            resolve();
            clearTimeout(timerWait);
            timerCallback = null;
            timerWait = null;
        };

        timerWait = setTimeout(timerCallback, time);
    });
};
