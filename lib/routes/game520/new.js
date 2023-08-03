const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    try {
        const url = `https://www.gamer520.com`;

        // 设置请求间隔
        const interval = 1000; // 1秒

        // 添加随机延迟
        const delay = Math.floor(Math.random() * 2000) + 1000; // 随机延迟1秒到3秒

        // 模拟iPhone手机浏览器访问
        const userAgent =
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';

        const response = await got({
            method: 'get',
            url,
            headers: {
                'User-Agent': userAgent,
            },
        });



        const data = response.data;
        console.log(data);

        const $ = cheerio.load(data);

        // 获取文章列表
        const articles = $('.posts-wrapper .post');

        // 定义用于存储文章的数组
        const items = [];

        // 发起并发请求获取文章的详细内容
        await Promise.all(
            articles.map(async (index, element) => {
                const article = $(element);

                // 提取文章标题、链接和其他信息
                const title = article.find('.entry-title a').text();
                const link = article.find('.entry-title a').attr('href');
                const pubDate = new Date(article.find('.meta-date time').attr('datetime')).toUTCString();
                const category = article.find('.meta-category a').text();
                const price = article.find('.meta-price span').text();

                // 发起HTTP请求获取文章的详细内容
                const contentResponse = await got({
                    method: 'get',
                    url: link,
                    // 设置请求间隔和代理IP
                    agent,
                    retry: 0,
                    hooks: {
                        beforeRetry: [
                            (options, error, retryCount) => {
                                // 添加随机延迟
                                return new Promise((resolve) => {
                                    setTimeout(resolve, delay);
                                });
                            },
                        ],
                    },
                });

                const contentData = contentResponse.data;
                const content$ = cheerio.load(contentData);

                // 提取文章内容
                const description = content$('.entry-wrapper').html();

                // 构建文章数据对象
                const articleData = {
                    title: `<![CDATA[${title}]]>`,
                    link: `<link>${link}</link>`,
                    pubDate: `<pubDate>${pubDate}</pubDate>`,
                    description: `<![CDATA[${description}]]>`,
                    category: category,
                    price: price,
                };

                // 添加文章数据对象到数组中
                items.push(articleData);
            })
        );

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
${items
    .map(
        (item) => `
<item>
    <title>${item.title}</title>
    <description>${item.description}</description>
    <pubDate>${item.pubDate}</pubDate>
    <category>${item.category}</category>
    <price>${item.price}</price>
    <guid isPermaLink="false">${item.link}</guid>
    ${item.link}
</item>
`
    )
    .join('\n')}
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
