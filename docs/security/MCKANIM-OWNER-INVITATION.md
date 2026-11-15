# McKanim owner invitation — phase 9B.3

**Status: code foundation only, not a live invitation service.**

The product owner has provided the intended McKanim owner-administrator email privately in ChatGPT. **Do not commit the real address to this public repository.** This documentation deliberately contains no personal recipient information or credentials.

## Scope delivered

- `OwnerInvitation` holds an email, tenant-specific restaurant ID, hash of the invitation token and expiry/usage/revocation timestamps.
- `OwnerInvitationService.issueOwnerInvitation` is an **internal-only** method. A platform administrator must be authenticated and authorized before this service can be exposed in any future administrative workflow.
- The token is 32 cryptographically random bytes, encoded as base64url; only its SHA-256 hash is stored in PostgreSQL. Token validity is 24 hours.
- A second invitation for the same email/restaurant revokes the first and creates a fresh token under the same transaction.
- `redeemOwnerInvitation` atomically consumes the token and creates an active `OWNER` staff account scoped to the restaurant; repeated redemption is rejected.
- Passwords use random-salted scrypt (`N=2^17, r=8, p=1`). No shared or seeded password exists.
- Database uniqueness ensures no two simultaneously outstanding invitations for one email and restaurant.

## What is not yet available

- No real invitation has been generated or emailed to the intended recipient.
- No email sender, verified origin, HTTPS invitation URL or delivery tracking is configured.
- No public invitation-creation or redemption HTTP route has been enabled.
- No rate limiting, login endpoint, persistent sessions, password reset, MFA, platform-admin login or role guards exist yet.
- No McKanim production organization, database or live staff account has been created.

Do not present this as a working owner login until the end-to-end identity lifecycle is complete.

## Next release steps

1. Provision a protected staging environment with a configured PostgreSQL database, review and commit versioned migrations, and use separate DB roles for migrations vs runtime.
2. Implement authenticated DineSight platform-administrator onboarding; never allow customer-supplied tenant IDs to create invitations without authorization.
3. Configure an approved transactional email provider, and supply the recipient email via secrets/environment settings. **Never put raw tokens into logs, analytics or a public API response.**
4. Generate invitation links using a separately configured trusted HTTPS base URL, not a request Host header. Use `Referrer-Policy: no-referrer` on invitation pages.
5. Build a publicly reachable **redemption-only** endpoint with strict per-IP/token rate limiting, abuse monitoring, validation and generic failure messages.
6. Implement secure owner login and session management (session rotation, revoke/logout, MFA policy), plus organization/restaurant-scoped authorization on protected routes.
7. Test invite expiry, resend, revocation, duplicate redemption, session hijack attempts, cross-tenant access and disabled organization behavior.

## References

- OWASP Forgot Password Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- NestJS guards: https://docs.nestjs.com/guards
- Prisma v7 transactions: https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions
