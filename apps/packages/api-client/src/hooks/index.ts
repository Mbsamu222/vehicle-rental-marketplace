"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  adminApi,
  bookingsApi,
  catalogApi,
  couponsApi,
  monetizationApi,
  notificationsApi,
  paymentsApi,
  payoutsApi,
  rentalPartnersApi,
  reviewsApi,
  subscriptionsApi,
  supportApi,
  usersApi,
  vehiclesApi,
  type CreateAdSlotInput,
  type CreateAffiliatePartnerInput,
  type CreateBookingInput,
  type CreateHeroBannerSlideInput,
  type CreatePartnerProfileInput,
  type CreateSubscriptionPlanInput,
  type CreateVehicleInput,
  type NearbyVehiclesParams,
  type UpdateBrandInput,
  type UpdateCategoryInput,
  type UpdateCityInput,
  type UpdateCountryInput,
  type VehicleSearchParams,
} from "../endpoints";
import type {
  BookingStatus,
  DocumentStatus,
  DocumentType,
  DrivingLicenseStatus,
  MonetizationFeatureKey,
  PaymentProvider,
  UserType,
} from "../types";

type QueryOpts<T> = Omit<UseQueryOptions<T>, "queryKey" | "queryFn">;

// ─── Monetization status (public) ───
// A single cached fetch (react-query dedupes calls across every component that
// uses this hook) — the frontend's one source of truth for "is this toggle on."

export function useMonetizationStatus() {
  return useQuery({
    queryKey: ["monetization", "status"],
    queryFn: () => monetizationApi.status(),
    staleTime: 60_000,
  });
}

// ─── Catalog ───

export const catalogKeys = {
  countries: ["catalog", "countries"] as const,
  cities: (params?: { countryId?: string; popular?: boolean }) => ["catalog", "cities", params] as const,
  categories: ["catalog", "categories"] as const,
  brands: ["catalog", "brands"] as const,
  adminCountries: ["catalog", "admin", "countries"] as const,
  adminCities: ["catalog", "admin", "cities"] as const,
  adminCategories: ["catalog", "admin", "categories"] as const,
  adminBrands: ["catalog", "admin", "brands"] as const,
};

export function useCountries(opts?: QueryOpts<Awaited<ReturnType<typeof catalogApi.countries>>>) {
  return useQuery({ queryKey: catalogKeys.countries, queryFn: catalogApi.countries, ...opts });
}
export function useCities(params?: { countryId?: string; popular?: boolean }) {
  return useQuery({ queryKey: catalogKeys.cities(params), queryFn: () => catalogApi.cities(params) });
}
export function useVehicleCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: catalogApi.categories });
}
export function useVehicleBrands() {
  return useQuery({ queryKey: catalogKeys.brands, queryFn: catalogApi.brands });
}
export function useAdSlots() {
  return useQuery({ queryKey: ["catalog", "ad-slots"], queryFn: catalogApi.adSlots });
}
export function useAffiliatePartners() {
  return useQuery({ queryKey: ["catalog", "affiliate-partners"], queryFn: catalogApi.affiliatePartners });
}

// Admin catalog management (includes inactive entries)
export function useAdminCountries() {
  return useQuery({ queryKey: catalogKeys.adminCountries, queryFn: catalogApi.adminCountries });
}
export function useAdminCities() {
  return useQuery({ queryKey: catalogKeys.adminCities, queryFn: catalogApi.adminCities });
}
export function useAdminVehicleCategories() {
  return useQuery({ queryKey: catalogKeys.adminCategories, queryFn: catalogApi.adminCategories });
}
export function useAdminVehicleBrands() {
  return useQuery({ queryKey: catalogKeys.adminBrands, queryFn: catalogApi.adminBrands });
}

function invalidateCatalog(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: ["catalog"] });
}

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createCountry,
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCountryInput }) => catalogApi.updateCountry(id, input),
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.removeCountry(id),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useCreateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createCity,
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useUpdateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCityInput }) => catalogApi.updateCity(id, input),
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useDeleteCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.removeCity(id),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useCreateVehicleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createCategory,
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useUpdateVehicleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) => catalogApi.updateCategory(id, input),
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useDeleteVehicleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.removeCategory(id),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useCreateVehicleBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createBrand,
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useUpdateVehicleBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBrandInput }) => catalogApi.updateBrand(id, input),
    onSuccess: () => invalidateCatalog(qc),
  });
}
export function useDeleteVehicleBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.removeBrand(id),
    onSuccess: () => invalidateCatalog(qc),
  });
}

// ─── Vehicles ───

export function useVehicleSearch(params: VehicleSearchParams) {
  return useQuery({ queryKey: ["vehicles", "search", params], queryFn: () => vehiclesApi.search(params) });
}
export function useNearbyVehicles(params: Partial<NearbyVehiclesParams>) {
  return useQuery({
    queryKey: ["vehicles", "nearby", params],
    queryFn: () => vehiclesApi.searchNearby(params as NearbyVehiclesParams),
    enabled: params.latitude != null && params.longitude != null,
  });
}
export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => vehiclesApi.getById(id as string),
    enabled: !!id,
  });
}
export function useVehicleAvailability(id: string | undefined, pickupDatetime?: string, returnDatetime?: string) {
  return useQuery({
    queryKey: ["vehicles", id, "availability", pickupDatetime, returnDatetime],
    queryFn: () => vehiclesApi.checkAvailability(id as string, pickupDatetime as string, returnDatetime as string),
    enabled: !!id && !!pickupDatetime && !!returnDatetime,
  });
}
export function useMyVehicles() {
  return useQuery({ queryKey: ["vehicles", "mine"], queryFn: vehiclesApi.listMine });
}
export function usePendingVehicles() {
  return useQuery({ queryKey: ["vehicles", "pending-approval"], queryFn: vehiclesApi.listPendingApproval });
}
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => vehiclesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles", "mine"] }),
  });
}
export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateVehicleInput> }) => vehiclesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles", "mine"] }),
  });
}
export function useAddVehicleImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, images }: { id: string; images: { url: string; isPrimary?: boolean }[] }) =>
      vehiclesApi.addImages(id, images),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
export function useReviewVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "APPROVED" | "REJECTED"; rejectionReason?: string }) =>
      vehiclesApi.review(id, status, rejectionReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
export function useBoostVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days, amountCharged }: { id: string; days: number; amountCharged: number }) =>
      vehiclesApi.boost(id, days, amountCharged),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, inWishlist }: { vehicleId: string; inWishlist: boolean }) =>
      inWishlist ? usersApi.removeFromWishlist(vehicleId) : usersApi.addToWishlist(vehicleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

// ─── Users ───

export function useCustomerDashboard() {
  return useQuery({ queryKey: ["users", "dashboard"], queryFn: usersApi.dashboard });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}
export function useDrivingLicenses() {
  return useQuery({ queryKey: ["driving-licenses"], queryFn: usersApi.listDrivingLicenses });
}
export function useAddDrivingLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.addDrivingLicense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driving-licenses"] }),
  });
}
export function useWishlist(enabled = true) {
  return useQuery({ queryKey: ["wishlist"], queryFn: usersApi.listWishlist, enabled });
}
export function useSavedLocations() {
  return useQuery({ queryKey: ["saved-locations"], queryFn: usersApi.listSavedLocations });
}
export function useAddSavedLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.addSavedLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-locations"] }),
  });
}
export function useDeleteSavedLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteSavedLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-locations"] }),
  });
}

// ─── Bookings ───

export function useMyBookings(status?: BookingStatus) {
  return useQuery({ queryKey: ["bookings", "mine", status], queryFn: () => bookingsApi.listMine({ status }) });
}
export function usePartnerBookings(status?: BookingStatus) {
  return useQuery({
    queryKey: ["bookings", "partner", status],
    queryFn: () => bookingsApi.listPartnerBookings({ status }),
  });
}
export function useBooking(id: string | undefined) {
  return useQuery({ queryKey: ["bookings", id], queryFn: () => bookingsApi.getById(id as string), enabled: !!id });
}
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
export function useCancellationPreview(id: string | undefined) {
  return useQuery({
    queryKey: ["bookings", id, "cancellation-preview"],
    queryFn: () => bookingsApi.cancellationPreview(id as string),
    enabled: !!id,
  });
}
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => bookingsApi.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note, actualReturnAt }: { id: string; status: BookingStatus; note?: string; actualReturnAt?: string }) =>
      bookingsApi.updateStatus(id, status, note, actualReturnAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

// ─── Payments ───

export function useMyPayments() {
  return useQuery({ queryKey: ["payments", "mine"], queryFn: () => paymentsApi.listMine() });
}
export function useWallet() {
  return useQuery({ queryKey: ["payments", "wallet"], queryFn: paymentsApi.wallet });
}
export function useTransactions(params?: { type?: string; rentalPartnerId?: string; customerId?: string }) {
  return useQuery({
    queryKey: ["payments", "transactions", params],
    queryFn: () => paymentsApi.listTransactions(params),
    enabled: params?.customerId === undefined || !!params.customerId,
  });
}
export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: ({ bookingId, provider }: { bookingId: string; provider: PaymentProvider }) =>
      paymentsApi.createOrder(bookingId, provider),
  });
}
export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, providerRefId, providerSignature }: { paymentId: string; providerRefId: string; providerSignature?: string }) =>
      paymentsApi.verify(paymentId, providerRefId, providerSignature),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount?: number; reason?: string }) =>
      paymentsApi.refund(id, amount, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

// ─── Payouts ───

export function usePayouts() {
  return useQuery({ queryKey: ["payouts"], queryFn: () => payoutsApi.list() });
}
export function usePartnerPayouts() {
  return useQuery({ queryKey: ["payouts", "mine"], queryFn: () => payoutsApi.listMine() });
}
export function useCreatePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentalPartnerId: string) => payoutsApi.create(rentalPartnerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payouts"] }),
  });
}

// ─── Coupons ───

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, bookingAmount }: { code: string; bookingAmount: number }) =>
      couponsApi.validate(code, bookingAmount),
  });
}
export function useCoupons() {
  return useQuery({ queryKey: ["coupons"], queryFn: () => couponsApi.list() });
}
export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof couponsApi.update>[1] }) =>
      couponsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

// ─── Reviews ───

export function useVehicleReviews(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "vehicle", vehicleId],
    queryFn: () => reviewsApi.listByVehicle(vehicleId as string),
    enabled: !!vehicleId,
  });
}
export function usePartnerReviews(rentalPartnerId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "partner", rentalPartnerId],
    queryFn: () => reviewsApi.listByPartner(rentalPartnerId as string),
    enabled: !!rentalPartnerId,
  });
}
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => reviewsApi.reply(id, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

// ─── Notifications ───

export function useNotifications(unreadOnly?: boolean, enabled = true) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => notificationsApi.list({ unreadOnly }),
    enabled,
  });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Support ───

export function useMyTickets() {
  return useQuery({ queryKey: ["support", "mine"], queryFn: () => supportApi.listMine() });
}
export function useAllTickets(status?: string) {
  return useQuery({ queryKey: ["support", "all", status], queryFn: () => supportApi.listAll({ status }) });
}
export function useTicket(id: string | undefined) {
  return useQuery({ queryKey: ["support", id], queryFn: () => supportApi.getById(id as string), enabled: !!id });
}
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subject, message }: { subject: string; message: string }) => supportApi.create(subject, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support"] }),
  });
}
export function useAddTicketMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => supportApi.addMessage(id, message),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["support", vars.id] }),
  });
}
export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => supportApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support"] }),
  });
}

// ─── Rental Partners ───

export function useMyPartnerProfile() {
  return useQuery({ queryKey: ["rental-partners", "me"], queryFn: rentalPartnersApi.getMyProfile, retry: false });
}
export function usePartnerDashboard() {
  return useQuery({ queryKey: ["rental-partners", "dashboard"], queryFn: rentalPartnersApi.dashboard });
}
export function useCreatePartnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePartnerProfileInput) => rentalPartnersApi.createProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners", "me"] }),
  });
}
export function useUpdatePartnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreatePartnerProfileInput>) => rentalPartnersApi.updateMyProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners", "me"] }),
  });
}
export function useUploadPartnerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, fileUrl }: { type: DocumentType; fileUrl: string }) =>
      rentalPartnersApi.uploadDocument(type, fileUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners", "me"] }),
  });
}
export function useSetBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rentalPartnersApi.setBankDetails,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners", "me"] }),
  });
}
export function usePartners(status?: string) {
  return useQuery({ queryKey: ["rental-partners", "list", status], queryFn: () => rentalPartnersApi.listPartners({ status }) });
}
export function usePartner(id: string | undefined) {
  return useQuery({
    queryKey: ["rental-partners", id],
    queryFn: () => rentalPartnersApi.getPartnerById(id as string),
    enabled: !!id,
  });
}
export function useUpdatePartnerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "UNDER_REVIEW" | "VERIFIED" | "REJECTED" }) =>
      rentalPartnersApi.updateVerificationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners"] }),
  });
}
export function useReviewPartnerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status, rejectionReason }: { documentId: string; status: DocumentStatus; rejectionReason?: string }) =>
      rentalPartnersApi.reviewDocument(documentId, status, rejectionReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-partners"] }),
  });
}
export function usePartnerAnalytics() {
  return useQuery({ queryKey: ["rental-partners", "analytics"], queryFn: rentalPartnersApi.getAnalytics, retry: false });
}

// ─── Subscriptions ───

export function useSubscriptionPlans() {
  return useQuery({ queryKey: ["subscriptions", "plans"], queryFn: subscriptionsApi.listPlans });
}
export function useAdminSubscriptionPlans() {
  return useQuery({ queryKey: ["subscriptions", "plans", "admin"], queryFn: subscriptionsApi.adminListPlans });
}
export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubscriptionPlanInput) => subscriptionsApi.createPlan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
  });
}
export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSubscriptionPlanInput> }) =>
      subscriptionsApi.updatePlan(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
  });
}
export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.deletePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
  });
}
export function useMySubscription() {
  return useQuery({ queryKey: ["subscriptions", "mine"], queryFn: subscriptionsApi.getMySubscription, retry: false });
}
export function useRequestSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => subscriptionsApi.requestSubscription(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "mine"] }),
  });
}
export function usePendingSubscriptions() {
  return useQuery({ queryKey: ["subscriptions", "pending"], queryFn: subscriptionsApi.listPending });
}
export function useConfirmSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

// ─── Admin ───

export function useAdminDashboard() {
  return useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard });
}
export function useAdminUsers(params?: { userType?: UserType; status?: string }) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: () => adminApi.listUsers(params) });
}
export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => adminApi.getUserById(id as string),
    enabled: !!id,
  });
}
export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" | "BANNED" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
export function useAuditLogs(entityType?: string) {
  return useQuery({ queryKey: ["admin", "audit-logs", entityType], queryFn: () => adminApi.listAuditLogs({ entityType }) });
}
export function useRoles() {
  return useQuery({ queryKey: ["admin", "roles"], queryFn: adminApi.listRoles });
}
export function usePermissions() {
  return useQuery({ queryKey: ["admin", "permissions"], queryFn: adminApi.listPermissions });
}
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description, permissionIds }: { name: string; description?: string; permissionIds: string[] }) =>
      adminApi.createRole(name, description, permissionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; description?: string; permissionIds?: string[] } }) =>
      adminApi.updateRole(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}
export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => adminApi.assignRoleToUser(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
export function useCmsPage(slug: string | undefined) {
  return useQuery({ queryKey: ["cms", slug], queryFn: () => adminApi.getCmsPage(slug as string), enabled: !!slug, retry: false });
}
export function useUpsertCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.upsertCmsPage,
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["cms", data.slug] }),
  });
}
export function useBlogPosts() {
  return useQuery({ queryKey: ["blog"], queryFn: () => adminApi.listBlogPosts() });
}
export function useBlogPost(slug: string | undefined) {
  return useQuery({ queryKey: ["blog", slug], queryFn: () => adminApi.getBlogPost(slug as string), enabled: !!slug });
}
export function useUpsertBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.upsertBlogPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }),
  });
}
export function useHeroBanners() {
  return useQuery({ queryKey: ["hero-banners"], queryFn: () => adminApi.listHeroBanners() });
}
export function useAdminHeroBanners() {
  return useQuery({ queryKey: ["hero-banners", "admin"], queryFn: () => adminApi.adminListHeroBanners() });
}
export function useCreateHeroBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHeroBannerSlideInput) => adminApi.createHeroBanner(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}
export function useUpdateHeroBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateHeroBannerSlideInput> }) =>
      adminApi.updateHeroBanner(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}
export function useDeleteHeroBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteHeroBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}

export function useAdminDrivingLicenses(status?: DrivingLicenseStatus) {
  return useQuery({
    queryKey: ["admin", "driving-licenses", status],
    queryFn: () => adminApi.listDrivingLicenses({ status }),
  });
}
export function useReviewDrivingLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "VERIFIED" | "REJECTED"; rejectionReason?: string }) =>
      adminApi.reviewDrivingLicense(id, status, rejectionReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "driving-licenses"] }),
  });
}

// ─── Monetization ───

export function useMonetizationFeatures() {
  return useQuery({ queryKey: ["monetization", "features"], queryFn: () => adminApi.listMonetizationFeatures() });
}
export function useUpdateMonetizationFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      input,
    }: {
      key: MonetizationFeatureKey;
      input: { isEnabled?: boolean; config?: Record<string, unknown> };
    }) => adminApi.updateMonetizationFeature(key, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization", "features"] }),
  });
}

export function useAdminAdSlots() {
  return useQuery({ queryKey: ["ad-slots", "admin"], queryFn: () => adminApi.adminListAdSlots() });
}
export function useCreateAdSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdSlotInput) => adminApi.createAdSlot(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-slots"] }),
  });
}
export function useUpdateAdSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAdSlotInput> }) => adminApi.updateAdSlot(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-slots"] }),
  });
}
export function useDeleteAdSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-slots"] }),
  });
}

export function useAdminAffiliatePartners() {
  return useQuery({ queryKey: ["affiliate-partners", "admin"], queryFn: () => adminApi.adminListAffiliatePartners() });
}
export function useCreateAffiliatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAffiliatePartnerInput) => adminApi.createAffiliatePartner(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate-partners"] }),
  });
}
export function useUpdateAffiliatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAffiliatePartnerInput> }) =>
      adminApi.updateAffiliatePartner(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate-partners"] }),
  });
}
export function useDeleteAffiliatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAffiliatePartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate-partners"] }),
  });
}
