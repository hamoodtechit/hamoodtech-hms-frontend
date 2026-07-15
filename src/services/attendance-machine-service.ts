import axios from "axios";

const BASE_URL = "https://attendance.genify.live/api/v1";

export interface AttendanceUser {
  id: number;
  uid: number;
  name: string;
  privilege: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const attendanceMachineService = {
  /**
   * Check if a user exists in the attendance machine
   */
  async checkUser(uid: string): Promise<boolean> {
    try {
      const response = await axios.get<AttendanceResponse<AttendanceUser[]>>(`${BASE_URL}/users`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production",
          'API-KEY': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production"
        }
      });
      
      if (response.data.success && response.data.data) {
        // Find if any user in the response matches the requested UID
        // The API returns uid as a number, so we compare as strings
        return response.data.data.some((user) => String(user.uid) === uid);
      }
      return false;
    } catch (error) {
      console.error("Failed to check user in attendance machine", error);
      throw error;
    }
  },

  /**
   * Add a new user to the attendance machine
   */
  async addUser(uid: string, name: string): Promise<AttendanceResponse> {
    try {
      const response = await axios.post<AttendanceResponse>(`${BASE_URL}/users`, {
        uid,
        name,
        privilege: "0",
      }, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production",
          'API-KEY': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production"
        }
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to add user to attendance machine", error);
      if (error.response && error.response.data) {
        return error.response.data as AttendanceResponse;
      }
      throw error;
    }
  },

  /**
   * Remove a user from the attendance machine
   */
  async removeUser(uid: string): Promise<AttendanceResponse> {
    try {
      const response = await axios.delete<AttendanceResponse>(`${BASE_URL}/users/${uid}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production",
          'API-KEY': process.env.NEXT_PUBLIC_API_KEY || "zk-sdk-dev-key-change-in-production"
        }
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to remove user from attendance machine", error);
      if (error.response && error.response.data) {
        return error.response.data as AttendanceResponse;
      }
      throw error;
    }
  },
};
