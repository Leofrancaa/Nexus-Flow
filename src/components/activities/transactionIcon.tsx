"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { findMerchantBrand } from "@/lib/merchantBrands";

function connectorImage(connectorId: number) {
  return `https://cdn.pluggy.ai/assets/connector-icons/${connectorId}.svg`;
}

export function InstitutionLogo({
  connectorId,
  name,
  size = 20,
  className,
}: {
  connectorId?: number;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(connectorId) && !failed;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-subtle",
        className
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      {showImage ? (
        <Image
          src={connectorImage(connectorId!)}
          alt={name ? `Logo ${name}` : "Instituição financeira"}
          width={size}
          height={size}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <Building2 aria-hidden="true" style={{ width: size * 0.56, height: size * 0.56 }} />
      )}
    </span>
  );
}
export function TransactionIcon({
  description,
  category,
  color,
  connectorId,
  institution,
}: {
  description: string;
  category?: string;
  color?: string;
  connectorId?: number;
  institution?: string;
}) {
  const brand = findMerchantBrand(description);
  const [brandFailed, setBrandFailed] = useState(false);
  const initials = brand?.fallback ?? (category ?? description).slice(0, 2).toUpperCase();

  return (
    <span className="relative h-12 w-12 shrink-0" aria-hidden="true">
      <span
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-xs font-bold"
        style={{
          backgroundColor: brand ? `${brand.color}20` : `${color ?? "#a1a1aa"}22`,
          color: brand?.color ?? color ?? "#a1a1aa",
        }}
      >
        {brand && !brandFailed ? (
          <Image
            src={
              brand.asset ??
              `https://cdn.simpleicons.org/${brand.slug}/${brand.color.slice(1)}`
            }
            alt=""
            width={brand.wide ? 38 : 26}
            height={brand.wide ? 24 : 26}
            unoptimized
            onError={() => setBrandFailed(true)}
          />
        ) : (
          initials
        )}
      </span>
      {connectorId ? (
        <InstitutionLogo
          connectorId={connectorId}
          name={institution}
          size={20}
          className="absolute -bottom-0.5 -right-0.5 border-2 border-bg"
        />
      ) : null}
    </span>
  );
}
