const baseURL = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${baseURL}/auth`;

export const loginUser = async (data) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Login failed');
  }

  return res.json(); // { token, user }
};

// export const logoutUser = async (data) => {
//   const res = await fetch(`${API_BASE}/logout`, {
//     method: 'POST',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });

//   if (!res.ok) {
//     const msg = await res.text();
//     throw new Error(msg || 'Logout failed');
//   }

//   return res.json(); 
// };

export const sendSignupOtp = async (userData) => {
  const response = await fetch(`${API_BASE}/sendOTP`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to send OTP");
  }

  return response.text(); // returns "OTP sent successfully"
};

export const verifySignupOtp = async (otpData) => {
  const response = await fetch(`${API_BASE}/verifyOTP`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(otpData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OTP verification failed");
  }

  return response.json(); // returns { token }
};

export const signupService = async (otpData) => {
  const response = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(otpData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OTP verification failed");
  }

  return response.json(); // returns { token }
};

export const forgotPassService = async (data) => {
  const response = await fetch(`${API_BASE}/forgotPass`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OTP verification failed");
  }

  return response.json(); 
};

export const resetPassService = async (data) => {
  const response = await fetch(`${API_BASE}/resetPass`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OTP verification failed");
  }

  return response.json(); 
};