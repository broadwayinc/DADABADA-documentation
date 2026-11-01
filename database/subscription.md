# Subscriptions, Feed and Notifications

A user can subscribe to another user and choose two things: whether to receive that user's **feed** records, and whether to receive their **notifications**. The user subscribed to can block a subscriber. A record's `collection.subscription` settings, set by the record's writer together with its access level, decide whether only subscribers can read it, whether it goes to their feed, and whether it notifies them. Notifications arrive live on an event stream.

## Subscribing

[`subscribe`](/api-reference/database#subscribe) subscribes you to a user. bob subscribes to alice (`JFeCedoO`) with feed and notifications:

::: info How to read the examples
`<token>` is your session token, the `s_...` string that [`login`](/users/login#login) answers (an [agent key](/users/agent-keys), `dk_...`, works the same way). Replace `<token>` including the angle brackets: `Authorization: Bearer s_a8OlV31qT85f0bQb6ndpDe97B09XOtVRCD5DxfQuNiz`. In the JavaScript and Python examples, `TOKEN` is a variable that holds the same string. The examples call `http://localhost:7070`, which works on the server itself with the default setup (plain HTTP). From another machine, use the HTTPS address that leads to your server, such as your load balancer's. If DADABADA serves HTTPS itself (set up with `--tls`), write `https://` and, while it uses its self-signed certificate, add `-k` to the curl commands ([why](/api-reference/connection#trusting-the-certificate)).
:::

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "JFeCedoO", "get_feed": true, "get_notified": true }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'JFeCedoO', get_feed: true, get_notified: true })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/subscribe',
    data=json.dumps({'user_id': 'JFeCedoO', 'get_feed': True, 'get_notified': True}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> subscribe JFeCedoO --feed --notify
Subscribed to JFeCedoO (feed true, notifications true).
```

:::

```json
// Response
{
  "blocked": false,
  "get_feed": true,
  "get_notified": true,
  "subscriber": "nRcziH7v",
  "subscription": "JFeCedoO",
  "timestamp": 1793235378879
}
```

```ts
// subscribe body
{
    user_id: string;        // Required. The user to subscribe to. Not yourself.
    get_feed?: boolean;     // Default: unchanged (a new subscription: false). Receive their feed records in getFeed.
    get_notified?: boolean; // Default: unchanged (a new subscription: false). Receive their notifications on listen.
}
```

See [`getFeed`](/api-reference/database#getfeed) and [`listen`](/api-reference/database#listen).

A `user_id` that does not exist answers `404 NOT_FOUND`: `User <id> does not exist.`

The answer is the subscription:

| field | description |
|---|---|
| `subscription` | the user subscribed to |
| `subscriber` | the user who subscribes |
| `get_feed`, `get_notified` | the two options |
| `blocked` | whether the subscribed-to user has blocked this subscriber |
| `timestamp` | when the subscription was made, in ms |

### Options left out keep their value

A new subscription starts with both options off. Calling `subscribe` again for the same user changes only the options you send. carol subscribes with feed only, then turns notifications on without mentioning the feed:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "JFeCedoO", "get_feed": true }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'JFeCedoO', get_feed: true })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/subscribe',
    data=json.dumps({'user_id': 'JFeCedoO', 'get_feed': True}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> raw subscribe '{"user_id": "JFeCedoO", "get_feed": true}'
```

:::

```json
// Response
{
  "blocked": false,
  "get_feed": true,
  "get_notified": false,
  "subscriber": "Vv4JM09T",
  "subscription": "JFeCedoO",
  "timestamp": 1793235378880
}
```

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "JFeCedoO", "get_notified": true }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'JFeCedoO', get_notified: true })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/subscribe',
    data=json.dumps({'user_id': 'JFeCedoO', 'get_notified': True}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> raw subscribe '{"user_id": "JFeCedoO", "get_notified": true}'
```

:::

```json
// Response
{
  "blocked": false,
  "get_feed": true,
  "get_notified": true,
  "subscriber": "Vv4JM09T",
  "subscription": "JFeCedoO",
  "timestamp": 1793235378880
}
```

`get_feed` stayed `true` and `timestamp` kept the time of the first call. To turn an option off, send it as `false`.

Subscribing to yourself is refused:

```json
// Response (400)
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "user_id cannot be your own."
  }
}
```

## Unsubscribing

[`unsubscribe`](/api-reference/database#unsubscribe) removes the subscription, both options with it:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/unsubscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "JFeCedoO" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/unsubscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'JFeCedoO' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/unsubscribe',
    data=json.dumps({'user_id': 'JFeCedoO'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
carol> unsubscribe JFeCedoO
Unsubscribed from JFeCedoO.
```

:::

```json
// Response
{
  "message": "Unsubscribed from JFeCedoO."
}
```

If you do not subscribe to that user, the answer is `404 NOT_FOUND`: `You do not subscribe to JFeCedoO.`

## Listing subscriptions

[`getSubscriptions`](/api-reference/database#getsubscriptions) lists subscriptions from either side. Give at least one of `subscriber` and `subscription` (otherwise `400 INVALID_REQUEST`: `Give subscriber, subscription, or both.`), and one of them must be you unless you are the admin (otherwise `403 NO_ACCESS`: `You can only list your own subscriptions and subscribers.`). The answer is a page of subscriptions, ordered by user id.

```ts
// getSubscriptions body
{
    subscriber?: string;   // Default: none. Whom this user subscribes to.
    subscription?: string; // Default: none. Who subscribes to this user.
    blocked?: boolean;     // Default: both. true: only blocked subscriptions; false: only unblocked.
    fetch?: { limit?: number; ascending?: boolean; start_key?: string }; // Default: limit 50. Paging.
}
```

Whom bob subscribes to:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getSubscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "subscriber": "nRcziH7v" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getSubscriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscriber: 'nRcziH7v' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getSubscriptions',
    data=json.dumps({'subscriber': 'nRcziH7v'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> subscriptions --subscriber nRcziH7v
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "blocked": false,
      "get_feed": true,
      "get_notified": true,
      "subscriber": "nRcziH7v",
      "subscription": "JFeCedoO",
      "timestamp": 1793235378879
    }
  ],
  "start_key": "end"
}
```

Who subscribes to alice:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getSubscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "subscription": "JFeCedoO" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getSubscriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscription: 'JFeCedoO' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getSubscriptions',
    data=json.dumps({'subscription': 'JFeCedoO'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> subscriptions --subscription JFeCedoO
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "blocked": false,
      "get_feed": true,
      "get_notified": true,
      "subscriber": "Vv4JM09T",
      "subscription": "JFeCedoO",
      "timestamp": 1793235378880
    },
    {
      "blocked": false,
      "get_feed": true,
      "get_notified": true,
      "subscriber": "nRcziH7v",
      "subscription": "JFeCedoO",
      "timestamp": 1793235378879
    }
  ],
  "start_key": "end"
}
```

Both ids together check one subscription: `{ "subscriber": "nRcziH7v", "subscription": "JFeCedoO" }` answers a one-item page if bob subscribes to alice. The counts are on the user shape too: `whoami` returns `subscribers` and `subscribed`.

## Blocking and unblocking subscribers

[`blockSubscriber`](/api-reference/database#blocksubscriber) and [`unblockSubscriber`](/api-reference/database#unblocksubscriber) take `{user_id}`, a user who subscribes to you, and answer the subscription. A block stays when the blocked user unsubscribes: if they subscribe again, they are still blocked. `unblockSubscriber` lifts it either way. For a user who does not subscribe to you the answer is `404 NOT_FOUND`: `User <id> does not subscribe to you.` A blocked subscriber gets none of your feed records or notifications and cannot read your subscription records. Their options are kept, so unblocking gives the subscription back as it was.

alice blocks carol:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/blockSubscriber \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "Vv4JM09T" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/blockSubscriber', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'Vv4JM09T' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/blockSubscriber',
    data=json.dumps({'user_id': 'Vv4JM09T'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> block Vv4JM09T
Blocked Vv4JM09T.
```

:::

```json
// Response
{
  "blocked": true,
  "get_feed": true,
  "get_notified": true,
  "subscriber": "Vv4JM09T",
  "subscription": "JFeCedoO",
  "timestamp": 1793235378880
}
```

Only the blocked ones, from alice's side:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getSubscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "subscription": "JFeCedoO", "blocked": true }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getSubscriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscription: 'JFeCedoO', blocked: true })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getSubscriptions',
    data=json.dumps({'subscription': 'JFeCedoO', 'blocked': True}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> raw getSubscriptions '{"subscription": "JFeCedoO", "blocked": true}'
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "blocked": true,
      "get_feed": true,
      "get_notified": true,
      "subscriber": "Vv4JM09T",
      "subscription": "JFeCedoO",
      "timestamp": 1793235378880
    }
  ],
  "start_key": "end"
}
```

Unblock:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/unblockSubscriber \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "Vv4JM09T" }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/unblockSubscriber', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'Vv4JM09T' })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/unblockSubscriber',
    data=json.dumps({'user_id': 'Vv4JM09T'}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> unblock Vv4JM09T
Unblocked Vv4JM09T.
```

:::

```json
// Response
{
  "blocked": false,
  "get_feed": true,
  "get_notified": true,
  "subscriber": "Vv4JM09T",
  "subscription": "JFeCedoO",
  "timestamp": 1793235378880
}
```

## The five subscription settings

A record's `config.collection.subscription` in [`postRecord`](/api-reference/database#postrecord) is an object of five booleans. Each one left out is `false`.

| setting | what it does |
|---|---|
| `is_subscription_record` | only the uploader and the uploader's subscribers who are not blocked can read the record; the record's access level applies as well. Queries find it only with `collection.subscription` set to the uploader's id; a lookup by `record_id` also works |
| `upload_to_feed` | when the record is created, it goes into the feed of the subscribers who chose `get_feed` and are not blocked |
| `notify_subscribers` | when the record is created with a `notification`, the subscribers who chose `get_notified` and are not blocked receive it live. Without `notification` nothing is sent |
| `feed_referencing_records` | when another user creates a record that points to this one, that record goes into **this record's uploader's** feed |
| `notify_referencing_records` | when another user creates a record that points to this one, **this record's uploader** is notified |

The first three are about the uploader's subscribers. The last two go the other way: they bring replies to the uploader of the record being replied to.

::: warning
On an update, a `collection.subscription` object replaces all five settings: a setting missing from the object becomes `false`. Send every setting you want kept. Feeds and notifications happen on create only: an update never puts a record into a feed and never notifies.
:::

## Subscription records

alice posts a record only her subscribers can read:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "members-only coupon",
    "config": {
      "collection": {
        "name": "members",
        "subscription": { "is_subscription_record": true }
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'members-only coupon',
    config: {
      collection: {
        name: 'members',
        subscription: { is_subscription_record: true }
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
        'data': 'members-only coupon',
        'config': {
            'collection': {
                'name': 'members',
                'subscription': {'is_subscription_record': True}
            }
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post members --subscription '{"is_subscription_record":true}' --data '"members-only coupon"'
Saved record VZOauGXiZBarBGAq
```

:::

```json
// Response
{
  "collection": {
    "access_level": "00",
    "name": "members",
    "subscription": {
      "feed_referencing_records": false,
      "is_subscription_record": true,
      "notify_referencing_records": false,
      "notify_subscribers": false,
      "upload_to_feed": false
    }
  },
  "data": "members-only coupon",
  "record_id": "VZOauGXiZBarBGAq",
  "user_id": "JFeCedoO"
}
```

bob, a subscriber, reads it with `collection.subscription` set to alice's user id in [`getRecords`](/api-reference/database#getrecords):

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getRecords \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "collection": { "name": "members", "subscription": "JFeCedoO" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getRecords', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: {
      collection: { name: 'members', subscription: 'JFeCedoO' }
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
        'query': {
            'collection': {'name': 'members', 'subscription': 'JFeCedoO'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> get members --sub JFeCedoO
VZOauGXiZBarBGAq  members/00  "members-only coupon"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "00",
        "name": "members",
        "subscription": {
          "feed_referencing_records": false,
          "is_subscription_record": true,
          "notify_referencing_records": false,
          "notify_subscribers": false,
          "upload_to_feed": false
        }
      },
      "data": "members-only coupon",
      "record_id": "VZOauGXiZBarBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

A user who does not subscribe to alice, or whom alice has blocked, gets this for the same query:

```json
// Response (403)
{
  "error": {
    "code": "NO_ACCESS",
    "message": "These are subscription records of user JFeCedoO; subscribe to them first."
  }
}
```

`collection.subscription` can be combined with `access_level`, an `index`, a `tag` and `fetch` like any other query.

## Feed

A feed is the list of records posted with `upload_to_feed` by the users you subscribe to with `get_feed`, newest first. alice posts to her subscribers' feeds:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Summer sale starts",
    "config": {
      "collection": {
        "name": "news",
        "subscription": { "upload_to_feed": true }
      }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'Summer sale starts',
    config: {
      collection: {
        name: 'news',
        subscription: { upload_to_feed: true }
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
        'data': 'Summer sale starts',
        'config': {
            'collection': {
                'name': 'news',
                'subscription': {'upload_to_feed': True}
            }
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post news --subscription '{"upload_to_feed":true}' --data '"Summer sale starts"'
Saved record VZOatsIKvvjBBGAq
```

:::

```json
// Response
{
  "collection": {
    "access_level": "00",
    "name": "news",
    "subscription": {
      "feed_referencing_records": false,
      "is_subscription_record": false,
      "notify_referencing_records": false,
      "notify_subscribers": false,
      "upload_to_feed": true
    }
  },
  "data": "Summer sale starts",
  "record_id": "VZOatsIKvvjBBGAq",
  "user_id": "JFeCedoO"
}
```

The record is an ordinary level `00` record in `news` as well; the feed is one more way to reach it. Delivery to feeds is background work and follows a moment later.

### Reading the feed

[`getFeed`](/api-reference/database#getfeed) answers a page of records, newest first by default (`fetch.ascending` defaults to `false` here).

```ts
// getFeed body
{
    query?: {
        /** Default: your level. "00" to "99" (two digits). The highest record level to include. */
        /** A level above yours counts as yours. It goes inside query; next to query it is refused */
        /** as an unknown key. */
        access_level?: string;
    };
    /** Default: limit 50, newest first. Paging. */
    fetch?: { limit?: number; ascending?: boolean; start_key?: string };
}
```

bob's feed:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getFeed \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "fetch": { "limit": 5 } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getFeed', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ fetch: { limit: 5 } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getFeed',
    data=json.dumps({'fetch': {'limit': 5}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> feed --limit 5
VZOatsIKvvjBBGAq  news/00  "Summer sale starts"
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "00",
        "name": "news",
        "subscription": {
          "feed_referencing_records": false,
          "is_subscription_record": false,
          "notify_referencing_records": false,
          "notify_subscribers": false,
          "upload_to_feed": true
        }
      },
      "data": "Summer sale starts",
      "record_id": "VZOatsIKvvjBBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

Only records up to a level:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/getFeed \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "access_level": "00" }, "fetch": { "limit": 1 } }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/getFeed', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { access_level: '00' }, fetch: { limit: 1 } })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/getFeed',
    data=json.dumps({'query': {'access_level': '00'}, 'fetch': {'limit': 1}}).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> raw getFeed '{"query": {"access_level": "00"}, "fetch": {"limit": 1}}'
```

:::

```json
// Response
{
  "end_of_list": true,
  "list": [
    {
      "collection": {
        "access_level": "00",
        "name": "news",
        "subscription": {
          "feed_referencing_records": false,
          "is_subscription_record": false,
          "notify_referencing_records": false,
          "notify_subscribers": false,
          "upload_to_feed": true
        }
      },
      "data": "Summer sale starts",
      "record_id": "VZOatsIKvvjBBGAq",
      "user_id": "JFeCedoO"
    }
  ],
  "start_key": "end"
}
```

The feed holds the records delivered to you when they were created: records with `upload_to_feed` from users you subscribed to with `get_feed` at that moment, plus records that point to your own records when those have `feed_referencing_records`. Subscribing later does not bring older records. When you read the feed, an entry is skipped if you no longer subscribe to its uploader or the uploader has blocked you (this does not apply to records pointing to your own records), if the record is above `query.access_level`, or if you cannot read it.

::: warning
A feed page can be shorter than `limit` while `end_of_list` is still `false`: entries you can no longer read are skipped. Keep paging with `start_key` until `end_of_list` is `true`.
:::

### Replies in your feed

`feed_referencing_records` on a record puts each new record that points to it, created by another user, into the feed of the record's uploader. alice's post, and bob's comment on it:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "text": "What should we build next?" },
    "config": {
      "collection": {
        "name": "posts",
        "subscription": { "feed_referencing_records": true, "notify_referencing_records": true }
      },
      "unique_id": "post-next"
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { text: 'What should we build next?' },
    config: {
      collection: {
        name: 'posts',
        subscription: { feed_referencing_records: true, notify_referencing_records: true }
      },
      unique_id: 'post-next'
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
        'data': {'text': 'What should we build next?'},
        'config': {
            'collection': {
                'name': 'posts',
                'subscription': {'feed_referencing_records': True, 'notify_referencing_records': True}
            },
            'unique_id': 'post-next'
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post posts --subscription '{"feed_referencing_records":true,"notify_referencing_records":true}' --unique post-next --data '{"text":"What should we build next?"}'
```

:::

bob replies by [referencing](/database/referencing) it. He needs no subscription setting of his own:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "text": "A dark theme" },
    "config": { "collection": "comments", "reference": "post-next" }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { text: 'A dark theme' },
    config: { collection: 'comments', reference: 'post-next' }
  })
});
console.log(await res.json());
```

```python [Python]
import json, urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/postRecord',
    data=json.dumps({
        'data': {'text': 'A dark theme'},
        'config': {'collection': 'comments', 'reference': 'post-next'}
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
bob> post comments --ref post-next --data '{"text":"A dark theme"}'
```

:::

bob's comment now appears in alice's `getFeed`, and because the post also has `notify_referencing_records`, alice is notified on her live stream (below). Neither depends on alice subscribing to bob.

## Notifications

`notify_subscribers` sends the record's `notification` to the uploader's subscribers who chose `get_notified`. `notification` is `{title, body}` and goes in `config`, next to `collection`. It is sent only to subscribers who can read the record, so a subscriber below the record's access level gets nothing. It carries the title, body, record id and collection, not the record's data:

::: code-group

```bash [curl]
$ curl http://localhost:7070/v1/postRecord \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Flash sale",
    "config": {
      "collection": {
        "name": "news",
        "subscription": { "notify_subscribers": true }
      },
      "notification": { "title": "Flash sale", "body": "30% off until midnight" }
    }
  }'
```

```js [JavaScript]
const res = await fetch('http://localhost:7070/v1/postRecord', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'Flash sale',
    config: {
      collection: {
        name: 'news',
        subscription: { notify_subscribers: true }
      },
      notification: { title: 'Flash sale', body: '30% off until midnight' }
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
        'data': 'Flash sale',
        'config': {
            'collection': {
                'name': 'news',
                'subscription': {'notify_subscribers': True}
            },
            'notification': {'title': 'Flash sale', 'body': '30% off until midnight'}
        }
    }).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
print(json.load(urllib.request.urlopen(req)))
```

```text [User shell]
alice> post news --subscription '{"notify_subscribers":true}' --notification "Flash sale|30% off until midnight" --data '"Flash sale"'
```

:::

The answer is the saved record. The notification itself goes to each subscriber's live stream, which is the next section. `upload_to_feed` and `notify_subscribers` can be set together on one record: it then appears in the feed and announces itself.

```ts
// postRecord body: config.notification
{
    config: {
        /** Default: none. The text subscribers receive when notify_subscribers is on. Create only. */
        notification?: { title: string; body: string } | null;
        // other config fields: see Creating Records
    };
}
```

For `notify_referencing_records`, the notification sent to the target's uploader uses the pointing record's `notification` when it has one. Otherwise the title is `New reference` and the body is `Record <id> references your record <id>.`

## Live notifications

Notifications arrive on `GET /v1/listen` ([`listen`](/api-reference/database#listen)). Unlike every other method it is a GET, and the answer is a Server-Sent Events stream (`text/event-stream`) that stays open.

| part | meaning |
|---|---|
| `Authorization: Bearer <token or agent key>` header, or `?token=<token>` in the URL | who is listening. `?token=` is for a browser's `EventSource`, which cannot set headers. It works on `listen` only; every other method needs the header |
| `Last-Event-ID: <id>` header, optional | send the stored notifications after this id first, then continue live |

| event | meaning |
|---|---|
| `event: notify` | a notification. `id` is 16 hex digits and increases; `data` is the JSON below |
| `event: gap` | some notifications expired before you reconnected (`Some notifications expired before you reconnected.`), or you read too slowly (`Too slow; some notifications were skipped. Reconnect with Last-Event-ID to catch up.`). `data` has the `message` |
| `: connected` | a comment, sent once the replay is done |
| `: ping` | a comment every 30 seconds, to keep the connection open |

`data` of a `notify` event:

| field | description |
|---|---|
| `from` | the user who posted |
| `record_id` | the record |
| `collection` | its collection |
| `title`, `body` | the record's `notification`, or the default text for `notify_referencing_records` |
| `created` | when, in ms |

Missed notifications are kept for `notify_keep` (settings file, default `1d`, or `ddbd start --notify-keep`) and replayed when you reconnect with `Last-Event-ID`. Without `Last-Event-ID` nothing is replayed: the stream starts with `: connected` and continues live. A missing or unknown token answers `401 UNAUTHORIZED` instead of a stream.

### Listening

::: code-group

```bash [curl]
$ curl -N http://localhost:7070/v1/listen \
  -H "Authorization: Bearer <token>"
```

```js [JavaScript]
// In a browser. EventSource cannot set headers, so the token goes in the URL.
const es = new EventSource(`http://localhost:7070/v1/listen?token=${TOKEN}`);
es.addEventListener('notify', (e) => {
  const n = JSON.parse(e.data);   // {from, record_id, collection, title, body, created}
  console.log(n.title, n.body, e.lastEventId);
});
es.addEventListener('gap', (e) => {
  console.log('missed some:', JSON.parse(e.data).message);
});
// On a dropped connection the browser reconnects by itself and sends
// Last-Event-ID with the id of the last event it saw.
```

```python [Python]
import urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listen',
    headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req) as stream:
    for line in stream:
        print(line.decode().rstrip(), flush=True)
```

```text [User shell]
bob> listen
Listening for notifications. Ctrl-C to stop.
00:56:21  Flash sale: 30% off until midnight  (from JFeCedoO, record VZOauWjWDo8wBGAq)
```

:::

`-N` tells curl not to buffer, so each event prints as it arrives. bob listens, and alice posts the Flash sale record above. bob's stream:

```
: connected

id: 0000000000000001
event: notify
data: {"body":"30% off until midnight","collection":"news","created":1793235381390,"from":"JFeCedoO","record_id":"VZOauWjWDo8wBGAq","title":"Flash sale"}
```

### Resuming after a disconnect

Send the last `id` you saw in `Last-Event-ID`. The stored notifications after it come first, then `: connected`, then whatever arrives live. `Last-Event-ID: 0` asks for everything still stored:

::: code-group

```bash [curl]
$ curl -N http://localhost:7070/v1/listen \
  -H "Authorization: Bearer <token>" \
  -H "Last-Event-ID: 0"
```

```js [JavaScript]
// A browser EventSource sends Last-Event-ID on its own when it reconnects.
// To resume from an id you stored yourself, use fetch and read the stream:
const res = await fetch('http://localhost:7070/v1/listen', {
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Last-Event-ID': '0' }
});
const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log(value);
}
```

```python [Python]
import urllib.request

req = urllib.request.Request(
    'http://localhost:7070/v1/listen',
    headers={'Authorization': f'Bearer {TOKEN}', 'Last-Event-ID': '0'})
with urllib.request.urlopen(req) as stream:
    for line in stream:
        print(line.decode().rstrip(), flush=True)
```

:::

```
id: 0000000000000001
event: notify
data: {"body":"30% off until midnight","collection":"news","created":1793235381390,"from":"JFeCedoO","record_id":"VZOauWjWDo8wBGAq","title":"Flash sale"}

: connected
```

::: tip
Store the `id` of each `notify` event you handle, and send it as `Last-Event-ID` when you open the stream again. Nothing posted while you were away is lost, as long as you reconnect within `notify_keep`. If you were away longer, or your reader fell behind, a `gap` event tells you so; fetch what you missed with `getFeed` or a query on `$uploaded`.
:::

The user shell does this for you: type `listen` again in the same shell, and it sends the `id` of the last notification it showed as `Last-Event-ID`.

::: warning
Behind a reverse proxy the stream must not be buffered. The server sends `X-Accel-Buffering: no`, which some proxies follow; for the others, turn off response buffering for `/v1/listen` in the proxy's settings. Without it, events reach the client late or in batches.
:::
