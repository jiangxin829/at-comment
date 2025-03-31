import React, {
  useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import {
  Button, Loading, MessagePlugin, Popup, Checkbox,
} from 'tdesign-react';
import cls from 'classnames';
import { BreakLineShortcutKeyConfig, E_KEY_BOARD_MAIN_KEY_NAME, NormalEnterKeyCode, E_KEY_BOARD_SECOND_KEY } from './constants/shortcut-key';
import { useDebounceEffect } from 'ahooks';
import { debounce } from 'lodash-es';

import s from './style.module.less';

const UserSelectPopupDimension = {
  width: 194,
  height: 170,
};

export const DEFAULT_LINE_HEIGHT = 20;

const getRootContainer = (attach: string) => document.querySelector(attach) || document.body;


const hasNextSibling = (node: Node | null | undefined) => {
  if (node?.nextElementSibling) {
    return true;
  }
  while (node?.nextSibling) {
    node = node.nextSibling;
    if (node?.textContent?.length > 0) {
      return true;
    }
  }
  return false;
};

// 快捷键换行for ContenteditableHtml
const shortcutKeyBreakLineForContenteditableHtml = (event: React.KeyboardEvent<HTMLDivElement | HTMLSpanElement>) => {
  if (event.key === BreakLineShortcutKeyConfig.mainKey && BreakLineShortcutKeyConfig.secondKey.some(key => !!event?.[key])) {
    // shift enter换行不做拦截，走默认逻辑
    if (event?.[E_KEY_BOARD_SECOND_KEY.SHIFT]) {
      return;
    }

    // 在当前光标位置插入换行符
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection?.getRangeAt(0) : null;
    if (!range || !selection) return;
    range.deleteContents();
    // 如判断是否为最后一个元素 如果是再加一个换行
    if (!hasNextSibling(range.endContainer) && range.startOffset === range.startContainer.textContent?.length) {
      const extraBreakLineNode = document.createTextNode('\n');
      range.insertNode(extraBreakLineNode);
    }
    const breakLineNode = document.createTextNode('\n');
    range.insertNode(breakLineNode);
    range.setStartAfter(breakLineNode);
    range.setEndAfter(breakLineNode);
    selection.removeAllRanges();
    selection.addRange(range);
    event?.preventDefault?.(); // 阻止默认行为
    return true;
  }
};

type IUser = { name: string, displayName: string };
interface IUserSeelctPopupContent {
  searchKey: string,
  queryMembers: (params: { searchKey: string }) => Promise<IUser[]>,
  onSelect: (user: IUser) => void,
  onHide: () => void,
}

const UserSelectPopupContent: React.FC<IUserSeelctPopupContent> = ({
  searchKey, queryMembers, onSelect, onHide,
}) => {
  const [curIndex, setCurIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayMembers, setDisplayMembers] = useState<IUser[]>([]);

  const usersRef = useRef<IUser[]>([]);
  const cRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usersRef.current = displayMembers || [];
    setCurIndex(0);
  }, [displayMembers]);

  const handleFetchMembers = (curKey) => {
    setLoading(true);
    queryMembers({ search: curKey }).then((users) => {
      setDisplayMembers(users);
    })
      .catch(e => MessagePlugin.error('获取人员信息失败'))
      .finally(() => setLoading(false));
  };

  useDebounceEffect(() => {
    handleFetchMembers(searchKey);
  }, [searchKey], { wait: 300 });

  const handleSelect = (user: IUser, index) => {
    onSelect(user);
    setCurIndex(index);
  };

  useEffect(() => {
    const keyDownHandler = (e: any) => {
      if (e.key === E_KEY_BOARD_MAIN_KEY_NAME.ESCAPE) {
        onHide();
        return;
      }
      if (e.key === E_KEY_BOARD_MAIN_KEY_NAME.ARROWDOWN) {
        setCurIndex(preIndex => Math.min(preIndex + 1, (usersRef.current?.length || 0) - 1));
        return;
      }
      if (e.key === E_KEY_BOARD_MAIN_KEY_NAME.ARROWUP) {
        setCurIndex(preIndex => Math.max(0, preIndex - 1));
        return;
      }
      if (e.key === E_KEY_BOARD_MAIN_KEY_NAME.ENTER) {
        setCurIndex((preIndex) => {
          if (usersRef.current?.[preIndex]) {
            handleSelect(usersRef.current?.[preIndex], preIndex);
          }
          return preIndex;
        });
      }
    };
    document.addEventListener('keyup', keyDownHandler);
    return () => {
      document.removeEventListener('keyup', keyDownHandler);
    };
  }, []);

  useEffect(() => {
    if (curIndex) {
      const curItemRef = cRef.current?.querySelector(`[data-selected-key='${curIndex}']`);
      if (curItemRef) {
        curItemRef?.scrollIntoView?.({ behavior: 'auto', block: 'nearest' });
      }
    }
  }, [curIndex]);

  return (
    <div
      ref={cRef}
      className={s.userSelectContainer}
      onMouseDown={e => e.preventDefault()}
    >
      {loading && <Loading size="small" className={s.rowCenterStart} />}
      {!loading && !displayMembers?.length && (<span className={cls(s.rowCenterStart, s.default)}>暂无人员信息</span>)}
      {!loading && displayMembers?.length > 0 && displayMembers?.map((user, index) => (
        <div
          key={user.name}
          data-selected-key={index} // 用于选择器定位元素
          className={cls(s.optionItem, curIndex === index && s.selected)}
          onClick={() => handleSelect(user, index)}
        >
          {/* <UserAvatar user={user.name} size="small" /> */}
          <span className={s.text}>{user.displayName}</span>
        </div>
      ))}
    </div>
  );
};

export interface IRefMethod {
  textRef: HTMLDivElement | null,
}
interface ICommentInput {
  cRef?: React.RefObject<IRefMethod>,
  autoFocus?: boolean,
  value?: string,
  placeholder?: string,
  customClassName?: string,
  atDisable?: boolean,
  submitDisable?: boolean,
  submitLoading?: boolean,
  submitText?: string,
  showCancel?: boolean,
  showSubmit?: boolean,
  extraCheckContent?: string | boolean, // 在提交栏左侧额外显示checkbox，为假时不展示
  onSubmit: (value?: string) => void,
  onCancel?: () => void,
  onExtraCheckChange?: (checked: boolean) => void,
}

const CommentInput: React.FC<ICommentInput> = ({
  cRef,
  autoFocus,
  value = '',
  placeholder = '请输入内容，shift + 回车支持换行',
  customClassName,
  atDisable = false,
  submitDisable,
  submitLoading,
  submitText = '发送',
  showCancel = false,
  extraCheckContent = false,
  showSubmit = true,
  onSubmit,
  onCancel = () => null,
  onExtraCheckChange = () => null,
}) => {
  const [userSelectVisible, setUserSelectVisible] = useState(false);
  const [userInputKey, setUserInputKey] = useState('');
  const [popupOverlayStyle, setPopupOverlayStyle] = useState<React.CSSProperties>({});
  const [placeholderVisible, setPlaceholderVisible] = useState(!value);

  const textRef = useRef<HTMLDivElement>(null);
  // 记录当前是否处于@功能中
  const isAtInputing = useRef(false);

  useImperativeHandle(cRef, () => ({
    textRef: textRef.current,
  }));

  // 监听textRef内容变化
  useEffect(() => {
    if (textRef.current) {
      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            const text = mutation.target.textContent || '';
            setPlaceholderVisible(!text.length);
          }
        });
      });
      observer.observe(textRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        textRef.current?.focus();
      }, 10);
    }
  }, [autoFocus]);

  // 获取光标位置
  const getCursorIndex = () => {
    const selection = window.getSelection();
    return selection?.focusOffset;
  };

  // 获取当前选中区域的文本节点
  const getRangeTextNode = () => {
    const selection = window.getSelection();
    return selection?.focusNode;
  };

  // 是否展示 @
  const checkShowAt = () => {
    const node = getRangeTextNode();
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const content = node.textContent || '';
    const regx = /@([^@\s]*)$/;
    const match = regx.exec(content.slice(0, getCursorIndex()));
    return match && match.length === 2;
  };

  // 获取 @ 输入的用户key
  const getAtUserInputKey = () => {
    const content = getRangeTextNode()?.textContent || '';
    const regx = /@([^@\s]*)$/;
    const match = regx.exec(content.slice(0, getCursorIndex()));
    if (match && match.length === 2) {
      return match[1];
    }
    return undefined;
  };

  const createAtButton = (user: IUser) => {
    const btn = document.createElement('span');
    btn.style.display = 'inline-block';
    btn.style.color = '#0052D9';
    btn.style.padding = '0 4px';
    btn.dataset.atUserName = user.name;
    btn.contentEditable = 'false';
    btn.textContent = `@${user.displayName}`;
    return btn;
  };

  const handleReplaceNodeAndCursor = (node, parentNode, { previousTextNode, curNode, nextTextNode }) => {
    const nextNode = node?.nextSibling;
    parentNode.removeChild(node);
    if (nextNode) {
      parentNode.insertBefore(previousTextNode, nextNode);
      parentNode.insertBefore(curNode, nextNode);
      parentNode.insertBefore(nextTextNode, nextNode);
    } else {
      parentNode.appendChild(previousTextNode);
      parentNode.appendChild(curNode);
      parentNode.appendChild(nextTextNode);
    }
    const range = new Range();
    range.setStart(nextTextNode, 0);
    range.setEnd(nextTextNode, 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const handleReplaceAtUser = (user: IUser) => {
    const node = getRangeTextNode();
    const parentNode = node?.parentNode;
    if (node && parentNode) {
      const content = node?.textContent || '';
      const endIndex = getCursorIndex();
      const preSlice = (content.slice(0, endIndex) || '').replace(/@([^@\s]*)$/, '');
      const restSlice = content.slice(endIndex);
      // 如果前面没有内容，插入的contentEditable为false的元素无法删除，此时需要填充一个空span
      const previousTextNode = preSlice ? new Text(preSlice) : document.createElement('span');
      const nextTextNode = new Text(restSlice);
      const atButton = createAtButton(user);
      handleReplaceNodeAndCursor(node, parentNode, { previousTextNode, curNode: atButton, nextTextNode });
    }
  };

  const handleEditFinish = () => {
    onSubmit(textRef.current?.innerHTML);
  };

  const handleChangePosition = debounce(() => {
    // 不随输入内容range变化再次更新position
    if (userSelectVisible && popupOverlayStyle.transform) return;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const { x: cursorX = 0, y: cursorY = 0 } = range?.getClientRects()[0] || {};
    const { x: inputBoxX = 0, y: inputBoxY = 0, width: inputBoxWidth = 0 } = textRef.current?.getBoundingClientRect() || {};
    const windowRect = document.body?.getBoundingClientRect?.() || {};
    let curXGap = (cursorX - inputBoxX) - ((inputBoxWidth / 2) - (UserSelectPopupDimension.width / 2)); // 文本X偏移量 - 默认X偏移量
    let curYGap = (cursorY - inputBoxY) - 1 + DEFAULT_LINE_HEIGHT * 1.5; // 文本Y偏移量 - 默认Y偏移量(输入框高度) + 行高
    if ((cursorX + UserSelectPopupDimension.width - 10) > windowRect.right) {
      curXGap -= UserSelectPopupDimension.width; // 左移一个身位
    }
    // 如果Y方向被遮挡，默认设置的placement bottom会失效，以top计算
    const popupHasPlacementTop = (inputBoxY + UserSelectPopupDimension.height + 2) > windowRect.bottom; // +2是人肉算出，精确到0.5px
    if (popupHasPlacementTop) {
      curYGap = (cursorY - inputBoxY); // 文本Y偏移量
    }
    // 未触发popup的placement top，此时如果超出屏幕
    if (!popupHasPlacementTop && (cursorY + UserSelectPopupDimension.height + 8 + DEFAULT_LINE_HEIGHT * 1.5) > windowRect.bottom) { // + 8是底部外边距
      curYGap = (cursorY - inputBoxY) - (UserSelectPopupDimension.height + 8) - DEFAULT_LINE_HEIGHT / 2; // 文本Y偏移量 - 默认Y偏移量(人员框高度) - 行高
    }
    setPopupOverlayStyle({
      transform: `translate3d(${curXGap}px, ${curYGap}px, 0px)`,
    });
  }, 600);

  const handleClosePopup = () => {
    setUserSelectVisible(false);
    isAtInputing.current = false;
    // 避免关闭时闪烁
    setTimeout(() => {
      setPopupOverlayStyle({});
    }, 400);
  };

  const handkeKeyUp = () => {
    // at能力开启后才会检测@符号
    if (!atDisable && isAtInputing.current && checkShowAt()) {
      handleChangePosition();
      const user = getAtUserInputKey();
      setUserInputKey(user || '');
      setUserSelectVisible(true);
    } else {
      handleClosePopup();
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    // 选择人员弹窗显示 阻止部分涉及的按键默认行为
    if (userSelectVisible) {
      if ([E_KEY_BOARD_MAIN_KEY_NAME.ARROWUP, E_KEY_BOARD_MAIN_KEY_NAME.ARROWDOWN, E_KEY_BOARD_MAIN_KEY_NAME.ENTER, E_KEY_BOARD_MAIN_KEY_NAME.ESCAPE].includes(e?.key)) {
        e.preventDefault();
        return;
      }
    }

    // enter即保存
    if (e?.key === E_KEY_BOARD_MAIN_KEY_NAME.ENTER) {
      // 额外判断keycode避免中文输入法下的enter
      if (e?.keyCode === NormalEnterKeyCode && !BreakLineShortcutKeyConfig.secondKey.some(key => !!e?.[key])) {
        e.preventDefault(); // 阻止默认行为
        e?.target?.blur();
        handleEditFinish();
        return;
      }
      // 自定义换行快捷键
      shortcutKeyBreakLineForContenteditableHtml(e);
    }

    // @即记录状态
    if (e?.key === E_KEY_BOARD_MAIN_KEY_NAME.AT) {
      isAtInputing.current = true;
    }
  };

  // 拦截粘贴事件，仅允许输入纯文本
  const handlePasteCapture = (e) => {
    e.preventDefault();
    // 清空选中内容
    window.getSelection()?.getRangeAt?.(0)
      ?.deleteContents?.();
    const text = e.clipboardData?.getData?.('text/plain');
    const node = getRangeTextNode();
    const parentNode = node?.parentNode;
    // 全选时 当前node就是输入框，特殊处理
    if (node && node === textRef.current) {
      const nextTextNode = new Text(text);
      node.appendChild(nextTextNode);
      const range = new Range();
      range.setStart(nextTextNode, text?.length);
      range.setEnd(nextTextNode, text?.length);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    if (node && parentNode) {
      const content = node?.textContent || '';
      const endIndex = getCursorIndex();
      const preSlice = content.slice(0, endIndex);
      const restSlice = content.slice(endIndex);
      const previousTextNode = new Text(preSlice);
      const curNode = new Text(text);
      const nextTextNode = new Text(restSlice);
      handleReplaceNodeAndCursor(node, parentNode, { previousTextNode, curNode, nextTextNode });
    }
  };

  const handleSelectUser = (user: IUser) => {
    handleReplaceAtUser(user);
    // 异步关闭弹窗
    setTimeout(() => {
      handleClosePopup();
    }, 100);
  };

  return (
    <div className={cls(s.commentInput, customClassName)}>
      <div className={cls(s.placeholderBackground, placeholderVisible && s.visible)} dangerouslySetInnerHTML={{ __html: placeholder }} />
      <div
        className={cls(s.textarea, (!showCancel && !showSubmit) && s.autoHeight)}
        ref={textRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onKeyUp={handkeKeyUp}
        onPasteCapture={handlePasteCapture}
        onKeyDown={handleKeyDown}
        onBlur={handleClosePopup}
      />
      {/* 输入框底部按钮 */}
      <div className={s.btnGroup}>
        {extraCheckContent && (
          <Checkbox onChange={onExtraCheckChange} className={s.text}>{extraCheckContent}</Checkbox>
        )}
        <div style={{ flex: 1 }} />
        {!!showCancel && (
          <Button theme="default" onClick={onCancel}>取消</Button>
        )}
        {!!showSubmit && (
          <Button
            loading={submitLoading}
            disabled={submitDisable}
            onClick={handleEditFinish}
          >
            {submitText}
          </Button>
        )}
      </div>
      <Popup
        visible={userSelectVisible && !!popupOverlayStyle.transform}
        attach={getRootContainer}
        placement="bottom"
        destroyOnClose
        overlayInnerClassName={s.popupContainer}
        overlayInnerStyle={{
          ...popupOverlayStyle,
          width: UserSelectPopupDimension.width,
          height: UserSelectPopupDimension.height,
        }}
        content={(
          <UserSelectPopupContent
            searchKey={userInputKey}
            onSelect={handleSelectUser}
            onHide={handleClosePopup}
          />
        )}
      >
        <div className={s.popupRoot} />
      </Popup>

    </div>
  );
};

export default CommentInput;
