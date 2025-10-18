import axios from 'axios';

export const fetchResults = async (userId) => {
  return axios.get(`/api/results/${userId}`);
};

export const submitTest = async (answers) => {
  return axios.post('/api/test/submit', answers);
};
