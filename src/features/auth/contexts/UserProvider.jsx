import React, { useEffect, useState } from "react";
import UserContext from "./UserContext";
import authService from "../services/authService";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchUser();

    // Other parts of the app (e.g. after granting a guardian's consent)
    // dispatch this to force a profile re-fetch without prop-drilling.
    window.addEventListener("profileUpdated", fetchUser);
    return () => window.removeEventListener("profileUpdated", fetchUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
