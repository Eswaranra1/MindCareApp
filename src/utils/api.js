import axios from 'axios';

const BASE_URL = 'http://10.222.46.233:5000'; // Use local IP, or deployed server

export const signUp = async (email, password) => {
  return axios.post(`${BASE_URL}/signup`, { email, password });
};

export const login = async (email, password) => {
  return axios.post(`${BASE_URL}/login`, { email, password });
};

export const forgotPassword = async (email) => {
  return axios.post(`${BASE_URL}/forgot`, { email });
};
