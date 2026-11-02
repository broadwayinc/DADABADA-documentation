# Database

DDBD stores records: JSON values that apps, scripts and AI agents save and find through the API. There are no tables to create and no schema to declare. The user who saves a record decides where it goes, who can read it and how it can be found, and the database is ready to answer queries on it at once.

## What a record looks like

A record is the JSON you saved (`data`) with the settings around it. This is a record as DDBD answers it, shortened to the main fields:

```json
{
  "record_id": "VZoQU2VISdszI4a9",
  "user_id": "POsNqsDQ",
  "collection": { "name": "products", "access_level": "05" },
  "index": [
    { "name": "price", "value": 1200 },
    { "name": "title", "value": "Desk Lamp" }
  ],
  "tags": ["sale", "lighting"],
  "unique_id": null,
  "reference": null,
  "data": { "title": "Desk Lamp", "color": "red" },
  "uploaded": 1793387717579,
  "updated": 1793387717579
}
```

It is a product in the `products` collection, saved by user `POsNqsDQ`, readable by users at level `05` and above, and findable by price, by title and by its two tags. Every field is described in [Creating records](/database/create).

## The words

| word | what it is |
|---|---|
| record | A JSON value (`data`) and its settings, with a 16-character `record_id` that sorts by upload time. |
| collection | The name a record is saved under. It appears with its first record and disappears with its last. |
| index | A `name` and a `value` (string, number or `true`/`false`) the record can be searched by. Any number per record. |
| tag | A plain label on a record that queries can ask for. |
| unique id | Your own id for a record, unique across the database, such as an order number. |
| reference | A pointer from one record to another. The record pointed to sets who may point to it. |
| access level | Who can read the record: `"00"` to `"99"`, or `"**"` for private. |

## Features

- **Queries on indexes:** equal, greater, less, ranges, and for strings starts with and ends with, in ascending or descending order. See [Indexing](/database/indexing).
- **Loose match:** find strings while ignoring case, accents, spaces and punctuation, or by Korean initials.
- **Tags and unique ids:** label records and find them by label, or give a record your own id. See [Tags](/database/tags) and [Unique ID](/database/unique-id).
- **References:** point records at other records, such as comments at a post, and list everything that points to a record. See [Referencing](/database/referencing).
- **Access levels, private records and grants:** set on each record by its writer. See [Access levels](/database/access-levels).
- **Subscriptions, feeds and live notifications:** follow other users and get their new records. See [Subscriptions and feed](/database/subscription).
- **Agent keys:** give an AI agent or a script limited access without sharing a password. See [Agent keys](/users/agent-keys).
- **Client-side encryption:** keep data secret even from the admin. See [Client-side encryption](/users/encryption).
- **Listings:** the collections, tags, indexes and unique ids in use, with counts.
- **Backups, export and import** while the server runs. See [Operations](/admin/operations#backup-and-restore).
