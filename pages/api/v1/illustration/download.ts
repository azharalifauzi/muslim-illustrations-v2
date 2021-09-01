import { supabaseServer } from 'libs';
import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { query } = req;
  const id = query.id as string;
  const { data } = await supabaseServer
    .from<Illustration>('illustrations')
    .select('download_count')
    .match({ id });

  await supabaseServer
    .from<Illustration>('illustrations')
    .update({ download_count: data[0].download_count + 1 })
    .match({ id });

  res.status(200).send({ message: 'OK' });
};

export default handler;
