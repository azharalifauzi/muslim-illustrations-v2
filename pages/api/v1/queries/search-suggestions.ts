import Fuse from 'fuse.js';
import { supabaseServer } from 'libs';
import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { query } = req;
  const search = query.search as string;

  const { data: queries } = await supabaseServer.from<Query>('queries').select();
  const queryMap: Record<string, number> = {};

  queries.forEach(({ query }) => {
    if (query in queryMap) {
      queryMap[query] = queryMap[query] + 1;
      return;
    }

    queryMap[query] = 1;
  });

  const aggregatedQueries = Object.keys(queryMap).map((key) => ({
    query: key,
    count: queryMap[key],
  }));

  const fuse = new Fuse(aggregatedQueries, {
    isCaseSensitive: false,
    shouldSort: true,
    threshold: 0.3,
    keys: ['query'],
    includeScore: true,
  });

  const data = fuse.search<{ query: string }>(search);

  if (data.length > 10) data.length = 10;

  res.status(200).send({
    message: 'OK',
    data: Array.from(data, ({ item }) => ({ query: item.query })),
  });
};

export default handler;
