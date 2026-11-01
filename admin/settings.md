# Settings

DADABADA reads its settings from `<data folder>/dadabada.toml`, which [`ddbd init`](/admin/command-line#ddbd-init) writes with every setting in it. This page lists every setting, when a change takes effect, and the fixed rules and limits that are not settings.

```toml
# <data folder>/dadabada.toml (the first lines)
port = 7070
bind = "0.0.0.0"
tls = false
session_idle_hours = 24
```

## Every setting

| setting | default | meaning |
|---|---|---|
| `port` | `7070` | port |
| `bind` | `"0.0.0.0"` | listen address (an IP address; `127.0.0.1` = this machine only) |
| `tls` | `false` (`true` after `init --tls`) | TLS on or off. On: DADABADA serves HTTPS itself. Off: plain HTTP, for `localhost` or behind a proxy or load balancer that handles HTTPS and forwards plain HTTP (with TLS on, DADABADA refuses plain HTTP (see [Operations](/admin/operations#plain-http-on-a-tls-port)) |
| `tls_cert`, `tls_key` | the files made by `init --tls` | PEM certificate and key. `init --tls` writes the full paths of `<data folder>/tls/cert.pem` and `key.pem`; when a value is missing, those files are used. Any certificate (for example from a public certificate authority) can be used |
| `session_idle_hours` | `24` | session ends after this many hours without use (at least 1) |
| `notify_keep` | `"1d"` | keep missed notifications this long (`--notify-keep`) |
| `private_key_ttl` | `"1h"` | private access key lifetime (`--private-key-ttl`) |
| `login_free_attempts` | `5` | failed logins before the slowdown starts |
| `login_max_delay` | `"15m"` | longest wait between attempts |
| `max_indexes` | `0` | indexes per record, `0` = unlimited (`--max-indexes`) |
| `max_tags` | `0` | tags per record, `0` = unlimited (`--max-tags`) |
| `admin_session_idle_minutes` | `60` | web admin sessions end after this many minutes without use (at least 1) |
| `log` | `"stdout"` | not used; the log always goes to standard output |
| `[rocksdb] block_cache_mb` | `256` | memory in MB for cached data blocks (at least 8) |
| `[rocksdb] blob_min_kb` | `4` | record bodies of this many KB or more are kept in separate blob files (at least 1) |

Durations (`notify_keep`, `private_key_ttl`, `login_max_delay`) are a number followed by `ms`, `s`, `m`, `h`, `d` or `w`; a bare number is seconds. The four settings with a flag in brackets can also be overridden for one run on the [`start`](/admin/command-line#ddbd-start) command line.

The Web Admin's Settings page checks values before it saves them: durations must be above zero, `port`, `login_free_attempts`, `session_idle_hours` and `admin_session_idle_minutes` at least 1, `bind` an IP address, and `tls_cert` and `tls_key` files that exist on the server (an empty value means the files made by `init`). Turning `tls` on when the certificate file is missing makes a new self-signed certificate in `<data folder>/tls/`.

Where each setting is explained in use:

| setting | page |
|---|---|
| `session_idle_hours`, `login_free_attempts`, `login_max_delay` | [Login and Sessions](/users/login) |
| `admin_session_idle_minutes` | [Web Admin](/admin/web-admin) |
| `tls`, `tls_cert`, `tls_key`, `port`, `bind` | [Operations](/admin/operations#running-on-plain-http) |

## Live or next start

Edits to `dadabada.toml` take effect on the next `start`. The Web Admin's Settings page saves to the same file (rewriting it, so comments in it are lost), and applies what it can at once:

| applies at once (from the Web Admin) | applies on the next start |
|---|---|
| `session_idle_hours` | `port` |
| `notify_keep` | `bind` |
| `private_key_ttl` | `tls` |
| `login_free_attempts` | `tls_cert`, `tls_key` |
| `login_max_delay` | `[rocksdb] block_cache_mb` |
| `max_indexes` | `[rocksdb] blob_min_kb` |
| `max_tags` | |
| `admin_session_idle_minutes` | |

Every way to change a setting, and when it applies:

| way | what it changes | when it applies |
|---|---|---|
| edit `<data folder>/dadabada.toml`, then restart (stop + `start`) | every setting | on the next start |
| `ddbd start --notify-keep <duration> --private-key-ttl <duration> --max-indexes <number> --max-tags <number>` | those four, for this run only (the file is not changed) | now, until the next start without them |
| Web Admin, Settings page | every setting; saved to `dadabada.toml` | the left column above at once; the right column on the next start, and the page says which are waiting |
| `ddbd admin --data <folder> settings` | (shows) every setting in force, and marks each one whose saved value differs | |
| `ddbd admin --data <folder> user ...`, `web-password`, `secret rotate` | users and levels, the web admin password, the private-key secret | at once |

::: tip
`ddbd admin --data <folder> settings` is the way to check: it prints what the running server uses, and marks any setting whose saved value differs with `(saved <value>, applies on next start)`.
:::

::: info Saving replaces command-line overrides
A save on the Settings page sets every live setting to its value in the file. A value given on the `start` command line (`--notify-keep`, `--private-key-ttl`, `--max-indexes`, `--max-tags`) is then replaced by the saved one.
:::

::: warning
A setting the server cannot use (a bad duration, a busy port, missing certificate files) stops `start` with a message saying which one; nothing is half-started. Fix the file and start again.
:::

How to restart, move ports, and swap certificates is on the [Operations](/admin/operations#changing-the-configuration) page.

## Rules and limits

These are fixed by the server and are not settings. The only adjustable ones are `max_indexes` and `max_tags` above.

| item | rule |
|---|---|
| collection names, tags, index names | 1 to 256 characters, no control characters |
| index names | cannot start with `$` or end with `.` |
| string index values | 0 to 256 characters, no control characters |
| number index values | any finite number; whole numbers are exact up to ±2^53 |
| `unique_id` | 1 to 1000 bytes, no control characters |
| usernames | 1 to 256 characters, no whitespace or control characters |
| index names per record | each name once |
| indexes per record | unlimited, or `max_indexes` |
| tags per record | unlimited, or `max_tags` |
| record data | any JSON, no size limit |
| grants per call | 1 to 100 users |
| page size | 1 to 1000 (default 50) |
| text | names, tags, unique ids and string values are stored in Unicode NFC form, so visually identical text always matches |

A request that breaks one of these answers `400 INVALID_REQUEST`, `400 INDEX_LIMIT` or `400 TAG_LIMIT` with a message naming the field. Request bodies themselves have no size limit.

::: tip When to set `max_indexes` and `max_tags`
Each tag copies every index key of a record, so a record with many string indexes and many tags writes many small keys. The two limits keep a careless client from making every write expensive. Both are `0` (unlimited) by default and apply at once from the Web Admin.
:::
