import { http } from "./http";
import { unwrap, unwrapList } from "./client";
import type {
  AdSlot,
  AffiliateCategory,
  AffiliatePartner,
  AuditLog,
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
  HeroBannerSlide,
  CouponType,
  FuelType,
  MonetizationFeature,
  MonetizationFeatureKey,
  MonetizationStatus,
  PartnerAnalytics,
  PartnerSubscription,
  PaymentProvider,
  SubscriptionPlan,
  UserType,
  VehicleTransmission,
} from "./types";

// ─── Auth ───

export interface SyncInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: "CUSTOMER" | "RENTAL_PARTNER";
  referralCode?: string;
}

export const authApi = {
  sync: (input: SyncInput) => unwrap<User>(http.post("/auth/sync", input)),
  me: () => unwrap<User>(http.get("/auth/me")),
  lookup: (phone: string) => unwrap<{ exists: boolean }>(http.post("/auth/lookup", { phone })),
  discardUnlinked: () => unwrap<{ message: string }>(http.post("/auth/discard-unlinked")),
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

export interface UpdateCountryInput {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateCityInput {
  name?: string;
  countryId?: string;
  isPopular?: boolean;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
}

// ─── Monetization status (public) ───
// Just the enabled/disabled flag per feature, no rates/tiers — safe for
// anonymous visitors so the frontend can hide boosted/sponsored/fee-related UI
// the moment a toggle is off, not just show empty/zero data for it.
export const monetizationApi = {
  status: () => unwrap<MonetizationStatus>(http.get("/monetization/status")),
};

export const catalogApi = {
  countries: () => unwrap<Country[]>(http.get("/catalog/countries")),
  cities: (params?: { countryId?: string; popular?: boolean }) =>
    unwrap<City[]>(http.get("/catalog/cities", { params })),
  categories: () => unwrap<VehicleCategory[]>(http.get("/catalog/vehicle-categories")),
  brands: () => unwrap<VehicleBrand[]>(http.get("/catalog/vehicle-brands")),
  adminCountries: () => unwrap<Country[]>(http.get("/catalog/admin/countries")),
  adminCities: () => unwrap<City[]>(http.get("/catalog/admin/cities")),
  adminCategories: () => unwrap<VehicleCategory[]>(http.get("/catalog/admin/vehicle-categories")),
  adminBrands: () => unwrap<VehicleBrand[]>(http.get("/catalog/admin/vehicle-brands")),
  createCountry: (input: { name: string; code: string }) => unwrap<Country>(http.post("/catalog/countries", input)),
  updateCountry: (id: string, input: UpdateCountryInput) =>
    unwrap<Country>(http.patch(`/catalog/countries/${id}`, input)),
  removeCountry: (id: string) => unwrap<unknown>(http.delete(`/catalog/countries/${id}`)),
  createCity: (input: { name: string; countryId: string; isPopular?: boolean; imageUrl?: string }) =>
    unwrap<City>(http.post("/catalog/cities", input)),
  updateCity: (id: string, input: UpdateCityInput) => unwrap<City>(http.patch(`/catalog/cities/${id}`, input)),
  removeCity: (id: string) => unwrap<unknown>(http.delete(`/catalog/cities/${id}`)),
  createCategory: (input: { name: string; slug: string; iconUrl?: string }) =>
    unwrap<VehicleCategory>(http.post("/catalog/vehicle-categories", input)),
  updateCategory: (id: string, input: UpdateCategoryInput) =>
    unwrap<VehicleCategory>(http.patch(`/catalog/vehicle-categories/${id}`, input)),
  removeCategory: (id: string) => unwrap<unknown>(http.delete(`/catalog/vehicle-categories/${id}`)),
  createBrand: (input: { name: string; logoUrl?: string }) =>
    unwrap<VehicleBrand>(http.post("/catalog/vehicle-brands", input)),
  updateBrand: (id: string, input: UpdateBrandInput) =>
    unwrap<VehicleBrand>(http.patch(`/catalog/vehicle-brands/${id}`, input)),
  removeBrand: (id: string) => unwrap<unknown>(http.delete(`/catalog/vehicle-brands/${id}`)),
  adSlots: () => unwrap<AdSlot[]>(http.get("/catalog/ad-slots")),
  affiliatePartners: () => unwrap<AffiliatePartner[]>(http.get("/catalog/affiliate-partners")),
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
  boost: (id: string, days: number, amountCharged: number) =>
    unwrap<Vehicle>(http.post(`/vehicles/${id}/boost`, { days, amountCharged })),
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
    upiId?: string;
  }) => unwrap<BankDetail>(http.put("/rental-partners/me/bank-details", input)),
  listPartners: (params?: { status?: string; page?: number; limit?: number }) =>
    unwrapList<RentalPartner>(http.get("/rental-partners", { params })),
  getPartnerById: (id: string) => unwrap<RentalPartner>(http.get(`/rental-partners/${id}`)),
  updateVerificationStatus: (id: string, status: "UNDER_REVIEW" | "VERIFIED" | "REJECTED") =>
    unwrap<RentalPartner>(http.patch(`/rental-partners/${id}/verification-status`, { status })),
  reviewDocument: (documentId: string, status: DocumentStatus, rejectionReason?: string) =>
    unwrap<BusinessDocument>(http.patch(`/rental-partners/documents/${documentId}/review`, { status, rejectionReason })),
  getAnalytics: () => unwrap<PartnerAnalytics>(http.get("/rental-partners/me/analytics")),
};

// ─── Subscriptions ───

export interface CreateSubscriptionPlanInput {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxVehicles?: number;
  features?: Record<string, unknown>;
  isActive?: boolean;
}

export const subscriptionsApi = {
  listPlans: () => unwrap<SubscriptionPlan[]>(http.get("/subscriptions/plans")),
  adminListPlans: () => unwrap<SubscriptionPlan[]>(http.get("/subscriptions/plans/manage")),
  createPlan: (input: CreateSubscriptionPlanInput) => unwrap<SubscriptionPlan>(http.post("/subscriptions/plans", input)),
  updatePlan: (id: string, input: Partial<CreateSubscriptionPlanInput>) =>
    unwrap<SubscriptionPlan>(http.patch(`/subscriptions/plans/${id}`, input)),
  deletePlan: (id: string) => unwrap<unknown>(http.delete(`/subscriptions/plans/${id}`)),
  requestSubscription: (planId: string) => unwrap<PartnerSubscription>(http.post("/subscriptions/mine", { planId })),
  getMySubscription: () => unwrap<PartnerSubscription | null>(http.get("/subscriptions/mine")),
  listPending: () => unwrap<PartnerSubscription[]>(http.get("/subscriptions/pending")),
  confirm: (id: string) => unwrap<PartnerSubscription>(http.patch(`/subscriptions/${id}/confirm`)),
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
  extraDriverCount?: number;
  isYoungDriver?: boolean;
}

export const bookingsApi = {
  create: (input: CreateBookingInput) => unwrap<Booking>(http.post("/bookings", input)),
  listMine: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    unwrapList<Booking>(http.get("/bookings/mine", { params })),
  cancellationPreview: (id: string) =>
    unwrap<{ feeAmount: number; refundAmount: number }>(http.get(`/bookings/${id}/cancellation-preview`)),
  cancel: (id: string, reason?: string) => unwrap<Booking>(http.post(`/bookings/${id}/cancel`, { reason })),
  listPartnerBookings: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    unwrapList<Booking>(http.get("/bookings/partner/mine", { params })),
  updateStatus: (id: string, status: BookingStatus, note?: string, actualReturnAt?: string) =>
    unwrap<Booking>(http.patch(`/bookings/${id}/status`, { status, note, actualReturnAt })),
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
  listTransactions: (params?: { type?: string; rentalPartnerId?: string; customerId?: string; page?: number; limit?: number }) =>
    unwrapList<Transaction>(http.get("/payments/transactions", { params })),
  refund: (id: string, amount?: number, reason?: string) =>
    unwrap<Payment>(http.post(`/payments/${id}/refund`, { amount, reason })),
};

// ─── Payouts ───

export const payoutsApi = {
  create: (rentalPartnerId: string) => unwrap<Transaction>(http.post("/payouts", { rentalPartnerId })),
  list: (params?: { page?: number; limit?: number }) => unwrapList<Transaction>(http.get("/payouts", { params })),
  listMine: (params?: { page?: number; limit?: number }) => unwrapList<Transaction>(http.get("/payouts/mine", { params })),
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
  /** GMV — what customers paid on completed bookings, tax and refundable deposit included. Not platform earnings. */
  totalBookingValue: string | number;
  /** Real platform earnings: recorded commission + payout fees. Zero until those toggles are enabled. */
  totalRevenue: string | number;
  pendingSupportTickets: number;
}

export interface CreateHeroBannerSlideInput {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  amountCharged?: number;
}

export interface CreateAdSlotInput {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sponsorName?: string;
  amountCharged?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateAffiliatePartnerInput {
  name: string;
  category: AffiliateCategory;
  tagline?: string;
  ctaLabel?: string;
  referralUrl: string;
  logoUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
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
  getUserById: (id: string) => unwrap<User>(http.get(`/admin/users/${id}`)),
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
  listHeroBanners: () => unwrap<HeroBannerSlide[]>(http.get("/admin/hero-banners")),
  adminListHeroBanners: () => unwrap<HeroBannerSlide[]>(http.get("/admin/hero-banners/manage")),
  createHeroBanner: (input: CreateHeroBannerSlideInput) =>
    unwrap<HeroBannerSlide>(http.post("/admin/hero-banners", input)),
  updateHeroBanner: (id: string, input: Partial<CreateHeroBannerSlideInput>) =>
    unwrap<HeroBannerSlide>(http.patch(`/admin/hero-banners/${id}`, input)),
  deleteHeroBanner: (id: string) => unwrap<unknown>(http.delete(`/admin/hero-banners/${id}`)),
  getSetting: (key: string) => unwrap<{ key: string; value: unknown }>(http.get(`/admin/settings/${key}`)),
  upsertSetting: (key: string, value: unknown) =>
    unwrap<{ key: string; value: unknown }>(http.put(`/admin/settings/${key}`, { value })),
  listDrivingLicenses: (params?: { status?: DrivingLicenseStatus; page?: number; limit?: number }) =>
    unwrapList<DrivingLicense & { user?: User }>(http.get("/admin/driving-licenses", { params })),
  reviewDrivingLicense: (id: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) =>
    unwrap<DrivingLicense>(http.patch(`/admin/driving-licenses/${id}/review`, { status, rejectionReason })),
  listMonetizationFeatures: () => unwrap<MonetizationFeature[]>(http.get("/admin/monetization/features")),
  updateMonetizationFeature: (
    key: MonetizationFeatureKey,
    input: { isEnabled?: boolean; config?: Record<string, unknown> },
  ) => unwrap<MonetizationFeature>(http.patch(`/admin/monetization/features/${key}`, input)),
  adminListAdSlots: () => unwrap<AdSlot[]>(http.get("/admin/ad-slots/manage")),
  createAdSlot: (input: CreateAdSlotInput) => unwrap<AdSlot>(http.post("/admin/ad-slots", input)),
  updateAdSlot: (id: string, input: Partial<CreateAdSlotInput>) =>
    unwrap<AdSlot>(http.patch(`/admin/ad-slots/${id}`, input)),
  deleteAdSlot: (id: string) => unwrap<unknown>(http.delete(`/admin/ad-slots/${id}`)),
  adminListAffiliatePartners: () => unwrap<AffiliatePartner[]>(http.get("/admin/affiliate-partners/manage")),
  createAffiliatePartner: (input: CreateAffiliatePartnerInput) =>
    unwrap<AffiliatePartner>(http.post("/admin/affiliate-partners", input)),
  updateAffiliatePartner: (id: string, input: Partial<CreateAffiliatePartnerInput>) =>
    unwrap<AffiliatePartner>(http.patch(`/admin/affiliate-partners/${id}`, input)),
  deleteAffiliatePartner: (id: string) => unwrap<unknown>(http.delete(`/admin/affiliate-partners/${id}`)),
};
