# pgvector-node

[pgvector](https://github.com/pgvector/pgvector) support for Node.js, Deno, and Bun (and TypeScript)

Supports [node-postgres](https://github.com/brianc/node-postgres), [Knex.js](https://github.com/knex/knex), [Objection.js](https://github.com/vincit/objection.js), [Kysely](https://github.com/kysely-org/kysely), [Sequelize](https://github.com/sequelize/sequelize), [pg-promise](https://github.com/vitaly-t/pg-promise), [Prisma](https://github.com/prisma/prisma), [Postgres.js](https://github.com/porsager/postgres), [Slonik](https://github.com/gajus/slonik), [TypeORM](https://github.com/typeorm/typeorm), [MikroORM](https://github.com/mikro-orm/mikro-orm), [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm), and [Bun SQL](https://bun.sh/docs/api/sql)

[![Build Status](https://github.com/pgvector/pgvector-node/actions/workflows/build.yml/badge.svg)](https://github.com/pgvector/pgvector-node/actions)

## Installation

Run:

```sh
npm install pgvector
```

And follow the instructions for your database library:

- [node-postgres](#node-postgres)
- [Knex.js](#knexjs)
- [Objection.js](#objectionjs)
- [Kysely](#kysely)
- [Sequelize](#sequelize)
- [pg-promise](#pg-promise)
- [Prisma](#prisma)
- [Postgres.js](#postgresjs)
- [Slonik](#slonik)
- [TypeORM](#typeorm)
- [MikroORM](#mikroorm)
- [Drizzle ORM](#drizzle-orm)
- [Bun SQL](#bun-sql)

Or check out some examples:

- [Embeddings](examples/openai/example.js) with OpenAI
- [Binary embeddings](examples/cohere/example.js) with Cohere
- [Sentence embeddings](examples/transformers/example.js) with Transformers.js
- [Hybrid search](examples/hybrid-search/example.js) with Transformers.js
- [Sparse search](examples/sparse-search/example.js) with Text Embeddings Inference
- [Morgan fingerprints](examples/rdkit/example.js) with RDKit.js
- [Recommendations](examples/disco/example.js) with Disco
- [Horizontal scaling](examples/citus/example.js) with Citus
- [WebAssembly](examples/pglite/example.js) with PGLite
- [Bulk loading](examples/loading/example.js) with `COPY`

## node-postgres

Enable the extension

```javascript
await client.query('CREATE EXTENSION IF NOT EXISTS vector');
```

Register the types for a client

```javascript
import pgvector from 'pgvector/pg';

await pgvector.registerTypes(client);
```

or a pool

```javascript
pool.on('connect', async function (client) {
  await pgvector.registerTypes(client);
});
```

Create a table

```javascript
await client.query('CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3))');
```

Insert a vector

```javascript
await client.query('INSERT INTO items (embedding) VALUES ($1)', [pgvector.toSql([1, 2, 3])]);
```

Get the nearest neighbors to a vector

```javascript
const result = await client.query('SELECT * FROM items ORDER BY embedding <-> $1 LIMIT 5', [pgvector.toSql([1, 2, 3])]);
```

Add an approximate index

```javascript
await client.query('CREATE INDEX ON items USING hnsw (embedding vector_l2_ops)');
// or
await client.query('CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)');
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/pg.test.mjs)

## Knex.js

Import the library

```javascript
import pgvector from 'pgvector/knex';
```

Enable the extension

```javascript
await knex.schema.createExtensionIfNotExists('vector');
```

Create a table

```javascript
await knex.schema.createTable('items', (table) => {
  table.increments('id');
  table.vector('embedding', 3);
});
```

Insert vectors

```javascript
const newItems = [
  {embedding: pgvector.toSql([1, 2, 3])},
  {embedding: pgvector.toSql([4, 5, 6])}
];
await knex('items').insert(newItems);
```

Get the nearest neighbors to a vector

```javascript
const items = await knex('items')
  .orderBy(knex.l2Distance('embedding', [1, 2, 3]))
  .limit(5);
```

Also supports `maxInnerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

Add an approximate index

```javascript
await knex.schema.alterTable('items', function (table) {
  table.index(knex.raw('embedding vector_l2_ops'), 'index_name', 'hnsw');
});
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/knex.test.mjs)

## Objection.js

Import the library

```javascript
import pgvector from 'pgvector/objection';
```

Enable the extension

```javascript
await knex.schema.createExtensionIfNotExists('vector');
```

Create a table

```javascript
await knex.schema.createTable('items', (table) => {
  table.increments('id');
  table.vector('embedding', 3);
});
```

Insert vectors

```javascript
const newItems = [
  {embedding: pgvector.toSql([1, 2, 3])},
  {embedding: pgvector.toSql([4, 5, 6])}
];
await Item.query().insert(newItems);
```

Get the nearest neighbors to a vector

```javascript
import { l2Distance } from 'pgvector/objection';

const items = await Item.query()
  .orderBy(l2Distance('embedding', [1, 2, 3]))
  .limit(5);
```

Also supports `maxInnerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

Add an approximate index

```javascript
await knex.schema.alterTable('items', function (table) {
  table.index(knex.raw('embedding vector_l2_ops'), 'index_name', 'hnsw');
});
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/objection.test.mjs)

## Kysely

Enable the extension

```javascript
await sql`CREATE EXTENSION IF NOT EXISTS vector`.execute(db);
```

Create a table

```javascript
await db.schema.createTable('items')
  .addColumn('id', 'serial', (cb) => cb.primaryKey())
  .addColumn('embedding', sql`vector(3)`)
  .execute();
```

Insert vectors

```javascript
import pgvector from 'pgvector/kysely';

const newItems = [
  {embedding: pgvector.toSql([1, 2, 3])},
  {embedding: pgvector.toSql([4, 5, 6])}
];
await db.insertInto('items').values(newItems).execute();
```

Get the nearest neighbors to a vector

```javascript
import { l2Distance } from 'pgvector/kysely';

const items = await db.selectFrom('items')
  .selectAll()
  .orderBy(l2Distance('embedding', [1, 2, 3]))
  .limit(5)
  .execute();
```

Also supports `maxInnerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

Get items within a certain distance

```javascript
const items = await db.selectFrom('items')
  .selectAll()
  .where(l2Distance('embedding', [1, 2, 3]), '<', 5)
  .execute();
```

Add an approximate index

```javascript
await db.schema.createIndex('index_name')
  .on('items')
  .using('hnsw')
  .expression(sql`embedding vector_l2_ops`)
  .execute();
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/kysely.test.mjs)

## Sequelize

Register the types **before** establishing the database connection.

```javascript
import { Sequelize } from 'sequelize';
import pgvector from 'pgvector/sequelize';

pgvector.registerTypes(Sequelize);
```

Initialize the connection to the database.

```javascript
let sequelize = new Sequelize(/* ... */);
```

Enable the extension

```javascript
await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
```

Add a vector field

```javascript
const Item = sequelize.define('Item', {
  embedding: {
    type: DataTypes.VECTOR(3)
  }
}, ...);
```

Insert a vector

```javascript
await Item.create({embedding: [1, 2, 3]});
```

Get the nearest neighbors to a vector

```javascript
const items = await Item.findAll({
  order: l2Distance('embedding', [1, 1, 1], sequelize),
  limit: 5
});
```

Also supports `maxInnerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

Add an approximate index

```javascript
const Item = sequelize.define('Item', ..., {
  indexes: [
    {
      fields: ['embedding'],
      using: 'hnsw',
      operator: 'vector_l2_ops'
    }
  ]
});
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/sequelize.test.mjs)

## pg-promise

Enable the extension

```javascript
await db.none('CREATE EXTENSION IF NOT EXISTS vector');
```

Register the types

```javascript
import pgpromise from 'pg-promise';
import pgvector from 'pgvector/pg-promise';

const initOptions = {
  async connect(e) {
    await pgvector.registerTypes(e.client);
  }
};
const pgp = pgpromise(initOptions);
```

Create a table

```javascript
await db.none('CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3))');
```

Insert a vector

```javascript
await db.none('INSERT INTO items (embedding) VALUES ($1)', [pgvector.toSql([1, 2, 3])]);
```

Get the nearest neighbors to a vector

```javascript
const result = await db.any('SELECT * FROM items ORDER BY embedding <-> $1 LIMIT 5', [pgvector.toSql([1, 2, 3])]);
```

Add an approximate index

```javascript
await db.none('CREATE INDEX ON items USING hnsw (embedding vector_l2_ops)');
// or
await db.none('CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)');
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/pg-promise.test.mjs)

## Prisma

Note: `prisma migrate dev` does not support pgvector indexes

Import the library

```javascript
import pgvector from 'pgvector';
```

Add the extension to the schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

Add a vector column to the schema

```prisma
model Item {
  id        Int                       @id @default(autoincrement())
  embedding Unsupported("vector(3)")?
}
```

Insert a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3])
await prisma.$executeRaw`INSERT INTO items (embedding) VALUES (${embedding}::vector)`
```

Get the nearest neighbors to a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3])
const items = await prisma.$queryRaw`SELECT id, embedding::text FROM items ORDER BY embedding <-> ${embedding}::vector LIMIT 5`
```

See a [full example](tests/prisma.test.mjs) (and the [schema](prisma/schema.prisma))

## Postgres.js

Import the library

```javascript
import pgvector from 'pgvector';
```

Enable the extension

```javascript
await sql`CREATE EXTENSION IF NOT EXISTS vector`;
```

Create a table

```javascript
await sql`CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3))`;
```

Insert vectors

```javascript
const newItems = [
  {embedding: pgvector.toSql([1, 2, 3])},
  {embedding: pgvector.toSql([4, 5, 6])}
];
await sql`INSERT INTO items ${ sql(newItems, 'embedding') }`;
```

Get the nearest neighbors to a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3]);
const items = await sql`SELECT * FROM items ORDER BY embedding <-> ${ embedding } LIMIT 5`;
```

Add an approximate index

```javascript
await sql`CREATE INDEX ON items USING hnsw (embedding vector_l2_ops)`;
// or
await sql`CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)`;
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/postgres.test.mjs)

## Slonik

Import the library

```javascript
import pgvector from 'pgvector';
```

Enable the extension

```javascript
await pool.query(sql.unsafe`CREATE EXTENSION IF NOT EXISTS vector`);
```

Create a table

```javascript
await pool.query(sql.unsafe`CREATE TABLE items (id serial PRIMARY KEY, embedding vector(3))`);
```

Insert a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3]);
await pool.query(sql.unsafe`INSERT INTO items (embedding) VALUES (${embedding})`);
```

Get the nearest neighbors to a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3]);
const items = await pool.query(sql.unsafe`SELECT * FROM items ORDER BY embedding <-> ${embedding} LIMIT 5`);
```

Add an approximate index

```javascript
await pool.query(sql.unsafe`CREATE INDEX ON items USING hnsw (embedding vector_l2_ops)`);
// or
await pool.query(sql.unsafe`CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)`);
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](tests/slonik.test.mjs)

## TypeORM

Import the library

```javascript
import pgvector from 'pgvector';
```

Enable the extension

```javascript
await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
```

Create a table

```javascript
await AppDataSource.query('CREATE TABLE item (id bigserial PRIMARY KEY, embedding vector(3))');
```

Define an entity

```typescript
@Entity()
class Item {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  embedding: string
}
```

Insert a vector

```javascript
const itemRepository = AppDataSource.getRepository(Item);
await itemRepository.save({embedding: pgvector.toSql([1, 2, 3])});
```

Get the nearest neighbors to a vector

```javascript
const items = await itemRepository
  .createQueryBuilder('item')
  .orderBy('embedding <-> :embedding')
  .setParameters({embedding: pgvector.toSql([1, 2, 3])})
  .limit(5)
  .getMany();
```

See a [full example](tests/typeorm.test.mjs)

## MikroORM

Enable the extension

```javascript
await em.execute('CREATE EXTENSION IF NOT EXISTS vector');
```

Define an entity

```typescript
import { VectorType } from 'pgvector/mikro-orm';

@Entity()
class Item {
  @PrimaryKey()
  id: number;

  @Property({type: VectorType})
  embedding: number[];
}
```

Insert a vector

```javascript
em.create(Item, {embedding: [1, 2, 3]});
```

Get the nearest neighbors to a vector

```javascript
import { l2Distance } from 'pgvector/mikro-orm';

const items = await em.createQueryBuilder(Item)
  .orderBy({[l2Distance('embedding', [1, 2, 3])]: 'ASC'})
  .limit(5)
  .getResult();
```

Also supports `maxInnerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

See a [full example](tests/mikro-orm.test.mjs)

## Drizzle ORM

Drizzle ORM 0.31.0+ has [built-in support](https://orm.drizzle.team/docs/extensions/pg#pg_vector) for pgvector :tada:

Enable the extension

```javascript
await client`CREATE EXTENSION IF NOT EXISTS vector`;
```

Add a vector field

```javascript
import { vector } from 'drizzle-orm/pg-core';

const items = pgTable('items', {
  id: serial('id').primaryKey(),
  embedding: vector('embedding', {dimensions: 3})
});
```

Also supports `halfvec`, `bit`, and `sparsevec`

Insert vectors

```javascript
const newItems = [
  {embedding: [1, 2, 3]},
  {embedding: [4, 5, 6]}
];
await db.insert(items).values(newItems);
```

Get the nearest neighbors to a vector

```javascript
import { l2Distance } from 'drizzle-orm';

const allItems = await db.select()
  .from(items)
  .orderBy(l2Distance(items.embedding, [1, 2, 3]))
  .limit(5);
```

Also supports `innerProduct`, `cosineDistance`, `l1Distance`, `hammingDistance`, and `jaccardDistance`

See a [full example](tests/drizzle-orm.test.mjs)

## Bun SQL

Import the library

```javascript
import pgvector from 'pgvector';
```

Enable the extension

```javascript
await sql`CREATE EXTENSION IF NOT EXISTS vector`;
```

Create a table

```javascript
await sql`CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3))`;
```

Insert vectors

```javascript
const newItems = [
  {embedding: pgvector.toSql([1, 2, 3])},
  {embedding: pgvector.toSql([4, 5, 6])}
];
await sql`INSERT INTO items (embedding) ${sql(newItems)}`;
```

Get the nearest neighbors to a vector

```javascript
const embedding = pgvector.toSql([1, 2, 3]);
const items = await sql`SELECT * FROM items ORDER BY embedding <-> ${embedding} LIMIT 5`.values();
```

Add an approximate index

```javascript
await sql`CREATE INDEX ON items USING hnsw (embedding vector_l2_ops)`;
// or
await sql`CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)`;
```

Use `vector_ip_ops` for inner product and `vector_cosine_ops` for cosine distance

See a [full example](examples/bun/example.js)

## Reference

### Sparse Vectors

Create a sparse vector from an array

```javascript
const vec = new SparseVector([1, 0, 2, 0, 3, 0]);
```

Or a map of non-zero elements

```javascript
const vec = new SparseVector({0: 1, 2: 2, 4: 3}, 6);
// or
const map = new Map();
map.set(0, 1);
map.set(2, 2);
map.set(4, 3);
const vec = new SparseVector(map, 6);
```

Note: Indices start at 0

Get the number of dimensions

```javascript
const dim = vec.dimensions;
```

Get the indices of non-zero elements

```javascript
const indices = vec.indices;
```

Get the values of non-zero elements

```javascript
const values = vec.values;
```

Get an array

```javascript
const arr = vec.toArray();
```

## History

View the [changelog](https://github.com/pgvector/pgvector-node/blob/master/CHANGELOG.md)

## Contributing

Everyone is encouraged to help improve this project. Here are a few ways you can help:

- [Report bugs](https://github.com/pgvector/pgvector-node/issues)
- Fix bugs and [submit pull requests](https://github.com/pgvector/pgvector-node/pulls)
- Write, clarify, or fix documentation
- Suggest or add new features

To get started with development:

```sh
git clone https://github.com/pgvector/pgvector-node.git
cd pgvector-node
npm install
createdb pgvector_node_test
npx prisma migrate dev
npm test
```

To run an example:

```sh
cd examples/loading
npm install
createdb pgvector_example
node example.js
```
