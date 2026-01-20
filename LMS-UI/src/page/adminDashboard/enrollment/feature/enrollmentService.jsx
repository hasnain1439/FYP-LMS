import axios from "axios";

const API_URL = "http://localhost:5000/api/enrollments";

// Helper to get headers dynamically (in case token changes)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export const enrollmentService = {
  // 1. GET ALL
  getAll: async (page = 1, limit = 10, search = "", status = "") => {
    const response = await axios.get(API_URL, {
      ...getAuthHeaders(),
      params: {
        page,
        limit,
        search,
        status: status === "All" ? "" : status,
      },
    });
    return response.data;
  },

  // 2. CREATE
  // Updated to accept an object for flexibility
  create: async (payload) => {
    const response = await axios.post(API_URL, payload, getAuthHeaders());
    return response.data;
  },

  // 3. UPDATE STATUS
  updateStatus: async (id, status) => {
    const response = await axios.put(
      `${API_URL}/${id}`,
      { status },
      getAuthHeaders()
    );
    return response.data;
  },
};