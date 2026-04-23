// DistributorOrderPage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getOrders,
    createOrder,
    statusOrder,
    updateOrder,
    deleteOrder,
    paymentStatusOrder,
    exportPDF
} from "../slice/distributorOrderSlice";
import toast from "react-hot-toast";
import { getDistDetails, getSRDetails } from "../slice/userSlice";
import Navbar from "../components/NavbarComponents";

const DistributorOrderPage = () => {
    const dispatch = useDispatch();

    const { distributorOrders, loading } = useSelector((state) => state.distributorOrder);
    const { dists, srs } = useSelector(state => state.user);
    const { user, role } = useSelector((state) => state.auth);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showDeliveredProducts, setShowDeliveredProducts] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [editPaymentStatusModal, setEditPaymentStatusModal] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showUpdateDispatchModal, setShowUpdateDispatchModal] = useState(false);

    const orderedProductsList = selectedOrder
        ? Object.keys(selectedOrder.products || {})
        : [];
    const [showDistributorDropdown, setShowDistributorDropdown] = useState(false);


    const isAdmin = role === 'admin';
    const isSR = role === 'sr';
    const isDistributor = role === 'distributor';

    const [filters, setFilters] = useState({
        distributor: "",
        placedBy: "",
        dispatchedAt: "",
        dueDate: ""
    });

    const [paymentFormData, setPaymentFormData] = useState({
        paymentStatus: "",
        paymentRemarks: "",
        invoiceNo: "",
        dueOn: ""
    });

    const [createForm, setCreateForm] = useState({
        distributor: "",
        city: "",
        placedBy: "",
        products: {},
        expected_delivery: "",
        orderPlacedBy: "",
        remarks: "",
        address: "",
        contact: ""
    });

    const [statusForm, setStatusForm] = useState({
        status: "",
        canceledReason: "",
        ETD: "",
        delivered_products_same_as_products: false,
        delivered_products: {},
        companyRemarks: "",
    });

    const [dispatchForm, setDispatchForm] = useState({
        ARN: "",
        courier: "",
        boxes: "",
        billAttached: false
    });

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

    const totalsByStatus = useMemo(() => {
        return distributorOrders.reduce(
            (acc, order) => {
                if (!order.total) return acc;

                const orderTotal = totalList.reduce((sum, key) => {
                    const val = order.total[key];
                    return sum + (typeof val === "number" ? val : 0);
                }, 0);

                if (order.status === "pending") {
                    acc.pending += orderTotal;
                }

                if (order.status === "preparing") {
                    acc.preparing += orderTotal;
                }

                return acc;
            },
            { pending: 0, preparing: 0 }
        );
    }, [distributorOrders]);


    useEffect(() => {
        dispatch(getOrders(filters));
    }, [dispatch, filters])

    useEffect(() => {
        dispatch(getDistDetails());
        if (!isSR) {

            dispatch(getSRDetails());
        }
    }, [dispatch]);


    useEffect(() => {
        if (showCreateModal && Array.isArray(dists) && dists.length > 0) {
            setShowDistributorDropdown(true);
        }
    }, [showCreateModal, dists]);

    useEffect(() => {
        if (
            statusForm.delivered_products_same_as_products &&
            selectedOrder
        ) {
            setStatusForm((prev) => ({
                ...prev,
                delivered_products: { ...selectedOrder.products }
            }));
        }
    }, [statusForm.delivered_products_same_as_products, selectedOrder]);

    useEffect(() => {
        if (selectedDelivery) {
            setDispatchForm({
                ARN: selectedDelivery.ARN || "",
                courier: selectedDelivery.courier || "",
                boxes: selectedDelivery.boxes || "",
                billAttached: selectedDelivery.billAttached || false
            });
        }
    }, [selectedDelivery]);


    const handleFilterChange = (e) => {
        const updated = { ...filters, [e.target.name]: e.target.value };
        setFilters(updated);
        dispatch(getOrders(updated));
    };

    const handleCreateChange = (e) => {
        setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    };

    const handleCreateOrder = (e) => {
        e.preventDefault();

        console.log((!isDistributor && !createForm.distributor), (!isDistributor && !createForm.orderPlacedBy));

        if ((!isDistributor && !createForm.distributor) || (!isDistributor && !createForm.orderPlacedBy) || !createForm.city) {
            alert("Required fields are missing");
            return;
        }

        dispatch(createOrder(createForm)).unwrap().then((res) => {
            toast.success(res?.message || "Order created successfully");
            dispatch(getOrders(filters));

        }).catch((err) => {
            toast.error(err?.message || err?.error || "Failed to create order");
        });
        setShowCreateModal(false);
        setCreateForm({
            distributor: "",
            placedBy: "",
            products: {},
            expected_delivery: "",
            orderPlacedBy: "",
            remarks: ""
        });
        setSelectedOrder(null)
    };

    const handleUpdateStatus = ({ ids }) => {
        if (!statusForm.status) {
            alert("Status is required");
            return;
        }

        if ((statusForm.status == "dispatched" || statusForm.status == "partially dispatched") & !statusForm.ETD) {
            alert("ETD is required")
            return
        }

        let finalDeliveredProducts;

        if (statusForm.delivered_products_same_as_products) {
            finalDeliveredProducts = { ...selectedOrder.products };
        } else {
            finalDeliveredProducts = {
                ...selectedOrder.products,
                ...(statusForm.delivered_products || {}),
            };
        }

        const payload = {
            ids: ids,
            status: statusForm.status,
            ETD: statusForm.ETD,
            delivered_products: finalDeliveredProducts,
            same_as_products: statusForm.delivered_products_same_as_products,
            companyRemarks: statusForm.companyRemarks,
        };

        if (statusForm.status === "canceled") {
            payload.canceledReason = statusForm.canceledReason;
        }

        dispatch(statusOrder(payload)).unwrap().then((res) => {

            toast.success(res?.message || "Order status updated successfully!");

            dispatch(getOrders(filters));

        }).catch((err) => {
            toast.error(err?.message || err?.error || "Failed to update status");
        });
        setShowStatusModal(false);
        setEditPaymentStatusModal(false)
        setShowDeliveredProducts(false)
        setStatusForm({
            status: "",
            canceledReason: "",
            ETD: "",
            delivered_products: {}
        });
        setSelectedOrder(null)
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;

        try {
            const res = await dispatch(deleteOrder(orderId)).unwrap();
            toast.success(res?.message || "Order deleted successfully!");
            await dispatch(getOrders(filters));
            setSelectedOrder(null);
        } catch (err) {
            toast.error(err?.message || err?.error || "Failed to delete order");
        }
    };

    const downloadOrder = async (orderId) => {
        try {
            const { blob, filename } = await dispatch(exportPDF(orderId)).unwrap();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename; // ✅ now using backend filename

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);

            setSelectedOrder(null);
        } catch (err) {
            toast.error("Failed to download order");
        }
    };

    const handleUpdateDelivery = async () => {
        if (!selectedOrder || !selectedDelivery) {
            toast.error("Order or delivery not selected");
            return;
        }

        const { ARN, courier, billAttached, boxes } = dispatchForm;

        // 🔒 Validation
        if (!ARN?.trim()) {
            toast.error("ARN is required");
            return;
        }

        // billAttached is boolean → explicitly check
        if (typeof billAttached !== "boolean") {
            toast.error("Please specify whether bill is attached");
            return;
        }

        try {
            const payload = {
                id: selectedOrder._id,
                orderId: selectedDelivery._id,
                ARN: dispatchForm.ARN,
                courier: dispatchForm.courier,
                boxes: dispatchForm.boxes,
                billAttached: dispatchForm.billAttached,
            };

            const res = await dispatch(updateOrder(payload)).unwrap();

            toast.success(res?.message || "Dispatch details updated successfully");

            // Refresh list
            dispatch(getOrders(filters));

        } catch (err) {
            toast.error(err?.message || err?.error || "Failed to update dispatch details");
        }
        finally {
            // Close modal & reset
            setShowUpdateDispatchModal(false);
            setEditPaymentStatusModal(false);
            setShowDeliveredProducts(false);
            setSelectedDelivery(null);
            setSelectedOrder(null)
            setDispatchForm({
                ARN: "",
                courier: "",
                boxes: "",
                billAttached: false,
            });
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        const data = {
            id: selectedOrder._id,
            paymentStatus: paymentFormData.paymentStatus,
            paymentRemarks: paymentFormData.paymentRemarks,
            invoiceNo: paymentFormData.invoiceNo,
            dueOn: paymentFormData.dueOn
        };

        try {
            const response = await dispatch(paymentStatusOrder(data)).unwrap();
            toast.success(response.message || "Payment status updated");
            dispatch(getOrders(filters));

        } catch (error) {
            toast.error(error?.message || "Failed to update payment status");
        } finally {
            // Close modal & reset
            setShowUpdateDispatchModal(false);
            setEditPaymentStatusModal(false);
            setShowDeliveredProducts(false);
            setSelectedDelivery(null);
            setSelectedOrder(null)
            setSelectedOrders([])
            setPaymentFormData({
                paymentStatus: "",
                paymentRemarks: "",
                invoiceNo: "",
                dueOn: ""
            });
        }
    };

    const handleCopyOrder = () => {
        let previousGroup = null;

        let copiedProducts = Object.entries(createForm.products)
            .filter(([_, value]) => value !== "" && Number(value) > 0)
            .map(([key, value]) => {
                // Extract weight type from key (e.g., "50g", "25g", "55g")
                let groupMatch = key.match(/(\d+g)/i);
                let group = groupMatch ? groupMatch[1] : "other"; // gift, combos, etc.

                // Add a blank line when switching groups
                let prefix = previousGroup && previousGroup !== group ? "\n" : "";

                previousGroup = group;

                return `${prefix}${key}: ${value}`;
            })
            .join("\n");

        const total = Object.entries(createForm.products)
            .filter(([_, value]) => value !== "" && Number(value) > 0)
            .reduce((sum, [_, value]) => sum + Number(value), 0);


        const textToCopy = `
  DISTRIBUTOR DETAILS
  ----------------------
  Name: ${createForm.distributor || "-"}
  City: ${createForm.city || "-"}
  Address: ${createForm.address || "-"}
  Contact: ${createForm.contact || "-"}

  ORDER DETAILS
  ----------------------
  ${copiedProducts || "(No products)"}
  Total: ${total || "-"}
  Sales Representative: ${createForm.placedBy || user.username || "-"},
  Expected Date: ${createForm.expected_delivery || "-"},
  Order Placed By: ${createForm.orderPlacedBy || "-"},
  Remarks: ${createForm.remarks || "-"},
    `.trim();

        navigator.clipboard.writeText(textToCopy)
            .then(() => toast.success("Order copied to clipboard"))
            .catch(() => toast.error("Failed to copy"));
    };

    const isBulkUpdate =
        Array.isArray(selectedOrders) && selectedOrders.length > 1;

    const statusColorMap = {
        preparing: "bg-amber-100 text-amber-800",
        dispatched: "bg-green-100 text-green-800",
        "partially dispatched": "bg-purple-100 text-purple-800",
        delivered: "bg-blue-100 text-blue-800",
        canceled: "bg-red-100 text-red-800",
    };

    const paymentStatusColorMap = {
        posted: "bg-amber-100 text-amber-800",
        paid: "bg-green-100 text-green-800",
        "partially paid": "bg-purple-100 text-purple-800",
        due: "bg-red-100 text-red-800",
    };



    return (
        <div className="p-4">
            <div className="flex justify-end md:justify-center mb-8">
                <Navbar />
            </div>
            <div className="mt-6">
                {/* Heading */}
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-amber-700">
                        Distributor Orders List
                    </h2>
                </div>

                <div className="mt-4 flex flex-col md:flex-row justify-end gap-3">
                    {/* Create Order */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                    >
                        + Create Order
                    </button>

                    {/* Update Status */}
                    <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => {
                            if (selectedOrders.length === 0) {
                                toast.error("Please select at least one order");
                                return;
                            }

                            setSelectedOrder(null);
                            setShowDeliveredProducts(false);
                            setShowStatusModal(true);
                        }}
                        className={`w-full md:w-auto px-4 py-2 rounded transition text-white ${selectedOrders.length === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-amber-600 hover:bg-amber-700"
                            }`}
                    >
                        Update Status
                    </button>
                </div>

            </div>


            {/* Filters */}
            {isAdmin &&

                <div className="flex flex-col md:flex-row gap-4 mb-6 mt-6">
                    <select
                        name="distributor"
                        value={filters.distributor}
                        onChange={handleFilterChange}
                        className="border p-2 rounded w-full md:w-auto"
                    >
                        <option value="">Select Distributor</option>
                        <option value="other">Other</option>
                        {dists?.map((d) => (
                            <option key={d._id} value={d.username}>{d.username}</option>
                        ))}
                    </select>

                    <select
                        name="placedBy"
                        value={filters.placedBy}
                        onChange={handleFilterChange}
                        className="border p-2 rounded w-full md:w-auto"
                    >
                        <option value="">Select Placed By</option>
                        {srs?.map((u) => (
                            <option key={u._id} value={u.username}>{u.username}</option>
                        ))}
                    </select>

                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <label className="text-sm font-medium text-gray-700">
                            Dispatch Date
                        </label>
                        <input
                            type="date"
                            name="dispatchedAt"
                            value={filters.dispatchedAt}
                            onChange={handleFilterChange}
                            className="border border-gray-300 px-3 py-2 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <label className="text-sm font-medium text-gray-700">
                            Overdue Before
                        </label>
                        <input
                            type="date"
                            name="dueDate"
                            value={filters.dueDate}
                            onChange={handleFilterChange}
                            className="border border-gray-300 px-3 py-2 rounded-md
               focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>

                </div>
            }

            {isAdmin && <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Pending:</span>
                        <span className="text-md font-bold">{totalsByStatus.pending}</span>
                    </span>

                    <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Under Preparation:</span>
                        <span className="text-md font-bold">{totalsByStatus.preparing}</span>
                    </span>


                </div></>}

            {/* Orders Table */}
            {!loading && distributorOrders?.length > 0 && (
                <div className="overflow-x-auto mt-8">
                    <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 text-left min-w-[30px]">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedOrders(distributorOrders?.map((order) => order._id));
                                            } else {
                                                setSelectedOrders([]);
                                            }
                                        }}
                                        checked={selectedOrders.length === distributorOrders?.length}
                                    />
                                </th>
                                <th className="border p-2 text-left min-w-[200px]">Distributor</th>
                                <th className="border p-2 text-left min-w-[100px]">Status</th>
                                <th className="border p-2 text-left min-w-[100px]">Payment Status</th>
                                <th className="border p-2 text-left min-w-[200px]">City</th>
                                <th className="border p-2 text-left min-w-[200px]">SR/TL</th>
                                <th className="border p-2 text-left min-w-[200px]">Total</th>
                                <th className="border p-2 text-left min-w-[200px]">Order Placed By</th>
                                <th className="border p-2 text-left min-w-[200px]">Expected Date</th>
                                <th className="border p-2 text-left min-w-[200px]">Remarks</th>
                                <th className="border p-2 text-left min-w-[200px]">Order Dispatch Date</th>
                                <th className="border p-2 text-left min-w-[200px]">Delivery Date</th>
                                <th className="border p-2 text-left min-w-[200px]">Delivered / Dispatched Total</th>
                                <th className="border p-2 text-left min-w-[200px]">Company Remarks</th>
                                <th className="border p-2 text-left min-w-[200px]">Delivered On</th>
                                <th className="border p-2 text-left min-w-[200px]">Cancelled Reason</th>
                                <th className="border p-2 text-left min-w-[200px]">Status Modified By</th>
                                <th className="border p-2 text-left min-w-[200px]">Status Modified At</th>
                                <th className="border p-2 text-left min-w-[200px]">Created At</th>
                                <th className="border p-2 text-left min-w-[200px]">Created By</th>
                                <th className="border p-2 text-left min-w-[200px]">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {distributorOrders.map((order) => (
                                <>
                                    {/* {console.log('in table', order)} */}
                                    <tr key={order._id} className="hover:bg-gray-50" onClick={(e) => {
                                        const cellIndex = e.target.closest("td")?.cellIndex;

                                        // Existing logic for Order Details (Columns 1 and 2)
                                        if (cellIndex === 1 || cellIndex === 2) {
                                            setSelectedOrder(order);
                                        }
                                        // New logic for Payment Pop-up (Column 3)
                                        else if (cellIndex === 3) {
                                            setSelectedPaymentOrder(order);
                                        }
                                    }} >

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
                                        <td className="border p-2">{order.distributor}</td>
                                        <td className="border p-2">
                                            <span
                                                className={`px-2 py-1 rounded text-sm font-semibold capitalize ${statusColorMap[order.status] || "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="border p-2">
                                            <span
                                                className={`px-2 py-1 rounded text-sm font-semibold capitalize ${paymentStatusColorMap[order.paymentStatus] || "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="border p-2">{order.city}</td>
                                        <td className="border p-2">{order.placedBy}</td>
                                        <td className="border p-2 font-semibold">
                                            {order.total
                                                ? totalList.reduce((sum, key) => {
                                                    const val = order.total[key];
                                                    return sum + (typeof val === "number" ? val : 0);
                                                }, 0)
                                                : "-"}
                                        </td>
                                        <td className="border p-2">{order.orderPlacedBy}</td>
                                        <td className="border p-2">
                                            {typeof order.expected_delivery === "string" ? (
                                                order.expected_delivery
                                            ) : Array.isArray(order.expected_delivery) &&
                                                order.expected_delivery.length > 0 ? (
                                                order.expected_delivery
                                                    .map((d) => {
                                                        const date = new Date(d);
                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })
                                                    .join(", ")
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td className="border p-2">{order.remarks}</td>

                                        <td className="border p-2">
                                            {typeof order.dispatchedAt === "string" ? (
                                                order.dispatchedAt
                                            ) : Array.isArray(order.dispatchedAt) &&
                                                order.dispatchedAt.length > 0 ? (
                                                order.dispatchedAt
                                                    .map((d) => {
                                                        const date = new Date(d);
                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })
                                                    .join(", ")
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td className="border p-2">
                                            {typeof order.ETD === "string" ? (
                                                order.ETD
                                            ) : Array.isArray(order.ETD) &&
                                                order.ETD.length > 0 ? (
                                                order.ETD
                                                    .map((d) => {
                                                        const date = new Date(d);
                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })
                                                    .join(", ")
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td className="border p-2 font-semibold">
                                            {order.delivered && order.delivered.length > 0
                                                ? order.delivered.reduce((sum, entry) => {
                                                    return (
                                                        sum +
                                                        totalList.reduce((subtotal, key) => {
                                                            const val = entry.total[key];
                                                            return subtotal + (typeof val === "number" ? val : 0);
                                                        }, 0)
                                                    );
                                                }, 0)
                                                : "-"}
                                        </td>

                                        <td className="border p-2">{order.companyRemarks}</td>
                                        <td className="border p-2">
                                            {typeof order.delivered_on === "string" ? (
                                                order.delivered_on
                                            ) : Array.isArray(order.delivered_on) &&
                                                order.delivered_on.length > 0 ? (
                                                order.delivered_on
                                                    .map((d) => {
                                                        const date = new Date(d);
                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })
                                                    .join(", ")
                                            ) : (
                                                "-"
                                            )}
                                        </td>


                                        <td className="border p-2">{order.canceledReason}</td>
                                        <td className="border p-2">{order.statusUpdatedBy}</td>
                                        <td className="border p-2">
                                            {order.statusUpdatedAt ? (() => {
                                                const date = new Date(order.statusUpdatedAt);
                                                const day = String(date.getDate()).padStart(2, "0");
                                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                                const year = date.getFullYear();
                                                const hours = String(date.getHours()).padStart(2, "0");
                                                const minutes = String(date.getMinutes()).padStart(2, "0");

                                                return `${day}/${month}/${year} ${hours}:${minutes}`;
                                            })() : "-"}
                                        </td>
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
                                        <td className="border p-2">{order.createdBy}</td>
                                        <td className="border p-2 flex gap-2 justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrder(order);
                                                    setShowDeliveredProducts(true);
                                                    setShowStatusModal(false);
                                                    setEditPaymentStatusModal(false)
                                                }}
                                                className="px-3 py-1 text-sm bg-amber-600 text-white rounded shadow hover:bg-amber-700 transition"
                                            >
                                                View Dispatched / Delivered
                                            </button>


                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrder(order);
                                                    setShowStatusModal(true);
                                                    setShowDeliveredProducts(false);
                                                    setEditPaymentStatusModal(false)
                                                }}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
                                            >
                                                Update Status
                                            </button>

                                            {isAdmin &&
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrder(order);
                                                            setEditPaymentStatusModal(true)
                                                            setShowDeliveredProducts(false);
                                                            setShowStatusModal(false);
                                                            setPaymentFormData({
                                                                paymentStatus: order.paymentStatus || "pending",
                                                                paymentRemarks: order.paymentRemarks || "",
                                                                invoiceNo: order.invoiceNo || "",
                                                                dueOn: order.dueOn || ""
                                                            });
                                                        }}
                                                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition"
                                                    >
                                                        Update Payment Status
                                                    </button>


                                                    <button
                                                        onClick={() => handleDeleteOrder(order._id)}
                                                        className="px-3 py-1 text-sm bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
                                                    >
                                                        Delete Order
                                                    </button>

                                                    <button
                                                        onClick={() => downloadOrder(order._id)}
                                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                                                    >
                                                        Export
                                                    </button>
                                                </>
                                            }
                                        </td>
                                    </tr>
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* show order */}
            {selectedOrder && !showDeliveredProducts && !showStatusModal && !editPaymentStatusModal && (
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
                                        <span className="font-medium">{selectedOrder.products[product] || 0}</span>
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
                                        <span className="font-medium">{selectedOrder.total[item] || 0}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border rounded p-3 mt-4 flex justify-between items-center bg-amber-100 font-semibold text-amber-800 mb-4">
                                <span>Total</span>
                                <span>
                                    {totalList.reduce(
                                        (sum, key) => sum + (Number(selectedOrder.total[key]) || 0),
                                        0
                                    )}
                                </span>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Remarks:</h3>
                                <div className="overflow-x-auto max-w-[350px]">
                                    <span
                                        className="inline-block truncate"
                                        title={selectedOrder.remarks}
                                    >
                                        {selectedOrder.remarks}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Address:</h3>
                                <div className="overflow-x-auto">
                                    <span
                                        className="inline-block truncate"
                                        title={selectedOrder.address}
                                    >
                                        {selectedOrder.address}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Contact:</h3>
                                <div className="overflow-x-auto max-w-[350px]">
                                    <span
                                        className="inline-block truncate"
                                        title={selectedOrder.contact}
                                    >
                                        {selectedOrder.contact}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* show delivered order */}
            {selectedOrder && showDeliveredProducts && !showStatusModal && !editPaymentStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4 text-amber-700 text-center">
                            Delivered Products
                        </h2>

                        {selectedOrder.delivered && selectedOrder.delivered.length > 0 ? (
                            [...selectedOrder.delivered]
                                .reverse().map((delivery, index) => (
                                    <div key={index} className="mb-6 border rounded p-4 bg-amber-50">
                                        {/* Delivery Date */}
                                        <div className="mb-3">
                                            <span className="font-semibold text-gray-700">Delivery Date: </span>
                                            <span>{new Date(delivery.date).toLocaleDateString()}</span>
                                        </div>

                                        {/* Products */}
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-gray-700 mb-2">Products:</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {Object.entries(delivery.products || {})
                                                    .filter(([_, qty]) => qty > 0)
                                                    .map(([product, qty]) => (
                                                        <div
                                                            key={product}
                                                            className="border rounded p-2 flex justify-between items-center bg-white"
                                                        >
                                                            <span className="text-sm">{product}</span>
                                                            <span className="font-semibold">{qty}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="mb-2">
                                            <h3 className="font-semibold text-gray-700 mb-2">Delivered Total Summary:</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {Object.entries(delivery.total || {})
                                                    .filter(([_, qty]) => qty > 0)
                                                    .map(([item, qty]) => (
                                                        <div
                                                            key={item}
                                                            className="border rounded p-2 flex justify-between items-center bg-white"
                                                        >
                                                            <span className="text-sm">{item}</span>
                                                            <span className="font-semibold">{qty}</span>
                                                        </div>
                                                    ))}
                                            </div>

                                            {/* Grand total */}
                                            <div className="border rounded p-3 mt-3 flex justify-between items-center bg-amber-100 font-semibold text-amber-800">
                                                <span>Total</span>
                                                <span>
                                                    {Object.values(delivery.total || {}).reduce(
                                                        (sum, val) => sum + Number(val || 0),
                                                        0
                                                    )}
                                                </span>
                                            </div>
                                        </div>


                                        <div className="mb-2">Remarks: {delivery.companyRemarks}</div>
                                        <div className="mb-2">ARN: {delivery.ARN ? delivery.ARN : "-"}</div>
                                        <div className="mb-2">Courier: {delivery.courier ? delivery.courier : "-"}</div>
                                        <div className="mb-2">Boxes: {delivery.boxes ? delivery.boxes : "-"}</div>
                                        <div className="mb-2">Bill shared: {delivery.billAttached ? "Yes" : "No"}</div>

                                        {/* Update */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setSelectedDelivery(delivery);
                                                    setShowDeliveredProducts(false);        // 👈 prevent modal stacking
                                                    setShowUpdateDispatchModal(true);
                                                }}
                                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                                            >
                                                Update
                                            </button>
                                        </div>

                                    </div>
                                ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                No deliveries yet.
                            </div>
                        )}

                        {/* Close */}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => {
                                    setShowDeliveredProducts(false);
                                    setSelectedOrder(null);
                                }}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* update dispatchhed order */}
            {showUpdateDispatchModal && selectedDelivery && !showDeliveredProducts && !editPaymentStatusModal && !showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">

                        <h2 className="text-xl font-semibold mb-4 text-center text-amber-700">
                            Update Dispatch Info
                        </h2>

                        {/* ARN */}
                        <div className="mb-4">
                            <label className="block font-medium mb-1">ARN</label>
                            <input
                                type="text"
                                value={dispatchForm.ARN}
                                onChange={(e) =>
                                    setDispatchForm(prev => ({ ...prev, ARN: e.target.value }))
                                }
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        {/* Courier */}
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Courier</label>
                            <input
                                type="text"
                                value={dispatchForm.courier}
                                onChange={(e) =>
                                    setDispatchForm(prev => ({ ...prev, courier: e.target.value }))
                                }
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        
                        {/* Boxes */}
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Boxes</label>
                            <input
                                type="text"
                                value={dispatchForm.boxes}
                                onChange={(e) =>
                                    setDispatchForm(prev => ({ ...prev, boxes: e.target.value }))
                                }
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        {/* Bill */}
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={dispatchForm.billAttached}
                                onChange={(e) =>
                                    setDispatchForm(prev => ({
                                        ...prev,
                                        billAttached: e.target.checked
                                    }))
                                }
                            />
                            <label>Bill Attached</label>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowUpdateDispatchModal(false)}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleUpdateDelivery}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Delivery Status Modal */}
            {(selectedOrder || selectedOrders) && showStatusModal && !showDeliveredProducts && !editPaymentStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto">

                        <h2 className="text-xl font-semibold mb-4 text-center text-amber-700">
                            Update Order Status
                        </h2>

                        {/* Status */}
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Status *</label>
                            <select
                                value={statusForm.status}
                                onChange={(e) => {
                                    const status = e.target.value;
                                    setStatusForm(prev => ({
                                        ...prev,
                                        status
                                    }));
                                }}
                                className="border p-2 rounded w-full"
                            >
                                <option value="">Select Status</option>

                                {isAdmin && !isBulkUpdate && (
                                    <>
                                        <option value="preparing">Preparing</option>
                                        <option value="dispatched">Fully Dispatched</option>
                                        <option value="partially dispatched">Partially Dispatched</option>
                                        <option value="canceled">Canceled</option>
                                        <option value="delivered">Delivered</option>
                                    </>
                                )}
                                {!isBulkUpdate && (
                                    <option value="delivered">Delivered</option>
                                )}

                                {isAdmin && isBulkUpdate && (
                                    <>
                                        <option value="preparing">Preparing</option>
                                        <option value="canceled">Canceled</option>
                                    </>
                                )}

                            </select>


                        </div>

                        {/* ETD */}
                        {(statusForm.status === "preparing" || statusForm.status === "dispatched" || statusForm.status === "partially dispatched") && <div className="mb-4">
                            <label className="block font-medium mb-1">ETD</label>
                            <input
                                type="date"
                                value={statusForm.ETD}
                                onChange={(e) =>
                                    setStatusForm(prev => ({ ...prev, ETD: e.target.value }))
                                }
                                className="border p-2 rounded w-full"
                            />
                        </div>}

                        {/* Cancel Reason */}
                        {statusForm.status === "canceled" && (
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Cancel Reason *</label>
                                <input
                                    type="text"
                                    value={statusForm.canceledReason}
                                    onChange={(e) =>
                                        setStatusForm(prev => ({ ...prev, canceledReason: e.target.value }))
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                        )}

                        {/* Company Remarks */}
                        {(statusForm.status === "preparing" || statusForm.status === "dispatched" || statusForm.status === "partially dispatched") && (
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Company Remarks</label>
                                <input
                                    type="text"
                                    value={statusForm.companyRemarks}
                                    onChange={(e) =>
                                        setStatusForm(prev => ({ ...prev, companyRemarks: e.target.value }))
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                        )}


                        {/* Delivered Products Toggle */}
                        {statusForm.status === "dispatched" && (
                            <div className="mb-4 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="deliveredProductsToggle"
                                    checked={statusForm.delivered_products_same_as_products}
                                    onChange={(e) =>
                                        setStatusForm(prev => ({
                                            ...prev,
                                            delivered_products_same_as_products: e.target.checked,
                                            delivered_products: e.target.checked
                                                ? { ...selectedOrder.products } // auto-assign
                                                : {} // clear if unchecked
                                        }))
                                    }
                                    className="w-4 h-4"
                                />
                                <label htmlFor="deliveredProductsToggle" className="text-sm">
                                    Same as placed order.
                                </label>
                            </div>
                        )}


                        {/* Manual Product Quantity Input */}
                        {(statusForm.status === "dispatched" || statusForm.status === "partially dispatched") && !statusForm.delivered_products_same_as_products && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">
                                    Dispatched Products
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {orderedProductsList.map(product => (
                                        <div
                                            key={product}
                                            className="border rounded p-2 flex flex-col gap-1"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{product}</span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedOrder.products[product]}
                                                    className="w-20 border rounded p-1 text-right"
                                                    value={
                                                        statusForm.delivered_products?.[product] ??
                                                        selectedOrder.products[product]
                                                    }

                                                    onChange={(e) =>
                                                        setStatusForm(prev => ({
                                                            ...prev,
                                                            delivered_products: {
                                                                ...prev.delivered_products,
                                                                [product]: Number(e.target.value),
                                                            },
                                                        }))
                                                    }
                                                />
                                            </div>


                                        </div>

                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowStatusModal(false)
                                    setSelectedOrder(null)
                                    setShowDeliveredProducts(false)
                                }}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() =>
                                    handleUpdateStatus({
                                        ids: selectedOrder
                                            ? [selectedOrder._id]
                                            : selectedOrders,
                                    })
                                }
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                            >
                                Update
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* create order */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4 text-amber-700 text-center">
                            Create Distributor Order
                        </h2>

                        <form onSubmit={handleCreateOrder} className="space-y-4">


                            {/* dropdown list */}
                            {!isDistributor && <div className="mb-4">
                                <label className="block font-medium mb-1">Distributor *</label>

                                <select
                                    value={createForm.distributor}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            distributor: e.target.value,
                                        }))
                                    }
                                    className="border p-2 rounded w-full"
                                >
                                    <option value="">Select Distributor</option>
                                    <option value="other">Other</option>
                                    {dists?.map((d) => (
                                        <option key={d._id} value={d.username}>
                                            {d.username}
                                        </option>
                                    ))}
                                </select>
                            </div>}

                            {/* City */}
                            <div>
                                <label className="block font-medium mb-1">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={createForm.city}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter city"
                                    required
                                />
                            </div>


                            {/* Placed By */}
                            {isAdmin && <div>
                                <label className="block font-medium mb-1">Placed By</label>
                                <select
                                    name="placedBy"
                                    value={createForm.placedBy}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                >
                                    <option value="">Select SR / TL</option>
                                    {srs?.map((u) => (
                                        <option key={u._id} value={u.username}>
                                            {u.username}
                                        </option>
                                    ))}
                                </select>
                            </div>}

                            {/* Order Placed By */}
                            {!isDistributor && <div>
                                <label className="block font-medium mb-1">Order Placed By *</label>
                                <input
                                    type="text"
                                    name="orderPlacedBy"
                                    value={createForm.orderPlacedBy}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>}

                            {/* Address */}
                            <div>
                                <label className="block font-medium mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={createForm.address}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter address"
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block font-medium mb-1">Contact</label>
                                <input
                                    type="text"
                                    name="contact"
                                    value={createForm.contact}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter contact number"
                                />
                            </div>

                            {/* Expected Delivery */}
                            <div>
                                <label className="block font-medium mb-1">Expected Delivery</label>
                                <input
                                    type="date"
                                    name="expected_delivery"
                                    value={createForm.expected_delivery}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                />
                            </div>

                            {/* Products */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">
                                    Products
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {productsList.map((product) => (
                                        <div
                                            key={product}
                                            className="border rounded p-2 flex justify-between items-center"
                                        >
                                            <span className="text-sm">{product}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-20 border rounded p-1 text-right"
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        products: {
                                                            ...prev.products,
                                                            [product]: Number(e.target.value)
                                                        }
                                                    }))
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block font-medium mb-1">Remarks</label>
                                <input
                                    type="text"
                                    name="remarks"
                                    value={createForm.remarks}
                                    onChange={handleCreateChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter remarks"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCopyOrder}
                                    className="px-5 py-3 bg-green-400 text-white rounded-xl hover:bg-green-700"
                                >
                                    Copy Order
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                                >
                                    Create Order
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* show payment status */}
            {selectedPaymentOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">
                            Payment Information: {selectedPaymentOrder.distributor.toLowerCase() === "other"
                                ? selectedPaymentOrder.orderPlacedBy
                                : selectedPaymentOrder.distributor}
                        </h3>


                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-500 text-sm">Status:</span>
                                <p className="font-semibold capitalize">{selectedPaymentOrder.paymentStatus}</p>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Invoice Number:</span>
                                <p className="font-semibold capitalize">{selectedPaymentOrder.invoiceNo}</p>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Due On:</span>
                                <p className="font-semibold capitalize">
                                    {selectedPaymentOrder.dueOn
                                        ? selectedPaymentOrder.dueOn.split("-").reverse().join("-")
                                        : "N/A"}
                                </p>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Remarks:</span>
                                <p className="text-gray-700">{selectedPaymentOrder.paymentRemarks || "No remarks provided"}</p>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Last Updated:</span>
                                <p className="text-gray-700">
                                    {selectedPaymentOrder.paymentStatusDate
                                        ? new Date(selectedPaymentOrder.paymentStatusDate).toLocaleString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPaymentOrder(null)}
                            className="mt-6 w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* update payment status */}
            {selectedOrder && editPaymentStatusModal && !showDeliveredProducts && !showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">

                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">
                                Update Payment: {selectedOrder.distributor?.toLowerCase() === "other"
                                    ? selectedOrder.placedBy
                                    : selectedOrder.distributor}
                            </h3>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                    <select
                                        name="paymentStatus"
                                        value={paymentFormData.paymentStatus}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentStatus: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="posted">Posted</option>
                                        <option value="paid">Paid</option>
                                        <option value="due">Due</option>
                                        <option value="informed">Informed</option>
                                        <option value="partially paid">Partially Paid</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Remarks</label>
                                    <textarea
                                        name="paymentRemarks"
                                        value={paymentFormData.paymentRemarks}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentRemarks: e.target.value })}
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Enter remarks"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                                    <textarea
                                        name="invoiceNo"
                                        value={paymentFormData.invoiceNo}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceNo: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Enter Invoice No."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due On</label>
                                    <input
                                        type="date"
                                        name="dueOn"
                                        value={paymentFormData.dueOn || ""}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, dueOn: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                    />
                                </div>

                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditPaymentStatusModal(false);
                                        setSelectedOrder(null)
                                        setPaymentFormData({ paymentStatus: "", paymentRemarks: "", invoiceNo: "", dueOn: "" });
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded hover:bg-amber-700 transition"
                                >
                                    Update Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {loading && <p className="mt-4">Loading...</p>}
        </div>
    );
};

export default DistributorOrderPage;