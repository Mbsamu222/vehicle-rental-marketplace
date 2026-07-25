"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TicketPercent, IdCard, MapPin, Loader2, ImageOff, Wallet, CreditCard, Smartphone, ShieldCheck, Clock, Users, Minus, Plus } from "lucide-react";
import {
  useVehicle,
  useDrivingLicenses,
  useAddDrivingLicense,
  useCreateBooking,
  useValidateCoupon,
  useCreatePaymentOrder,
  useVerifyPayment,
  useMonetizationStatus,
  type PaymentProvider,
} from "@vrm/api-client";
import { Button, Card, Input, Select, Checkbox, DateRangeFields, Modal, FileUpload, useToast, PageSpinner, Badge, cn } from "@vrm/ui";

const TAX_RATE = 0.18;

const PAYMENT_METHODS: { value: PaymentProvider; label: string; icon: typeof Wallet; available: boolean }[] = [
  { value: "WALLET", label: "Wallet balance", icon: Wallet, available: true },
  { value: "RAZORPAY", label: "Card / UPI / Netbanking", icon: CreditCard, available: false },
  { value: "STRIPE", label: "International card", icon: Smartphone, available: false },
];

function estimatePrice(pricePerHour: number, pricePerDay: number, pickup: string, returnAt: string, discount: number) {
  if (!pickup || !returnAt) return null;
  const durationHours = (new Date(returnAt).getTime() - new Date(pickup).getTime()) / 3_600_000;
  if (durationHours <= 0) return null;
  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = Math.ceil(durationHours - fullDays * 24);
  const basePrice = fullDays * pricePerDay + remainingHours * pricePerHour;
  const taxable = Math.max(0, basePrice - discount);
  const tax = Number((taxable * TAX_RATE).toFixed(2));
  return { basePrice: Number(basePrice.toFixed(2)), tax, discount, fullDays, remainingHours };
}

const licenseSchema = z.object({
  licenseNumber: z.string().min(4, "Enter a valid license number"),
  expiryDate: z.string().min(1, "Required"),
});
type LicenseForm = z.infer<typeof licenseSchema>;

export function BookingCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: licenses, isLoading: licensesLoading } = useDrivingLicenses();
  const { data: monetizationStatus } = useMonetizationStatus();
  const addLicense = useAddDrivingLicense();
  const createBooking = useCreateBooking();
  const validateCoupon = useValidateCoupon();
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const [pickup, setPickup] = useState(searchParams.get("pickup") ?? "");
  const [returnAt, setReturnAt] = useState(searchParams.get("return") ?? "");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseImages, setLicenseImages] = useState<string[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>("WALLET");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [extraDriverCount, setExtraDriverCount] = useState(0);
  const [isYoungDriver, setIsYoungDriver] = useState(false);

  const primaryImage = vehicle?.images?.find((i) => i.isPrimary) ?? vehicle?.images?.[0];

  const {
    register: registerLicense,
    handleSubmit: handleLicenseSubmit,
    formState: { errors: licenseErrors, isSubmitting: isSubmittingLicense },
  } = useForm<LicenseForm>({ resolver: zodResolver(licenseSchema) });

  const estimate = useMemo(
    () => (vehicle ? estimatePrice(Number(vehicle.pricePerHour), Number(vehicle.pricePerDay), pickup, returnAt, discount) : null),
    [vehicle, pickup, returnAt, discount],
  );

  if (isLoading || !vehicle) return <PageSpinner />;

  const verifiedLicense = licenses?.find((l) => l.status === "VERIFIED");
  const hasUnverifiedLicense = !verifiedLicense && (licenses?.length ?? 0) > 0;

  const onApplyCoupon = async () => {
    if (!couponCode || !estimate) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, bookingAmount: estimate.basePrice });
      setDiscount(result.discount);
      toast.success(`Coupon applied: -₹${result.discount}`);
    } catch (err) {
      setDiscount(0);
      toast.error("Coupon invalid", err instanceof Error ? err.message : undefined);
    }
  };

  const onAddLicense = async (values: LicenseForm) => {
    if (!licenseImages[0]) {
      toast.error("Upload a photo of your license");
      return;
    }
    try {
      const license = await addLicense.mutateAsync({
        licenseNumber: values.licenseNumber,
        frontImageUrl: licenseImages[0],
        backImageUrl: licenseImages[1],
        expiryDate: new Date(values.expiryDate).toISOString(),
      });
      setLicenseId(license.id);
      setLicenseModalOpen(false);
      toast.success("License submitted", "It needs to be verified by our team before you can book.");
    } catch (err) {
      toast.error("Could not add license", err instanceof Error ? err.message : undefined);
    }
  };

  const onSubmit = async () => {
    if (!pickup || !returnAt || !pickupLocation || !returnLocation || !licenseId) {
      toast.error("Fill in all required fields");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please accept the terms & cancellation policy to continue");
      return;
    }
    setIsPaying(true);
    try {
      const booking = await createBooking.mutateAsync({
        vehicleId: vehicle.id,
        drivingLicenseId: licenseId,
        pickupDatetime: new Date(pickup).toISOString(),
        returnDatetime: new Date(returnAt).toISOString(),
        pickupLocation,
        returnLocation,
        couponCode: couponCode || undefined,
        extraDriverCount,
        isYoungDriver,
      });

      const order = await createOrder.mutateAsync({ bookingId: booking.id, provider: paymentMethod });
      if (order.payment.status !== "PAID") {
        await verifyPayment.mutateAsync({ paymentId: order.payment.id, providerRefId: "dev-manual" });
      }

      toast.success("Booking confirmed!");
      navigate(`/account/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      toast.error("Booking failed", err instanceof Error ? err.message : undefined);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Complete your booking</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-heading font-semibold">Rental dates</h3>
            <DateRangeFields pickup={pickup} returnAt={returnAt} onPickupChange={setPickup} onReturnChange={setReturnAt} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <MapPin size={16} className="text-secondary" /> Pickup & return
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Pickup location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
              <Input label="Return location" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} />
            </div>
          </Card>

          {(monetizationStatus?.EXTRA_DRIVER_FEE || monetizationStatus?.YOUNG_DRIVER_FEE) && (
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
                <Users size={16} className="text-secondary" /> Drivers
              </h3>
              <div className="flex flex-col gap-4">
                {monetizationStatus?.EXTRA_DRIVER_FEE && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Additional drivers</p>
                      <p className="text-xs text-primary-400">Anyone besides you who may drive during the rental.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Decrease additional drivers"
                        disabled={extraDriverCount <= 0}
                        onClick={() => setExtraDriverCount((n) => Math.max(0, n - 1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-primary-500 disabled:opacity-40 dark:border-dark-border dark:text-primary-300"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{extraDriverCount}</span>
                      <button
                        type="button"
                        aria-label="Increase additional drivers"
                        disabled={extraDriverCount >= 5}
                        onClick={() => setExtraDriverCount((n) => Math.min(5, n + 1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-primary-500 disabled:opacity-40 dark:border-dark-border dark:text-primary-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {monetizationStatus?.YOUNG_DRIVER_FEE && (
                  <Checkbox
                    label="The primary driver is a young driver"
                    checked={isYoungDriver}
                    onChange={(e) => setIsYoungDriver(e.target.checked)}
                  />
                )}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <IdCard size={16} className="text-secondary" /> Driving license
            </h3>
            {licensesLoading ? (
              <Loader2 className="animate-spin text-secondary" />
            ) : (
              <>
                {verifiedLicense ? (
                  <Select
                    options={[{ value: verifiedLicense.id, label: `${verifiedLicense.licenseNumber} (Verified)` }]}
                    value={licenseId || verifiedLicense.id}
                    onChange={(e) => setLicenseId(e.target.value)}
                  />
                ) : hasUnverifiedLicense ? (
                  <Badge tone="warning">
                    Your license is pending verification. You'll be able to book once it's approved.
                  </Badge>
                ) : (
                  <Button variant="outline" onClick={() => setLicenseModalOpen(true)}>
                    Add driving license
                  </Button>
                )}
              </>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <TicketPercent size={16} className="text-secondary" /> Coupon
            </h3>
            <div className="flex gap-2">
              <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
              <Button variant="outline" onClick={onApplyCoupon} isLoading={validateCoupon.isPending}>
                Apply
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <Wallet size={16} className="text-secondary" /> Payment method
            </h3>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={!method.available}
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      selected ? "border-secondary bg-secondary/5 dark:bg-secondary/10" : "border-border dark:border-dark-border",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} className={selected ? "text-secondary" : "text-primary-400"} />
                      {method.label}
                    </span>
                    {method.available ? (
                      <span
                        className={cn(
                          "size-4 shrink-0 rounded-full border-2",
                          selected ? "border-secondary bg-secondary" : "border-border dark:border-dark-border",
                        )}
                      />
                    ) : (
                      <Badge tone="neutral">Coming soon</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 p-5">
            <div className="flex gap-3 border-b border-border pb-4 dark:border-dark-border">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-primary-100/50 dark:bg-white/5">
                {primaryImage ? (
                  <img src={primaryImage.url} alt={vehicle.model} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-primary-300">
                    <ImageOff size={22} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-semibold">
                  {vehicle.brand?.name} {vehicle.model}
                </h3>
                <p className="mt-0.5 text-xs capitalize text-primary-400">
                  {vehicle.transmission} • {vehicle.fuelType} • {vehicle.seatingCapacity} seats
                </p>
              </div>
            </div>

            {estimate ? (
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-primary-50/70 px-3 py-2 text-xs font-semibold text-primary-600 dark:bg-white/5 dark:text-primary-300">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-secondary" /> Duration
                  </span>
                  <span>
                    {estimate.fullDays > 0 && `${estimate.fullDays} day${estimate.fullDays !== 1 ? "s" : ""} `}
                    {estimate.remainingHours > 0 && `${estimate.remainingHours} hr${estimate.remainingHours !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-400">Base price</span>
                  <span>₹{estimate.basePrice}</span>
                </div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-₹{estimate.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-primary-400">Tax (18%)</span>
                  <span>₹{estimate.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-400">Security deposit</span>
                  <span>₹{vehicle.securityDeposit}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-3 font-heading text-base font-bold dark:border-dark-border">
                  <span>Estimated total</span>
                  <span>₹{(estimate.basePrice - estimate.discount + estimate.tax + Number(vehicle.securityDeposit)).toFixed(2)}</span>
                </div>
                {(monetizationStatus?.SERVICE_FEE || extraDriverCount > 0 || isYoungDriver) && (
                  <p className="text-xs text-primary-400">
                    Any applicable service fee, extra-driver, or young-driver surcharges are calculated at checkout and
                    shown on your confirmed booking.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-primary-400">Select your rental dates to see pricing.</p>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-primary-50/50 p-3 text-xs text-primary-500 dark:border-dark-border dark:bg-white/5 dark:text-primary-300">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-secondary" />
              <span>
                Free cancellation up to 24 hours before pickup for a full refund. Cancellations within 24 hours forfeit the security
                deposit. Late returns are billed at the hourly rate.
              </span>
            </div>

            {paymentMethod === "WALLET" && (
              <p className="mt-3 text-xs text-primary-400">
                Payment is simulated via your wallet balance in this environment — no live payment gateway keys are configured.
              </p>
            )}

            <Checkbox
              className="mt-4"
              label="I agree to the terms of service and the cancellation policy"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />

            <Button fullWidth className="mt-4" isLoading={isPaying} disabled={!agreedToTerms} onClick={onSubmit}>
              Confirm & pay
            </Button>
          </Card>
        </div>
      </div>

      <Modal open={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} title="Add driving license">
        <form onSubmit={handleLicenseSubmit(onAddLicense)} className="flex flex-col gap-4">
          <Input label="License number" error={licenseErrors.licenseNumber?.message} {...registerLicense("licenseNumber")} />
          <Input label="Expiry date" type="date" error={licenseErrors.expiryDate?.message} {...registerLicense("expiryDate")} />
          <FileUpload label="License photo" value={licenseImages} onChange={setLicenseImages} />
          <Button type="submit" isLoading={isSubmittingLicense} fullWidth>
            Submit license
          </Button>
        </form>
      </Modal>
    </div>
  );
}
