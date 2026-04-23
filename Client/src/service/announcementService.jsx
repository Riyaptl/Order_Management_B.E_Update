const baseURL = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${baseURL}/announcement`;


export const createAnnouncementService = async (formData) => {
      
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/`, {
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
    throw new Error(errText || "Failed to create announcement");
  }

  const data = await res.json();
  return data;
  
};

export const replaceAnnouncementService = async ({id, formData}) => {
      
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/replace/${id}`, {
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
    throw new Error(errText || "Failed to replace announcement");
  }

  const data = await res.json();
  return data;
};

export const deleteAnnouncementService = async (id) => {
      
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${API_BASE}/delete/${id}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to replace announcement");
  }

  const data = await res.json();
  return data;
};

export const getAnnouncementService = async () => {
    
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
    throw new Error(errText || "Failed to fetch announcement");
  }

  const data = await res.json();
  return data;
};

