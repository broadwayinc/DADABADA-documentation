# Users

Every read and every write in DDBD is done by a user. There is no anonymous access: a request without a signed-in user is refused, and even records at the lowest access level, `00`, are readable only by users. Understanding users is therefore the first step to using the database at all.

## Why the database needs users

- **Every record belongs to the user who wrote it.** The writer decides who can read it (its access level, private, grants) and how it can be found (its indexes, tags and collection). This is [WBAC](/introduction/what-is-ddbd#wbac-writer-based-access-control), and it only works because every write comes from a known user.
- **A user's level decides what they can read and write.** Each user has an access level from `00` to `99`, set by the admin. A user reads records at or below their level, plus their own records and records granted to them, and saves records at levels up to their own. See [Access levels](/database/access-levels).
- **The admin is not a user.** The admin, meaning the operating system user who runs DDBD or anyone signed in to the [Web Admin](/admin/web-admin), adds users, changes their levels and settings, and can look at everything. But apps, scripts and AI agents never use the admin: they sign in as users and go through the API, with the rules of that user.
- **There is no sign-up.** Users exist only because the admin added them, on the Users page of the Web Admin or with `user add` in the [Admin Shell](/admin/admin-shell#users). A user who forgets the password is deleted and added again; nobody can reset it.

## In this section

**[Login and sessions](/users/login).** A user signs in with `login` (username and password) and gets a session token, an `s_...` string sent on every following request as `Authorization: Bearer <token>`. A session ends after 24 hours without use, on `logout`, or when the user is deleted. `whoami` tells who is signed in. Repeated wrong passwords slow down further sign-ins for that username and address.

**[Agent keys](/users/agent-keys).** A user can make keys for AI agents and scripts, so the password is never shared. A key works like a session token without signing in, and can be capped: to a highest access level, to read-only, to some collections, with or without private records, and with an expiry. Records written with a key belong to the user and name the key. A key can be revoked at any time.

**[Client-side encryption](/users/encryption).** DDBD stores record data as plain JSON and never encrypts it. When data must stay secret even from the admin and from backups, the app encrypts it before saving, with a key derived from the user's password; the server provides the salt and the settings for that derivation, so every device the user signs in on derives the same key.
