# Energy Stock

A modern inventory dashboard for tracking, purchasing, and restocking energy drinks. Built with **Next.js 16**, **React 19**, **Prisma**, **Tailwind CSS v4 (inline theme)**, and **Framer Motion**. It features animated toasts, optimistic UI, gradient borders, responsive layout, and light/dark adaptive card styling.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Seeding](#database--seeding)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [UI / UX Details](#ui--ux-details)
- [Folder Structure](#folder-structure)
- [Customization](#customization)
- [Roadmap Ideas](#roadmap-ideas)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Domain | Description |
| ------ | ----------- |
| Inventory | View all drinks with stock, price, and image |
| Purchase Flow | Optimistic stock decrement + toast feedback |
| Restocking | Single or batch restock via REST endpoint |
| Animated Feedback | Framer Motion transitions + processing overlay |
| Toast System | Success / error / info toasts with auto-dismiss |
| Skeleton Loading | Shimmer placeholders during initial fetch |
| Responsive Grid | 1 / 2 / 3 columns (mobile / tablet / desktop) |
| Gradient Branding | Theming for headers & borders |
| Adaptive Cards | Solid white in light mode, glass blur in dark mode |

---

## Tech Stack

- **Next.js 16 (App Router)**
- **React 19**
- **TypeScript**
- **Prisma** (PostgreSQL)
- **Tailwind CSS v4 (inline @theme)**
- **Framer Motion** (animations)
- **Supabase** (Remote DB hosting)
- **next/font** (Plus Jakarta Sans, Geist)

---

## Architecture Overview

- **App Router**: All routing under `app/` (no legacy pages directory).
- **Data Layer**: Prisma models (`prisma/schema.prisma`) + generated client output directed to `app/generated/prisma`.
- **API Routes**:
  - `app/api/buy/route.ts` (POST)
  - `app/api/restock/route.ts` (GET/POST single & batch)
- **Client UI**: `app/page.tsx` is a client component (fetch + optimistic mutations).
- **State & Feedback**:
  - Toasts via context provider (`ToastProvider`)
  - Optimistic mutation pattern for instant feedback
- **Styling**:
  - Tailwind with inline theme variables
  - Custom gradient + animated borders using CSS layered backgrounds
- **Image Handling**:
  - External remotePatterns configured in `next.config.ts` for allowed domains
  - Fallback logo/image reference in case of missing drink images
- **Supabase**:
  - Remote DB hosting for data storage

## UI / UX Details

| Element | Behavior |
| ------- | -------- |
| Cards | Animated entrance, gradient border, angle shift on hover |
| Pending Overlay | Semi-transparent layer + pulse indicator while mutation in flight |
| Toasts | Auto-dismiss, accessible `aria-live` region |
| Skeletons | Pulsing placeholders before initial load |
| Gradient Border | Layered background with CSS custom property `--card-angle` |
| Light vs Dark | Media query driven style for card fill (solid vs glass) |

**Energy Stock** – fast UX, clean code, and extensible architecture.
