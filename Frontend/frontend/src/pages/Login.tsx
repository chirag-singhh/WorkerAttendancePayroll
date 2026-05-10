import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaUserPlus,
  FaClock,
  FaUsers,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
      toast.error(result.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 flex items-center justify-center px-4 py-6 overflow-hidden relative">
      {/* Background Circles */}
      <div className="absolute top-[-100px] right-[-100px] w-72 h-72 bg-white/10 rounded-full" />
      <div className="absolute bottom-[-120px] left-[-120px] w-80 h-80 bg-white/10 rounded-full" />

      {/* Card */}
      <div className="bg-white w-full max-w-md rounded-[35px] shadow-2xl px-6 py-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-5 rounded-full shadow-lg mb-4">
            <FaUserCircle className="text-white text-5xl" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 text-center">
            Worker Attendance
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-[2px] w-14 bg-blue-300" />
            <p className="text-gray-500 text-lg">Login to continue</p>
            <div className="h-[2px] w-14 bg-blue-300" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">
              Email
            </label>
            <div className="flex items-center border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50">
              <FaEnvelope className="text-blue-500 text-xl mr-3" />
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent outline-none text-lg"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">
              Password
            </label>
            <div className="flex items-center border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50">
              <FaLock className="text-blue-500 text-xl mr-3" />
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent outline-none text-lg"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl text-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
            {!loading && <FaArrowRight />}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="h-[1px] flex-1 bg-gray-200" />
          <span className="text-gray-400 text-sm">OR</span>
          <div className="h-[1px] flex-1 bg-gray-200" />
        </div>

        {/* Register */}
        <div className="border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUserPlus className="text-blue-600 text-xl" />
            </div>
            <p className="text-gray-600 text-sm">
              Don't have an account?
            </p>
          </div>
          <Link
            to="/register"
            className="text-blue-600 font-bold text-lg hover:text-blue-700 transition"
          >
            Register
          </Link>
        </div>

        {/* Bottom Features */}
        <div className="grid grid-cols-3 gap-3 mt-8 text-center">
          <div>
            <FaShieldAlt className="text-white bg-blue-600 mx-auto p-3 rounded-full text-5xl mb-2" />
            <p className="text-xs text-gray-600">Secure Login</p>
          </div>
          <div>
            <FaClock className="text-white bg-blue-600 mx-auto p-3 rounded-full text-5xl mb-2" />
            <p className="text-xs text-gray-600">Fast & Easy</p>
          </div>
          <div>
            <FaUsers className="text-white bg-blue-600 mx-auto p-3 rounded-full text-5xl mb-2" />
            <p className="text-xs text-gray-600">Manage Workers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;