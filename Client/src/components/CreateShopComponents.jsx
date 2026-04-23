// src/components/CreateShopComponents.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";

const CreateShopComponents = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    handler: "",
    address: "",
    contactNumber: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = () => {
    const { name, handler, address, contactNumber } = formData;
    if (!name.trim()) return;
    onCreate({ name, handler, address, contactNumber });
    setFormData({ name: "", handler: "", address: "", contactNumber: ""});
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      handler: "",
      address: "",
      contactNumber: "",
    });
    onClose(); // then close the modal
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Shop</h2>
        
        <input
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Shop Name"
        />
        <input
          name="handler"
          type="text"
          value={formData.handler}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Shop handler name"
        />
        <input
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Shop Address"
        />
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
        
        <div className="flex justify-center mt-2 gap-4">
          <button
            onClick={handleCreate}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition"
          >
            Create
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateShopComponents;
