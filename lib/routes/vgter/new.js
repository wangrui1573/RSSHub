const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    try {
        const category = ctx.params.category;
        const url = `https://www.vgter.net`;
        const response = await got({
            method: 'get',
            url,
        });

        const data = response.data;
        const $ = cheerio.load(data);

        // 获取文章列表
        const articles = $('.post');

        // 定义用于存储文章的数组
        const items = [];

        // 发起并发请求获取文章的详细内容
        await Promise.all(articles.map(async (index, element) => {
            const article = $(element);

            // 提取文章标题、链接和其他信息
            const title = article.find('.post-title a').text();
            const link = article.find('.post-title a').attr('href');
            const pubDate = new Date(article.find('.post-date').attr('datetime')).toUTCString();
            const author = article.find('.post-author a').text();

            // 发起HTTP请求获取文章的详细内容
            const contentResponse = await got({
                method: 'get',
                url: link,
            });

            const contentData = contentResponse.data;
            const content$ = cheerio.load(contentData);

            // 提取文章内容
            const description = content$('.post-content').html();

            // 构建文章数据对象
            const articleData = {
                title: `<![CDATA[${title}]]>`,
                link: `<link>${link}</link>`,
                pubDate: `<pubDate>${pubDate}</pubDate>`,
                description: `<![CDATA[${description}]]>`,
            };

            // 添加文章数据对象到数组中
            items.push(articleData);
        }));

        // 组织RSS数据
        const rssData = `
<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title><![CDATA[ vgter.net - 上游世界 ]]></title>
<link>${url}</link>
<atom:link href="${url}" rel="self" type="application/rss+xml"/>
<description><![CDATA[ Made with love by RSSHub (https://github.com/DIYgod/RSSHub) ]]></description>
<generator>RSSHub</generator>
<webMaster>i@diygod.me (DIYgod)</webMaster>
<language>zh-cn</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<ttl>120</ttl>
${items.map((item) => `
<item>
    <title>${item.title}</title>
    <description>${item.description}</description>
    <pubDate>${item.pubDate}</pubDate>
    <guid isPermaLink="false">${item.link}</guid>
    ${item.link}
</item>
`).join('\n')}
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
