import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: '课程体系', href: getPermalink('/#courses') },
    { text: '师资团队', href: getPermalink('/#teachers') },
    { text: '学员风采', href: getPermalink('/#stories') },
    { text: '政策资讯', href: getPermalink('/#insights') },
    { text: '关于我们', href: getPermalink('/#about') },
  ],
  actions: [{ text: '免费咨询', href: getPermalink('/#contact'), icon: 'tabler:arrow-up-right' }],
};

export const footerData = {
  links: [
    {
      title: '快速入口',
      links: [
        { text: '课程体系', href: getPermalink('/#courses') },
        { text: '师资团队', href: getPermalink('/#teachers') },
        { text: '学员风采', href: getPermalink('/#stories') },
      ],
    },
    {
      title: '咨询服务',
      links: [
        { text: '免费课程咨询', href: getPermalink('/#contact') },
        { text: '电话：0519-8888 2026', href: 'tel:051988882026' },
        { text: '江苏省常州市', href: getPermalink('/#about') },
      ],
    },
    {
      title: '内容中心',
      links: [
        { text: '政策资讯', href: getPermalink('/#insights') },
        { text: '备考干货', href: getPermalink('/#insights') },
        { text: '隐私政策', href: getPermalink('/privacy') },
      ],
    },
  ],
  secondaryLinks: [
    { text: '隐私政策', href: getPermalink('/privacy') },
    { text: '咨询说明', href: getPermalink('/#contact') },
  ],
  socialLinks: [],
  footNote: '澄方启航教育咨询服务 · 苏ICP备00000000号',
};
