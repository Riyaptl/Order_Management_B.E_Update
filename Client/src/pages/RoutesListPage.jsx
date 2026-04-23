import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAreas, deleteArea, updateArea, createArea, exportCSVArea } from "../slice/areaSlice";
import Navbar from "../components/NavbarComponents";
import toast from "react-hot-toast";
import { FaTrash, FaEdit } from "react-icons/fa";
import RenameRouteComponent from "../components/RenameRouteComponents";
import CreateRouteComponents from "../components/CeateRouteComponents";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const RoutesListPage = () => {
  const dispatch = useDispatch();
  const { allAreas, loading, error } = useSelector((state) => state.area);
  const { dists } = useSelector((state) => state.user);
  const { role } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedRouteName, setSelectedRouteName] = useState("");
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedDistDrop, setSelectedDistDrop] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouteAreas, setSelectedRouteAreas] = useState([]);
  const [distributorSearchTerm, setDistributorSearchTerm] = useState("");
  const isAdmin = role === 'admin'
  const isTL = role === 'tl'

  useEffect(() => {
    const fetchPagedAreas = async () => {
      try {
        const res = await dispatch(fetchAllAreas({page: currentPage, dist_username: selectedDistDrop})).unwrap();
        setTotalPages(res.totalPages);
      } catch (err) {
        toast.error("Failed to fetch routes");
      }
    };
    fetchPagedAreas();
  }, [dispatch, currentPage, selectedDistDrop]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        const res = await dispatch(deleteArea(id)).unwrap();
        toast.success(res.message)
      } catch (err) {
        toast.error(err || "Could not delete route")
      }
    }
  };

  const handleUpdate = async (newName, newRoutes, newDist, newCity) => {
    if (!newName.trim()) {
      toast.error("Route name cannot be empty");
      return;
    }
    try {
      const res = await dispatch(updateArea({ id: selectedRouteId, name: newName, areas: newRoutes, distributor: newDist, city: newCity })).unwrap();
      toast.success(res.message || "Route updated successfully");
      setShowUpdateModal(false);
    } catch (err) {
      toast.error(err || "Could not update route");
    }
  };

  const handleCreate = async ({ name, routes, distributor, city }) => {
    if (!name.trim()) {
      toast.error("Route name cannot be empty");
      return;
    }

    try {
      const res = await dispatch(createArea({ name, areas: routes, distributor, city })).unwrap();
      toast.success(res.message || "Route created successfully");
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err || "Could not create route");
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await dispatch(fetchAllAreas(currentPage)).unwrap();
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error("Failed to fetch routes");
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await dispatch(exportCSVArea()).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `Routes_export_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV Export successful");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  const trimmedDistributorSearchTerm = distributorSearchTerm.trim().toLowerCase();
  const filteredAreas = allAreas.filter((area) =>
    area.name.toLowerCase().includes(trimmedSearchTerm) &&
    area.distributor?.toLowerCase().includes(trimmedDistributorSearchTerm)
  );

  return (
    <div className="p-4">
      <div className="flex justify-end md:justify-center mb-8">
        <Navbar />
      </div>
      <div className="flex justify-center mb-4">
        <h2 className="text-2xl font-semibold text-amber-700">Routes List</h2>
      </div>

      {(isAdmin || isTL) && (
        <div className="flex flex-col md:flex-row justify-end gap-4 mb-4">
          <button onClick={handleRefresh} className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition">Refresh</button>
          <button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition">+ Create Route</button>
          <button onClick={handleExportCsv} className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">CSV Export</button>
        </div>
      )}

        {/* Distributor Selection */}
        <div className="flex flex-col mb-5">
          <select
            value={selectedDistDrop}
            onChange={(e) => setSelectedDistDrop(e.target.value)}
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

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search route name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <input
          type="text"
          placeholder="Search by distributor..."
          value={distributorSearchTerm}
          onChange={(e) => setDistributorSearchTerm(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm md:text-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Sr. No</th>
                <th className="border p-2 text-left">Route Name</th>
                <th className="border p-2 text-left">City</th>
                <th className="border p-2 text-left">Distributor</th>
                <th className="border p-2 text-left">Areas Included</th>
                <th className="border p-2 text-left">Route Created By</th>
                <th className="border p-2 text-left">Route Created At</th>
                <th className="border p-2 text-left">Route Updated By</th>
                <th className="border p-2 text-left">Route Updated At</th>
                {(isAdmin || isTL) && <th className="border p-2 text-left min-w-[120px]">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAreas.map((area, index) => (
                <tr key={area._id} className="hover:bg-gray-50">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2 min-w-[150px]">{area.name}</td>
                  <td className="border p-2 min-w-[150px]">{area.city ? area.city.name : "-"}</td>
                  <td className="border p-2 min-w-[150px]">{area.distributor}</td>
                  <td className="border p-2 min-w-[150px]">{area.areas?.join(", ")}</td>
                  <td className="border p-2 min-w-[150px]">{area.createdBy}</td>
                  <td className="border p-2 min-w-[180px]">{new Date(area.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="border p-2 min-w-[150px]">{area.updatedBy}</td>
                  <td className="border p-2 min-w-[180px]">{new Date(area.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  {(isAdmin || isTL) && (
                    <td className="border p-2 text-center space-x-2 whitespace-nowrap">
                      <button onClick={() => handleDelete(area._id)} className="text-red-600 hover:text-red-800 text-xl p-2" title="Delete">
                        <FaTrash />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRouteId(area._id);
                          setSelectedRouteName(area.name);
                          setSelectedRouteAreas(area.areas || []);
                          setSelectedDist(area.distributor || "");
                          setSelectedCity(area.city?._id || ""); // ✅ IMPORTANT
                          setShowUpdateModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xl p-2"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>

                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RenameRouteComponent
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleUpdate}
        initialName={selectedRouteName}
        initialRoutes={selectedRouteAreas}
        initialDist={selectedDist}
        initialCity={selectedCity}   // ✅ ADD THIS
      />


      <CreateRouteComponents
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      <div className="flex flex-wrap justify-center items-center mt-4 gap-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default RoutesListPage;
