# SmartServe

## Overview
SmartServe is a **production‑ready** restaurant automation platform consisting of three independent React front‑ends (Customer, Kitchen, Admin) and a FastAPI backend. This repository contains the full project scaffold; business logic, authentication, APIs, and UI pages will be added in later milestones.

---

### Repository Structure
`
SmartServe/
├─ README.md                # Project overview (this file)
├─ .gitignore               # Git ignore rules
├─ docker-compose.yml       # Docker compose to run all services
├─ tailwind.config.cjs      # Tailwind CSS configuration (shared)
├─ postcss.config.cjs       # PostCSS configuration (shared)
├─ customer-app/            # React Vite app – Customer Panel
├─ kitchen-app/             # React Vite app – Kitchen Panel
├─ admin-app/               # React Vite app – Admin Panel
└─ backend/                 # FastAPI backend service
`

---

### Development
1. Install Node 20+ and Python 3.11+.
2. Follow the README files inside each *-app folder and the ackend folder for setup instructions.

---

*This scaffold is intentionally minimal and contains no business‑logic code.*
