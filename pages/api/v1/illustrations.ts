import { supabaseServer } from 'libs';
import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { query } = req;
  const limit = parseInt(query.limit as string) || 8;
  const page = parseInt(query.page as string) || 1;
  const sort = (query.sort as string) || 'created_at';
  const categories = query.categories;

  const isAscending = sort.startsWith('-');

  const realSort = sort.replace('-', '') as keyof Illustration;

  const { data } = await supabaseServer
    .from<Illustration>('illustrations')
    .select()
    .range((page - 1) * limit, limit * page - 1)
    .order(realSort, { ascending: isAscending });

  if (categories) {
    const { data } = await supabaseServer
      .from<Illustration>('illustrations')
      .select()
      .range((page - 1) * limit, limit - 1)
      .order(realSort, { ascending: isAscending })
      .filter('category', 'ilike', `%${categories}%`);

    res.status(200).send({ data: data ?? [], message: 'Success' });
    return;
  }

  res.status(200).send({ data: data ?? [], message: 'Success' });
};

export default handler;
