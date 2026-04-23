const baseURL = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${baseURL}/inventory`;

export const getInventoryService = async () => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/read`, {
    method: "GET",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to fetch inventory");
  }

  const data = await res.json();
  return data;
};

export const updateStatusService = async ({id, formData}) => {
    
  console.log(id, formData);
  
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/status/${id}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
    body: JSON.stringify(formData)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to update inventory");
  }

  const data = await res.json();
  return data;
};
