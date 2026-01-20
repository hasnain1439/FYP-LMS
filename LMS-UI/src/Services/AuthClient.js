import axios from 'axios';

// 1. Create a custom Axios instance for all protected API calls
const apiClient = axios.create({
  // Ensure this base URL matches the backend server your pages are talking to
  baseURL: 'http://localhost:5000/api/auth/verify-email/:token', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to track if a refresh is currently in progress
let isRefreshing = false;
// Queue to hold pending requests while the token is being refreshed
let failedQueue = [];

// Helper function to process the queue once the token is renewed
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // Re-run the request with the new Access Token
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. REQUEST INTERCEPTOR: Automatically attach the Access Token to every request
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      // Attach token in the Authorization header
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: Handle expired tokens (401 error)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is 401 Unauthorized and not the refresh request itself
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh-token') {
      
      // Prevent infinite refresh loop
      if (originalRequest._retry) {
        // If it failed after a retry, the refresh token itself is bad. Force logout.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(error);
      }
      
      // Mark the original request for retry
      originalRequest._retry = true;

      // Create a promise to resolve once the token is refreshed
      let resolve;
      const retryOriginalRequest = new Promise((res, reject) => {
        // Store resolve/reject for later use when refresh is done
        resolve = res; 
        failedQueue.push({ resolve, reject });
      });

      if (!isRefreshing) {
        isRefreshing = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
           // No refresh token, force logout immediately
           localStorage.removeItem('accessToken');
           window.location.href = '/login'; 
           return Promise.reject(error);
        }

        try {
          // 4. 🔄 CALL THE REFRESH TOKEN BACKEND ENDPOINT 🔄
          // This call corresponds directly to your static async refreshToken function on the backend.
          const res = await axios.post(
            'http://localhost:5000/api/auth/refresh-token', 
            { refreshToken }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

          // 5. Update the stored tokens
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // 6. Update the Authorization header for all future requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          
          // 7. Process all requests that were waiting
          processQueue(null, newAccessToken);
          
        } catch (refreshError) {
          // If the refresh call fails (backend sends 401 due to expired refresh token), force logout.
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // Return the promise that will retry the original request
      // This waits until processQueue is called (step 7)
      return retryOriginalRequest.then(token => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // For all other errors (like 404, 500), just reject
    return Promise.reject(error);
  }
);

export default apiClient;