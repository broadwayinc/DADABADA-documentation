# Client-Side Encryption

This page shows how to encrypt a record's `data` on the client with a key derived from the user's password. DADABADA stores the `data` of a record as plain JSON and never encrypts it: the admin, a backup and an export all contain the data in the clear. When a record holds something only its owner should read, encrypt the data on the client before [`postRecord`](/api-reference/database#postrecord) and decrypt it after [`getRecords`](/api-reference/database#getrecords). The server keeps a salt for each account and tells the client which key-derivation settings to use, so every device the user signs in on derives the same key.

## Where the key comes from

[`whoami`](/api-reference/connection#whoami) returns two values made for this:

| field | description |
|---|---|
| `enc_salt` | 32 hex characters (16 random bytes), made when the account is added and stored on the server |
| `kdf` | the key-derivation settings that go with it: `{"alg": "argon2id", "m": 65536, "t": 3, "p": 1}` |

```json
// Response of whoami (the two fields that matter here)
{
  "enc_salt": "7bc69823adbeddb106fa52e274983560",
  "kdf": {
    "alg": "argon2id",
    "m": 65536,
    "p": 1,
    "t": 3
  },
  "user_id": "Vv4JM09T",
  "username": "carol"
}
```

The key is `argon2id(password, enc_salt)` with those settings: memory `m` in KiB (65536 = 64 MiB), `t` passes, `p` lanes. The password is the one the user signs in with. Because the salt lives on the server and the password lives in the user's head, every device that signs in derives the same key, and nothing has to be copied between devices.

| | |
|---|---|
| the server stores | `enc_salt`, the password hash, the encrypted data |
| the server never stores | the password in the clear, the derived key, the plain data |
| a lost password means | a lost key. There is no reset: the admin can only delete the account and add it again, and the old data cannot be decrypted (see [Login and Sessions](/users/login#lost-password)) |

::: danger Index values and tags are not encrypted
Indexes, tags and unique ids are what the database searches and sorts, so they are stored and compared in the clear, and anyone who can read the record sees them. Put secrets only in `data`. An index on an encrypted field is not possible; index a value that may be seen (a date, a category, a hash you compute on the client) and keep the rest in `data`.
:::

## Deriving the key

Argon2id is not part of the browser's WebCrypto API or of most standard libraries. Use an Argon2 implementation for your platform; what matters is that it takes the same parameters from `kdf` and produces 32 bytes.

```js
// password: the user's password, as typed at login
// enc_salt, kdf: from whoami
async function deriveKey(password, enc_salt, kdf) {
  const salt = Uint8Array.from(enc_salt.match(/../g), (h) => parseInt(h, 16));
  // argon2id(...) is an Argon2 implementation for your platform.
  // Pass kdf.m (KiB), kdf.t (passes), kdf.p (lanes) and ask for 32 bytes.
  const raw = await argon2id(password, salt, { memory: kdf.m, passes: kdf.t, parallelism: kdf.p, length: 32 });
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
```

Derive the key once after login and keep it in memory. Do not store the password, and do not store the derived key where another page or program can read it.

## Encrypting before postRecord

AES-GCM with a fresh 12-byte IV per record. The IV and the ciphertext are saved together in `data`, encoded as base64 so they are plain JSON strings.

```js
const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function encrypt(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return { iv: toB64(iv), ct: toB64(ct) };
}

async function decrypt(key, enc) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(enc.iv) }, key, fromB64(enc.ct)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}
```

The record below keeps its searchable parts in the clear (`kind` as an index, `2026` as a tag) and the secret in `data`.

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data": {"enc": {"iv": "base64 iv", "ct": "base64 ciphertext"}}, "config": {"collection": "diary", "index": [{"name": "kind", "value": "entry"}], "tags": ["2026"]}}'
```

```js [JavaScript]
const enc = await encrypt(key, { text: "my secret entry", mood: 7 });
const res = await fetch("http://localhost:7070/v1/postRecord", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    data: { enc },
    config: { collection: "diary", index: [{ name: "kind", value: "entry" }], tags: ["2026"] }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

# enc = {"iv": "<base64 iv>", "ct": "<base64 ciphertext>"} made with argon2id + AES-GCM on this machine
body = {
    "data": {"enc": enc},
    "config": {"collection": "diary", "index": [{"name": "kind", "value": "entry"}], "tags": ["2026"]},
}
req = urllib.request.Request(
    "http://localhost:7070/v1/postRecord",
    data=json.dumps(body).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
carol> post diary --index kind=entry --tags 2026 --data '{"enc":{"iv":"base64 iv","ct":"base64 ciphertext"}}'
```

:::

```json
// Response (fields at their default are left out)
{
  "collection": {
    "access_level": "00",
    "name": "diary"
  },
  "data": {
    "enc": {
      "ct": "base64 ciphertext",
      "iv": "base64 iv"
    }
  },
  "index": [
    { "name": "kind", "value": "entry" }
  ],
  "record_id": "...",
  "tags": [
    "2026"
  ],
  "user_id": "Vv4JM09T"
}
```

The server stored `data` unchanged in content: it holds the IV and the ciphertext, and the plain text never left the client.

## Decrypting after getRecords

Query as usual, by index or tag, and decrypt `data.enc` of every record on the client.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"collection": "diary", "tag": "2026"}}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/getRecords", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: { collection: "diary", tag: "2026" } })
});
const page = await res.json();
for (const rec of page.list) {
  rec.data = await decrypt(key, rec.data.enc); // { text: "my secret entry", mood: 7 }
}
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/getRecords",
    data=json.dumps({"query": {"collection": "diary", "tag": "2026"}}).encode(),
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    page = json.load(r)
for rec in page["list"]:
    rec["data"] = decrypt(key, rec["data"]["enc"])  # AES-GCM decrypt on this machine
```

```text [User shell]
carol> get diary --tag 2026
```

:::

```json
// Response (fields at their default are left out)
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "00",
        "name": "diary"
      },
      "data": {
        "enc": {
          "ct": "base64 ciphertext",
          "iv": "base64 iv"
        }
      },
      "index": [
        { "name": "kind", "value": "entry" }
      ],
      "record_id": "...",
      "tags": [
        "2026"
      ],
      "user_id": "Vv4JM09T"
    }
  ],
  "start_key": "end"
}
```

## Good to know

- The same key works on every device because `enc_salt` is per account and never changes. An export (see [Operations](/admin/operations#export-file-format)) carries `enc_salt` with each user, so data stays decryptable after an import.
- A record is readable by every user its access level allows (see [Access levels](/database/access-levels)), but only someone with the derived key can decrypt its `data`. Sharing an encrypted record with another user means sharing the key out of band; DADABADA has no key exchange.
- An [agent key](/users/agent-keys) gets `enc_salt` and `kdf` from `whoami` like a session does, but it has no password, so an agent cannot derive the key on its own. Give the agent the derived key, or keep encrypted collections away from agents with `collections`.
- `data` has no size limit and can be any JSON, so the encrypted object can hold anything the plain object held.
- Records saved by the [Web Admin](/admin/web-admin) or brought in by an import are stored in the clear, like any other record; encrypt before the data reaches the server.
