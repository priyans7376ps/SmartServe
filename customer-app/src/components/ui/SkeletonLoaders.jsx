import React from 'react';
import { cn } from '../../lib/cn';

/* ── BASE SKELETON BLOCK ──────────────────────────────── */
function Bone({ className }) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
      role="presentation"
      aria-hidden="true"
    />
  );
}

/* ── FOOD CARD SKELETON ───────────────────────────────── */
export function FoodCardSkeleton() {
  return (
    <div className="bg-surface-1 border border-subtle rounded-2xl overflow-hidden shadow-card">
      {/* Image */}
      <Bone className="w-full aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Bone className="h-5 w-3/5" />
          <Bone className="h-5 w-10" />
        </div>
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <div className="flex items-center justify-between pt-1">
          <Bone className="h-6 w-16" />
          <Bone className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── CATEGORY CHIP SKELETON ───────────────────────────── */
export function CategorySkeleton() {
  return (
    <Bone className="h-10 w-28 rounded-full shrink-0" />
  );
}

/* ── HERO BANNER SKELETON ─────────────────────────────── */
export function BannerSkeleton() {
  return (
    <Bone className="w-full h-52 sm:h-64 rounded-3xl" />
  );
}

/* ── PROMO CARD SKELETON ──────────────────────────────── */
export function PromoCardSkeleton() {
  return (
    <Bone className="h-28 rounded-3xl" />
  );
}

/* ── CART ITEM SKELETON ───────────────────────────────── */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-surface-2 rounded-2xl">
      <Bone className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Bone className="h-5 w-16" />
          <Bone className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── ORDER ITEM SKELETON ──────────────────────────────── */
export function OrderItemSkeleton() {
  return (
    <div className="p-4 bg-surface-1 border border-subtle rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-5 w-32" />
        <Bone className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PROFILE SKELETON ─────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-6 bg-surface-1 border border-subtle rounded-2xl">
        <Bone className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-36" />
          <Bone className="h-4 w-48" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <Bone key={i} className="h-14 rounded-2xl" />
      ))}
    </div>
  );
}
