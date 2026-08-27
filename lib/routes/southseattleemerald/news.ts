import * as cheerio from 'cheerio';

import { type Route } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/news',
    categories: ['new-media'],
    example: '/southseattleemerald/news',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['southseattleemerald.org/news'],
            target: '/news',
        },
    ],
    name: 'Latest News',
    maintainers: ['yourname'],
    handler,
};

const baseUrl = 'https://southseattleemerald.org';

async function handler() {
    const response = await ofetch(`${baseUrl}/news`);
    const $ = cheerio.load(response);

    const items = $('[data-test-id="story-card"]')
        .toArray()
        .map((el) => {
            const $card = $(el);

            const $headline = $card.find('[data-test-id="headline"] a');
            const title = $headline.find('h3').text().trim();
            const link = $headline.attr('href');

            const author = $card.find('[data-test-id="author-name"]').text().trim();

            const pubDateRaw = $card.find('time.arr__timeago').attr('datetime');
            const pubDate = pubDateRaw ? new Date(pubDateRaw) : undefined;

            return {
                title,
                link,
                author,
                pubDate,
            };
        })
        .filter((item) => item.title && item.link);

    return {
        title: 'South Seattle Emerald — News',
        link: `${baseUrl}/news`,
        item: items,
    };
}
