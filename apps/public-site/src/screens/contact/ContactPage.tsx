"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, CheckCircle2, Send, Clock } from "lucide-react";
import { Button, Input, Textarea, Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Subject is too short"),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)"),
});
type ContactForm = z.infer<typeof contactSchema>;

const contactDetails = [
  { icon: Mail, label: "Email Support", value: "support@rentwheels.example" },
  { icon: Phone, label: "Customer Helpline", value: "+91 80-4567-8900" },
  { icon: MapPin, label: "Headquarters", value: "T Nagar, Chennai, Tamil Nadu, India" },
  { icon: Clock, label: "Working Hours", value: "Monday – Sunday, 24/7 Available" },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (_data: ContactForm) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)]">
        {/* Info panel */}
        <div className="relative flex items-center overflow-hidden bg-primary px-6 py-20 text-white dark:bg-dark-surface sm:px-10 lg:px-16 lg:py-28">
          <GradientMesh variant="dark" />
          <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-lg lg:mx-0">
            <Eyebrow tone="light">Get in touch</Eyebrow>
            <h1 className="mt-4 font-heading text-4xl font-black tracking-tight sm:text-5xl">Let's talk</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
              Questions about a vehicle booking, partner onboarding, or customer support? Send us a message and our team will get back to you within 24 hours.
            </p>
            <div className="mt-10 flex flex-col gap-6">
              {contactDetails.map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                    <c.icon size={18} className="text-accent-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{c.label}</p>
                    <p className="text-sm font-bold mt-0.5">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-28 bg-surface dark:bg-dark-surface">
          <RevealOnScroll className="mx-auto w-full max-w-lg lg:mx-0">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-heading text-2xl font-bold text-primary dark:text-white">Message Received!</h3>
                <p className="max-w-md text-sm text-primary-400 leading-relaxed">
                  Thank you for reaching out. A member of our support team will respond to your email shortly.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-2 font-semibold">
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold text-primary dark:text-white">Send us a message</h2>
                  <p className="mt-1 text-xs text-primary-400">Fill out the form below and we'll connect with you shortly.</p>
                </div>
                <Input label="Full Name" required placeholder="John Doe" error={errors.name?.message} {...register("name")} />
                <Input label="Email Address" type="email" required placeholder="john@example.com" error={errors.email?.message} {...register("email")} />
                <Input label="Subject" required placeholder="Booking Inquiry / Feedback" error={errors.subject?.message} {...register("subject")} />
                <Textarea
                  label="Message"
                  required
                  rows={5}
                  placeholder="How can we help you today?"
                  error={errors.message?.message}
                  {...register("message")}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                  className="mt-2 gap-2 font-heading shadow-soft hover:shadow-card active:translate-y-0 dark:bg-white dark:text-primary dark:hover:bg-primary-50"
                >
                  <Send size={16} /> Send Message
                </Button>
              </form>
            )}
          </RevealOnScroll>
        </div>
      </div>
    </div>
  );
}
