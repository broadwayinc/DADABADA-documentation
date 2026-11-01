# Creating Records

This page covers creating records. Nothing is set up first: the collection appears with its first record. [`postRecord`](/api-reference/database#postrecord) saves one record and answers with the record as stored. The body is `{"data": <any JSON>, "config": {...}}`. Without `config.record_id` a new record is created; with it, an existing record is changed (see [Updating records](/database/update)).

## The smallest record

Only a collection name is required. The data is stored as `null` and the level is `00`.

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "notes"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "config": {
      "collection": "notes"
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
            "collection": "notes"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post notes
Saved record VZOat4UKP7DxBGAq
```

:::

```json
// Response
{
  "agent": null,
  "collection": {
    "access_level": "00",
    "name": "notes",
    "subscription": {
      "feed_referencing_records": false,
      "is_subscription_record": false,
      "notify_referencing_records": false,
      "notify_subscribers": false,
      "upload_to_feed": false
    }
  },
  "data": null,
  "index": [],
  "ip": "127.0.0.1",
  "readonly": false,
  "record_id": "VZOat4UKP7DxBGAq",
  "reference": null,
  "referenced_count": 0,
  "source": {
    "allow_granted_to_grant_others": false,
    "can_remove_referencing_records": false,
    "only_granted_can_reference": false,
    "prevent_multiple_referencing": false,
    "referencing_index_restrictions": [],
    "referencing_limit": null
  },
  "tags": [],
  "unique_id": null,
  "updated": 1793235375794,
  "uploaded": 1793235375794,
  "user_id": "JFeCedoO"
}
```

This is the full record shape. The other responses on this page leave out fields that are at their default, and `ip`, `uploaded` and `updated`.

| field | meaning |
|---|---|
| `record_id` | 16 characters; the first 7 are the upload time, so ids sort by time |
| `user_id` | the uploader |
| `agent` | the agent key that last wrote the record, as `{key_id, name}`; `null` when it was written with a session token |
| `collection` | name, access level and the five subscription settings |
| `index`, `tags`, `unique_id`, `reference`, `source`, `readonly` | the settings from `config`, as stored |
| `referenced_count` | how many records point to this one |
| `uploaded`, `updated` | times in milliseconds |
| `ip` | the address of the last writer |
| `data` | the data you sent (object keys come back in alphabetical order) |

::: tip
With the self-signed certificate made by `ddbd init`, pin the certificate in your client, or add `-k` to `curl` for a quick test (see [Trusting the certificate](/api-reference/connection#trusting-the-certificate)). Only `login` works without a token.
:::

## Data

`data` is any JSON value: an object, a list, a string, a number, `true`, `false` or `null`. It has no size limit. The keys of an object come back in alphabetical order, as in the responses on this page.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      "a",
      1,
      true,
      null,
      {
        "deep": {
          "er": [
            1,
            2
          ]
        }
      }
    ],
    "config": {
      "collection": "notes"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": [
      "a",
      1,
      true,
      null,
      {
        "deep": {
          "er": [
            1,
            2
          ]
        }
      }
    ],
    "config": {
      "collection": "notes"
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
        "data": [
            "a",
            1,
            True,
            None,
            {
                "deep": {
                    "er": [
                        1,
                        2
                    ]
                }
            }
        ],
        "config": {
            "collection": "notes"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post notes --data '["a",1,true,null,{"deep":{"er":[1,2]}}]'
Saved record VZOat4WmCSDmBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "notes" },
  "data": ["a", 1, true, null, { "deep": { "er": [1, 2] } }],
  "record_id": "VZOat4WmCSDmBGAq",
  "user_id": "JFeCedoO"
}
```

Nothing inside `data` is searchable. To find a record by a value, put that value in an index or a tag.

## Collection

`config.collection` is a string (the collection name) or an object:

```ts
// postRecord body: config.collection
{
    config: {
        collection?: string | {  // Required on create.
            name?: string;         // Required on create. The collection name.
            access_level?: string; // Default: "00". "00" to "99" (two digits) or "**". Who can read the record, see below.
            subscription?: {       // Default: all false.
                is_subscription_record?: boolean;
                upload_to_feed?: boolean;
                notify_subscribers?: boolean;
                feed_referencing_records?: boolean;
                notify_referencing_records?: boolean;
            } | null;
        };
        // other config fields: see Every config field below
    };
}
```

See [Subscriptions and feed](/database/subscription) for the five subscription settings.

A string is the same as `{"name": ...}` with the defaults:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "plain string",
    "config": {
      "collection": "notes"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": "plain string",
    "config": {
      "collection": "notes"
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
        "data": "plain string",
        "config": {
            "collection": "notes"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post notes --data '"plain string"'
Saved record VZOat4W5rSE0BGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "notes" },
  "data": "plain string",
  "record_id": "VZOat4W5rSE0BGAq",
  "user_id": "JFeCedoO"
}
```

## Access level

The uploader sets the record's access level, inside the `collection` object. `"00"` to `"99"` means every user at or above that level can read it; `"**"` means private: only the uploader, users the uploader grants, and holders of a private access key. You can post at or below your own level, or at `"**"`. See [Access levels](/database/access-levels).

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "staff only",
    "config": {
      "collection": {
        "name": "notes",
        "access_level": "05"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": "staff only",
    "config": {
      "collection": {
        "name": "notes",
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
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        "data": "staff only",
        "config": {
            "collection": {
                "name": "notes",
                "access_level": "05"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
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

The level is always a string of two digits. A number such as `7` or a one-digit string such as `"7"` is refused with `access_level must be "00" to "99", or "**" for private.` A private record:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "my diary",
    "config": {
      "collection": {
        "name": "diary",
        "access_level": "**"
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": "my diary",
    "config": {
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
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        "data": "my diary",
        "config": {
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

::: warning
`access_level` belongs inside the `collection` object. Put next to `collection`, it is refused as an unknown config key:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Unknown config key \"access_level\". Allowed: record_id, collection, index, tags, reference, unique_id, source, readonly, notification. Put it inside collection: {\"collection\": {\"name\": ..., \"access_level\": ...}}."
  }
}
```
:::

## Indexes

`config.index` is a list of `{"name", "value"}` objects, or `null`. One index is a list of one; a single object without the list is refused with `index must be a list of {name, value}, or null.` A value is a string, a number or `true`/`false`; each name appears once per record. A name with dots (`shop.brand`) is a compound name, which can later be searched by its children. See [Indexing](/database/indexing) for every way to query them.

One index:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Lamp shade"
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": 35
        }
      ]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": {
      "title": "Lamp shade"
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": 35
        }
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
        "data": {
            "title": "Lamp shade"
        },
        "config": {
            "collection": "products",
            "index": [
                {
                    "name": "price",
                    "value": 35
                }
            ]
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post products --index price=35 --data '{"title":"Lamp shade"}'
Saved record VZOat4azQj6RBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "products" },
  "data": { "title": "Lamp shade" },
  "index": [{ "name": "price", "value": 35 }],
  "record_id": "VZOat4azQj6RBGAq",
  "user_id": "JFeCedoO"
}
```

Many indexes of every type, with tags and a unique id:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Desk Lamp",
      "color": "red"
    },
    "config": {
      "collection": {
        "name": "products",
        "access_level": "05"
      },
      "index": [
        {
          "name": "price",
          "value": 1200
        },
        {
          "name": "title",
          "value": "Desk Lamp"
        },
        {
          "name": "in_stock",
          "value": true
        },
        {
          "name": "shop.brand",
          "value": "Lumo"
        },
        {
          "name": "shop.rating",
          "value": 4.5
        }
      ],
      "tags": [
        "sale",
        "lighting"
      ],
      "unique_id": "sku-1042"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": {
      "title": "Desk Lamp",
      "color": "red"
    },
    "config": {
      "collection": {
        "name": "products",
        "access_level": "05"
      },
      "index": [
        {
          "name": "price",
          "value": 1200
        },
        {
          "name": "title",
          "value": "Desk Lamp"
        },
        {
          "name": "in_stock",
          "value": true
        },
        {
          "name": "shop.brand",
          "value": "Lumo"
        },
        {
          "name": "shop.rating",
          "value": 4.5
        }
      ],
      "tags": [
        "sale",
        "lighting"
      ],
      "unique_id": "sku-1042"
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
            "title": "Desk Lamp",
            "color": "red"
        },
        "config": {
            "collection": {
                "name": "products",
                "access_level": "05"
            },
            "index": [
                {
                    "name": "price",
                    "value": 1200
                },
                {
                    "name": "title",
                    "value": "Desk Lamp"
                },
                {
                    "name": "in_stock",
                    "value": True
                },
                {
                    "name": "shop.brand",
                    "value": "Lumo"
                },
                {
                    "name": "shop.rating",
                    "value": 4.5
                }
            ],
            "tags": [
                "sale",
                "lighting"
            ],
            "unique_id": "sku-1042"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post products --level 05 --index price=1200 --index "title=Desk Lamp" --index in_stock=true --index shop.brand=Lumo --index shop.rating=4.5 --tags sale,lighting --unique sku-1042 --data '{"title":"Desk Lamp","color":"red"}'
Saved record VZOat4bWCVbRBGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "05", "name": "products" },
  "data": { "color": "red", "title": "Desk Lamp" },
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

Negative numbers and text in any script are ordinary values:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "k": 1
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": -1.5
        },
        {
          "name": "title",
          "value": "안녕하세요 세계"
        }
      ],
      "tags": [
        "misc"
      ]
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": {
      "k": 1
    },
    "config": {
      "collection": "products",
      "index": [
        {
          "name": "price",
          "value": -1.5
        },
        {
          "name": "title",
          "value": "안녕하세요 세계"
        }
      ],
      "tags": [
        "misc"
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
        "data": {
            "k": 1
        },
        "config": {
            "collection": "products",
            "index": [
                {
                    "name": "price",
                    "value": -1.5
                },
                {
                    "name": "title",
                    "value": "안녕하세요 세계"
                }
            ],
            "tags": [
                "misc"
            ]
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post products --index price=-1.5 --index "title=안녕하세요 세계" --tags misc --data '{"k":1}'
Saved record VZOat4cLmXRdBGAq
```

:::

```json
// Response
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
```

::: warning
`null`, objects and lists are not index values. A number is a number and a string is a string: `"42"` and `42` are different values and a query finds only its own type.
:::

## Tags

`config.tags` is a list of strings, or `null`. Duplicates are dropped. A comma-separated string is refused with `tags must be a list of strings, or null.` See [Tags](/database/tags).

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

## Unique id

`config.unique_id` is your own id for the record. It must not be used by any other record in the database. Afterwards it finds the record in `getRecords` (`query.unique_id`), in `reference` (as a plain string or `{"unique_id": ...}`) and in `deleteRecords` (`unique_id`). A key named `record_id` never takes it: an update still needs the record id in `config.record_id`. See [Unique ID](/database/unique-id).

A used unique id is refused:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collection": "x",
      "unique_id": "sku-1042"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "config": {
      "collection": "x",
      "unique_id": "sku-1042"
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
            "collection": "x",
            "unique_id": "sku-1042"
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post x --unique sku-1042
EXISTS: unique_id "sku-1042" is already used by another record.
```

:::

```json
// Response
{
  "error": {
    "code": "EXISTS",
    "message": "unique_id \"sku-1042\" is already used by another record."
  }
}
```

## Read-only

With `"readonly": true`, only the admin can change or delete the record afterwards. The uploader cannot.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "terms v1",
    "config": {
      "collection": "docs",
      "readonly": true
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "data": "terms v1",
    "config": {
      "collection": "docs",
      "readonly": true
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
        "data": "terms v1",
        "config": {
            "collection": "docs",
            "readonly": True
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post docs --readonly --data '"terms v1"'
Saved record VZOat4ixBwfABGAq
```

:::

```json
// Response
{
  "collection": { "access_level": "00", "name": "docs" },
  "data": "terms v1",
  "readonly": true,
  "record_id": "VZOat4ixBwfABGAq",
  "user_id": "JFeCedoO"
}
```

## Every config field

```ts
// postRecord body: config
{
    // data: see Data above
    config: {
        /** Default: none (the call creates a record). Record id of a record to update */
        /** (a unique id is not accepted here). When present the call is an update. */
        record_id?: string;
        /** Required on create. The collection: a name, or an object. See Collection above. */
        collection?: string | { name?: string; access_level?: string; subscription?: object | null };
        /** Default: none. The indexes. On update the list replaces all and null removes all. */
        index?: { name: string; value: string | number | boolean }[] | null;
        /** Default: none. The tags. Duplicates are dropped. On update: replaces; null removes. */
        tags?: string[] | null;
        /** Default: none. Must not be used by another record. null removes it on update. */
        unique_id?: string | null;
        /** Default: none. The record this one points to: a string (record id or unique id), */
        /** {record_id} (record id) or {unique_id} (unique id). The target's source rules are checked */
        /** and you must be able to read the target. */
        reference?: string | { record_id: string } | { unique_id: string } | null;
        source?: object | null; // Default: all off. Rules for records pointing to this one.
        readonly?: boolean;     // Default: false. Only the admin can change or delete the record afterwards.
        /** Default: none. Sent to subscribers when notify_subscribers is on, and used as the message */
        /** to the referenced record's uploader when that record has notify_referencing_records on. */
        /** Sent on create only. */
        notification?: { title: string; body: string } | null;
    };
}
```

See [Referencing](/database/referencing) for `reference` and `source`, and [Subscriptions and feed](/database/subscription) for `notification`.

Any other key in `config` is refused.

## Validation rules

| item | rule |
|---|---|
| collection names, tags, index names | 1 to 256 characters, no control characters |
| index names | cannot start with `$` (those names are built in) or end with `.` (a trailing dot is only for searching children) |
| string index values | 0 to 256 characters, no control characters |
| number index values | any finite number; whole numbers are exact up to plus or minus 2<sup>53</sup> |
| boolean index values | `true` or `false` |
| `unique_id` | 1 to 1000 bytes, no control characters |
| `access_level` | the string `"00"` to `"99"` (two digits) or `"**"` |
| indexes per record | unlimited, unless the server sets `max_indexes` |
| tags per record | unlimited, unless the server sets `max_tags` |
| record data | any JSON, no size limit |
| text | names, tags, unique ids and string values are stored in Unicode NFC form, so the same text typed with composed or decomposed accents matches |

## Many records at once

[`postRecords`](/api-reference/database#postrecords) takes a list of `postRecord` bodies in `items`. Each item is saved on its own: a failed item is reported in `failed` with its position, and the items after it are still saved. Items can create or update.

The request below creates two records, fails on the third (an index name starting with `$`) and updates a fourth by its record id:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "data": 1,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "n",
              "value": 1
            }
          ]
        }
      },
      {
        "data": 2,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "n",
              "value": 2
            }
          ]
        }
      },
      {
        "data": 3,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "$n",
              "value": 3
            }
          ]
        }
      },
      {
        "data": "edited",
        "config": {
          "record_id": "VZOat4azQj6RBGAq"
        }
      }
    ]
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecords', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "items": [
      {
        "data": 1,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "n",
              "value": 1
            }
          ]
        }
      },
      {
        "data": 2,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "n",
              "value": 2
            }
          ]
        }
      },
      {
        "data": 3,
        "config": {
          "collection": "bulk",
          "index": [
            {
              "name": "$n",
              "value": 3
            }
          ]
        }
      },
      {
        "data": "edited",
        "config": {
          "record_id": "VZOat4azQj6RBGAq"
        }
      }
    ]
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecords',
    data=json.dumps({
        "items": [
            {
                "data": 1,
                "config": {
                    "collection": "bulk",
                    "index": [
                        {
                            "name": "n",
                            "value": 1
                        }
                    ]
                }
            },
            {
                "data": 2,
                "config": {
                    "collection": "bulk",
                    "index": [
                        {
                            "name": "n",
                            "value": 2
                        }
                    ]
                }
            },
            {
                "data": 3,
                "config": {
                    "collection": "bulk",
                    "index": [
                        {
                            "name": "$n",
                            "value": 3
                        }
                    ]
                }
            },
            {
                "data": "edited",
                "config": {
                    "record_id": "VZOat4azQj6RBGAq"
                }
            }
        ]
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw postRecords '{"items": [{"data": 1, "config": {"collection": "bulk", "index": [{"name": "n", "value": 1}]}}, {"data": 2, "config": {"collection": "bulk", "index": [{"name": "n", "value": 2}]}}, {"data": 3, "config": {"collection": "bulk", "index": [{"name": "$n", "value": 3}]}}, {"data": "edited", "config": {"record_id": "VZOat4azQj6RBGAq"}}]}'
```

:::

```json
// Response
{
  "failed": [
    {
      "code": "INVALID_REQUEST",
      "index": 2,
      "message": "Index name \"$n\" starts with $; names starting with $ are built in."
    }
  ],
  "list": [
    {
      "collection": { "access_level": "00", "name": "bulk" },
      "data": 1,
      "index": [{ "name": "n", "value": 1 }],
      "record_id": "VZOat4z4J5zvBGAq",
      "user_id": "JFeCedoO"
    },
    {
      "collection": { "access_level": "00", "name": "bulk" },
      "data": 2,
      "index": [{ "name": "n", "value": 2 }],
      "record_id": "VZOat4zceg5yBGAq",
      "user_id": "JFeCedoO"
    },
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
    }
  ]
}
```

| field | meaning |
|---|---|
| `list` | the records saved, in the order given |
| `failed` | one entry per item that was not saved: `index` (its position in `items`, counting from 0), `code` and `message`, the same the item would get from `postRecord` |

## Errors

Every error answers `{"error": {"code", "message"}}` with an HTTP status. These are the ones `postRecord` and `postRecords` give, with their exact messages:

| status | code | message |
|---|---|---|
| 400 | `INVALID_REQUEST` | `config.collection is required to create a record.` |
| 400 | `INVALID_REQUEST` | `Unknown config key "access_level". Allowed: record_id, collection, index, tags, reference, unique_id, source, readonly, notification. Put it inside collection: {"collection": {"name": ..., "access_level": ...}}.` |
| 400 | `INVALID_REQUEST` | `access_level must be "00" to "99", or "**" for private.` |
| 400 | `INVALID_REQUEST` | `index must be a list of {name, value}, or null.` |
| 400 | `INVALID_REQUEST` | `tags must be a list of strings, or null.` |
| 400 | `INVALID_REQUEST` | `Index name "a" appears twice; each name can be used once per record.` |
| 400 | `INVALID_REQUEST` | `Index name "$updated" starts with $; names starting with $ are built in.` |
| 400 | `INVALID_REQUEST` | `Index name "shop." ends with a dot; a trailing dot is only for searching children.` |
| 400 | `INVALID_REQUEST` | `The value of index "a" must be a string, a number or true/false.` |
| 400 | `INDEX_LIMIT` | more indexes than the server's `max_indexes` |
| 400 | `TAG_LIMIT` | more tags than the server's `max_tags` |
| 400 | `REFERENCE_LIMIT` | the target's `referencing_limit` is reached, or it has `prevent_multiple_referencing` and you already point to it |
| 400 | `REFERENCE_RESTRICTED` | the target's `referencing_index_restrictions` are not met |
| 401 | `UNAUTHORIZED` | no token, an unknown or expired session, or a revoked or expired agent key |
| 403 | `NO_ACCESS` | `You can post at access levels up to 05 (or ** for private); 09 is above that.` (with your level and the level you asked for) |
| 403 | `NO_ACCESS` | `The admin cannot create records; records belong to users. Use a user account.` |
| 403 | `NO_ACCESS` | not the uploader on an update, a read-only record, an agent key outside its limits, or a target you cannot read |
| 404 | `NOT_FOUND` | the record in `config.record_id`, or the `reference` target, does not exist. A unique id in `config.record_id` answers `Record <record id> does not exist.` too |
| 409 | `EXISTS` | `unique_id "sku-1042" is already used by another record.` |

`postRecords` without a list in `items` answers `400 INVALID_REQUEST` with `postRecords needs "items": [{data, config}, ...].`

In `postRecords`, the same codes and messages appear per item inside `failed`; the request itself still answers 200.
