import Axios from 'axios';


const axios = Axios.create({
});

axios.interceptors.response.use((response) => {
    if (response.data) {
        return response.data;
    } else {
        throw new Error(response.data.message || '服务异常!');
    }
}, (error) => {
    throw error;
});

export default axios;
