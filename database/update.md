# Updating Records

[`postRecord`](/api-reference/database#postrecord) updates a record when `config.record_id` is given: put the record's id there, with the fields to change beside it. Only the fields you send change; everything you leave out stays as it is.

## Changing the data

The record `VZOat4bWCVbRBGAq` is a product with five indexes, two tags and the unique id `sku-1042`. This request changes its data and nothing else:

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "title": "Desk Lamp", "color": "blue" },
    "config": { "record_id": "VZOat4bWCVbRBGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { title: 'Desk Lamp', color: 'blue' },
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
        'data': {'title': 'Desk Lamp', 'color': 'blue'},
        'config': {'record_id': 'VZOat4bWCVbRBGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4bWCVbRBGAq --data '{"title":"Desk Lamp","color":"blue"}'
Updated VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"blue","title":"Desk Lamp"}
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "products" },
  "data": { "color": "blue", "title": "Desk Lamp" },
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
```

The answer is the whole record as it is now stored. The indexes, tags and unique id are untouched because the request did not mention them.

::: tip
`data` replaces the record's data as a whole. There is no merge: send the complete new value. To leave the data alone, leave `data` out of the body.
:::

### Finding the record by its unique id

`config.record_id` takes the record id only. A [unique id](/database/unique-id) there answers `404 NOT_FOUND` `Record sku-1042 does not exist.` To update a record you know by its unique id, look it up first with [`getRecords`](/api-reference/database#getrecords) and `query.unique_id`:

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
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"blue","title":"Desk Lamp"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "05", "name": "products" },
      "data": { "color": "blue", "title": "Desk Lamp" },
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

The record id is `list[0].record_id` of that answer. Then update the record by its record id:

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
Updated VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
```

:::

```json
// Response
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
```

## What each field does on an update

Only the fields you send change. This is what each one does when it is present:

```ts
// postRecord body: an update
{
    data?: any; // Default: kept. Any JSON. Replaces the record's data. Left out, the data is kept.
    config: {   // Required.
        /** Required. The record id of the record to update (a unique id is not accepted here). */
        /** Its presence is what makes the call an update. */
        record_id: string;
        /** Default: kept. Can also be the new collection name as a string. */
        collection?: string | {
            name?: string; // Default: kept. Moves the record to another collection.
            /** Default: kept. "00" to "99" (two digits) or "**". Moves the record to another level: one at */
            /** or below your level, or "**". Checked only when the level changes. Only the uploader can */
            /** move a record into or out of "**". */
            access_level?: string;
            /** Default: kept. Replaces all five subscription settings. */
            /** A setting missing from the object becomes false. */
            subscription?: object | null;
        };
        /** Default: kept. The list REPLACES ALL indexes. null removes all of them. A single object is refused. */
        index?: { name: string; value: string | number | boolean }[] | null;
        /** Default: kept. Replaces the tags. null removes them. A comma-separated string is refused. */
        tags?: string[] | null;
        /** Default: kept. Changes the unique id. null removes it. The new id must not be used by another record. */
        unique_id?: string | null;
        /** Default: kept. A string (record id or unique id), {record_id} (record id) or {unique_id} (unique id). */
        /** Changes the record this one points to; the new target's source rules are checked. null removes */
        /** the reference. While the reference stays the same, a changed index is checked against the */
        /** target's referencing_index_restrictions. */
        reference?: string | { record_id: string } | { unique_id: string } | null;
        /** Default: kept. An object changes only the rules it names; the other rules keep their values. */
        /** null resets every rule to its default. */
        source?: object | null;
        /** Default: kept. Sets the read-only flag. Once true, only the admin can change or delete the record. */
        readonly?: boolean;
        /** Default: kept. Stored with the record. Notifications are sent only when a record is created, */
        /** so on an update it sends nothing. */
        notification?: { title: string; body: string } | null;
    };
}
```

Three fields on the record itself change on every update: `updated` is set to now, `ip` to the caller's address, and `agent` to the agent key that made the change, as `{key_id, name}` (`null` for a password session; a change by the admin keeps the old value).

An update never puts the record into feeds and never sends notifications, whatever its `collection.subscription` settings. See [Subscriptions](/database/subscription).

::: warning
`index` is replaced as a whole. Sending a list with one index on a record that has five leaves it with one. To change one value, send the full list again with that value changed.
:::

## Examples

### Replace the indexes

The record `VZOat4azQj6RBGAq` had one index, `price: 35`. After this request it has exactly the two indexes sent:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "index": [
        { "name": "price", "value": 39 },
        { "name": "title", "value": "Lamp Shade" }
      ]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4azQj6RBGAq',
      index: [
        { name: 'price', value: 39 },
        { name: 'title', value: 'Lamp Shade' }
      ]
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
            'record_id': 'VZOat4azQj6RBGAq',
            'index': [
                {'name': 'price', 'value': 39},
                {'name': 'title', 'value': 'Lamp Shade'}
            ]
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4azQj6RBGAq --index price=39 --index "title=Lamp Shade"
Updated VZOat4azQj6RBGAq  products/00  [price=39 title="Lamp Shade"]  {"title":"Lamp shade"}
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "products" },
  "data": { "title": "Lamp shade" },
  "index": [
    { "name": "price", "value": 39 },
    { "name": "title", "value": "Lamp Shade" }
  ],
  "record_id": "VZOat4azQj6RBGAq",
  "user_id": "JFeCedoO"
}
```

### Replace the tags

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "tags": ["lighting", "new"]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4azQj6RBGAq',
      tags: ['lighting', 'new']
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
            'record_id': 'VZOat4azQj6RBGAq',
            'tags': ['lighting', 'new']
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4azQj6RBGAq --tags lighting,new
Updated VZOat4azQj6RBGAq  products/00  [price=39 title="Lamp Shade"]  tags:lighting,new  {"title":"Lamp shade"}
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "products" },
  "data": { "title": "Lamp shade" },
  "index": [
    { "name": "price", "value": 39 },
    { "name": "title", "value": "Lamp Shade" }
  ],
  "record_id": "VZOat4azQj6RBGAq",
  "tags": ["lighting", "new"],
  "user_id": "JFeCedoO"
}
```

### Move to another level

Send `collection` as an object with only the part that changes. Here the name is left out, so the record stays in `products` and only its level moves:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "collection": { "access_level": "03" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4azQj6RBGAq',
      collection: { access_level: '03' }
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
            'record_id': 'VZOat4azQj6RBGAq',
            'collection': {'access_level': '03'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4azQj6RBGAq --level 03
Updated VZOat4azQj6RBGAq  products/03  [price=39 title="Lamp Shade"]  tags:lighting,new  {"title":"Lamp shade"}
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
  "user_id": "JFeCedoO"
}
```

To move the record to another collection, send `collection: { "name": "other" }` the same way. The writer of a record sets its level; see [Access Levels](/database/access-levels) for which levels you may post at.

### Remove all indexes and tags

`null` clears a field:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4vZyA5iBGAq",
      "index": null,
      "tags": null
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4vZyA5iBGAq',
      index: null,
      tags: null
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
            'record_id': 'VZOat4vZyA5iBGAq',
            'index': None,
            'tags': None
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4vZyA5iBGAq --no-index --tags ""
Updated VZOat4vZyA5iBGAq  notes/00  null
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "notes" },
  "data": null,
  "record_id": "VZOat4vZyA5iBGAq",
  "user_id": "JFeCedoO"
}
```

The same works for `unique_id: null`, `reference: null` and `source: null`.

### Change the unique id

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "unique_id": "shade-01"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4azQj6RBGAq',
      unique_id: 'shade-01'
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
            'record_id': 'VZOat4azQj6RBGAq',
            'unique_id': 'shade-01'
        }
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

From now on `shade-01` finds this record wherever a unique id is accepted: `query.unique_id`, a `reference`, and `unique_id` in `deleteRecords`. See [Unique ID](/database/unique-id#where-a-unique-id-is-accepted).

### Change one source rule, keep the rest

`source` is merged: only the rules named in the object change. The poll `VZOat4m1c1X6BGAq` was created with four rules; this raises its `referencing_limit` and leaves the other three as they were:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4m1c1X6BGAq",
      "source": { "referencing_limit": 10 }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      record_id: 'VZOat4m1c1X6BGAq',
      source: { referencing_limit: 10 }
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
            'record_id': 'VZOat4m1c1X6BGAq',
            'source': {'referencing_limit': 10}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4m1c1X6BGAq --source '{"referencing_limit":10}'
Updated VZOat4m1c1X6BGAq  polls/05  {"question":"Rate the lamp"}
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "polls" },
  "data": { "question": "Rate the lamp" },
  "record_id": "VZOat4m1c1X6BGAq",
  "referenced_count": 1,
  "source": {
    "allow_granted_to_grant_others": false,
    "can_remove_referencing_records": true,
    "only_granted_can_reference": false,
    "prevent_multiple_referencing": true,
    "referencing_index_restrictions": [
      { "condition": null, "name": "rating", "range": 5, "value": 1 }
    ],
    "referencing_limit": 10
  },
  "user_id": "JFeCedoO"
}
```

`source: null` is the opposite: it resets every rule to its default. See [Referencing](/database/referencing) for what each rule does.

### Several updates in one request

[`postRecords`](/api-reference/database#postrecords) takes a list of `postRecord` bodies in `items`, and an item with `config.record_id` is an update. Each item is saved on its own, so one refused item does not stop the others; the answer is `{list: [records saved], failed: [{index, code, message}]}`.

## Who may update a record

- **The uploader.** Only the user who uploaded a record can change it.
- **The admin.** The operating system user who runs DADABADA can change any record from the web admin or its admin API. No network user ever has admin powers, whatever their level.
- **Read-only records** (`readonly: true`) can be changed by the admin only, not even by the uploader.
- **Moving into or out of `"**"`** (private) can be done only by the uploader, not by the admin.
- **Agent keys** write as their user, within the key's limits: a `read_only` key refuses every write, a key with `max_level` cannot move a record above that level, a key without `private` cannot change a `"**"` record or move a record into or out of `"**"`, and a key limited to some collections cannot update records in, or move records to, other collections. See [Access Levels](/database/access-levels).
- A record cannot reference itself.

## Errors

| status | code | message | when |
|---|---|---|---|
| 403 | `NO_ACCESS` | `Only the uploader of record VZOat4bWCVbRBGAq can change it.` | you are not the uploader |
| 403 | `NO_ACCESS` | `Record VZOat4ixBwfABGAq is read-only; only the admin can change it.` | the record has `readonly: true` |
| 403 | `NO_ACCESS` | `You can post at access levels up to 05 (or ** for private); 09 is above that.` | the new `access_level` is above your level |
| 403 | `NO_ACCESS` | `You cannot reference record VZOat4j7WgY5BGAq: you cannot read it.` | the new `reference` points to a record you cannot read |
| 404 | `NOT_FOUND` | `The referenced record no-such-thing does not exist.` | the new `reference` points to nothing |
| 400 | `REFERENCE_LIMIT` | `Record VZOat4ql4WZ4BGAq does not allow references (referencing_limit is 0).` | the new target's `referencing_limit` is 0 or reached (`Record VZOat4ql4WZ4BGAq already has 3 references; its limit is 3.`), or you already reference it and it has `prevent_multiple_referencing` |
| 403 | `NO_ACCESS` | `Only users granted access to record VZOat4j7WgY5BGAq can reference it.` | the new target has `only_granted_can_reference` and you are not granted |
| 400 | `REFERENCE_RESTRICTED` | `Record VZOat4m1c1X6BGAq only accepts references whose index "rating" matches its referencing_index_restrictions.` | the record's indexes do not meet the new target's restrictions |
| 400 | `REFERENCE_RESTRICTED` | `Record VZOat4m1c1X6BGAq requires index "rating" to match its restrictions.` | the reference stays the same and the changed `index` no longer meets the target's restrictions |
| 400 | `INVALID_REQUEST` | `A record cannot reference itself.` | `reference` names the record being updated |
| 403 | `NO_ACCESS` | `Only the uploader can move a record into or out of private (**).` | the admin tried to move a record into or out of `"**"` |
| 403 | `NO_ACCESS` | `This agent key is read-only.` | the agent key was created with `read_only` |
| 409 | `EXISTS` | `unique_id "sku-1042" is already used by another record.` | the new `unique_id` is taken |
| 400 | `INVALID_REQUEST` | `Unknown config key "access_level". Allowed: record_id, collection, index, tags, reference, unique_id, source, readonly, notification. Put it inside collection: {"collection": {"name": ..., "access_level": ...}}.` | a key in the wrong place or a bad value |
| 404 | `NOT_FOUND` | `Record VZOat4bWCVbRBGAq does not exist.` | `config.record_id` names no record |

Someone else trying to take over a record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "mine now",
    "config": { "record_id": "VZOat4bWCVbRBGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'mine now',
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
        'data': 'mine now',
        'config': {'record_id': 'VZOat4bWCVbRBGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> update VZOat4bWCVbRBGAq --data '"mine now"'
NO_ACCESS: Only the uploader of record VZOat4bWCVbRBGAq can change it.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "Only the uploader of record VZOat4bWCVbRBGAq can change it."
  }
}
```

The uploader trying to change a read-only record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "terms v2",
    "config": { "record_id": "VZOat4ixBwfABGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'terms v2',
    config: { record_id: 'VZOat4ixBwfABGAq' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'data': 'terms v2',
        'config': {'record_id': 'VZOat4ixBwfABGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> update VZOat4ixBwfABGAq --data '"terms v2"'
NO_ACCESS: Record VZOat4ixBwfABGAq is read-only; only the admin can change it.
```

:::

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "Record VZOat4ixBwfABGAq is read-only; only the admin can change it."
  }
}
```

::: danger
`readonly: true` cannot be undone by the uploader. After it is set, only `ddbd admin` or the web admin can change or delete the record.
:::
