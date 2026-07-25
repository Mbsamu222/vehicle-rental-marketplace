"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { adminApi, changePassword } from "@vrm/api-client";
import { Button, Card, Input, PageTransition, Textarea, useToast } from "@vrm/ui";

const DEFAULT_KEY = "platform.commission_default";

export function SettingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [key, setKey] = useState(DEFAULT_KEY);
  const [value, setValue] = useState("");

  const { data: setting, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings", key],
    queryFn: () => adminApi.getSetting(key),
    retry: false,
    enabled: !!key,
  });

  useEffect(() => {
    if (setting) {
      setValue(typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value, null, 2));
    } else {
      setValue("");
    }
  }, [setting]);

  const upsertSetting = useMutation({
    mutationFn: () => {
      let parsed: unknown = value;
      try {
        parsed = JSON.parse(value);
      } catch {
        // keep as plain string if it isn't valid JSON
      }
      return adminApi.upsertSetting(key, parsed);
    },
    onSuccess: () => {
      toast.success("Setting saved");
      qc.invalidateQueries({ queryKey: ["admin", "settings", key] });
    },
    onError: (err) => toast.error("Could not save setting", err instanceof Error ? err.message : undefined),
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const onChangePassword = async () => {
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error("Could not change password", err instanceof Error ? err.message : undefined);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PageTransition>
      <h1 className="mb-6 font-heading text-2xl font-bold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-1 flex items-center gap-2 font-heading font-semibold">
            <SettingsIcon size={17} /> Platform settings
          </h3>
          <p className="mb-4 text-xs text-primary-400">
            Simple key/value settings storage. View or edit a single key at a time; values are stored as JSON when
            possible, otherwise as plain text.
          </p>
          <div className="flex flex-col gap-4">
            <Input label="Setting key" value={key} onChange={(e) => setKey(e.target.value)} />
            {isLoading ? (
              <p className="text-xs text-primary-400">Loading…</p>
            ) : isError ? (
              <p className="text-xs text-primary-400">This key has no value yet — enter one below to create it.</p>
            ) : null}
            <Textarea label="Value" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[120px]" />
            <Button onClick={() => upsertSetting.mutate()} isLoading={upsertSetting.isPending} className="w-fit">
              Save setting
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-heading font-semibold">Change password</h3>
          <div className="flex flex-col gap-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button onClick={onChangePassword} isLoading={changingPassword} className="w-fit">
              Update password
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
