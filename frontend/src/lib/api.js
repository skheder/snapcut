import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register              = (data)        => api.post("/auth/register", data);
export const login                 = (data)        => api.post("/auth/login", data);
export const getMe                 = ()            => api.get("/auth/me");

export const getBarbers            = (lat, lng)    => api.get("/barbers", { params: { lat, lng } });
export const getBarber             = (id)          => api.get(`/barbers/${id}`);
export const updateBarberLocation  = (lat, lng)    => api.put("/barbers/location", { lat, lng });
export const updateBarberStatus    = (status)      => api.put("/barbers/status", { status });

export const createBooking         = (data)        => api.post("/bookings", data);
export const getMyBookings         = ()            => api.get("/bookings");
export const getBarberBookings     = ()            => api.get("/bookings/barber");
export const updateBookingStatus   = (id, status)  => api.put(`/bookings/${id}/status`, { status });
export const submitReview          = (id, rating, text) => api.post(`/bookings/${id}/review`, { rating, text });

export const startStripeConnect    = ()            => api.post("/payments/connect");
export const getConnectStatus      = ()            => api.get("/payments/connect/status");
export const getEarnings           = ()            => api.get("/payments/earnings");

export const checkoutSubscription  = (plan)        => api.post("/subscriptions/checkout", { plan });
export const getMySubscription     = ()            => api.get("/subscriptions/me");
export const cancelSubscription    = ()            => api.delete("/subscriptions");
