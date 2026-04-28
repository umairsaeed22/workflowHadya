import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, UserPlus, User, Mail, Lock, Briefcase, Fingerprint } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import toast from "react-hot-toast";

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

  // SECURITY: anti spam protection
  const attemptsRef = useRef(0);
  const lockRef = useRef(false);

  const departments = ["Management", "Finance", "Legal", "Operations", "Leasing", "Customer_Service"];
  const roles = ["Manager"];

  // sanitize input
  const sanitize = (value) =>
    value.replace(/[<>]/g, "").trim();

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (password) =>
    password.length >= 6;

  const isValidName = (name) =>
    name.length >= 2 && name.length <= 50;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: sanitize(e.target.value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SECURITY: lock after abuse
    if (lockRef.current) {
      toast.error("Too many attempts. Try again later.");
      return;
    }

    const name = sanitize(formData.name);
    const email = sanitize(formData.email);
    const password = sanitize(formData.password);
    const department = sanitize(formData.department);
    const role = sanitize(formData.role);

    // SECURITY CHECKS
    if (!isValidName(name)) {
      return toast.error("Invalid name format");
    }

    if (!isValidEmail(email)) {
      return toast.error("Invalid email format");
    }

    if (!isStrongPassword(password)) {
      return toast.error("Password too weak");
    }

    // whitelist enforcement (prevents tampering via devtools)
    if (!departments.includes(department)) {
      return toast.error("Invalid department selection");
    }

    if (!roles.includes(role)) {
      return toast.error("Invalid role selection");
    }

    try {
      setLoading(true);

      await registerUser({
        name,
        email,
        password,
        department,
        role
      });

      attemptsRef.current = 0;

      toast.success("Account Provisioned Successfully");
      navigate("/");

    } catch (err) {
      attemptsRef.current += 1;

      if (attemptsRef.current >= 5) {
        lockRef.current = true;

        setTimeout(() => {
          lockRef.current = false;
          attemptsRef.current = 0;
        }, 15000);
      }

      toast.error(err.response?.data?.msg || "Provisioning Failed");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#7f6421]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 border border-gray-100 relative z-10"
      >
        <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-8">
          <div className="w-14 h-14 bg-[#7f6421] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7f6421]/20">
            <Fingerprint size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Onboarding</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
              System Access Provisioning
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/10 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Master Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Department Unit
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-tighter outline-none cursor-pointer focus:ring-2 focus:ring-[#7f6421]/10"
              >
                <option value="">Select Unit</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                System Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-tighter outline-none cursor-pointer focus:ring-2 focus:ring-[#7f6421]/10"
              >
                <option value="">Select Level</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#7f6421] transition-all shadow-lg mt-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} /> Provision Account
              </>
            )}
          </button>

        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            Existing Auditor?{" "}
            <Link to="/" className="text-[#7f6421] hover:underline decoration-2 underline-offset-4">
              Return to Vault
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}

export default Signup;