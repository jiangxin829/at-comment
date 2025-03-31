# at-comment

一个基于`div` `contentEditable`属性实现的@人员通知的React组件
处理了光标的插入问题、@user的文本区域不可选问题等等，可参考组件参数

## 组件参数
```javascript
interface ICommentInput {
  cRef?: React.RefObject<IRefMethod>, // 编辑器dom元素引用
  autoFocus?: boolean, //  是否自动聚焦，默认false，
  value?: string, //  初始化内容，默认空字符串，
  placeholder?: string, //  占位符，默认请输入内容，shift + 回车支持换行，
  customClassName?: string, //  自定义样式类名，
  atDisable?: boolean, //  是否禁用@功能，默认false，
  submitDisable?: boolean, //  是否禁用提交功能，默认false，
  submitLoading?: boolean, //  是否提交按钮处于加载状态，默认false，
  submitText?: string, //   提交按钮文案，默认发送，
  showCancel?: boolean, //  是否展示取消按钮，默认false，
  showSubmit?: boolean, //   是否展示提交按钮，默认true，
  extraCheckContent?: string | boolean, // 在提交栏左侧额外显示checkbox，为假时不展示
  queryMembers: (params: { searchKey: string }) => Promise<IUser[]>, //   获取用户列表的接口，参考类型接口IUser
  onSubmit?: (value?: string) => void, //    提交按钮点击事件，value为当前输入框内容，
  onCancel?: () => void, //    取消按钮点击事件，
  onExtraCheckChange?: (checked: boolean) => void, //   额外checkbox状态变化事件，checked为当前状态，
}

```
## 安装
npm i at-comment