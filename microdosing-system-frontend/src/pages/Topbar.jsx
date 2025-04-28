import React, { useEffect, useState } from "react";
import companyLogo from "../assets/Asm_Logo.png";
import chicken from "../assets/chicken.png";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";

const Topbar = () => {
  const { logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleLogout = () => setShowLogout((prev) => !prev);

  const handleLogout = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/api/users/logout", null, {
        withCredentials: true,
      });
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch("http://127.0.0.1:5000/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("🚀 User fetched from API:", data);

        // Use the structure of your API response to correctly assign the user
        setUser(data.user || data[0] || null);
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark-mode");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const displayName =
    user?.username || user?.name || user?.email?.split("@")[0] || "Guest";

  const initial = (
    user?.username?.charAt(0) ||
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "A"
  ).toUpperCase();

  return (
    <div
      className={`w-full h-16 flex items-center justify-between px-4 shadow-md relative transition-all duration-300 ${theme === "dark"
        ? "bg-[#0f1c2f] text-[#e0f7ff] shadow-neon border-b border-cyan-400"
        : "bg-[#D4D6D9] text-gray-800"
        }`}
    >
      <div className="flex items-center gap-4" />

      <div className="flex items-center gap-4 relative">
        <p className="text-sm">
          Hello, <span className="font-bold">{displayName}</span>
        </p>

        <div
          className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110"
          onClick={toggleLogout}
        >
          {initial}
        </div>

        <img
  src={companyLogo}
  alt="Company Logo"
  width="40"   // Explicit width (use your desired size)
  height="40"  // Explicit height (use your desired size)
  className="h-auto w-auto max-h-10 sm:max-h-12 md:max-h-16 lg:max-h-20 cursor-pointer transition-all duration-200 hover:opacity-80"
  onClick={toggleLogout}
  loading="lazy"
/>

<img
  src={chicken}
  alt="chicken"
  width="100"  // Explicit width (use your desired size)
  height="100" // Explicit height (use your desired size)
  className="h-auto w-auto max-h-25 max-w-25 sm:max-h-30 md:max-h-35 lg:max-h-40 object-contain cursor-pointer transition-all duration-200 hover:opacity-80"
  onClick={toggleLogout}
  loading="lazy"
/>


        {showLogout && (
          <div className="absolute top-14 right-2 bg-white border shadow-lg rounded-lg p-4 z-50 max-w-[200px]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-4 rounded-md text-red-600 font-medium hover:bg-red-50 hover:text-red-800 transition-all duration-150"
            >
              <FaSignOutAlt className="text-xl" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
