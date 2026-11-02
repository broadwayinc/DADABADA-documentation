# Agent Keys

An agent key lets a program or an AI agent call DDBD as you, without your password. You make the key with [`createAgentKey`](/api-reference/agent-keys#createagentkey), give it the limits you want, and hand the `dk_...` string to the agent, which sends it as a bearer token and needs no login. Each key is revoked on its own, so revoking one changes nothing else.

A key can be:

- capped at an access level (`max_level`), so it works at a lower level than your own
- read-only (`read_only`), so it can search but never change anything
- kept away from private records (the default; `private: true` opens them)
- limited to some collections (`collections`)
- given an expiry (`expires`)

These limits only narrow what your own account can do: a key never reads or writes above the access level of the user who made it. See [Access levels](/database/access-levels).

Every record the key writes carries the key's id and name in its `agent` field, so you can always tell which key made it.

## Creating a key

`createAgentKey` needs a password session: call it with a session token from [`login`](/users/login), never with another agent key. The example makes a read-only key for the `products` collection, capped at level `05`, valid for 30 days.

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DDBD serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/createAgentKey \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "shop-bot", "max_level": "05", "read_only": true, "collections": ["products"], "expires": "30d"}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/createAgentKey", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "shop-bot",
    max_level: "05",
    read_only: true,
    collections: ["products"],
    expires: "30d"
  })
});
const key = await res.json();
console.log(key.key); // dk_... shown only once
```

```python [Python]
import json, urllib.request

body = {
    "name": "shop-bot",
    "max_level": "05",
    "read_only": True,
    "collections": ["products"],
    "expires": "30d",
}
req = urllib.request.Request(
    "http://localhost:7070/v1/createAgentKey",
    data=json.dumps(body).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    key = json.load(r)
print(key["key"])  # dk_... shown only once
```

```text [User shell]
alice> agent create shop-bot --level 05 --read-only --collections products --expires 30d
Agent key mtxBMs for "shop-bot"
Key (shown once): dk_f5ZFdLo3hoeb7RS16Jc9VqWul9F1tTYu2jIuXUGYq2m
```

:::

```json
// Response
{
  "collections": [
    "products"
  ],
  "created": 1793235385408,
  "expires": 1795827385408,
  "key": "dk_f5ZFdLo3hoeb7RS16Jc9VqWul9F1tTYu2jIuXUGYq2m",
  "key_id": "mtxBMs",
  "max_level": "05",
  "name": "shop-bot",
  "private": false,
  "read_only": true,
  "user_id": "JFeCedoO"
}
```

::: warning The key is shown once
`key` (the `dk_...` string) is in this answer and nowhere else. `listAgentKeys` and `whoami` show the key's settings but never the key itself. If it is lost, revoke it and make a new one.
:::

```ts
// createAgentKey body
{
    /** Required. The key's name, 1 to 256 characters, no control characters. */
    /** Written into the agent field (with the key_id) of every record the key saves or updates. */
    name: string;
    /** Default: none (no cap). "00" to "99" (a string of two digits). Caps the key's access level; see below. */
    /** A number or a one-digit string is refused: `max_level must be "00" to "99".` */
    max_level?: string;
    read_only?: boolean;  // Default: false. Refuses every write: posting, deleting, grants and subscription changes.
    private?: boolean;    // Default: false. Allows the key to use "**" (private) records.
    collections?: string | string[]; // Default: all. Only these collections; see below.
    /** Default: never. When the key stops working: a duration string, or a number (time in ms). */
    /** A duration is a number followed by ms, s, m, h, d or w ("30d", "12h"); no other unit is accepted; */
    /** a string with no unit is seconds. */
    expires?: string | number;
}
```

The answer is the agent key shape (`key_id`, `user_id`, `name`, `max_level`, `read_only`, `private`, `collections`, `expires`, `created`) plus `key`. `expires` comes back as a time in ms, or `null` for never. `max_level` is `null` when no cap was set. `collections` is always a list; an empty list means every collection.

### `max_level`

The cap is a level between `"00"` and `"99"`. The key cannot post at a level above it or move a record above it, and other users' records above it are not readable with the key, except through a grant, a private access key or a reference. A query without `access_level` lists only levels up to the cap, even for your own records. Here the key `shop-bot` (cap `05`) queries `products`; alice's own level-10 product is not in the list, only her level-05 one.

Your own records above the cap are still readable with the key when it asks for them directly: by `record_id` or `unique_id`, or with a query that names their `access_level`.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"collection": "products", "index": {"name": "price", "value": 1000, "condition": ">="}}}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/getRecords", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: { collection: "products", index: { name: "price", value: 1000, condition: ">=" } }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

body = {"query": {"collection": "products", "index": {"name": "price", "value": 1000, "condition": ">="}}}
req = urllib.request.Request(
    "http://localhost:7070/v1/getRecords",
    data=json.dumps(body).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice/shop-bot> get products --index "price >= 1000"
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
```

:::

```json
// Response (sent with the dk_... key; fields at their default are left out)
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "05",
        "name": "products"
      },
      "data": {
        "color": "green",
        "title": "Desk Lamp"
      },
      "index": [
        { "name": "price", "value": 1200 },
        { "name": "title", "value": "Desk Lamp" },
        { "name": "in_stock", "value": true },
        { "name": "shop.brand", "value": "Lumo" },
        { "name": "shop.rating", "value": 4.5 }
      ],
      "record_id": "VZOat4bWCVbRBGAq",
      "tags": [
        "sale",
        "lighting"
      ],
      "unique_id": "sku-1042",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

A cap above your own level has no effect: the key never reads or writes above the level of the user who made it.

### `read_only`

A read-only key can run `getRecords`, the catalog listings, `getFeed`, `getSubscriptions`, `whoami` and `listen`, but every write is refused with `403 NO_ACCESS`: `postRecord`, `postRecords`, `deleteRecords`, granting and removing private access, and `subscribe`, `unsubscribe`, `blockSubscriber` and `unblockSubscriber`.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"config": {"collection": "products"}}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/postRecord", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ config: { collection: "products" } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/postRecord",
    data=json.dumps({"config": {"collection": "products"}}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice/shop-bot> post products
NO_ACCESS: This agent key is read-only.
```

:::

```json
// Response (sent with the read-only dk_... key)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "This agent key is read-only."
  }
}
```

### `private`

By default a key cannot use `**` records: it cannot post at `**`, private records are not part of what it reads, even your own, and a query that asks for `access_level: "**"` answers `403 NO_ACCESS` (`This agent key cannot read private (**) records.`). `private: true` opens them. The example also shows `collections` given as one string instead of a list.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/createAgentKey \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "writer", "private": true, "collections": "notes"}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/createAgentKey", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "writer", private: true, collections: "notes" })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/createAgentKey",
    data=json.dumps({"name": "writer", "private": True, "collections": "notes"}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice> agent create writer --private --collections notes
Agent key MFgYtk for "writer"
Key (shown once): dk_dyMQ0WEUYQVppT6Uhw0Kpdt218xenwAdL4ZCv896xH2
```

:::

```json
// Response
{
  "collections": [
    "notes"
  ],
  "created": 1793235385409,
  "expires": null,
  "key": "dk_dyMQ0WEUYQVppT6Uhw0Kpdt218xenwAdL4ZCv896xH2",
  "key_id": "MFgYtk",
  "max_level": null,
  "name": "writer",
  "private": true,
  "read_only": false,
  "user_id": "JFeCedoO"
}
```

### `collections`

A key limited to collections can only query, post, update and delete in those collections, and records in other collections are not readable with it. A query, post, `getTags` or `getIndexes` on any other collection answers `403 NO_ACCESS`. `getCollections` lists only the key's collections. `getUniqueId` lists only unique ids of records in the key's collections.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"collection": "articles"}}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/getRecords", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: { collection: "articles" } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/getRecords",
    data=json.dumps({"query": {"collection": "articles"}}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice/shop-bot> get articles
NO_ACCESS: This agent key is not allowed to use the collection "articles".
```

:::

```json
// Response (sent with the shop-bot key, limited to "products")
{
  "error": {
    "code": "NO_ACCESS",
    "message": "This agent key is not allowed to use the collection \"articles\"."
  }
}
```

### `expires`

`expires` takes a duration from now (`"30d"`, `"12h"`, `"90m"`) or an absolute time in ms. The answer always shows the absolute time: the `shop-bot` key above was made with `"30d"` and came back with `"expires": 1795827385408`. Without `expires` the key lasts until it is revoked, and the answer shows `"expires": null`. An expired key answers `401 UNAUTHORIZED` like a revoked one (shown under [Revoking a key](#revoking-a-key)).

## Using the key

Send the key exactly like a session token, in the header `Authorization: Bearer <token>`, with the whole `dk_...` string in place of `<token>`. No login call is made, so there is no session to keep alive and no password anywhere in the agent's configuration.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data": "drafted by an agent", "config": {"collection": "notes"}}'
```

```js [JavaScript]
const TOKEN = "dk_..."; // the agent key
const res = await fetch("http://localhost:7070/v1/postRecord", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ data: "drafted by an agent", config: { collection: "notes" } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

TOKEN = "dk_..."  # the agent key
req = urllib.request.Request(
    "http://localhost:7070/v1/postRecord",
    data=json.dumps({"data": "drafted by an agent", "config": {"collection": "notes"}}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice/writer> post notes --data '"drafted by an agent"'
Saved record VZOavZbQTjkfBGAq
```

:::

```json
// Response (sent with the "writer" key; fields at their default are left out)
{
  "agent": {
    "key_id": "MFgYtk",
    "name": "writer"
  },
  "collection": {
    "access_level": "00",
    "name": "notes"
  },
  "data": "drafted by an agent",
  "record_id": "VZOavZbQTjkfBGAq",
  "user_id": "JFeCedoO"
}
```

The record belongs to the user who made the key (`user_id` is alice's), and `agent` holds the key's `key_id` and `name`. Key names do not have to be unique, so `key_id` is what tells two keys apart. A record saved with a password session has `"agent": null`. When a key updates an existing record, the record's `agent` becomes that key; an update from a password session sets it back to `null`, and an update by the admin leaves it as it was.

::: tip Find an agent's records
`agent` is a field of the record, not an index, so it is read from each record. To find every record an agent wrote, query the collections the key was allowed to use and look at `agent` in the results; or give the agent a collection of its own with `collections`.
:::

### `whoami` with a key

[`whoami`](/api-reference/connection#whoami) called with a key returns the user's account plus the key under `agent`, and `effective_access_level` shows the cap in force.

```json
// Response (sent with the shop-bot key)
{
  "access_level": "10",
  "agent": {
    "collections": [
      "products"
    ],
    "created": 1793235385408,
    "expires": 1795827385408,
    "key_id": "mtxBMs",
    "max_level": "05",
    "name": "shop-bot",
    "private": false,
    "read_only": true,
    "user_id": "JFeCedoO"
  },
  "created": 1793235375537,
  "effective_access_level": "05",
  "enc_salt": "06dfd189ef936d55ceb9655ea52071cc",
  "kdf": {
    "alg": "argon2id",
    "m": 65536,
    "p": 1,
    "t": 3
  },
  "records": 31,
  "subscribed": 0,
  "subscribers": 1,
  "user_id": "JFeCedoO",
  "username": "alice"
}
```

## What a key cannot do

| action | result |
|---|---|
| `createAgentKey`, `listAgentKeys`, `revokeAgentKey` | `403 NO_ACCESS` with `Agent keys are made by a user signed in with a password.`, `An agent key cannot list agent keys.` or `An agent key cannot revoke agent keys.` Keys are made, listed and revoked only by the user with a password session |
| any write with `read_only: true` | `403 NO_ACCESS` with `This agent key is read-only.` |
| read or post `**` records without `private: true` | private records are not listed, and posting at `**` is refused |
| use a collection outside `collections` | `403 NO_ACCESS` with `This agent key is not allowed to use the collection "..."` |
| read or write above `max_level`, or above the user's level | other users' records are not readable; a post is refused with `403 NO_ACCESS` |
| anything after `expires`, or after a revoke | `401 UNAUTHORIZED` with `This agent key is unknown, revoked or expired.` |

A key trying to make a key:

```json
// Response (sent with the "writer" key)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "Agent keys are made by a user signed in with a password."
  }
}
```

## Listing your keys

[`listAgentKeys`](/api-reference/agent-keys#listagentkeys) returns every key of the signed-in user. The body is `{}`. The `dk_...` strings are not included.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/listAgentKeys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/listAgentKeys", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: "{}"
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/listAgentKeys",
    data=b"{}",
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice> agent list
```

:::

```json
// Response
{
  "list": [
    {
      "collections": [
        "notes"
      ],
      "created": 1793235385409,
      "expires": null,
      "key_id": "MFgYtk",
      "max_level": null,
      "name": "writer",
      "private": true,
      "read_only": false,
      "user_id": "JFeCedoO"
    },
    {
      "collections": [
        "products"
      ],
      "created": 1793235385408,
      "expires": 1795827385408,
      "key_id": "mtxBMs",
      "max_level": "05",
      "name": "shop-bot",
      "private": false,
      "read_only": true,
      "user_id": "JFeCedoO"
    }
  ]
}
```

The answer is `{list}`, not a page: there is no `start_key`, every key is in the list. An expired key stays in the list until it is revoked.

## Revoking a key

[`revokeAgentKey`](/api-reference/agent-keys#revokeagentkey) revokes one of your keys by its `key_id`. The key stops working at once; the records it wrote stay, with the key's id and name still in `agent`.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/revokeAgentKey \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key_id": "mtxBMs"}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/revokeAgentKey", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ key_id: "mtxBMs" })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/revokeAgentKey",
    data=json.dumps({"key_id": "mtxBMs"}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
alice> agent revoke mtxBMs
Revoked agent key mtxBMs.
```

:::

```json
// Response
{
  "collections": [
    "products"
  ],
  "created": 1793235385408,
  "expires": 1795827385408,
  "key_id": "mtxBMs",
  "max_level": "05",
  "name": "shop-bot",
  "private": false,
  "read_only": true,
  "user_id": "JFeCedoO"
}
```

```ts
// revokeAgentKey body
{
    key_id: string; // Required. The key_id from createAgentKey or listAgentKeys.
}
```

An unknown `key_id` answers `404 NOT_FOUND` (`There is no agent key <key_id>.`); another user's key answers `403 NO_ACCESS` (`You can only revoke your own agent keys.`).

Any request with the revoked key answers `401 UNAUTHORIZED`:

```json
// Response (sent with the revoked shop-bot key)
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "This agent key is unknown, revoked or expired."
  }
}
```

### The admin can revoke any key

The admin sees every key of every user with `agents` and revokes any of them with `agent revoke <key id>` in the [Admin Shell](/admin/admin-shell#agent-keys), or on the Agent keys page of the [Web Admin](/admin/web-admin). Deleting a user removes all of that user's keys (in the background, with the user's records). Keys cannot be edited: to change a key's limits, revoke it and make a new one.
