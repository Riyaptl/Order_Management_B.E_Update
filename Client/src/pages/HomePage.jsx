import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavbarComponents";
import { fetchInventory, updateInventory } from "../slice/invetorySlice";
import { FaEdit, FaTrash } from "react-icons/fa";
import { createAnnouncement, deleteAnnouncement, fetchAnnouncement, replaceAnnouncement } from "../slice/announcementSlice";

export default function HomePage() {
  const { role } = useSelector((state) => state.auth);
  const { inventory } = useSelector((state) => state.inventory);
  const { announcement } = useSelector((state) => state.announcement);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isME = role === "me";
  const isAdmin = role === "admin";
  const isDist = role === "distributor";
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnnouncementList, setShowAnnouncementList] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [editRemark, setEditRemark] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [replaceText, setReplaceText] = useState({});


  const [form, setForm] = useState({
    status: "",
    size: "",
    remarks: ""
  });

  useEffect(() => {
    dispatch(fetchInventory());
    dispatch(fetchAnnouncement());
  }, [dispatch]);

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setForm({
      status: item.status,
      size: item.size,
      remarks: item.remarks || ""
    });
    setOpenModal(true);
  };

  const handleUpdate = async () => {
    await dispatch(
      updateInventory({
        id: selectedItem._id,
        ...form
      })
    );
    setOpenModal(false);
    dispatch(fetchInventory());
  };

  const handleCreate = async () => {
    await dispatch(createAnnouncement({ remarks: newRemark }));
    window.location.reload();
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmDelete) return;
    try {
      await dispatch(deleteAnnouncement(id));
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  }

  const sizeOrder = {
    "50gm": 1,
    "55gm": 2,
    "25gm": 3,
    "28gm": 4,

  };

  const outOfStock = inventory?.filter(
    (item) => item.status === "Out of Stock"
  );

  const runningLow = inventory?.filter(
    (item) => item.status === "Running Low"
  );

  const inStockSorted = inventory
    ?.filter((item) => item.status === "In Stock")
    .sort(
      (a, b) =>
        (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99)
    );

  const sortedInventory = [
    ...outOfStock,
    ...runningLow,
    ...inStockSorted
  ];

  const filteredInventory = sortedInventory?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-end md:justify-center mb-4">
        <Navbar />
      </div>
      <div className="max-w-5xl mx-auto  p-6 bg-white rounded shadow">

        {/* Announcement Section */}
        {announcement?.length > 0 && (
          <div className="max-w-5xl mx-auto mb-4 overflow-hidden">
            <div className="bg-red-50 border border-red-300 rounded-lg shadow-sm px-4 py-2">

              <div className="overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">

                  {[...announcement, ...announcement].map((a, index) => (
                    <span key={index} className="mx-3 text-red-700 text-lg font-semibold">
                      {a.remarks}
                    </span>
                  ))}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Announcement Actions */}
        {isAdmin && (
          <div className="max-w-5xl mx-auto mb-2">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAnnouncementList(true)}
                className="text-xs px-2.5 py-1 rounded border border-amber-600 text-amber-700 hover:bg-amber-50 transition"
              >
                View
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="text-xs px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        )}


        <h1 className="text-3xl font-bold text-center text-amber-700 mb-6">
          Welcome to Dumyum Chocolates
        </h1>

        {!isDist && (
          <div className="flex justify-center mt-10 mb-6 space-x-4">
            <button
              onClick={() => navigate("/shops_list")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold py-2 px-6 rounded-lg shadow-md transition min-w-[150px]"
            >
              Place Orders
            </button>

            <button
              onClick={() => navigate("/SR-report")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold py-2 px-6 rounded-lg shadow-md transition min-w-[150px]"
            >
              Performance Report
            </button>
          </div>
        )}

        {/* Inventory Section */}

        <h2 className="text-2xl font-bold mt-7 mb-4 text-center text-amber-700">Inventory Updates</h2>

        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-600"
        />

        <div className="space-y-3">
          {filteredInventory?.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center border px-3 py-2 rounded text-md"
            >
              <div className="leading-tight">
                <p
                  className={`font-semibold ${item.status === "Out of Stock"
                    ? "text-red-600"
                    : item.status === "Running Low"
                      ? "text-yellow-600"
                      : "text-green-800"
                    }`}
                >
                  {item.name}
                </p>

                <p className="text-sm text-gray-600">
                  {item.size} • {item.status} • {item.updatedAt && new Date(item.updatedAt).toLocaleDateString("en-GB")}
                </p>

                {item.remarks && (
                  <p className="text-md text-gray-600">
                    Remarks: {item.remarks}
                  </p>
                )}
              </div>

              {isAdmin && <button
                onClick={() => openUpdateModal(item)}
                className="bg-amber-600 text-white text-sm px-3 py-1 rounded hover:bg-amber-700 whitespace-nowrap"
              >
                Update
              </button>}
            </div>
          ))}
        </div>



        {/* create announcement */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-4 rounded w-80 space-y-3">
              <h3 className="font-semibold text-sm">New Announcement</h3>

              <input
                className="border w-full px-2 py-1 text-sm"
                placeholder="Remarks"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-sm px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="text-sm px-3 py-1 bg-amber-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show all announcements on update */}
        {showAnnouncementList && !editAnnouncement && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded w-full max-w-md space-y-3">
              <h3 className="font-semibold text-sm">All Announcements</h3>

              <div className="space-y-2">
                {announcement?.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between border px-3 py-2 rounded"
                  >
                    {/* Remarks */}
                    <span className="text-sm text-gray-700 truncate pr-2">
                      {a.remarks}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditAnnouncement(a);
                          setEditRemark(a.remarks);
                        }}
                        title="Edit"
                        className="p-1.5 rounded border border-amber-600 text-amber-700 hover:bg-amber-50 transition"
                      >
                        <FaEdit size={12} />
                      </button>

                      <button
                        onClick={() => handleDelete(a._id)}
                        title="Delete"
                        className="p-1.5 rounded border border-red-600 text-red-600 hover:bg-red-50 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAnnouncementList(false)}
                  className="text-sm px-3 py-1 border rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* replace announcement */}
        {editAnnouncement && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded w-80 space-y-3">
              <h3 className="font-semibold text-sm">Edit Announcement</h3>

              <input
                className="border w-full px-2 py-1 text-sm"
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditAnnouncement(null)}
                  className="text-sm px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await dispatch(
                      replaceAnnouncement({
                        id: editAnnouncement._id,
                        remarks: editRemark
                      })
                    );
                    window.location.reload();
                  }}
                  className="text-sm px-3 py-1 bg-amber-600 text-white rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update inventory */}
        {openModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Update Inventory</h3>

              <select
                className="w-full border p-2 mb-3"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="">Select Status</option>
                <option>In Stock</option>
                <option>Running Low</option>
                <option>Out of Stock</option>
              </select>

              <select
                className="w-full border p-2 mb-3"
                value={form.size}
                onChange={(e) =>
                  setForm({ ...form, size: e.target.value })
                }
              >
                <option value="">Select Size</option>
                <option>25gm</option>
                <option>28gm</option>
                <option>50gm</option>
                <option>55gm</option>
              </select>

              <input
                type="text"
                placeholder="Remarks"
                className="w-full border p-2 mb-4"
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
              />

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="bg-amber-600 text-white px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}