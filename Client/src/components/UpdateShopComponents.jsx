import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const UpdateShopComponents = ({ isOpen, onClose, onUpdate, initialData }) => {
  const [currLoc, setCurrLoc] = useState(false);
  const [location, setLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    handler: "",
    address: "",
    contactNumber: "",
    addressLink: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    let updatedData = { ...formData };
    if (location) {
      const { latitude, longitude } = location;
      const addressLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      updatedData.addressLink = addressLink;
    }
    onUpdate(updatedData);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Update Shop Details</h2>

        {["name", "handler", "address"].map((field) => (
          <input
            key={field}
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter ${field}`}
            className="w-full border rounded px-3 py-2 mb-3"
          />
        ))}  
            <input
              name="contactNumber"
              type="text"
              value={formData.contactNumber}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) {
                  handleChange(e);
                }
              }}
              maxLength={10}
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Contact Number"
            />
          <input
            name="addressLink"
            value={formData.addressLink}
             onChange={(e) => {
              handleChange(e);            
              if (e.target.value !== "") { 
                setCurrLoc(false);        
                setLocation(null);       
            }}}
            disabled={currLoc}    
            className={`w-full border rounded px-3 py-2 mb-3 ${
              currLoc ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Enter Address Link"
          />
    
          <label className="flex items-center gap-2 text-md font-medium text-gray-800">
          <input
            type="checkbox"
            checked={currLoc}
            onChange={() => {
              const updatedCurrLoc = !currLoc;
              setCurrLoc(updatedCurrLoc);
              if (updatedCurrLoc && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setLocation({
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                    });
                    toast.success("Live location captured");
                  },
                  (error) => {
                    console.error(error);
                    toast.error("Failed to get location. Please enable GPS.");
                  },
                  {
                    enableHighAccuracy: true, 
                    timeout: 10000,
                    maximumAge: 0,
                  }
                );
              } else {
                setLocation(null); 
              }
            }}
            className="w-4 h-4"
          />
          Capture Current Location
        </label>
        {currLoc && location && (
          <p className="text-green-600 text-sm">📍 Location captured</p>
        )}
        
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleSubmit}
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

export default UpdateShopComponents;
