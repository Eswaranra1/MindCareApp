import axios from 'axios';
const BASE_URL = 'http://192.168.68.110:8000'; // replace with your backend IP

export const signUp = async (email, password) => {
  return axios.post(`${BASE_URL}/signup`, { email, password });
};

export const login = async (email, password) => {
  return axios.post(`${BASE_URL}/login`, { email, password });
};

export const resetPassword = async (email, newPassword) => {
  return axios.post(`${BASE_URL}/reset-password`, { email, newPassword });
};
