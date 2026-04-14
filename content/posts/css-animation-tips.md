---
title: "CSS 动画实用技巧"
date: "2026-04-10"
category: "技术"
tags: ["CSS", "动画", "前端"]
summary: "一些实用的 CSS 动画技巧，让你的网页更有生命力。"
cover: ""
---

## 让页面动起来

好的动画不只是炫技，它应该服务于用户体验。以下是我常用的 CSS 动画技巧。

### 过渡而非突变

永远使用 `transition` 让状态变化更自然：

```css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### 关键帧动画

用 `@keyframes` 创建循环动画：

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.element {
  animation: float 3s ease-in-out infinite;
}
```

### 性能优化

- 只动画 `transform` 和 `opacity`，它们不会触发重排
- 使用 `will-change` 提示浏览器优化
- 移动端注意减少动画，尊重 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 微交互

小小的动画反馈能极大提升用户体验：

- 按钮按下的缩放效果
- 输入框聚焦的边框变化
- 列表项的交错入场
- 加载状态的呼吸灯效果

---

动画是网页的灵魂，但记住——**克制比堆砌更有力量**。✨
