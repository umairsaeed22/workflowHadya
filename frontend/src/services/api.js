// src/services/api.js

import axios from "axios";

const API = axios.create({
  baseURL: "https://bbackendhaydya.onrender.com/api"
});

/*
AUTO ATTACH TOKEN
*/
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

/*
AUTH APIs
*/

export const loginUser = (formData) =>
  API.post("/auth/login", formData);

export const registerUser = (formData) =>
  API.post("/auth/register", formData);

/*
CONTRACT APIs
*/

/*
dynamic department-based fetch

example:
getAllContracts("management")
getAllContracts("operations")
*/
export const getAllContracts = (department) =>
  API.get(`/contracts?department=${department}`);

export const createContract = (formData) =>
  API.post("/contracts", formData);

export const approveContract = (id) =>
  API.put(`/contracts/${id}/approve`);

export default API;

// src/services/api.js

export const uploadToEjar = (
  contractId,
  formData
) =>
  API.post(
    `/contracts/${contractId}/upload-ejar`,
    formData
  );

export const deactivateGuarantee = (
  contractId,
  guaranteeType
) =>
  API.post(
    `/najiz/contracts/${contractId}/deactivate-guarantee`,
    {
      guaranteeType
    }
  );

export const getAllContractsForManagement = () =>
  API.get("/contracts/all");

export const confirmPaymentAndPOP = (
  contractId,
  payload
) =>
  API.post(
    `/finance/contracts/${contractId}/confirm-payment-pop`,
    payload
  );


export const rejectAndProcessNegative = (
  contractId,
  payload
) =>
  API.post(
    `/contracts/${contractId}/reject-negative`,
    payload
  );

export const uploadToEjarNegativeFlow = (
  contractId,
  formData
) =>
  API.post(
    `/ejar/contracts/${contractId}/upload-ejar-negative`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data"
      }
    }
  );

  export const updateContractStatus = (
  contractId,
  payload
) =>
  API.put(
    `/contracts/${contractId}/update-status`,
    payload
  );

export const sendLegalConfirmationEmail =
  (contractId) =>
    API.post(
      `/contracts/${contractId}/legal-confirmation-email`
    );
    
export const getManagementStats = () =>
  API.get(
    "/contracts/management-stats"
  );

export const getNotificationsByDepartment = (
  department
) =>
  API.get(
    `/notifications?department=${department}`
  );