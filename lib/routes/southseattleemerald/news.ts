import * as cheerio from 'cheerio';

import { type Route } from '@/types';
import ofetch from '@/utils/ofetch';

const baseUrl = 'https://southseattleemerald.org';

const sections = {
    latest: { path: '/collection/latest-stories', title: 'Latest Stories' },
    news: { path: '/news', title: 'News' },
    community: { path: '/community', title: 'Community' },
    voices: { path: '/voices', title: 'Voices' },
    'arts-culture': { path: '/arts-culture', title: 'Arts & Culture' },
};

export const route: Route = {
    path: '/:section?',
    categories: ['new-media'],
    example: '/southseattleemerald/latest',
    parameters: { section: 'Section, defaults to `latest`. Options: ' + Object.keys(sections).join(', ') },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [{ source: ['southseattleemerald.org/:section'], target: '/:section' }],
    name: 'Sections',
    maintainers: ['abirck'],
    handler,
};

async function handler(ctx) {
    const key = ctx.req.param('section') ?? 'latest';
    const section = sections[key] ?? sections.latest;

    const response = await ofetch(`${baseUrl}${section.path}`);
    const $ = cheerio.load(response);

    const items = $('[data-test-id="story-card"]')
        .toArray()
        .map((el) => {
            const $card = $(el);
            const $headline = $card.find('[data-test-id="headline"] a');
            const href = $headline.attr('href');
            const link = href ? new URL(href, baseUrl).href : undefined;
            const pubDateRaw = $card.find('time.arr__timeago').attr('datetime');

            return {
                title: $headline.find('h3').text().trim(),
                link,
                author: $card.find('[data-test-id="author-name"]').text().trim(),
                pubDate: pubDateRaw ? new Date(pubDateRaw) : undefined,
                category: link ? [new URL(link).pathname.split('/', 2)[1]] : [],
            };
        })
        .filter((item) => item.title && item.link);

    return {
        title: `South Seattle Emerald — ${section.title}`,
        link: `${baseUrl}${section.path}`,
        item: items,
    };
}
