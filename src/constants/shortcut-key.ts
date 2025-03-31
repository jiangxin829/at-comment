export const NormalEnterKeyCode = 13; // 输入法打字时回车不是13用以规避

export enum E_KEY_BOARD_MAIN_KEY_NAME {
  ENTER = 'Enter',
  TAB = 'Tab',
  BACKSPACE = 'Backspace',
  DELETE = 'Delete',
  SPACE= 'Space',
  ESCAPE = 'Escape',
  KEYF= 'KeyF',
  KEYX= 'KeyX',
  KeyV= 'KeyV',
  ARROWUP = 'ArrowUp',
  ARROWDOWN = 'ArrowDown',
  ARROWLEFT = 'ArrowLeft',
  ARROWRIGTH = 'ArrowRight',
  AT = '@',
}

export enum E_KEY_BOARD_SECOND_KEY {
  SHIFT = 'shiftKey',
  META = 'metaKey',
  CTRL = 'ctrlKey',
  ALT = 'altKey',
}

export const BreakLineShortcutKeyConfig = {
  mainKey: E_KEY_BOARD_MAIN_KEY_NAME.ENTER,
  secondKey: [E_KEY_BOARD_SECOND_KEY.SHIFT, E_KEY_BOARD_SECOND_KEY.META, E_KEY_BOARD_SECOND_KEY.CTRL, E_KEY_BOARD_SECOND_KEY.ALT],
  exceptShiftSecKey: [E_KEY_BOARD_SECOND_KEY.META, E_KEY_BOARD_SECOND_KEY.CTRL, E_KEY_BOARD_SECOND_KEY.ALT], // wangeditor默认支持shift+enter换行
};
