# API Reference: Agent Keys

An agent key lets an agent or a script call the API as you without your password, and can be revoked on its own. A password session creates it; the key is shown once and sent as a bearer token. It can be capped at a level, made read-only, kept away from private records, limited to some collections and given an expiry. Records it writes carry its name in `agent`.

## Sending a key

A key is sent exactly like a session token, on every call, with no `login` first:

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"collection": "products"}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: { collection: 'products' } })
});
const page = await res.json();
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'collection': 'products'}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'},
    method='POST')
page = json.load(urllib.request.urlopen(req))
```

```text [User shell]
$ dadabada connect localhost:7070 --key <agent key>
alice/shop-bot> get products
```

:::

where `<token>` (in curl) and `TOKEN` (in JavaScript and Python) are the `dk_...` key. The answer is a page of records, as for a session token. `GET /v1/listen` takes a key the same way, in the header or as `?token=<token>` (the one method where `?token=` works). With a key, the stream carries only notifications about records the key itself can read (its collections, `max_level` and `private` apply).

What a key may not do, whatever its settings:

| action | answer |
|---|---|
| `createAgentKey`, `listAgentKeys`, `revokeAgentKey` | `403 NO_ACCESS` `"Agent keys are made by a user signed in with a password."`, `"An agent key cannot list agent keys."` and `"An agent key cannot revoke agent keys."` Keys cannot make, list or revoke keys. |
| read or write above `max_level` | Records of other users above the cap are not readable unless granted to the user or pointing to their record, queries scan only the levels up to the cap, and a post above it is refused: `"You can post at access levels up to <max level> (or ** for private); <access level> is above that."` |
| any write with `read_only` | `403 NO_ACCESS` `"This agent key is read-only."` Posting, deleting, grants and subscription changes are all writes. |
| touch `**` records without `private` | Private records are not readable, your own included. A post at `**` answers `403 NO_ACCESS` `"This agent key cannot use private (**) records."`, and a query with `access_level: "**"` answers `"This agent key cannot read private (**) records."` |
| a collection outside `collections` | `403 NO_ACCESS` `"This agent key is not allowed to use the collection \"<name>\"."` Queries, posts, updates, deletes, grants, `getTags` and `getIndexes` alike; `getCollections` and `getUniqueId` list only the allowed ones. |
| anything after `expires` or a revoke | `401 UNAUTHORIZED` `"This agent key is unknown, revoked or expired."` |

[`whoami`](/api-reference/connection#whoami) called with a key answers your account plus `agent` (the key's shape) and `effective_access_level` (the lower of your level and `max_level`). `logout` with a key answers `"Signed out."` and the key keeps working; revoke it instead.

## createAgentKey

`POST /v1/createAgentKey` · needs: session token (a password session; an agent key is refused)

```ts
// Request body
{
    name: string;                  // Required. 1 to 256 characters, no control characters. Shown with the key's `key_id` as `agent` on every record the key writes, and in the server log as username/name.
    max_level?: string;            // "00" to "99" (exactly two digits). Numbers, one-digit strings and "**" are refused. Default: none, so the key works at your level. The key reads and writes at most this level, and never above yours.
    read_only?: boolean;           // Default false. true refuses every write: posting, deleting, grants, subscription changes.
    private?: boolean;             // Default false. true allows "**" records: reading the ones you own or were granted, and posting at "**".
    collections?: string | string[]; // Default: all. Only these collections, for queries, posts and listings. Each name 1 to 256 characters.
    expires?: string | number;     // Default: never. A duration string counted from now ("30d", "12h", "90m"; units ms, s, m, h, d, w and no others; a string of digits alone is seconds), or a number: a time in ms.
}
```

```ts
// Response
{
    key_id: string;              // Short id for listAgentKeys and revokeAgentKey.
    user_id: string;             // Your user id.
    name: string;
    max_level: string | null;    // Two digits, or null for no cap.
    read_only: boolean;
    private: boolean;
    collections: string[];       // The allowed collections; [] for all.
    expires: number | null;      // Time in ms, or null for never.
    created: number;             // Time in ms.
    key: string;                 // The key itself, "dk_...". SHOWN ONLY ONCE: it is never returned again, not by listAgentKeys, whoami or revokeAgentKey.
}
```

See [AgentKey](/api-reference/data-types#agentkey)

```json
// Response
{
  "collections": ["products"],
  "created": 1793235385408,
  "expires": 1795827385408,
  "key": "dk_f5ZFdLo3hoeb7RS16Jc9VqWul9F1tTYu2jIuXUGYq2m",
  "key_id": "mtxBMs",
  "max_level": "05",
  "name": "shop-bot",
  "private": false,
  "read_only": true,
  "user_id": "JFeCedoO"
}
```

::: danger
Store `key` where the agent will read it the moment this answer arrives. The server keeps only a hash of it. A lost key is replaced by revoking it and creating another.
:::

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/createAgentKey \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "shop-bot",
      "max_level": "05",
      "read_only": true,
      "collections": [
        "products"
      ],
      "expires": "30d"
    }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/createAgentKey', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "name": "shop-bot",
    "max_level": "05",
    "read_only": true,
    "collections": [
      "products"
    ],
    "expires": "30d"
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/createAgentKey',
    data=json.dumps({
        "name": "shop-bot",
        "max_level": "05",
        "read_only": True,
        "collections": [
            "products"
        ],
        "expires": "30d"
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> agent create shop-bot --level 05 --read-only --collections products --expires 30d
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // The call was made with an agent key.
    message: "Agent keys are made by a user signed in with a password.";
}
|
{
    code: "INVALID_REQUEST";
    // name missing or outside its length rule, max_level not a two-digit string "00" to "99", a bad duration (units ms, s, m, h, d, w only) or time in expires,
    // read_only or private not a boolean, collections not a string or list of strings. Unknown keys are ignored.
    message: "\"name\" is required." | "The agent key name is empty." | "The agent key name is <number> characters long; the most is 256." | "max_level must be \"00\" to \"99\"." | "expires must be like 30m, 12h, 30d, or a time in ms." | "expires must be like 30d or a time in ms." | "\"read_only\" must be true or false." | "\"private\" must be true or false." | "collection must be a string or a list of strings." | "Every collection must be a string.";
}
```

## listAgentKeys

`POST /v1/listAgentKeys` · needs: session token (a password session; an agent key is refused)

```ts
// Request body
{}
```

```ts
// Response
{
    list: AgentKey[]; // Your keys, without the keys themselves. Not paged.
}
```

See [AgentKey](/api-reference/data-types#agentkey)

The admin lists every user's keys with `dadabada admin agents`.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/listAgentKeys \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/listAgentKeys', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listAgentKeys',
    data=json.dumps({}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> agent list
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // The call was made with an agent key.
    message: "An agent key cannot list agent keys.";
}
```

## revokeAgentKey

`POST /v1/revokeAgentKey` · needs: session token (a password session; an agent key is refused)

```ts
// Request body
{
    key_id: string; // Required. From createAgentKey or listAgentKeys. One of your own keys.
}
```

```ts
// Response
AgentKey // The revoked key's shape, without the key itself. From now on the key answers 401 UNAUTHORIZED.
```

See [AgentKey](/api-reference/data-types#agentkey)

Keys are revoked one at a time. Records the key wrote keep `agent: "<name>"`. The admin can revoke any user's key with `dadabada admin agent revoke <key id>`, and deleting a user removes their keys.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/revokeAgentKey \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"key_id": "MqNpti"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/revokeAgentKey', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({"key_id": "MqNpti"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/revokeAgentKey',
    data=json.dumps({"key_id": "MqNpti"}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> agent revoke MqNpti
Revoked agent key MqNpti.
```

:::

#### Errors
```ts
{
    code: "NO_ACCESS";
    // The call was made with an agent key, or key_id belongs to another user.
    message: "An agent key cannot revoke agent keys." | "You can only revoke your own agent keys.";
}
|
{
    code: "INVALID_REQUEST";
    // key_id missing or not a string.
    message: "\"key_id\" is required.";
}
|
{
    code: "NOT_FOUND";
    // No key has this key_id, or it was already revoked.
    message: "There is no agent key <key id>.";
}
```
