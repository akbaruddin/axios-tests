import { useState } from 'react'
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api'
})

const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const user = JSON.parse(localStorage.getItem('user'));
    const { data } = await axios.post(
      'http://localhost:8080/api/token',
      {
        email: user.email,
        name: user.name,
        refreshToken: refreshToken
      }
    );
    localStorage.setItem('token', data.token)
    return Promise.resolve(data.token);
  } catch (error) {
    return Promise.reject(error);
  }
};

// request
axiosInstance.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('token');
    request.headers['x-access-token'] = token;
    return request;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const access_token = await refreshAccessToken();
      axiosInstance.defaults.headers.common[
        'x-access-token'
      ] = access_token;
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState({});
  const [final, setFinal] = useState('');

  const onClick = async () => {
    const user = {
      name: 'akbar',
      email: 'akbarcic@gmail.com'
    }
    const { data } = await axiosInstance.post('/login', user)
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
  }

  const onSecure = async () => {
    const { data } = await axiosInstance({
      methods: 'get',
      url: "/secure?access" + Math.random(36)
    })
    console.log(data);
    setFinal(data);
  }


  return (
    <>
      <button onClick={onClick}>Get Token</button>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <button onClick={onSecure}>Secure</button>
      <br />
      {final}
    </>
  )
}

export default App
