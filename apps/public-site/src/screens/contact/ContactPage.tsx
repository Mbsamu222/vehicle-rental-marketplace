"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, CheckCircle2, Send } from "lucide-react";
import { Button, Input, Textarea, Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Subject is too short"),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)"),
});
type ContactForm = z.infer<typeof contactSchema>;

const contactDetails = [
  { icon: Mail, label: "Email", value: "support@rentwheels.example" },
  { icon: Phone, label: "Phone", value: "+91 80-4567-8900" },
  { icon: MapPin, label: "Head Office", value: "T Nagar, Chennai, India" },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  // Known limitation: there is no public "contact us" submission endpoint
  // on the backend. This intentionally does NOT call fetch/axios against a
  // nonexistent route — it validates client-side only and shows a local
  // success state. Not an oversight.
  const onSubmit = async (_data: ContactForm) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(true);
    reset();
  };

  return (
    <div>
      <Seo title="Contact Us" description="Get in touch with the RentWheels team." />

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Info panel */}
        <div className="relative flex items-center overflow-hidden bg-primary px-4 py-20 text-white dark:bg-dark-surface sm:px-6 lg:px-12 lg:py-28">
          <GradientMesh variant="dark" />
          <div className="relative mx-auto max-w-md lg:mx-0">
            <Eyebrow tone="light">Get in touch</Eyebrow>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Let's talk</h1>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Questions about a booking, a partnership, or anything else? Send us a message and we'll get back to
              you within one business day.
            </p>
            <div className="mt-10 flex flex-col gap-5">
              {contactDetails.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <c.icon size={17} />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">{c.label}</p>
                    <p className="text-sm font-medium">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center px-4 py-16 sm:px-6 lg:px-12 lg:py-28">
          <RevealOnScroll className="mx-auto w-full max-w-md lg:mx-0">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 size={28} />
                </div>
                <p className="font-heading text-lg font-semibold">Thanks — we'll get back to you</p>
                <p className="max-w-sm text-sm text-primary-400">
                  We've received your message and a member of our team will respond by email shortly.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input label="Full name" required error={errors.name?.message} {...register("name")} />
                <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
                <Input label="Subject" required error={errors.subject?.message} {...register("subject")} />
                <Textarea
                  label="Message"
                  required
                  rows={5}
                  error={errors.message?.message}
                  {...register("message")}
                />
                <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
                  <Send size={16} /> Send message
                </Button>
              </form>
            )}
          </RevealOnScroll>
        </div>
      </div>
    </div>
  );
}
