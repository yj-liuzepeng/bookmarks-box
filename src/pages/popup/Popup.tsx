import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Popover, Avatar, Input, BackTop, Tag, SideSheet, Modal } from '@douyinfe/semi-ui';
import { IconFolderOpen, IconPlus, IconArrowUp, IconAlertTriangle } from '@douyinfe/semi-icons';
import Img from './MyImg'
import DetailModal from './DetailModal'
import EditModal from './EditModal'
import PinyinMatch from 'pinyin-match'

interface BookItem {
  id: string;
  parentId: string;
  index: number;
  title: string;
  url?: string;
  dateGroupModified: number;
  dateAdded: number;
  children: BookItem[]
}

const Popup: React.FC = () => {
  const { Meta } = Card;
  const [bookmark, setBookmark] = useState([] as BookItem[]);
  const [detailModalshow, setDetailModalshow] = useState(false)
  const [editlModalshow, setEditlModalshow] = useState(false)
  const [curEditData, setCurEditData] = useState({} as BookItem);
  const [searchStatus, setSearchStatus] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [curParent, setCurParent] = useState({} as BookItem)
  const [bsvisible, setBsvisible] = useState(false);
  const cardRef = useRef(null);
  const searchRef = useRef<HTMLInputElement>(null);
  let saveTreeData: BookItem[]


  useEffect(() => {
    chrome.bookmarks.getTree((res: any) => {
      saveTreeData = res[0].children[0].children
      setBookmark(saveTreeData)
    })

  }, []);
  // 右键点击卡片
  const clickRight = (item: BookItem) => {
    // 屏蔽浏览器默认右键事件
    document.oncontextmenu = function (e) {
      e = e || window.event;
      return false;
    };
    setCurEditData(item)
    bsChange()
  }
  // 底部弹出
  const bsChange = () => {
    setBsvisible(!bsvisible);
  };
  // 关闭新增
  const hClose = () => {
    setDetailModalshow(false)
  }
  // 新增书签
  const addWeb = () => {
    setDetailModalshow(true)
  }

  // 关闭修改
  const hCloseEdit = () => {
    setEditlModalshow(false)
  }
  // 点击修改
  const hOpenEdit = () => {
    bsChange()
    setEditlModalshow(true)
  }
  // 删除
  const hDelect = () => {
    bsChange()
    const modal = Modal.confirm({
      title: '提示',
      content: `确定删除当前${(curEditData.parentId == '1' && curEditData.children) ? '文件夹吗？' : '网站吗？'}`,
      icon: <IconAlertTriangle />,
      width: 300,
      style: { color: 'rgb(221 32 10)' },
      cancelButtonProps: {
        onClick:
          () => {
            modal.destroy()
          }

      },
      okButtonProps: {
        onClick:
          () => {
            // 一行一card
            if (showBack) {
              // 如果显示back（显示back，下面手动把seacr也变成了true)
              setSearchStatus(true)
              setShowBack(true)
              if (curEditData?.children && curEditData?.children.length > 0) {
                // 如果是文件夹，并且文件夹有内容
                chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                  chrome.bookmarks.getSubTree(curParent.id, (res) => {
                    setBookmark(res[0].children as BookItem[])
                  })
                })
              } else {
                chrome.bookmarks.remove(curEditData.id, (res: any) => {
                  chrome.bookmarks.getSubTree(curParent.id, (res) => {
                    setBookmark(res[0].children as BookItem[])
                  })
                })
              }
            } else if (!showBack && searchStatus) {
              // 不显示back
              setSearchStatus(true)
              setShowBack(false)
              if (curEditData?.children && curEditData?.children.length > 0) {
                // 如果是文件夹，并且文件夹有内容
                chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                  onSearch(searchRef.current?.value as string)
                })
              } else {
                chrome.bookmarks.remove(curEditData.id, (res: any) => {
                  onSearch(searchRef.current?.value as string)
                })
              }
            } else {
              // 首页 (一行两个card)
              if (curEditData?.children && curEditData?.children.length > 0) {
                // 如果是文件夹，并且文件夹有内容
                chrome.bookmarks.removeTree(curEditData.id, (res: any) => {
                  chrome.bookmarks.getTree((res: any) => {
                    saveTreeData = res[0].children[0].children
                    setBookmark(saveTreeData)
                  })
                })
              } else {
                // 删除空文件或网址
                chrome.bookmarks.remove(curEditData.id, (res: any) => {
                  chrome.bookmarks.getTree((res: any) => {
                    saveTreeData = res[0].children[0].children
                    setBookmark(saveTreeData)
                  })
                })
              }
            }
            modal.destroy()
          }
      },
    });
  }
  const getChangeView = () => {
    if (showBack) {
      // 如果显示back（显示back，下面手动把serach也变成了true)
      setSearchStatus(true)
      setShowBack(true)
      chrome.bookmarks.getSubTree(curParent.id, (res) => {
        setBookmark(res[0].children as BookItem[])
      })
    } else if (!showBack && searchStatus) {
      // 不显示back
      setSearchStatus(true)
      setShowBack(false)
      onSearch(searchRef.current?.value as string)
    } else {
      // 首页 (一行两个card)
      chrome.bookmarks.getTree((res: any) => {
        saveTreeData = res[0].children[0].children
        setBookmark(saveTreeData)
      })
    }
  }
  // 修改保存
  const hSave = (title: string | undefined, url: string | undefined) => {
    const obj = {
      title,
      url,
    }
    chrome.bookmarks.update(curEditData.id, obj, (res) => {
      getChangeView()
    })
    hCloseEdit()
  }
  // 取消修改
  const hCancel = () => {
    hCloseEdit()
  }
  // 新增保存
  const hSaveAdd = (parentId: string | undefined, title: string | undefined, url: string | undefined) => {
    if (!parentId) {
      parentId = curParent.id ? curParent.id : '1'
    }
    const obj = {
      parentId,
      title,
      url,
    }
    chrome.bookmarks.create(obj, (res) => {
      getChangeView()
    })
    hClose()
  }
  // 新增取消
  const hCancelAdd = () => {
    hClose()
  }
  // 模糊搜索函数
  const fuzzySearch = (list: BookItem[], search: string) => {
    let data: BookItem[] = [];
    if (list.length != 0 && search) {
      list.map(item => {
        if (PinyinMatch.match(item.title, search) != false) {
          data.push(item);
        }
      })
    }
    return data;
  }
  // 是否是url
  function isURL(str: string) {
    let pattern = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/
    return pattern.test(str);
  }
  // 树形数据拍平
  const getListData = (data: BookItem[]) => {
    if (!data.length) return false
    let needList: any = []
    dfs(data)
    return needList
    function dfs(d: any) {
      d.forEach((item: any) => {
        needList.push(item)
        if (item?.children && item.children.length) dfs(item.children)
      })
    }
  }
  // 搜索
  const onSearch = (value: string) => {
    setShowBack(false)
    if (value) {
      setSearchStatus(true)
      chrome.bookmarks.getTree((res: any) => {
        let dataList: any = fuzzySearch(getListData(res[0].children[0].children), value)
        setBookmark(dataList)
      })
    } else {
      setSearchStatus(false)
      chrome.bookmarks.getTree((res: any) => {
        saveTreeData = res[0].children[0].children
        setBookmark(saveTreeData)
      })
    }

  }
  // 点击卡片
  const hClickItem = (item: any) => {
    if (item.children) {
      setSearchStatus(true)
      setCurParent(item)
      setShowBack(true)
      chrome.bookmarks.getSubTree(item.id, (res) => {
        setBookmark(res[0].children as BookItem[])
      })
    } else {
      window.open(item.url);
    }

  }
  // 返回
  const hBack = () => {
    chrome.bookmarks.getSubTree(curParent.parentId, (res) => {
      setBookmark(res[0].children as BookItem[])
    })
    if (curParent.parentId == '1') {
      setSearchStatus(false)
      setShowBack(false)
      setCurParent({} as BookItem)
    } else {
      setSearchStatus(true)
      chrome.bookmarks.get(curParent.parentId, (res: any) => {
        setCurParent(res[0])
      })
    }
  }
  let Content
  if (!searchStatus) {
    Content = bookmark.length > 0 && bookmark.map((item: BookItem) => {
      return <Card
        key={item.id}
        shadows='hover'
        className="bookmark-item"
        bodyStyle={{
          padding: 0,
          fontWeight: 400
        }}

      >
        <div className="card-box" ref={cardRef} onContextMenu={() => {
          clickRight(item)
        }} onClick={() => {
          hClickItem(item)
        }}>
          {
            item?.children?.length >= 0 ? <Meta
              title={item.title}
              avatar={
                <Avatar
                  alt='文件夹'
                  size="default"
                  src='https://liuzepeng.com/folder.png'
                />
              }
            /> : <Meta
              title={item.title}
              avatar={
                <Avatar
                  alt='网站'
                  size="default"
                >
                  <Img src={isURL(item.url as string) ? ('http://www.google.com/s2/favicons?domain=' + item.url) : 'https://liuzepeng.com/web.png'} />
                </Avatar>
              }
            />
          }

        </div>

      </Card>
    })
  } else {
    Content = bookmark.length > 0 && bookmark.map((item: BookItem) => {
      return <Card
        key={item.id}
        shadows='hover'
        className="bookmark-item-search"
        bodyStyle={{
          padding: 0,
          fontWeight: 400
        }}

      >
        <div className="card-box" ref={cardRef} onContextMenu={() => {
          clickRight(item)
        }} onClick={() => {
          hClickItem(item)
        }}>
          {
            item?.children?.length >= 0 ? <Meta
              title={item.title}
              avatar={
                <Avatar
                  alt='文件夹'
                  size="default"
                  src='https://liuzepeng.com/folder.png'
                />
              }
            /> : <Meta
              title={item.title}
              avatar={
                <Avatar
                  alt='网站'
                  size="default"
                >
                  <Img src={isURL(item.url as string) ? ('http://www.google.com/s2/favicons?domain=' + item.url) : 'https://liuzepeng.com/web.png'} />
                </Avatar>
              }
            />
          }

        </div>
      </Card>
    })
  }
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    width: 30,
    borderRadius: '100%',
    backgroundColor: '#0077fa',
    color: '#fff',
    bottom: 100,
  };
  return (
    <>
      <div className="popup-header">
        <Input placeholder="请输入查找内容" ref={searchRef} showClear onChange={onSearch} style={{ width: 200 }} />
        <Popover
          position='bottom'
          showArrow
          content={
            <article style={{ padding: 6 }}>
              保存当前网站
            </article>
          }
          style={{
            backgroundColor: 'rgba(var(--semi-blue-4),1)',
            borderColor: 'rgba(var(--semi-blue-4),1)',
            color: 'var(--semi-color-white)',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          <Button type="primary" icon={<IconPlus />} className='header-button' onClick={addWeb} />
        </Popover>
      </div>
      {showBack && <div className="back">
        <img src="https://liuzepeng.com/back%20%282%29.png" onClick={hBack} alt="返回" />
        <Tag size="large" color={'blue'} className='back-tag' onClick={hBack}><IconFolderOpen /> {curParent.title} </Tag>
      </div>}
      <div className="popup-container">
        {Content}
        <BackTop visibilityHeight={100} style={style} target={() => document.querySelector('.popup-container')}><IconArrowUp /></BackTop>
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
      <SideSheet title="操作" visible={bsvisible} onCancel={bsChange} placement={'bottom'} className='bottom-sheet' height={124}>
        <div className="bottom-sheet-btns">
          <Button type="primary" size='large' onClick={hOpenEdit}>修改</Button>
          <Button type="warning" size='large' onClick={hDelect}>删除</Button>
        </div>
      </SideSheet>
    </>
  );
};

export default Popup;
