import { ref } from 'vue'

// The examples of the "Save JSON. Query it at once." section: the postRecord body in the code block and the
// key list in KeysDiagram show the same example at the same time. KeysDiagram moves `current` on.
//
// Each example shows one sorted list of keys (access level, tag, index value, as DADABADA sorts them) with
// every record in it once: the record saved gets one key, and the query reads one range of the list.

export type KeyRow = { lvl: string; tag: string; val: string; id: string; fresh?: true }
export type KeysExample = {
  coll: string
  lvl: string
  tag: string
  ix: string
  /** the new record's index value, as JSON */
  value: string | number
  data: Record<string, string | number>
  read: string
  rows: KeyRow[]
  /** first and last row the query reads */
  range: [number, number]
  desc: string
}

export const EXAMPLES: KeysExample[] = [
  {
    coll: 'products', lvl: '05', tag: 'sale', ix: 'price', value: 1200,
    data: { title: 'Desk Lamp', color: 'red' },
    read: 'tag sale · price >= 1000 · reader 05',
    rows: [
      { lvl: '03', tag: 'sale', val: '880', id: 'VZOat3k' },
      { lvl: '05', tag: 'new', val: '1500', id: 'VZOat2q' },
      { lvl: '05', tag: 'sale', val: '990', id: 'VZOat4b' },
      { lvl: '05', tag: 'sale', val: '1200', id: 'VZYu683', fresh: true },
      { lvl: '05', tag: 'sale', val: '1800', id: 'VZOat4m' },
      { lvl: '05', tag: 'sale', val: '2100', id: 'VZOat4j' },
      { lvl: '07', tag: 'sale', val: '1100', id: 'VZOat4o' },
    ],
    range: [3, 5],
    desc: 'A number index: a product at price 1200 with the tag sale. The query for sale products from price 1000 reads 1200, 1800 and 2100; the product at access level 07 is out of its range.',
  },
  {
    coll: 'reviews', lvl: '00', tag: 'verified', ix: 'rating', value: 5,
    data: { text: 'Bright and quiet', stars: 5 },
    read: 'tag verified · rating >= 4 · reader 00',
    rows: [
      { lvl: '00', tag: 'photo', val: '2', id: 'VZPb81c' },
      { lvl: '00', tag: 'photo', val: '5', id: 'VZPb83w' },
      { lvl: '00', tag: 'verified', val: '3', id: 'VZPb84a' },
      { lvl: '00', tag: 'verified', val: '4', id: 'VZPb82x' },
      { lvl: '00', tag: 'verified', val: '5', id: 'VZYv107', fresh: true },
      { lvl: '02', tag: 'verified', val: '5', id: 'VZPb86t' },
    ],
    range: [3, 4],
    desc: 'Another number index: a review rated 5 with the tag verified. A reader at access level 00 reads the verified reviews rated 4 and 5; the review at access level 02 is out of its range.',
  },
  {
    coll: 'products', lvl: '05', tag: 'new', ix: 'title', value: 'Desk Lamp',
    data: { title: 'Desk Lamp', color: 'blue' },
    read: 'tag new · title starts with "Desk" · reader 05',
    rows: [
      { lvl: '05', tag: 'new', val: 'Bed Frame', id: 'VZQc12d' },
      { lvl: '05', tag: 'new', val: 'Desk Chair', id: 'VZQc13k' },
      { lvl: '05', tag: 'new', val: 'Desk Lamp', id: 'VZYw221', fresh: true },
      { lvl: '05', tag: 'new', val: 'Desk Mat', id: 'VZQc15p' },
      { lvl: '05', tag: 'new', val: 'Floor Lamp', id: 'VZQc16b' },
      { lvl: '05', tag: 'sale', val: 'Desk Fan', id: 'VZQc17s' },
    ],
    range: [1, 3],
    desc: 'A string index: a product titled Desk Lamp with the tag new. The query for new products whose title starts with Desk reads Desk Chair, Desk Lamp and Desk Mat, and stops at Floor Lamp.',
  },
  {
    coll: 'products', lvl: '05', tag: 'decor', ix: 'title', value: 'Café Lamp',
    data: { title: 'Café Lamp', color: 'white' },
    read: 'tag decor · title starts with "cafe" · loose',
    rows: [
      { lvl: '05', tag: 'decor', val: 'Bed Frame', id: 'VZQc12d' },
      { lvl: '05', tag: 'decor', val: 'Café Lamp', id: 'VZYx305', fresh: true },
      { lvl: '05', tag: 'decor', val: 'CAFÉ Sign', id: 'VZQc21e' },
      { lvl: '05', tag: 'decor', val: 'Cafe Table', id: 'VZQc19r' },
      { lvl: '05', tag: 'decor', val: 'Desk Mat', id: 'VZQc15p' },
    ],
    range: [1, 3],
    desc: 'Loose match: a product titled Café Lamp. Loose keys ignore case and accents, so the query for titles starting with cafe finds Café Lamp, CAFÉ Sign and Cafe Table.',
  },
]

/** The example shown now, in the diagram and in the code block. */
export const current = ref(0)
