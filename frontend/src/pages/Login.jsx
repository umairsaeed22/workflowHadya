import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // SECURITY: prevent brute force spam
  const attemptsRef = useRef(0);
  const lockRef = useRef(false);

  const sanitize = (value) =>
    value.replace(/[<>]/g, "").trim();

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (password) =>
    password.length >= 6; // keep backend rule safe, no UI change

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: sanitize(e.target.value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SECURITY CHECK 1: lock after multiple attempts
    if (lockRef.current) {
      setErrorMsg("Too many attempts. Try again later.");
      return;
    }

    const email = sanitize(formData.email);
    const password = sanitize(formData.password);

    // SECURITY CHECK 2: validation
    if (!isValidEmail(email)) {
      setErrorMsg("Invalid email format");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMsg("Password too weak");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await loginUser({
        email,
        password,
      });

      const token = res.data.token;

      // SECURITY CHECK 3: token safety
      if (!token || typeof token !== "string") {
        throw new Error("Invalid authentication token");
      }

      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1] || "{}"));

      if (!payload || !payload.department) {
        throw new Error("Invalid session payload");
      }

      const department = payload.department.toLowerCase();

      const routes = {
        management: "/management-dashboard",
        operations: "/operations-dashboard",
        legal: "/legal-dashboard",
        leasing: "/leasing-dashboard",
        finance: "/finance-dashboard",
        customer_service: "/customerService-dashboard",
      };

      attemptsRef.current = 0; // reset on success

      navigate(routes[department] || "/");
      toast.success("Identity Verified");

    } catch (err) {
      attemptsRef.current += 1;

      if (attemptsRef.current >= 5) {
        lockRef.current = true;
        setTimeout(() => {
          lockRef.current = false;
          attemptsRef.current = 0;
        }, 15000); // 15 sec lock
      }

      const msg =
        err.response?.data?.msg ||
        err.message ||
        "Authentication Failed";

      setErrorMsg(msg);
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden">
      
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#7f6421]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-gray-200/50 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-md border border-gray-100 z-10"
      >
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <Building2 size={32} className="text-[#7f6421]" />
          </div>
          <h1 className="text-2xl text-center font-black text-gray-900 tracking-tight uppercase">
            Refund & Guarantee Release
          </h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2 text-center">
            Secure Ledger Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Access Key
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#7f6421] transition-all shadow-lg shadow-gray-200 mt-6 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} /> Authenticate
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-[11px] text-red-500 font-bold uppercase tracking-widest text-center mt-3">
              {errorMsg}
            </p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            Authorized Personnel Only.{" "}
            <Link
              to="/signup"
              className="text-[#7f6421] hover:underline decoration-2 underline-offset-4"
            >
              Request Credentials
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}

export default Login;