import axios from 'axios';
const BASE_URL = 'http://192.168.68.110:8000'; // Replace with your backend IP and port

export const signUp = async (email, password) => {
  return axios.post(`${BASE_URL}/signup`, { email, password });
};

export const login = async (email, password) => {
  return axios.post(`${BASE_URL}/login`, { email, password });
};

export const forgotPassword = async (email) => {
  return axios.post(`${BASE_URL}/forgot`, { email });
};
