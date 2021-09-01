import { CloseIcon } from '@chakra-ui/icons';
import { Box, Container, Flex, Grid, Text } from '@chakra-ui/layout';
import { IllustrationCard, IllustrationDetail, Layout } from 'components';
import { supabaseServer } from 'libs';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Router, { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQuery } from 'react-query';
import { SelectSearchProps } from 'react-select-search';
import SelectSearch, { fuzzySearch } from 'react-select-search/dist/cjs';
import { uniqueArray } from 'utils';

interface IllustrationPageProps {
  illustrations: Illustration[];
}

export const getServerSideProps: GetServerSideProps<IllustrationPageProps> = async ({ res }) => {
  const { data } = await supabaseServer
    .from<Illustration>('illustrations')
    .select()
    .order('created_at', { ascending: true })
    .range(0, 7);

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  return {
    props: {
      illustrations: data || [],
    },
  };
};

const IllustrationsPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  illustrations: initialIllustrations,
}) => {
  const { query } = useRouter();
  const [detail, setDetail] = useState<Illustration>();
  const [page, setPage] = useState<number>(1);
  const [category, setCategory] = useState<string>('');
  const [illustrations, setIllustrations] = useState<Illustration[]>(initialIllustrations);
  const [ILByCategory, setILByCategory] = useState<Illustration[]>([]);
  const [pageByCategory, setPageByCategory] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      if (category) setPageByCategory((prevPage) => prevPage + 1);
      else setPage((prevPage) => prevPage + 1);
    }
  }, [inView, hasNextPage, category]);

  const { isFetchedAfterMount } = useQuery<
    Illustration[],
    unknown,
    Illustration[],
    [string, number, string, number]
  >(
    ['illustrations', page, category, pageByCategory],
    async ({ queryKey }) => {
      const [, currentPage, currentCategory, currentPageByCategory] = queryKey;

      let categoryParam = '';
      if (currentCategory) {
        categoryParam = `&categories=${currentCategory}`;
      }

      const res = await fetch(
        `/api/v1/illustrations?sort=-created_at&limit=8&page=${
          currentCategory ? currentPageByCategory : currentPage
        }${categoryParam}`
      );

      const data = await res.json();

      return data.data;
    },
    {
      keepPreviousData: true,
      onSuccess(data) {
        if (data.length === 8) {
          setHasNextPage(true);
        } else {
          setHasNextPage(false);
        }

        if (category) {
          const newIllustrations = [...ILByCategory, ...data];
          setILByCategory(uniqueArray(newIllustrations));
          return;
        }

        setIllustrations(uniqueArray([...illustrations, ...data]));
      },
    }
  );

  const { data: categories } = useQuery<Category[]>(
    'categories',
    async () => {
      const res = await fetch('/api/v1/illustration/all-categories');

      const data = await res.json();

      return data.data;
    },
    {
      initialData: [],
    }
  );

  const handleClickIllustration = (id: string, illustration: Illustration) => {
    const { url, title, author } = illustration;

    setDetail(illustration);
    Router.push({ query: { 'open-detail': id, url, title, author: author || 'Anonymus' } });
  };

  return (
    <>
      <IllustrationDetail
        isOpen={Boolean(query['open-detail'])}
        onClose={() => {
          Router.replace({ query: {} });
          setDetail(undefined);
        }}
        title={detail?.title || (query['title'] as string)}
        author={detail?.author || (query['author'] as string)}
        id={detail?.id || (query['open-detail'] as string)}
        url={detail?.url || (query['url'] as string)}
      />
      <Layout>
        <main>
          <Container
            mt={{ md: '0', base: '32' }}
            px={{ base: '6', md: '10' }}
            maxW="1536px"
            pb="24"
          >
            <Grid mt="20" mb="5" alignItems="center" templateColumns="1fr auto 1fr" gap="6">
              <Box w="100%" height="2px" background="brand.cyan" />
              <Text
                as="h1"
                textAlign="center"
                fontSize="xl"
                color="brand.cyan"
                fontFamily="heading"
                fontWeight="700"
              >
                Free Illustration, for every project you’d need
              </Text>
              <Box w="100%" height="2px" background="brand.cyan" />
            </Grid>
            <Text mb="20" maxW="800" mx="auto" textAlign="center">
              Muslim Illustration provides you with free-to-use muslim themed illustrations for
              personal and commercial uses. You don’t even need to include our awesome authors’ name
              in your project, but still we’d be grateful if you do that though.
            </Text>
            <Flex alignItems="center" gridGap="3" justifyContent="flex-end">
              <DropdownSearch
                options={[
                  ...categories?.map(({ category }) => ({ name: category, value: category })),
                ]}
                placeholder="Search by category"
                // @ts-ignore
                onChange={(selected: string | string[]) => {
                  if (!Array.isArray(selected)) {
                    setCategory(selected);
                  }
                  setPageByCategory(1);

                  if (selected !== category) {
                    setILByCategory([]);
                  }
                }}
                value={category}
              />
              {category?.length > 0 ? (
                <button onClick={() => setCategory('')}>
                  <CloseIcon color="brand.cyanDark" />
                </button>
              ) : null}
            </Flex>
            <Grid
              templateColumns={{
                base: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap="9"
              mt="16"
            >
              {!category &&
                illustrations?.map((illustration, i, self) => {
                  const { title, id, url } = illustration;

                  if (i === self.length - 1)
                    return (
                      <div key={id} ref={ref}>
                        <IllustrationCard
                          onClick={() => handleClickIllustration(id, illustration)}
                          title={title}
                        >
                          <img src={url} alt={title} />
                        </IllustrationCard>
                      </div>
                    );

                  return (
                    <IllustrationCard
                      key={id}
                      onClick={() => handleClickIllustration(id, illustration)}
                      title={title}
                    >
                      <img src={url} alt={title} />
                    </IllustrationCard>
                  );
                })}
              {category &&
                ILByCategory?.map((illustration, i, self) => {
                  const { title, id, url } = illustration;

                  if (i === self.length - 1)
                    return (
                      <div key={id} ref={ref}>
                        <IllustrationCard
                          onClick={() => handleClickIllustration(id, illustration)}
                          title={title}
                        >
                          <img src={url} alt={title} />
                        </IllustrationCard>
                      </div>
                    );

                  return (
                    <IllustrationCard
                      key={id}
                      onClick={() => handleClickIllustration(id, illustration)}
                      title={title}
                    >
                      <img src={url} alt={title} />
                    </IllustrationCard>
                  );
                })}
            </Grid>
            {!isFetchedAfterMount && (
              <Text mt="6" fontWeight="bold" textAlign="center">
                Loading...
              </Text>
            )}
          </Container>
        </main>
      </Layout>
    </>
  );
};

export default IllustrationsPage;

const DropdownSearch: React.FC<SelectSearchProps> = (props) => (
  <SelectSearch search filterOptions={fuzzySearch} {...props} />
);
