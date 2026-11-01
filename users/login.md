# Login and Sessions

This page covers signing in, sending the session token, how long a session lasts, `whoami`, `logout`, the failed-login slowdown and lost passwords.

Every request to DADABADA needs an account, and there is no sign-up: the admin adds each user on the server, with `user add` in the [Admin Shell](/admin/admin-shell#users) or on the Users page of the [Web Admin](/admin/web-admin), and chooses the username, the password and the access level. The user signs in with [`login`](/api-reference/connection#login), gets a session token, and sends that token on every other call.

Agents and scripts should not sign in with a password at all. Give them an [agent key](/users/agent-keys) instead: it is sent the same way as a session token and needs no login.

## Login

`login` is the only method that works without a token. Send the username and the password.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "carol", "password": "carolpw"}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "carol", password: "carolpw" })
});
const { token, user } = await res.json();
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/login",
    data=json.dumps({"username": "carol", "password": "carolpw"}).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    answer = json.load(r)
token, user = answer["token"], answer["user"]
```

```text [User shell]
$ dadabada connect localhost:7070 --user carol
Password: carolpw
Signed in as carol (level 00).
```

:::

```json
// Response
{
  "token": "s_IgWEEJnw3WRrqjy1EJSaQoEFlAMB3ctx4PQlTMObcw2",
  "user": {
    "access_level": "00",
    "created": 1793235375619,
    "records": 1,
    "subscribed": 0,
    "subscribers": 0,
    "user_id": "Vv4JM09T",
    "username": "carol"
  }
}
```

In the **User shell** tab, opening the [user shell](/admin/user-shell) is the sign-in: it sends this same `login` request, keeps the token, and sends it with every command typed at the `carol>` prompt.

```ts
// login body
{
    username: string; // Required. The username the admin gave the account.
    password: string; // Required. The account's password.
}
```

The answer has two parts:

| field | description |
|---|---|
| `token` | the session token. It always starts with `s_`. Keep it on the client and send it on every other call |
| `user` | the account: `user_id`, `username`, `access_level`, `records`, `subscribers`, `subscribed` and `created` (ms) |

A wrong username or password answers `401 UNAUTHORIZED`, and so does a missing or non-string `username` or `password`:

```json
// Response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wrong username or password."
  }
}
```

::: tip The self-signed certificate
A server set up with `init --tls` uses a self-signed TLS certificate. Have your client trust that certificate (its fingerprint is the one `start` prints), or use `curl -k` for a quick test. See [Trusting the certificate](/api-reference/connection#trusting-the-certificate), which also covers using a certificate from a public certificate authority.
:::

## Sending the token

Every other call carries the token in the header `Authorization: Bearer <token>`, with `<token>` replaced by the whole `s_...` string (`bearer` in lower case works too). The token as `?token=<token>` in the address works only on `GET /v1/listen`, for a browser `EventSource`, which cannot set headers. On any other call `?token=` is ignored, and a call without the header answers `401 UNAUTHORIZED` `Sign in first: send Authorization: Bearer <session token or agent key>.` Here [`whoami`](/api-reference/connection#whoami) is called with the token from the login above.

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/whoami \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/whoami", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: "{}"
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/whoami",
    data=b"{}",
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
carol> whoami
```

:::

```json
// Response
{
  "access_level": "00",
  "created": 1793235375619,
  "effective_access_level": "00",
  "enc_salt": "7bc69823adbeddb106fa52e274983560",
  "kdf": {
    "alg": "argon2id",
    "m": 65536,
    "p": 1,
    "t": 3
  },
  "records": 1,
  "subscribed": 0,
  "subscribers": 0,
  "user_id": "Vv4JM09T",
  "username": "carol"
}
```

A call without a token answers `401 UNAUTHORIZED`:

```json
// Response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in first: send Authorization: Bearer <session token or agent key>."
  }
}
```

An agent key (`dk_...`) goes in the same header and needs no login. See [Agent Keys](/users/agent-keys).

## Sessions

A session lives as long as it is used. It ends:

| when | what happens |
|---|---|
| after `session_idle_hours` without a request (default 24 hours, at least 1) | the token stops working |
| on [`logout`](/api-reference/connection#logout) | the token of that call stops working |
| when the admin deletes the user | every session of that user ends |

Sessions are stored in the database and survive a server restart, so a client does not have to sign in again after the server is stopped and started. The idle time is a server setting; a change made on the Web Admin's Settings page applies at once. See [Settings](/admin/settings).

A token that has ended answers `401 UNAUTHORIZED`. Sign in again and retry the request:

```json
// Response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Your session ended or is unknown; sign in again."
  }
}
```

::: tip
Treat every `401 UNAUTHORIZED` the same way: call `login` again, store the new token, and repeat the request that failed.
:::

## whoami

[`whoami`](/api-reference/connection#whoami) returns the account behind the token, plus the values a client needs for client-side encryption. The body is `{}`. The request and its answer are shown above under [Sending the token](#sending-the-token).

| field | description |
|---|---|
| `user_id`, `username`, `access_level`, `records`, `subscribers`, `subscribed`, `created` | the user shape, as returned by `login` |
| `effective_access_level` | the level this token can use. With a session token it is the user's level. With an agent key it is the key's `max_level` when the key has one, otherwise the user's level |
| `enc_salt` | 32 hex characters (16 random bytes), made when the account is added and never changed. Used to derive a client-side encryption key; see [Client-Side Encryption](/users/encryption) |
| `kdf` | the key-derivation settings that go with `enc_salt`: `{"alg": "argon2id", "m": 65536, "t": 3, "p": 1}` |
| `agent` | only when called with an agent key: the key's shape (`key_id`, `user_id`, `name`, `max_level`, `read_only`, `private`, `collections`, `expires`, `created`) |

## Logout

[`logout`](/api-reference/connection#logout) ends the session of the token sent. The body is `{}`.

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/logout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```js [JavaScript]
const res = await fetch("http://localhost:7070/v1/logout", {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: "{}"
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    "http://localhost:7070/v1/logout",
    data=b"{}",
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

```text [User shell]
carol> logout
```

:::

```json
// Response
{
  "message": "Signed out."
}
```

In the user shell, `logout` (or `exit`, or `quit`) sends `logout` and closes the shell.

Only the token sent is ended. A user signed in on two devices stays signed in on the other one. Using the ended token again answers `Your session ended or is unknown; sign in again.` (shown under [Sessions](#sessions)).

## Failed-login slowdown

DADABADA slows down password guessing. Failed sign-ins are counted per username and per client address, and the longer of the two waits applies. Web Admin sign-ins count toward the same per-address count.

| setting | default | meaning |
|---|---|---|
| `login_free_attempts` | `5` | failures allowed before the slowdown starts |
| `login_max_delay` | `"15m"` | the longest wait between attempts |

Once the free attempts are used up, the next try must wait 1 second after the last failure, and the wait doubles with every further failure, up to `login_max_delay`. A try made during the wait is refused with `429 TOO_MANY_ATTEMPTS` before the password is checked. A successful login clears the counts for that username and that address. Counts are kept in memory and reset when the server restarts. Behind a proxy every client has the proxy's address, so they all share one per-address count.

```json
// Response
{
  "error": {
    "code": "TOO_MANY_ATTEMPTS",
    "message": "Too many failed sign-ins for this username or address. Try again in <number> seconds."
  }
}
```

::: warning
A login form that retries on its own makes the wait longer with every attempt. Show the error to the user and let them try again later.
:::

## Lost password

There is no password reset. The password is set when the admin adds the account, and no command changes it afterwards. If a user loses the password, the admin deletes the account with `user del` and adds it again with `user add` (see [Admin Shell](/admin/admin-shell#users)). Deleting the account removes the user's records, grants, subscriptions, agent keys, feed and notifications; the new account starts empty.

::: danger
A lost password also means a lost encryption key when the client encrypts data (see [Client-Side Encryption](/users/encryption)). The key is derived from the password and the account's `enc_salt`, and neither can be recovered from the server.
:::
