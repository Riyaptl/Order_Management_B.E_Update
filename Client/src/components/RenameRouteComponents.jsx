import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDistDetails } from "../slice/userSlice";
import { fetchCities } from "../slice/citySlice";

const RenameRouteComponent = ({
  isOpen,
  onClose,
  onUpdate,
  initialName,
  initialRoutes,
  initialDist,
  initialCity
}) => {
  const [name, setName] = useState(initialName);
  const [routesText, setRoutesText] = useState(initialRoutes.join(", "));
  const [selectedDist, setSelectedDist] = useState(initialDist);
  const [selectedCity, setSelectedCity] = useState(initialCity);

  const dispatch = useDispatch();
  const { dists } = useSelector((state) => state.user);
  const { cities } = useSelector((state) => state.city);

  useEffect(() => {
    setName(initialName);
    setRoutesText(initialRoutes.join(", "));
    setSelectedDist(initialDist); 
    setSelectedCity(initialCity); 
  }, [initialName, initialRoutes, initialDist, initialCity]);

  useEffect(() => {
    dispatch(getDistDetails());
    dispatch(fetchCities())
  }, [dispatch]);

  if (!isOpen) return null;

  const handleUpdateClick = () => {
    const routesArray = routesText
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    onUpdate(name, routesArray, selectedDist, selectedCity); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Route</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Enter new route name"
        />
        <textarea
          value={routesText}
          onChange={(e) => setRoutesText(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Enter areas separated by commas"
          rows={3}
        />

        {/* Distributor Selection */}
        <div className="flex flex-col mb-5">
          <select
            value={selectedDist}
            onChange={(e) => setSelectedDist(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Select Distributor --</option>
            {dists.map((dist) => (
              <option key={dist._id} value={dist.username}>
                {dist.username}
              </option>
            ))}
          </select>
        </div>

        {/* Distributor Selection */}
        <div className="flex flex-col mb-5">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Select City --</option>
            {cities.map((city) => (
              <option key={city._id} value={city._id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleUpdateClick}
            className="bg-amber-700 text-white px-4 py-2 rounded hover:bg-amber-500 transition"
          >
            Update
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameRouteComponent;
