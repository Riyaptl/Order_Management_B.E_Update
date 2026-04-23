import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getDists,
    createPartner,
    editDist,
    statusDists
} from "../slice/userSlice";
import toast from "react-hot-toast";
import Navbar from "../components/NavbarComponents";

const DistributorsPage = () => {
    const dispatch = useDispatch();
    const { allDists, loading } = useSelector((state) => state.user);

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selectedDist, setSelectedDist] = useState(null);
    const { user, role } = useSelector((state) => state.auth);
     const [searchTerm, setSearchTerm] = useState("");


    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPass: "",
        city: "",
        address: "",
        contact: "",
        gst: "",
        name: ""
    });

    useEffect(() => {
        dispatch(getDists());
    }, [dispatch]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            username: "",
            email: "",
            password: "",
            confirmPass: "",
            city: "",
            address: "",
            contact: "",
            gst: "",
            name: ""
        });
    };

    const handleCreate = () => {
        dispatch(createPartner(form))
            .unwrap()
            .then((res) => {
                toast.success(res.message || "Distributor created");
                setShowCreate(false);
                resetForm();
                dispatch(getDists());
            })
            .catch((err) => toast.error(err.message || "Distributor creation failed"));
    };

    const handleEdit = () => {
        dispatch(editDist({ id: selectedDist._id, data: form }))
            .unwrap()
            .then((res) => {
                toast.success(res.message || "Distributor updated");
                setShowEdit(false);
                setSelectedDist(null);
                dispatch(getDists());
            })
            .catch((err) => toast.error(err.message || "Failed"));
    };

    const toggleActive = (dist) => {
        dispatch(
            statusDists({
                id: dist._id,
                data: { active: !dist.active }
            })
        )
            .unwrap()
            .then((res) => {
                toast.success(res.message);
                dispatch(getDists());
            })
            .catch((err) => toast.error(err.message || "Failed"));
    };


    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredDists = allDists.filter((dist) =>
        dist.username.toLowerCase().includes(trimmedSearchTerm)
    ).sort((a, b) => (a.status === "active" ? -1 : 1));;


    return (
        <div className="p-6">
            <div className="flex justify-end md:justify-center mb-8">
                <Navbar />
            </div>
            <div className="mt-6">
                {/* Heading */}
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-amber-700">
                        Distributors
                    </h2>
                </div>

                <div className="mt-4 flex flex-col md:flex-row justify-end gap-3">
                    {/* Create Distributor */}
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                    >
                        + Create Distributor
                    </button>

                </div>

            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <input
                type="text"
                placeholder="Search Distributor Firm Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            <div className="mt-6">
                {/* width-limited scroll container */}
                <div className="relative max-w-full overflow-x-auto bg-white shadow rounded">

                    <table className="min-w-[1200px] w-full border-collapse text-sm">
                        <thead className="bg-amber-100 sticky top-0 z-10">
                            <tr>
                                <th className="border px-3 py-2 min-w-[160px] text-left">Firm Name</th>
                                <th className="border px-3 py-2 min-w-[140px] text-left">Username</th>
                                <th className="border px-3 py-2 min-w-[130px] text-left">Email</th>
                                <th className="border px-3 py-2 min-w-[260px] text-left">Address</th>
                                <th className="border px-3 py-2 min-w-[120px] text-left">City</th>
                                <th className="border px-3 py-2 min-w-[110px] text-left">GST</th>
                                <th className="border px-3 py-2 min-w-[130px] text-left">Contact</th>
                                <th className="border px-3 py-2 min-w-[110px] text-center">Status</th>
                                <th className="border px-3 py-2 min-w-[180px] text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredDists?.map((d) => (
                                <tr key={d._id} className="hover:bg-amber-50">
                                    <td className="border px-3 py-2 font-medium">{d.username}</td>
                                    <td className="border px-3 py-2">{d.name}</td>
                                    <td className="border px-3 py-2">{d.email}</td>

                                    <td className="border px-3 py-2 min-w-[260px] max-w-[260px]">
                                        <div className="overflow-x-auto whitespace-nowrap text-sm">
                                            {d.address}
                                        </div>
                                    </td>
                                    <td className="border px-3 py-2">{d.city}</td>
                                    <td className="border px-3 py-2">{d.gst}</td>
                                    <td className="border px-3 py-2">{d.contact}</td>
                                    <td className="border px-3 py-2 text-center">
                                        <span
                                            className={`px-2 py-1 text-xs rounded text-white ${d.active ? "bg-green-600" : "bg-gray-400"
                                                }`}
                                        >
                                            {d.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    <td className="border px-3 py-2">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => toggleActive(d)}
                                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                                            >
                                                {d.active ? "Inactivate" : "Activate"}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedDist(d);

                                                    setForm({
                                                        name: d.name || "",
                                                        email: d.email || "",
                                                        city: d.city || "",
                                                        address: d.address || "",
                                                        contact: d.contact || "",
                                                        password: "",
                                                        confirmPass: "",
                                                    });

                                                    setShowEdit(true);
                                                }}
                                                className="px-3 py-1 text-xs bg-amber-600 text-white rounded"
                                            >
                                                Edit
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>



            {showCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Create Distributor</h3>

                        <input
                            name="name"
                            type="text"
                            placeholder="Firm Name*"
                            value={form.name || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <input
                            name="username"
                            type="text"
                            placeholder="Username*"
                            value={form.username || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <input
                            name="address"
                            type="text"
                            placeholder="Address*"
                            value={form.address || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />
                        <input
                            name="city"
                            type="text"
                            placeholder="City*"
                            value={form.city || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <input
                            name="contact"
                            type="text"
                            placeholder="Contact*"
                            value={form.contact || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <input
                            name="gst"
                            type="text"
                            placeholder="GST Number"
                            value={form.gst || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="email"
                            type="text"
                            placeholder="Email Id"
                            value={form.email || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="password"
                            type="password"
                            placeholder="Password*"
                            value={form.password || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <input
                            name="confirmPass"
                            type="password"
                            placeholder="Confirm Password*"
                            value={form.confirmPass || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                            required
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={handleCreate} className="bg-amber-600 text-white px-4 py-2 rounded">
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit Distributor</h3>

                        <input
                            name="name"
                            type="text"
                            placeholder="Username"
                            value={form.name || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="address"
                            type="text"
                            placeholder="Address"
                            value={form.address || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />
                        <input
                            name="city"
                            type="text"
                            placeholder="City"
                            value={form.city || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="contact"
                            type="text"
                            placeholder="Contact"
                            value={form.contact || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="gst"
                            type="text"
                            placeholder="GST Number"
                            value={form.gst || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="email"
                            type="text"
                            placeholder="Email Id"
                            value={form.email || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={form.password || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <input
                            name="confirmPass"
                            type="password"
                            placeholder="Confirm Password"
                            value={form.confirmPass || ""}
                            onChange={handleChange}
                            className="border p-2 rounded w-full mb-3"
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowEdit(false)} className="border px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={handleEdit} className="bg-amber-600 text-white px-4 py-2 rounded">
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DistributorsPage;
