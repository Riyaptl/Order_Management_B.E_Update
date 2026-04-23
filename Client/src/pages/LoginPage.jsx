import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPass, login, resetPass } from "../slice/authSlice";
import toast from "react-hot-toast";

export default function LoginPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [showForgotModal, setShowForgot]  = useState(false);
  const [email, setEmail]                 = useState("");
  const [otpSent, setOtpSent]             = useState(false);
  const [otp, setOtp]                     = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPass] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await dispatch(
            login({
              username,
              password,
              loginLoc: { latitude: coords.latitude, longitude: coords.longitude },
            })
          ).unwrap();

          toast.success(res.message);
          navigate("/");
        } catch (err) {
          toast.error(err?.message || "Login failed");
        }
      },
      () => toast.error("Failed to get location. Please enable GPS."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };


  const handleSendOtp = async () => {
    if (!email) return toast.error("Email required");
    try {
      const res = await dispatch(forgotPass({ email })).unwrap();
      toast.success(res.message);
      setOtpSent(true);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword)
      return toast.error("All fields are required");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    try {
      const res = await dispatch(
        resetPass({ email, otp, newPassword, confirmPassword })
      ).unwrap();
      toast.success(res.message);
      closeModal();
    } catch (err) {
      toast.error(err);
    }
  };

  const closeModal = () => {
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPass("");
    setOtpSent(false);
    setShowForgot(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded shadow-md bg-white relative">
      <h2 className="text-3xl font-bold mb-8 text-center">Login</h2>

      <form
        onSubmit={handleSubmit}
        autoComplete="on"
        name="login"
        method="post"
        action="/login"
        id="login-form"
        className="space-y-6"
      >
            <input
        type="text"
        name="username"
        autoComplete="username"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        className="w-full border border-gray-300 p-3 rounded text-lg"
      />

              <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full border border-gray-300 p-3 rounded text-lg"
      />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded text-lg font-semibold transition"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      {/* ------------ Links & Modals (unchanged) ------------ */}
      <div className="text-center mt-4">
        <button onClick={() => setShowForgot(true)} className="text-sm text-amber-600 hover:underline">
          Forgot Password?
        </button>
      </div>

      <div className="text-center mt-4">
        <p>
          Don’t have an account?{" "}
          <Link to="/signup" className="text-amber-600 hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Forgot Password</h3>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded mb-3 w-full"
              >
                Send OTP
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded mb-3"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded mb-3"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded mb-3"
                />
                <button
                  onClick={handleResetPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded w-full"
                >
                  Reset Password
                </button>
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl"
                  aria-label="Close Modal"
                >
                  &times;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
