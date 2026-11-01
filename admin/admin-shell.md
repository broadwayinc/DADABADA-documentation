# Admin Shell

The admin shell is the terminal tool of the operating system user who runs DADABADA. With it that user adds users and sets their access levels, reads and deletes any record, manages agent keys, backs up, exports and imports, and turns the Web Admin on or off. It reaches the server through a Unix socket in the data folder, never over the network, and no access level gives a network user these powers.

```bash
$ ddbd admin --data /srv/dadabada
```

```
DADABADA admin shell. Type `help` for commands.
ddbd admin> user add alice --level 10
Password for alice: ...
Added alice (user id DS4gIE0n, level 10).
ddbd admin> status
ddbd admin> exit
```

Prompt: `ddbd admin>`. Options can be written with a space or with `=`: `--level 10` or `--level=10`. `help` lists the commands; `exit`, `quit` or Ctrl-D leaves. Where a command takes `<username>`, a username or a user id works. Errors are printed as `<code>: <message>`, for example `NOT_FOUND: There is no user "bob".`

## Users

| command | options | what it does |
|---|---|---|
| `user add <username>` | `--level <level>` (default `00`), `--password <password>` (asked with `Password for <username>:` if missing, typed in the clear; must not be empty) | adds a user. Usernames: 1 to 256 characters, no spaces or control characters, unique |
| `user list` | `--json` | username, user id, level, records, subscribers, subscribed |
| `user info <username>` | | one user as JSON |
| `user level <username> <level>` | | sets the level (`00` to `99`) |
| `user del <username>` | `--yes` skips the confirmation | deletes the account and ends its sessions at once; their records, grants, subscriptions, agent keys, feed and notifications are removed in the background. Without `--yes` you must type the username |

There is no sign-up and no password reset: every account is made here (or on the Users page of the [Web Admin](/admin/web-admin)), and a user who lost the password gets a fresh account with `user del` and `user add`. See [Login and Sessions](/users/login).

```bash
$ ddbd admin --data /srv/dadabada user add alice --level 10
$ ddbd admin --data /srv/dadabada user list
$ ddbd admin --data /srv/dadabada user level alice 20
$ ddbd admin --data /srv/dadabada user del alice --yes
```

## One command or the shell

`ddbd admin` runs one command when it is given on the command line, and opens the shell when it is not.

| form | what happens |
|---|---|
| `ddbd admin --data <folder> status` | runs `status`, prints the answer, exits. Good for scripts and cron |
| `ddbd admin --data <folder>` | opens the shell; type commands until `exit` |

Both work only while the server runs. Put `--data` before the command. The shell talks to the server over a Unix socket, `admin.sock`, in the data folder (mode 0600), and the server answers only connections from the operating system user who started it. From another account, run it as that user:

```bash
$ sudo -u dadabada ddbd admin --data /srv/dadabada status
```

::: warning
Only the OS user can use the socket. There is no admin password for the shell and no network path to it: the admin API of the [Web Admin](/admin/web-admin) is a separate, password-protected thing that the admin turns on with `web-password` from here.
:::

## Records

| command | options | what it does |
|---|---|---|
| `records` | `--collection <collection>`, `--user <username>`, `--level <level>` (or `**`), `--limit <number>` (1 to 1000, default 50), `--asc` (oldest first; default newest first), `--json` | lists every record, private ones included |
| `record get <record id>` | | one record as JSON |
| `record del <record id>` | | deletes one record (read-only ones too) |
| `query '<json>'` | `--json` | runs a [`getRecords`](/api-reference/database#getrecords) body with admin rights |
| `more` | | next page of the last listing (`records`, `query` or a catalog listing) |

The admin reads every record whatever its level, including `**`, and deletes any record, including read-only ones. `query` takes the same JSON a client would send:

```
ddbd admin> query '{"query":{"collection":"products","index":{"name":"price","value":1000,"condition":">="}},"fetch":{"limit":20}}'
```

## Catalog

`<op>` is one of `=`, `>`, `<`, `>=` (starts with), `<=` (ends with). A single word without `<op>` means `=`. Nothing means all.

| command | options |
|---|---|
| `collections [<op> <text>]` | `--json` |
| `tags <collection> [<op> <text>]` | `--json` |
| `indexes <collection> [<op> <text>]` | `--order <order>` (see [`getIndexes`](/api-reference/database#getindexes)), `--json`. A name ending in `.` lists its children |
| `uniques [<op> <text>]` | `--json` |

```
ddbd admin> collections >= prod
ddbd admin> indexes products shop.
ddbd admin> indexes products --order number_of_records
```

## Agent keys

| command | options | what it does |
|---|---|---|
| `agents` | `--user <username>` | lists agent keys (all, or one user's) |
| `agent revoke <key id>` | | revokes any user's key |

Users make and revoke their own keys over the API (see [Agent Keys](/users/agent-keys)); the admin sees all of them and can revoke any. The key strings themselves are never shown.

## Server

| command | options | what it does |
|---|---|---|
| `status` | | version, data folder, port, TLS, counts (users, records, collections, sessions, connections, requests, listeners), outbox depth, limits in force, whether the Web Admin is on and its session count, loose-rule versions |
| `backup <folder>` | | a consistent copy of the database while it runs. `<folder>` must not exist. A copy of the settings file is put inside as `dadabada.toml.copy` |
| `secret rotate` | `--yes` skips the confirmation | makes a new server secret; every private access key stops working. Without `--yes` you must type `rotate` |
| `rebuild-loose` | | rewrites every loose-match key with this build's rules |
| `settings` | | the settings file path and every setting in force; a setting whose saved value differs is marked `(saved <value>, applies on next start)` |
| `web-password` | `--password <password>` (asked if missing, typed in the clear) | turns the Web Admin on, or changes its password (at least 8 characters). Signs out every web admin session |
| `web-password off` | | turns the Web Admin off and signs out every web admin session |
| `export <file>` | `--collection <collection>`, `--user <username>` | writes JSON lines (see [Operations](/admin/operations#export-file-format)) and reports the counts. The folder must exist |
| `import <file>` | `--replace` (overwrite existing users and records), `--skip-existing` (the default) | loads an export. Reports counts, skipped and failed lines, and the first 20 failed lines with their line numbers |

```bash
$ ddbd admin --data /srv/dadabada backup /srv/backups/dadabada-2026-10-29
$ ddbd admin --data /srv/dadabada export /srv/exports/all.jsonl
$ ddbd admin --data /srv/dadabada export /srv/exports/products.jsonl --collection products
$ ddbd admin --data /srv/dadabada import /srv/exports/all.jsonl --replace
$ ddbd admin --data /srv/dadabada web-password
```

`backup`, `export` and `import` take paths on the server machine, and the server process reads or writes the files, so it needs permission there. `export` and `import` resolve a relative path against the folder the command is run in; `backup` passes `<folder>` to the server as written, so give it an absolute path. How to restore a backup, and the export file format, are on the [Operations](/admin/operations) page. Which settings apply at once and which wait for the next start is on the [Settings](/admin/settings) page.

Changing settings, saving records as a user, and the batch deletes have no shell command; they are on the [Web Admin](/admin/web-admin) and in its admin API.
