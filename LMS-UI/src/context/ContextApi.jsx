import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the user profile
  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    // 1. If no token, stop loading and return (user remains null)
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 2. Send Token in Headers
      const response = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 3. Success: Set user data
      setUser(response.data.user);
    } catch (error) {
      console.error("Context: Error fetching user", error);

      // 4. If Token is Invalid (401), Clear it & Logout
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};