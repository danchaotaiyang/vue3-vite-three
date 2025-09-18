export const port = 8888;

export const isSingleSPA = false;

export const isPro = import.meta.env.PROD;

export const routerBase = isPro && isSingleSPA ? '/app-three' : import.meta.env.BASE_URL;

export const base  = isPro && isSingleSPA ? `http://localhost:${ port }` : '';