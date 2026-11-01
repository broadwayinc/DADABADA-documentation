# Referencing

A record can point to one other record. Set `config.reference` in [`postRecord`](/api-reference/database#postrecord) to the record id or unique id of the record to point to. Comments on an article, votes on a poll, items in an order and likes on a post are all references, and [`getRecords`](/api-reference/database#getrecords) with `query.reference` lists the records that point to a record.

The record pointed to (the target) sets the rules: its `source` says how many records may point to it, who may, and what indexes they must carry.

## Creating a reference

First the record to be referenced. alice posts an article with a [unique id](/database/unique-id):

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
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

### Referencing by record id

bob comments on it. `reference` is the article's `record_id`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "first!",
    "config": {
      "collection": { "name": "comments", "access_level": "05" },
      "reference": "VZOat4j7WgY5BGAq"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'first!',
    config: {
      collection: { name: 'comments', access_level: '05' },
      reference: 'VZOat4j7WgY5BGAq'
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
        'data': 'first!',
        'config': {
            'collection': {'name': 'comments', 'access_level': '05'},
            'reference': 'VZOat4j7WgY5BGAq'
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post comments --level 05 --ref VZOat4j7WgY5BGAq --data '"first!"'
Saved record VZOat4jE6fc2vjJk
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "comments" },
  "data": "first!",
  "record_id": "VZOat4jE6fc2vjJk",
  "reference": "VZOat4j7WgY5BGAq",
  "user_id": "nRcziH7v"
}
```

### Referencing by unique id

The article's unique id works in the same place. The stored `reference` is always the target's `record_id`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "second",
    "config": {
      "collection": { "name": "comments", "access_level": "05" },
      "reference": "article-1"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'second',
    config: {
      collection: { name: 'comments', access_level: '05' },
      reference: 'article-1'
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
        'data': 'second',
        'config': {
            'collection': {'name': 'comments', 'access_level': '05'},
            'reference': 'article-1'
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post comments --level 05 --ref article-1 --data '"second"'
Saved record VZOat4kPyQDPvjJk
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "comments" },
  "data": "second",
  "record_id": "VZOat4kPyQDPvjJk",
  "reference": "VZOat4j7WgY5BGAq",
  "user_id": "nRcziH7v"
}
```

### The object form

`reference` also takes `{ "record_id": "..." }` or `{ "unique_id": "..." }`. Use it when your code must say which kind of id it holds. Here the key decides: `record_id` holds a record id only, and `unique_id` holds a unique id only. A unique id inside `{ "record_id": ... }` answers `404 NOT_FOUND` `The referenced record article-1 does not exist.`, and a record id inside `{ "unique_id": ... }` answers `404 NOT_FOUND` `No record has the unique id VZOat4j7WgY5BGAq.` Only the plain string takes either kind.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "thanks",
    "config": {
      "collection": { "name": "comments", "access_level": "05" },
      "reference": { "unique_id": "article-1" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'thanks',
    config: {
      collection: { name: 'comments', access_level: '05' },
      reference: { unique_id: 'article-1' }
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
        'data': 'thanks',
        'config': {
            'collection': {'name': 'comments', 'access_level': '05'},
            'reference': {'unique_id': 'article-1'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw postRecord '{"data": "thanks", "config": {"collection": {"name": "comments", "access_level": "05"}, "reference": {"unique_id": "article-1"}}}'
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "comments" },
  "data": "thanks",
  "record_id": "VZOat4kZcMQmBGAq",
  "reference": "VZOat4j7WgY5BGAq",
  "user_id": "JFeCedoO"
}
```

```ts
// postRecord body: config.reference
{
    config: {
        /** Default: none. The record this one points to: a string (record id or unique id), */
        /** {record_id} (record id) or {unique_id} (unique id). You must be able to read it, and its */
        /** source rules are checked. On an update, null removes the reference and a new id moves it */
        /** (the new target's rules are checked). A record cannot reference itself. */
        reference?: string | { record_id: string } | { unique_id: string } | null;
        // other config fields: see Creating Records
    };
}
```

### You must be able to read the target

carol is level 00 and the article is level 05:

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You cannot reference record VZOat4j7WgY5BGAq: you cannot read it."
  }
}
```

And the target must exist. `"reference": "no-such-thing"` answers:

```json
// Response (404)
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The referenced record no-such-thing does not exist."
  }
}
```

## Fetching the records that point to a record

Put the target in `query.reference` of [`getRecords`](/api-reference/database#getrecords). A collection is still required: references are fetched per collection.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "collection": "comments", "reference": "VZOat4j7WgY5BGAq" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: { collection: 'comments', reference: 'VZOat4j7WgY5BGAq' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({
        'query': {'collection': 'comments', 'reference': 'VZOat4j7WgY5BGAq'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get comments --ref VZOat4j7WgY5BGAq
VZOat4jE6fc2vjJk  comments/05  ref:VZOat4j7WgY5BGAq  "first!"
VZOat4kPyQDPvjJk  comments/05  ref:VZOat4j7WgY5BGAq  "second"
VZOat4kZcMQmBGAq  comments/05  ref:VZOat4j7WgY5BGAq  "thanks"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "05", "name": "comments" },
      "data": "first!",
      "record_id": "VZOat4jE6fc2vjJk",
      "reference": "VZOat4j7WgY5BGAq",
      "user_id": "nRcziH7v"
    },
    {
      "collection": { "access_level": "05", "name": "comments" },
      "data": "second",
      "record_id": "VZOat4kPyQDPvjJk",
      "reference": "VZOat4j7WgY5BGAq",
      "user_id": "nRcziH7v"
    },
    {
      "collection": { "access_level": "05", "name": "comments" },
      "data": "thanks",
      "record_id": "VZOat4kZcMQmBGAq",
      "reference": "VZOat4j7WgY5BGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

Without an `index` the comments come in upload order; add an `index` condition, a `tag` or an `access_level` to narrow or sort them, as in any query. `"reference": { "unique_id": "article-1" }` gives the same list.

`query.reference` has one more form, `{ "user_id": "..." }`, which fetches that user's records in the collection (the same as the `$user_id` index). It is a different thing from a record reference.

### How many records point to a record

Every record carries `referenced_count`, the number of records pointing to it. It is left out of a response while it is 0. The article after its three comments:

```json
{
  "collection": { "access_level": "05", "name": "articles" },
  "data": { "title": "Hello world" },
  "record_id": "VZOat4j7WgY5BGAq",
  "referenced_count": 3,
  "unique_id": "article-1",
  "user_id": "JFeCedoO"
}
```

The count on the record is always exact. It is also a built-in index, `$referenced_count`, so a collection can be sorted or filtered by it (`"index": { "name": "$referenced_count", "value": 2, "condition": ">=" }` for records with at least two references). Sorting by `$referenced_count` can lag the true count for a moment, because the index is kept by the background worker.

### Removing a reference

Update the record with `"reference": null`. To point it somewhere else, send the new id; the new target's rules are checked as on create. See [Updating Records](/database/update).

## Source rules

`config.source` on a record sets the rules for the records that will point to it. Any key not in the type below is refused. The rules apply to every user, the target's uploader included (only `only_granted_can_reference` lets the uploader through); the admin is not bound by them.

```ts
// postRecord body: config.source
{
    config: {
        source?: {
            referencing_limit?: number | null;        // Default: null (unlimited). The most records that may point here, 0 or more. 0 means none.
            prevent_multiple_referencing?: boolean;   // Default: false. One pointing record per user.
            /** Default: false. Deleting this record deletes the records pointing to it, */
            /** and this record's uploader may delete them directly. */
            can_remove_referencing_records?: boolean;
            only_granted_can_reference?: boolean;     // Default: false. Only the uploader and granted users may point here.
            allow_granted_to_grant_others?: boolean;  // Default: false. Granted users may grant other users access to this record.
            /** Default: none. Every restriction must be met by a pointing record's indexes. A list of */
            /** restrictions, or null; one restriction goes in a list of one. Fields: see Index restrictions. */
            referencing_index_restrictions?: object[] | null;
        } | null;
        // other config fields: see Creating Records
    };
}
```

On an update, a `source` object changes only the keys it names and `source: null` resets all six. A record's `source` always comes back in full in the response, with the defaults filled in.

### Referencing limit

A poll that takes at most 3 votes, one per user, each with a `rating` index from 1 to 5. Three rules at once, plus `can_remove_referencing_records` so alice can remove votes:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "question": "Rate the lamp" },
    "config": {
      "collection": { "name": "polls", "access_level": "05" },
      "source": {
        "referencing_limit": 3,
        "prevent_multiple_referencing": true,
        "can_remove_referencing_records": true,
        "referencing_index_restrictions": [
          { "name": "rating", "value": 1, "range": 5 }
        ]
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { question: 'Rate the lamp' },
    config: {
      collection: { name: 'polls', access_level: '05' },
      source: {
        referencing_limit: 3,
        prevent_multiple_referencing: true,
        can_remove_referencing_records: true,
        referencing_index_restrictions: [
          { name: 'rating', value: 1, range: 5 }
        ]
      }
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
        'data': {'question': 'Rate the lamp'},
        'config': {
            'collection': {'name': 'polls', 'access_level': '05'},
            'source': {
                'referencing_limit': 3,
                'prevent_multiple_referencing': True,
                'can_remove_referencing_records': True,
                'referencing_index_restrictions': [
                    {'name': 'rating', 'value': 1, 'range': 5}
                ]
            }
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post polls --level 05 --data '{"question": "Rate the lamp"}' --source '{"referencing_limit": 3, "prevent_multiple_referencing": true, "can_remove_referencing_records": true, "referencing_index_restrictions": [{"name": "rating", "value": 1, "range": 5}]}'
Saved record VZOat4m1c1X6BGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "polls" },
  "data": { "question": "Rate the lamp" },
  "record_id": "VZOat4m1c1X6BGAq",
  "source": {
    "allow_granted_to_grant_others": false,
    "can_remove_referencing_records": true,
    "only_granted_can_reference": false,
    "prevent_multiple_referencing": true,
    "referencing_index_restrictions": [
      { "condition": null, "name": "rating", "range": 5, "value": 1 }
    ],
    "referencing_limit": 3
  },
  "user_id": "JFeCedoO"
}
```

A vote that meets the rules. bob points to the poll with a `rating` of 4:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "good",
    "config": {
      "collection": { "name": "votes", "access_level": "05" },
      "reference": "VZOat4m1c1X6BGAq",
      "index": [{ "name": "rating", "value": 4 }]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'good',
    config: {
      collection: { name: 'votes', access_level: '05' },
      reference: 'VZOat4m1c1X6BGAq',
      index: [{ name: 'rating', value: 4 }]
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
        'data': 'good',
        'config': {
            'collection': {'name': 'votes', 'access_level': '05'},
            'reference': 'VZOat4m1c1X6BGAq',
            'index': [{'name': 'rating', 'value': 4}]
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post votes --level 05 --ref VZOat4m1c1X6BGAq --index rating=4 --data '"good"'
Saved record VZOat4mRs2dQvjJk
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "votes" },
  "data": "good",
  "index": [{ "name": "rating", "value": 4 }],
  "record_id": "VZOat4mRs2dQvjJk",
  "reference": "VZOat4m1c1X6BGAq",
  "user_id": "nRcziH7v"
}
```

After three such votes the poll is full, and the fourth is refused with `REFERENCE_LIMIT`.

**A limit of 0 closes a record to references.** Nobody may point to it, not even its uploader:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "closed",
      "source": { "referencing_limit": 0 }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      collection: 'closed',
      source: { referencing_limit: 0 }
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
            'collection': 'closed',
            'source': {'referencing_limit': 0}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post closed --source '{"referencing_limit":0}'
Saved record VZOat4ql4WZ4BGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "closed" },
  "data": null,
  "record_id": "VZOat4ql4WZ4BGAq",
  "source": {
    "allow_granted_to_grant_others": false,
    "can_remove_referencing_records": false,
    "only_granted_can_reference": false,
    "prevent_multiple_referencing": false,
    "referencing_index_restrictions": [],
    "referencing_limit": 0
  },
  "user_id": "JFeCedoO"
}
```

alice herself tries `"reference": "VZOat4ql4WZ4BGAq"`:

```json
// Response (400)
{
  "error": {
    "code": "REFERENCE_LIMIT",
    "message": "Record VZOat4ql4WZ4BGAq does not allow references (referencing_limit is 0)."
  }
}
```

### One reference per user

`prevent_multiple_referencing` lets each user point to the record once. bob votes a second time on the poll above:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": { "name": "votes", "access_level": "05" },
      "reference": "VZOat4m1c1X6BGAq",
      "index": [{ "name": "rating", "value": 5 }]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      collection: { name: 'votes', access_level: '05' },
      reference: 'VZOat4m1c1X6BGAq',
      index: [{ name: 'rating', value: 5 }]
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
            'collection': {'name': 'votes', 'access_level': '05'},
            'reference': 'VZOat4m1c1X6BGAq',
            'index': [{'name': 'rating', 'value': 5}]
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post votes --level 05 --ref VZOat4m1c1X6BGAq --index rating=5
REFERENCE_LIMIT: You already reference record VZOat4m1c1X6BGAq, and it allows one reference per user.
```

:::

```json
// Response (400)
{
  "error": {
    "code": "REFERENCE_LIMIT",
    "message": "You already reference record VZOat4m1c1X6BGAq, and it allows one reference per user."
  }
}
```

To let bob change his vote, update his existing vote record instead of posting a new one, or delete it first.

### Removing referencing records

`can_remove_referencing_records` gives the record's uploader two powers over the records that point to it:

1. **Direct delete.** The uploader can delete them with [`deleteRecords`](/api-reference/database#deleterecords), although someone else uploaded them. alice deletes bob's vote:

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

2. **Cascade.** When the record itself is deleted, every record pointing to it is deleted too, in the background a moment later. Without this rule, those records are kept and their `reference` is cleared to `null`. See [Deleting Records](/database/delete#what-happens-to-records-that-point-to-a-deleted-record).

::: tip
This is the rule for a discussion board: the author of a post can remove comments on it, and deleting the post takes its comments with it.
:::

### Only granted users may reference

`only_granted_can_reference` closes a record to everyone except its uploader and the users granted access to it with [`grantPrivateRecordAccess`](/api-reference/database#grantprivaterecordaccess). The record's writer chooses whom to grant. alice makes an invitation list that only invited users can answer:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "event": "Launch party" },
    "config": {
      "collection": "invitations",
      "source": { "only_granted_can_reference": true }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { event: 'Launch party' },
    config: {
      collection: 'invitations',
      source: { only_granted_can_reference: true }
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
        'data': {'event': 'Launch party'},
        'config': {
            'collection': 'invitations',
            'source': {'only_granted_can_reference': True}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post invitations --source '{"only_granted_can_reference":true}' --data '{"event":"Launch party"}'
```

:::

The record is level `00`, so everyone can read it, but a reply that points to it (`"reference": "<its record_id>"`) is refused with `NO_ACCESS` until alice grants the replying user:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/grantPrivateRecordAccess \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "record_id": "<the invitation record_id>", "user_id": "nRcziH7v" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/grantPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ record_id: '<the invitation record_id>', user_id: 'nRcziH7v' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/grantPrivateRecordAccess',
    data=json.dumps({'record_id': '<the invitation record_id>', 'user_id': 'nRcziH7v'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grant <the invitation record_id> nRcziH7v
```

:::

From then on bob's reply is accepted. Grants are explained in [Access Levels](/database/access-levels#granting-access-to-a-record).

### Letting granted users grant others

By default only the uploader can grant access to a record. With `allow_granted_to_grant_others`, a granted user can call [`grantPrivateRecordAccess`](/api-reference/database#grantprivaterecordaccess) on it as well. A shared `"**"` document that anyone invited may pass on:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "title": "Roadmap draft" },
    "config": {
      "collection": { "name": "docs", "access_level": "**" },
      "source": { "allow_granted_to_grant_others": true }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { title: 'Roadmap draft' },
    config: {
      collection: { name: 'docs', access_level: '**' },
      source: { allow_granted_to_grant_others: true }
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
        'data': {'title': 'Roadmap draft'},
        'config': {
            'collection': {'name': 'docs', 'access_level': '**'},
            'source': {'allow_granted_to_grant_others': True}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post docs --level ** --source '{"allow_granted_to_grant_others":true}' --data '{"title":"Roadmap draft"}'
```

:::

alice grants bob; bob, now granted, can grant carol with the same `grantPrivateRecordAccess` call, and `removePrivateRecordAccess` too. Without the rule, bob's attempt answers:

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "Only the uploader of record VZOat4YnzzgCBGAq can grant access to it."
  }
}
```

### Index restrictions

`referencing_index_restrictions` says what indexes a pointing record must carry. It is a list of restrictions, or `null` for none, and a pointing record must meet every one of them. A single restriction goes in a list of one; an object without the list is refused with `referencing_index_restrictions must be a list, or null.` Each restriction is:

```ts
// postRecord body: config.source.referencing_index_restrictions
{
    config: {
        source: {
            referencing_index_restrictions: {
                name: string; // Required. The pointing record must have an index with this name.
                /** Default: none. If given, the index value is compared with it. The index value must be */
                /** of the same type: a value of another type fails every condition, "!=" included. */
                value?: string | number | boolean;
                /** Default: "=". How the value is compared. For strings ">=" is starts with and "<=" is */
                /** ends with; ">" and "<" compare strings in character order. Without value, the condition */
                /** is not used. Also accepted: "==", "eq", "ne", "gt", "lt", "gte", "lte". */
                condition?: "=" | "!=" | ">" | "<" | ">=" | "<=" | "==" | "eq" | "ne" | "gt" | "lt" | "gte" | "lte";
                /** Default: none. Same type as value. With value and no condition: the index value must lie */
                /** between value and range, inclusive. Ignored when condition is given. A range of another */
                /** type than value is refused: `A restriction's range must be the same type as its value.` */
                range?: string | number | boolean;
            }[] | null;
            // other source rules: see Source rules
        };
        // other config fields: see Creating Records
    };
}
```

The poll above used the range form, `{ "name": "rating", "value": 1, "range": 5 }`. A vote with `rating` 9:

```json
// Response (400)
{
  "error": {
    "code": "REFERENCE_RESTRICTED",
    "message": "Record VZOat4m1c1X6BGAq only accepts references whose index \"rating\" matches its referencing_index_restrictions."
  }
}
```

A vote with no `rating` index at all gets the same `REFERENCE_RESTRICTED` answer: the index must be present, not only in range when present.

**Every restriction form at once.** A board that accepts posts in English, with a `code` starting with `KR-`, whose `status` is anything but `spam`, and that carry an `author` index of any value:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "boards",
      "source": {
        "referencing_index_restrictions": [
          { "name": "lang", "value": "en" },
          { "name": "code", "value": "KR-", "condition": ">=" },
          { "name": "status", "value": "spam", "condition": "!=" },
          { "name": "author" }
        ]
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      collection: 'boards',
      source: {
        referencing_index_restrictions: [
          { name: 'lang', value: 'en' },
          { name: 'code', value: 'KR-', condition: '>=' },
          { name: 'status', value: 'spam', condition: '!=' },
          { name: 'author' }
        ]
      }
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
            'collection': 'boards',
            'source': {
                'referencing_index_restrictions': [
                    {'name': 'lang', 'value': 'en'},
                    {'name': 'code', 'value': 'KR-', 'condition': '>='},
                    {'name': 'status', 'value': 'spam', 'condition': '!='},
                    {'name': 'author'}
                ]
            }
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post boards --source '{"referencing_index_restrictions": [{"name": "lang", "value": "en"}, {"name": "code", "value": "KR-", "condition": ">="}, {"name": "status", "value": "spam", "condition": "!="}, {"name": "author"}]}'
Saved record VZOat4oV20HIBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "boards" },
  "data": null,
  "record_id": "VZOat4oV20HIBGAq",
  "source": {
    "allow_granted_to_grant_others": false,
    "can_remove_referencing_records": false,
    "only_granted_can_reference": false,
    "prevent_multiple_referencing": false,
    "referencing_index_restrictions": [
      { "condition": null, "name": "lang", "range": null, "value": "en" },
      { "condition": ">=", "name": "code", "range": null, "value": "KR-" },
      { "condition": "!=", "name": "status", "range": null, "value": "spam" },
      { "condition": null, "name": "author", "range": null, "value": null }
    ],
    "referencing_limit": null
  },
  "user_id": "JFeCedoO"
}
```

The four forms, as stored:

| restriction | meaning |
|---|---|
| `{ "name": "lang", "value": "en" }` | `lang` must equal `en` (`condition` left out means `=`) |
| `{ "name": "code", "value": "KR-", "condition": ">=" }` | `code` must start with `KR-` |
| `{ "name": "status", "value": "spam", "condition": "!=" }` | `status` must be anything but `spam` |
| `{ "name": "author" }` | an `author` index must exist, with any value |

carol's post meets all four:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "posts",
      "reference": "VZOat4oV20HIBGAq",
      "index": [
        { "name": "lang", "value": "en" },
        { "name": "code", "value": "KR-001" },
        { "name": "status", "value": "ok" },
        { "name": "author", "value": "carol" }
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
      collection: 'posts',
      reference: 'VZOat4oV20HIBGAq',
      index: [
        { name: 'lang', value: 'en' },
        { name: 'code', value: 'KR-001' },
        { name: 'status', value: 'ok' },
        { name: 'author', value: 'carol' }
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
            'collection': 'posts',
            'reference': 'VZOat4oV20HIBGAq',
            'index': [
                {'name': 'lang', 'value': 'en'},
                {'name': 'code', 'value': 'KR-001'},
                {'name': 'status', 'value': 'ok'},
                {'name': 'author', 'value': 'carol'}
            ]
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> post posts --ref VZOat4oV20HIBGAq --index lang=en --index code=KR-001 --index status=ok --index author=carol
Saved record VZOat4peG88tFp9O
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "posts" },
  "data": null,
  "index": [
    { "name": "lang", "value": "en" },
    { "name": "code", "value": "KR-001" },
    { "name": "status", "value": "ok" },
    { "name": "author", "value": "carol" }
  ],
  "record_id": "VZOat4peG88tFp9O",
  "reference": "VZOat4oV20HIBGAq",
  "user_id": "Vv4JM09T"
}
```

The same post with `"status": "spam"` fails on that one restriction. The message names the index that did not match:

```json
// Response (400)
{
  "error": {
    "code": "REFERENCE_RESTRICTED",
    "message": "Record VZOat4oV20HIBGAq only accepts references whose index \"status\" matches its referencing_index_restrictions."
  }
}
```

Restrictions are checked when a record starts pointing to the target, on create or on an update that changes `reference`. They are checked again when a pointing record's `index` changes while its reference stays the same (`Record VZOat4oV20HIBGAq requires index "status" to match its restrictions.`). Changing the target's restrictions later does not re-check the records already pointing to it.

### Unknown source keys

Any key that is not one of the six rules is refused, so a typo never passes as a setting:

```json
// Response (400)
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Unknown source key \"limit\". Allowed: referencing_limit, prevent_multiple_referencing, can_remove_referencing_records, only_granted_can_reference, allow_granted_to_grant_others, referencing_index_restrictions."
  }
}
```

## Access by reference

A record that points to another record is readable by whoever uploaded, or was granted, the record it points to, whatever the pointing record's level, `"**"` included. This is how a reply stays between two people: bob posts a `"**"` comment pointing to alice's article. bob can read it because it is his, and alice can read it because the comment points to her article. Other users cannot, unless alice grants them the article.

A reference is also the way to a [private access key](/database/access-levels#private-access-keys): a user who can read a record that points to another record can ask for a key to that other record, naming the pointing record in `reference_id`.

::: warning
Reading by reference works in one direction: the target's uploader and granted users can read the records that point to it, not the other way round. You must already be able to read a record to reference it. The one way a pointing record leads to its target is the private access key above, which anyone who can read the pointing record can request.
:::
