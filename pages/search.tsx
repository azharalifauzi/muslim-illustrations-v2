import { Button } from '@chakra-ui/button';
import { Box, Container, Grid, Text } from '@chakra-ui/layout';
import { IllustrationCard, IllustrationDetail, Layout, Search } from 'components';
import React, { useCallback, useState } from 'react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { debounce } from 'lodash';
import { SearchSuggestion } from 'components/mollecules/search';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabaseServer } from 'libs';
import Fuse from 'fuse.js/dist/fuse.common';
import dayjs from 'dayjs';

interface SearchPageProps {
  topSearches: Illustration[];
}

export const getStaticProps: GetStaticProps<SearchPageProps> = async () => {
  const date = dayjs().subtract(3, 'month').toISOString();
  const { data: queries } = await supabaseServer
    .from<Query>('queries')
    .select()
    .gte('created_at', date);
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

  const titleParam = Array.from(aggregatedQueries, ({ query }) => ({
    title: query,
  }));
  const descriptionParam = Array.from(aggregatedQueries, ({ query }) => ({ description: query }));

  const { data: illustrations } = await supabaseServer.from<Illustration>('illustrations').select();

  const fuse = new Fuse(illustrations, {
    threshold: 0.3,
    isCaseSensitive: false,
    shouldSort: true,
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'description', weight: 0.3 },
    ],
    includeScore: true,
    useExtendedSearch: true,
  });

  const data = fuse.search({ $or: [...titleParam, ...descriptionParam] });

  return {
    revalidate: 60,
    props: {
      topSearches: Array.from(data || [], ({ item }) => item),
    },
  };
};

const SearchPage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ topSearches }) => {
  const Router = useRouter();
  const { query } = Router;

  const [search, setSearch] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [illustrations, setIllustrations] = useState<Illustration[]>();
  const [isSearchLoading, setSearchLoading] = useState<boolean>(false);

  // eslint-disable-next-line
  const findSearchSuggestions = useCallback(
    debounce(async (search: string) => {
      if (!search) {
        setSearchSuggestions([]);
        return;
      }

      setSearchLoading(true);
      const res = await fetch(`/api/v1/queries/search-suggestions?search=${search}`);

      const data = await res.json();

      setSearchSuggestions(
        Array.from(data?.data || [], ({ query }) => ({
          query,
          onClick: (query) => setSearch(query),
        }))
      );
      setSearchLoading(false);
    }, 150),
    []
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;

      setSearch(value);
      findSearchSuggestions(value);
    },
    [findSearchSuggestions]
  );

  const handleSearch = useMutation(async (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    const res = await fetch(`/api/v1/illustration/search?search=${search}`);

    const data = await res.json();

    setIllustrations(Array.from(data.data, ({ item }) => item));
  });

  const handleClickIllustration = (id: string, illustration: Illustration) => {
    const { url, title } = illustration;

    Router.push({
      query: { 'open-detail': id, url, title, author: illustration?.author || 'Anonymus' },
    });
  };

  return (
    <>
      <IllustrationDetail
        isOpen={Boolean(query['open-detail'])}
        onClose={() => {
          Router.replace({ query: {} });
        }}
        title={query['title'] as string}
        author={query['author'] as string}
        id={query['open-detail'] as string}
        url={query['url'] as string}
      />
      <Head>
        <title>Search Illustrations | Muslim Illustrations</title>
      </Head>
      <Layout>
        <main>
          <Container mt={{ md: '0', base: '32' }} px={{ base: '6', md: '10' }} maxW="1536px">
            <Grid
              onSubmit={(e) => handleSearch.mutate(e)}
              as="form"
              mt="20"
              maxW="800"
              mx="auto"
              templateColumns="1fr auto"
              gap="4"
            >
              <Search
                isLoading={isSearchLoading && search.length > 0}
                onEnter={(val) => setSearch(val)}
                suggestions={searchSuggestions}
                value={search}
                onChange={handleChange}
                placeholder="Search for Illustrations"
              />
              <Button isLoading={handleSearch.isLoading} loadingText="Searching..." type="submit">
                Search
              </Button>
            </Grid>
            {!illustrations && (
              <Grid mt="20" alignItems="center" templateColumns="1fr auto 1fr" gap="6">
                <Box w="100%" height="2px" background="brand.cyan" />
                <Text
                  textAlign="center"
                  as="h1"
                  fontSize="xl"
                  color="brand.cyan"
                  fontFamily="heading"
                  fontWeight="700"
                >
                  Our top searches, just for you
                </Text>
                <Box w="100%" height="2px" background="brand.cyan" />
              </Grid>
            )}
            <Grid
              templateColumns={{
                base: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap="9"
              my={{ lg: '32', base: '16' }}
            >
              {!illustrations &&
                topSearches.map((illustration) => {
                  const { id, title, url } = illustration;

                  return (
                    <IllustrationCard
                      onClick={() => handleClickIllustration(id, illustration)}
                      key={id}
                      title={title}
                    >
                      <img src={url} alt={title} />
                    </IllustrationCard>
                  );
                })}
              {illustrations?.map((illustration) => {
                const { id, title, url } = illustration;

                return (
                  <IllustrationCard
                    onClick={() => handleClickIllustration(id, illustration)}
                    key={id}
                    title={title}
                  >
                    <img src={url} alt={title} />
                  </IllustrationCard>
                );
              })}
            </Grid>
          </Container>
        </main>
      </Layout>
    </>
  );
};

export default SearchPage;
