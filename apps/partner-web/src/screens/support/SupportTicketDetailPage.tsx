"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { useAuth, useTicket, useAddTicketMessage } from "@vrm/api-client";
import { Avatar, Badge, Button, Card, Input, PageSpinner, PageTransition } from "@vrm/ui";

export function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: ticket, isLoading } = useTicket(id);
  const addMessage = useAddTicketMessage();
  const [message, setMessage] = useState("");

  if (isLoading || !ticket) return <PageSpinner />;

  const onSend = async () => {
    if (!message.trim() || !id) return;
    await addMessage.mutateAsync({ id, message });
    setMessage("");
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-primary-400">Ticket status</p>
        </div>
        <Badge tone={ticket.status === "OPEN" ? "warning" : ticket.status === "RESOLVED" ? "success" : "neutral"}>
          {ticket.status.replace("_", " ")}
        </Badge>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        {(ticket.messages ?? []).map((m) => {
          const mine = m.authorId === user?.id;
          return (
            <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={mine ? "You" : (m.author ? `${m.author.firstName} ${m.author.lastName}` : "Support")} size={32} />
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-secondary text-white" : "bg-primary-50 dark:bg-white/5"}`}>
                <p>{m.message}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-secondary-100" : "text-primary-400"}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="mt-4 flex gap-2">
        <Input placeholder="Type your message…" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={onSend} isLoading={addMessage.isPending}>
          <Send size={16} />
        </Button>
      </div>
    </PageTransition>
  );
}
