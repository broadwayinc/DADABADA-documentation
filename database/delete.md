# Deleting Records

[`deleteRecords`](/api-reference/database#deleterecords) deletes records by id, by unique id, or by a query. It answers with the ids it deleted and the ones it could not.

## Deleting one record

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOatTqxk9eWBGAq" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOatTqxk9eWBGAq' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({'record_id': 'VZOatTqxk9eWBGAq'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> del VZOatTqxk9eWBGAq
Deleted VZOatTqxk9eWBGAq
```

:::

```json
// Response
{
  "deleted": ["VZOatTqxk9eWBGAq"],
  "failed": []
}
```

The answer always has the same two fields:

| field | type | description |
|---|---|---|
| `deleted` | list of record ids | the records that are gone |
| `failed` | list of `{record_id, code, message}` | the records that were not deleted, each with the reason |

## What to give

Send one of these. If more than one is sent, `record_id` is used first, then `unique_id`, then `query`. A body with none of them answers `400 INVALID_REQUEST`: `deleteRecords needs record_id, unique_id, or a query.`

```ts
// deleteRecords body: one of record_id, unique_id or query
{
    record_id?: string | string[]; // Default: none. Records by id. A unique id is not looked up here; use unique_id.
    unique_id?: string | string[]; // Default: none. Records by unique id. Unknown unique ids are skipped.
    query?: object;                // Default: none. A query as in getRecords. Deletes the records of one page of that query.
    /** Default: limit 50. With query: the page size (limit, 1 to 1000) and order, as in getRecords. */
    fetch?: { limit?: number; ascending?: boolean; start_key?: string };
}
```

See [Unique id](/database/unique-id) and [`getRecords`](/api-reference/database#getrecords).

### By unique id

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

`deleted` always lists record ids, whatever you addressed the record by.

### Several at once

`record_id` and `unique_id` also take a list. Each record is handled on its own: the ones you may delete are deleted, the rest are reported in `failed` with their reason. Here bob tries to delete alice's product and a record that does not exist:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": ["VZOat4bWCVbRBGAq", "AAAAAAAAAAAAAAAA"] }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: ['VZOat4bWCVbRBGAq', 'AAAAAAAAAAAAAAAA'] })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({'record_id': ['VZOat4bWCVbRBGAq', 'AAAAAAAAAAAAAAAA']}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> del VZOat4bWCVbRBGAq AAAAAAAAAAAAAAAA
Not deleted VZOat4bWCVbRBGAq: You cannot delete record VZOat4bWCVbRBGAq: only its uploader can.
Not deleted AAAAAAAAAAAAAAAA: Record AAAAAAAAAAAAAAAA does not exist.
```

:::

```json
// Response
{
  "deleted": [],
  "failed": [
    {
      "code": "NO_ACCESS",
      "message": "You cannot delete record VZOat4bWCVbRBGAq: only its uploader can.",
      "record_id": "VZOat4bWCVbRBGAq"
    },
    {
      "code": "NOT_FOUND",
      "message": "Record AAAAAAAAAAAAAAAA does not exist.",
      "record_id": "AAAAAAAAAAAAAAAA"
    }
  ]
}
```

The HTTP status is 200: a record you may not delete is a failed item, not a failed request.

### By query

`query` takes the same fields as [`getRecords`](/api-reference/database#getrecords): a collection, an index condition, a tag, a reference, a level. One call deletes the records of **one page** of that query, so `fetch.limit` (up to 1000) is the most it deletes. Here every record in `tmp` whose index `old` is `true`, up to 100 of them:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "tmp",
      "index": { "name": "old", "value": true }
    },
    "fetch": { "limit": 100 }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: {
      collection: 'tmp',
      index: { name: 'old', value: true }
    },
    fetch: { limit: 100 }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({
        'query': {
            'collection': 'tmp',
            'index': {'name': 'old', 'value': True}
        },
        'fetch': {'limit': 100}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw deleteRecords '{"query": {"collection": "tmp", "index": {"name": "old", "value": true}}, "fetch": {"limit": 100}}'
```

:::

```json
// Response
{
  "deleted": ["VZOatTr4nzHmBGAq"],
  "failed": []
}
```

::: tip
To delete more than one page, call again with the same query until `deleted` comes back empty. Run the query through `getRecords` first when you are not sure what it matches: a string index with `condition: "<="` is an ends-with match, and `">="` is starts-with.
:::

::: warning
A query without `access_level` covers every level you can read, your own `"**"` records and the `"**"` records granted to you. The records in that page that are not yours come back in `failed`, not in `deleted`, unless one of the rules below lets you delete them. See [Access Levels](/database/access-levels) for which records a query reads.
:::

## Who may delete a record

- **The uploader** can delete their own records.
- **The admin** (the operating system user who runs DADABADA) can delete any record with `ddbd admin record del <record id>` or the web admin, read-only ones included. No network user has admin powers.
- **The uploader of a record with `can_remove_referencing_records`** can delete the records that point to it, whoever uploaded them. See [the example below](#deleting-records-that-point-to-your-record).
- **Read-only records** (`readonly: true`) can be deleted by the admin only. Trying as the uploader:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4ixBwfABGAq" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4ixBwfABGAq' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({'record_id': 'VZOat4ixBwfABGAq'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> del VZOat4ixBwfABGAq
Not deleted VZOat4ixBwfABGAq: Record VZOat4ixBwfABGAq is read-only; only the admin can delete it.
```

:::

```json
// Response
{
  "deleted": [],
  "failed": [
    {
      "code": "NO_ACCESS",
      "message": "Record VZOat4ixBwfABGAq is read-only; only the admin can delete it.",
      "record_id": "VZOat4ixBwfABGAq"
    }
  ]
}
```

- **Agent keys** delete as their user, within the key's limits. A `read_only` key refuses every delete, and a key limited to some collections cannot delete outside them.

### Deleting records that point to your record

alice's poll `VZOat4m1c1X6BGAq` was created with `source.can_remove_referencing_records: true`. bob's vote points to it:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "collection": "votes", "reference": "VZOat4m1c1X6BGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: { collection: 'votes', reference: 'VZOat4m1c1X6BGAq' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({
        'query': {'collection': 'votes', 'reference': 'VZOat4m1c1X6BGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get votes --ref VZOat4m1c1X6BGAq
VZOat4mRs2dQvjJk  votes/05  [rating=4]  ref:VZOat4m1c1X6BGAq  "good"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "05", "name": "votes" },
      "data": "good",
      "index": [{ "name": "rating", "value": 4 }],
      "record_id": "VZOat4mRs2dQvjJk",
      "reference": "VZOat4m1c1X6BGAq",
      "user_id": "nRcziH7v"
    }
  ],
  "start_key": "end"
}
```

alice, the poll's uploader, deletes bob's vote:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "VZOat4mRs2dQvjJk" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: 'VZOat4mRs2dQvjJk' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({'record_id': 'VZOat4mRs2dQvjJk'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> del VZOat4mRs2dQvjJk
Deleted VZOat4mRs2dQvjJk
```

:::

```json
// Response
{
  "deleted": ["VZOat4mRs2dQvjJk"],
  "failed": []
}
```

Without `can_remove_referencing_records` on the poll, the same request would come back with `NO_ACCESS` in `failed`, because only bob uploaded the vote. See [Referencing](/database/referencing#removing-referencing-records).

## What happens to records that point to a deleted record

When a record is deleted, the records that reference it are handled in the background, a moment after the delete:

| the deleted record had | records pointing to it are |
|---|---|
| `source.can_remove_referencing_records: true` | **deleted too** |
| the default (`false`) | kept, with their `reference` cleared to `null` |

The cascade goes down the chain: each record deleted this way applies its own `can_remove_referencing_records` to the records that point to it. The cascade also deletes read-only records.

The delete itself also removes the record's grants, frees its unique id and lowers the `referenced_count` of the record it pointed to. The delete call answers at once; the cascade is background work. Collection, tag and index counters, and the listings built on them, follow a moment later as well. A collection disappears when its last record is deleted.

::: tip
`referenced_count` on a record tells you how many records point to it. Read the record with [`getRecords`](/api-reference/database#getrecords) before deleting it when the cascade matters.
:::
