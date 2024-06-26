import postgres from 'postgres';
import pgvector from 'pgvector';
import { SparseVector } from 'pgvector';

test('example', async () => {
  const sql = postgres({database: 'pgvector_node_test', onnotice: function () { }});

  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`DROP TABLE IF EXISTS postgres_items`;
  await sql`CREATE TABLE postgres_items (id serial PRIMARY KEY, embedding vector(3), half_embedding halfvec(3), binary_embedding bit(3), sparse_embedding sparsevec(3))`;

  const newItems = [
    {embedding: pgvector.toSql([1, 1, 1]), half_embedding: pgvector.toSql([1, 1, 1]), binary_embedding: '000', sparse_embedding: SparseVector.fromDense([1, 1, 1]).toSql()},
    {embedding: pgvector.toSql([2, 2, 2]), half_embedding: pgvector.toSql([2, 2, 2]), binary_embedding: '101', sparse_embedding: SparseVector.fromDense([2, 2, 2]).toSql()},
    {embedding: pgvector.toSql([1, 1, 2]), half_embedding: pgvector.toSql([1, 1, 2]), binary_embedding: '111', sparse_embedding: SparseVector.fromDense([1, 1, 2]).toSql()}
  ];
  await sql`INSERT INTO postgres_items ${ sql(newItems, 'embedding', 'half_embedding', 'binary_embedding', 'sparse_embedding') }`;

  const embedding = pgvector.toSql([1, 1, 1]);
  const items = await sql`SELECT * FROM postgres_items ORDER BY embedding <-> ${ embedding } LIMIT 5`;
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2]);
  expect(pgvector.fromSql(items[0].embedding)).toStrictEqual([1, 1, 1]);
  expect(pgvector.fromSql(items[1].embedding)).toStrictEqual([1, 1, 2]);
  expect(pgvector.fromSql(items[2].embedding)).toStrictEqual([2, 2, 2]);
  expect(pgvector.fromSql(items[0].half_embedding)).toStrictEqual([1, 1, 1]);
  expect(pgvector.fromSql(items[1].half_embedding)).toStrictEqual([1, 1, 2]);
  expect(pgvector.fromSql(items[2].half_embedding)).toStrictEqual([2, 2, 2]);
  expect(items[0].binary_embedding).toStrictEqual('000');
  expect(items[1].binary_embedding).toStrictEqual('111');
  expect(items[2].binary_embedding).toStrictEqual('101');
  expect(SparseVector.fromSql(items[0].sparse_embedding).toArray()).toStrictEqual([1, 1, 1]);
  expect(SparseVector.fromSql(items[1].sparse_embedding).toArray()).toStrictEqual([1, 1, 2]);
  expect(SparseVector.fromSql(items[2].sparse_embedding).toArray()).toStrictEqual([2, 2, 2]);

  await sql`CREATE INDEX ON postgres_items USING hnsw (embedding vector_l2_ops)`;

  await sql.end();
});
