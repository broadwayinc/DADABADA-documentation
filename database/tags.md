# Tags

A tag is a plain string on a record: where an index has a name and a value, a tag is only a label. A query asks for one tag, alone or together with an index condition, and [`getTags`](/api-reference/database#gettags) lists the tags a collection holds.

## Tags on create

`config.tags` in [`postRecord`](/api-reference/database#postrecord) is a list of strings, or `null`. Each tag is 1 to 256 characters with no control characters and is stored in Unicode NFC form. Duplicates are dropped. A comma-separated string such as `"sale, posters"` is refused (`tags must be a list of strings, or null.`); send `["sale", "posters"]` instead. The server can cap the number of tags per record with `max_tags`; otherwise there is no limit.

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Poster"
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": 990
        },
        {
          "name": "title",
          "value": "New York Poster.PDF"
        },
        {
          "name": "in_stock",
          "value": false
        },
        {
          "name": "shop.brand",
          "value": "Arto"
        }
      ],
      "tags": ["sale", "posters"]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": {
      "title": "Poster"
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": 990
        },
        {
          "name": "title",
          "value": "New York Poster.PDF"
        },
        {
          "name": "in_stock",
          "value": false
        },
        {
          "name": "shop.brand",
          "value": "Arto"
        }
      ],
      "tags": ["sale", "posters"]
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
        "data": {
            "title": "Poster"
        },
        "config": {
            "collection": "products",
            "index": [
                {
                    "name": "price",
                    "value": 990
                },
                {
                    "name": "title",
                    "value": "New York Poster.PDF"
                },
                {
                    "name": "in_stock",
                    "value": False
                },
                {
                    "name": "shop.brand",
                    "value": "Arto"
                }
            ],
            "tags": ["sale", "posters"]
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post products --index price=990 --index "title=New York Poster.PDF" --index in_stock=false --index shop.brand=Arto --tags sale,posters --data '{"title":"Poster"}'
Saved record VZOat4bhymcDBGAq
```

:::

```json
// Response
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
```

The same tags as a list, `"tags": ["sale", "posters"]`, give the same record. A duplicate is kept once:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "notes",
      "tags": [
        "a",
        "b",
        "a"
      ]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "config": {
      "collection": "notes",
      "tags": [
        "a",
        "b",
        "a"
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
        "config": {
            "collection": "notes",
            "tags": [
                "a",
                "b",
                "a"
            ]
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post notes --tags a,b,a
Saved record VZOat4hIV6olBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "notes" },
  "data": null,
  "record_id": "VZOat4hIV6olBGAq",
  "tags": ["a", "b"],
  "user_id": "JFeCedoO"
}
```

## Tags on update

On an update (a `postRecord` with `config.record_id`), `tags` replaces the whole list: the tags you send are the tags the record has afterwards. `null` removes every tag. An update that does not send `tags` keeps the record's tags as they are. See [Updating records](/database/update).

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "tags": [
        "lighting",
        "new"
      ]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "config": {
      "record_id": "VZOat4azQj6RBGAq",
      "tags": [
        "lighting",
        "new"
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
        "config": {
            "record_id": "VZOat4azQj6RBGAq",
            "tags": [
                "lighting",
                "new"
            ]
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

Removing every tag (and here every index too):

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
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "config": {
      "record_id": "VZOat4vZyA5iBGAq",
      "index": null,
      "tags": null
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
        "config": {
            "record_id": "VZOat4vZyA5iBGAq",
            "index": None,
            "tags": None
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

## Querying by tag

`query.tag` in [`getRecords`](/api-reference/database#getrecords) keeps only the records that carry that tag. One tag per query; the match is exact.

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

Without an `index`, the records come in upload order; `fetch` pages them as usual (see [Fetching Records](/database/fetch#paging)).

## Tag and index together

A `tag` can be added to any index query. The result holds the records that carry the tag **and** meet the condition, in index value order. Products on sale that cost more than 1000:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "tag": "sale",
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
      "tag": "sale",
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
            "tag": "sale",
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
alice> get products --tag sale --index "price > 1000"
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

The `Café Table` at 50000 is not on sale, so it is gone; the `Poster` is on sale but costs 990, so it is gone too.

::: tip
When a record is saved, each of its tags gets its own copy of the record's index keys, so the server reads the tag and the condition together from one sorted range for each access level, without filtering a longer list afterwards. The cost is write size: every tag repeats every index key of the record. A server where that matters can set `max_indexes` and `max_tags`.
:::

## Listing tags

[`getTags`](/api-reference/database#gettags) lists the tags of a collection with the number of records carrying each one. The body is `{"query": {...}, "fetch": {...}}`. The fields in the type below go inside `query`; any other key at the top of the body is refused with `400 INVALID_REQUEST`:

```ts
// getTags body
{
    query: {
        collection: string; // Required. The collection.
        tag?: string;       // Default: none (every tag is listed). A tag to match.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default: "=". Applies to the tag name: ">=" starts with, "<=" ends with.
    };
    // fetch: paging, as in getRecords
}
```

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getTags \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getTags', {
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
    'http://localhost:7070/v1/getTags',
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
alice> tags products
{"collection":"products","number_of_records":2,"tag":"lighting"}
{"collection":"products","number_of_records":1,"tag":"misc"}
{"collection":"products","number_of_records":1,"tag":"new"}
{"collection":"products","number_of_records":1,"tag":"posters"}
{"collection":"products","number_of_records":2,"tag":"sale"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    { "collection": "products", "number_of_records": 2, "tag": "lighting" },
    { "collection": "products", "number_of_records": 1, "tag": "misc" },
    { "collection": "products", "number_of_records": 1, "tag": "new" },
    { "collection": "products", "number_of_records": 1, "tag": "posters" },
    { "collection": "products", "number_of_records": 2, "tag": "sale" }
  ],
  "start_key": "end"
}
```

Tags ending with `ing`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getTags \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "tag": "ing",
      "condition": "<="
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getTags', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products",
      "tag": "ing",
      "condition": "<="
    }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getTags',
    data=json.dumps({
        "query": {
            "collection": "products",
            "tag": "ing",
            "condition": "<="
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> tags products <= ing
{"collection":"products","number_of_records":2,"tag":"lighting"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    { "collection": "products", "number_of_records": 2, "tag": "lighting" }
  ],
  "start_key": "end"
}
```

| field | meaning |
|---|---|
| `collection` | the collection asked for |
| `tag` | the tag |
| `number_of_records` | how many records in the collection carry it, counting every access level |

The answer is a page like any listing; pass `start_key` back in `fetch` for the next one. The counts are kept by a background worker, so a tag saved a moment ago may take a moment to appear in the listing, while a `getRecords` query by that tag finds the record at once.
