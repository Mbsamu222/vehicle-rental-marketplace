"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useMyPartnerProfile, usePartnerReviews, useReplyToReview } from "@vrm/api-client";
import { Avatar, Button, Card, EmptyState, Input, PageSpinner, PageTransition, StarRating, useToast } from "@vrm/ui";

export function ReviewsPage() {
  const { data: partner, isLoading: partnerLoading } = useMyPartnerProfile();
  const { data: reviews, isLoading } = usePartnerReviews(partner?.id);
  const replyToReview = useReplyToReview();
  const toast = useToast();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  if (partnerLoading || isLoading) return <PageSpinner />;

  const onReply = async (reviewId: string) => {
    const message = replyDrafts[reviewId]?.trim();
    if (!message) return;
    setSubmittingId(reviewId);
    try {
      await replyToReview.mutateAsync({ id: reviewId, message });
      toast.success("Reply posted");
      setReplyDrafts((d) => ({ ...d, [reviewId]: "" }));
    } catch (err) {
      toast.error("Could not post reply", err instanceof Error ? err.message : undefined);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-primary-400">See what customers are saying and reply.</p>
        </div>
        {partner && Number(partner.averageRating) > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Number(partner.averageRating)} />
            <span className="text-sm font-semibold">{Number(partner.averageRating).toFixed(1)}</span>
            <span className="text-xs text-primary-400">({partner.totalReviews})</span>
          </div>
        )}
      </div>

      {!reviews?.data.length ? (
        <EmptyState icon={<Star size={26} />} title="No reviews yet" description="Reviews from your customers will show up here." />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.data.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={`${review.customer?.firstName ?? ""} ${review.customer?.lastName ?? ""}`} size={36} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {review.customer?.firstName} {review.customer?.lastName}
                    </p>
                    <StarRating value={review.partnerRating} size={13} />
                  </div>
                  {review.comment && <p className="mt-1 text-sm text-primary-400">{review.comment}</p>}
                  <p className="mt-1 text-xs text-primary-300">{new Date(review.createdAt).toLocaleDateString()}</p>

                  {review.replies?.map((reply) => (
                    <div key={reply.id} className="mt-3 rounded-xl bg-primary-50 p-3 text-sm dark:bg-white/5">
                      <p className="font-semibold">Your reply</p>
                      <p className="mt-0.5 text-primary-400">{reply.message}</p>
                    </div>
                  ))}

                  {!review.replies?.length && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Write a reply…"
                        value={replyDrafts[review.id] ?? ""}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => onReply(review.id)}
                        isLoading={replyToReview.isPending && submittingId === review.id}
                      >
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
