# Command Line

DDBD is one program, `ddbd`. Install it with `curl -fsSL https://cdn.broadwayinc.com/get/ddbd/v1 | sh` on Linux, or `brew install broadwayinc/ddbd/ddbd` on macOS (see [Installing, upgrading and removing](/admin/operations#installing-upgrading-and-removing)). This page lists its subcommands and their options:

```
ddbd <command> [<options>]
```

| command | what it does |
|---|---|
| [`init`](#ddbd-init) | makes a data folder: settings, an empty database and a TLS certificate. Once per database |
| [`start`](#ddbd-start) | runs the server in the terminal. Every time |
| [`stop`](#ddbd-stop) | stops the running server cleanly. Only for the OS user who runs the server |
| [`restart`](#ddbd-restart) | stops the running server, then starts it again in this terminal |
| [`admin`](#ddbd-admin) | runs an admin command or opens the [Admin Shell](/admin/admin-shell). Only for the OS user who runs the server |
| [`connect`](#ddbd-connect) | opens the [User Shell](/admin/user-shell) against a running server, as a user |
| [`debug`](#ddbd-debug) | shows how values are encoded and sorted. Needs no server |
| [`version`](#ddbd-version) | prints the version |

Options can be written with a space or with `=`: `--data /srv/ddbd` or `--data=/srv/ddbd`. `ddbd --help` (or `ddbd <command> --help`) lists the options; `ddbd --version` prints the version. The quick start is two commands:

```bash
$ ddbd init --port 7070 --data /srv/ddbd
$ ddbd start --data /srv/ddbd
```

## `ddbd init`

Makes a data folder with settings and a database, and with `--tls` a TLS certificate.

```
ddbd init [--port <port>] [--bind <address>] [--data <folder>] [--tls]
```

| option | type | default | meaning |
|---|---|---|---|
| `--port` | number | `7070` | port to listen on |
| `--bind` | address | `0.0.0.0` | address to listen on; `127.0.0.1` = this machine only |
| `--data` | folder | `./ddbd-data` (or env `DDBD_DATA`) | data folder to create |
| `--tls` | switch | off (plain HTTP) | DDBD serves HTTPS itself, with a self-signed certificate made now. Without it, DDBD speaks plain HTTP, which is meant for `localhost` or for running behind a load balancer or proxy that serves HTTPS |

The folder gets mode 0700. Inside it:

| path | what it is |
|---|---|
| `ddbd.toml` | the settings file (see [Settings](/admin/settings)) |
| `db/` | the database |
| `tls/cert.pem`, `tls/key.pem` | with `--tls`: the self-signed certificate and its key (key mode 0600) |

With `--tls`, the certificate is made for the names `localhost`, `127.0.0.1` and the machine's host name (from `/etc/hostname`), and `init` prints its SHA-256 fingerprint, which clients can check. Without `--tls` no certificate is made, and `init` warns that DDBD speaks plain HTTP. `init` also creates the empty database and prints the next two commands to run. It refuses a folder that already holds a `ddbd.toml`.

::: tip
`--port`, `--bind` and `--tls` only set the first values. To change them later, edit `ddbd.toml` or use the Web Admin's Settings page, and restart. See [Operations](/admin/operations#changing-the-configuration).
:::

## `ddbd start`

Runs the server in the terminal.

```
ddbd start [--data <folder>] [--notify-keep <duration>] [--private-key-ttl <duration>] [--max-indexes <number>] [--max-tags <number>]
```

| option | type | default | meaning |
|---|---|---|---|
| `--data` | folder | `./ddbd-data` (or env `DDBD_DATA`) | data folder |
| `--notify-keep` | duration | settings file, `1d` | how long missed notifications are kept |
| `--private-key-ttl` | duration | settings file, `1h` | how long a private access key works |
| `--max-indexes` | number | settings file, `0` | most indexes per record; `0` = unlimited |
| `--max-tags` | number | settings file, `0` | most tags per record; `0` = unlimited |

Options override the settings file for this run only; the file is not changed. A duration is a number followed by `ms`, `s`, `m`, `h`, `d` or `w` (`30m`, `12h`, `7d`); a bare number is seconds.

What you see in the terminal:

| output | meaning |
|---|---|
| a banner | version, data folder, address and whether TLS is on, the certificate fingerprint, the admin socket path, the limits in force, and the number of users, records and collections |
| `Ready.` | the server is listening |
| one line per request | time, user (the username and the key name joined by `/`, such as `alice/shop-bot`, for an agent key; `admin(web)` for the Web Admin), method, collection, milliseconds, and an error code if any |
| `[outbox <number> · req/s <number> · conns <number>]` | checked every 10 seconds and printed when it differs from the last one: pending background work, request rate, open connections |

The log lines are explained in [Operations](/admin/operations#reading-the-log). Ctrl-C (SIGINT) or SIGTERM stops it cleanly: new connections are refused, the requests in progress finish, the database closes, and the admin socket file is removed; queued background work continues at the next start. See [Operations](/admin/operations#stopping-the-server). With TLS on, a plain `http://` request to the port is refused and never redirected: it answers `400`, and the request is not run (see [Operations](/admin/operations#plain-http-on-a-tls-port)).

If the loose-match rules of this build differ from the ones stored in the database, the banner says so (`NOTE: loose search rules changed ...`) and tells you to run `rebuild-loose` in the [Admin Shell](/admin/admin-shell#server).

## Why `init` and `start` are separate

`init` is done **once** per data folder; `start` is done **every time** the server runs.

| | `ddbd init` | `ddbd start` |
|---|---|---|
| when | once, when you set up a new database | every time you run the server (after a reboot, from systemd, after changing settings) |
| what it does | creates the data folder (mode 0700), writes `ddbd.toml` with your port, address and TLS choice, makes the TLS certificate and key, creates the empty database and its server secret, prints the certificate fingerprint | reads `ddbd.toml`, opens the existing database, listens on the port and the admin socket, runs until stopped |
| on an existing folder | refuses (`<folder> is already set up. Start it with: ddbd start --data <folder>`) | runs it |
| on a missing folder | creates it | refuses (``Could not read <folder>/ddbd.toml: ... Run `ddbd init --data <folder>` first.``) |
| changes anything on disk | yes, it creates everything | `start` itself writes no settings and no certificate; it writes the database and the admin socket while running |

Why two steps instead of one command that does both:

- **Setup must never repeat by accident.** If starting also set up, a restart could make a new certificate, and every client that pinned the old fingerprint would refuse to connect; or it could rewrite the settings you edited.
- **A mistyped folder fails loudly.** `start --data /srv/dadabdaa` (typo) stops with an error. If `start` created missing folders, it would quietly start a new, empty database, and users would think their data was gone.
- **Choices made once are kept.** Port, address and TLS are chosen at `init` and saved; `start` needs no options, so a service manager only ever runs `ddbd start --data <folder>`.
- **One process per database.** `start` refuses if the database is already open in another DDBD process, so two servers can never write the same files.

## `ddbd stop`

```
ddbd stop [--data <folder>]
```

Stops the running server cleanly, the same way as Ctrl-C: it refuses new requests, finishes the ones in progress, closes the database and removes `admin.sock`. Queued background work stays in the outbox and continues at the next start, so a stop takes about a second. The command asks the server over the admin socket, so only the operating system user who runs the server can use it, and it works however the server was started (in a terminal, in the background or as a service). It waits until the server process has ended:

```
Stopping DDBD (pid 214013): it finishes the requests in progress first...
Stopped.
```

| option | default | meaning |
|---|---|---|
| `--data <folder>` | `$DDBD_DATA`, else `./ddbd-data` | the data folder of the server to stop |

When no server is running for that folder, it says so and exits with status 1: `No DDBD is running for /srv/ddbd (could not open /srv/ddbd/admin.sock: ...)`.

For a server that runs as a systemd service, use `systemctl stop ddbd` instead, so systemd knows it was stopped on purpose. For a Homebrew service on macOS, use `brew services stop ddbd`, or it starts again at the next login.

## `ddbd restart`

```
ddbd restart [--data <folder>] [<start options>]
```

Stops the running server (as `ddbd stop` does), then starts it again **in this terminal**, in the foreground, with the options given here. It takes the same options as [`ddbd start`](#ddbd-start). If no server is running for the folder, it says so and starts one.

A server that was running in the background or in another terminal ends up running in the terminal where `restart` was typed. To restart a server where it already runs (its terminal, its log file, its process id), use **Restart** on the Tools page of the [Web Admin](/admin/web-admin). For a systemd service, use `systemctl restart ddbd`; for a Homebrew service, `brew services restart ddbd`.

## `ddbd admin`

```
ddbd admin [--data <folder>] [<command> ...]
```

With a command, runs it and exits. Without one, opens the [Admin Shell](/admin/admin-shell). It talks to the running server over the admin socket in the data folder, so it works only while the server runs, and only for the operating system user who started it. When the server is not running it stops with `Could not reach DDBD at <folder>/admin.sock (...). Is it running?`. Put `--data` before the command: every word after the command name belongs to the command.

| option | type | default | meaning |
|---|---|---|---|
| `--data` | folder | `./ddbd-data` (or env `DDBD_DATA`) | data folder of the running server |

```bash
$ ddbd admin --data /srv/ddbd user add alice --level 10
$ ddbd admin --data /srv/ddbd status
$ ddbd admin --data /srv/ddbd
```

The last one opens the shell, which waits at its own prompt:

```
ddbd admin>
```

## `ddbd connect`

```
ddbd connect <server address>[:<port>] [<options>] [<command> ...]
```

Opens the [User Shell](/admin/user-shell), or runs one command and exits (signing out afterwards). Put `connect`'s own options before the command: every word after the command name belongs to the command.

| option | type | default | meaning |
|---|---|---|---|
| `<server address>[:<port>]` | address | port `7070` | server address, such as `localhost:7070` |
| `--user` | name | asked (`Username:`) | username |
| `--password` | text | asked (`Password:`, typed in the clear) | password |
| `--key` | `dk_...` | none | sign in with an [agent key](/users/agent-keys) instead of a username and password |
| `--tls` | switch | off | the server serves HTTPS itself (it was set up with `--tls`); the shell then checks its certificate as described below |
| `--trust` | switch | off | on the first connection to an address, trust its certificate without asking (and remember it) |

```bash
$ ddbd connect 127.0.0.1:7070 --user alice
```

Then, at the shell's prompt:

```
alice> post products --index price=1200 --index "title=Desk Lamp" --tags sale --data '{"color":"red"}'
alice> get products --index "price >= 1000"
```

With `--tls`, on the first connection to an address the shell shows the certificate fingerprint and asks `Certificate fingerprint SHA256 ... - trust it? (yes/no)`; only `yes` continues. Trusted fingerprints are kept in `$XDG_CONFIG_HOME/ddbd/known_hosts` (normally `~/.config/ddbd/known_hosts`), one `<server address>:<port> <fingerprint>` per line. If a server's certificate later changes, the connection is refused (`the server certificate changed (expected ..., got ...)`), and `--trust` does not override it; delete that line to trust the new certificate.

## `ddbd debug`

Shows how values are encoded. It does not need a server.

| form | shows |
|---|---|
| `debug key <name> <value>` | the index key bytes for one value |
| `debug sort <value> <value> ...` | the values in the order the database keeps them |
| `debug num <number> ...` | the 8 sortable bytes of each number, and the number decoded back |
| `debug loose <text>` | the loose form, its reverse, and the Korean initials form; says if the text would search initials |
| `debug reverse <text>` | the name reversed per `.` segment, and the text reversed |
| `debug id <user id>` | a sample record id and the time it carries |

Values are numbers if they read as numbers (negative ones too: `ddbd debug sort -1.5 2`), `true`/`false` as booleans, otherwise strings.

## `ddbd version`

Prints `ddbd` and the version.
