import React, { useState, useEffect } from "react";
import { fetchAreas } from "../slice/areaSlice";
import { useDispatch, useSelector } from "react-redux";

const ShiftAreaComponent = ({ isOpen, onClose, onShift, shopId, fromAreaId }) => {
    const dispatch = useDispatch();
    const { areas } = useSelector((state) => state.area);
    const [toAreaId, setToAreaId] = useState("");

    useEffect(() => {
        dispatch(fetchAreas({}));
    }, [dispatch]);

    const handleSubmit = () => {
        if (!toAreaId || toAreaId === fromAreaId) { 
            alert("Please select a different area to shift.");
            return;
        }
        onShift({ shopId, fromAreaId, toAreaId });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Shift Shop to Another Route</h2>
                <div className="w-full overflow-hidden">
                    <label className="block mb-1 text-md font-medium text-gray-700">Select Route</label>
                    <select
                        className="w-full border border-gray-300 rounded px-3 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-600"
                        value={toAreaId}
                        onChange={(e) => setToAreaId(e.target.value)}
                    >
                        <option value="">Select Area</option>
                        {areas.map((area) => (
                            <option key={area._id} value={area._id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition text-sm sm:text-base"
                    >
                        Shift
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition text-sm sm:text-base"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


export default ShiftAreaComponent;
