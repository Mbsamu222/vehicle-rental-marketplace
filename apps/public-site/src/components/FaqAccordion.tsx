"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, cn } from "@vrm/ui";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <Card key={item.question} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-heading text-sm font-semibold text-primary dark:text-white">{item.question}</span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-primary-400 transition-transform duration-200", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-sm text-primary-400">
                <p>{item.answer}</p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
