import axios from "axios";
//const BASE_URL = 'http://localhost:5100';
const BASE_URL = 'https://finance.inframad.com/api';

export default axios.create({
    baseURL: BASE_URL,
    //withCredentials: true
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

export const URL = BASE_URL;