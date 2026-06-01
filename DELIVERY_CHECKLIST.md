# Delivery Checklist

This project already includes the core application stack:

- FastAPI backend
- React frontend
- PostgreSQL via Docker Compose
- Dockerfiles for frontend and backend
- Environment variable templates
- Product, customer, order, and inventory features

## Completed locally

- [x] Products CRUD with unique SKU validation
- [x] Customers CRUD with unique email validation
- [x] Orders API with stock validation before checkout
- [x] Automatic stock deduction when orders are created
- [x] Order rejection when stock is insufficient
- [x] Inventory tracking in the React UI
- [x] Docker Compose setup for frontend, backend, and PostgreSQL
- [x] Backend test suite covering duplicate SKU, duplicate email, stock deduction, insufficient stock rejection, and stock restoration on cancellation
- [x] GitHub Actions workflow for publishing frontend and backend Docker images to GHCR
- [x] Production cleanup: rely on Alembic migrations instead of runtime `create_all()`
- [x] Repository cleanup: removed malformed scaffold directories from the workspace

## Still requires an external account or manual release step

- [ ] Create a standalone GitHub repository for this folder
- [ ] Push the code to GitHub
- [ ] Trigger the Docker publish workflow or build and push images manually
- [ ] Deploy the backend to a public host such as Railway, Render, or Fly.io
- [ ] Deploy the frontend to a public host such as Vercel, Render, or Netlify
- [ ] Fill in the final public URLs below

## Final deliverables

- GitHub repository: `https://github.com/aayush1233333/inventory-system-complete`
- Backend Docker image: `TBD`
- Frontend Docker image: `TBD`
- Live frontend URL: `TBD`
- Live backend URL: `TBD`

## Suggested handoff sequence

1. Create a new GitHub repository and push this folder into it.
2. Add the repository to your preferred host.
3. Set environment variables from `.env.example`.
4. Deploy the backend first and copy its public URL.
5. Set `REACT_APP_API_URL` to the public backend URL and deploy the frontend.
6. Update this file with the final links.
