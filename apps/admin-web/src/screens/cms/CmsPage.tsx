"use client";

import { useState } from "react";
import { PageTransition, Tabs } from "@vrm/ui";
import { CmsPagesSection } from "./CmsPagesSection";
import { BlogSection } from "./BlogSection";

export function CmsPage() {
  const [tab, setTab] = useState("pages");

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">CMS &amp; blog</h1>
        <p className="text-sm text-primary-400">Manage static content pages and blog posts shown on the public site.</p>
      </div>

      <Tabs
        tabs={[
          { value: "pages", label: "Pages" },
          { value: "blog", label: "Blog" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === "pages" ? <CmsPagesSection /> : <BlogSection />}
    </PageTransition>
  );
}
