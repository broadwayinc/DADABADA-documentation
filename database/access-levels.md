# Access Levels

Every user and every record has an access level, a two-digit number from `"00"` to `"99"`. This page covers how levels decide who reads which record, and the ways to open a record to more users: grants and private access keys.

- **A user's level is set by the admin**: `ddbd admin user add alice --level 10`, later `ddbd admin user level alice 20`.
- **A record's level is set by the user who writes it**, in `config.collection.access_level` of [`postRecord`](/api-reference/database#postrecord). A user can post at their own level or below. Left out, the level is `"00"`.
- **A user reads the records at or below their own level.** A level `10` user reads records `"00"` to `"10"`, and not records `"11"` to `"99"`.
- **A record can be private**, with the level `"**"`. A private record can be read by its writer, by the users the writer grants access to, and by a user holding a private access key for it.
- **A grant opens one record to one user**: a private record, or a record above that user's level.

Level `00` is the lowest level, not an open one: every request needs an account, so a `00` record is readable by every user of the database, and by nobody else. No network user ever has admin powers, whatever their level; only the operating system user who runs DADABADA is the admin.

`whoami` returns a user's `access_level` and `effective_access_level`, the level in force, which is lower when an agent key with `max_level` is used.

## Who can read what

A user can read:

- records at or below their level
- their own records, at any level
- records they were [granted](#granting-access-to-a-record): private records, and records above their level
- records that point to a record they uploaded or were granted, at any level (see [Access by reference](/database/referencing#access-by-reference))
- any record they hold a valid [private access key](#private-access-keys) for

The admin reads every record. Two things narrow the list above:

- A record with `is_subscription_record` is readable only by its uploader and the uploader's subscribers who are not blocked. See [Subscriptions](/database/subscription#subscription-records).
- An [agent key](/users/agent-keys) reads only within its limits: the collections it was given, records up to its `max_level`, and private records only when it was created with `private: true`.

Reading a single record above your level is refused. bob is level 05 and asks for a level 10 record:

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "record_id": "VZOat4dq5yx2BGAq" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { record_id: 'VZOat4dq5yx2BGAq' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'record_id': 'VZOat4dq5yx2BGAq'}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> get --id VZOat4dq5yx2BGAq
NO_ACCESS: You have no access to record VZOat4dq5yx2BGAq.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You have no access to record VZOat4dq5yx2BGAq."
  }
}
```

## Who can post at which level

A user posts at or below their own level, or at `"**"`. An agent key posts within its own limits as well: never above its `max_level`, and never at `"**"` unless the key was created with `private: true`.

| `access_level` as sent | stored as |
|---|---|
| `"05"` (two digits, `"00"` to `"99"`) | `"05"` |
| `"**"` | `"**"` |
| left out | `"00"` |
| a number such as `7`, a one-digit string such as `"7"`, `"private"`, any word | refused |

A refused level answers `400 INVALID_REQUEST` `access_level must be "00" to "99", or "**" for private.`

### A level between 00 and 99

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "staff only",
    "config": {
      "collection": { "name": "notes", "access_level": "05" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'staff only',
    config: {
      collection: { name: 'notes', access_level: '05' }
    }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'data': 'staff only',
        'config': {
            'collection': {'name': 'notes', 'access_level': '05'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post notes --level 05 --data '"staff only"'
Saved record VZOat4XlzZrvBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "notes" },
  "data": "staff only",
  "record_id": "VZOat4XlzZrvBGAq",
  "user_id": "JFeCedoO"
}
```

Users at level `05` and above can read it.

### A private record

`"**"` is allowed for every user, whatever their level. Only alice, the users she grants, and holders of a private access key can read this one:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "my diary",
    "config": {
      "collection": { "name": "diary", "access_level": "**" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'my diary',
    config: {
      collection: { name: 'diary', access_level: '**' }
    }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'data': 'my diary',
        'config': {
            'collection': {'name': 'diary', 'access_level': '**'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post diary --level ** --data '"my diary"'
Saved record VZOat4YnzzgCBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "**", "name": "diary" },
  "data": "my diary",
  "record_id": "VZOat4YnzzgCBGAq",
  "user_id": "JFeCedoO"
}
```

### Above your own level

bob is level 05 and asks for `"09"`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": { "name": "notes", "access_level": "09" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      collection: { name: 'notes', access_level: '09' }
    }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'config': {
            'collection': {'name': 'notes', 'access_level': '09'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post notes --level 09
NO_ACCESS: You can post at access levels up to 05 (or ** for private); 09 is above that.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You can post at access levels up to 05 (or ** for private); 09 is above that."
  }
}
```

### Two mistakes the server catches

`access_level` belongs inside the `collection` object. Next to it, it is an unknown key:

```json
// Response (400)
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Unknown config key \"access_level\". Allowed: record_id, collection, index, tags, reference, unique_id, source, readonly, notification. Put it inside collection: {\"collection\": {\"name\": ..., \"access_level\": ...}}."
  }
}
```

And words are not levels. `"access_level": "private"` answers:

```json
// Response (400)
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "access_level must be \"00\" to \"99\", or \"**\" for private."
  }
}
```

### Moving a record to another level

Update the record with a new `collection.access_level`. The same limit applies: not above your level. Moving a record into or out of `"**"` can be done by its uploader only. See [Updating Records](/database/update#move-to-another-level).

## Querying by level

A query names a collection, and the level decides which records of it come back:

| `query.collection` | what comes back |
|---|---|
| `"products"` or `{ "name": "products" }` | every level from `00` up to yours, plus your own `"**"` records and the `"**"` records granted to you, merged in order. A record above your level is not included even when it is granted to you; name its level in `access_level` to find it |
| `{ "name": "products", "access_level": "05" }` | only level `05`. A level above yours is not refused: the query then returns only the records of that level you can read, such as your own and the ones granted to you |
| `{ "name": "products", "access_level": "**" }` | only `"**"` records: yours and the ones granted to you |

Only one level:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "collection": { "name": "products", "access_level": "05" } }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: { collection: { name: 'products', access_level: '05' } }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({
        'query': {'collection': {'name': 'products', 'access_level': '05'}}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --level 05
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "05", "name": "products" },
      "data": { "color": "green", "title": "Desk Lamp" },
      "index": [
        { "name": "price", "value": 1200 },
        { "name": "title", "value": "Desk Lamp" },
        { "name": "in_stock", "value": true },
        { "name": "shop.brand", "value": "Lumo" },
        { "name": "shop.rating", "value": 4.5 }
      ],
      "record_id": "VZOat4bWCVbRBGAq",
      "tags": ["sale", "lighting"],
      "unique_id": "sku-1042",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

Only private records:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "collection": { "name": "diary", "access_level": "**" } }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: { collection: { name: 'diary', access_level: '**' } }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({
        'query': {'collection': {'name': 'diary', 'access_level': '**'}}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get diary --level **
VZOat4YnzzgCBGAq  diary/**  "my diary"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "**", "name": "diary" },
      "data": "my diary",
      "record_id": "VZOat4YnzzgCBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

::: tip
The catalog follows the same rule. [`getCollections`](/api-reference/database#getcollections) reports records per level only for the levels at or below yours; the admin sees every level, `"**"` included.
:::

## Granting access to a record

The uploader of a record can open it to chosen users with [`grantPrivateRecordAccess`](/api-reference/database#grantprivaterecordaccess). A grant works on a private record and on a record above the granted user's level. A granted user can read the record, reference it, and read the records that point to it. A granted private record appears in the user's queries like their own; a granted record above their level appears only in a query that names its level in `access_level`.

```ts
// grantPrivateRecordAccess body
{
    record_id: string;          // Required. The record.
    user_id: string | string[]; // Required. 1 to 100 user ids.
}
```

Allowed for the uploader, or for granted users when the record has `source.allow_granted_to_grant_others` (see [Referencing](/database/referencing#letting-granted-users-grant-others)). The uploader and users who already have access are skipped. The answer is `{record_id, granted: [the ids that changed]}`. If one of the user ids does not exist, the call answers `404 NOT_FOUND` (`User <id> does not exist.`) and grants nothing. More than 100 ids, or none, answers `400 INVALID_REQUEST`: `Give 1 to 100 user ids per call.`

### Grant one user

alice grants bob her diary record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/grantPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4YnzzgCBGAq", "user_id": "nRcziH7v" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/grantPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4YnzzgCBGAq', user_id: 'nRcziH7v' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/grantPrivateRecordAccess',
    data=json.dumps({'record_id': 'VZOat4YnzzgCBGAq', 'user_id': 'nRcziH7v'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grant VZOat4YnzzgCBGAq nRcziH7v
Granted: ["nRcziH7v"]
```

:::

```json
// Response
{
  "granted": ["nRcziH7v"],
  "record_id": "VZOat4YnzzgCBGAq"
}
```

### Grant several users

bob already has access, so only carol is listed in `granted`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/grantPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4YnzzgCBGAq", "user_id": ["nRcziH7v", "Vv4JM09T"] }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/grantPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4YnzzgCBGAq', user_id: ['nRcziH7v', 'Vv4JM09T'] })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/grantPrivateRecordAccess',
    data=json.dumps({'record_id': 'VZOat4YnzzgCBGAq', 'user_id': ['nRcziH7v', 'Vv4JM09T']}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grant VZOat4YnzzgCBGAq nRcziH7v Vv4JM09T
Granted: ["Vv4JM09T"]
```

:::

```json
// Response
{
  "granted": ["Vv4JM09T"],
  "record_id": "VZOat4YnzzgCBGAq"
}
```

### A granted user finds the record in their queries

bob queries the `diary` collection as he would any other. No special field is needed:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "collection": "diary" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { collection: 'diary' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'collection': 'diary'}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> get diary
VZOat4YnzzgCBGAq  diary/**  "my diary"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "**", "name": "diary" },
      "data": "my diary",
      "record_id": "VZOat4YnzzgCBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

### Only the uploader can grant

bob, granted but not the uploader, tries to grant carol:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/grantPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4YnzzgCBGAq", "user_id": "Vv4JM09T" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/grantPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4YnzzgCBGAq', user_id: 'Vv4JM09T' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/grantPrivateRecordAccess',
    data=json.dumps({'record_id': 'VZOat4YnzzgCBGAq', 'user_id': 'Vv4JM09T'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> grant VZOat4YnzzgCBGAq Vv4JM09T
NO_ACCESS: Only the uploader of record VZOat4YnzzgCBGAq can grant access to it.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "Only the uploader of record VZOat4YnzzgCBGAq can grant access to it."
  }
}
```

The record's uploader can change this with `source.allow_granted_to_grant_others: true`.

### Listing who is granted

[`listPrivateRecordAccess`](/api-reference/database#listprivaterecordaccess) lists grants either way round. The answer is `{list: [{record_id, user_id}]}`, not paged.

```ts
// listPrivateRecordAccess body
{
    /** Default: none. Who is granted this record. The uploader, granted users and the admin may ask; */
    /** others get 403 NO_ACCESS: `You cannot list who can access record <id>.` */
    record_id?: string;
    /** Default: yourself. Which records this user is granted. */
    /** Only yourself, unless you are the admin (`You can only list your own grants.`). */
    user_id?: string;
}
```

Who can open alice's diary record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/listPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4YnzzgCBGAq" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/listPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4YnzzgCBGAq' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listPrivateRecordAccess',
    data=json.dumps({'record_id': 'VZOat4YnzzgCBGAq'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grants VZOat4YnzzgCBGAq
```

:::

```json
// Response
{
  "list": [
    { "record_id": "VZOat4YnzzgCBGAq", "user_id": "Vv4JM09T" },
    { "record_id": "VZOat4YnzzgCBGAq", "user_id": "nRcziH7v" }
  ]
}
```

What carol was granted. With an empty body, the call lists your own grants:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/listPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/listPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listPrivateRecordAccess',
    data=json.dumps({}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> raw listPrivateRecordAccess
```

:::

```json
// Response
{
  "list": [
    { "record_id": "VZOat4YnzzgCBGAq", "user_id": "Vv4JM09T" }
  ]
}
```

### Removing a grant

[`removePrivateRecordAccess`](/api-reference/database#removeprivaterecordaccess) takes the same `record_id` and `user_id` (one id or a list of 1 to 100) and answers `{record_id, removed: [the ids that changed]}`. Users who were not granted are skipped.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/removePrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4YnzzgCBGAq", "user_id": "Vv4JM09T" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/removePrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4YnzzgCBGAq', user_id: 'Vv4JM09T' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/removePrivateRecordAccess',
    data=json.dumps({'record_id': 'VZOat4YnzzgCBGAq', 'user_id': 'Vv4JM09T'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> revoke VZOat4YnzzgCBGAq Vv4JM09T
Removed: ["Vv4JM09T"]
```

:::

```json
// Response
{
  "record_id": "VZOat4YnzzgCBGAq",
  "removed": ["Vv4JM09T"]
}
```

carol's next query of `diary` no longer returns the record.

## Private access keys

A grant is permanent until removed. A private access key is the short-lived alternative: it opens **one record for one user** until it expires. A user asks for one with [`requestPrivateRecordAccessKey`](/api-reference/database#requestprivaterecordaccesskey) and then sends it as `query.private_key` in a `getRecords` lookup by `record_id` or `unique_id`.

```ts
// requestPrivateRecordAccessKey body
{
    record_id: string;     // Required. The record to open.
    reference_id?: string; // Default: none. A record you can read that points to record_id.
}
```

The key is given if you can read the record now, or if you can read the record named in `reference_id` and that record points to `record_id`. Otherwise the answer is `403 NO_ACCESS`: `You have no access to record <id>.` The answer is `{record_id, private_key, expires}`, with `expires` in milliseconds. The key is 80 hex characters.

| the key | |
|---|---|
| works for | the user who asked, and that record only. Agent key limits and the subscription rule still apply |
| lasts | `private_key_ttl` from the settings file (default `1h`), or `ddbd start --private-key-ttl` |
| is cancelled by | its expiry, or `ddbd admin secret rotate`, which cancels every key at once |

### Example

alice saved a `"**"` record `VZOatTnNdEWXBGAq` in `vault`, and a level `00` record `VZOatToLXUfjBGAq` in `links` that references it. carol can read the link, not the vault record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "record_id": "VZOatTnNdEWXBGAq" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { record_id: 'VZOatTnNdEWXBGAq' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'record_id': 'VZOatTnNdEWXBGAq'}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> get --id VZOatTnNdEWXBGAq
NO_ACCESS: You have no access to record VZOatTnNdEWXBGAq.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You have no access to record VZOatTnNdEWXBGAq."
  }
}
```

carol asks for a key through the link record she can read:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/requestPrivateRecordAccessKey \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOatTnNdEWXBGAq", "reference_id": "VZOatToLXUfjBGAq" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/requestPrivateRecordAccessKey', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOatTnNdEWXBGAq', reference_id: 'VZOatToLXUfjBGAq' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/requestPrivateRecordAccessKey',
    data=json.dumps({'record_id': 'VZOatTnNdEWXBGAq', 'reference_id': 'VZOatToLXUfjBGAq'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> key VZOatTnNdEWXBGAq --ref VZOatToLXUfjBGAq
Private access key (expires 1793238977365): 000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255
```

:::

```json
// Response
{
  "expires": 1793238977365,
  "private_key": "000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255",
  "record_id": "VZOatTnNdEWXBGAq"
}
```

carol uses the key:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "record_id": "VZOatTnNdEWXBGAq",
      "private_key": "000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: {
      record_id: 'VZOatTnNdEWXBGAq',
      private_key: '000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255'
    }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({
        'query': {
            'record_id': 'VZOatTnNdEWXBGAq',
            'private_key': '000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255'
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> get --id VZOatTnNdEWXBGAq --key 000001a1855f4b55129fb55cd1e54a15e66d1b4ae167b798350483367c24f3b5422cb4083e116255
VZOatTnNdEWXBGAq  vault/**  "the private file"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "**", "name": "vault" },
      "data": "the private file",
      "record_id": "VZOatTnNdEWXBGAq",
      "referenced_count": 1,
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

bob sends the same key and gets nothing, because it was made for carol:

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You have no access to record VZOatTnNdEWXBGAq."
  }
}
```

::: warning
Use a key in a direct lookup (`query.record_id` or `query.unique_id`). A key does not add a private record to collection queries. For lasting access, grant the user instead.
:::

::: tip
Keys depend on the server secret. That is why `ddbd admin secret rotate` cancels every key at once, and why a backup includes the secret.
:::
