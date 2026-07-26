# Quote Depot — Goal

Multi-user RFQ (request for quote) app for warehouse / logistics organizations.

## Core workflow

1. User signs in (Amazon Cognito: email/password + Google).
2. On first sign-in: create an organization, accept an invite, or request to join an existing org.
3. Org members create **Requests** (open RFQs) with a public share link.
4. Guests (or signed-in users) submit **Quotes** on `/r/{slug}`.
5. Admins/Owners move quotes through: `Draft → Submitted → Under Review → Accepted | Rejected`.
6. Accepting a quote atomically rejects other active quotes and closes the request.
7. Owner/Admin can review a lightweight audit trail and manage membership.

## Roles

| Role | Capabilities |
| ---- | ------------ |
| Owner | Full org control; exactly one (creator) |
| Admin | Invite/revoke members, approve joins, manage requests/quotes, accept quotes |
| Member | Create/manage requests; view quotes; no membership admin |

## Non-goals for MVP

- Multi-region / horizontal scaling
- ALB / managed Postgres
- Heavy analytics
- Design polish during backend phases (deferred to end)
