import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./NavbarComponents";
import { getSRDetails } from "../slice/userSlice";
import { fetchAreas } from "../slice/areaSlice";
import { fetchCities } from "../slice/citySlice";

export default function ReportComponents({
    title = "Sales Report",
    reportData = {},
    replaceReportData = {},
    returnReportData = {},
    loading = false,
    queryAction,
}) {
    const dispatch = useDispatch();
    const { user, role } = useSelector((state) => state.auth);
    const { srs } = useSelector((state) => state.user);
    const { cities } = useSelector((state) => state.city);

    const [selectedDate, setSelectedDate] = useState("");
    const [showCurrentMonth, setShowCurrentMonth] = useState(false);
    const [username, setUsername] = useState("");
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    const isDistributor = role === "distributor";
    const isSR = role === "sr";
    const isTL = role === 'tl';
    const isAdmin = role === "admin";
    const [options, setOptions] = useState([]);
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const { areas } = useSelector((state) => state.area);
    const monthMap = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
        };


    useEffect(() => {
        const data = {}
        if (isDistributor) {
            data["dist_username"] = user
        }
        dispatch(fetchAreas(data));

    }, [dispatch]);

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
        if (isAdmin || isTL) {
            dispatch(getSRDetails());
            dispatch(fetchCities())
        }
    }, [dispatch, role]);

    useEffect(() => {
        const query = { month, year };
        if (selectedArea) {
            query.areaId = selectedArea
        }
        if (selectedCity) {
            query.city = selectedCity
        }
        if (selectedDate) {
            query.date = selectedDate;
            query.completeData = false;
        } else {
            query.completeData = showCurrentMonth;
        }
        if (isDistributor) {
            query.dist_username = user;
        }
        if (isSR) {
            query.placed_username = user;
        }
        if (username) {
            query.placed_username = username;
        }

        if (queryAction) dispatch(queryAction(query));
    }, [dispatch, user, selectedDate, showCurrentMonth, username, month, year, selectedArea, selectedCity, queryAction]);

    const productKeys = reportData.productTotals ? Object.keys(reportData.productTotals) : [];
    const overallKeys = reportData.overallTotals ? Object.keys(reportData.overallTotals) : [];

    const now = new Date();
    const monthName = now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "long",
    });

    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    const handleMonthChange = (selectedMonth) => {
        const selectedMonthIndex = monthMap[selectedMonth];

        const selectedYear =
            selectedMonthIndex > currentMonthIndex
            ? currentYear - 1
            : currentYear;

        setMonth(selectedMonth);
        setYear(selectedYear);
        setShowCurrentMonth(false);
        setSelectedDate("");
    };


    return (
        <div className="p-4">
            <div className="flex justify-end md:justify-center mb-8">
                <Navbar />
            </div>

            <div className="px-4 md:px-6 mb-6">
                <h2 className="text-2xl font-semibold text-amber-700 text-center">{title}</h2>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-4 md:px-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
                    {/* City Selector */}
                    {(isAdmin || isTL) &&
                        <div className="w-full md:w-auto">
                            <label className="block text-lg font-medium text-amber-700 mb-2">Select City</label>
                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    setSelectedCity(e.target.value);
                                    setSelectedArea("")
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

                    {/* Area Selector */}
                    <div className="w-full md:w-auto">
                        <label className="block text-lg font-medium text-amber-700 mb-2">Select Route</label>
                        <select
                            value={selectedArea}
                            onChange={(e) => {
                                setSelectedArea(e.target.value);
                                setSelectedCity("")
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

                    {/* SR selector */}
                    {(isAdmin || isTL) && (
                        <div className="flex flex-col">
                            <label className="text-lg font-medium text-amber-700 mb-1">
                                Select SR <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full md:w-64 text-md border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">-- Select SR --</option>
                                {srs.map((sr) => (
                                    <option key={sr._id} value={sr.username}>
                                        {sr.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date selector */}
                    <div className="flex flex-col">
                        <label className="text-lg font-medium text-amber-700 mb-1">Select Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setShowCurrentMonth(false);
                                setMonth("")
                                setYear("")
                            }}
                            className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-md"
                        />
                    </div>

                    {/* Month selector */}
                    <div className="flex flex-col">
                        <label className="text-lg font-medium text-amber-700 mb-1">Select Month</label>
                        <select
                            value={month}
                            onChange={(e) => handleMonthChange(e.target.value)}
                            className="border rounded px-3 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Select Month</option>
                            {options.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <label className="text-lg font-medium text-amber-700 whitespace-nowrap">
                            Show {monthName}'s {title}
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showCurrentMonth}
                                onChange={() => {
                                    setShowCurrentMonth((prev) => !prev);
                                    setSelectedDate("");
                                    setMonth("")
                                    setYear("")
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-amber-600 transition-all duration-300"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                        </label>
                    </div>


                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-600">Loading report...</p>
            ) : (
                <div className="px-4 md:px-6 space-y-10">
                    <section>
                        {!isDistributor && (
                            <>
                                <div className="text-lg font-bold text-green-700 text-left mb-2">
                                    Order Amount: ₹{reportData.amount || 0}
                                </div>
                                <div className="text-lg font-bold text-green-700 text-left mb-2">
                                    Replacement Amount: ₹{replaceReportData.amount || 0}
                                </div>
                                <div className="text-lg font-bold text-green-700 text-left mb-2">
                                    Return Amount: ₹{returnReportData.amount || 0}
                                </div>
                            </>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 text-left min-w-[140px]">Product</th>
                                        <th className="border p-2 text-left">Ordered</th>
                                        <th className="border p-2 text-left">Replaced</th>
                                        <th className="border p-2 text-left">Returned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productKeys.map((key) => (
                                        <tr key={key} className="hover:bg-gray-50">
                                            <td className="border p-2">{key}</td>
                                            <td className="border p-2">{reportData.productTotals[key]}</td>
                                            <td className="border p-2">{replaceReportData.productTotals?.[key] || 0}</td>
                                            <td className="border p-2">{returnReportData.productTotals?.[key] || 0}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200">
                                        <td colSpan={4} className="text-center font-semibold p-2">Overall Totals</td>
                                    </tr>
                                    {overallKeys.map((key) => (
                                        <tr key={key} className="hover:bg-gray-50">
                                            <td className="border p-2">{key}</td>
                                            <td className="border p-2">{reportData.overallTotals[key]}</td>
                                            <td className="border p-2">{replaceReportData.overallTotals?.[key] || 0}</td>
                                            <td className="border p-2">{returnReportData.overallTotals?.[key] || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
