# Indexing

An index is a `name` and a `value` saved with a record so the record can be found by that value; the uploader chooses the names. This page covers every way to query an index with [`getRecords`](/api-reference/database#getrecords). How indexes are set is on [Creating Records](/database/create#indexes).

A query holds one `index` object:

```ts
// getRecords body: query.index
{
    query: {
        index: {
            /** Required. The index name, a name ending in "." (children of a compound name), */
            /** or one of "$uploaded", "$updated", "$referenced_count", "$user_id". */
            name: string;
            /** Default: none. The value to compare. Without it: every record with this index, */
            /** in value order (booleans, then numbers, then strings). */
            value?: string | number | boolean;
            /** Default: "=". How to compare; "eq", "gt", "lt", "gte", "lte" are accepted as the same conditions. */
            condition?: "=" | ">" | "<" | ">=" | "<=" | "eq" | "gt" | "lt" | "gte" | "lte";
            /** Default: none. Same type as value. With "=" (or no condition): from value to range, both included. */
            range?: string | number | boolean;
            match?: "exact" | "loose"; // Default: "exact". "loose" ignores case, accents, width and more; strings only.
        };
        // other query fields: see Fetching Records
    };
}
```

Any other key is refused.

## Conditions

| condition | also written | numbers and booleans | strings |
|---|---|---|---|
| `=` | `eq` | equal | equal |
| `>` | `gt` | greater | after, in character order |
| `<` | `lt` | less | before, in character order |
| `>=` | `gte` | greater or equal | **starts with** |
| `<=` | `lte` | less or equal | **ends with** |
| `range` | | from `value` to `range`, inclusive | from `value` to `range`, inclusive |

A query finds only values of its own type: `"42"` and `42` are different values, and `false` sorts before `true`.

## Numbers

Equal (`condition` defaults to `=`):

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

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
        "value": 1200
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
        "value": 1200
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
                "value": 1200
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price = 1200"
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

Greater than:

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

Less than, negative numbers included:

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
        "value": 15,
        "condition": "<"
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
        "value": 15,
        "condition": "<"
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
                "value": 15,
                "condition": "<"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price < 15"
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
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

A range, both ends included:

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
        "value": 10,
        "range": 50
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
        "value": 10,
        "range": 50
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
                "value": 10,
                "range": 50
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price 10..50"
VZOat4eJ1Y76BGAq  products/00  [price=10 title="カタカナ Ｓｈｏｐ"]  null
VZOat4eE1sb8BGAq  products/00  [price=20 title="Straße İstanbul"]  null
VZOat4azQj6RBGAq  products/03  [price=39 title="Lamp Shade"]  tags:lighting,new  unique:shade-01  "edited"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": null,
      "index": [
        { "name": "price", "value": 10 },
        { "name": "title", "value": "カタカナ Ｓｈｏｐ" }
      ],
      "record_id": "VZOat4eJ1Y76BGAq",
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
  ],
  "start_key": "end"
}
```

Highest first. The condition name `gte` works like `>=`, and `fetch.ascending: false` turns the order around:

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
        "value": 0,
        "condition": "gte"
      }
    },
    "fetch": {
      "ascending": false,
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
      "collection": "products",
      "index": {
        "name": "price",
        "value": 0,
        "condition": "gte"
      }
    },
    "fetch": {
      "ascending": false,
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
            "collection": "products",
            "index": {
                "name": "price",
                "value": 0,
                "condition": "gte"
            }
        },
        "fetch": {
            "ascending": False,
            "limit": 2
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price >= 0" --desc --limit 2
VZOat4dq5yx2BGAq  products/10  [price=50000 title="Café Table" shop.brand.sub="Lumo2"]  {"t":"table"}
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
      "collection": { "access_level": "10", "name": "products" },
      "data": { "t": "table" },
      "index": [
        { "name": "price", "value": 50000 },
        { "name": "title", "value": "Café Table" },
        { "name": "shop.brand.sub", "value": "Lumo2" }
      ],
      "record_id": "VZOat4dq5yx2BGAq",
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
  "start_key": "aXByaWNlAALAksAAAAAAAABWWk9hdDRiV0NWYlJCR0Fx"
}
```

A name with no `value` lists every record that has the index, in value order. `{"index": {"name": "price"}}` answers the products from the cheapest up; a sort by any index, with no condition at all.

## Strings

Starts with (`>=`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "Desk",
        "condition": ">="
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
        "name": "title",
        "value": "Desk",
        "condition": ">="
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
                "name": "title",
                "value": "Desk",
                "condition": ">="
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title >= Desk"
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

Ends with (`<=`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": ".PDF",
        "condition": "<="
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
        "name": "title",
        "value": ".PDF",
        "condition": "<="
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
                "name": "title",
                "value": ".PDF",
                "condition": "<="
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title <= .PDF"
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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
    }
  ],
  "start_key": "end"
}
```

Exact match is case-sensitive: the same query with `".pdf"` answers an empty list. Use `"match": "loose"` (below) to ignore case.

`>` and `<` compare whole strings in character order. Titles after `"N"`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "N",
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
        "name": "title",
        "value": "N",
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
                "name": "title",
                "value": "N",
                "condition": ">"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title > N"
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
VZOat4eE1sb8BGAq  products/00  [price=20 title="Straße İstanbul"]  null
VZOat4eJ1Y76BGAq  products/00  [price=10 title="カタカナ Ｓｈｏｐ"]  null
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
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
  "start_key": "end"
}
```

A range of strings works the same way: `{"name": "title", "value": "A", "range": "M"}` answers every title from `"A"` up to `"M"` in character order (`Café Table`, `Desk Lamp`, `Lamp Shade`).

## Booleans

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "in_stock",
        "value": true
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
        "name": "in_stock",
        "value": true
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
                "name": "in_stock",
                "value": True
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "in_stock = true"
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

`false` sorts before `true`, so `>`, `<` and `range` work on booleans as on numbers.

## Built-in indexes

Every record has four indexes it did not ask for. Their names start with `$`, which is why your own names cannot.

| name | value | conditions |
|---|---|---|
| `$uploaded` | upload time in milliseconds (number) | all, and `range` |
| `$updated` | time of the last change in milliseconds (number) | all, and `range` |
| `$referenced_count` | how many records point to this one (number) | all, and `range` |
| `$user_id` | the uploader's user id (string) | equal only: any `condition` is ignored. The same as `reference: {user_id}` |

The three number indexes take a number 0 or more; anything else is refused (`$uploaded takes a time in milliseconds.`, `$updated takes a number 0 or more.`). `$uploaded` is read from the first 7 characters of the record id, so it is exact to the millisecond. Another name starting with `$` is refused: `Unknown built-in index $x. Use $uploaded, $updated, $referenced_count or $user_id.`

Records uploaded after a time:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "$uploaded",
        "value": 1793231775846,
        "condition": ">"
      }
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
      "collection": "products",
      "index": {
        "name": "$uploaded",
        "value": 1793231775846,
        "condition": ">"
      }
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
            "collection": "products",
            "index": {
                "name": "$uploaded",
                "value": 1793231775846,
                "condition": ">"
            }
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
alice> get products --index '$uploaded > 1793231775846' --limit 2
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

Most recently changed first:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "$updated",
        "value": 0,
        "condition": ">"
      }
    },
    "fetch": {
      "ascending": false,
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
      "collection": "products",
      "index": {
        "name": "$updated",
        "value": 0,
        "condition": ">"
      }
    },
    "fetch": {
      "ascending": false,
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
            "collection": "products",
            "index": {
                "name": "$updated",
                "value": 0,
                "condition": ">"
            }
        },
        "fetch": {
            "ascending": False,
            "limit": 2
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index '$updated > 0' --desc --limit 2
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
  "start_key": "dQAAAaGFKFbLVlpPYXQ0YldDVmJSQkdBcQ"
}
```

Most referenced, for example the articles with at least one comment:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "articles",
      "index": {
        "name": "$referenced_count",
        "value": 1,
        "condition": ">="
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
      "collection": "articles",
      "index": {
        "name": "$referenced_count",
        "value": 1,
        "condition": ">="
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
            "collection": "articles",
            "index": {
                "name": "$referenced_count",
                "value": 1,
                "condition": ">="
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get articles --index '$referenced_count >= 1'
VZOat4j7WgY5BGAq  articles/05  unique:article-1  {"title":"Hello world"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "05", "name": "articles" },
      "data": { "title": "Hello world" },
      "record_id": "VZOat4j7WgY5BGAq",
      "referenced_count": 3,
      "unique_id": "article-1",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

One user's records:

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

::: tip
Sorting by `$referenced_count` can lag the true count for a moment, because the counters are kept by a background worker. The `referenced_count` on each record is always exact.
:::

## Compound names

A name with dots, such as `shop.brand` or `shop.brand.sub`, is a compound name. Used in full, it is an ordinary index:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "shop.rating",
        "value": 4,
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
        "name": "shop.rating",
        "value": 4,
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
                "name": "shop.rating",
                "value": 4,
                "condition": ">"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "shop.rating > 4"
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

### Searching children

A name that ends with a dot (`shop.`) searches the child names under it. `value` is then a child name, a string, and the condition compares names instead of values:

| condition | meaning |
|---|---|
| `=` | records with a child of that name (and anything under it) |
| `>=` | records with a child whose name starts with the value (and anything under it) |
| `<=` | records with a child whose name ends with the value (and anything under it) |
| no `value` | records with any name under the parent |

The child is the part directly after the parent's dot: `shop.` with `<=` `"nd"` matches `shop.brand` and `shop.brand.sub`, but not `shop.x.brand`. Each record appears once, whatever the number of matching children. `range`, `>`, `<` and `"match": "loose"` are not available here, and the value must be a string.

Children named `brand`, which also finds `shop.brand.sub`:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "shop.",
        "value": "brand"
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
        "name": "shop.",
        "value": "brand"
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
                "name": "shop.",
                "value": "brand"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "shop. = brand"
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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

Children starting with `r` (only `shop.rating` qualifies):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "shop.",
        "value": "r",
        "condition": ">="
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
        "name": "shop.",
        "value": "r",
        "condition": ">="
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
                "name": "shop.",
                "value": "r",
                "condition": ">="
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "shop. >= r"
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

Children ending with `nd` (`shop.brand` and `shop.brand.sub` both qualify):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "shop.",
        "value": "nd",
        "condition": "<="
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
        "name": "shop.",
        "value": "nd",
        "condition": "<="
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
                "name": "shop.",
                "value": "nd",
                "condition": "<="
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "shop. <= nd"
VZOat4bWCVbRBGAq  products/05  [price=1200 title="Desk Lamp" in_stock=true shop.brand="Lumo" shop.rating=4.5]  tags:sale,lighting  unique:sku-1042  {"color":"green","title":"Desk Lamp"}
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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

::: warning
A trailing dot is only for searching. Saving an index named `shop.` is refused: `Index name "shop." ends with a dot; a trailing dot is only for searching children.`
:::

## Loose match

String conditions compare exactly by default. With `"match": "loose"` both the query text and the stored values are loosened before comparing, so small differences in how text was typed no longer matter. It works with every condition on strings: `=`, `>`, `<`, `>=` (starts with), `<=` (ends with) and `range`.

What loosening ignores:

- upper and lower case, in every cased script (`STRASSE` = `straße`)
- accents in Latin, Greek, Cyrillic, Armenian, Hebrew, Arabic and Syriac (`cafe` = `café`, `елка` = `ёлка`). Marks that are vowels (Devanagari and other Indic scripts, Thai, Lao, Khmer, Myanmar, Tibetan) and the Japanese voicing mark are kept
- the difference between `ø đ ł ħ ŧ æ œ þ ð ı` and `o d l h t ae oe th d i`
- full-width and half-width forms (`ＡＢＣ１２` = `ABC12`)
- katakana versus hiragana, and small kana versus full size
- Arabic, Persian and Urdu letter forms (`أ إ آ ٱ` become `ا`, `ى ی` become `ي`, `ک` becomes `ك`, `ة` becomes `ه`, the stretching mark is removed); Hebrew final letters equal normal letters
- the script of digits: digits from every script become ASCII (`٢٠٢٦` = `२०२६` = `2026`)
- spaces, punctuation and invisible characters, which are removed (`newyork` = `New York`, `email` = `e-mail`, `usa` = `U.S.A.`); symbols and emoji are kept

Korean is compared as typed letters, so a half-typed word (`안녀`) finds `안녕` with `>=`, and a query of only consonants (`ㅇㄴ`) searches the first consonant of each syllable instead, so `ㅇㄴ` with `>=` finds `안녕하세요`.

Case and spaces ignored:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "newyork",
        "condition": ">=",
        "match": "loose"
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
        "name": "title",
        "value": "newyork",
        "condition": ">=",
        "match": "loose"
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
                "name": "title",
                "value": "newyork",
                "condition": ">=",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~>= newyork"
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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
    }
  ],
  "start_key": "end"
}
```

Ends with, any case (`.pdf` finds `New York Poster.PDF`, which exact match did not):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": ".pdf",
        "condition": "<=",
        "match": "loose"
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
        "name": "title",
        "value": ".pdf",
        "condition": "<=",
        "match": "loose"
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
                "name": "title",
                "value": ".pdf",
                "condition": "<=",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~<= .pdf"
VZOat4bhymcDBGAq  products/00  [price=990 title="New York Poster.PDF" in_stock=false shop.brand="Arto"]  tags:sale,posters  {"title":"Poster"}
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
    }
  ],
  "start_key": "end"
}
```

Accents ignored (`cafe table` finds `Café Table`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "cafe table",
        "match": "loose"
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
        "name": "title",
        "value": "cafe table",
        "match": "loose"
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
                "name": "title",
                "value": "cafe table",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~= cafe table"
VZOat4dq5yx2BGAq  products/10  [price=50000 title="Café Table" shop.brand.sub="Lumo2"]  {"t":"table"}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
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

`ß` and the Turkish dotted `İ` (`STRASSE ISTANBUL` finds `Straße İstanbul`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "STRASSE ISTANBUL",
        "match": "loose"
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
        "name": "title",
        "value": "STRASSE ISTANBUL",
        "match": "loose"
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
                "name": "title",
                "value": "STRASSE ISTANBUL",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~= STRASSE ISTANBUL"
VZOat4eE1sb8BGAq  products/00  [price=20 title="Straße İstanbul"]  null
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": { "access_level": "00", "name": "products" },
      "data": null,
      "index": [
        { "name": "price", "value": 20 },
        { "name": "title", "value": "Straße İstanbul" }
      ],
      "record_id": "VZOat4eE1sb8BGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

Hiragana finds katakana and half-width finds full-width (`かたかなshop` finds `カタカナ Ｓｈｏｐ`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "かたかなshop",
        "match": "loose"
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
        "name": "title",
        "value": "かたかなshop",
        "match": "loose"
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
                "name": "title",
                "value": "かたかなshop",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~= かたかなshop"
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

Korean, half typed (`안녀` finds `안녕하세요 세계`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "안녀",
        "condition": ">=",
        "match": "loose"
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
        "name": "title",
        "value": "안녀",
        "condition": ">=",
        "match": "loose"
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
                "name": "title",
                "value": "안녀",
                "condition": ">=",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~>= 안녀"
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
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
  "start_key": "end"
}
```

Korean initial consonants. A query of only consonants searches the initials automatically (`ㅇㄴㅎㅅㅇ` finds `안녕하세요`):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": "products",
      "index": {
        "name": "title",
        "value": "ㅇㄴㅎㅅㅇ",
        "condition": ">=",
        "match": "loose"
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
        "name": "title",
        "value": "ㅇㄴㅎㅅㅇ",
        "condition": ">=",
        "match": "loose"
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
                "name": "title",
                "value": "ㅇㄴㅎㅅㅇ",
                "condition": ">=",
                "match": "loose"
            }
        }
    }).encode(),
    headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
)
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "title ~>= ㅇㄴㅎㅅㅇ"
VZOat4cLmXRdBGAq  products/00  [price=-1.5 title="안녕하세요 세계"]  tags:misc  {"k":1}
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
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
  "start_key": "end"
}
```

### What loose match does not do

- It needs no dictionary, so it has none: Chinese pinyin, Japanese kanji readings and simplified versus traditional Chinese are not matched. Store a reading as an extra index instead.
- It does not search the middle of a value. There is no "contains": `>=` is starts with, `<=` is ends with, and that is all.
- It works on strings only. On a number it is refused: `Loose match works on string values only.`
- A query that is empty after loosening (only spaces or punctuation, such as `"--"`) is refused: `The search text is empty after loosening (it had only spaces or punctuation).`

::: tip
The loose form of a value is written when the record is saved. If a new build of DADABADA changes the loosening rules, `dadabada start` prints a note and the admin runs `dadabada admin --data <folder> rebuild-loose` once to rewrite every loose key.
:::

## Restrictions

- One index condition per query. A query names one index and one condition on it; to narrow further, add a `tag` (see [Tags](/database/tags)), a `reference` or a single `access_level`.
- `!=` is not a query condition (it exists only in `referencing_index_restrictions`, see [Referencing](/database/referencing)). Asking for it is refused:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Unknown condition \"!=\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings)."
  }
}
```

- `range` goes with `=` (or no condition). A `condition` and a `range` together are refused:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Use either a condition or a range, not both."
  }
}
```

- `value` and `range` must be of the same type (`A range needs a value of the same type (range = from value to range).`), and a query finds only values of its own type.
- A `condition` other than `=` needs a `value`: `A condition needs a value.`
- Index names: 1 to 256 characters, no control characters, not starting with `$`, not ending with `.`. String values: 0 to 256 characters. Numbers: any finite number, exact for whole numbers up to plus or minus 2<sup>53</sup>.

::: details How the server runs an index query
Query keys are written in the same batch as the record, so a new record is found by the next query at once. Each tag stores its own copy of the record's index keys, so a tag and an index condition are read together from one sorted range for each access level. The `$referenced_count` order, the counters and the catalog listings (`getCollections`, `getIndexes`, `getTags`) are kept by a background worker and follow a moment later.
:::
