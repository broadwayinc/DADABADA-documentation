# API Reference: Data Types

This page lists every shape the API answers with, in TypeScript form, followed by the rules for values, names, levels, durations and conditions.

## Record

What [`postRecord`](/api-reference/database#postrecord) answers, and what `list` holds in [`getRecords`](/api-reference/database#getrecords), [`postRecords`](/api-reference/database#postrecords) and [`getFeed`](/api-reference/database#getfeed). Every field is always present.

```ts
type Record = {
    record_id: string;      // 16 characters: 7 for the upload time, 5 random, 4 taken from the uploader's id. Record ids sort by upload time.
    user_id: string;        // The uploader. Only the uploader (or the admin) can change or delete the record.
    agent: { key_id: string; name: string } | null; // The agent key that last wrote the record; null when a password session did.
                            // Records written before key ids were kept hold the key name as a plain string.
    collection: {
        name: string;
        access_level: string; // "00" to "99", or "**" for private. Always two characters.
        subscription: SubscriptionSettings; // All five booleans, always present.
    };
    index: { name: string; value: string | number | boolean }[]; // Every index of the record, in the order given. [] when none.
    tags: string[];         // [] when none.
    reference: string | null; // Record id of the record this one points to. Always a record id, even when a unique id was given. Cleared to null in the background when the target is deleted without can_remove_referencing_records.
    unique_id: string | null;
    source: Source;         // Rules for records pointing to this one. All six keys always present.
    readonly: boolean;      // true: only the admin can change or delete it.
    referenced_count: number; // How many records point to this one. Exact on the record itself; sorting by $referenced_count can lag for a moment.
    uploaded: number;       // Upload time in ms.
    updated: number;        // Time of the last change in ms. Equal to uploaded until the first update.
    ip: string;             // Address of the last writer. Behind a reverse proxy this is the proxy's address.
    data: any;              // The record's data: any JSON value, null when none was given.
}
```

```json
{
  "record_id": "VZOPzgb5SOhymobc",
  "user_id": "DS4gIE0n",
  "agent": null,
  "collection": {
    "name": "products",
    "access_level": "05",
    "subscription": { "is_subscription_record": false, "upload_to_feed": false, "notify_subscribers": false, "feed_referencing_records": false, "notify_referencing_records": false }
  },
  "index": [ { "name": "price", "value": 1200 }, { "name": "title", "value": "Desk Lamp" } ],
  "tags": ["sale"],
  "reference": null,
  "unique_id": "sku-1042",
  "source": { "referencing_limit": null, "prevent_multiple_referencing": false, "can_remove_referencing_records": false, "only_granted_can_reference": false, "allow_granted_to_grant_others": false, "referencing_index_restrictions": [] },
  "readonly": false,
  "referenced_count": 0,
  "uploaded": 1793232752327,
  "updated": 1793232752327,
  "ip": "203.0.113.5",
  "data": { "color": "red" }
}
```

## Page

What every listing method answers. See [Paging](/api-reference/connection#paging).

```ts
type Page<T> = {
    list: T[];            // At most fetch.limit items (default 50).
    start_key: string;    // Opaque. Send it back as fetch.start_key for the next page. "end" when end_of_list is true.
    end_of_list: boolean; // true on the last page. The only reliable sign that nothing is left: a page can be shorter than limit before the end.
}
```

## User

The `user` of [`login`](/api-reference/connection#login), and the base of [`whoami`](/api-reference/connection#whoami).

```ts
type User = {
    user_id: string;      // Account id. Records carry it as user_id, subscriptions as subscriber and subscription.
    username: string;     // 1 to 256 characters, no spaces, unique. Set by the admin.
    access_level: string; // "00" to "99". Set by the admin. The user reads at or below it and posts at or below it (or at "**").
    records: number;      // Records saved by the account.
    subscribers: number;  // Users subscribing to the account.
    subscribed: number;   // Users the account subscribes to.
    created: number;      // When the admin added the account, in ms.
}
```

`whoami` adds `effective_access_level`, `enc_salt`, `kdf` and, with an agent key, `agent`. See [`whoami`](/api-reference/connection#whoami).

## Subscription

What [`subscribe`](/api-reference/database#subscribe), [`blockSubscriber`](/api-reference/database#blocksubscriber) and [`unblockSubscriber`](/api-reference/database#unblocksubscriber) answer, and what `list` holds in [`getSubscriptions`](/api-reference/database#getsubscriptions).

```ts
type Subscription = {
    subscription: string;  // User id of the user subscribed to.
    subscriber: string;    // User id of the subscriber.
    get_feed: boolean;     // The subscriber receives the user's upload_to_feed records in getFeed.
    get_notified: boolean; // The subscriber receives the user's notify_subscribers notifications on listen.
    blocked: boolean;      // Set by the subscribed-to user. A blocked subscriber gets no feed or notifications and cannot read subscription records.
    timestamp: number;     // When the subscription was made, in ms. Unchanged by later subscribe calls and by blocking.
}
```

## AgentKey

What [`createAgentKey`](/api-reference/agent-keys#createagentkey) (plus `key`) and [`revokeAgentKey`](/api-reference/agent-keys#revokeagentkey) answer, what `list` holds in [`listAgentKeys`](/api-reference/agent-keys#listagentkeys), and the `agent` of [`whoami`](/api-reference/connection#whoami).

```ts
type AgentKey = {
    key_id: string;               // Short id, for revokeAgentKey.
    user_id: string;              // The user who made the key.
    name: string;                 // Shown, with key_id, as `agent` on records the key writes.
    max_level: string | null;     // "00" to "99", or null for no cap (the user's own level applies).
    read_only: boolean;           // true: every write is refused.
    private: boolean;             // true: "**" records allowed.
    collections: string[];        // The allowed collections; [] for all.
    expires: number | null;       // Time in ms, or null for never.
    created: number;              // Time in ms.
}
```

The key itself (`dk_...`) is not part of the shape. It is returned once, as `key`, by `createAgentKey` only.

## Collection

What `list` holds in [`getCollections`](/api-reference/database#getcollections).

```ts
type Collection = {
    collection: string;
    number_of_records: number; // The total over every level.
    size: number;              // Bytes.
    number_of_records_by_level: { [level: string]: number }; // Keys are levels ("00", "05"). Only levels at or below the caller's, never "**"; the admin sees every level, "**" included.
}
```

## Tag

What `list` holds in [`getTags`](/api-reference/database#gettags).

```ts
type Tag = {
    collection: string;
    tag: string;
    number_of_records: number;
}
```

## Index

What `list` holds in [`getIndexes`](/api-reference/database#getindexes): one entry per index name in a collection, with its counters. Counters follow changes a moment later.

```ts
type Index = {
    collection: string;
    index: string;             // The index name.
    number_of_records: number; // Records in the collection that have this index.
    string_count: number;      // How many hold a string value.
    number_count: number;      // How many hold a number value.
    boolean_count: number;     // How many hold a boolean value.
    total_number: number;      // Sum of the number values.
    total_bool: number;        // How many are true.
    average_number: number;    // total_number / number_count; 0 when number_count is 0.
    average_bool: number;      // total_bool / boolean_count; 0 when boolean_count is 0.
}
```

`order.by` in `getIndexes` names any counter here (`number_of_records`, `average_number`, `total_number`, `number_count`, `average_bool`, `total_bool`, `bool_count`, `string_count`) or `index_name`. `bool_count` in `order.by` is the `boolean_count` field.

## UniqueId

What `list` holds in [`getUniqueId`](/api-reference/database#getuniqueid).

```ts
type UniqueId = {
    unique_id: string;
    record_id: string;
}
```

## Grant

What `list` holds in [`listPrivateRecordAccess`](/api-reference/database#listprivaterecordaccess).

```ts
type Grant = {
    record_id: string;
    user_id: string; // The granted user.
}
```

## Restriction

One entry of `source.referencing_index_restrictions`: a rule a pointing record's indexes must meet. Sent as in [`postRecord`](/api-reference/database#postrecord); answered with every key present.

```ts
type Restriction = {
    name: string;                            // The pointing record must have an index with this name.
    value: string | number | boolean | null; // Compared with the pointing record's value. null: the index only has to exist.
    condition: "=" | "!=" | ">" | "<" | ">=" | "<=" | null; // null means "=" (or a range when range is set). For strings ">=" is starts with and "<=" is ends with.
    range: string | number | boolean | null; // With value and no condition: the pointing value must lie between value and range, inclusive. Ignored when condition is set.
}
```

```json
[
  { "name": "rating", "value": 1, "range": 5, "condition": null },
  { "name": "code", "value": "KR-", "range": null, "condition": ">=" },
  { "name": "status", "value": "spam", "range": null, "condition": "!=" },
  { "name": "author", "value": null, "range": null, "condition": null }
]
```

A pointing record that fails any entry is refused with `REFERENCE_RESTRICTED`.

## Source

The `source` of a [Record](#record): rules for records that point to it. All six keys are always present in an answer; in a request every key is optional.

```ts
type Source = {
    referencing_limit: number | null;     // Most records that may point here. null: unlimited. 0: none.
    prevent_multiple_referencing: boolean; // One pointing record per user.
    can_remove_referencing_records: boolean; // Deleting this record deletes the records pointing to it, and its uploader may delete them directly.
    only_granted_can_reference: boolean;  // Only the uploader and granted users may point here.
    allow_granted_to_grant_others: boolean; // Granted users may grant private access to others.
    referencing_index_restrictions: Restriction[]; // [] when none.
}
```

See [Restriction](#restriction)

## SubscriptionSettings

The `collection.subscription` of a [Record](#record). All five are always present in an answer; in a request a missing one is `false`.

```ts
type SubscriptionSettings = {
    is_subscription_record: boolean;    // Besides the level rule, a reader other than the uploader must subscribe to the uploader and not be blocked. Listed only with query.collection.subscription = <uploader id>.
    upload_to_feed: boolean;            // The record goes into the feed of subscribers who chose get_feed.
    notify_subscribers: boolean;        // Subscribers who chose get_notified receive the record's notification on listen.
    feed_referencing_records: boolean;  // A record another user creates pointing to this one goes into this record's uploader's feed.
    notify_referencing_records: boolean; // This record's uploader is notified when another user creates a record pointing to it.
}
```

## Notification

The `data` of a `notify` event on [`listen`](/api-reference/database#listen), one JSON object per line.

```ts
type Notification = {
    from: string;       // User id of the uploader whose record caused it.
    record_id: string;  // The record saved with notify_subscribers, or the record that pointed to yours.
    collection: string; // Its collection.
    title: string;      // From config.notification. For a reference without one: "New reference".
    body: string;       // From config.notification. For a reference without one: "Record <record id> references your record <your record id>."
    created: number;    // Time in ms.
}
```

```
id: 0000000000000001
event: notify
data: {"body":"30% off until midnight","collection":"news","created":1793235381390,"from":"JFeCedoO","record_id":"VZOauWjWDo8wBGAq","title":"Flash sale"}
```

The `id` line is 16 hex digits and increases; send the last one you handled as `Last-Event-ID` when reconnecting. A `gap` event's `data` is `{"message": "..."}`.

## Values

An index value, a value in a query condition and a value in a restriction is one of:

| type | examples | rule |
|---|---|---|
| string | `"Desk Lamp"`, `""`, `"안녕"` | 0 to 256 characters, no control characters. Stored in Unicode NFC form, so visually identical text always matches. |
| number | `1200`, `-1.5`, `4.5e3` | Any finite number. Whole numbers are exact up to ±2^53. |
| boolean | `true`, `false` | `false` sorts before `true`. |

`null`, objects and lists are not index values. Record `data` is any JSON value with no size limit.

## Names

| item | rule |
|---|---|
| collection names, tags, index names | 1 to 256 characters, no control characters, stored in NFC form |
| index names | cannot start with `$` (built in: `$uploaded`, `$updated`, `$referenced_count`, `$user_id`) or end with `.` (a trailing dot is for searching children). A dot inside makes a compound name: `shop.brand`, `shop.brand.sub`. |
| `unique_id` | 1 to 1000 bytes, no control characters, unique across the whole database, stored in NFC form |
| usernames | 1 to 256 characters, no spaces (or other whitespace) or control characters, unique |
| agent key names | 1 to 256 characters, no control characters, need not be unique; shown with the key id as `agent` on records the key writes |
| indexes per record | unlimited, or the server's `max_indexes` |
| tags per record | unlimited, or the server's `max_tags` |
| grants per call | 1 to 100 user ids |
| page size | 1 to 1000, default 50 |

## Levels

| who / what | values |
|---|---|
| a user's level | `"00"` to `"99"`, set by the admin |
| a record's level | `"00"` to `"99"`, or `"**"` (private) |

In a request `access_level` accepts only a string of exactly two digits, `"00"` to `"99"`, or `"**"`. Any other value is refused, a number such as `7` or a one-digit string such as `"7"` included: `access_level must be "00" to "99", or "**" for private.` An agent key's `max_level` follows the same rule without `"**"`: `max_level must be "00" to "99".` Answers always carry two characters.

The writer of a record sets its level. A user reads records at or below their level, their own records, records they were granted (private ones and ones above their level), records that point to a record they uploaded or were granted, and, in a `record_id` or `unique_id` lookup, a record they hold a valid private access key for. A subscription record also needs a subscription to its uploader that is not blocked. A user posts at or below their level, or at `**`. Level `00` still needs an account. No network user has admin powers, whatever their level. See [Access levels](/database/access-levels).

## Durations

Used by `expires` in [`createAgentKey`](/api-reference/agent-keys#createagentkey) and by the server settings `notify_keep`, `private_key_ttl` and `login_max_delay`: a number followed by `ms`, `s`, `m`, `h`, `d` or `w`, for example `30m`, `12h`, `7d`. No other unit is accepted (`10sec` and `10min` are refused). A number with no unit is seconds. Where a time is accepted instead (`expires` sent as a JSON number), it is a time in milliseconds.

## Conditions

What a `condition` means depends on the type of the value it compares:

| condition | also written | numbers and booleans | strings |
|---|---|---|---|
| `=` | `eq`, `==` | equal | equal |
| `>` | `gt` | greater | after, in character order |
| `<` | `lt` | less | before, in character order |
| `>=` | `gte` | greater or equal | **starts with** |
| `<=` | `lte` | less or equal | **ends with** |
| `range` | | from `value` to `range`, inclusive | from `value` to `range`, inclusive, in character order |

`false` sorts before `true`. In a query, `range` works only with `=` or no condition, and `!=` is not available. A restriction also accepts `!=` (`ne`). On a compound name ending in `.`, the condition applies to the child name: `=` that child and the names under it, `>=` child starts with, `<=` child ends with.

With `"match": "loose"` in a query, string comparisons ignore case, accents in Latin, Greek, Cyrillic, Armenian, Hebrew, Arabic and Syriac, full-width and half-width forms, katakana versus hiragana, spaces, punctuation and invisible characters; digits of every script become ASCII; Korean is compared as typed letters, so a half-typed word finds the whole one, and a query of only first consonants searches the initials. Loose match works on strings only, and a query that is empty after loosening is refused. Searching the middle of a value ("contains") is not possible.

The same `condition` set applies to names in the catalog methods [`getCollections`](/api-reference/database#getcollections), [`getTags`](/api-reference/database#gettags), [`getIndexes`](/api-reference/database#getindexes) and [`getUniqueId`](/api-reference/database#getuniqueid), where the name is a string: `>=` starts with, `<=` ends with, default `=`.
