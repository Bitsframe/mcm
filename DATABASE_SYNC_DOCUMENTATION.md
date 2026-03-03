# Database Synchronization System Documentation

## Overview

This system provides automatic, real-time synchronization of database changes from a parent (main) project to a child (subset) project. Currently configured to sync the `forms` table only.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PARENT PROJECT                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Route (app/api/forms/route.ts)                │    │
│  │  - POST (Create)                                    │    │
│  │  - PUT (Update)                                     │    │
│  │  - DELETE (Delete)                                  │    │