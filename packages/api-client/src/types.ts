export type UserType = "CUSTOMER" | "RENTAL_PARTNER" | "ADMIN" | "SUPER_ADMIN";
export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED";
export type PartnerVerificationStatus = "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
export type DocumentType = "BUSINESS_LICENSE" | "GST_CERTIFICATE" | "IDENTITY_PROOF" | "ADDRESS_PROOF" | "BANK_PROOF" | "OTHER";
export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VehicleApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VehicleTransmission = "MANUAL" | "AUTOMATIC";
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID" | "CNG";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "APPROVED"
  | "REJECTED"
  | "VEHICLE_READY"
  | "PICKED_UP"
  | "ACTIVE"
  | "RETURNING"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type PaymentProvider = "RAZORPAY" | "STRIPE" | "WALLET";
export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "SMS";
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type CouponType = "FLAT" | "PERCENTAGE";
export type DrivingLicenseStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type BlogStatus = "DRAFT" | "PUBLISHED";

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "APPROVED",
  "VEHICLE_READY",
  "PICKED_UP",
  "ACTIVE",
  "RETURNING",
  "COMPLETED",
];

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  userType: UserType;
  accountStatus: AccountStatus;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  referralCode?: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  isPopular: boolean;
  isActive: boolean;
  imageUrl?: string | null;
  country?: Country;
}

export interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  isActive: boolean;
}

export interface VehicleBrand {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Vehicle {
  id: string;
  rentalPartnerId: string;
  categoryId: string;
  brandId: string;
  cityId: string;
  model: string;
  year: number;
  registrationNumber: string;
  transmission: VehicleTransmission;
  fuelType: FuelType;
  seatingCapacity: number;
  pricePerHour: string;
  pricePerDay: string;
  securityDeposit: string;
  insuranceDetails?: string | null;
  rentalPolicies?: string | null;
  approvalStatus: VehicleApprovalStatus;
  rejectionReason?: string | null;
  isActive: boolean;
  averageRating: string;
  totalReviews: number;
  totalBookings: number;
  createdAt: string;
  images?: VehicleImage[];
  category?: VehicleCategory;
  brand?: VehicleBrand;
  city?: City;
  rentalPartner?: RentalPartner;
}

export interface RentalPartner {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  cityId: string;
  address: string;
  logoUrl?: string | null;
  description?: string | null;
  verificationStatus: PartnerVerificationStatus;
  commissionRate: string;
  averageRating: string;
  totalReviews: number;
  createdAt: string;
  city?: City;
  documents?: BusinessDocument[];
  bankDetails?: BankDetail | null;
}

export interface BusinessDocument {
  id: string;
  rentalPartnerId: string;
  type: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason?: string | null;
  uploadedAt: string;
}

export interface BankDetail {
  id: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string | null;
}

export interface DrivingLicense {
  id: string;
  licenseNumber: string;
  frontImageUrl: string;
  backImageUrl?: string | null;
  expiryDate: string;
  status: DrivingLicenseStatus;
  rejectionReason?: string | null;
}

export interface SavedLocation {
  id: string;
  cityId: string;
  label: string;
  address: string;
  city?: City;
}

export interface BookingStatusHistoryEntry {
  id: string;
  status: BookingStatus;
  note?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vehicleId: string;
  rentalPartnerId: string;
  drivingLicenseId?: string | null;
  couponId?: string | null;
  pickupDatetime: string;
  returnDatetime: string;
  pickupLocation: string;
  returnLocation: string;
  basePrice: string;
  discountAmount: string;
  taxAmount: string;
  securityDeposit: string;
  totalAmount: string;
  status: BookingStatus;
  cancellationReason?: string | null;
  createdAt: string;
  vehicle?: Vehicle;
  rentalPartner?: RentalPartner;
  customer?: User;
  statusHistory?: BookingStatusHistoryEntry[];
  payments?: Payment[];
  review?: Review | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: PaymentProvider;
  providerRefId?: string | null;
  amount: string;
  status: PaymentStatus;
  paidAt?: string | null;
  refundedAmount: string;
  createdAt: string;
  booking?: Booking;
}

export interface Wallet {
  id: string;
  balance: string;
}

export type TransactionType =
  | "BOOKING_PAYMENT"
  | "REFUND"
  | "PAYOUT"
  | "WALLET_TOPUP"
  | "WALLET_DEBIT"
  | "COMMISSION";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  paymentId?: string | null;
  rentalPartnerId?: string | null;
  walletId?: string | null;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  vehicleId: string;
  rentalPartnerId: string;
  vehicleRating: number;
  partnerRating: number;
  comment?: string | null;
  createdAt: string;
  customer?: User;
  images?: { id: string; url: string }[];
  replies?: { id: string; message: string; createdAt: string; author?: User }[];
}

export interface Notification {
  id: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  message: string;
  createdAt: string;
  author?: User;
}

export interface SupportTicket {
  id: string;
  userId: string;
  rentalPartnerId?: string | null;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  messages?: SupportTicketMessage[];
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  maxDiscount?: string | null;
  minBookingValue?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CmsPage {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  status: BlogStatus;
  publishedAt?: string | null;
  createdAt: string;
}

export interface Permission {
  id: string;
  key: string;
  module: string;
  description?: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  user?: User | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
