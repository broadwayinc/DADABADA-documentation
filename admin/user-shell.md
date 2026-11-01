# User Shell

The user shell is a terminal client for the HTTP API. It signs in as a user (or with an agent key), and each command sends an ordinary API call, so it is a way to try a query or look at a record before writing the same request in code.

```bash
$ ddbd connect 127.0.0.1:7070 --user alice
```

It asks for the password, then waits at the `alice>` prompt:

```
alice> post products --index price=1200 --index "title=Desk Lamp" --tags sale --data '{"color":"red"}'
alice> get products --index "price >= 1000"
alice> exit
```

Open it with [`ddbd connect`](/admin/command-line#ddbd-connect). After signing in it prints `Signed in as alice (level 10).` The prompt is the username followed by `>`, such as `alice>` (with an agent key, the username and the key name: `alice/shop-bot>`). Options can be written with a space or with `=`: `--level 05` or `--level=05`. Quote values with spaces. `help` lists the commands; `exit`, `quit`, `logout` or Ctrl-D signs out and leaves. A command given after `ddbd connect <server address>:<port>` on the command line runs once, and the shell signs out and exits. Errors are printed as `<code>: <message>`, for example `NO_ACCESS: You have no access to record VZOat4ixBwfABGAq.`

## Value typing

In `--index <name>=<value>` and in index conditions, a value is a number if it reads as a number, `true`/`false` is a boolean, anything else is a string. Put it in double quotes inside the shell quotes to force a string:

```
alice> post products --index 'code="0042"'
```

Without the inner quotes, `code=0042` is the number 42.

## Index conditions

`--index` on `get` takes one condition. Spaces around the operator are optional: `price>=1000` works.

| form | meaning |
|---|---|
| `<name>` | every record with that index, in value order |
| `<name> = <value>` | equal |
| `<name> > <value>`, `<name> < <value>` | after / before |
| `<name> >= <value>` | greater or equal; for strings **starts with** |
| `<name> <= <value>` | less or equal; for strings **ends with** |
| `<name> <low>..<high>` | range, inclusive |
| `~` before the operator (`~=`, `~>`, `~<`, `~>=`, `~<=`), or `<name> ~<low>..<high>` | loose match; the value is sent as a string |
| `shop. = brand`, `shop. >= b`, `shop. <= nd` | children of a compound name: child equal, starts with, ends with |
| `$updated > 1793230000000`, `$uploaded <= ...`, `$referenced_count >= 2`, `$user_id = <user id>` | built-in indexes |

```
alice> get products --index "price 1000..2000"
alice> get products --index "title ~>= desk"
alice> get products --index "shop. = brand"
alice> get products --index '$referenced_count >= 2'
```

## Records

### `post <collection>`

Saves a new record. Prints its id, or the whole record with `--json`.

| option | meaning |
|---|---|
| `--level <level>` | access level `00` to `99` or `**` (default `00`) |
| `--index <name>=<value>` | an index; repeat for more |
| `--tags <tag>,<tag>,...` | tags, separated by commas |
| `--unique <unique id>` | unique id |
| `--ref <record id>` | record id or unique id to point to |
| `--readonly` | only the admin can change or delete it afterwards |
| `--data '<json>'` | the record's data (default `null`) |
| `--source '<json>'` | source rules, for example `'{"referencing_limit":10}'` |
| `--subscription '<json>'` | subscription settings, for example `'{"upload_to_feed":true,"notify_subscribers":true}'` |
| `--notification "<title>\|<body>"` | notification sent with `notify_subscribers` |
| `--json` | print the saved record |

### `update <record id>`

Changes a record (yours, unless the record is read-only). Only the options given change.

| option | meaning |
|---|---|
| `--collection <collection>` | move to another collection |
| `--level <level>` | new level |
| `--index <name>=<value>` (repeat) | **replaces all** indexes with these |
| `--no-index` | removes all indexes |
| `--tags <tag>,<tag>,...` | replaces the tags; `--tags ""` removes them |
| `--unique <unique id>` | new unique id; `--unique ""` removes it |
| `--ref <record id>` | new reference; `--ref ""` removes it |
| `--readonly`, `--data`, `--source`, `--subscription`, `--notification`, `--json` | as for `post` |

### `get [<collection>]`

Queries. Prints one record per line: id, collection/level, indexes, tags, unique id, reference, data (shortened). `--json` prints full JSON.

| option | meaning |
|---|---|
| `<collection>` or `--collection <collection>` | required unless `--id` or `--unique` is given |
| `--index "<condition>"` | one index condition (see [Index conditions](#index-conditions)) |
| `--ignore-case` | makes the `--index` condition a loose match, like `~` |
| `--by <index name>` | sort by an index without a condition (`--by '$updated'`) |
| `--tag <tag>` | only records with this tag |
| `--ref <record id>` | only records pointing to this record |
| `--user <user id>` | only this user's records |
| `--level <level>` | only this level (`**` for private); default every level you can read |
| `--sub <user id>` | that user's subscription records |
| `--limit <number>` | page size 1 to 1000 (default 50) |
| `--desc` | descending (default ascending) |
| `--id <record id>` / `--unique <unique id>` | one record |
| `--key <private key>` | private access key for `--id` / `--unique` |
| `--json` | full JSON |

A listing that has more pages ends with ``(<number> shown; type `more` for the next page)``.

### `more` and `del`

| command | what it does |
|---|---|
| `more` | shows the next page of the last listing (in the same shell session) |
| `del <record id> ...` | deletes one or more records and reports each (`Deleted <record id>` or `Not deleted <record id>: <reason>`) |

## Catalog

`<op>` is one of `=`, `>`, `<`, `>=` (starts with), `<=` (ends with). A single word without `<op>` means `=`. Nothing means all. Results are JSON lines.

| command | options |
|---|---|
| `collections [<op> <text>]` | `--json` |
| `tags <collection> [<op> <text>]` | `--json` |
| `indexes <collection> [<op> <text>]` | `--order <order>`, `--desc`, `--json` |
| `uniques [<op> <text>]` | `--json` |

## Private access

A grant lets named users read a record they could not read by level, such as a private (`**`) one. A private access key opens one record for a limited time (`private_key_ttl`, default 1 hour). See [Access levels](/database/access-levels).

| command | what it does |
|---|---|
| `grant <record id> <user id> ...` | grants up to 100 users |
| `revoke <record id> <user id> ...` | removes their access |
| `grants <record id>` | lists who is granted |
| `key <record id> [--ref <record id>]` | asks for a private access key; `--ref` names a record you can read that points to this one |

## Subscriptions

| command | options / meaning |
|---|---|
| `subscribe <user id>` | `--feed`, `--notify`. Options not given are set to off |
| `unsubscribe <user id>` | |
| `block <user id>`, `unblock <user id>` | for users who subscribe to you |
| `subscriptions` | `--subscriber <user id>`, `--subscription <user id>`; default: whom you subscribe to |
| `feed` | `--limit <number>`, `--json`; newest first |
| `listen` | prints notifications as they arrive; Ctrl-C stops. Listening again in the same session resumes after the last one seen |

## Agent keys

| command | options |
|---|---|
| `agent create <key name>` | `--level <level>` (cap), `--read-only`, `--private` (allow `**` records), `--collections <collection>,<collection>,...`, `--expires <duration>` (such as `30d`). Prints the key once |
| `agent list` | |
| `agent revoke <key id>` | |

Agent keys cannot create, list or revoke agent keys, so these three commands work only in a shell signed in with a username and password, not with `--key`. See [Agent Keys](/users/agent-keys).

## Other

| command | what it does |
|---|---|
| `whoami` | your account, `enc_salt`, `kdf`, effective level, and agent key details when using one |
| `raw <method> ['<json>']` | sends any API call and prints the answer |

`raw` is the escape hatch: anything the shell has no command for can still be sent as the method name and its JSON body.

```
alice> raw getCollections
alice> raw getRecords '{"query":{"collection":"products","index":{"name":"price","value":1000,"condition":">="}},"fetch":{"limit":20}}'
```
