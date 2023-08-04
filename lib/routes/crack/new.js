const got = require('got');

module.exports = async (ctx) => {
  try {
    const url = 'https://gamestatus.info/back/api/gameinfo/game/lastcrackedgames/';
    const response = await got(url, { responseType: 'json' });
    const data = response.body;

    const items = data.list_crack_games.slice(0, 10).map((game) => ({
      title: game.title,
      link: `https://gamestatus.info/${game.slug}/en`,
      pubDate: new Date(game.crack_date).toUTCString(),
      description: game.readable_status,
      imageUrl: game.short_image,
    }));

    const rss = `
      <rss version="2.0">
        <channel>
          <title>Cracked Games - GameStatus.info</title>
          <link>https://gamestatus.info/back/api/gameinfo/game/lastcrackedgames/</link>
          <description>Cracked games on GameStatus.info</description>
          <generator>RSSHub</generator>
          ${items.map((item) => `
            <item>
              <title><![CDATA[${item.title}]]></title>
              <link>${item.link}</link>
              <pubDate>${item.pubDate}</pubDate>
              <description><![CDATA[${item.description}]]></description>
              <enclosure url="${item.imageUrl}" type="image/jpeg" />
            </item>
          `).join('\n')}
        </channel>
      </rss>
    `;

    ctx.set('Content-Type', 'text/xml');
    ctx.body = rss;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = 'Error generating RSS feed.';
  }
};
