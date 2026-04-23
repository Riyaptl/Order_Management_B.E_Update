const baseURL = process.env.REACT_APP_API_BASE_URL;
const API_BASE_URL = `${baseURL}/shop`;

export const fetchShopsByArea = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/route/all`, {
    method: "POST",
    credentials: 'include',
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch shops");
  }

  return await response.json();
};

export const fetchShopDetails = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/details/${id}`, {
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch shops");
  }

  return await response.json();
};

export const fetchShopOrders = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch shop orders");
  }

  return await response.json();
};

export const deleteShopService = async (ids) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/delete/one`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ids),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete shop");
  }

  return await response.json();
};

export const blacklistShopService = async (ids) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/blacklist/one`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ids),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete shop");
  }

  return await response.json();
};

export const updateShopService = async (id, updates) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to update shop");
  }

  return await response.json();
};

export const createShopService = async (updates) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to update shop");
  }

  return await response.json();
};

export const shiftShopService = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/shift/area`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to shift shop");
  }

  return await response.json();
};

export const surveyShopService = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/survey/multiple`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to update shop");
  }

  return await response.json();
};


export const exportShopService = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${API_BASE_URL}/csv/export`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errData = await response.json();
    
    throw new Error(errData.message || "Failed to export CSV");
  }

  return await response.blob();
};


export const importCSV = async ({ areaId, file }) => {
   const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/csv/import/${areaId}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData
  });

  if (!response.ok) {
    const errData = await response.json();
    
    throw new Error(errData.message || "Failed to export CSV");
  }

  return response.json();
};
