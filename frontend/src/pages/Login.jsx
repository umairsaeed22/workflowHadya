import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

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

      const res = await loginUser(formData);

      // save JWT token
      localStorage.setItem("token", res.data.token);

      // redirect to dashboard
      const token = res.data.token;

      localStorage.setItem("token", token);

      /*
      decode token
      */
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      const department =
        payload.department?.toLowerCase();

      /*
      redirect based on department
      */

      if (department?.toLowerCase() === "management") {
  navigate("/management-dashboard");
}
      else if (department === "operations") {
        navigate("/operations-dashboard");
      }
      else if (department === "legal") {
        navigate("/legal-dashboard");
      }
      else if (department === "leasing") {
        navigate("/leasing-dashboard");
      }
      else if (department === "finance") {
        navigate("/finance-dashboard");
      }
      else {
        navigate("/");
      }

      toast.success("Login successful");
    } catch (err) {
      alert(
        err.response?.data?.msg || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <Building2 size={28} />
          <h1 className="text-2xl font-bold">
            Contract Management
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-black"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;