# Quote Depot — Monthly cost target (&lt; $20)

Estimates for a single small production box in **us-east-1** (On-Demand Linux). Prices move; re-check the AWS calculator before launch.

## Recommended footprint

| Resource | Choice | Approx. / month |
| -------- | ------ | --------------- |
| Compute | EC2 `t4g.micro` (2 vCPU, 1 GiB, Graviton) | ~$6.13 |
| Disk | 20 GB gp3 EBS | ~$1.60 |
| Public IP | Elastic IP attached to running instance | $0 |
| Auth | Cognito User Pool (email/password) | $0 at MVP scale\* |
| Load balancer | **None** (Nginx on the instance) | $0 vs ~$16 ALB |
| DNS / TLS | Route 53 optional; Let’s Encrypt or Cloudflare free | $0–$0.50 |

**Ballpark total: ~$8–12 / month** before unexpected data transfer.

\* Cognito free tier covers MAU well above early MVP traffic. Overage is per MAU; still typically negligible at this scale.

## What we deliberately skip

- Application Load Balancer (~$16+/mo) — Nginx terminates TLS and reverse-proxies `/api`
- Managed Postgres / RDS — SQLite on the EBS volume
- Multi-AZ / ASG — single instance; accept short downtime for MVP
- CloudFront (optional later) — not required for cost target

## Cost control checklist

1. Prefer `t4g.micro` (arm64). Fall back to `t3.micro` (~$7.50) if you need x86.
2. Keep EBS at 20 GB gp3 unless uploads grow; SQLite + logos stay small.
3. Release unused Elastic IPs (idle EIPs are billed).
4. Stop the instance when not needed in staging (EBS still bills).
5. Do not enable Cognito advanced security features unless required.

## Data transfer note

First ~100 GB/month outbound is typically covered by the AWS free tier allotment or is a few dollars at most for an internal RFQ tool. Heavy public file serving would change this; logos and JSON APIs should not.
