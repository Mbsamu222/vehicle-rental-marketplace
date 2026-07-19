import { http } from "./http";
import { unwrap, unwrapList } from "./client";
import type {
  AuditLog,
  AuthResult,
  BankDetail,
  Booking,
  BookingStatus,
  BusinessDocument,
  City,
  CmsPage,
  Coupon,
  Country,
  DocumentStatus,
  DocumentType,
  DrivingLicense,
  DrivingLicenseStatus,
  Notification,
  Payment,
  Permission,
  RentalPartner,
  Review,
  Role,
  SavedLocation,
  SupportTicket,
  SupportTicketMessage,
  Transaction,
  User,
  Vehicle,
  VehicleBrand,
  VehicleCategory,
  VehicleImage,
  Wallet,
  BlogPost,
  CouponType,
  FuelType,
  PaymentProvider,
  UserType,
  VehicleTransmission,
} from "./types";

// ─── Auth ───

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  userType: "CUSTOMER" | "RENTAL_PARTNER";
  referralCode?: string;
}

export const authApi = {
  register: (input: RegisterInput) => unwrap<AuthResult>(http.post("/auth/register", input)),
  login: (email: string, password: string) => unwrap<AuthResult>(http.post("/auth/login", { email, password })),
  refresh: (refreshToken: string) => unwrap<AuthResult>(http.post("/auth/refresh", { refreshToken })),
  logout: (refreshToken: string) => unwrap<{ message: string }>(http.post("/auth/logout", { refreshToken })),
  me: () => unwrap<User>(http.get("/auth/me")),
  requestOtp: (purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION") =>
    unwrap<{ message: string; code?: string }>(http.post("/auth/otp/request", { purpose })),
  verifyOtp: (otp: string, purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION") =>
    unwrap<User>(http.post("/auth/otp/verify", { otp, purpose })),
  forgotPassword: (email: string) =>
    unwrap<{ message: string; code?: string }>(http.post("/auth/forgot-password", { email })),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    unwrap<{ message: string }>(http.post("/auth/reset-password", { email, otp, newPassword })),
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap<{ message: string }>(http.post("/auth/change-password", { currentPassword, newPassword })),
};

// ─── Users ───

export interface CustomerDashboard {
  activeBookings: number;
  completedBookings: number;
  wishlistCount: number;
  walletBalance: string;
}

export const usersApi = {
  updateProfile: (input: Partial<Pick<User, "firstName" | "lastName" | "phone" | "avatarUrl">>) =>
    unwrap<User>(http.patch("/users/me", input)),
  dashboard: () => unwrap<CustomerDashboard>(http.get("/users/me/dashboard")),
  listDrivingLicenses: () => unwrap<DrivingLicense[]>(http.get("/users/me/driving-licenses")),
  addDrivingLicense: (input: {
    licenseNumber: string;
    frontImageUrl: string;
    backImageUrl?: string;
    expiryDate: string;
  }) => unwrap<DrivingLicense>(http.post("/users/me/driving-licenses", input)),
  listWishlist: () => unwrap<{ vehicleId: string; vehicle: Vehicle }[]>(http.get("/users/me/wishlist")),
  addToWishlist: (vehicleId: string) => unwrap<unknown>(http.post(`/users/me/wishlist/${vehicleId}`)),
  removeFromWishlist: (vehicleId: string) => unwrap<unknown>(http.delete(`/users/me/wishlist/${vehicleId}`)),
  listSavedLocations: () => unwrap<SavedLocation[]>(http.get("/users/me/saved-locations")),
  addSavedLocation: (input: {
    cityId: string;
    label: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) => unwrap<SavedLocation>(http.post("/users/me/saved-locations", input)),
  deleteSavedLocation: (id: string) => unwrap<unknown>(http.delete(`/users/me/saved-locations/${id}`)),
};

// ─── Catalog ───

export const catalogApi = {
  countries: () => unwrap<Country[]>(http.get("/catalog/countries")),
  cities: (params?: { countryId?: string; popular?: boolean }) =>
    unwrap<City[]>(http.get("/catalog/cities", { params })),
  categories: () => unwrap<VehicleCategory[]>(http.get("/catalog/vehicle-categories")),
  brands: () => unwrap<VehicleBrand[]>(http.get("/catalog/vehicle-brands")),
  createCountry: (input: { name: string; code: string }) => unwrap<Country>(http.post("/catalog/countries", input)),
  createCity: (input: { name: string; countryId: string; isPopular?: boolean; imageUrl?: string }) =>
    unwrap<City>(http.post("/catalog/cities", input)),
  createCategory: (input: { name: string; slug: string; iconUrl?: string }) =>
    unwrap<VehicleCategory>(http.post("/catalog/vehicle-categories", input)),
  createBrand: (input: { name: string; logoUrl?: string }) =>
    unwrap<VehicleBrand>(http.post("/catalog/vehicle-brands", input)),
};

// ─── Vehicles ───

export interface VehicleSearchParams {
  cityId?: string;
  categoryId?: string;
  brandId?: string;
  transmission?: VehicleTransmission;
  fuelType?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  seatingCapacity?: number;
  pickupDatetime?: string;
  returnDatetime?: string;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

export interface CreateVehicleInput {
  categoryId: string;
  brandId: string;
  cityId: string;
  model: string;
  year: number;
  registrationNumber: string;
  transmission: VehicleTransmission;
  fuelType: FuelType;
  seatingCapacity: number;
  pricePerHour: number;
  pricePerDay: number;
  securityDeposit?: number;
  insuranceDetails?: string;
  rentalPolicies?: string;
  latitude?: number;
  longitude?: number;
}

export const vehiclesApi = {
  search: (params: VehicleSearchParams) => unwrapList<Vehicle>(http.get("/vehicles/search", { params })),
  getById: (id: string) => unwrap<Vehicle>(http.get(`/vehicles/${id}`)),
  checkAvailability: (id: string, pickupDatetime: string, returnDatetime: string) =>
    unwrap<{ available: boolean }>(
      http.get(`/vehicles/${id}/availability`, { params: { pickupDatetime, returnDatetime } }),
    ),
  listMine: () => unwrap<Vehicle[]>(http.get("/vehicles/partner/mine")),
  create: (input: CreateVehicleInput) => unwrap<Vehicle>(http.post("/vehicles", input)),
  update: (id: string, input: Partial<CreateVehicleInput>) => unwrap<Vehicle>(http.patch(`/vehicles/${id}`, input)),
  remove: (id: string) => unwrap<unknown>(http.delete(`/vehicles/${id}`)),
  addImages: (id: string, images: { url: string; isPrimary?: boolean; sortOrder?: number }[]) =>
    unwrap<VehicleImage[]>(http.post(`/vehicles/${id}/images`, { images })),
  deleteImage: (id: string, imageId: string) => unwrap<unknown>(http.delete(`/vehicles/${id}/images/${imageId}`)),
  blockAvailability: (id: string, input: { startDate: string; endDate: string; reason?: string }) =>
    unwrap<unknown>(http.post(`/vehicles/${id}/availability-block`, input)),
  listPendingApproval: () => unwrapList<Vehicle>(http.get("/vehicles/admin/pending-approval")),
  review: (id: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) =>
    unwrap<Vehicle>(http.patch(`/vehicles/${id}/review`, { status, rejectionReason })),
};

// ─── Rental Partners ───

export interface PartnerDashboard {
  totalVehicles: number;
  activeBookings: number;
  pendingRequests: number;
  completedBookings: number;
  totalRevenue: string | number;
  averageRating: string;
  verificationStatus: string;
}

export interface CreatePartnerProfileInput {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  cityId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  description?: string;
}

export const rentalPartnersApi = {
  createProfile: (input: CreatePartnerProfileInput) => unwrap<RentalPartner>(http.post("/rental-partners/me", input)),
  getMyProfile: () => unwrap<RentalPartner>(http.get("/rental-partners/me")),
  updateMyProfile: (input: Partial<CreatePartnerProfileInput>) =>
    unwrap<RentalPartner>(http.patch("/rental-partners/me", input)),
  dashboard: () => unwrap<PartnerDashboard>(http.get("/rental-partners/me/dashboard")),
  uploadDocument: (type: DocumentType, fileUrl: string) =>
    unwrap<BusinessDocument>(http.post("/rental-partners/me/documents", { type, fileUrl })),
  setBankDetails: (input: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  }) => unwrap<BankDetail>(http.put("/rental-partners/me/bank-details", input)),
  listPartners: (params?: { status?: string; page?: number; limit?: number }) =>
    unwrapList<RentalPartner>(http.get("/rental-partners", { params })),
  getPartnerById: (id: string) => unwrap<RentalPartner>(http.get(`/rental-partners/${id}`)),
  updateVerificationStatus: (id: string, status: "UNDER_REVIEW" | "VERIFIED" | "REJECTED") =>
    unwrap<RentalPartner>(http.patch(`/rental-partners/${id}/verification-status`, { status })),
  reviewDocument: (documentId: string, status: DocumentStatus, rejectionReason?: string) =>
    unwrap<BusinessDocument>(http.patch(`/rental-partners/documents/${documentId}/review`, { status, rejectionReason })),
};

// ─── Bookings ───

export interface CreateBookingInput {
  vehicleId: string;
  drivingLicenseId: string;
  pickupDatetime: string;
  returnDatetime: string;
  pickupLocation: string;
  returnLocation: string;
  couponCode?: string;
}

export const bookingsApi = {
  create: (input: CreateBookingInput) => unwrap<Booking>(http.post("/bookings", input)),
  listMine: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    unwrapList<Booking>(http.get("/bookings/mine", { params })),
  cancel: (id: string, reason?: string) => unwrap<Booking>(http.post(`/bookings/${id}/cancel`, { reason })),
  listPartnerBookings: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    unwrapList<Booking>(http.get("/bookings/partner/mine", { params })),
  updateStatus: (id: string, status: BookingStatus, note?: string) =>
    unwrap<Booking>(http.patch(`/bookings/${id}/status`, { status, note })),
  getById: (id: string) => unwrap<Booking>(http.get(`/bookings/${id}`)),
};

// ─── Payments ───

export interface PaymentOrderResult {
  payment: Payment;
  providerConfig: { keyId: string | undefined; amount: number; currency: string } | { publishableKey: null } | null;
}

export const paymentsApi = {
  createOrder: (bookingId: string, provider: PaymentProvider) =>
    unwrap<PaymentOrderResult>(http.post("/payments/orders", { bookingId, provider })),
  verify: (paymentId: string, providerRefId: string, providerSignature?: string) =>
    unwrap<Payment>(http.post("/payments/verify", { paymentId, providerRefId, providerSignature })),
  listMine: (params?: { page?: number; limit?: number }) => unwrapList<Payment>(http.get("/payments/mine", { params })),
  wallet: () => unwrap<Wallet>(http.get("/payments/wallet")),
  listTransactions: (params?: { type?: string; rentalPartnerId?: string; page?: number; limit?: number }) =>
    unwrapList<Transaction>(http.get("/payments/transactions", { params })),
  refund: (id: string, amount?: number, reason?: string) =>
    unwrap<Payment>(http.post(`/payments/${id}/refund`, { amount, reason })),
};

// ─── Reviews ───

export const reviewsApi = {
  create: (input: { bookingId: string; vehicleRating: number; partnerRating: number; comment?: string; imageUrls?: string[] }) =>
    unwrap<Review>(http.post("/reviews", input)),
  listByVehicle: (vehicleId: string, params?: { page?: number; limit?: number }) =>
    unwrapList<Review>(http.get(`/reviews/vehicle/${vehicleId}`, { params })),
  listByPartner: (rentalPartnerId: string, params?: { page?: number; limit?: number }) =>
    unwrapList<Review>(http.get(`/reviews/partner/${rentalPartnerId}`, { params })),
  reply: (id: string, message: string) => unwrap<unknown>(http.post(`/reviews/${id}/reply`, { message })),
  report: (id: string, reason: string) => unwrap<unknown>(http.post(`/reviews/${id}/report`, { reason })),
};

// ─── Notifications ───

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    unwrapList<Notification>(http.get("/notifications", { params })),
  markRead: (id: string) => unwrap<unknown>(http.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap<unknown>(http.patch("/notifications/read-all")),
};

// ─── Coupons ───

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minBookingValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
}

export const couponsApi = {
  validate: (code: string, bookingAmount: number) =>
    unwrap<{ code: string; discount: number }>(http.post("/coupons/validate", { code, bookingAmount })),
  list: (params?: { page?: number; limit?: number }) => unwrapList<Coupon>(http.get("/coupons", { params })),
  create: (input: CreateCouponInput) => unwrap<Coupon>(http.post("/coupons", input)),
  update: (id: string, input: Partial<CreateCouponInput> & { isActive?: boolean }) =>
    unwrap<Coupon>(http.patch(`/coupons/${id}`, input)),
  remove: (id: string) => unwrap<unknown>(http.delete(`/coupons/${id}`)),
};

// ─── Support ───

export const supportApi = {
  create: (subject: string, message: string) => unwrap<SupportTicket>(http.post("/support-tickets", { subject, message })),
  listMine: (params?: { page?: number; limit?: number }) =>
    unwrapList<SupportTicket>(http.get("/support-tickets/mine", { params })),
  getById: (id: string) => unwrap<SupportTicket>(http.get(`/support-tickets/${id}`)),
  addMessage: (id: string, message: string) =>
    unwrap<SupportTicketMessage>(http.post(`/support-tickets/${id}/messages`, { message })),
  listAll: (params?: { status?: string; page?: number; limit?: number }) =>
    unwrapList<SupportTicket>(http.get("/support-tickets", { params })),
  updateStatus: (id: string, status: string) =>
    unwrap<SupportTicket>(http.patch(`/support-tickets/${id}/status`, { status })),
};

// ─── Admin ───

export interface AdminDashboard {
  totalCustomers: number;
  totalPartners: number;
  verifiedPartners: number;
  totalVehicles: number;
  pendingVehicleApprovals: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: string | number;
  pendingSupportTickets: number;
}

export const adminApi = {
  dashboard: () => unwrap<AdminDashboard>(http.get("/admin/dashboard")),
  listPermissions: () => unwrap<Permission[]>(http.get("/admin/permissions")),
  listRoles: () => unwrap<Role[]>(http.get("/admin/roles")),
  createRole: (name: string, description: string | undefined, permissionIds: string[]) =>
    unwrap<Role>(http.post("/admin/roles", { name, description, permissionIds })),
  updateRole: (id: string, input: { name?: string; description?: string; permissionIds?: string[] }) =>
    unwrap<Role>(http.patch(`/admin/roles/${id}`, input)),
  deleteRole: (id: string) => unwrap<unknown>(http.delete(`/admin/roles/${id}`)),
  assignRoleToUser: (userId: string, roleId: string) =>
    unwrap<unknown>(http.post(`/admin/users/${userId}/role`, { roleId })),
  listUsers: (params?: { userType?: UserType; status?: string; page?: number; limit?: number }) =>
    unwrapList<User>(http.get("/admin/users", { params })),
  updateUserStatus: (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") =>
    unwrap<User>(http.patch(`/admin/users/${id}/status`, { status })),
  listAuditLogs: (params?: { entityType?: string; page?: number; limit?: number }) =>
    unwrapList<AuditLog>(http.get("/admin/audit-logs", { params })),
  getCmsPage: (slug: string) => unwrap<CmsPage>(http.get(`/admin/cms/${slug}`)),
  upsertCmsPage: (input: { slug: string; title: string; content: string }) =>
    unwrap<CmsPage>(http.put("/admin/cms", input)),
  listBlogPosts: (params?: { page?: number; limit?: number }) =>
    unwrapList<BlogPost>(http.get("/admin/blog", { params })),
  getBlogPost: (slug: string) => unwrap<BlogPost>(http.get(`/admin/blog/${slug}`)),
  upsertBlogPost: (input: {
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    status: "DRAFT" | "PUBLISHED";
  }) => unwrap<BlogPost>(http.put("/admin/blog", input)),
  getSetting: (key: string) => unwrap<{ key: string; value: unknown }>(http.get(`/admin/settings/${key}`)),
  upsertSetting: (key: string, value: unknown) =>
    unwrap<{ key: string; value: unknown }>(http.put(`/admin/settings/${key}`, { value })),
  listDrivingLicenses: (params?: { status?: DrivingLicenseStatus; page?: number; limit?: number }) =>
    unwrapList<DrivingLicense & { user?: User }>(http.get("/admin/driving-licenses", { params })),
  reviewDrivingLicense: (id: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) =>
    unwrap<DrivingLicense>(http.patch(`/admin/driving-licenses/${id}/review`, { status, rejectionReason })),
};
