import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOrders, deleteOrder, exportOrdersCsv, getOrdersSR, statusOrder, getOrdersDate } from "../slice/orderSlice"; // You'll create these in orderSlice.js
import toast from "react-hot-toast";
import Navbar from "../components/NavbarComponents";
import { fetchAreas } from "../slice/areaSlice";
import { FaChevronLeft, FaChevronRight, FaTrash, FaBan, FaEdit, FaUndoAlt, FaReceipt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { logout } from "../slice/authSlice";
import { getSRDetails } from "../slice/userSlice";
import { blacklistShop, getShopOrders } from "../slice/shopSlice";
import { fetchCities } from "../slice/citySlice";

export default function OrdersListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { areas } = useSelector((state) => state.area);
    const { cities } = useSelector((state) => state.city);
    const { shopOrders } = useSelector((state) => state.shop);
    const { user, role } = useSelector((state) => state.auth);
    const { orders, loading, error } = useSelector((state) => state.order);
    const { srs } = useSelector(state => state.user);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCompleteData, setShowCompleteData] = useState(false);
    const [placedOrdersTab, setPlacedOrdersTab] = useState(true);
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedSR, setSelectedSR] = useState("");
    const [calls, setCalls] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showOrders, setShowOrders] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [options, setOptions] = useState([]);
    const [month, setMonth] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [srSearchTerm, setSRSearchTerm] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    
    const isSR = role === 'sr'
    const isTL = role === 'tl';
    const isAdmin = role === 'admin';
    const isDistributor = role === "distributor"
    
    useEffect(() => {
        const now = new Date();
        const months = [];

        for (let i = 1; i <= 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = date.toLocaleString("default", { month: "long" });
            months.push(label);
        }

        setOptions(months);
    }, []);


    useEffect(() => {
        setCurrentPage(1)
    }, [dispatch, placedOrdersTab])

    useEffect(() => {
        setCalls(orders ? orders.length : 0)
    }, [orders, dispatch])

    useEffect(() => {
        if (isSR && user) {
            setSelectedSR(user)
        }
        if (isAdmin || isTL) {
            dispatch(getSRDetails());
        }
    }, [role, user, dispatch])

    useEffect(() => {
        const data = {}
        if (isDistributor) {
            data["dist_username"] = user
        }
        dispatch(fetchAreas(data));
        dispatch(fetchCities())
    }, [dispatch]);

    useEffect(() => {
        const ordersFunc = async () => {
            await fetchOrders();
        }
        ordersFunc()
    }, [dispatch, currentPage, selectedArea, selectedSR, selectedDate, selectedCity, showCompleteData, placedOrdersTab, month]);

    const fetchOrders = async () => {
        try {
            if (selectedArea) {
                const res = await dispatch(getOrders({
                    areaId: selectedArea,
                    page: currentPage,
                    date: selectedDate,
                    completeData: showCompleteData,
                    placedOrders: placedOrdersTab,
                    month
                })).unwrap();
                setTotalPages(res.totalPages);
                setShowOrders(true)
            }
            else if (selectedCity) {
                const res = await dispatch(getOrders({
                    city: selectedCity,
                    page: currentPage,
                    date: selectedDate,
                    completeData: showCompleteData,
                    placedOrders: placedOrdersTab,
                    month
                })).unwrap();
                setTotalPages(res.totalPages);
                setShowOrders(true)
            }
            else if (selectedDate) {
                const data = {
                    username: selectedSR,
                    page: currentPage,
                    date: selectedDate,
                    placedOrders: placedOrdersTab,
                }
                if (role === 'distributor') {
                    data.dist = user
                }
                const res = await dispatch(getOrdersDate(data)).unwrap();
                setTotalPages(res.totalPages);
                setShowOrders(true)
            }
            else if (selectedSR) {
                const res = await dispatch(getOrdersSR({
                    username: selectedSR,
                    page: currentPage,
                    date: selectedDate,
                    completeData: showCompleteData,
                    placedOrders: placedOrdersTab,
                    month
                })).unwrap();
                setTotalPages(res.totalPages);
                setShowOrders(true)
            } else {
                setShowOrders(false)
            }
        } catch (err) {
            toast.error(err.message || "Falied to fetch orders");
        }
    };


    const handleRefresh = async () => {
        await fetchOrders()
    }

    const handleDelete = (orderId) => {
        try {
            if (window.confirm("Are you sure you want to delete this order?")) {
                const res = dispatch(deleteOrder(orderId)).unwrap()
                toast.success(res.message || "Order deleted successfully")
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete order");
        }
    };

    const handleBlacklist = async (id) => {
        if (window.confirm("Are you sure you want to blacklist this shop?")) {
            try {
                const res = await dispatch(blacklistShop({ id })).unwrap();
                toast.success(res.message)
            } catch (err) {
                toast.error(err.message || "Could not blacklist shop")
            }
        }
    };

    const handleExportCsv = async () => {
        if (!showOrders) {
            toast.error("Please select Route, SR or Date first");
            return;
        }
        try {
            let blob
            if (selectedArea) {
                blob = await dispatch(exportOrdersCsv({
                    areaId: selectedArea,
                    completeData: showCompleteData,
                    placedOrders: placedOrdersTab,
                })).unwrap();
            }
            if (selectedSR || selectedDate) {
                blob = await dispatch(exportOrdersCsv({
                    username: selectedSR,
                    completeData: showCompleteData,
                    placedOrders: placedOrdersTab,
                    date: selectedDate
                })).unwrap();
            }
            // Create a link to download the CSV file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Filename with current date for uniqueness
            const dateStr = new Date().toISOString().slice(0, 10);
            link.download = `orders_export_${dateStr}.csv`;

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("CSV Export successful");
        } catch (error) {
            toast.error("Failed to export CSV");
        }
    };

    const handleShowHistory = (id) => {
        try {
            dispatch(getShopOrders(id))
            setShowHistory(true)
        } catch (error) {
            toast.error(error || "Failed to fetch orders");
        }
    }

    const productsList = [
        "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g",
        "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
        "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g",
        "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
        "Intense Coffee 25g", "Toxic Coffee 25g", "Gift box",
        "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
    ];

    const totalList = [
        "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g", "Gift box",
        "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
    ];


    const now = new Date();
    const monthName = now.toLocaleString("default", { month: "long" });

    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    const trimmedSRSearchTerm = srSearchTerm.trim().toLowerCase();
    const filteredOrders = orders.filter((order) =>
        order.shopId.name.toLowerCase().includes(trimmedSearchTerm) &&
        order.placedBy?.toLowerCase().includes(trimmedSRSearchTerm)
    );

    return (
        <div className="p-4">
            <div className="flex justify-end md:justify-center mb-8">
                <Navbar />
            </div>
            <div className="flex items-center justify-between px-6 mt-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-semibold text-amber-700">Orders List</h2>
                </div>
            </div>
            {!isDistributor && (<div className="flex justify-center mb-6 mt-6 space-x-4">
                <button
                    onClick={() => setPlacedOrdersTab(true)}
                    className={`px-4 py-2 rounded-t-md font-medium text-md ${placedOrdersTab ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                >
                    Order Placed
                </button>
                <button
                    onClick={() => setPlacedOrdersTab(false)}
                    className={`px-4 py-2 rounded-t-md font-medium text-md ${!placedOrdersTab ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                >
                    No Orders
                </button>
            </div>)}

            <div className="flex flex-col md:flex-row md:items-end md:flex-wrap gap-4 mt-4 mb-4">

                {/* City Selector */}
                {!isDistributor && 
                <div className="w-full md:w-auto">
                    <label className="block text-lg font-medium text-amber-700 mb-2">Select City</label>
                    <select
                        value={selectedCity}
                        onChange={(e) => {
                            setSelectedCity(e.target.value);
                            setSelectedArea("")
                            setSelectedSR("");
                        }}
                        className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-md"
                    >
                        <option value="">-- Select City --</option>
                        {cities.map((city) => (
                            <option key={city._id} value={city._id}>
                                {city.name}
                            </option>
                        ))}
                    </select>
                </div>
                }
                <div className="w-full md:w-auto">
                    <label className="block text-lg font-medium text-amber-700 mb-2">Select Route</label>
                    <select
                        value={selectedArea}
                        onChange={(e) => {
                            setSelectedArea(e.target.value);
                            setSelectedCity("")
                            setSelectedSR("");
                        }}
                        className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-md"
                    >
                        <option value="">-- Select Route --</option>
                        {areas.map((area) => (
                            <option key={area._id} value={area._id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* )} */}

                {/* SR Selector */}
                {(isAdmin || isTL) && (
                    <div className="w-full md:w-auto">
                        <label className="block text-lg font-medium text-amber-700 mb-2">Select SR</label>
                        <select
                            value={selectedSR}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "old") {
                                    // setOld(true);
                                    setSelectedSR("old");
                                    setSelectedArea("");
                                } else {
                                    // setOld(false);
                                    setSelectedSR(value);
                                    setSelectedArea("");
                                }
                            }}
                            className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-md"
                        >
                            <option value="">-- Select SR --</option>
                            {srs.map((sr) => (
                                <option key={sr._id} value={sr.username}>
                                    {sr.username}
                                </option>
                            ))}
                            <option value="old">Ex SRs</option>
                        </select>

                    </div>
                )}

                {/* Date Selector */}
                <div className="w-full md:w-auto">
                    <label className="block text-lg font-medium text-amber-700 mb-2">Select Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedArea("");
                            setMonth("")
                            setShowCompleteData(false)
                        }}
                        className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-md"
                    />
                </div>

                {/* Month selector */}
                {(selectedArea || selectedSR || selectedCity) && <div className="flex flex-col">
                    <label className="text-lg font-medium text-amber-700 mb-1">Select Month</label>
                    <select
                        name="month"
                        value={month}
                        onChange={(e) => {
                            setMonth(e.target.value)
                            setSelectedDate("");
                            setShowCompleteData(false)
                        }}
                        className="border rounded px-3 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Select Month</option>
                        {options.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>}

                {/* Toggle */}
                {(showOrders && !selectedDate && !month) && (
                    <div className="flex flex-col w-full md:w-auto">
                        <label htmlFor="completeData" className="text-lg font-medium text-amber-700 mb-1">
                            Show {monthName} Month's Data
                        </label>
                        <label htmlFor="completeData" className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="completeData"
                                checked={showCompleteData}
                                onChange={() => setShowCompleteData((prev) => !prev)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-amber-600 transition-all duration-300"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                        </label>
                    </div>
                )}

                {/* Refresh Button */}
                {showOrders && role !== "sr" && (
                    <div className="w-full md:w-auto">
                        <button
                            onClick={handleRefresh}
                            className="w-full px-4 py-2 bg-amber-600 text-white text-md rounded hover:bg-amber-700 transition mt-2 md:mt-0"
                        >
                            Refresh
                        </button>
                    </div>

                )}
                {showOrders && (
                    <div className="w-full md:w-auto">
                        <h1
                            className="w-full px-4 py-2 bg-amber-600 text-white text-md rounded hover:bg-amber-700 transition mt-2 md:mt-0 text-center"
                        >
                            Calls: <span>{calls}</span>
                        </h1>
                    </div>
                )}

                {/* CSV Export Button pushed to right on desktop */}
                {showOrders && (
                    <div className="w-full md:w-auto md:ml-auto flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleExportCsv}
                            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white text-md rounded hover:bg-green-700 transition"
                        >
                            CSV Export
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search shop name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                    type="text"
                    placeholder="Search by SR / Distributor..."
                    value={srSearchTerm}
                    onChange={(e) => setSRSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            {!error && !loading && orders.length == 0 && (<p className="text-center text-gray-500">No records to show</p>)}
            {showOrders && loading && <p className="mt-4">Loading orders...</p>}
            {selectedArea && error && (
                <p className="mt-4 text-red-600">Error: {error}</p>
            )}
            {showOrders && !loading && orders.length > 0 && (
                <div className="overflow-x-auto mt-8">
                    <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 text-left min-w-[30px]">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedOrders(orders.map((order) => order._id));
                                            } else {
                                                setSelectedOrders([]);
                                            }
                                        }}
                                        checked={selectedOrders.length === orders.length}
                                    />
                                </th>
                                <th className="border p-2 text-left min-w-[100px]">Type</th>
                                <th className="border p-2 text-left min-w-[200px]">Shop Name</th>
                                <th className="border p-2 text-left min-w-[200px]">Shop Address</th>
                                <th className="border p-2 text-left min-w-[180px]">Contact Number</th>
                                <th className="border p-2 text-left min-w-[200px]">Address Link</th>
                                <th className="border p-2 text-left min-w-[200px]">Route</th>
                                {placedOrdersTab && (
                                    <>
                                        <th className="border p-2 text-left min-w-[200px]">Payment Terms</th>
                                        <th className="border p-2 text-left min-w-[200px]">Order Placed By</th>
                                    </>
                                )}
                                <th className="border p-2 text-left min-w-[200px]">Remarks</th>
                                {isSR && <th className="border p-2 text-left min-w-[150px]">SR</th>}
                                {!isSR && <th className="border p-2 text-left min-w-[150px]">SR / Distributor</th>}
                                {/* {placedOrdersTab && (<> {productsList.map((key) => (
                                    <th
                                        key={key}
                                        className="border p-2 text-left min-w-[180px]"
                                    >
                                        {key}
                                    </th>
                                ))}
                                    {totalList.map((key) => (
                                        <th
                                            key={key}
                                            className="border p-2 text-left min-w-[180px] text-amber-700"
                                        >
                                            {key}
                                        </th>
                                    ))} 
                                    <th className="border p-2 text-left min-w-[180px] text-red-700">Total</th>
                                    
                                </>)} */}
                                <th className="border p-2 text-left min-w-[200px]">Created At</th>
                                {!isDistributor && !placedOrdersTab && (
                                    <th className="border p-2 text-left min-w-[250px]">Location Link</th>
                                )}
                                {placedOrdersTab && <th className="border p-2 text-left min-w-[180px] text-red-700">Total</th>}
                                <th className="border p-2 text-left min-w-[200px]">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.map((order) => (
                                <>
                                    {/* {console.log('in table', order)} */}
                                    <tr key={order._id} className="hover:bg-gray-50" onClick={(e) => {
                                        if (placedOrdersTab && (e.target.closest("td")?.cellIndex === 2 || e.target.closest("td")?.cellIndex === 3)) {
                                            setSelectedShop(order);
                                        }
                                    }}>
                                        <td className="border p-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order._id)}
                                                onChange={() => {
                                                    setSelectedOrders((prev) =>
                                                        prev.includes(order._id)
                                                            ? prev.filter((id) => id !== order._id)
                                                            : [...prev, order._id]
                                                    );
                                                }}
                                            />
                                        </td>
                                        <td className="border p-2">{order.type}</td>
                                        <td
                                            className={`border p-2 cursor-pointer
                                                ${order.shopId.repeat ? "text-green-700 font-semibold" : ""}
                                                ${order.shopId.blacklisted ? "text-red-700 font-bold" : ""}
                                            `}
                                        >
                                            {order.shopId.name}
                                        </td>
                                        <td className="border p-2 max-w-[150px] overflow-x-auto whitespace-nowrap">
                                            <div className="overflow-x-auto max-w-[350px]">
                                                <span
                                                    className="inline-block truncate"
                                                    title={order.shopId.address}
                                                >
                                                    {order.shopId.address}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border p-2">{order.shopId.contactNumber}</td>
                                        <td className="border p-2 break-all">
                                            {order.shopId.addressLink ? (
                                                <a
                                                    href={order.shopId.addressLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline"
                                                >
                                                    View Location
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="border p-2">{order.shopId.areaName}</td>
                                        {placedOrdersTab && <td className="border p-2">{order.paymentTerms}</td>}
                                        {placedOrdersTab && <td className="border p-2">{order.orderPlacedBy}</td>}
                                        <td className="border p-2 max-w-[150px] overflow-x-auto whitespace-nowrap">
                                            <div className="overflow-x-auto max-w-[350px]">
                                                <span
                                                    className="inline-block truncate"
                                                    title={order.remarks}
                                                >
                                                    {order.remarks}
                                                </span>
                                            </div>
                                        </td>
                                        {isSR && <td className="border p-2">{order.placedBy}</td>}
                                        {!isSR && <td className="border p-2">{order.placedBy}</td>}
                                        {/* {placedOrdersTab && (<> {productsList.map((key) => (
                                            <td key={key} className="border p-2">
                                                {order.products && order.products[key] !== undefined
                                                    ? order.products[key]
                                                    : "-"}
                                            </td>
                                        ))}
                                            {totalList.map((key) => (
                                                <td key={key} className="border p-2">
                                                    {order.total && order.total[key] !== undefined
                                                        ? order.total[key]
                                                        : "-"}

                                                </td>
                                            ))}
                                            <td className="border p-2 font-semibold">
                                                {order.total
                                                    ? totalList.reduce((sum, key) => {
                                                        const val = order.total[key];
                                                        return sum + (typeof val === "number" ? val : 0);
                                                    }, 0)
                                                    : "-"}
                                            </td>

                                        </>)} */}
                                        <td className="border p-2">
                                            {(() => {
                                                const date = new Date(order.createdAt);
                                                const day = String(date.getDate()).padStart(2, "0");
                                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                                const year = date.getFullYear();
                                                const hours = String(date.getHours()).padStart(2, "0");
                                                const minutes = String(date.getMinutes()).padStart(2, "0");

                                                return `${day}/${month}/${year} ${hours}:${minutes}`;
                                            })()}
                                        </td>
                                        {!isDistributor && !placedOrdersTab && (
                                            <td className="border p-2 max-w-[250px] overflow-x-auto">
                                                {order.location?.latitude && order.location?.longitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline break-all"
                                                    >
                                                        View Location
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </td>
                                        )}
                                        {placedOrdersTab && <td className="border p-2 font-semibold">
                                            {order.total
                                                ? totalList.reduce((sum, key) => {
                                                    const val = order.total[key];
                                                    return sum + (typeof val === "number" ? val : 0);
                                                }, 0)
                                                : "-"}
                                        </td>}
    
                                   
                                        <td className="border p-2">
                                            {(!isSR && !isTL) && (
                                                <>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(order._id)}
                                                            className="text-red-500 hover:text-red-600 p-2 text-xl"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleBlacklist(order.shopId._id)}
                                                        className="text-black-600 hover:text-black-800 text-xl p-2"
                                                        title="Blacklist"
                                                    >
                                                        <FaBan />
                                                    </button>
                
                                                </>
                                            )}

                                            

                                            <button
                                                onClick={() => handleShowHistory(order.shopId._id)}
                                                className="text-amber-600 hover:text-amber-800 text-xl p-2"
                                                title="Show Orders"
                                            >
                                                <FaReceipt />
                                            </button>
                                        </td>

                                    </tr>
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showOrders && selectedShop && placedOrdersTab && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4 text-amber-700 text-center">Order Details</h2>

                        <div className="mb-4">
                            <h3 className="font-semibold text-lg mb-2 text-gray-700">Products:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {productsList.map((product) => (
                                    <div
                                        key={product}
                                        className="border rounded p-2 flex justify-between items-center"
                                    >
                                        <span>{product}</span>
                                        <span className="font-medium">{selectedShop.products[product] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-semibold text-lg mb-2 text-gray-700">Total Summary:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {totalList.map((item) => (
                                    <div
                                        key={item}
                                        className="border rounded p-2 flex justify-between items-center px-3"
                                    >
                                        <span>{item}</span>
                                        <span className="font-medium">{selectedShop.total[item] || 0}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border rounded p-3 mt-4 flex justify-between items-center bg-amber-100 font-semibold text-amber-800 mb-4">
                                <span>Total</span>
                                <span>
                                    {totalList.reduce(
                                        (sum, key) => sum + (Number(selectedShop.total[key]) || 0),
                                        0
                                    )}
                                </span>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Remarks:</h3>
                                <div className="overflow-x-auto max-w-[350px]">
                                    <span
                                        className="inline-block truncate"
                                        title={selectedShop.remarks}
                                    >
                                        {selectedShop.remarks}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedShop(null)}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOrders && (<div className="flex justify-center items-center mt-4 space-x-4">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    <FaChevronLeft />
                </button>
                <span className="text-md text-gray-700">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    <FaChevronRight />
                </button>
            </div>)}

            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative bg-white max-h-[90vh] w-[95%] max-w-[95vw] overflow-auto rounded-lg shadow-lg p-6">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowHistory(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
                            Order History
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="border p-2 text-left min-w-[150px]">Date</th>
                                        <th className="border p-2 text-left min-w-[150px]">Type</th>
                                        <th className="border p-2 text-left min-w-[150px]">Updated At</th>
                                        <th className="border p-2 text-left min-w-[150px]">Comment</th>
                                        <th className="border p-2 text-left min-w-[150px]">Payment Terms</th>
                                        <th className="border p-2 text-left min-w-[150px]">Order Placed By</th>
                                        <th className="border p-2 text-left min-w-[150px]">SR</th>
                                        {productsList.map((key) => (
                                            <th key={key} className="border p-2 text-left min-w-[150px]">
                                                {key}
                                            </th>
                                        ))}
                                        {totalList.map((key) => (
                                            <th key={key} className="border p-2 text-left min-w-[150px]  text-amber-700">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {shopOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="border p-2">
                                                {(() => {
                                                    const date = new Date(order.createdAt);
                                                    const day = String(date.getDate()).padStart(2, "0");
                                                    const month = String(date.getMonth() + 1).padStart(2, "0");
                                                    const year = date.getFullYear();
                                                    const hours = String(date.getHours()).padStart(2, "0");
                                                    const minutes = String(date.getMinutes()).padStart(2, "0");
                                                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                                                })()}
                                            </td>
                                            <td className="border p-2">{order.type}</td>
                                            
                                            {order.statusUpdatedAt ? <td className="border p-2">
                                                {(() => {
                                                    const date = new Date(order.createdAt);
                                                    const day = String(date.getDate()).padStart(2, "0");
                                                    const month = String(date.getMonth() + 1).padStart(2, "0");
                                                    const year = date.getFullYear();
                                                    const hours = String(date.getHours()).padStart(2, "0");
                                                    const minutes = String(date.getMinutes()).padStart(2, "0");
                                                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                                                })()}
                                            </td> : '-'}
                                     
                                            <td className="border p-2">{order.paymentTerms}</td>
                                            <td className="border p-2">{order.orderPlacedBy}</td>
                                          
                                            <td className="border p-2">{order.placedBy}</td>
                                            {productsList.map((key) => (
                                                <td key={key} className="border p-2">
                                                    {order.products?.[key] !== undefined ? order.products[key] : "-"}
                                                </td>
                                            ))}
                                            {totalList.map((key) => (
                                                <td key={key} className="border p-2">
                                                    {order.total?.[key] !== undefined ? order.total[key] : "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
