"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Search, Trash2 } from "lucide-react";
import { adminApi, type SeoSetting } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, Input, Modal, PageSpinner, PageTransition, Textarea, useToast } from "@vrm/ui";

/**
 * Routes the public site renders. Offered as suggestions so an admin doesn't
 * have to guess a path — a typo here silently produces an override that never
 * matches a page.
 */
const KNOWN_PATHS = [
  "/",
  "/search",
  "/categories",
  "/cities",
  "/about",
  "/contact",
  "/faq",
  "/support",
  "/blog",
  "/careers",
  "/become-a-partner",
  "/privacy-policy",
  "/terms-conditions",
  "/refund-policy",
];

// Google truncates around these lengths in a desktop SERP.
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

function CharCount({ value, limit }: { value: string; limit: number }) {
  const n = value.trim().length;
  const over = n > limit;
  return (
    <span className={over ? "text-danger font-semibold" : "text-primary-400"}>
      {n}/{limit}
      {over ? " — will be truncated in search results" : ""}
    </span>
  );
}

type FormState = {
  path: string;
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  noIndex: boolean;
};

const EMPTY: FormState = { path: "", title: "", description: "", keywords: "", ogImageUrl: "", noIndex: false };

export function SeoSettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<FormState | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "seo"],
    queryFn: () => adminApi.listSeoSettings(),
  });

  const save = useMutation({
    mutationFn: (form: FormState) =>
      adminApi.upsertSeoSetting({
        path: form.path,
        // Empty string means "no override" — send null so the public site keeps
        // its computed default rather than rendering an empty tag.
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        keywords: form.keywords.trim() || null,
        ogImageUrl: form.ogImageUrl.trim() || null,
        noIndex: form.noIndex,
      }),
    onSuccess: () => {
      toast.success("SEO settings saved", "Live on the next page render.");
      qc.invalidateQueries({ queryKey: ["admin", "seo"] });
      setEditing(null);
    },
    onError: (err) => toast.error("Could not save", err instanceof Error ? err.message : undefined),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteSeoSetting(id),
    onSuccess: () => {
      toast.success("Override removed", "This page reverts to its default metadata.");
      qc.invalidateQueries({ queryKey: ["admin", "seo"] });
    },
    onError: (err) => toast.error("Could not delete", err instanceof Error ? err.message : undefined),
  });

  const toForm = (s: SeoSetting): FormState => ({
    path: s.path,
    title: s.title ?? "",
    description: s.description ?? "",
    keywords: s.keywords ?? "",
    ogImageUrl: s.ogImageUrl ?? "",
    noIndex: s.noIndex,
  });

  if (isLoading) return <PageSpinner />;

  const rows = settings ?? [];
  const configured = new Set(rows.map((r) => r.path));

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">SEO settings</h1>
          <p className="text-sm text-primary-400">
            Override the meta title, description, and social image for any public page. Anything left blank keeps the
            value the site generates automatically.
          </p>
        </div>
        <Button onClick={() => setEditing(EMPTY)} className="gap-2">
          <Plus size={16} /> Add override
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Globe size={26} />}
          title="No overrides yet"
          description="Every page is using its automatically generated title and description. Add an override to change one."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <Card key={row.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-primary-50 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">
                      {row.path}
                    </code>
                    {row.noIndex && <Badge tone="danger">noindex</Badge>}
                  </div>
                  <p className="mt-2 font-heading text-sm font-semibold text-primary dark:text-white">
                    {row.title || <span className="text-primary-400 italic">auto-generated title</span>}
                  </p>
                  <p className="mt-1 text-xs text-primary-400">
                    {row.description || <span className="italic">auto-generated description</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(toForm(row))}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove.mutate(row.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6 flex items-start gap-3 p-5">
        <Search size={18} className="mt-0.5 shrink-0 text-secondary" />
        <p className="text-xs leading-relaxed text-primary-400">
          Per-vehicle titles and descriptions are edited on the vehicle itself, not here. A listing with no override
          derives its metadata from the brand, model, city, and daily price.
        </p>
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.path ? `SEO — ${editing.path}` : "Add SEO override"}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <div>
              <Input
                label="Page path"
                placeholder="/faq"
                value={editing.path}
                onChange={(e) => setEditing({ ...editing, path: e.target.value })}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {KNOWN_PATHS.filter((p) => !configured.has(p) || p === editing.path).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditing({ ...editing, path: p })}
                    className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-medium text-primary-500 transition-colors hover:border-secondary hover:text-secondary dark:border-white/10 dark:text-primary-300"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Input
                label="Meta title"
                placeholder="Leave blank to keep the generated title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <p className="mt-1 text-xs">
                <CharCount value={editing.title} limit={TITLE_LIMIT} />
              </p>
            </div>

            <div>
              <Textarea
                label="Meta description"
                rows={3}
                placeholder="Leave blank to keep the generated description"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <p className="mt-1 text-xs">
                <CharCount value={editing.description} limit={DESCRIPTION_LIMIT} />
              </p>
            </div>

            <Input
              label="Keywords (comma separated)"
              placeholder="self drive car rental, car rental chennai"
              value={editing.keywords}
              onChange={(e) => setEditing({ ...editing, keywords: e.target.value })}
            />

            <Input
              label="Social share image URL"
              placeholder="https://… (1200×630 recommended)"
              value={editing.ogImageUrl}
              onChange={(e) => setEditing({ ...editing, ogImageUrl: e.target.value })}
            />

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 dark:border-white/10">
              <input
                type="checkbox"
                checked={editing.noIndex}
                onChange={(e) => setEditing({ ...editing, noIndex: e.target.checked })}
                className="mt-0.5 size-4 rounded border-border text-secondary"
              />
              <span className="text-sm">
                <span className="font-semibold text-primary dark:text-white">Hide from search engines</span>
                <span className="mt-0.5 block text-xs text-primary-400">
                  Adds <code>noindex</code>. Use for thin or seasonal pages — it removes the page from Google.
                </span>
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => save.mutate(editing)}
                isLoading={save.isPending}
                disabled={!editing.path.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
