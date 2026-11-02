# Fetching Records

This page covers finding records with [`getRecords`](/api-reference/database#getrecords). The body is `{"query": {...}, "fetch": {...}}`: `query` says which records, `fetch` says how many and in which order. `query` is required, and any other key at the top of the body is refused with `400 INVALID_REQUEST` (see [getRecords](/api-reference/database#getrecords)). The answer is `{list, start_key, end_of_list}`, even for a single record.

The query picks one of these:

```ts
// getRecords body: the query object
{
    query: {  // Required.
        record_id?: string; // One record by record id (a unique id is not accepted here). Overrides everything else.
        unique_id?: string; // One record by unique id (a record id is not accepted here).
        /** Records of a collection, optionally narrowed by one index condition, one tag and a reference, */
        /** in any combination. A string is the collection name; the object form is under By collection. */
        collection?: string | { name: string; access_level?: string; subscription?: string };
        // index, tag, reference, private_key: see By index, By tag, By reference and By unique id
    };
    // fetch: see Paging
}
```

Any other key in `query` is refused, so a misplaced option never goes unnoticed.

## By record id

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DDBD serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "record_id": "VZOat4bWCVbRBGAq"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "record_id": "VZOat4bWCVbRBGAq"
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
        "query": {
            "record_id": "VZOat4bWCVbRBGAq"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get --id VZOat4bWCVbRBGAq
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

A direct lookup answers a one-record page. A record that does not exist answers `404 NOT_FOUND`; a record above your level answers `403 NO_ACCESS`:

```json
{
  "error": {
    "code": "NO_ACCESS",
    "message": "You have no access to record VZOat4dq5yx2BGAq."
  }
}
```

`query.private_key` takes a private access key and opens the one record the key was made for, private or above your level, in `record_id` and `unique_id` lookups. See [Access levels](/database/access-levels).

## By unique id

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "unique_id": "sku-1042"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "unique_id": "sku-1042"
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
        "query": {
            "unique_id": "sku-1042"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

`record_id` and `unique_id` do not cross over. A unique id sent as `record_id` answers `404 NOT_FOUND` `Record sku-1042 does not exist.`, and a record id sent as `unique_id` answers `404 NOT_FOUND` `No record has the unique id VZOat4bWCVbRBGAq.`

## By collection

### Every level you can read

With a collection name alone, the query covers every level you can read, plus your own and granted private records, merged in order. carol is level `00`, so she sees the level `00` products only:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products"
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
        "query": {
            "collection": "products"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> get products
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
VZOat4eE1sb8BGAq  products/00  [price=20 title="Straße İstanbul"]  null
VZOat4eJ1Y76BGAq  products/00  [price=10 title="カタカナ Ｓｈｏｐ"]  null
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": { "title": "Poster" },
      "index": [
        { "name": "price", "value": 990 },
        { "name": "title", "value": "New York Poster.PDF" },
        { "name": "in_stock", "value": false },
        { "name": "shop.brand", "value": "Arto" }
      ],
      "record_id": "VZOat4bhymcDBGAq",
      "tags": ["sale", "posters"],
      "user_id": "JFeCedoO"
    },
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": { "k": 1 },
      "index": [
        { "name": "price", "value": -1.5 },
        { "name": "title", "value": "안녕하세요 세계" }
      ],
      "record_id": "VZOat4cLmXRdBGAq",
      "tags": ["misc"],
      "user_id": "JFeCedoO"
    },
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": null,
      "index": [
        { "name": "price", "value": 20 },
        { "name": "title", "value": "Straße İstanbul" }
      ],
      "record_id": "VZOat4eE1sb8BGAq",
      "user_id": "JFeCedoO"
    },
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": null,
      "index": [
        { "name": "price", "value": 10 },
        { "name": "title", "value": "カタカナ Ｓｈｏｐ" }
      ],
      "record_id": "VZOat4eJ1Y76BGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

### One level only

Give `collection` as an object with `access_level` to read that level alone:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": {
        "name": "products",
        "access_level": "05"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": {
        "name": "products",
        "access_level": "05"
      }
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
        "query": {
            "collection": {
                "name": "products",
                "access_level": "05"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

`"access_level": "**"` lists private records: yours, and those granted to you.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": {
        "name": "diary",
        "access_level": "**"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": {
        "name": "diary",
        "access_level": "**"
      }
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
        "query": {
            "collection": {
                "name": "diary",
                "access_level": "**"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

### Subscription records

A record saved with `is_subscription_record` is read only by its uploader and the uploader's subscribers (a blocked subscriber cannot read it). A collection query finds such records only when it names the uploader in `collection.subscription`; a lookup by `record_id` or `unique_id` works without it. Here bob, who subscribes to alice (`JFeCedoO`), reads her members-only record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": {
        "name": "members",
        "subscription": "JFeCedoO"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": {
        "name": "members",
        "subscription": "JFeCedoO"
      }
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
        "query": {
            "collection": {
                "name": "members",
                "subscription": "JFeCedoO"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> get members --sub JFeCedoO
VZOauGXiZBarBGAq  members/00  "members-only coupon"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "00",
        "name": "members",
        "subscription": {
          "feed_referencing_records": false,
          "is_subscription_record": true,
          "notify_referencing_records": false,
          "notify_subscribers": false,
          "upload_to_feed": false
        }
      },
      "data": "members-only coupon",
      "record_id": "VZOauGXiZBarBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

See [Subscriptions and feed](/database/subscription).

```ts
// getRecords body: query.collection as an object
{
    query: {
        collection: {
            name: string;          // Required. The collection.
            access_level?: string; // Default: every level you can read. "00" to "99" or "**": only this level.
            subscription?: string; // Default: none. A user id: that user's subscription records.
        };
        // other query fields: see the sections of this page
    };
    // fetch: see Paging
}
```

## By tag

`tag` keeps only records that carry the tag. It can be combined with an `index` condition. See [Tags](/database/tags).

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "tag": "sale"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products",
      "tag": "sale"
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
        "query": {
            "collection": "products",
            "tag": "sale"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --tag sale
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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
    },
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": { "title": "Poster" },
      "index": [
        { "name": "price", "value": 990 },
        { "name": "title", "value": "New York Poster.PDF" },
        { "name": "in_stock", "value": false },
        { "name": "shop.brand", "value": "Arto" }
      ],
      "record_id": "VZOat4bhymcDBGAq",
      "tags": ["sale", "posters"],
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

## By index

`index` is one condition on one index name: `{name, value, condition, range, match}`. The example asks for products with a `price` above 1000; every form of condition is explained in [Indexing](/database/indexing).

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "price",
        "value": 1000,
        "condition": ">"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products",
      "index": {
        "name": "price",
        "value": 1000,
        "condition": ">"
      }
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
        "query": {
            "collection": "products",
            "index": {
                "name": "price",
                "value": 1000,
                "condition": ">"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price > 1000"
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
VZOat4dq5yx2BGAq  products/10  [price=50000 title="Café Table" shop.brand.sub="Lumo2"]  {"t":"table"}
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
    },
    {
      "collection": { "access_level": "10", "name": "products" },
      "data": { "t": "table" },
      "index": [
        { "name": "price", "value": 50000 },
        { "name": "title", "value": "Café Table" },
        { "name": "shop.brand.sub", "value": "Lumo2" }
      ],
      "record_id": "VZOat4dq5yx2BGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

## By reference

`reference` finds the records that point to a record, or the records of a user:

| `reference` form | what it finds |
|---|---|
| `"<record id>"` or `"<unique id>"` | records whose `reference` is that record |
| `{"record_id": "..."}` | the same, by record id |
| `{"unique_id": "..."}` | the same, by unique id |
| `{"user_id": "..."}` | records uploaded by that user |

The comments on an article, by the article's record id:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "comments",
      "reference": "VZOat4j7WgY5BGAq"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "comments",
      "reference": "VZOat4j7WgY5BGAq"
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
        "query": {
            "collection": "comments",
            "reference": "VZOat4j7WgY5BGAq"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

The same by the article's unique id, `{"reference": {"unique_id": "article-1"}}`, answers the same three records.

One user's records in a collection:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "comments",
      "reference": {
        "user_id": "nRcziH7v"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "comments",
      "reference": {
        "user_id": "nRcziH7v"
      }
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
        "query": {
            "collection": "comments",
            "reference": {
                "user_id": "nRcziH7v"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get comments --user nRcziH7v
VZOat4jE6fc2vjJk  comments/05  ref:VZOat4j7WgY5BGAq  "first!"
VZOat4kPyQDPvjJk  comments/05  ref:VZOat4j7WgY5BGAq  "second"
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
    }
  ],
  "start_key": "end"
}
```

See [Referencing](/database/referencing) for how records point to each other and the rules a record can set for that.

## By uploader with `$user_id`

The built-in index `$user_id` is another way to ask for one user's records. Its value is a user id and any `condition` is ignored; it answers exactly what `reference: {user_id}` answers, in upload order:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "comments",
      "index": {
        "name": "$user_id",
        "value": "nRcziH7v"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "comments",
      "index": {
        "name": "$user_id",
        "value": "nRcziH7v"
      }
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
        "query": {
            "collection": "comments",
            "index": {
                "name": "$user_id",
                "value": "nRcziH7v"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get comments --index '$user_id = nRcziH7v'
VZOat4jE6fc2vjJk  comments/05  ref:VZOat4j7WgY5BGAq  "first!"
VZOat4kPyQDPvjJk  comments/05  ref:VZOat4j7WgY5BGAq  "second"
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
    }
  ],
  "start_key": "end"
}
```

## Paging

`fetch` controls the page:

```ts
// getRecords body: fetch
{
    // query: see above
    fetch?: {
        limit?: number;      // Default: 50. Page size, 1 to 1000.
        ascending?: boolean; // Default: true. Order.
        /** Default: none. The start_key of the previous page; "end" or null starts from the beginning. */
        start_key?: string | null;
    };
}
```

Ask for the first page of two products:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products"
    },
    "fetch": {
      "limit": 2
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products"
    },
    "fetch": {
      "limit": 2
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
        "query": {
            "collection": "products"
        },
        "fetch": {
            "limit": 2
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --limit 2
VZOat4azQj6RBGAq  products/03  [price=39 title="Lamp Shade"]  tags:lighting,new  unique:shade-01  "edited"
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
(2 shown; type `more` for the next page)
```

:::

```json
// Response
{
  "end_of_list": false,
  "list": [
    {
      "collection": { "access_level": "03", "name": "products" },
      "data": "edited",
      "index": [
        { "name": "price", "value": 39 },
        { "name": "title", "value": "Lamp Shade" }
      ],
      "record_id": "VZOat4azQj6RBGAq",
      "tags": ["lighting", "new"],
      "unique_id": "shade-01",
      "user_id": "JFeCedoO"
    },
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
  "start_key": "clZaT2F0NGJXQ1ZiUkJHQXE"
}
```

`end_of_list` is `false`, so there is more. Send the same query again with the `start_key` you were given:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products"
    },
    "fetch": {
      "limit": 2,
      "start_key": "clZaT2F0NGJXQ1ZiUkJHQXE"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products"
    },
    "fetch": {
      "limit": 2,
      "start_key": "clZaT2F0NGJXQ1ZiUkJHQXE"
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
        "query": {
            "collection": "products"
        },
        "fetch": {
            "limit": 2,
            "start_key": "clZaT2F0NGJXQ1ZiUkJHQXE"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --limit 2
VZOat4azQj6RBGAq  products/03  [price=39 title="Lamp Shade"]  tags:lighting,new  unique:shade-01  "edited"
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
(2 shown; type `more` for the next page)
alice> more
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
(2 shown; type `more` for the next page)
```

:::

```json
// Response
{
  "end_of_list": false,
  "list": [
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": { "title": "Poster" },
      "index": [
        { "name": "price", "value": 990 },
        { "name": "title", "value": "New York Poster.PDF" },
        { "name": "in_stock", "value": false },
        { "name": "shop.brand", "value": "Arto" }
      ],
      "record_id": "VZOat4bhymcDBGAq",
      "tags": ["sale", "posters"],
      "user_id": "JFeCedoO"
    },
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": { "k": 1 },
      "index": [
        { "name": "price", "value": -1.5 },
        { "name": "title", "value": "안녕하세요 세계" }
      ],
      "record_id": "VZOat4cLmXRdBGAq",
      "tags": ["misc"],
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "clZaT2F0NGNMbVhSZEJHQXE"
}
```

Keep passing the newest `start_key` back until `end_of_list` is `true`; `start_key` is then `"end"`. The `start_key` belongs to the query it came from, so keep `query` the same between pages.

::: tip
A query without `fetch` answers the first 50 records, ascending. Fetch what the reader needs and page for the rest; a page of 1000 is the largest the server gives.
:::

## Order of results

- With no `index`, records come in upload order (oldest first; `"ascending": false` gives newest first). Record ids start with the upload time, so this is also id order.
- With an `index`, records come in the order of the index value, then record id (upload time). Numbers in number order, strings in Unicode code point order, `false` before `true`. A query by index name alone (no `value`) lists booleans first, then numbers, then strings.
- A collection query without `access_level` merges every level you can read in that same order.
- The `$referenced_count` order can lag the true count for a moment; the count on each record is always exact.

## Mistakes the server catches

Every query needs a collection unless it looks up one record:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "query.collection is required (a name, or {name, access_level, subscription})."
  }
}
```

Paging options belong in `fetch`, not in `query`:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Unknown query key \"limit\". Allowed: record_id, unique_id, collection, index, tag, reference, private_key."
  }
}
```

`fetch.limit` outside 1 to 1000 answers `fetch.limit must be 1 to 1000.`, and a `start_key` the server did not give out answers `fetch.start_key is not one DDBD gave out.` (both `400 INVALID_REQUEST`).

