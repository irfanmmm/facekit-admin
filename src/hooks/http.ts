import axios from "axios";

const axiosInstance = axios.create({
    // Defaults to the production backend, matching every build up to now.
    // A UAT build overrides this at build time with VITE_API_BASE_URL so it
    // talks to the UAT gunicorn instance (facekit@5002) instead.
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://facekit.officekithr.net/facekit/",
    headers: {
        "Content-Type": "application/json",
    },
});


axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "#/auth/sign-in";
        }
        return Promise.reject(error);
    }
);

const get = (url: string) => {
    return axiosInstance.get(url);
}

const getFile = (url: string, config?: any) => {
    return axiosInstance.get(url, { responseType: 'blob', ...config });
}

const post = (url: string, data: any) => {
    return axiosInstance.post(url, data);
}


export { get, post, getFile }
