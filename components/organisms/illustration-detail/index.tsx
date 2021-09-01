import { Button } from '@chakra-ui/button';
import { Box, Flex, Grid, Text } from '@chakra-ui/layout';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/modal';
import { IcArrow } from 'assets/icons';
import React, { useState } from 'react';
import ColorPicker from '../color-picker';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@chakra-ui/popover';
import {
  FacebookShareButton,
  TwitterShareButton,
  PinterestShareButton,
  TwitterIcon,
  FacebookIcon,
  PinterestIcon,
  WhatsappShareButton,
  WhatsappIcon,
} from 'react-share';
import { useMutation, useQuery } from 'react-query';
import styles from './illustration-detail.module.css';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@chakra-ui/media-query';
import { Spinner } from '@chakra-ui/spinner';
import domtoimage from 'dom-to-image';
import * as gtag from 'utils/gtag';

interface IllustrationDetailProps {
  title?: string;
  author?: string;
  onClose?: () => void;
  isOpen?: boolean;
  url?: string;
  id?: string;
}

const IllustrationDetail: React.FC<IllustrationDetailProps> = ({
  isOpen,
  onClose,
  title,
  author,
  url,
  id,
}) => {
  const { asPath } = useRouter();
  const [color, setColor] = useState<string>('#26B6BD');
  const [openPicker, setOpen] = useState<boolean>(false);

  const [md, lg] = useMediaQuery(['(min-width: 768px)', '(min-width: 1000px)']);

  const { data, isLoading } = useQuery<string>(
    ['illustrationString', url],
    async () => {
      if (!url) return;

      const res = await fetch(url);

      if (res.status === 404) {
        return title;
      }

      const blob = await res.blob();

      const string = await blob.text();

      return string.replace(/#26B6BD/gi, 'currentColor');
    },
    {
      keepPreviousData: true,
    }
  );

  const handleDownload = async (format: 'png' | 'svg') => {
    const res = await fetch(url);

    const blob = await res.blob();
    const string = await blob.text();
    const svg = string.replace(/#26B6BD/gi, color);

    let downloadUrl = '';

    if (format === 'svg') {
      const data = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      downloadUrl = URL.createObjectURL(data);

      // google analytics download event
      gtag.event({ action: 'download_svg', category: 'engagement', label: title, value: 1 });
    } else {
      const domSvg = document.getElementById('illustration-to-print');
      downloadUrl = await domtoimage.toPng(domSvg);

      // google analytics download event
      gtag.event({ action: 'download_png', category: 'engagement', label: title, value: 1 });
    }

    const a = document.createElement('a');
    a.setAttribute('download', `${title}.${format}`);
    a.setAttribute('href', downloadUrl);
    a.style.display = 'none';
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);

    await fetch(`/api/v1/illustration/download?id=${id}`);
  };

  const handleDownloadSvg = useMutation(async () => {
    await handleDownload('svg');
  });

  const handleDownloadPng = useMutation(async () => {
    await handleDownload('png');
  });

  return (
    <Modal size={lg ? '5xl' : md ? '2xl' : 'sm'} isOpen={isOpen} isCentered={md} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton data-testid="close-button" />
        <ModalBody px="6" py="16">
          <Grid
            alignItems="center"
            templateColumns={{ md: 'repeat(2, 1fr)', base: '1fr' }}
            rowGap="4"
            columnGap="8"
          >
            <Flex justifyContent="center" alignItems="center" p="6" color={color}>
              {isLoading ? (
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                />
              ) : (
                <div
                  id="illustration-to-print"
                  data-testid="illustration"
                  className={styles.svg}
                  dangerouslySetInnerHTML={{ __html: data }}
                />
              )}
            </Flex>
            <Box>
              <Text
                as="h2"
                fontFamily="heading"
                fontSize="2xl"
                color="brand.cyan"
                fontWeight="bold"
              >
                {title}
              </Text>
              <Text color="brand.cyanDark" fontSize="xs" mb="7">
                Illustration by {author}
              </Text>
              <Flex mb="12" alignItems="center">
                <Flex mr="2" alignItems="center">
                  <Text mr="2" color="brand.cyanDark">
                    Find your favourite color
                  </Text>
                  <IcArrow />
                </Flex>
                <Popover
                  placement={md ? 'right' : 'auto'}
                  onClose={() => setOpen(false)}
                  isOpen={openPicker}
                >
                  <PopoverTrigger>
                    <Box
                      as="button"
                      h="25px"
                      w="25px"
                      bg={color}
                      border="1px solid"
                      borderColor="brand.cyanDark"
                      borderRadius="md"
                      onClick={() => {
                        setOpen((state) => !state);
                      }}
                    ></Box>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverBody>
                      <ColorPicker color={color} onChange={({ hex }) => setColor(hex)} />
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </Flex>
              <Box mb="6">
                <Text color="brand.cyanDark" mb="1">
                  Share :
                </Text>
                <Grid templateColumns="repeat(4, max-content)" gap="10px">
                  <TwitterShareButton url={`https://muslimillustrations.co${asPath}`}>
                    <TwitterIcon round size={32} />
                  </TwitterShareButton>
                  <FacebookShareButton url={`https://muslimillustrations.co${asPath}`}>
                    <FacebookIcon round size={32} />
                  </FacebookShareButton>
                  <PinterestShareButton
                    media={`https://muslimillustrations.co/api/public/${url}`}
                    url={`https://muslimillustrations.co${asPath}`}
                  >
                    <PinterestIcon round size={32} />
                  </PinterestShareButton>
                  <WhatsappShareButton url={`https://muslimillustrations.co${asPath}`}>
                    <WhatsappIcon round size={32} />
                  </WhatsappShareButton>
                </Grid>
              </Box>
              <Button
                whiteSpace="pre-wrap"
                loadingText="Please Wait"
                isLoading={handleDownloadSvg.isLoading}
                onClick={() => handleDownloadSvg.mutate()}
                w="100%"
                mb="4"
                colormode="cyan"
              >
                Download SVG for your project
              </Button>
              <Button
                whiteSpace="pre-wrap"
                loadingText="Please Wait"
                isLoading={handleDownloadPng.isLoading}
                onClick={() => handleDownloadPng.mutate()}
                w="100%"
                colormode="green"
              >
                Download PNG {md && 'for simple document'}
              </Button>
            </Box>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default IllustrationDetail;
