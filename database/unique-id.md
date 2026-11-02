# Unique ID

A unique id is your own id for a record, such as an order number, a SKU or a slug. It is unique across the whole database. Set it in `config.unique_id` of [`postRecord`](/api-reference/database#postrecord), then use it to fetch, point to and delete the record in the places listed below.

## Setting a unique id

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DDBD serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "title": "Hello world" },
    "config": {
      "collection": { "name": "articles", "access_level": "05" },
      "unique_id": "article-1"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { title: 'Hello world' },
    config: {
      collection: { name: 'articles', access_level: '05' },
      unique_id: 'article-1'
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
        'data': {'title': 'Hello world'},
        'config': {
            'collection': {'name': 'articles', 'access_level': '05'},
            'unique_id': 'article-1'
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post articles --level 05 --unique article-1 --data '{"title":"Hello world"}'
Saved record VZOat4j7WgY5BGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "articles" },
  "data": { "title": "Hello world" },
  "record_id": "VZOat4j7WgY5BGAq",
  "unique_id": "article-1",
  "user_id": "JFeCedoO"
}
```

The record now has two ids: the `record_id` DDBD made, and `article-1`.

```ts
// postRecord body: config.unique_id
{
    config: {
        /** Default: none. 1 to 1000 bytes, no control characters. Must not be used by any other record, */
        /** in any collection. Stored in Unicode NFC form, so the same text typed with composed or */
        /** decomposed accents matches. null on an update removes it. */
        unique_id?: string | null;
        // other config fields: see Creating Records
    };
}
```

### A used unique id is refused

A unique id is unique across the whole database, not per collection or per user. bob tries to reuse alice's `sku-1042` in another collection:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": { "collection": "x", "unique_id": "sku-1042" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: { collection: 'x', unique_id: 'sku-1042' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'config': {'collection': 'x', 'unique_id': 'sku-1042'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post x --unique sku-1042
EXISTS: unique_id "sku-1042" is already used by another record.
```

:::

```json
// Response (409)
{
  "error": {
    "code": "EXISTS",
    "message": "unique_id \"sku-1042\" is already used by another record."
  }
}
```

The same `EXISTS` error comes back when an update sets a `unique_id` that another record holds.

## Where a unique id is accepted

These fields accept a unique id:

| where | field | what to send |
|---|---|---|
| [`getRecords`](/api-reference/database#getrecords) | `query.unique_id` | a unique id |
| [`getRecords`](/api-reference/database#getrecords) | `query.reference` | a plain string holding a record id or a unique id, or `{ "unique_id": "..." }` |
| [`postRecord`](/api-reference/database#postrecord) | `config.reference` | a plain string holding a record id or a unique id, or `{ "unique_id": "..." }` |
| [`deleteRecords`](/api-reference/database#deleterecords) | `unique_id` | a unique id or a list of them |

A key named `record_id` holds a record id and nothing else: `query.record_id` of `getRecords`, `config.record_id` of `postRecord`, `record_id` of `deleteRecords`, the `{ "record_id": "..." }` form of `reference`, and the `record_id` of the private access methods (`grantPrivateRecordAccess`, `removePrivateRecordAccess`, `listPrivateRecordAccess`, `requestPrivateRecordAccessKey`). A unique id there answers `NOT_FOUND` (in `deleteRecords` it is listed in `failed` with that code). In the same way a key named `unique_id` holds a unique id and nothing else. A plain-string `reference` is the one field that takes either kind.

### Fetching by unique id

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "unique_id": "sku-1042" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { unique_id: 'sku-1042' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'unique_id': 'sku-1042'}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get --unique sku-1042
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

A direct lookup answers a one-record page. The answer carries the `record_id` as well, which is what `config.record_id` and the other `record_id` fields need.

`query.unique_id` and `query.record_id` do not cross over. A unique id sent as `record_id` (`"query": { "record_id": "sku-1042" }`) answers `404 NOT_FOUND` `Record sku-1042 does not exist.`, and a record id sent as `unique_id` answers `404 NOT_FOUND` `No record has the unique id VZOat4bWCVbRBGAq.`

The lookup still checks access: a record above your level answers `NO_ACCESS`, and an unknown id answers `NOT_FOUND`.

### Referencing by unique id

A record can point to `article-1` by that name, and the comments on it can be fetched the same way. Both are shown in [Referencing](/database/referencing#referencing-by-unique-id).

### Updating by unique id

`config.record_id` takes the record id only, so an update by unique id is two calls. First fetch the record with `query.unique_id`, as in [Fetching by unique id](#fetching-by-unique-id) above. Then send the `record_id` from that answer, here `VZOat4bWCVbRBGAq`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "title": "Desk Lamp", "color": "green" },
    "config": { "record_id": "VZOat4bWCVbRBGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { title: 'Desk Lamp', color: 'green' },
    config: { record_id: 'VZOat4bWCVbRBGAq' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'data': {'title': 'Desk Lamp', 'color': 'green'},
        'config': {'record_id': 'VZOat4bWCVbRBGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4bWCVbRBGAq --data '{"title":"Desk Lamp","color":"green"}'
```

:::

The answer is the updated record, as in [Updating Records](/database/update#finding-the-record-by-its-unique-id). A unique id put straight into `config.record_id` answers `404 NOT_FOUND` `Record sku-1042 does not exist.`

### Deleting by unique id

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "unique_id": "tmp-2" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ unique_id: 'tmp-2' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({'unique_id': 'tmp-2'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw deleteRecords '{"unique_id": "tmp-2"}'
```

:::

```json
// Response
{
  "deleted": ["VZOatTrmKnZ0BGAq"],
  "failed": []
}
```

`unique_id` also takes a list. Unknown unique ids are skipped, and so is a record id sent there. Deleting a record frees its unique id for another record. See [Deleting Records](/database/delete).

## Changing and removing a unique id

Send a new `unique_id` on an update to change it. The old one stops working at once:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": { "record_id": "VZOat4azQj6RBGAq", "unique_id": "shade-01" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: { record_id: 'VZOat4azQj6RBGAq', unique_id: 'shade-01' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'config': {'record_id': 'VZOat4azQj6RBGAq', 'unique_id': 'shade-01'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4azQj6RBGAq --unique shade-01
Updated VZOat4azQj6RBGAq  products/03  [price=39 title="Lamp Shade"]  tags:lighting,new  unique:shade-01  {"title":"Lamp shade"}
```

:::

```json
// Response
{
  "collection": { "access_level": "03", "name": "products" },
  "data": { "title": "Lamp shade" },
  "index": [
    { "name": "price", "value": 39 },
    { "name": "title", "value": "Lamp Shade" }
  ],
  "record_id": "VZOat4azQj6RBGAq",
  "tags": ["lighting", "new"],
  "unique_id": "shade-01",
  "user_id": "JFeCedoO"
}
```

To remove it, send `null`. The record keeps everything else and answers without a `unique_id`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": { "record_id": "VZOat4azQj6RBGAq", "unique_id": null }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: { record_id: 'VZOat4azQj6RBGAq', unique_id: null }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'config': {'record_id': 'VZOat4azQj6RBGAq', 'unique_id': None}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4azQj6RBGAq --unique ""
```

:::

Only the uploader (or the admin) can change a record, so only they can change or remove its unique id. See [Updating Records](/database/update#who-may-update-a-record).

## Listing unique ids

[`getUniqueId`](/api-reference/database#getuniqueid) lists the unique ids in the database with the record each one belongs to. Match the start or the end of the id, or leave `unique_id` out to list everything.

```ts
// getUniqueId body
{
    query?: {
        unique_id?: string; // Default: none (every unique id). The text to match.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default: "=". ">=" is starts with, "<=" is ends with, "=" is an exact match.
    };
    /** Default: limit 50, ascending. Paging, as everywhere: limit (1 to 1000), ascending, start_key. */
    fetch?: { limit?: number; ascending?: boolean; start_key?: string };
}
```

The query fields go inside `query`. Any other key at the top of the body is refused with `400 INVALID_REQUEST`; see [getUniqueId](/api-reference/database#getuniqueid). Without `query`, every unique id is listed. The list holds only the unique ids of records you can read: your own, those at or below your access level, and those granted to you. With an agent key, the key's limits apply too. The `<=` (ends with) listing is kept by a background worker, so a unique id saved a moment ago may take a moment to appear in it.

### Unique ids starting with `sku-`

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getUniqueId \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "unique_id": "sku-", "condition": ">=" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getUniqueId', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { unique_id: 'sku-', condition: '>=' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getUniqueId',
    data=json.dumps({'query': {'unique_id': 'sku-', 'condition': '>='}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> uniques >= sku-
{"record_id":"VZOat4bWCVbRBGAq","unique_id":"sku-1042"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    { "record_id": "VZOat4bWCVbRBGAq", "unique_id": "sku-1042" }
  ],
  "start_key": "end"
}
```

Each item is `{unique_id, record_id}`. The answer is a page: pass `start_key` back in `fetch` until `end_of_list` is true.

### Unique ids ending with `-1`

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getUniqueId \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "unique_id": "-1", "condition": "<=" } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getUniqueId', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { unique_id: '-1', condition: '<=' } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getUniqueId',
    data=json.dumps({'query': {'unique_id': '-1', 'condition': '<='}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> uniques <= -1
{"record_id":"VZOat4j7WgY5BGAq","unique_id":"article-1"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    { "record_id": "VZOat4j7WgY5BGAq", "unique_id": "article-1" }
  ],
  "start_key": "end"
}
```

::: tip
Searching the middle of a unique id ("contains") is not possible. Choose ids whose start or end carries what you will search for, such as `order-2026-10-29-0042`, or put the searchable part in an index as well.
:::
