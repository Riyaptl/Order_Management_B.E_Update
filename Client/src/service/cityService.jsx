const baseURL = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${baseURL}/city`;

export const fetchCitiesService = async () => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/`, {
    method: "GET",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to fetch cities");
  }

  const data = await res.json();
  return data;
};
