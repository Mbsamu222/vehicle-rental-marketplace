"use client";

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Thin Next.js shims that replicate the React Router APIs this codebase was
 * originally built against (`to` instead of `href`, the `({isActive}) =>
 * className` render-prop shape, `navigate(path, {replace})`), so migrated
 * call sites only need their import source changed, not their JSX.
 */

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ to, children, ...props }, ref) => (
  <NextLink href={to} ref={ref} {...props}>
    {children}
  </NextLink>
));
Link.displayName = "Link";

export interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> {
  to: string;
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
  children?: ReactNode;
}

export function NavLink({ to, end, className, children, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;

  return (
    <NextLink href={to} className={resolvedClassName} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      // React Router's history-delta form, e.g. navigate(-1) to go back.
      if (to === -1) router.back();
      else if (to === 1) router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}
