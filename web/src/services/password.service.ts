import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api/pwd';

class PasswordService {
  getAll() {
    return axios.get(API_URL + '/all', { headers: authHeader() });
  }

  add(data: { appName: string, password: string }) {
    return axios.post(API_URL + '/user', data, { headers: authHeader() });
  }

  update(id, data) {
    return axios.post(API_URL + `/${id}`, data, { headers: authHeader() });
  }

  remove(id) {
    return axios.delete(API_URL + `/${id}`, { headers: authHeader() });
  }

}

export default new PasswordService();