# H5 协议页（隐私协议 / 服务条款）

这是一个**纯静态 H5 工程**，用于手机端展示「隐私协议」和「服务条款」两份文档。

## 目录结构

- `privacy.html`：隐私协议
- `terms.html`：服务条款
- `assets/style.css`：统一样式（移动端适配、深浅色、目录、回到顶部）
- `assets/app.js`：增强脚本（自动生成目录、段落链接复制、复制页面链接、返回兜底）

## 本地预览

### 方式 A：用 Python 起静态服务（推荐）

在项目目录执行：

```bash
python3 -m http.server 5173
```

然后在手机/浏览器访问：

- `http://localhost:5173/privacy.html`
- `http://localhost:5173/terms.html`

### 方式 B：直接双击打开

也可以直接打开 `privacy.html` / `terms.html`，但部分浏览器对 `file://` 下的行为有限制，建议使用方式 A。

## 部署

把整个目录当作静态站点发布即可（例如 Nginx / CDN / OSS / GitHub Pages 等）。

## 需要你替换的内容

在 `privacy.html` / `terms.html` 中：

- `【你的公司/产品名称】`
- 生效日期、版本号
- 邮箱、地址
- 协议正文（按你业务实际情况补齐）

