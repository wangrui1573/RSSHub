const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    try {
        const url = `https://www.lezhugame.com`;
        const response = await got({
            method: 'get',
            url,
            headers: {
                // 加入浏览器头信息
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
            },
        });

        const data = response.data;
        const $ = cheerio.load(data);

        // 获取文章列表，并限制只取前10篇文章
        const articles = $('.cat-posts-wrapper .post').slice(0, 10);

        // 定义用于存储文章的数组
        const items = [];

        // 并发请求获取文章的详细内容
        await Promise.all(
            articles.map(async (index, element) => {
                const article = $(element);

                // 提取文章标题、链接和其他信息
                const title = article.find('.entry-title a').text();
                const link = article.find('.entry-title a').attr('href');
                const pubDate = new Date(article.find('.entry-date').attr('datetime')).toUTCString();

                // 并发HTTP请求获取文章的详细内容
                const contentResponse = got({
                    method: 'get',
                    url: link,
                });

                // 构建文章数据对象
                const articleData = {
                    title: `<![CDATA[${title}]]>`,
                    link: `<link>${link}</link>`,
                    pubDate: `<pubDate>${pubDate}</pubDate>`,
                    description: '',
                };

                // 添加文章数据对象到数组中
                items.push(articleData);

                // 等待并发请求的结果
                const contentData = await contentResponse;
                const content$ = cheerio.load(contentData.data);

                // 提取文章内容
                articleData.description = `<![CDATA[${content$('.entry-content').html()}]]>`;
            })
        );

        // 组织RSS数据
        const rssData = `
<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title><![CDATA[ lezhugame.com - 乐趣游戏 ]]></title>
<link>${url}</link>
<atom:link href="${url}" rel="self" type="application/rss+xml"/>
<description><![CDATA[ Made with love by RSSHub (https://github.com/DIYgod/RSSHub) ]]></description>
<generator>RSSHub</generator>
<webMaster>i@diygod.me (DIYgod)</webMaster>
<language>zh-cn</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<ttl>120</ttl>
${items.map(
    (item) => `
<item>
    <title>${item.title}</title>
    <description>${item.description}</description>
    <pubDate>${item.pubDate}</pubDate>
    <guid isPermaLink="false">${item.link}</guid>
    ${item.link}
</item>
`
).join('\n')}
</channel>
</rss>
`;

        // 将RSS数据返回给客户端
        ctx.set('Content-Type', 'text/xml');
        ctx.body = rssData;
    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = 'Error generating RSS feed.';
    }
};
