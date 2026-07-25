"use client";

import { useState } from "react";
import { PageTransition, Tabs } from "@vrm/ui";
import { CmsPagesSection } from "./CmsPagesSection";
import { BlogSection } from "./BlogSection";
import { HeroBannersSection } from "./HeroBannersSection";

export function CmsPage() {
  const [tab, setTab] = useState("pages");

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">CMS &amp; blog</h1>
        <p className="text-sm text-primary-400">Manage static content pages, blog posts, and the homepage hero banner.</p>
      </div>

      <Tabs
        tabs={[
          { value: "pages", label: "Pages" },
          { value: "blog", label: "Blog" },
          { value: "hero-banners", label: "Hero banners" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === "pages" ? <CmsPagesSection /> : tab === "blog" ? <BlogSection /> : <HeroBannersSection />}
    </PageTransition>
  );
}
