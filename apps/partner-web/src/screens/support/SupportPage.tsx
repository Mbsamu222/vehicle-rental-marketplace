"use client";

import { useState } from "react";
import { Link } from "@vrm/ui";
import { useForm } from "react-hook-form";
import { LifeBuoy, Plus } from "lucide-react";
import { useMyTickets, useCreateTicket } from "@vrm/api-client";
import { Button, Card, EmptyState, Modal, Input, Textarea, Badge, PageTransition, useToast } from "@vrm/ui";

export function SupportPage() {
  const { data, isLoading } = useMyTickets();
  const createTicket = useCreateTicket();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ subject: string; message: string }>();

  const onSubmit = async (values: { subject: string; message: string }) => {
    try {
      await createTicket.mutateAsync(values);
      toast.success("Ticket created", "Our team will respond shortly.");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error("Could not create ticket", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Support</h1>
          <p className="text-sm text-primary-400">Get help with your listings, bookings, and account.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New ticket
        </Button>
      </div>

      {!isLoading && !data?.data.length ? (
        <EmptyState icon={<LifeBuoy size={26} />} title="No support tickets" description="Raise a ticket if you need help." />
      ) : (
        <div className="flex flex-col gap-3">
          {(data?.data ?? []).map((ticket) => (
            <Link key={ticket.id} to={`/support/${ticket.id}`}>
              <Card hoverable className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-xs text-primary-400">Updated {new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
                <Badge tone={ticket.status === "OPEN" ? "warning" : ticket.status === "RESOLVED" ? "success" : "neutral"}>
                  {ticket.status.replace("_", " ")}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New support ticket">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Subject" required {...register("subject", { required: true })} />
          <Textarea label="Message" required {...register("message", { required: true })} />
          <Button type="submit" isLoading={createTicket.isPending} fullWidth>
            Submit ticket
          </Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
