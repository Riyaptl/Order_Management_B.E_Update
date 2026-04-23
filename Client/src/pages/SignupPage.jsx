import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { sendOtp, signup, verifyOtp } from "../slice/authSlice";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "sr", // default selected
    address: ""
  });

  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({ ...prev, role: e.target.value.toLowerCase() }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const resultAction = await dispatch(
        sendOtp({
          username: formData.username,
          email: formData.email,
          address: formData.address,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role.toLowerCase(),
        })
      ).unwrap();

      toast.success(resultAction.message || "OTP sent successfully!");
      setShowOtpModal(true);
    } catch (err) {

      toast.error(err || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      const result = await dispatch(
        verifyOtp({ email: formData.email, otp })
      ).unwrap();

      toast.success(result.message);
      setShowOtpModal(false);
      navigate("/")
      // Optionally reset formData or redirect the user
    } catch (err) {
      toast.error(err || "OTP verification failed");
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();

    // ✅ frontend password check
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const result = await dispatch(
        signup({
          username: formData.username.trim(),
          address: formData.address,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role.toLowerCase(),
        })
      ).unwrap();

      toast.success(result.message || "Signup successful");
      navigate("/"); // or dashboard

    } catch (err) {
      toast.error(err || "Signup failed");
    }
  };



  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded shadow-md bg-white">
      <h2 className="text-3xl font-bold mb-8 text-center text-beige-800">Signup</h2>

      <form onSubmit={handleSignup} className="space-y-6">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
        />
        {/* <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
        /> */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleRoleChange}
          className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
          required
        >
          <option value="sr">SR</option>
          <option value="me">ME</option>
          <option value="distributor">Distributor</option>
          <option value="admin">Admin</option>
        </select>

        {/* Address (Only for Distributor) */}
        {formData.role === "distributor" && (
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              rows={3}
              required
              className="w-full border border-gray-300 p-3 rounded text-lg focus:outline-none focus:ring-2 focus:ring-beige-400"
              placeholder="Enter distributor address"
            />
          </div>
        )}

        {/* {error && <p className="text-red-600 text-center">{error}</p>} */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded text-lg font-semibold transition"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded p-8 max-w-sm w-full shadow-lg relative">
            <h3 className="text-2xl font-semibold mb-6 text-center">Enter OTP</h3>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                name="otp"
                placeholder="One Time Password"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full border border-gray-300 p-3 rounded text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-beige-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded text-lg font-semibold transition"
              >
                {loading ? "Verifying..." : "Sign Up"}
              </button>
            </form>

            {/* Close modal button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close OTP modal"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        <p>
          Already have an account?{" "}
          <Link to="/login" className="text-amber-600 hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
