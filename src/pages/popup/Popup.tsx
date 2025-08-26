import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Popover,
  Avatar,
  Input,
  BackTop,
  Tag,
  SideSheet,
  Modal,
} from "@douyinfe/semi-ui";
import {
  IconFolderOpen,
  IconPlus,
  IconArrowUp,
  IconAlertTriangle,
} from "@douyinfe/semi-icons";
import Img from "./MyImg";
import DetailModal from "./DetailModal";
import EditModal from "./EditModal";
import PinyinMatch from "pinyin-match";

import folder from "../../assets/img/folder.png";
import web from "../../assets/img/web.png";
import back from "../../assets/img/back1.png";

interface BookItem {
  id: string;
  parentId: string;
  index: number;
  title: string;
  url?: string;
  dateGroupModified: number;
  dateAdded: number;
  children: BookItem[];
}

const Popup: React.FC = () => {
  const { Meta } = Card;
  const [bookmark, setBookmark] = useState([] as BookItem[]);
  const [detailModalshow, setDetailModalshow] = useState(false);
  const [editlModalshow, setEditlModalshow] = useState(false);
  const [curEditData, setCurEditData] = useState({} as BookItem);
  const [searchStatus, setSearchStatus] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [curParent, setCurParent] = useState({} as BookItem);
  const [patchAry, setPatchAry] = useState([] as BookItem[]);
  const [bsvisible, setBsvisible] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const cardRef = useRef(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // 当前键盘选中的索引
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // 列表容器引用，用于滚动到可见区域
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 返回时用于定位到进入前所在的目录项
  const selectedIndexStackRef = useRef<number[]>([]);
  // 下一次数据集变更后需要应用的选中索引（否则默认回到0）
  const pendingSelectIndexRef = useRef<number | null>(null);
  let saveTreeData: BookItem[];

  useEffect(() => {
    searchRef.current?.focus();
    chrome.bookmarks.getTree((res: any) => {
      saveTreeData = res[0].children[0].children;
      setBookmark(saveTreeData);
    });
  }, []);

  // 当数据集变化时，重置或修正选中项
  useEffect(() => {
    if (!bookmark) return;
    if (pendingSelectIndexRef.current !== null) {
      const next = Math.max(0, Math.min(bookmark.length - 1, pendingSelectIndexRef.current));
      setSelectedIndex(next);
      pendingSelectIndexRef.current = null;
    } else {
      // 默认回到第一项
      setSelectedIndex(0);
    }
  }, [bookmark]);

  // 选中项变化时，滚动到可见区域
  useEffect(() => {
    const listItems = containerRef.current?.querySelectorAll(
      ".bookmark-item, .bookmark-item-search"
    );
    if (!listItems || !listItems.length) return;
    const el = listItems[selectedIndex] as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [selectedIndex]);

  // 键盘导航：箭头移动选中项；回车打开/进入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      // 目标元素（某些组件可能将事件绑定在包装元素上）
      const target = (e.target as HTMLElement) || (document.activeElement as HTMLElement);
      const activeEl = (document.activeElement as HTMLElement) || target;
      const isEditable =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      // 处理回车打开/进入
      if (key === "Enter") {
        if (bookmark.length && selectedIndex >= 0 && selectedIndex < bookmark.length) {
          e.preventDefault();
          hClickItem(bookmark[selectedIndex]);
        }
        return;
      }

      // 当显示返回按钮时，优先处理左方向键为“返回上级”的逻辑
      if (key === "ArrowLeft" && showBack) {
        // 如果在输入框内：当光标在最左侧（或无内容）时才触发返回，否则保持默认光标移动
        if (isEditable) {
          const inputEl = activeEl as HTMLInputElement;
          const val = (inputEl?.value ?? "");
          const caret = typeof inputEl?.selectionStart === "number" ? (inputEl.selectionStart as number) : 0;
          if (val.length > 0 && caret > 0) {
            // 有内容且光标不在最左，保留默认行为
            return;
          }
        }
        // 按住键盘会产生重复的 keydown 事件，避免一次按下返回多级
        if (e.repeat) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        hBack();
        return;
      }

      // 在输入框中：
      // - 右：若输入为空，则用于列表导航；若有内容，保留默认光标移动
      // - 上/下：用于列表导航
      if (isEditable) {
        if (key === "ArrowRight") {
          const inputEl = activeEl as HTMLInputElement;
          if (inputEl && (inputEl.value ?? "").trim() !== "") {
            return; // 有输入内容，保留默认行为
          }
          // 否则继续向下执行为列表导航
        }
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        if (!bookmark.length) return;
        e.preventDefault();
        const cols = searchStatus ? 1 : 2; // 首页两列，搜索/子目录一列
        setSelectedIndex((prev) => {
          let next = prev ?? 0;
          if (key === "ArrowUp") next = Math.max(0, next - cols);
          if (key === "ArrowDown") next = Math.min(bookmark.length - 1, next + cols);
          if (key === "ArrowLeft") next = Math.max(0, next - 1);
          if (key === "ArrowRight") next = Math.min(bookmark.length - 1, next + 1);
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bookmark, searchStatus, selectedIndex, showBack]);

  // 右键点击卡片
  const clickRight = (item: BookItem) => {
    // 屏蔽浏览器默认右键事件
    document.oncontextmenu = function (e) {
      e = e || (window as any).event;
      return false;
    };
    setCurEditData(item);
    bsChange();
  };
  // 底部弹出
  const bsChange = () => {
    setBsvisible(!bsvisible);
  };

  // 关闭新增
  const hClose = () => {
    setDetailModalshow(false);
  };
  // 新增书签
  const addWeb = () => {
    setDetailModalshow(true);
  };

  // 修改保存
  const hSave = (title: string | undefined, url: string | undefined) => {
    const obj = {
      title,
      url,
    };
    chrome.bookmarks.update(curEditData.id, obj, (res) => {
      getChangeView();
    });
    hCancel();
  };
  // 修改取消
  const hCancel = () => {
    setCurEditData({} as BookItem);
    setEditlModalshow(false);
  };
  const hOpenEdit = () => {
    bsChange();
    setEditlModalshow(true);
  };

  // 删除
  const hDelect = () => {
    bsChange();
    const modal = Modal.confirm({
      title: "提示",
      content: `确定删除当前${
        curEditData.parentId == "1" && curEditData.children
          ? "文件夹吗？"
          : "网站吗？"
      }`,
      icon: <IconAlertTriangle />,
      width: 300,
      style: { color: "rgb(221 32 10)" },
      cancelButtonProps: {
        onClick: () => {
          modal.destroy();
        },
      },
      okButtonProps: {
        onClick: () => {
          // 一行一card
          if (showBack) {
            // 如果显示back（显示back，下面手动把seacr也变成了true)
            setSearchStatus(true);
            setShowBack(true);
            if (curEditData?.children && curEditData?.children.length > 0) {
              // 如果是文件夹，并且文件夹有内容
              chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                chrome.bookmarks.getSubTree(curParent.id, (res) => {
                  setBookmark(res[0].children as BookItem[]);
                });
              });
            } else {
              chrome.bookmarks.remove(curEditData.id, (res: any) => {
                chrome.bookmarks.getSubTree(curParent.id, (res) => {
                  setBookmark(res[0].children as BookItem[]);
                });
              });
            }
          } else if (!showBack && searchStatus) {
            // 不显示back
            setSearchStatus(true);
            setShowBack(false);
            if (curEditData?.children && curEditData?.children.length > 0) {
              // 如果是文件夹，并且文件夹有内容
              chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                onSearch(searchRef.current?.value as string);
              });
            } else {
              chrome.bookmarks.remove(curEditData.id, (res: any) => {
                onSearch(searchRef.current?.value as string);
              });
            }
          } else {
            // 首页 (一行两个card)
            if (curEditData?.children && curEditData?.children.length > 0) {
              // 如果是文件夹，并且文件夹有内容
              chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                chrome.bookmarks.getTree((res: any) => {
                  saveTreeData = res[0].children[0].children;
                  setBookmark(saveTreeData);
                });
              });
            } else {
              // 删除空文件或网址
              chrome.bookmarks.remove(curEditData.id, (res: any) => {
                chrome.bookmarks.getTree((res: any) => {
                  saveTreeData = res[0].children[0].children;
                  setBookmark(saveTreeData);
                });
              });
            }
          }
          modal.destroy();
        },
      },
    });
  };
  const getChangeView = () => {
    if (showBack) {
      // 如果显示back（显示back，下面手动把serach也变成了true)
      setSearchStatus(true);
      setShowBack(true);
      chrome.bookmarks.getSubTree(curParent.id, (res) => {
        setBookmark(res[0].children as BookItem[]);
      });
    } else if (!showBack && searchStatus) {
      // 不显示back
      setSearchStatus(true);
      setShowBack(false);
      onSearch(searchRef.current?.value as string);
    } else {
      // 首页 (一行两个card)
      chrome.bookmarks.getTree((res: any) => {
        saveTreeData = res[0].children[0].children;
        setBookmark(saveTreeData);
      });
    }
  };

  // 新增保存
  const hSaveAdd = (
    parentId: string | undefined,
    title: string | undefined,
    url: string | undefined
  ) => {
    if (!parentId) {
      parentId = curParent.id ? curParent.id : "1";
    }
    const obj = {
      parentId,
      title,
      url,
    };
    chrome.bookmarks.create(obj, (res) => {
      getChangeView();
    });
    hClose();
  };

  // 新增取消
  const hCancelAdd = () => {
    hClose();
  };
  // 模糊搜索函数
  const fuzzySearch = (list: BookItem[], search: string) => {
    let data: BookItem[] = [];
    if (list.length != 0 && search) {
      list.map((item) => {
        if (PinyinMatch.match(item.title, search) != false) {
          data.push(item);
        }
      });
    }
    return data;
  };
  // 是否是url
  function isURL(str: string) {
    let pattern = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    return pattern.test(str);
  }
  // 树形数据拍平
  const getListData = (data: BookItem[]) => {
    if (!data.length) return false as any;
    let needList: any = [];
    dfs(data);
    return needList;
    function dfs(d: any) {
      d.forEach((item: any) => {
        needList.push(item);
        if (item?.children && item.children.length) dfs(item.children);
      });
    }
  };
  // 搜索
  const onSearch = (value: string) => {
    setIsSearch(true);
    setShowBack(false);
    setPatchAry([] as BookItem[]);
    selectedIndexStackRef.current = [];
    if (value) {
      setSearchStatus(true);
      chrome.bookmarks.getTree((res: any) => {
        let dataList: any = fuzzySearch(
          getListData(res[0].children[0].children),
          value
        );
        pendingSelectIndexRef.current = 0;
        setBookmark(dataList);
      });
    } else {
      setSearchStatus(false);
      chrome.bookmarks.getTree((res: any) => {
        saveTreeData = res[0].children[0].children;
        pendingSelectIndexRef.current = 0;
        setBookmark(saveTreeData);
      });
    }
  };
  // 清除搜索
  const onClear = () => {
    setPatchAry([] as BookItem[]);
    setIsSearch(false);
  };
  // 点击卡片
  const hClickItem = (item: any) => {
    if (item.children) {
      // 进入目录前，记录当前所在的索引，返回时用于定位
      selectedIndexStackRef.current.push(selectedIndex);
      // 进入新目录后，选中第一项
      pendingSelectIndexRef.current = 0;

      setSearchStatus(true);
      setCurParent(item);
      setPatchAry([...patchAry.concat(item)]);
      setShowBack(true);
      chrome.bookmarks.getSubTree(item.id, (res) => {
        setBookmark(res[0].children as BookItem[]);
      });
    } else {
      window.open(item.url);
    }
  };
  // 返回
  const hBack = () => {
    if(isSearch) {
      onSearch(searchRef.current?.value as string);
      setShowBack(false);
      setIsSearch(true);
      setCurParent({} as BookItem);
      setPatchAry([] as BookItem[]);
      selectedIndexStackRef.current = [];
      pendingSelectIndexRef.current = 0;
      return
    }
    
    if (curParent.parentId == "1") {
      // 回到首页
      const prevIndex = selectedIndexStackRef.current.pop() ?? 0;
      pendingSelectIndexRef.current = prevIndex;
      setSearchStatus(false);
      setShowBack(false);
      setCurParent({} as BookItem);
      setPatchAry([] as BookItem[]);
      chrome.bookmarks.getTree((res: any) => {
        const saveTreeData = res[0].children[0].children;
        setBookmark(saveTreeData);
      });
    } else {
      // 回到上一级目录
      const newPatchAry = [...patchAry];
      newPatchAry.pop();
      setPatchAry(newPatchAry);
      const prevIndex = selectedIndexStackRef.current.pop() ?? 0;
      pendingSelectIndexRef.current = prevIndex;
      
      chrome.bookmarks.get(curParent.parentId, (res: any) => {
        setCurParent(res[0]);
        chrome.bookmarks.getSubTree(curParent.parentId, (subRes) => {
          setBookmark(subRes[0].children as BookItem[]);
        });
      });
    }
  };
  let Content;
  if (!searchStatus) {
    Content =
      bookmark.length > 0 &&
      bookmark.map((item: BookItem, idx: number) => {
        return (
          <Card
            key={item.id}
            shadows="hover"
            className={`bookmark-item ${selectedIndex === idx ? "selected" : ""}`}
            bodyStyle={{
              padding: 0,
              fontWeight: 400,
            }}
          >
            <div
              className="card-box"
              ref={cardRef}
              onContextMenu={() => {
                clickRight(item);
              }}
              onClick={() => {
                hClickItem(item);
              }}
            >
              {item?.children?.length >= 0 ? (
                <Meta
                  title={item.title}
                  avatar={<Avatar alt="文件夹" size="default" src={folder} />}
                />
              ) : (
                <Meta
                  title={item.title}
                  avatar={
                    <Avatar alt="网站" size="default">
                      <Img
                        src={
                          isURL(item.url as string)
                            ? "http://www.google.com/s2/favicons?domain=" +
                              item.url
                            : web
                        }
                      />
                    </Avatar>
                  }
                />
              )}
            </div>
          </Card>
        );
      });
  } else {
    Content =
      bookmark.length > 0 &&
      bookmark.map((item: BookItem, idx: number) => {
        return (
          <Card
            key={item.id}
            shadows="hover"
            className={`bookmark-item-search ${selectedIndex === idx ? "selected" : ""}`}
            bodyStyle={{
              padding: 0,
              fontWeight: 400,
            }}
          >
            <div
              className="card-box"
              ref={cardRef}
              onContextMenu={() => {
                clickRight(item);
              }}
              onClick={() => {
                hClickItem(item);
              }}
            >
              {item?.children?.length >= 0 ? (
                <Meta
                  title={item.title}
                  avatar={<Avatar alt="文件夹" size="default" src={folder} />}
                />
              ) : (
                <Meta
                  title={item.title}
                  avatar={
                    <Avatar alt="网站" size="default">
                      <Img
                        src={
                          isURL(item.url as string)
                            ? "http://www.google.com/s2/favicons?domain=" +
                              item.url
                            : web
                        }
                      />
                    </Avatar>
                  }
                />
              )}
            </div>
          </Card>
        );
      });
  }
  const style = {
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: 30,
    borderRadius: "100%",
    backgroundColor: "#0077fa",
    color: "#fff",
    bottom: 100,
  };
  return (
    <>
      <div className="popup-header">
        <Input
          placeholder="请输入查找内容"
          ref={searchRef}
          showClear
          onChange={onSearch}
          onClear={onClear}
          style={{ width: 200 }}
        />
        <Popover
          position="bottom"
          showArrow
          content={<article style={{ padding: 6 }}>保存当前网站</article>}
          style={{
            backgroundColor: "rgba(var(--semi-blue-4),1)",
            borderColor: "rgba(var(--semi-blue-4),1)",
            color: "var(--semi-color-white)",
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          <Button
            type="primary"
            icon={<IconPlus />}
            className="header-button"
            onClick={addWeb}
          />
        </Popover>
      </div>
      {showBack && patchAry.length > 0 && (
        <div className="back">
          <img src={back} onClick={hBack} alt="返回" />
          <Tag size="large" color={"blue"} className="back-tag">
            <IconFolderOpen />
            {patchAry.length > 1 ? (
              <span>
                {patchAry.map((item, index) =>
                  index === 0
                    ? item.title.length > 8
                      ? `${item.title.slice(0, 8)}...`
                      : item.title
                    : ` / ${item.title.length > 8 ? item.title.slice(0, 8) + "..." : item.title}`
                )}
              </span>
            ) : (
              <span>
                {(patchAry[0]?.title?.length ?? 0) > 18
                  ? `${(patchAry[0]?.title ?? "").slice(0, 18)}...`
                  : (patchAry[0]?.title ?? "")}
              </span>
            )}
          </Tag>
        </div>
      )}
      <div className="popup-container" ref={containerRef}>
        {Content}
        <BackTop
          visibilityHeight={100}
          style={style}
          target={() => document.querySelector(".popup-container") as HTMLElement}
        >
          <IconArrowUp />
        </BackTop>
        <DetailModal
          show={detailModalshow}
          data={curParent}
          save={hSaveAdd}
          cancel={hCancelAdd}
        ></DetailModal>
        <EditModal
          show={editlModalshow}
          data={curEditData}
          save={hSave}
          cancel={hCancel}
        ></EditModal>
      </div>
      <SideSheet
        title="操作"
        visible={bsvisible}
        onCancel={bsChange}
        placement={"bottom"}
        className="bottom-sheet"
        height={124}
      >
        <div className="bottom-sheet-btns">
          <Button type="primary" size="large" onClick={hOpenEdit}>
            修改
          </Button>
          <Button type="warning" size="large" onClick={hDelect}>
            删除
          </Button>
        </div>
      </SideSheet>
    </>
  );
};

export default Popup;
