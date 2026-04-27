import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: ""
  });

  const [loading, setLoading] = useState(false);

  const departments = [
    "Management",
    "Finance",
    "Legal",
    "Operations"
  ];

  const roles = [
    "Admin",
    "Manager",
    "Staff"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await registerUser(formData);

      alert("User registered successfully");

      // redirect to login page
      navigate("/");
    } catch (err) {
      alert(
        err.response?.data?.msg || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <Building2 size={30} />

          <div>
            <h1 className="text-2xl font-bold">
              Create Account
            </h1>

            <p className="text-sm text-gray-500">
              Contract Management System
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg mb-4"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg mb-4"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg mb-4"
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg mb-4"
          >
            <option value="">
              Select Department
            </option>

            {departments.map((dept) => (
              <option
                key={dept}
                value={dept}
              >
                {dept}
              </option>
            ))}
          </select>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg mb-6"
          >
            <option value="">
              Select Role
            </option>

            {roles.map((role) => (
              <option
                key={role}
                value={role}
              >
                {role}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />

            {loading
              ? "Creating Account..."
              : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-black"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;