"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FileText } from "lucide-react";
import { useCmsPage, useUpsertCmsPage } from "@vrm/api-client";
import { Button, Card, Input, Select, Textarea, useToast } from "@vrm/ui";

const KNOWN_SLUGS = ["privacy-policy", "terms", "refund-policy", "about-us"];

export function CmsPagesSection() {
  const [slug, setSlug] = useState(KNOWN_SLUGS[0]);
  const [customSlug, setCustomSlug] = useState("");
  const activeSlug = slug === "__custom__" ? customSlug : slug;

  const { data: page, isLoading, isError } = useCmsPage(activeSlug || undefined);
  const upsertPage = useUpsertCmsPage();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<{ title: string; content: string }>();

  useEffect(() => {
    if (page) {
      reset({ title: page.title, content: page.content });
    } else if (!isLoading) {
      reset({ title: "", content: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isLoading, activeSlug]);

  const onSubmit = handleSubmit(async (values) => {
    if (!activeSlug) {
      toast.error("Enter a slug first");
      return;
    }
    try {
      await upsertPage.mutateAsync({ slug: activeSlug, title: values.title, content: values.content });
      toast.success("Page saved");
    } catch (err) {
      toast.error("Could not save page", err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
        <FileText size={18} /> Static pages
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Page slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          options={[...KNOWN_SLUGS.map((s) => ({ value: s, label: s })), { value: "__custom__", label: "Custom slug…" }]}
        />
        {slug === "__custom__" && (
          <Input label="Custom slug" value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="e.g. faq" />
        )}
      </div>

      {isError && (
        <p className="mb-3 text-xs text-primary-400">This page doesn't exist yet — fill in the fields below to create it.</p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Title" required {...register("title", { required: true })} />
        <Textarea label="Content" required className="min-h-[220px]" {...register("content", { required: true })} />
        <Button type="submit" isLoading={upsertPage.isPending} className="w-fit">
          Save page
        </Button>
      </form>
    </Card>
  );
}
