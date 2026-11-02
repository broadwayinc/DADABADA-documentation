# Operations

DDBD runs as one process on one machine. This page covers installing and upgrading it, and what an operator does after [`init`](/admin/command-line#ddbd-init): running it as a service, stopping it, changing settings, running without TLS or behind a proxy, backing up and restoring, resetting, the export file format, and reading the log.

## Installing, upgrading and removing

DDBD runs on Linux and on macOS. On macOS, Homebrew installs it: see [On macOS](#on-macos). On Linux it runs on x86_64 or arm64 processors, with glibc 2.34 or newer: for example Ubuntu 22.04 or 24.04, Debian 12, RHEL 9 or Amazon Linux 2023. Install it with:

```bash
$ curl -fsSL https://cdn.broadwayinc.com/get/ddbd/v1 | sh
```

The installer checks the system, downloads the build for its processor, checks the download against its SHA-256 checksum, and installs:

| what | where |
|---|---|
| the program | `/usr/local/bin/ddbd` (with sudo, which may ask for your password) |
| the license files (`LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`) | `/usr/local/share/doc/ddbd` |

Without sudo, it uses `~/.local/bin` and `~/.local/share/doc/ddbd` instead, and says how to add `~/.local/bin` to your `PATH`. On an unsupported system it stops and says why, without installing anything. It never touches data folders.

Two settings change what it does. Put them before `sh`:

| setting | example | effect |
|---|---|---|
| `DDBD_VERSION` | `curl -fsSL https://cdn.broadwayinc.com/get/ddbd/v1 \| DDBD_VERSION=0.2.0 sh` | installs that version instead of the newest |
| `DDBD_INSTALL_DIR` | `curl -fsSL https://cdn.broadwayinc.com/get/ddbd/v1 \| DDBD_INSTALL_DIR=/opt/ddbd/bin sh` | installs the program into that folder; the license files go to `/opt/ddbd/share/doc/ddbd` |

Check the installed version with `ddbd version`, which prints `ddbd x.x.x`. In the [Web Admin](/admin/web-admin#tools), the **Tools** screen shows the version the running server was started with (which stays the old one until the server restarts after an update), and **[Check for updates]** there tells whether a newer release is out.

### Upgrading

Run the install command again (with Homebrew, `brew upgrade ddbd`). It replaces the program with the newest version and leaves every data folder as it is. A running server keeps using the old program until it restarts, so restart it afterwards: **Restart** on the Tools page of the [Web Admin](/admin/web-admin) restarts it in place, `ddbd restart --data <folder>` restarts it in your terminal, `sudo systemctl restart ddbd` restarts the systemd service, and `brew services restart ddbd` the Homebrew one.

::: tip Coming from DADABADA 0.1.x
DDBD was called DADABADA up to version 0.1.4. The names changed with 0.2.0: the settings file is `ddbd.toml`, the environment variable `DDBD_DATA`, the default data folder `./ddbd-data`, `ddbd connect` keeps trusted certificates in `~/.config/ddbd`, and releases come from `https://cdn.broadwayinc.com/get/ddbd`. The old install command keeps installing 0.1.4. To move a server over:

1. Install DDBD with the command above.
2. Stop the server and rename the settings file in its data folder: `mv <folder>/dadabada.toml <folder>/ddbd.toml`. Until then, `ddbd start` refuses the folder and says so. Users, passwords, records, agent keys and sessions carry over as they are.
3. In service units and scripts, change `DADABADA_DATA` to `DDBD_DATA` and `/usr/local/bin/dadabada` to `/usr/local/bin/ddbd`, then start the server.
4. Remove what the old installer left: `sudo rm -f /usr/local/bin/dadabada` and `sudo rm -r /usr/local/share/doc/dadabada`. On machines that use `ddbd connect`, `mv ~/.config/dadabada ~/.config/ddbd` keeps the certificates it trusted.
:::

### Installing without the install script

On a machine that cannot run the script (no internet access, or a review step before anything is installed), download the files by hand. Each version has one archive per system and processor, plus its checksum:

```
https://cdn.broadwayinc.com/get/ddbd/<version>/ddbd-<version>-<system>-<processor>.tar.gz
https://cdn.broadwayinc.com/get/ddbd/<version>/ddbd-<version>-<system>-<processor>.tar.gz.sha256
```

`<system>` is `linux` or `macos`; `<processor>` is `x86_64` or `aarch64` (`aarch64` is Apple Silicon on a Mac), and the newest `<version>` is the text at `https://cdn.broadwayinc.com/get/ddbd/latest`. For version 0.2.0 on Linux x86_64:

```bash
$ curl -fsSLO https://cdn.broadwayinc.com/get/ddbd/0.2.0/ddbd-0.2.0-linux-x86_64.tar.gz
$ curl -fsSLO https://cdn.broadwayinc.com/get/ddbd/0.2.0/ddbd-0.2.0-linux-x86_64.tar.gz.sha256
$ sha256sum -c ddbd-0.2.0-linux-x86_64.tar.gz.sha256
$ tar -xzf ddbd-0.2.0-linux-x86_64.tar.gz
$ sudo install -m 0755 ddbd-0.2.0-linux-x86_64/ddbd /usr/local/bin/ddbd
```

`sha256sum -c` must answer `ddbd-0.2.0-linux-x86_64.tar.gz: OK`; if it does not, the download is damaged, so download it again. The folder also holds `LICENSE`, `NOTICE` and `THIRD-PARTY-NOTICES`.

On a Mac, check the download with `shasum -a 256 -c` instead of `sha256sum -c`, and download it with `curl` as above, not with a web browser: macOS refuses to run a program that came from a browser and is not notarized by Apple.

### Removing

```bash
$ sudo rm /usr/local/bin/ddbd
$ sudo rm -r /usr/local/share/doc/ddbd
```

This removes the program only. Data folders stay; delete one with `rm -r <data folder>` when its data is no longer needed (see [Resetting the database](#resetting-the-database)).

### On macOS

DDBD runs on macOS 11 or newer, on Apple Silicon or Intel. Install it with [Homebrew](https://brew.sh):

```bash
$ brew install broadwayinc/ddbd/ddbd
```

Homebrew downloads the build for the Mac's processor, checks it against its SHA-256 checksum, and installs:

| what | where |
|---|---|
| the program | `$(brew --prefix)/bin/ddbd`: `/opt/homebrew/bin` on Apple Silicon, `/usr/local/bin` on Intel |
| the license files (`LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`) | `$(brew --prefix ddbd)` |
| a data folder, for [running it as a service](#on-macos-with-homebrew) | `$(brew --prefix)/var/ddbd`, listening on `127.0.0.1:7070`: this Mac only, plain HTTP |

The data folder is made once, as `ddbd init --data "$(brew --prefix)/var/ddbd" --bind 127.0.0.1` would make it, and is kept as it is when DDBD is upgraded, reinstalled or removed. To serve other machines from it, change `bind` in its `ddbd.toml` and restart. You can also make other data folders with `ddbd init`, as on Linux.

Upgrade with `brew upgrade ddbd`, then restart the server (above). Homebrew always installs the newest version; for another one, install it by hand (above). Remove it with:

```bash
$ brew services stop ddbd
$ brew uninstall ddbd
```

The data folder stays; delete it with `rm -r "$(brew --prefix)/var/ddbd"` when its data is no longer needed. Homebrew on Linux installs and removes DDBD the same way.

## Running as a service

On Linux, a systemd unit runs `ddbd start` as its own user and restarts it on failure:

```ini
# /etc/systemd/system/ddbd.service
[Unit]
Description=DDBD
After=network.target

[Service]
User=ddbd
ExecStart=/usr/local/bin/ddbd start --data /srv/ddbd
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

The data folder must already exist (made with `ddbd init` as that user). Run admin commands as the same user, because only the OS user who started the server can open the admin socket:

```bash
$ sudo -u ddbd ddbd admin --data /srv/ddbd status
```

`systemctl stop ddbd` sends SIGTERM, which stops DDBD cleanly.

### On macOS, with Homebrew

Homebrew runs DDBD as a service of your own user (with launchd), from the data folder it set up at install:

```bash
$ brew services start ddbd
```

It starts now and at every login, and starts again if it crashes, but not after a clean stop. `brew services stop ddbd` stops it cleanly and keeps it from starting at login; `brew services restart ddbd` restarts it. Its output goes to `$(brew --prefix)/var/log/ddbd.log`. Admin commands take the same data folder:

```bash
$ ddbd admin --data "$(brew --prefix)/var/ddbd" status
```

To leave out `--data`, set `DDBD_DATA` to that folder, for example with `export DDBD_DATA="$(brew --prefix)/var/ddbd"` in `~/.zprofile`.

## Stopping the server

| how | when |
|---|---|
| Ctrl-C in the terminal running `start` | you started it by hand |
| `ddbd stop --data <folder>` | from any terminal, as the operating system user who runs it |
| **Stop** on the Tools page of the [Web Admin](/admin/web-admin) | from a browser, signed in as admin |
| `kill -TERM <pid>` or `kill -INT <pid>` | it runs in the background (find the pid with `pgrep -af "ddbd start"`) |
| `systemctl stop ddbd` | it runs as a systemd service |
| `brew services stop ddbd` | it runs as a Homebrew service (macOS) |

All of them stop it the same clean way:

```
Stopping: refusing new requests, finishing the ones in progress...
Stopped.
```

New connections are refused, every request in progress is finished and answered, the background worker finishes the batch it is on, what is in memory is written to disk, the database is closed, and `admin.sock` is removed. A stop takes about a second, however much background work is waiting: work still in the outbox is kept and continues on the next start, and the last line then says how much:

```
Stopped. 7310 background jobs wait in the outbox; they continue at the next start.
```

Open `listen` streams are ended, and a request still running after 30 seconds is cut off. User sessions survive the restart; web admin sessions do not, so the admin signs in again.

If the process is killed hard (`kill -9`), no saved record is lost: the storage engine replays its write-ahead log on the next start, and the outbox picks up where it stopped. Writes are not flushed to disk one by one, so after a power loss or an operating system crash the last writes before it can be missing. A leftover `admin.sock` is replaced on the next start.

## Restarting the server

| how | where it runs afterwards |
|---|---|
| `ddbd restart --data <folder>` | in the terminal where you typed it, in the foreground |
| **Restart** on the Tools page of the [Web Admin](/admin/web-admin) | where it ran before: the same process id, the same terminal or log file, the same options |
| `systemctl restart ddbd` | as the service |

Each one stops the server cleanly first, then starts it. The Web Admin restart starts the program file found at the same path again, so after building or copying a new version there, **Restart** is how to switch to it without touching the server machine. Every web admin session ends on a restart, so the admin signs in again; user sessions and agent keys keep working.

## Changing the configuration

| way | what it changes | when it applies |
|---|---|---|
| edit `<data folder>/ddbd.toml`, then restart (stop + `start`) | every setting (see [Settings](/admin/settings)) | on the next start |
| `ddbd start --notify-keep <duration> --private-key-ttl <duration> --max-indexes <number> --max-tags <number>` | those four, for this run only (the file is not changed) | now, until the next start without them |
| Web Admin, Settings page | every setting; saved to `ddbd.toml` | `session_idle_hours`, `notify_keep`, `private_key_ttl`, `login_free_attempts`, `login_max_delay`, `max_indexes`, `max_tags`, `admin_session_idle_minutes` at once; `port`, `bind`, `tls`, `tls_cert`, `tls_key` and `[rocksdb]` on the next start |
| `ddbd admin --data <folder> settings` | (shows) every setting in force, and saved values waiting for the next start | |
| `ddbd admin --data <folder> user ...`, `web-password`, `secret rotate` | users and levels, the web admin password, the private-key secret | at once |

Notes:

- `init` options (`--port`, `--bind`, `--tls`) only set the first values; after that, change `ddbd.toml` (or the Web Admin), not `init`.
- To move to another port: change `port`, restart, and tell clients the new address. The certificate stays the same, but `ddbd connect` remembers trusted fingerprints per address (`<server address>:<port>`), so it asks once to trust the server at the new port.
- To use your own certificate (one from a public certificate authority removes the browser warning): set `tls_cert` and `tls_key` to its PEM files and restart. `ddbd connect` refuses a server whose certificate changed; delete that server's line in `~/.config/ddbd/known_hosts` and connect again to trust the new one.
- To make a new self-signed certificate: run `ddbd init --data /tmp/dd-cert` (a throwaway folder; it also gets an empty database), stop the server, copy `/tmp/dd-cert/tls/cert.pem` and `key.pem` over the files in `<data folder>/tls/`, start again, and delete `/tmp/dd-cert`. `start` prints the new fingerprint; clients must trust it again as above.
- A setting the server cannot use (a bad duration, a busy port, missing certificate files) stops `start` with a message saying which one; nothing is half-started.

## Running on plain HTTP

TLS is off by default: `init` sets up plain HTTP unless it is given `--tls`. Plain HTTP is for `127.0.0.1`, a private network you trust, or behind a reverse proxy or load balancer that serves HTTPS and forwards to DDBD. Behind such a proxy, DDBD must run with `tls = false`: with TLS on it refuses every plain HTTP request the proxy forwards (see [Plain HTTP on a TLS port](#plain-http-on-a-tls-port)).

To choose:

| database | plain HTTP | HTTPS served by DDBD |
|---|---|---|
| new | `ddbd init --data <folder>` (the default) | `ddbd init --data <folder> --tls` |
| existing | set `tls = false` in `<data folder>/ddbd.toml` (or untick TLS in the Web Admin's Settings) and restart. Certificate files stay, so TLS can be turned back on later | set `tls = true` (or tick TLS in Settings) and restart. A self-signed certificate is made if none exists |

Over plain HTTP, use `http://<server address>:<port>/` in the browser (on the server itself, `http://localhost:7070/`) and `ddbd connect <server address>:<port>`. When DDBD serves HTTPS itself, use `https://` and `ddbd connect <server address>:<port> --tls`.

What changes over plain HTTP:

- **Everything is readable on the way**: user and web admin passwords at sign-in, session tokens, agent keys and record data. Anyone between the client and the server can read them, and a stolen admin token gives full control until it expires. Never use plain HTTP across the internet.
- **"Copy JSON" and "Copy request" in the Web Admin stop working**: browsers only allow clipboard access on HTTPS pages (or `localhost`). Select the text by hand instead.
- Everything else works the same: the API, the Web Admin, queries, live notifications, sessions, agent keys.

### Plain HTTP on a TLS port

When TLS is on and a request arrives in plain HTTP (someone opens `http://localhost:7070/` by mistake, or a proxy forwards plain HTTP), DDBD notices (a TLS connection always starts with the same first byte) and answers in plain HTTP instead of staying silent. It never redirects to `https://` and never runs the request: whatever was sent already crossed the network in the clear, so the sender must be fixed.

| request | answer |
|---|---|
| GET or HEAD (a browser opening the address) | `400` with a short text page: `This server only speaks HTTPS. Open https://<server address><path> instead.` |
| any other method (an API call) | `400 USE_HTTPS` naming the `https://` address; the request is **not** run |

```json
// Response to POST http://localhost:7070/v1/login on a server with TLS on
{
  "error": {
    "code": "USE_HTTPS",
    "message": "This server only speaks HTTPS; the request was not run. Send it to https://localhost:7070/v1/login. Anything sent over plain HTTP (passwords, tokens, keys) may have been seen by others."
  }
}
```

`<server address>` is the request's `Host` header (with the port) and `<path>` its path and query. A request without a `Host` header gets the same answers with `https://<this host>:<port>/` written as is, because the server cannot tell which address the client used. The server log shows these requests as `plain-http`, with `USE_HTTPS` in the error column. With TLS on, a connection that sends nothing within 10 seconds of opening is closed.

### Behind a TLS proxy

Keep DDBD on plain HTTP bound to `127.0.0.1` (`bind = "127.0.0.1"`, `tls = false`) and let the proxy serve HTTPS and forward requests to `127.0.0.1:7070`. A proxy or load balancer that handles HTTPS and forwards plain HTTP needs DDBD to run with `tls = false`; with `tls = true`, every request it forwards is refused with `400` (see [Plain HTTP on a TLS port](#plain-http-on-a-tls-port)). Two more things to know:

- The proxy must pass `GET /v1/listen` through without buffering the response, or live notifications arrive late or not at all.
- DDBD sees every request coming from the proxy's address. The address recorded on each record (`ip`) is then the proxy's, and the failed-login slowdown counts all clients together under that one address (see [Login and Sessions](/users/login#failed-login-slowdown)).

## Backup and restore

`backup <folder>` in the [Admin Shell](/admin/admin-shell#server) (or **Back up** on the Web Admin's Tools page) writes a consistent copy of the database while the server runs. `<folder>` must not exist; give an absolute path, because the server process creates it. A copy of the settings file is put inside as `ddbd.toml.copy`.

```bash
$ ddbd admin --data /srv/ddbd backup /srv/backups/ddbd-2026-10-29
```

To restore:

1. Stop the server (see [Stopping the server](#stopping-the-server)).
2. Replace the data folder's `db` folder with the backup folder.
3. Start again.

The backup includes users, sessions, agent keys, the web admin password and the server secret, so after a restore every password, session token, agent key and private access key that worked at backup time works again (unless it has expired since).

::: tip Backup or export?
A backup is a copy of the database files for this version of DDBD: complete, and restored by swapping folders. An export is JSON lines you can read, filter by collection or user, and import into another server. Keep backups for recovery and exports for moving data. Both are made while the server runs.
:::

## Resetting the database

::: danger
This deletes data permanently. Make a backup or an export first.
:::

**Empty the database but keep the settings and certificate** (port, TLS and pinned fingerprints keep working):

```bash
# 1. stop the server
$ rm -rf <data folder>/db
$ ddbd start --data <data folder>
```

`start` creates a new, empty database. Gone: every user, record, grant, subscription, agent key, notification, session, the web admin password and the private-key secret. Kept: `ddbd.toml` and `tls/`. Add users and set the web admin password again.

**Start completely over** (new settings and a new certificate; clients must trust the new fingerprint):

```bash
# 1. stop the server
$ rm -rf <data folder>
$ ddbd init --port 7070 --data <data folder>
$ ddbd start --data <data folder>
```

**Remove only some data** without resetting: delete users (`user del`, which removes their records too), delete records (`record del`, or [`deleteRecords`](/api-reference/database#deleterecords) by query, or the Web Admin's Tools page), or export what you want to keep, reset, and import it back.

## Export file format

`export <file>` writes one JSON object per line, each with a `type`:

| type | fields |
|---|---|
| `user` | `user_id`, `username`, `level` (a number), `pw_hash`, `enc_salt`, `created`, and the counters `records`, `subscribers`, `subscribed` |
| `record` | `record_id`, `user_id`, `agent`, `uploaded`, `updated`, `ip`, `data`, `config` (as for [`postRecord`](/api-reference/database#postrecord)) |
| `grant` | `record_id`, `user_id` |
| `subscription` | `subscription`, `subscriber`, `row` (`get_feed`, `get_notified`, `blocked`, `timestamp`) |
| `agent_key` | `hash` (sha256 of the key), `key` (the agent key shape, with `max_level` as a number) |

The lines come in this order: users, records, grants, subscriptions, agent keys. An export with `--collection` or `--user` holds the matching records, the users who own them, the grants on those records and those users' agent keys, and no subscriptions.

Password hashes move with users, so passwords keep working after an import. `enc_salt` moves too, so client-side encrypted data stays decryptable (see [Client-Side Encryption](/users/encryption)). Agent keys move by their hash, so they keep working. Records keep their ids, so references stay valid. Import checks each record like a normal save (including `max_indexes` and `max_tags` of the importing server); counters are rebuilt in the background. A record whose user is not on the server, and a user whose username belongs to another user id there, fail and are reported by line number. Grants, subscriptions and agent keys are always written, whatever the mode. Sessions, feeds, notifications, the web admin password and the server secret are not exported, so private access keys from the old server do not work on the new one.

`export` takes `--collection <collection>` and `--user <username>` to export part of the data; `import` takes `--replace` (overwrite existing users and records) or `--skip-existing` (the default) and reports counts and up to 20 failed lines. Both are in the [Admin Shell](/admin/admin-shell#server) and on the Tools page of the [Web Admin](/admin/web-admin).

## Reading the log

The server prints one line for everything it does. Nothing switches this on or off.

```
14:36:29  alice        postRecord                   products         3 ms
14:36:30  bob          getRecords                   products         1 ms  NO_ACCESS
14:36:31  carol        login                                         26 ms  UNAUTHORIZED
14:36:35  alice/shop-bot getRecords                   products         1 ms
14:36:40  admin(web)   record_post                  products         1 ms
14:36:44  -            plain-http                                    0 ms  USE_HTTPS
[outbox 0 · req/s 1.1 · conns 4]
```

| column | meaning |
|---|---|
| time | local time, `HH:MM:SS` |
| who | the username, or the username and the key name joined by `/` (`alice/shop-bot`) for an agent key; for `login`, the username that was sent; `admin(web)` for the Web Admin; `-` when there is none (a request with no valid token, or a plain HTTP request) |
| what | the API method (`login`, `postRecord`, `getRecords`, `deleteRecords`, `listen`, ...), the Web Admin command (`adminLogin`, `record_post`, ...), or `plain-http` for a plain HTTP request on a TLS port |
| collection | the collection the request touched, when there is one |
| time taken | how long the server took to answer |
| error | the error code when the request was refused (`NO_ACCESS`, `UNAUTHORIZED`, `INVALID_REQUEST`, `USE_HTTPS`, ...); empty when it succeeded |

The Web Admin pages and files, the Overview page's own log requests, and commands on the admin socket are not logged. Besides request lines there are other kinds: `Ready.` at start, the status line (`[outbox <number> · req/s <number> · conns <number>]`: background work waiting, requests per second, open connections), checked every 10 seconds and printed when it changed, `worker: ...` when background work hits a problem, and `accept failed: ...` when a connection cannot be accepted. The banner printed at start and the messages printed when stopping go to the terminal but not into the log kept in memory.

### Where the lines go

The server writes to its standard output. Where that lands depends on how it was started:

| started how | the log is |
|---|---|
| `ddbd start` in a terminal | on the screen; gone when the terminal closes |
| `ddbd start > ddbd.log 2>&1` | saved to `ddbd.log` (overwritten at each start; use `>>` to append) |
| `nohup ddbd start >> ddbd.log 2>&1 &` | the same, and the server keeps running after you log out |
| as a systemd service | in the journal: `journalctl -u ddbd -f` |
| as a Homebrew service | in `$(brew --prefix)/var/log/ddbd.log` (appended to): `tail -f "$(brew --prefix)/var/log/ddbd.log"` |

So to keep a log file, redirect the output when you start the server:

```bash
$ cd /srv && nohup ddbd start --data /srv/ddbd >> /srv/ddbd.log 2>&1 &
$ tail -f /srv/ddbd.log
```

The server also keeps the last 1000 lines in memory, and the [Web Admin](/admin/web-admin#the-log) shows them live on its Overview screen. Those lines are gone when the server stops; the file is not.

## Good to know

- Each tag stores a copy of every index key of a record, so a query by tag and index reads one key range. The cost is write size: many string indexes times many tags means many small keys per record. Use `max_indexes` / `max_tags` to limit it.
- Counters and listings follow changes a moment later; `[outbox <number>]` in the server terminal shows pending background work.
- Sorting by `$referenced_count` can lag the true count for a moment; the count on each record is always exact.
- DDBD runs on one machine. Memory for cached data is the `[rocksdb] block_cache_mb` setting (see [Settings](/admin/settings)).
