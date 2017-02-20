## v1.0.2

released this on 2017.2.20

### New Features

#### privateRepo

通过 `privateRepo` 属性来设置个人的组件目录，此时会同时加载两个组件库的组件，若存在同名，privateRepo目录中组件会覆盖公共组件库

```javascript
//easepack.config.js中
easepack.set(privateRepo, 'E:/workplace/ep_components');
```

或命令

```bash
easepack build --private-repo E:/workplace/ep_components
```

### Improvements

- auto banner：打包后文件会自动添加banner（添加了开发者名称）

```javascript
//如 开发者，开发目录
/*! zhengquanbin,htdocs\activity\mobileActivity */
```