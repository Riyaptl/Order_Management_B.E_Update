const baseURL = process.env.REACT_APP_API_BASE_URL;
const AREA_API = `${baseURL}/area`;

export const fetchAreasService = async (dist_data) => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${AREA_API}/names/all`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
    body: JSON.stringify(dist_data)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to fetch routes");
  }

  const data = await res.json();
  return data;
};

export const fetchAllAreasService = async ({page, dist_username}) => {
    
  console.log(page, dist_username);
  
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const res = await fetch(`${AREA_API}/admin?page=${page}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({dist_username})
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to fetch routes");
  }

  const data = await res.json();
  return data;
};

 
export const deleteAreaService = async (id) => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${AREA_API}/delete/one/${id}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to delete route");
  }

  const data = await res.json();
  return data;
};

export const updateAreaService = async ({id, name, areas, distributor, city}) => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${AREA_API}/${id}`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({name, areas, distributor, city})
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to update route");
  }

  const data = await res.json();
  return data;
};

export const createAreaService = async (area) => {
    
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");
  
  const res = await fetch(`${AREA_API}/`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(area)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to create route");
  }

  const data = await res.json();
  return data;
};


export const exportAreaService = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Auth token not found");

  const response = await fetch(`${AREA_API}/csv/export`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json();
    
    throw new Error(errData.message || "Failed to export CSV");
  }

  return await response.blob();
};