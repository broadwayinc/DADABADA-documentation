# API Reference: Database

This page lists every database method with its request body, response and error messages. Each method is `POST http://<server address>:<port>/v1/<method>` (`https://` when HTTPS is served, by a load balancer in front of DADABADA or by DADABADA itself with `--tls`) (for example `POST http://localhost:7070/v1/postRecord`) with a JSON body and `Authorization: Bearer <token>`, where `<token>` is a session token or an agent key; see [Connection](/api-reference/connection) for how a call is made, the error envelope and paging. The shapes a method answers with are in [Data Types](/api-reference/data-types).

A read-only agent key is refused by every method that writes (`postRecord`, `postRecords`, `deleteRecords`, grants, subscription changes) with `NO_ACCESS` `"This agent key is read-only."`; for `postRecords` and `deleteRecords` the refusal is listed per item in `failed`. An agent key limited to collections is refused outside them with `NO_ACCESS` `"This agent key is not allowed to use the collection \"<name>\"."`. See [Agent Keys](/api-reference/agent-keys).

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

## postRecord

`POST /v1/postRecord` · needs: session token or agent key

Creates a record, or updates one when `config.record_id` is given. The writer sets the record's access level with `collection.access_level`. See [Access levels](/database/access-levels).

```ts
// Request body
{
    data?: any; // Any JSON value: object, list, string, number, boolean or null. No size limit. Create: default null. Update: left out = kept, given = replaced whole.
    config: {   // Required. Any key not listed here is refused.
        record_id?: string; // Record id of the record to update; a unique id here answers NOT_FOUND. Present = update, absent = create.
        /** Required on create. A string is the collection name. An object sets the name, the level and the subscription settings. */
        /** On update every part is optional: name moves the record to another collection, access_level to another level. */
        collection?: string | {
            name?: string;                   // 1 to 256 characters, no control characters. Required on create. Collections appear with their first record and disappear with their last.
            access_level?: string;  // "00" to "99" (exactly two digits), or "**" for private. Default "00". Must be at or below your level; "**" is always allowed, except for an agent key without `private`. Anything else is refused, numbers (7) and one-digit strings ("7") included.
            /** Default: all five false. A missing key is false. On update the object replaces all five, so name every one you want kept. */
            subscription?: {
                is_subscription_record?: boolean;  // Besides the level rule, a reader other than the uploader must subscribe to the uploader and not be blocked. Listed only by a query with query.collection.subscription = <uploader's user_id>.
                upload_to_feed?: boolean;          // The record goes into the feed of subscribers who chose get_feed.
                notify_subscribers?: boolean;      // Subscribers who chose get_notified receive config.notification live. Create only.
                feed_referencing_records?: boolean;   // When another user creates a record that points to this one, it goes into this record's uploader's feed.
                notify_referencing_records?: boolean; // This record's uploader is notified when another user creates a record that points to it.
            } | null;
        };
        /** A list of indexes, or null. A single object without the list is refused. Default: none. Each name once per record. Unlimited unless the server sets max_indexes. */
        /** On update the list REPLACES ALL indexes, and null removes all. There is no way to change one index and keep the rest: send the full list. */
        index?: {
            name: string;                     // 1 to 256 characters, no control characters, cannot start with "$" (built in) or end with "." (a trailing dot is for searching children). A dot inside makes a compound name: "shop.brand".
            value: string | number | boolean; // String: 0 to 256 characters, no control characters, stored in NFC form. Number: any finite number, whole numbers exact up to ±2^53. null, objects and lists are not index values.
        }[] | null;
        tags?: string[] | null; // A list of strings. A comma-separated string is refused. Each tag 1 to 256 characters, no control characters. Duplicates are dropped. Unlimited unless the server sets max_tags. On update: replaces the tags; null removes them.
        unique_id?: string | null;       // Your own id for the record: 1 to 1000 bytes, no control characters, unique across the whole database. Accepted by getRecords query.unique_id, deleteRecords unique_id, and reference (a plain string or {unique_id}). A key named record_id never takes it. On update: null removes it.
        /** The record this one points to. A plain string holds a record id or a unique id; {record_id} holds a record id only; {unique_id} holds a unique id only. You must be able to read the target, and its source rules are checked. A record cannot reference itself. On update: null removes the reference; a new target's rules are checked. */
        reference?: string | { record_id: string } | { unique_id: string } | null;
        /** Rules for records that point to THIS record. Default: all off. On update only the keys given change; null resets every rule. Any key not listed is refused. */
        source?: {
            referencing_limit?: number | null;            // Default null (unlimited). Most records that may point here, 0 or more. 0 = no one may point here.
            prevent_multiple_referencing?: boolean;       // Default false. One pointing record per user.
            can_remove_referencing_records?: boolean;     // Default false. Deleting this record deletes the records pointing to it, and this record's uploader may delete them directly with deleteRecords.
            only_granted_can_reference?: boolean;         // Default false. Only the uploader and users granted private access may point here.
            allow_granted_to_grant_others?: boolean;      // Default false. Granted users may grant private access to others.
            /** Every restriction must be met by a pointing record's indexes. A list, or null (none). A single object without the list is refused. */
            referencing_index_restrictions?: {
                name: string;                       // The pointing record must have an index with this name. With only name, that is the whole rule.
                value?: string | number | boolean;  // If given, the pointing record's value is compared with it.
                condition?: "=" | "!=" | ">" | "<" | ">=" | "<="; // Default "=". For strings ">=" is starts with and "<=" is ends with. "ne" is accepted for "!=".
                range?: string | number | boolean;  // With value and no condition: the pointing value must lie between value and range, inclusive. Same type as value. Ignored when condition is given.
            }[] | null;
        } | null;
        readonly?: boolean; // Default false. true: from now on only the admin can change or delete the record, the uploader included.
        notification?: {    // Sent live to subscribers who chose get_notified, when collection.subscription.notify_subscribers is true. Also the text of a notify_referencing_records notification. Create only.
            title: string;  // Required in the object.
            body: string;   // Required in the object.
        } | null;
    }
}
```

```ts
// Response
Record // The saved record, every field present.
```

See [Record](/api-reference/data-types#record)

Update rules: only the uploader (or the admin) can update; a read-only record only by the admin; moving a record into or out of `**` only by its uploader. `updated` is set to now, `ip` to the caller's address, and the record's `agent` becomes the agent key's `{key_id, name}`, or `null` for a password session.

::: warning
On an update, `index` and `tags` replace the whole list, and `collection.subscription` replaces all five settings. `source` is the one part that merges: a `source` object changes only the keys it names.
:::

#### Example

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
          }
        ],
        "tags": [
          "sale",
          "lighting"
        ]
      }
    }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
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
        }
      ],
      "tags": [
        "sale",
        "lighting"
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
                }
            ],
            "tags": [
                "sale",
                "lighting"
            ]
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post products --level 05 --index price=1200 --index "title=Desk Lamp" --tags sale,lighting --data '{"title":"Desk Lamp","color":"red"}'
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key config does not know. When the key is access_level the message goes on:
    // ' Put it inside collection: {"collection": {"name": ..., "access_level": ...}}.'
    message: "Unknown config key \"<key>\". Allowed: record_id, collection, index, tags, reference, unique_id, source, readonly, notification.";
}
|
{
    code: "INVALID_REQUEST";
    message: "Unknown source key \"<key>\". Allowed: referencing_limit, prevent_multiple_referencing, can_remove_referencing_records, only_granted_can_reference, allow_granted_to_grant_others, referencing_index_restrictions.";
}
|
{
    code: "INVALID_REQUEST";
    message: "access_level must be \"00\" to \"99\", or \"**\" for private.";
}
|
{
    code: "INVALID_REQUEST";
    message: "Index name \"<name>\" appears twice; each name can be used once per record.";
}
|
{
    code: "INVALID_REQUEST";
    message: "Index name \"<name>\" starts with $; names starting with $ are built in.";
}
|
{
    code: "INVALID_REQUEST";
    message: "Index name \"<name>\" ends with a dot; a trailing dot is only for searching children.";
}
|
{
    code: "INVALID_REQUEST";
    // The value is null, an object or a list.
    message: "The value of index \"<name>\" must be a string, a number or true/false.";
}
|
{
    code: "INVALID_REQUEST";
    // collection.name missing on create, a name, tag, unique_id or string value outside its length rule or with a control character,
    // a value of the wrong type, a bad reference form, a bad notification, or an unknown key inside collection.
    message: "config.collection is required to create a record." | "The <field> is empty." | "The <field> is <number> characters long; the most is 256." | "The <field> \"<text>\" contains a control character." | "An index string value is <number> characters long; the most is 256." | "An index string value contains a control character." | "unique_id is empty." | "unique_id is <number> bytes long; the most is 1000." | "unique_id contains a control character." | "config must be an object." | "collection must be a name or {name, access_level, subscription}." | "collection.subscription must be an object or null." | "index must be a list of {name, value}, or null." | "Every index entry must be {\"name\": ..., \"value\": ...}." | "tags must be a list of strings, or null." | "reference must be a record id, a unique id, or null." | "unique_id must be a string or null." | "source must be an object or null." | "referencing_index_restrictions must be a list, or null." | "A restriction's range must be the same type as its value." | "notification must be {title, body}." | "\"<key>\" is required." | "\"<key>\" must be a string." | "\"<key>\" must be true or false." | "\"referencing_limit\" must be a whole number 0 or more." | "Unknown <object> key \"<key>\". Allowed: ...";
}
|
{
    code: "INVALID_REQUEST";
    // An update whose reference names the record itself.
    message: "A record cannot reference itself.";
}
|
{
    code: "INDEX_LIMIT";
    // The server runs with max_indexes and the record has more indexes than that.
    message: "This record has <number> indexes; this server allows <max> per record (max_indexes).";
}
|
{
    code: "TAG_LIMIT";
    // The server runs with max_tags and the record has more tags than that.
    message: "This record has <number> tags; this server allows <max> per record (max_tags).";
}
|
{
    code: "NO_ACCESS";
    // collection.access_level is above the caller's level (or above the agent key's max_level).
    message: "You can post at access levels up to <your level> (or ** for private); <access level> is above that.";
}
|
{
    code: "NO_ACCESS";
    // collection.access_level is "**" and the call was made with an agent key without private.
    message: "This agent key cannot use private (**) records.";
}
|
{
    code: "NO_ACCESS";
    // Update of a record the caller did not upload.
    message: "Only the uploader of record <record id> can change it.";
}
|
{
    code: "NO_ACCESS";
    message: "Record <record id> is read-only; only the admin can change it.";
}
|
{
    code: "NO_ACCESS";
    // The reference target exists but the caller cannot read it.
    message: "You cannot reference record <record id>: you cannot read it.";
}
|
{
    code: "NO_ACCESS";
    // The target has only_granted_can_reference, and the caller is neither its uploader nor granted.
    message: "Only users granted access to record <record id> can reference it.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only." | "This agent key is not allowed to use the collection \"<name>\".";
}
|
{
    code: "NOT_FOUND";
    // reference (a plain string, or {record_id}) names no record.
    message: "The referenced record <reference> does not exist.";
}
|
{
    code: "NOT_FOUND";
    // reference {unique_id} names a unique id no record has (a record id there answers this too).
    message: "No record has the unique id <unique id>.";
}
|
{
    code: "NOT_FOUND";
    // config.record_id names a record that does not exist. A unique id there answers this too.
    message: "Record <record id> does not exist.";
}
|
{
    code: "EXISTS";
    message: "unique_id \"<unique id>\" is already used by another record.";
}
|
{
    code: "REFERENCE_LIMIT";
    // The target has prevent_multiple_referencing and the caller already points to it.
    message: "You already reference record <record id>, and it allows one reference per user.";
}
|
{
    code: "REFERENCE_LIMIT";
    // The target's referencing_limit is 0.
    message: "Record <record id> does not allow references (referencing_limit is 0).";
}
|
{
    code: "REFERENCE_LIMIT";
    // The target already has referencing_limit records pointing to it.
    message: "Record <record id> already has <number> references; its limit is <limit>.";
}
|
{
    code: "REFERENCE_RESTRICTED";
    // The pointing record has no index <name>, or its value fails the restriction on <name>.
    message: "Record <record id> only accepts references whose index \"<name>\" matches its referencing_index_restrictions.";
}
|
{
    code: "REFERENCE_RESTRICTED";
    // An update changed the indexes of a record that keeps its reference, and the new indexes fail the target's restriction on <name>.
    message: "Record <record id> requires index \"<name>\" to match its restrictions.";
}
```

## postRecords

`POST /v1/postRecords` · needs: session token or agent key

```ts
// Request body
{
    /** One postRecord body per item. An item with config.record_id is an update. */
    items: {
        data?: any;       // As postRecord.
        config: object;   // As postRecord: the same keys, the same rules.
    }[];
}
```

```ts
// Response
{
    list: Record[];   // The records saved, in the order of their items.
    failed: {         // The items refused. list.length + failed.length is items.length.
        index: number;   // Position of the item in `items`, from 0.
        code: string;    // The code postRecord would have answered.
        message: string; // The message postRecord would have answered.
    }[];
}
```

See [Record](/api-reference/data-types#record)

Each item is saved on its own: a failed item does not stop the others, and the call answers 200 whether or not anything failed. Each item's `code` and `message` are those of [`postRecord`](#postrecord), the read-only agent key refusal included. An item that is not an object fails with `"The request body must be a JSON object."`.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecords \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "items": [
        {
          "data": {
            "title": "Desk Lamp"
          },
          "config": {
            "collection": "products",
            "index": [
              {
                "name": "price",
                "value": 1200
              }
            ]
          }
        },
        {
          "data": {
            "title": "Lamp Shade"
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
        }
      ]
    }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "items": [
      {
        "data": {
          "title": "Desk Lamp"
        },
        "config": {
          "collection": "products",
          "index": [
            {
              "name": "price",
              "value": 1200
            }
          ]
        }
      },
      {
        "data": {
          "title": "Lamp Shade"
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
                "data": {
                    "title": "Desk Lamp"
                },
                "config": {
                    "collection": "products",
                    "index": [
                        {
                            "name": "price",
                            "value": 1200
                        }
                    ]
                }
            },
            {
                "data": {
                    "title": "Lamp Shade"
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
            }
        ]
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw postRecords '{"items": [{"data": {"title": "Desk Lamp"}, "config": {"collection": "products", "index": [{"name": "price", "value": 1200}]}}, {"data": {"title": "Lamp Shade"}, "config": {"collection": "products", "index": [{"name": "price", "value": 35}]}}]}'
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // items is missing or not a list.
    message: "postRecords needs \"items\": [{data, config}, ...].";
}
```

## getRecords

`POST /v1/getRecords` · needs: session token or agent key

```ts
// Request body
{
    query: {  // Required. Any key not listed here is refused.
        record_id?: string;  // One record by record id. A unique id here answers NOT_FOUND. Overrides every other key. Answers a one-record page.
        unique_id?: string;  // One record by unique id. A record id here answers NOT_FOUND. Overrides every key except record_id.
        /** Required unless record_id or unique_id is given. A string is the collection name. */
        /** Without access_level the query covers every level you can read, plus your own and granted "**" records, merged in order. */
        collection?: string | {
            name: string;                  // Required in the object. The collection.
            access_level?: string;         // "00" to "99" (two digits) or "**": only this level. A level above yours is allowed; it lists the records at that level you can read through a grant or a reference. "**" lists the private records you uploaded or were granted.
            subscription?: string;         // A user id: read that user's subscription records (is_subscription_record). You must be that user, or subscribe to them and not be blocked.
        };
        /** One condition on one index. Without it, records come in upload order; with it, in value order, then upload order. */
        index?: {
            name: string;                      // An index name, a compound name ending in "." (searches its children), or a built-in: "$uploaded", "$updated", "$referenced_count", "$user_id".
            value?: string | number | boolean; // The value to compare with. Left out: every record that has this index, in value order (a condition other than "=" then needs a value).
            condition?: "=" | ">" | "<" | ">=" | "<=" | "eq" | "==" | "gt" | "lt" | "gte" | "lte"; // Default "=". Numbers and booleans compare as numbers; on strings ">=" is starts with and "<=" is ends with. "!=" is not available in queries. Only "=" (or no condition) may be sent with range.
            range?: string | number | boolean; // With condition "=" or none: from value to range, inclusive. Needs a value of the same type.
            match?: "exact" | "loose";         // Default "exact". "loose" compares loosened text: case, accents, width, kana, spacing and punctuation ignored, digits of every script unified, Korean by typed letters. Strings only.
        };
        tag?: string;        // Only records carrying this tag. Combines with index.
        /** Records pointing to a record, or the records uploaded by a user. */
        reference?: string | { record_id: string } | { unique_id: string } | { user_id: string }; // A string is a record id or a unique id. {record_id} takes a record id only, {unique_id} a unique id only. An object with none of these keys is ignored.
        private_key?: string; // A private access key from requestPrivateRecordAccessKey, for a record_id or unique_id lookup. Works only for the user it was issued to and that record.
    };
    fetch?: {               // Paging. See Connection.
        limit?: number;      // 1 to 1000. Default 50.
        ascending?: boolean; // Default true.
        start_key?: string;  // From the previous page.
    };
    // No other key: query fields go inside query.
}
```

```ts
// Response
Page<Record>
```

See [Page](/api-reference/data-types#page)

See [Record](/api-reference/data-types#record)

See [Paging](/api-reference/connection#paging)

Special index names:

| `index.name` | `index.value` | allowed |
|---|---|---|
| `$uploaded` | time in ms (number) | every condition, and `range` |
| `$updated` | time in ms (number) | every condition, and `range` |
| `$referenced_count` | number | every condition, and `range` |
| `$user_id` | user id (string) | any condition is read as `=`; the same as `reference: {user_id}` |
| a name ending in `.` (`shop.`) | child name (string), or none | `=` that child and the names under it (`shop.brand` and `shop.brand.sub`), `>=` child starts with, `<=` child ends with; no `>`, `<`, `range` or `loose`. Each record appears once. |

What a user can read: records at or below their level; their own records; records they were granted (private ones, and ones above their level); records that point to a record they uploaded or were granted; and, in a `record_id` or `unique_id` lookup, a record they hold a valid private access key for. A subscription record also needs a subscription to its uploader that is not blocked. A query without `access_level` scans the levels up to yours plus the private records you uploaded or were granted; a readable record above your level is found by its id, or by a query that names its `access_level`. Level `00` still needs an account. Sorting by `$referenced_count` can lag the true count for a moment; the count on each record is always exact.

#### Example

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
          "condition": ">="
        }
      },
      "fetch": {
        "limit": 10
      }
    }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "query": {
      "collection": "products",
      "index": {
        "name": "price",
        "value": 1000,
        "condition": ">="
      }
    },
    "fetch": {
      "limit": 10
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
                "condition": ">="
            }
        },
        "fetch": {
            "limit": 10
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> get products --index "price >= 1000" --limit 10
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query.";
}
|
{
    code: "INVALID_REQUEST";
    // query left out or null.
    message: "query is required: {\"query\": {\"collection\": ...}}.";
}
|
{
    code: "INVALID_REQUEST";
    message: "query.collection is required (a name, or {name, access_level, subscription}).";
}
|
{
    code: "INVALID_REQUEST";
    message: "Unknown query key \"<key>\". Allowed: record_id, unique_id, collection, index, tag, reference, private_key.";
}
|
{
    code: "INVALID_REQUEST";
    // "!=" or any other text in index.condition.
    message: "Unknown condition \"<condition>\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings).";
}
|
{
    code: "INVALID_REQUEST";
    message: "Use either a condition or a range, not both.";
}
|
{
    code: "INVALID_REQUEST";
    // match "loose" with a number or boolean value.
    message: "Loose match works on string values only.";
}
|
{
    code: "INVALID_REQUEST";
    // match "loose" with a value that has nothing left once spaces and punctuation are removed.
    message: "The search text is empty after loosening (it had only spaces or punctuation).";
}
|
{
    code: "INVALID_REQUEST";
    // query not an object, a bad index, an unknown key inside index, a bad access_level, a bad reference form, a bad fetch value, a bad special-name form.
    message: "query must be an object." | "query.index must be {name, value, condition}." | "Unknown query.index key \"<key>\". Allowed: name, value, condition, range, match." | "Unknown match \"<match>\". Use \"exact\" or \"loose\"." | "A range needs a value of the same type (range = from value to range)." | "A condition needs a value." | "access_level must be \"00\" to \"99\", or \"**\" for private." | "query.reference must be a record id, unique id, or <user id>." | "fetch.limit must be 1 to 1000." | "fetch.start_key is not one DADABADA gave out." | "fetch.start_key must be a string." | "$uploaded takes a time in milliseconds." | "$user_id takes a user id." | "<name> takes a number 0 or more." | "Unknown built-in index <name>. Use $uploaded, $updated, $referenced_count or $user_id." | "A name ending in '.' searches child names; use =, >= or <= with a string." | "A name ending in '.' takes a child name (a string) as its value." | "A name ending in '.' searches child names; use =, >= or <=." | "\"name\" is required.";
}
|
{
    code: "NO_ACCESS";
    // A direct lookup of a record above your level, or a private record you were not granted (a private key of another user does not help).
    message: "You have no access to record <record id>.";
}
|
{
    code: "NO_ACCESS";
    // collection.subscription names a user you do not subscribe to, or who blocked you.
    message: "These are subscription records of user <user id>; subscribe to them first.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is not allowed to use the collection \"<name>\"." | "This agent key cannot read private (**) records.";
}
|
{
    code: "NOT_FOUND";
    // query.record_id names no record. A unique id there answers this too.
    message: "Record <record id> does not exist.";
}
|
{
    code: "NOT_FOUND";
    // query.unique_id, or query.reference {unique_id}, names a unique id no record has. A record id there answers this too.
    message: "No record has the unique id <unique id>.";
}
|
{
    code: "NOT_FOUND";
    // query.reference (a plain string, or {record_id}) names no record.
    message: "The referenced record <reference> does not exist.";
}
```

## deleteRecords

`POST /v1/deleteRecords` · needs: session token or agent key

Give one of `record_id`, `unique_id` or `query`. When more than one is given, `record_id` is used first, then `unique_id`, then `query`.

```ts
// Request body
{
    record_id?: string | string[]; // Records by record id. A unique id here is reported in failed as NOT_FOUND.
    unique_id?: string | string[]; // Records by unique id. Unknown unique ids (a record id included) are skipped, not reported.
    query?: object;                // A getRecords query. Deletes the records of ONE page of that query; send the call again for the next page.
    fetch?: {                      // With query: the page. limit 1 to 1000, default 50.
        limit?: number;
        ascending?: boolean;
        start_key?: string;
    };
}
```

```ts
// Response
{
    deleted: string[];    // Record ids removed.
    failed: {             // Records that could not be removed. The call answers 200 even when every record failed.
        record_id: string;
        code: string;
        message: string;
    }[];
}
```

You can delete your own records, and records pointing to your record when it has `can_remove_referencing_records`. With `query`, the page holds only records you can read; those you cannot delete are listed in `failed`. A read-only record can only be deleted by the admin. When a record is deleted, records pointing to it are deleted too if it had `can_remove_referencing_records`; otherwise their `reference` is cleared. This happens in the background a moment later.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/deleteRecords \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"record_id": "VZOatTqxk9eWBGAq"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/deleteRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"record_id": "VZOatTqxk9eWBGAq"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/deleteRecords',
    data=json.dumps({"record_id": "VZOatTqxk9eWBGAq"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> del VZOatTqxk9eWBGAq
```

:::

#### Errors
```ts
// Per record, inside failed:
{
    record_id: string;
    code: "NO_ACCESS";
    message: "You cannot delete record <record id>: only its uploader can.";
}
|
{
    record_id: string;
    code: "NO_ACCESS";
    message: "This agent key is read-only." | "This agent key is not allowed to use the collection \"<name>\".";
}
|
{
    record_id: string;
    code: "NO_ACCESS";
    message: "Record <record id> is read-only; only the admin can delete it.";
}
|
{
    record_id: string;
    code: "NOT_FOUND";
    message: "Record <record id> does not exist.";
}

// For the whole call:
{
    code: "INVALID_REQUEST";
    // None of record_id, unique_id or query given, an id that is not a string, or a bad query (the getRecords messages).
    message: "deleteRecords needs record_id, unique_id, or a query." | "Every record_id must be a string." | "record_id must be a string or a list of strings.";
}
|
{
    code: "NO_ACCESS";
    // With query: the getRecords refusals, such as a collection outside the agent key's collections.
    message: "This agent key is not allowed to use the collection \"<name>\".";
}
```

## getCollections

`POST /v1/getCollections` · needs: session token or agent key

The four catalog methods take `{query, fetch}`. The query fields go inside `query`; any other key at the top of the body is refused with `INVALID_REQUEST` `"Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query."`. Without `query` the query is empty (`{}`). `condition` applies to the name and defaults to `=`. Leave the name out to list everything. Counters follow changes a moment later.

```ts
// Request body
{
    query?: {
        collection?: string; // Collection name to match. Left out: every collection.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default "=". ">=" names starting with, "<=" names ending with, ">" and "<" after and before in character order.
    };
    fetch?: { limit?: number; ascending?: boolean; start_key?: string; };
}
```

```ts
// Response
Page<{
    collection: string;
    number_of_records: number;    // Every level, the total.
    size: number;                 // Bytes.
    number_of_records_by_level: { [level: string]: number }; // Only levels at or below yours. The admin sees all, "**" included.
}>
```

See [Collection](/api-reference/data-types#collection)

An agent key limited to collections sees only those.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getCollections \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"query": {"collection": "pro", "condition": ">="}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getCollections', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"query": {"collection": "pro", "condition": ">="}})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getCollections',
    data=json.dumps({"query": {"collection": "pro", "condition": ">="}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> collections >= pro
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch, a bad condition or a bad fetch value. Unknown keys inside query are ignored.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query." | "Unknown condition \"<condition>\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings)." | "fetch.limit must be 1 to 1000.";
}
```

## getTags

`POST /v1/getTags` · needs: session token or agent key

```ts
// Request body
{
    query: {
        collection: string;  // Required.
        tag?: string;        // Tag to match. Left out: every tag of the collection.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default "=". ">=" starts with, "<=" ends with.
    };
    fetch?: { limit?: number; ascending?: boolean; start_key?: string; };
}
```

```ts
// Response
Page<{
    collection: string;
    tag: string;
    number_of_records: number;
}>
```

See [Tag](/api-reference/data-types#tag)

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getTags \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"query": {"collection": "products"}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getTags', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"query": {"collection": "products"}})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getTags',
    data=json.dumps({"query": {"collection": "products"}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> tags products
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch, collection missing, a bad condition or a bad fetch value. Unknown keys inside query are ignored.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query." | "\"collection\" is required." | "Unknown condition \"<condition>\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings)." | "fetch.limit must be 1 to 1000.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is not allowed to use the collection \"<name>\".";
}
```

## getIndexes

`POST /v1/getIndexes` · needs: session token or agent key

```ts
// Request body
{
    query: {
        collection: string;  // Required.
        index?: string;      // Index name to match. A name ending in "." with "=" lists its children ("shop." lists shop.brand, shop.brand.sub, shop.rating). Left out: every index of the collection.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default "=". ">=" starts with, "<=" ends with.
        /** List in the order of a counter instead of by name. With an order other than index_name, an index ending in "." keeps only its children, and any other index name is ignored. Use fetch.ascending false for largest first. */
        order?: {
            by: "index_name" | "number_of_records" | "average_number" | "total_number" | "number_count" | "average_bool" | "total_bool" | "bool_count" | "string_count"; // Required in the object. "index_name" is the default order.
            value?: number;    // Keep only entries whose counter passes condition against this value.
            condition?: "=" | ">" | "<" | ">=" | "<="; // Default "=". Compared with value on the counter.
        };
    };
    fetch?: { limit?: number; ascending?: boolean; start_key?: string; };
}
```

```ts
// Response
Page<{
    collection: string;
    index: string;             // The index name.
    number_of_records: number; // Records in the collection that have this index.
    string_count: number;      // How many of them hold a string.
    number_count: number;      // How many hold a number.
    boolean_count: number;     // How many hold a boolean.
    total_number: number;      // Sum of the number values.
    total_bool: number;        // How many are true.
    average_number: number;    // total_number / number_count, 0 when there are none.
    average_bool: number;      // total_bool / boolean_count, 0 when there are none.
}>
```

See [Index](/api-reference/data-types#index)

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getIndexes \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"query": {"collection": "products"}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getIndexes', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"query": {"collection": "products"}})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getIndexes',
    data=json.dumps({"query": {"collection": "products"}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> indexes products
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch, collection or order.by missing, an unknown order.by, a bad condition or a bad fetch value. Unknown keys inside query are ignored.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query." | "\"collection\" is required." | "\"by\" is required." | "order.by must be index_name, number_of_records, average_number, total_number, number_count, average_bool, total_bool, bool_count or string_count." | "order.value must be a number." | "Unknown condition \"<condition>\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings).";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is not allowed to use the collection \"<name>\".";
}
```

## getUniqueId

`POST /v1/getUniqueId` · needs: session token or agent key

```ts
// Request body
{
    query?: {
        unique_id?: string;  // Unique id to match. Left out: every unique id whose record you can read.
        condition?: "=" | ">" | "<" | ">=" | "<="; // Default "=". ">=" starts with, "<=" ends with.
    };
    fetch?: { limit?: number; ascending?: boolean; start_key?: string; };
}
```

```ts
// Response
Page<{
    unique_id: string;
    record_id: string;
}>
```

See [UniqueId](/api-reference/data-types#uniqueid)

The listing holds only unique ids of records you can read. An agent key's limits (collections, `max_level`, `private`) narrow it further.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getUniqueId \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"query": {"unique_id": "sku-", "condition": ">="}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getUniqueId', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"query": {"unique_id": "sku-", "condition": ">="}})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getUniqueId',
    data=json.dumps({"query": {"unique_id": "sku-", "condition": ">="}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> uniques >= sku-
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch, a bad condition or a bad fetch value. Unknown keys inside query are ignored.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query." | "Unknown condition \"<condition>\". Use =, >, <, >= (starts with, for strings) or <= (ends with, for strings)." | "fetch.limit must be 1 to 1000.";
}
```

## grantPrivateRecordAccess

`POST /v1/grantPrivateRecordAccess` · needs: session token or agent key

```ts
// Request body
{
    record_id: string;           // Required. A record id (a unique id is not accepted here). Any record can be granted: a granted user can read a private record or one above their level, and can list and search a "**" record like their own.
    user_id: string | string[];  // 1 to 100 user ids. Each must be an existing user.
}
```

```ts
// Response
{
    record_id: string;
    granted: string[]; // The user ids newly granted. The uploader and users already granted are skipped and not listed.
}
```

Allowed for the uploader, or for granted users when the record has `allow_granted_to_grant_others`.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/grantPrivateRecordAccess \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/grantPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/grantPrivateRecordAccess',
    data=json.dumps({"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grant VZOatTqxk9eWBGAq YfAbyt1C
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // The caller is neither the uploader nor a granted user of a record with allow_granted_to_grant_others.
    message: "Only the uploader of record <record id> can grant access to it.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only." | "This agent key is not allowed to use the collection \"<name>\".";
}
|
{
    code: "INVALID_REQUEST";
    // record_id missing, user_id missing, empty or more than 100 ids.
    message: "\"record_id\" is required." | "Give 1 to 100 user ids per call." | "user_id must be a string or a list of strings." | "Every user_id must be a string.";
}
|
{
    code: "NOT_FOUND";
    // The record does not exist, or one of the user ids is not a user. Nothing is granted then.
    message: "Record <record id> does not exist." | "User <user id> does not exist.";
}
```

## removePrivateRecordAccess

`POST /v1/removePrivateRecordAccess` · needs: session token or agent key

```ts
// Request body
{
    record_id: string;           // Required. A record id.
    user_id: string | string[];  // 1 to 100 user ids.
}
```

```ts
// Response
{
    record_id: string;
    removed: string[]; // The user ids whose access was removed. The uploader and users who were not granted are skipped and not listed.
}
```

Allowed for the uploader, or for granted users when the record has `allow_granted_to_grant_others`.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/removePrivateRecordAccess \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/removePrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/removePrivateRecordAccess',
    data=json.dumps({"record_id": "VZOatTqxk9eWBGAq", "user_id": "YfAbyt1C"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> revoke VZOatTqxk9eWBGAq YfAbyt1C
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // The caller is neither the uploader nor a granted user of a record with allow_granted_to_grant_others.
    message: "Only the uploader of record <record id> can grant access to it.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only." | "This agent key is not allowed to use the collection \"<name>\".";
}
|
{
    code: "INVALID_REQUEST";
    // record_id missing, user_id missing, empty or more than 100 ids.
    message: "\"record_id\" is required." | "Give 1 to 100 user ids per call." | "user_id must be a string or a list of strings." | "Every user_id must be a string.";
}
|
{
    code: "NOT_FOUND";
    message: "Record <record id> does not exist.";
}
```

## listPrivateRecordAccess

`POST /v1/listPrivateRecordAccess` · needs: session token or agent key

```ts
// Request body
{
    record_id?: string; // Who is granted this record. The uploader and granted users may ask. When given, user_id is ignored.
    user_id?: string;   // Which records this user is granted. Default: yourself. Only yourself.
}
```

```ts
// Response
{
    list: {             // Not paged: the whole list.
        record_id: string;
        user_id: string;
    }[];
}
```

See [Grant](/api-reference/data-types#grant)

With an empty body, lists the records you were granted.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/listPrivateRecordAccess \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"record_id": "VZOatTqxk9eWBGAq"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/listPrivateRecordAccess', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"record_id": "VZOatTqxk9eWBGAq"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listPrivateRecordAccess',
    data=json.dumps({"record_id": "VZOatTqxk9eWBGAq"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> grants VZOatTqxk9eWBGAq
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // record_id of a record you neither uploaded nor were granted, or user_id of another user.
    message: "You cannot list who can access record <record id>." | "You can only list your own grants.";
}
|
{
    code: "NOT_FOUND";
    message: "Record <record id> does not exist.";
}
```

## requestPrivateRecordAccessKey

`POST /v1/requestPrivateRecordAccessKey` · needs: session token or agent key

```ts
// Request body
{
    record_id: string;      // Required. The record to open. A record id.
    reference_id?: string;  // A record you can read that points to record_id. Lets you open a record you cannot read through a record you can read that references it.
}
```

```ts
// Response
{
    record_id: string;
    private_key: string; // Hex. Pass it as query.private_key to getRecords.
    expires: number;     // When the key stops working, in ms. Lifetime is the server's private_key_ttl (default 1 hour).
}
```

The key is given if you can read the record now, or through `reference_id`. It works only for you and that record, until `expires` or until the admin runs `secret rotate`, which cancels every key.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/requestPrivateRecordAccessKey \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"record_id": "VZOatTqxk9eWBGAq"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/requestPrivateRecordAccessKey', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"record_id": "VZOatTqxk9eWBGAq"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/requestPrivateRecordAccessKey',
    data=json.dumps({"record_id": "VZOatTqxk9eWBGAq"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> key VZOatTqxk9eWBGAq
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // You can read neither the record nor reference_id, or reference_id does not point to record_id.
    message: "You have no access to record <record id>.";
}
|
{
    code: "INVALID_REQUEST";
    // record_id missing or not a string.
    message: "\"record_id\" is required." | "\"record_id\" must be a string.";
}
|
{
    code: "NOT_FOUND";
    message: "Record <record id> does not exist.";
}
```

## subscribe

`POST /v1/subscribe` · needs: session token or agent key

```ts
// Request body
{
    user_id: string;        // Required. The user to subscribe to. Not yourself.
    get_feed?: boolean;     // Receive their upload_to_feed records in getFeed. New subscription: false. Left out: unchanged.
    get_notified?: boolean; // Receive their notify_subscribers notifications on listen. New subscription: false. Left out: unchanged.
}
```

```ts
// Response
Subscription
```

See [Subscription](/api-reference/data-types#subscription)

A new subscription starts with both options off. Calling `subscribe` again for the same user changes only the options given and keeps the rest.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/subscribe \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "DS4gIE0n", "get_feed": true, "get_notified": true}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"user_id": "DS4gIE0n", "get_feed": true, "get_notified": true})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/subscribe',
    data=json.dumps({"user_id": "DS4gIE0n", "get_feed": True, "get_notified": True}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> subscribe DS4gIE0n --feed --notify
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // user_id missing or your own, or get_feed or get_notified not a boolean.
    message: "\"user_id\" is required." | "user_id cannot be your own." | "\"get_feed\" must be true or false." | "\"get_notified\" must be true or false.";
}
|
{
    code: "NOT_FOUND";
    // user_id is not a user.
    message: "User <user id> does not exist.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only.";
}
```

## unsubscribe

`POST /v1/unsubscribe` · needs: session token or agent key

```ts
// Request body
{
    user_id: string; // Required. The user to stop following.
}
```

```ts
// Response
{
    message: "Unsubscribed from <user id>.";
}
```

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/unsubscribe \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "DS4gIE0n"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/unsubscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"user_id": "DS4gIE0n"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/unsubscribe',
    data=json.dumps({"user_id": "DS4gIE0n"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> unsubscribe DS4gIE0n
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // user_id missing or your own.
    message: "\"user_id\" is required." | "user_id cannot be your own.";
}
|
{
    code: "NOT_FOUND";
    // user_id is not a user, or you do not subscribe to them.
    message: "User <user id> does not exist." | "You do not subscribe to <user id>.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only.";
}
```

## blockSubscriber

`POST /v1/blockSubscriber` · needs: session token or agent key

```ts
// Request body
{
    user_id: string; // Required. A user who subscribes to you.
}
```

```ts
// Response
Subscription // Their subscription to you, with blocked true. get_feed and get_notified keep their values.
```

See [Subscription](/api-reference/data-types#subscription)

A blocked subscriber gets none of your feed records or notifications and cannot read your subscription records.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/blockSubscriber \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "YfAbyt1C"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/blockSubscriber', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"user_id": "YfAbyt1C"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/blockSubscriber',
    data=json.dumps({"user_id": "YfAbyt1C"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> block YfAbyt1C
Blocked YfAbyt1C.
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // user_id missing or your own.
    message: "\"user_id\" is required." | "user_id cannot be your own.";
}
|
{
    code: "NOT_FOUND";
    // user_id is not a user, or does not subscribe to you.
    message: "User <user id> does not exist." | "User <user id> does not subscribe to you.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only.";
}
```

## unblockSubscriber

`POST /v1/unblockSubscriber` · needs: session token or agent key

```ts
// Request body
{
    user_id: string; // Required. A subscriber you blocked.
}
```

```ts
// Response
Subscription // Their subscription to you, with blocked false.
```

See [Subscription](/api-reference/data-types#subscription)

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/unblockSubscriber \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "YfAbyt1C"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/unblockSubscriber', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"user_id": "YfAbyt1C"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/unblockSubscriber',
    data=json.dumps({"user_id": "YfAbyt1C"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> unblock YfAbyt1C
Unblocked YfAbyt1C.
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // user_id missing or your own.
    message: "\"user_id\" is required." | "user_id cannot be your own.";
}
|
{
    code: "NOT_FOUND";
    // user_id is not a user, or does not subscribe to you.
    message: "User <user id> does not exist." | "User <user id> does not subscribe to you.";
}
|
{
    code: "NO_ACCESS";
    message: "This agent key is read-only.";
}
```

## getSubscriptions

`POST /v1/getSubscriptions` · needs: session token or agent key

```ts
// Request body
{
    subscriber?: string;   // A user id: whom this user subscribes to.
    subscription?: string; // A user id: who subscribes to this user.
    blocked?: boolean;     // true: only blocked. false: only unblocked. Left out: both.
    fetch?: { limit?: number; ascending?: boolean; start_key?: string; };
}
```

```ts
// Response
Page<Subscription>
```

See [Page](/api-reference/data-types#page)

See [Subscription](/api-reference/data-types#subscription)

At least one of `subscriber` and `subscription` is required, and one of them must be your own user id. With both, the page holds that one subscription or nothing. The list is in user id order, always ascending (`fetch.ascending` is ignored).

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getSubscriptions \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"subscriber": "<your user id>"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getSubscriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"subscriber": "<your user id>"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getSubscriptions',
    data=json.dumps({"subscriber": "<your user id>"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> subscriptions
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // Neither subscriber nor subscription given, blocked not a boolean, or a bad fetch value.
    message: "Give subscriber, subscription, or both." | "\"blocked\" must be true or false." | "fetch.limit must be 1 to 1000.";
}
|
{
    code: "NO_ACCESS";
    // Neither subscriber nor subscription is you.
    message: "You can only list your own subscriptions and subscribers.";
}
```

## getFeed

`POST /v1/getFeed` · needs: session token or agent key

```ts
// Request body
{
    query?: {
        access_level?: string; // "00" to "99" (two digits). Highest level to include; a level above yours counts as yours. Default: your level. Only inside query.
    };
    fetch?: {
        limit?: number;      // 1 to 1000. Default 50.
        ascending?: boolean; // Default false: newest first.
        start_key?: string;
    };
    // No other key. Without query the query is empty.
}
```

```ts
// Response
Page<Record>
```

See [Page](/api-reference/data-types#page)

See [Record](/api-reference/data-types#record)

The feed holds records from users you subscribe to with `get_feed` (and who have not blocked you) that were saved with `upload_to_feed`, plus records pointing to your records that have `feed_referencing_records`. Only records created by another user reach your feed through `feed_referencing_records`. Private records appear when you can read them, whatever `access_level` says. Records come in upload order. Feed delivery is background work, so a record appears a moment after it is saved. A page can be shorter than `limit` while `end_of_list` is still `false`, because entries you can no longer read are skipped; keep paging until `end_of_list` is `true`.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getFeed \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"fetch": {"limit": 20}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getFeed', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"fetch": {"limit": 20}})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getFeed',
    data=json.dumps({"fetch": {"limit": 20}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> feed --limit 20
```

:::

#### Errors
```ts
{
    code: "INVALID_REQUEST";
    // A key at the top of the body other than query and fetch, a bad access_level or a bad fetch value.
    message: "Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query." | "access_level must be \"00\" to \"99\", or \"**\" for private." | "fetch.limit must be 1 to 1000.";
}
```

## listen

`GET /v1/listen` · needs: session token or agent key

The one GET method. Opens a Server-Sent Events stream that carries notifications as they arrive.

```ts
// Request: no body. Headers and query string:
{
    "Authorization": "Bearer <session token or agent key>"; // Who is listening. Or ?token=<token> in the URL, for a browser EventSource, which cannot set headers. listen is the only method that reads ?token=.
    "Last-Event-ID"?: string; // Optional. Send stored notifications after this id first, then continue live. "0" replays everything still stored.
}
```

```ts
// Response: Content-Type text/event-stream. Each notification is one event:
id: <16 hex digits, increasing>
event: notify
data: Notification // One JSON line. See Data Types.
```

See [Notification](/api-reference/data-types#notification)

| event | meaning |
|---|---|
| `notify` | A notification. `id` is 16 hex digits and increases; keep the last one you handled for `Last-Event-ID`. |
| `gap` | Some notifications expired before you reconnected, or you read too slowly. `data` is a JSON object with a `message`. |
| `: connected` | A comment, sent once the replay is done. |
| `: ping` | A comment every 30 seconds to keep the connection open. |

What arrives: records created with `notify_subscribers` and a `config.notification` by users you subscribe to with `get_notified` (and who have not blocked you), and, when your record has `notify_referencing_records`, a notification each time another user creates a record that points to it. That notification carries the pointing record's `config.notification`, or the title `"New reference"` and the body `"Record <record id> references your record <your record id>."` when it has none. Missed notifications are kept for the server's `notify_keep` (default 1 day) and replayed on reconnect with `Last-Event-ID`.

A stream as a listener sees it:

```
: connected

id: 0000000000000001
event: notify
data: {"body":"30% off until midnight","collection":"news","created":1793235381390,"from":"JFeCedoO","record_id":"VZOauWjWDo8wBGAq","title":"Flash sale"}
```

::: tip
Behind a reverse proxy, turn response buffering off for this path, or events wait in the proxy until the buffer fills. The server sends `X-Accel-Buffering: no`, which some proxies honour on their own.
:::

#### Example

::: code-group

```bash [curl]
$ curl -N http://localhost:7070/v1/listen \
    -H "Authorization: Bearer <token>"
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/listen', {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
});
const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  process.stdout.write(value); // event lines as they arrive
}
```

```python [Python]
import urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listen',
    headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req) as stream:
    for line in stream:
        print(line.decode().rstrip(), flush=True)  # event lines as they arrive
```

```text [User shell]
alice> listen
```

:::

#### Errors
```ts
{
    code: "UNAUTHORIZED";
    message: "Sign in first: send Authorization: Bearer <session token or agent key>." | "Your session ended or is unknown; sign in again." | "This agent key is unknown, revoked or expired.";
}
```
