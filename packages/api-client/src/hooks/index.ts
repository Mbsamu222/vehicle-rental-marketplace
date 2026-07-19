"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  adminApi,
  bookingsApi,
  catalogApi,
  couponsApi,
  notificationsApi,
  paymentsApi,
  rentalPartnersApi,
  reviewsApi,
  supportApi,
  usersApi,
  vehiclesApi,
  type CreateBookingInput,
  type CreatePartnerProfileInput,
  type CreateVehicleInput,
  type VehicleSearchParams,
} from "../endpoints";
import type { BookingStatus, DocumentStatus, DocumentType, DrivingLicenseStatus, PaymentProvider, UserType } from "../types";

type QueryOpts<T> = Omit<UseQueryOptions<T>, "queryKey" | "queryFn">;

// ─── Catalog ───

export const catalogKeys = {
  countries: ["catalog", "countries"] as const,
  cities: (params?: { countryId?: string; popular?: boolean }) => ["catalog", "cities", params] as const,
  categories: ["catalog", "categories"] as const,
  brands: ["catalog", "brands"] as const,
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

// ─── Vehicles ───

export function useVehicleSearch(params: VehicleSearchParams) {
  return useQuery({ queryKey: ["vehicles", "search", params], queryFn: () => vehiclesApi.search(params) });
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
    mutationFn: ({ id, status, note }: { id: string; status: BookingStatus; note?: string }) =>
      bookingsApi.updateStatus(id, status, note),
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
export function useTransactions(params?: { type?: string; rentalPartnerId?: string }) {
  return useQuery({ queryKey: ["payments", "transactions", params], queryFn: () => paymentsApi.listTransactions(params) });
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

// ─── Admin ───

export function useAdminDashboard() {
  return useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard });
}
export function useAdminUsers(params?: { userType?: UserType; status?: string }) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: () => adminApi.listUsers(params) });
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
