## 1. 在\RSSHub\lib\routes新建文件夹和路由文件
## 2. 在lib\router.js 中发布
## 3. 使用npm run dev调试，留意端口





- [x] vgter完成，路由

  ```
  // 上游世界
  router.get('/vgter/new', lazyloadRouteHandler('./routes/vgter/new.js'));
  ```

  

- [x] crackgame 完成

- [x] 乐猪游戏 完成

  ```
  // 破解游戏  https://gamestatus.info
  router.get('/crack/new', lazyloadRouteHandler('./routes/crack/new.js'));
  // 乐猪游戏
  router.get('/lezhugame/new', lazyloadRouteHandler('./routes/lezhugame/new.js'));
  ```

- [ ] ~~gamer520 失败，有反爬，封IP~~

  
