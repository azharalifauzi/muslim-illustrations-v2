import Fuse from 'fuse.js';
import { supabaseServer } from 'libs';
import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { query } = req;
  const search = query.search as string;

  const { data: illustrations } = await supabaseServer.from<Illustration>('illustrations').select();

  const fuse = new Fuse(illustrations, {
    keys: [
      {
        name: 'title',
        weight: 0.6,
      },
      {
        name: 'description',
        weight: 0.2,
      },
      {
        name: 'categories',
        weight: 0.2,
      },
    ],
    shouldSort: true,
    includeScore: true,
    ignoreLocation: true,
    isCaseSensitive: false,
    threshold: 0.3,
  });

  const data = fuse.search(search);

  if (data.length > 0) {
    await supabaseServer.from('queries').insert([{ query: search }]);
  }

  res.status(200).send({ data, message: 'success' });
};

export default handler;
