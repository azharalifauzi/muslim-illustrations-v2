import { supabaseServer } from 'libs';
import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (_req, res) => {
  const { data } = await supabaseServer.from<Illustration>('illustrations').select('category');
  const categoryMap: Record<string, number> = {};
  data.forEach(({ category }) => {
    if (category in categoryMap) {
      categoryMap[category] = categoryMap[category] + 1;
    } else {
      categoryMap[category] = 1;
    }
  });

  const categories: Category[] = Object.keys(categoryMap).map((key) => ({
    category: key,
    count: categoryMap[key],
  }));

  res.status(200).send({ data: categories, message: 'success' });
};

export default handler;
