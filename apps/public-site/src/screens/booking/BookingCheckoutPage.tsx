"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TicketPercent, IdCard, MapPin, Loader2 } from "lucide-react";
import {
  useVehicle,
  useDrivingLicenses,
  useAddDrivingLicense,
  useCreateBooking,
  useValidateCoupon,
  useCreatePaymentOrder,
  useVerifyPayment,
} from "@vrm/api-client";
import { Button, Card, Input, Select, DateRangeFields, Modal, FileUpload, useToast, PageSpinner, Badge } from "@vrm/ui";

const TAX_RATE = 0.18;

function estimatePrice(pricePerHour: number, pricePerDay: number, pickup: string, returnAt: string, discount: number) {
  if (!pickup || !returnAt) return null;
  const durationHours = (new Date(returnAt).getTime() - new Date(pickup).getTime()) / 3_600_000;
  if (durationHours <= 0) return null;
  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = Math.ceil(durationHours - fullDays * 24);
  const basePrice = fullDays * pricePerDay + remainingHours * pricePerHour;
  const taxable = Math.max(0, basePrice - discount);
  const tax = Number((taxable * TAX_RATE).toFixed(2));
  return { basePrice: Number(basePrice.toFixed(2)), tax, discount };
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
      });

      const order = await createOrder.mutateAsync({ bookingId: booking.id, provider: "WALLET" });
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
        </div>

        <div>
          <Card className="sticky top-24 p-5">
            <h3 className="mb-4 font-heading font-semibold">
              {vehicle.brand?.name} {vehicle.model}
            </h3>
            {estimate ? (
              <div className="flex flex-col gap-2 text-sm">
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
              </div>
            ) : (
              <p className="text-sm text-primary-400">Select your rental dates to see pricing.</p>
            )}
            <p className="mt-3 text-xs text-primary-400">
              Payment is simulated via your wallet balance in this environment — no live payment gateway keys are configured.
            </p>
            <Button fullWidth className="mt-5" isLoading={isPaying} onClick={onSubmit}>
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
