"use client";

import { BellOff } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@vrm/api-client";
import { Button, Card, EmptyState, PageTransition, cn } from "@vrm/ui";

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-primary-400">Stay up to date on bookings and your account.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          Mark all as read
        </Button>
      </div>

      {!isLoading && !data?.data.length ? (
        <EmptyState icon={<BellOff size={26} />} title="You're all caught up" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {(data?.data ?? []).map((n) => (
            <Card
              key={n.id}
              onClick={() => !n.readAt && markRead.mutate(n.id)}
              className={cn("cursor-pointer p-4", !n.readAt && "border-secondary/30 bg-secondary-50/50 dark:bg-secondary-500/5")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-sm text-primary-400">{n.message}</p>
                </div>
                {!n.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-secondary" />}
              </div>
              <p className="mt-2 text-xs text-primary-300">{new Date(n.createdAt).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
