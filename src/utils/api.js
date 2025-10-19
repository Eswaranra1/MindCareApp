import axios from 'axios';
import { Platform } from 'react-native';

const LOCAL_IP = '192.168.0.2'; // Change to your computer's LAN IP

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : `http://${LOCAL_IP}:8000`;

export const signUp = async (email, password) => {
  return axios.post(`${BASE_URL}/signup`, { email, password });
};

export const login = async (email, password) => {
  return axios.post(`${BASE_URL}/login`, { email, password });
};

export const resetPassword = async (email, newPassword) => {
  return axios.post(`${BASE_URL}/reset-password`, { email, newPassword });
};

// New API helper for Mental Health test history
export const saveResult = async (payload) => {
  return axios.post(`${BASE_URL}/mentalhealthresults`, payload);
};

export const fetchHistory = async (userEmail) => {
  return axios.get(`${BASE_URL}/mentalhealthresults/${userEmail}`);
};
