interface Illustration {
  category: string;
  title: string;
  id: string;
  created_at: string;
  url: string;
  download_count: number;
  author?: string;
}

interface Category {
  category: string;
  count: number;
}

interface Query {
  id: number;
  created_at: string;
  query: text;
}
