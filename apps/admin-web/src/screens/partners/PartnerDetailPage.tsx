"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@vrm/ui";
import { ArrowLeft, Check, FileText, Landmark, Mail, Phone, X } from "lucide-react";
import { usePartner, useReviewPartnerDocument, useUpdatePartnerVerification } from "@vrm/api-client";
import type { DocumentStatus, User } from "@vrm/api-client";
import { Badge, Button, Card, Modal, PageSpinner, PageTransition, Select, Textarea, useToast } from "@vrm/ui";

const verificationTone: Record<string, "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  VERIFIED: "success",
  REJECTED: "danger",
};

const docTone: Record<DocumentStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: partner, isLoading } = usePartner(id);
  const updateVerification = useUpdatePartnerVerification();
  const reviewDocument = useReviewPartnerDocument();
  const toast = useToast();

  const [rejectModal, setRejectModal] = useState<{ documentId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  if (isLoading || !partner) return <PageSpinner />;

  const partnerUser = (partner as typeof partner & { user?: User }).user;

  const onSetVerification = async (status: "UNDER_REVIEW" | "VERIFIED" | "REJECTED") => {
    if (!id) return;
    try {
      await updateVerification.mutateAsync({ id, status });
      toast.success("Verification status updated");
    } catch (err) {
      toast.error("Could not update verification", err instanceof Error ? err.message : undefined);
    }
  };

  const onApproveDocument = async (documentId: string) => {
    try {
      await reviewDocument.mutateAsync({ documentId, status: "APPROVED" });
      toast.success("Document approved");
    } catch (err) {
      toast.error("Could not approve document", err instanceof Error ? err.message : undefined);
    }
  };

  const onRejectDocument = async () => {
    if (!rejectModal) return;
    try {
      await reviewDocument.mutateAsync({
        documentId: rejectModal.documentId,
        status: "REJECTED",
        rejectionReason: rejectionReason || undefined,
      });
      toast.success("Document rejected");
      setRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      toast.error("Could not reject document", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <Link to="/partners" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
        <ArrowLeft size={15} /> Back to partners
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">{partner.businessName}</h1>
          <p className="text-sm text-primary-400">{partner.city?.name ?? "Unknown city"}</p>
        </div>
        <Badge tone={verificationTone[partner.verificationStatus]}>{partner.verificationStatus.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">Business info</h2>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-primary-500 dark:text-primary-200">
                <Mail size={14} /> {partner.businessEmail}
              </div>
              <div className="flex items-center gap-2 text-primary-500 dark:text-primary-200">
                <Phone size={14} /> {partner.businessPhone}
              </div>
              <div className="sm:col-span-2 text-primary-500 dark:text-primary-200">{partner.address}</div>
              {partner.description && <p className="sm:col-span-2 text-primary-400">{partner.description}</p>}
              {partnerUser && (
                <div className="sm:col-span-2 rounded-xl border border-border p-3 text-xs text-primary-400 dark:border-dark-border">
                  Account owner: {partnerUser.firstName} {partnerUser.lastName} ({partnerUser.email})
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
              <FileText size={18} /> KYC documents
            </h2>
            {!partner.documents?.length ? (
              <p className="text-sm text-primary-400">No documents uploaded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {partner.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{doc.type.replace(/_/g, " ")}</p>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-link hover:underline">
                        View file
                      </a>
                      {doc.rejectionReason && <p className="mt-1 text-xs text-danger">{doc.rejectionReason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={docTone[doc.status]}>{doc.status}</Badge>
                      {doc.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onApproveDocument(doc.id)}>
                            <Check size={14} /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setRejectModal({ documentId: doc.id })}>
                            <X size={14} /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold">Verification status</h2>
            <Select
              value={partner.verificationStatus === "PENDING" ? "" : partner.verificationStatus}
              placeholder={partner.verificationStatus === "PENDING" ? "Pending — pick a next status" : undefined}
              onChange={(e) => onSetVerification(e.target.value as "UNDER_REVIEW" | "VERIFIED" | "REJECTED")}
              options={[
                { value: "UNDER_REVIEW", label: "Under review" },
                { value: "VERIFIED", label: "Verified" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
            <p className="mt-2 text-xs text-primary-400">
              PENDING is the default state set at onboarding and cannot be selected again as a target.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
              <Landmark size={18} /> Bank details
            </h2>
            {!partner.bankDetails ? (
              <p className="text-sm text-primary-400">Not provided yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5 text-sm">
                <p>{partner.bankDetails.accountHolder}</p>
                <p className="text-primary-400">{partner.bankDetails.bankName} • {partner.bankDetails.branch ?? "—"}</p>
                <p className="text-primary-400">A/C {partner.bankDetails.accountNumber}</p>
                <p className="text-primary-400">IFSC {partner.bankDetails.ifscCode}</p>
                {partner.bankDetails.upiId && <p className="text-primary-400">UPI {partner.bankDetails.upiId}</p>}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject document">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this document is being rejected…"
          />
          <Button variant="danger" onClick={onRejectDocument} isLoading={reviewDocument.isPending} fullWidth>
            Reject document
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
