// src/services/api.js

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
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
    `/management/contracts/${contractId}/reject-negative`,
    payload
  );