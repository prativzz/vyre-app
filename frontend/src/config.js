const isProd = process.env.NODE_ENV === 'production';

// In development, fallback to localhost if environment variables aren't set
export const API_URL = process.env.REACT_APP_API_URL || (isProd ? '' : 'http://localhost:5001/api');
export const WS_URL = process.env.REACT_APP_WS_URL || (isProd ? '' : 'http://localhost:5001');
