"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@vrm/ui";

const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type NewsletterForm = z.infer<typeof newsletterSchema>;

export function NewsletterSignup() {
  const [subscribed, setSubscribed] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterForm>({ resolver: zodResolver(newsletterSchema) });

  // There is no newsletter-subscription endpoint on the backend. This is
  // intentionally local-only: validate, then show a success state — no
  // fetch/axios call to a nonexistent route.
  const onSubmit = (_data: NewsletterForm) => {
    setSubscribed(true);
    reset();
  };

  if (subscribed) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 size={18} />
        Thanks for subscribing — watch your inbox for updates!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
    </form>
  );
}
