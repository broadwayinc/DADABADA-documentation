# API Reference: Connection

This page covers what every method shares: how a call is made, trusting the certificate, calls from a browser, the three session methods (`login`, `logout`, `whoami`), the error envelope, the failed-login slowdown and paging. DADABADA is called with HTTPS requests that carry a JSON body, so any language with an HTTP client can use it; there is no client library.

## Calling

| part | rule |
|---|---|
| URL | `POST http://<server address>:<port>/v1/<method>` (`https://` when HTTPS is served, by a load balancer in front of DADABADA or by DADABADA itself with `--tls`), for example `POST http://localhost:7070/v1/postRecord`. `<method>` is the method name, written as in this reference. The port is the `port` setting: `7070` unless `ddbd init --port` chose another. |
| Body | One JSON object. An empty body counts as `{}`. Send `Content-Type: application/json`; it is good practice but not required, because the body is read as JSON either way. A body that is not valid JSON answers `400 INVALID_REQUEST` `"The body is not valid JSON: <reason>"`. |
| Token | `Authorization: Bearer <token>` on every call except [`login`](#login), with `<token>` (angle brackets included) replaced by a session token `s_...` from `login` or an agent key `dk_...`: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. An agent key is sent the same way and needs no login. Only [`listen`](/api-reference/database#listen) also takes the token as `?token=<token>` in the URL, for a browser `EventSource`; on every other call `?token=` is ignored, and a call without the header answers `401 UNAUTHORIZED` `"Sign in first: send Authorization: Bearer <session token or agent key>."` |
| Unknown keys | [`postRecord`](/api-reference/database#postrecord) and [`postRecords`](/api-reference/database#postrecords) refuse unknown keys in `config`, `config.collection` and `config.source`; [`getRecords`](/api-reference/database#getrecords) refuses them in `query` and `query.index`. The answer is `400 INVALID_REQUEST` `"Unknown <object> key \"<key>\". Allowed: ..."`. The methods whose body is `{query, fetch}` ([`getRecords`](/api-reference/database#getrecords), [`getCollections`](/api-reference/database#getcollections), [`getTags`](/api-reference/database#gettags), [`getIndexes`](/api-reference/database#getindexes), [`getUniqueId`](/api-reference/database#getuniqueid), [`getFeed`](/api-reference/database#getfeed)) refuse any key at the top of the body other than `query` and `fetch`: `400 INVALID_REQUEST` `"Unknown key \"<key>\". The body is {\"query\": {...}, \"fetch\": {...}}; query fields go inside query."`. Other methods ignore keys they do not use. |
| Body size | Request bodies have no size limit. |
| Answers | JSON with status 200, or an error envelope with its status (see [Errors](#errors)). |
| GET | `GET /v1/listen` is the only GET method (see [`listen`](/api-reference/database#listen)). `GET /v1` answers `{name, version}`. `GET /` serves the web admin. Any HTTP method other than POST on `/v1/<method>` answers `405 METHOD` `"Use POST for /v1/<method>."`. A path outside `/v1/` answers `404 NOT_FOUND`. |
| Plain HTTP when TLS is on | A plain `http://` request is refused, never redirected, and not run. GET and HEAD get `400` with the text `This server only speaks HTTPS. Open https://<server address><path> instead.` Any other method gets `400 USE_HTTPS` naming the `https://` address. See [Operations](/admin/operations#plain-http-on-a-tls-port). |
| Certificate | With `--tls`, `init` makes a self-signed certificate and prints its SHA-256 fingerprint; without it, the server speaks plain HTTP and there is no certificate. See [Trusting the certificate](#trusting-the-certificate). |
| Browsers | Only pages that DADABADA serves itself can call it from a browser. See [Calling from a browser](#calling-from-a-browser). |

A complete call, reading one page of a collection:

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"collection": "products"}, "fetch": {"limit": 2}}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: { collection: 'products' }, fetch: { limit: 2 } })
});
const page = await res.json();
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getRecords',
    data=json.dumps({'query': {'collection': 'products'}, 'fetch': {'limit': 2}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'},
    method='POST')
page = json.load(urllib.request.urlopen(req))
```

```text [User shell]
alice> get products --limit 2
```

:::

```json
// Response
{
  "list": [ { "record_id": "VZOat4azQj6RBGAq", "...": "..." }, { "record_id": "VZOat4bWCVbRBGAq", "...": "..." } ],
  "start_key": "clZaT2F0NGJXQ1ZiUkJHQXE",
  "end_of_list": false
}
```

`list` holds [Record](/api-reference/data-types#record) objects; the page shape is described under [Paging](#paging).

## Trusting the certificate

This applies when DADABADA serves HTTPS itself (`init --tls`, or `tls = true`). `init --tls` makes a self-signed certificate and prints its SHA-256 fingerprint; `start` prints it again. The certificate covers the names `localhost`, `127.0.0.1` and the machine's host name (from `/etc/hostname`), so a client that checks it must connect with one of those names. Choose one of:

- **Pin the certificate file.** Copy `<data folder>/tls/cert.pem` to the client and trust it as the CA: `curl --cacert cert.pem`, `verify="cert.pem"` in Python requests, the `ca` option of Node's `https.Agent`.
- **Use a certificate from a public certificate authority.** Set `tls_cert` and `tls_key` in the [settings](/admin/settings) to its PEM files and restart; clients then trust it with no extra step.
- **Skip the check, for a quick test only:** `curl -k` (`verify=False` in Python requests). Never in production: a wrong server could read your passwords.

## Calling from a browser

Pages that DADABADA serves itself (the [Web Admin](/admin/web-admin)) call `/v1/...` directly. A page from any other site cannot call DADABADA from the browser: DADABADA sends no cross-origin (CORS) headers and answers the browser's `OPTIONS` preflight with `405`. Call it from your own server instead, or serve your page and DADABADA from the same origin through a proxy (see [Behind a TLS proxy](/admin/operations#behind-a-tls-proxy)).

## login

`POST /v1/login` · no token

```ts
// Request body
{
    username: string; // Required. The username the admin gave the account.
    password: string; // Required. Sent in the clear inside the TLS connection; never use plain HTTP across the internet.
}
```

```ts
// Response
{
    token: string; // The session token. Starts with "s_". Send it as "Authorization: Bearer <token>" on every other call.
    user: User;    // The account. See Data Types.
}
```

See [User](/api-reference/data-types#user)

A session ends after `session_idle_hours` (default 24) without use, on [`logout`](#logout), or when the user is deleted. Sessions survive a server restart. A wrong password counts toward the [failed-login slowdown](#failed-login-slowdown).

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/login \
    -H "Content-Type: application/json" \
    -d '{"username": "alice", "password": "correct-horse"}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({"username": "alice", "password": "correct-horse"})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/login',
    data=json.dumps({"username": "alice", "password": "correct-horse"}).encode(),
    headers={'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
$ ddbd connect localhost:7070 --user alice
Password: correct-horse
Signed in as alice (level 10).
```

:::

#### Errors
```ts
{
    code: "UNAUTHORIZED";
    // The username does not exist or the password is wrong. The two cases answer the same text.
    message: "Wrong username or password.";
}
|
{
    code: "TOO_MANY_ATTEMPTS"; // status 429
    // The failed-login slowdown is running for this username or this address.
    // Answered before the password is checked, so a correct password gets it too while the wait lasts.
    message: "Too many failed sign-ins for this username or address. Try again in <number> seconds."; // "in 1 second." when the number is 1.
}
```

A missing `username` or `password`, or one that is not a string, is read as an empty string: the answer is `UNAUTHORIZED` `"Wrong username or password."` and it counts as a failed login. Other keys in the body are ignored.

## logout

`POST /v1/logout` · needs: session token

```ts
// Request body
{}
```

```ts
// Response
{
    message: "Signed out.";
}
```

Ends the session of the token sent. The token answers `401 UNAUTHORIZED` from then on. An agent key has no session to end: `logout` with a key answers `"Signed out."` and the key keeps working. Revoke it with [`revokeAgentKey`](/api-reference/agent-keys#revokeagentkey) instead.

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/logout \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/logout',
    data=json.dumps({}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> logout
```

:::

#### Errors
```ts
{
    code: "UNAUTHORIZED";
    message: "Sign in first: send Authorization: Bearer <session token or agent key>." | "Your session ended or is unknown; sign in again.";
}
```

## whoami

`POST /v1/whoami` · needs: session token or agent key

```ts
// Request body
{}
```

```ts
// Response
{
    user_id: string;      // Account id. Records carry it as user_id.
    username: string;
    access_level: string; // "00" to "99". The account's own level, set by the admin.
    records: number;      // How many records the account has saved. Counters follow changes a moment later.
    subscribers: number;  // How many users subscribe to this account.
    subscribed: number;   // How many users this account subscribes to.
    created: number;      // When the admin added the account, in ms.
    effective_access_level: string; // The level this call works at: access_level, or the agent key's max_level when that is lower.
    enc_salt: string;     // Hex, fixed per account. For client-side encryption: derive a key on your machine with argon2id(password, enc_salt) and the kdf settings below. The server never sees the key.
    kdf: {
        alg: "argon2id";
        m: 65536;         // memory, KiB
        t: 3;             // iterations
        p: 1;             // parallelism
    };
    agent?: AgentKey;     // Present only when the call was made with an agent key: that key's shape, without the key itself.
}
```

See [User](/api-reference/data-types#user)

See [AgentKey](/api-reference/data-types#agentkey)

```json
// Response for a password session
{
  "access_level": "00",
  "created": 1793235375619,
  "effective_access_level": "00",
  "enc_salt": "7bc69823adbeddb106fa52e274983560",
  "kdf": { "alg": "argon2id", "m": 65536, "p": 1, "t": 3 },
  "records": 1,
  "subscribed": 0,
  "subscribers": 0,
  "user_id": "Vv4JM09T",
  "username": "carol"
}
```

::: tip
DADABADA does not encrypt records. `enc_salt` is stored on the server so that the same password gives the same key on every device, and that is the whole of the server's part. A lost password means a lost key.
:::

#### Example

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/whoami \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{}'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/whoami', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/whoami',
    data=json.dumps({}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> whoami
```

:::

#### Errors
```ts
{
    code: "UNAUTHORIZED";
    message: "Sign in first: send Authorization: Bearer <session token or agent key>." | "Your session ended or is unknown; sign in again." | "This agent key is unknown, revoked or expired." | "This account no longer exists.";
}
```

## Errors

Every error answers one envelope with an HTTP status:

```ts
{
    error: {
        code: string;    // One of the codes below.
        message: string; // What went wrong, in plain words. Ids and names are written into it, for example "Record VZOat4ixBwfABGAq is read-only; only the admin can change it."
    }
}
```

| status | code | when |
|---|---|---|
| 400 | `INVALID_REQUEST` | body not valid JSON, bad or missing field, unknown key, bad name or value |
| 400 | `INDEX_LIMIT` | more indexes than the server's `max_indexes` |
| 400 | `TAG_LIMIT` | more tags than the server's `max_tags` |
| 400 | `REFERENCE_LIMIT` | the target's `referencing_limit` is reached, or `prevent_multiple_referencing` refused a second reference by the same user |
| 400 | `REFERENCE_RESTRICTED` | the target's `referencing_index_restrictions` are not met |
| 400 | `USE_HTTPS` | a plain `http://` request (other than GET or HEAD) to a server with TLS on; the request was not run |
| 401 | `UNAUTHORIZED` | no token, unknown or expired session, revoked or expired agent key, wrong password |
| 403 | `NO_ACCESS` | not allowed: level, owner, read-only, agent key limits, private |
| 404 | `NOT_FOUND` | record, user, agent key, method or path does not exist |
| 405 | `METHOD` | an HTTP method other than POST on `/v1/<method>` |
| 409 | `EXISTS` | unique id, username or record already exists |
| 429 | `TOO_MANY_ATTEMPTS` | the failed-login slowdown is running |
| 500 | `INTERNAL` | storage or file error |

The three `UNAUTHORIZED` messages every method can answer:

```ts
{
    code: "UNAUTHORIZED";
    // No Authorization header, or no bearer token in it.
    message: "Sign in first: send Authorization: Bearer <session token or agent key>.";
}
|
{
    code: "UNAUTHORIZED";
    // A session token that was logged out, idle for longer than session_idle_hours, or never issued.
    message: "Your session ended or is unknown; sign in again.";
}
|
{
    code: "UNAUTHORIZED";
    // An agent key that was revoked, passed its expires time, or never issued.
    message: "This agent key is unknown, revoked or expired.";
}
```

::: warning
A method that saves several things at once ([`postRecords`](/api-reference/database#postrecords), [`deleteRecords`](/api-reference/database#deleterecords)) answers status 200 and lists the items that failed inside the body, each with its own `code` and `message`. Check `failed` on those answers, not only the status.
:::

## Failed-login slowdown

After `login_free_attempts` (default 5) failed logins for a username or for an address, each further try must wait: 1 second, then doubling up to `login_max_delay` (default 15 minutes). A try inside the wait answers `429 TOO_MANY_ATTEMPTS` before the password is checked. A successful login clears the count. Counts reset when the server restarts. The web admin's sign-in uses the same rule.

## Paging

Every listing method takes an optional `fetch` object next to its `query`:

```ts
// fetch
{
    limit?: number;      // 1 to 1000. Default 50. Page size.
    ascending?: boolean; // Default true. getFeed defaults to false (newest first). getSubscriptions always lists in ascending order. A value that is not a boolean is ignored.
    start_key?: string;  // The start_key of the previous page. "end" or null means from the start. A string DADABADA did not give out answers "fetch.start_key is not one DADABADA gave out."
}
```

and answers a page:

```ts
// Page<T>
{
    list: T[];            // At most limit items.
    start_key: string;    // Pass it back as fetch.start_key for the next page. "end" when end_of_list is true.
    end_of_list: boolean; // true on the last page.
}
```

See [Page](/api-reference/data-types#page)

Keep paging until `end_of_list` is `true`. A page can hold fewer than `limit` items before the end: [`getFeed`](/api-reference/database#getfeed) skips feed entries you can no longer read, so `end_of_list` is the only sign that nothing is left. `start_key` is opaque; send it back as it came.

The methods that page: [`getRecords`](/api-reference/database#getrecords), [`deleteRecords`](/api-reference/database#deleterecords) by query, [`getCollections`](/api-reference/database#getcollections), [`getTags`](/api-reference/database#gettags), [`getIndexes`](/api-reference/database#getindexes), [`getUniqueId`](/api-reference/database#getuniqueid), [`getSubscriptions`](/api-reference/database#getsubscriptions) and [`getFeed`](/api-reference/database#getfeed). [`listPrivateRecordAccess`](/api-reference/database#listprivaterecordaccess) and [`listAgentKeys`](/api-reference/agent-keys#listagentkeys) answer a plain `{list}` without paging.
