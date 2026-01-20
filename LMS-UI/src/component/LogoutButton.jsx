import axios from "axios";

export const logout = async () => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/logout",
      {},
      { withCredentials: true }
    );

    return res.data;
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
